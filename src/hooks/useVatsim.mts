import { DateTime } from "luxon";
import { useCallback, useMemo } from "react";
import { useImmer } from "use-immer";
import { ENV } from "../env.mts";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";
import vatsimEDCT from "../utils/vatsimEDCT.mts";

interface ProcessIncomingEDCTResult {
  hasNew: boolean;
  hasUpdates: boolean;
  hasEDCTUpdates: boolean;
}

export function useVatsim() {
  const [currentEDCT, setCurrentEDCT] = useImmer<vatsimEDCT[]>([]);
  const [hasUpdates, setHasUpdates] = useImmer<boolean>(false);
  const [hasNew, setHasNew] = useImmer<boolean>(false);
  const [hasEDCTUpdates, setHasEDCTUpdates] = useImmer<boolean>(false);

  const processIncomingEDCT = useCallback(
    (incomingPlans: IVatsimFlightPlan[]): ProcessIncomingEDCTResult => {
      // If there are no incoming plans then just set an empty array.
      if (incomingPlans.length === 0) {
        setCurrentEDCT(() => {
          return [];
        });

        return {
          hasNew: false,
          hasUpdates: false,
          hasEDCTUpdates: false,
        };
      }

      // Filter out all the deleted flight plans. They'll be the ones
      // that don't exist in the incoming list.
      setCurrentEDCT((draft) => {
        return draft.filter((existing) =>
          incomingPlans.find((incoming) => incoming._id === existing._id)
        );
      });

      // Loop through all the incoming plans and see if it needs to be added or an existing
      // entry updated.
      incomingPlans.forEach((incoming) => {
        setCurrentEDCT((draft) => {
          const existing = draft.find((plan) => plan._id === incoming._id);

          // It's a new plan
          if (!existing) {
            draft.push(new vatsimEDCT(incoming));
            setHasNew(true);
          }
          // It's an existing one so update it
          else {
            // This is the update state used to determine whether sounds are played for the TMU.
            const updated =
              incoming.revision !== existing.revision &&
              incoming.departureTime !== existing.departureTime;

            // Standalone check for EDCT updates so the update sound can play differently in TMU vs view mode.
            const edctUpdated = incoming.EDCT != existing.EDCT;

            // This uses an if statement instead of the previous shorthand hasUpdates || updates
            // to avoid hasUpdates being a dependency of the callback, which was preventing
            // udpates from causing a sound to play.
            if (updated) {
              setHasUpdates(true);
            }

            if (edctUpdated) {
              setHasEDCTUpdates(true);
            }

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
              const difference = DateTime.utc().diff(
                existing.updatedAt,
                "minutes"
              );
              if (
                difference.minutes > ENV.VITE_AUTO_CLEAR_UPDATE_INTERVAL_MINUTES
              ) {
                existing.importState = ImportState.IMPORTED;
              }
            }
          }
        });

        setCurrentEDCT((draft) =>
          draft.sort((a, b) => a.callsign.localeCompare(b.callsign))
        );
      });

      return { hasNew, hasUpdates, hasEDCTUpdates };
    },
    [
      hasEDCTUpdates,
      hasNew,
      hasUpdates,
      setCurrentEDCT,
      setHasEDCTUpdates,
      setHasNew,
      setHasUpdates,
    ]
  );

  // Finds the callsign in the list of current plans, sets its
  // state to imported.
  const markPlanImported = useCallback(
    (callsign: string) => {
      setCurrentEDCT((draft) => {
        const plan = draft.find((plan) => plan.callsign === callsign);
        if (!plan) {
          return;
        }

        plan.importState = ImportState.IMPORTED;
      });
    },
    [setCurrentEDCT]
  );

  return useMemo(
    () => ({
      currentEDCT,
      setCurrentEDCT,
      processIncomingEDCT,
      markPlanImported,
      hasUpdates,
      setHasUpdates,
      hasNew,
      setHasNew,
      hasEDCTUpdates,
      setHasEDCTUpdates,
    }),
    [
      currentEDCT,
      setCurrentEDCT,
      processIncomingEDCT,
      markPlanImported,
      hasUpdates,
      setHasUpdates,
      hasNew,
      setHasNew,
      hasEDCTUpdates,
      setHasEDCTUpdates,
    ]
  );
}
