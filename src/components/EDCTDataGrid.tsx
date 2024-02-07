import { Dispatch, SetStateAction, useCallback } from "react";
import StyledDataGrid from "./StyledDataGrid";
import {
  GridCellEditStartParams,
  GridCellParams,
  GridColDef,
  GridRowModel,
  MuiEvent,
} from "@mui/x-data-grid";
import { DateTime } from "luxon";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";
import { updateEdct } from "../services/edct.mts";
import { formatDateTime, getRowClassName } from "../utils/dataGrid.mts";
import vatsimEDCT from "../utils/vatsimEDCT.mts";
import clsx from "clsx";
import { AlertSnackbarProps } from "./AlertSnackbar";

interface EDCTDataGridProps {
  flightPlans: vatsimEDCT[];
  onToggleFlightPlanState: (params: GridCellParams) => void;
  onSetSnackbar: Dispatch<SetStateAction<AlertSnackbarProps>>;
  allowEdit?: boolean;
}

const columns: GridColDef[] = [
  { field: "_id" },
  {
    field: "callsign",
    headerName: "Callsign",
    width: 150,
    editable: false,
    type: "string",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellClassName: (params: GridCellParams<any, string>) => {
      const flightPlan = params.row as vatsimEDCT;

      return clsx({
        "vatsim--callsign": true,
        "vatsim--new": flightPlan.importState === ImportState.NEW,
        "vatsim--updated": flightPlan.importState === ImportState.UPDATED,
        "vatsim--imported": flightPlan.importState === ImportState.IMPORTED,
      });
    },
  },
  {
    field: "departure",
    headerName: "Departure airport",
    align: "center",
    headerAlign: "center",
    width: 175,
    editable: false,
  },
  {
    field: "arrival",
    headerName: "Arrival airport",
    align: "center",
    headerAlign: "center",
    width: 175,
    editable: false,
  },
  {
    field: "departureTime",
    headerName: "Filed departure",
    align: "center",
    headerAlign: "center",
    width: 175,
    editable: false,
    valueFormatter: formatDateTime,
  },
  {
    field: "shortEDCT",
    headerName: "EDCT",
    align: "center",
    headerAlign: "center",
    width: 100,
    editable: true,
  },
  {
    field: "minutesToEDCT",
    headerName: "To EDCT",
    align: "center",
    headerAlign: "center",
    width: 100,
    editable: false,
  },
];

const EDCTDataGrid = ({
  onSetSnackbar,
  onToggleFlightPlanState,
  flightPlans,
  allowEdit,
}: EDCTDataGridProps) => {
  const saveEDCTToServer = useCallback(
    async (newRow: GridRowModel, originalRow: GridRowModel) => {
      const newEDCT = newRow as vatsimEDCT;

      if (!newEDCT._id) {
        onSetSnackbar({
          children: `Unable to update EDCT: _id is undefined.`,
          severity: "error",
        });
        return originalRow;
      }

      const timeRegex = /^(\d{2}:\d{2}$)/; // hh:mm
      const plusRegex = /^\+(\d+)$/; // +time

      let newEDCTDateTime: DateTime | null;

      // An empty shortEDCT means no EDCT should be assigned to the flight
      if (newEDCT.shortEDCT === undefined || newEDCT.shortEDCT.trim() === "") {
        newEDCTDateTime = null;
      }
      // If the string starts with + then the new EDCT time is the current time in UTC plus the requested minutes
      else if (
        newEDCT.shortEDCT.startsWith("+") &&
        plusRegex.test(newEDCT.shortEDCT)
      ) {
        const minutes = parseInt(newEDCT.shortEDCT.substring(1));
        newEDCTDateTime = DateTime.utc().plus({ minutes });
      }
      // Otherwise assume it is a time in the format "HH:mm"
      else if (timeRegex.test(newEDCT.shortEDCT)) {
        newEDCTDateTime = DateTime.fromFormat(newEDCT.shortEDCT, "HH:mm", {
          zone: "UTC",
        });
      } else {
        onSetSnackbar({
          children: `Unable to updated EDCT: ${newEDCT.shortEDCT} is not a valid format.`,
          severity: "error",
        });
        return originalRow;
      }

      try {
        await updateEdct(newEDCT._id, newEDCTDateTime);

        // The GridRowModel isn't really a vatsimEDCT so it doesn't have a true EDCT setter.
        // This means manually updating the shortEDCT and minutesToEDCT properties
        newEDCT.EDCT = newEDCTDateTime?.toISO() ?? "";
        newEDCT.minutesToEDCT = vatsimEDCT.calculateMinutesToEDCT(newEDCT.EDCT);
        newEDCT.shortEDCT = vatsimEDCT.calculateShortEDCT(newEDCT.EDCT);

        onSetSnackbar({
          children: `EDCT for ${newEDCT.callsign} updated to ${
            newEDCTDateTime?.toISOTime() ?? " no EDCT"
          }`,
          severity: "info",
        });

        return newEDCT;
      } catch (error) {
        const err = error as Error;
        onSetSnackbar({
          children: `Unable to update EDCT for ${newEDCT.callsign}: ${err.message}`,
          severity: "error",
        });
        return originalRow;
      }
    },
    [onSetSnackbar]
  );

  return (
    <StyledDataGrid
      sx={{
        mt: 2,
        ml: 1,
        "&.MuiDataGrid-root .MuiDataGrid-cell:focus-within": {
          outline: "none !important",
        },
      }}
      onCellClick={onToggleFlightPlanState}
      autoHeight
      rows={flightPlans}
      columns={columns}
      disableRowSelectionOnClick
      // Prevent cell editing if allowEdit isn't enabled
      onCellEditStart={(_: GridCellEditStartParams, event: MuiEvent) => {
        event.defaultMuiPrevented = !allowEdit;
      }}
      processRowUpdate={(updatedRow, originalRow) =>
        saveEDCTToServer(updatedRow, originalRow)
      }
      getRowId={(row) => (row as IVatsimFlightPlan)._id}
      getRowClassName={getRowClassName}
      initialState={{
        columns: {
          columnVisibilityModel: {
            _id: false,
          },
        },
      }}
    />
  );
};

export default EDCTDataGrid;