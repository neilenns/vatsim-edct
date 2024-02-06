import { GridRowParams, GridValueFormatterParams } from "@mui/x-data-grid";
import { DateTime } from "luxon";
import vatsimEDCT from "./vatsimEDCT.mts";
import { clsx } from "clsx";

/**
 *
 * @param params Takes a grid value that's assumed to be a UTC time in ISO format and formats
 * it in short time format (HH:mm).
 * @returns The formatted time as a string.
 */
export function formatDateTime(params: GridValueFormatterParams<string>) {
  if (params.value === null || params.value === undefined) {
    return;
  }

  const depTime = DateTime.fromISO(params.value, { zone: "UTC" });
  return depTime.toLocaleString(DateTime.TIME_24_SIMPLE);
}

/**
 * Takes a grid row and returns the CSS class name for it based on how far away the minutesToEDCT
 * time is.
 * @param params The grid row
 * @returns A class name.
 */
export function getRowClassName(params: GridRowParams) {
  const flightPlan = params.row as vatsimEDCT;
  if (!flightPlan || flightPlan.minutesToEDCT === undefined) {
    return "";
  }

  return clsx({
    "":
      flightPlan.minutesToEDCT === undefined || flightPlan.minutesToEDCT >= 10,
    "vatsim--EDCT--late": flightPlan.minutesToEDCT <= 0,
    "vatsim--EDCT--urgent":
      flightPlan.minutesToEDCT > 0 && flightPlan.minutesToEDCT < 10,
  });
}
