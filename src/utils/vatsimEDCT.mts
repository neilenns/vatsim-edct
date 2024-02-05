import { DateTime } from "luxon";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";

export default class vatsimEDCT implements IVatsimFlightPlan {
  _id!: string;
  callsign!: string;
  isPrefile!: boolean;
  departure?: string;
  arrival?: string;
  departureTime?: string;
  EDCT?: string;
  importState?: ImportState;
  revision!: number;
  minutesToEDCT?: number;

  static calculateMinutesToEDCT(EDCT: string | undefined): number | undefined {
    if (!EDCT) {
      return undefined;
    }

    return Math.round(
      DateTime.fromISO(EDCT, { zone: "UTC" }).diff(DateTime.utc(), "minutes")
        .minutes
    );
  }
}
