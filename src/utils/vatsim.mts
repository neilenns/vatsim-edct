// This giant mess of a giant mess takes care of processing a received list
// of vatsim flight plans and merging it with the current list of vatsim flight plans.
//
// It properly carries forward any state on the existing flight sim plans, and properly
// reports whether any new or modified plans came in.
import { DateTime } from "luxon";
import {
  ImportState,
  IVatsimFlightPlan,
} from "../interfaces/IVatsimFlightPlan.mjs";
import vatsimEDCT from "./vatsimEDCT.mts";
import { ENV } from "../env.mts";

interface ProcessIncomingEDCTResult {
  hasNew: boolean;
  hasUpdates: boolean;
  hasEDCTUpdates: boolean;
}

export function processIncomingEDCT(
  currentEDCT: vatsimEDCT[],
  incomingEDCT: IVatsimFlightPlan[]
): ProcessIncomingEDCTResult {
  let hasNew = false;
  let hasUpdates = false;
  let hasEDCTUpdates = false;

  // If there are no incoming plans then just populate an empty array
  if (incomingEDCT.length === 0) {
    currentEDCT = [];
    return {
      hasNew: false,
      hasUpdates: false,
      hasEDCTUpdates: false,
    };
  }

  // Loop through all the incoming plans and see if it needs to be added or an existing
  // entry updated.
  incomingEDCT.forEach((incoming) => {
    const existing = currentEDCT.find((edct) => edct._id === incoming._id);

    // It's a new plan
    if (!existing) {
      currentEDCT.push(new vatsimEDCT(incoming));
      hasNew = true;
    }
    // It's an existing plan
    else {
      // This is the update state used to determine whether sounds are played for the TMU.
      const updated =
        incoming.revision !== existing.revision &&
        incoming.departureTime !== existing.departureTime;

      // Standalone check for EDCT updates so the update sound can play differently in TMU vs view mode.
      const edctUpdated = incoming.EDCT != existing.EDCT;

      hasUpdates ||= updated;
      hasEDCTUpdates ||= edctUpdated;

      // Update all the properties
      existing.EDCT = incoming.EDCT;
      existing.departure = incoming.departure;
      existing.arrival = incoming.arrival;
      existing.departureTime = incoming.departureTime;
      existing.isPrefile = incoming.isPrefile;
      existing.revision = incoming.revision;
      existing.isCoasting = incoming.isCoasting;
      existing.sentEDCT = incoming.sentEDCT;

      // If something changed then update the last time it was updated and automatically
      // set the state to udpated
      if (updated || edctUpdated) {
        existing.updatedAt = DateTime.utc();
        existing.importState = ImportState.UPDATED;
      }
      // If nothing changed check and see how long it's been since the last update.
      // If it's been too long set the state to imported.
      else {
        const difference = DateTime.utc().diff(existing.updatedAt, "minutes");
        if (difference.minutes > ENV.VITE_AUTO_CLEAR_UPDATE_INTERVAL_MINUTES) {
          existing.importState = ImportState.IMPORTED;
        }
      }
    }
  });

  // Look for current plans that no longer exist
  currentEDCT.forEach((current, index) => {
    const found = incomingEDCT.find((edct) => edct._id === current._id);

    // This means the plan in the current list no longer exists so remove it by index
    if (!found) {
      currentEDCT.splice(index, 1);
    }
  });

  return { hasNew, hasUpdates, hasEDCTUpdates };
}
