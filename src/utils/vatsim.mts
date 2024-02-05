// This giant mess of a giant mess takes care of processing a received list
// of vatsim flight plans and merging it with the current list of vatsim flight plans.
//
// It properly carries forward any state on the existing flight sim plans, and properly
// reports whether any new or modified plans came in.
import {
  ImportState,
  IVatsimFlightPlan,
} from "../interfaces/IVatsimFlightPlan.mjs";
import _ from "lodash";
import vatsimEDCT from "./vatsimEDCT.mts";

type ProcessFlightPlansResult = {
  flightPlans: vatsimEDCT[];
  hasNew: boolean;
  hasUpdates: boolean;
};

export function getColorByStatus(status: ImportState | undefined): string {
  switch (status) {
    case ImportState.NEW:
      return "warning.main";
    case ImportState.UPDATED:
      return "error.main";
    default:
      return "text.primary";
  }
}

// Takes a new plan and an existing plan and merges them together. The only
// property from the existing plan that is retained is the vatsimStatus.
//
// It also returns a boolean indicating whether any of the properties
// were different.
function mergeFlightPlans(
  incomingPlan: IVatsimFlightPlan,
  existingPlan: vatsimEDCT
): { flightPlan: vatsimEDCT; hasUpdates: boolean } {
  let hasUpdates = false;

  hasUpdates =
    incomingPlan.revision !== existingPlan.revision &&
    incomingPlan.departureTime !== existingPlan.departureTime;

  const flightPlan = new vatsimEDCT(
    incomingPlan,
    hasUpdates ? ImportState.UPDATED : existingPlan.importState
  );

  return { flightPlan, hasUpdates };
}

export function processFlightPlans(
  currentEDCT: vatsimEDCT[],
  incomingPlans: IVatsimFlightPlan[]
): ProcessFlightPlansResult {
  let updatedPlansCount = 0;

  // If there are no incoming plans then just return an empty array
  if (incomingPlans.length === 0) {
    return {
      flightPlans: [],
      hasNew: false,
      hasUpdates: false,
    };
  }

  // If there are no current plans then we know everything incoming is new.
  if (currentEDCT.length === 0) {
    return {
      flightPlans: incomingPlans.map((plan) => {
        return new vatsimEDCT(plan);
      }),
      hasNew: true,
      hasUpdates: false,
    };
  }

  // Create an array of vatsimEDCT objects from the incoming plans to make everything from here on
  // easier to deal with.
  const incomingEDCT = incomingPlans.map((plan) => {
    return new vatsimEDCT(plan);
  });

  // Ok this is where it gets fancy. Since there were existing items and new items
  // we need to figure out the overlap and return those, then include the new items.

  // This finds the overlap based on callsign. From the docs, intersectionBy orders
  // and returns references to objects in the first array.
  //
  // The returned list then has its plans updated with the current vatsimStatus.
  //
  // Yes I agree this seems hugely inefficient.
  const existingEDCT = _.intersectionBy(
    incomingEDCT,
    currentEDCT,
    "callsign"
  ).map((incomingEDCT) => {
    const currentPlan = currentEDCT.find(
      (p) => p.callsign === incomingEDCT.callsign
    );
    if (currentPlan) {
      const mergeResult = mergeFlightPlans(incomingEDCT, currentPlan);
      mergeResult.hasUpdates ? updatedPlansCount++ : null;
      return mergeResult.flightPlan;
    } else {
      // I don't think this can ever happen?
      return incomingEDCT;
    }
  });

  // Now find the new ones by removing the existing ones from the incoming ones and
  // tag them as new.
  const newPlans = _.differenceBy(incomingEDCT, existingEDCT, "callsign");

  return {
    flightPlans: [...existingEDCT, ...newPlans].sort((a, b) =>
      a.callsign!.localeCompare(b.callsign!)
    ),
    hasNew: newPlans.length > 0,
    hasUpdates: updatedPlansCount > 0,
  };
}
