import { DateTime } from "luxon";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";

export default class vatsimEDCT implements IVatsimFlightPlan {
  private _edct?: string;

  _id!: string;
  callsign!: string;
  isPrefile!: boolean;
  departure?: string;
  arrival?: string;
  departureTime?: string;
  shortEDCT?: string;
  importState?: ImportState;
  revision!: number;
  minutesToEDCT?: number;

  get EDCT(): string | undefined {
    return this._edct;
  }

  set EDCT(value: string | undefined) {
    this._edct = value;
    this.minutesToEDCT = vatsimEDCT.calculateMinutesToEDCT(this._edct);
    this.shortEDCT = vatsimEDCT.calculateShortEDCT(this._edct);
  }

  constructor(flightPlan?: IVatsimFlightPlan, initialState = ImportState.NEW) {
    this.importState = initialState;

    if (!flightPlan) {
      return;
    }

    this._id = flightPlan._id;
    this.callsign = flightPlan.callsign;
    this.isPrefile = flightPlan.isPrefile;
    this.departure = flightPlan.departure;
    this.arrival = flightPlan.arrival;
    this.departureTime = flightPlan.departureTime;
    this.EDCT = flightPlan.EDCT;
    this.revision = flightPlan.revision;
  }

  static calculateShortEDCT(EDCT: string | undefined): string | undefined {
    if (!EDCT) {
      return undefined;
    }

    return DateTime.fromISO(EDCT, { zone: "UTC" }).toLocaleString(
      DateTime.TIME_24_SIMPLE
    );
  }

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
