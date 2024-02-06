import { Stream as StreamIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, TextField } from "@mui/material";
import { GridCellParams, GridColDef } from "@mui/x-data-grid";
import clsx from "clsx";
import debug from "debug";
import pluralize from "pluralize";
import { useEffect, useRef, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import socketIOClient, { Socket } from "socket.io-client";
import { apiKey, serverUrl } from "../configs/server.mts";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";
import { formatDateTime, getRowClassName } from "../utils/dataGrid.mts";
import { processFlightPlans } from "../utils/vatsim.mts";
import vatsimEDCT from "../utils/vatsimEDCT.mts";
import AlertSnackbar, {
  AlertSnackBarOnClose,
  AlertSnackbarProps,
} from "./AlertSnackbar";
import { useAudio } from "./AudioHook";
import StyledEDCTDataGrid from "./StyledEDCTDataGrid";

const logger = debug("edct:EDCTFlightPlans");

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
    headerName: "Departure time",
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
    editable: false,
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

const VatsimEDCTFlightPlansViewOnly = () => {
  const bellPlayer = useAudio("/bell.mp3");
  const disconnectedPlayer = useAudio("/disconnected.mp3");
  const [flightPlans, setFlightPlans] = useState<vatsimEDCT[]>([]);
  // isConnected is initialized to null so useEffect can tell the difference between first page load
  // and actually being disconnected. Otherwise what happens is on page load the disconnect
  // sound will attempt to play.
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [departureCodes, setDepartureCodes] = useState(
    localStorage.getItem("edctDepartureCodes") || ""
  );
  // This is a non-rendering version of edctDepartureCodes and edctArrivalCodes that can get safely used in useEffect()
  // to send the airport codes to the connected socket.
  const departureCodesRef = useRef<string>(
    localStorage.getItem("edctDepartureCodes") || ""
  );
  const [snackbar, setSnackbar] = useState<AlertSnackbarProps>(null);
  const socketRef = useRef<Socket | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);
  const [hasEDCTUpdates, setHasEDCTUpdates] = useState(false);

  const handleSnackbarClose: AlertSnackBarOnClose = () => setSnackbar(null);

  useEffect(() => {
    if (hasNew || hasEDCTUpdates) {
      void bellPlayer.play();
      setHasNew(false);
      setHasUpdates(false);
      setHasEDCTUpdates(false);
    }
  }, [hasNew, hasUpdates, bellPlayer, hasEDCTUpdates]);

  useEffect(() => {
    if (isConnected !== null && !isConnected) {
      void disconnectedPlayer.play();
      // Issue 644: Once the sound's played once set isConnected to null
      // so any future calls to this method due to re-renders won't cause
      // the disconnected sound to play.
      setIsConnected(null);
    }
  }, [isConnected, disconnectedPlayer]);

  useEffect(() => {
    document.title = `EDCT`;

    socketRef.current = socketIOClient(serverUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token: apiKey },
    });

    socketRef.current.on(
      "vatsimFlightPlansUpdate",
      (vatsimPlans: IVatsimFlightPlan[]) => {
        logger("Received VATSIM EDCT flight plans");

        // This just feels like a giant hack to get around the closure issues of useEffect and
        // useState not having flightPlans be the current value every time the update event is received.
        setFlightPlans((currentPlans) => {
          const result = processFlightPlans(currentPlans, vatsimPlans);
          setHasNew(result.hasNew);
          setHasUpdates(result.hasUpdates);
          setHasEDCTUpdates(result.hasEDCTUpdates);
          return result.flightPlans;
        });
      }
    );

    socketRef.current.on("connect", () => {
      logger("Connected for VATSIM EDCT flight plan updates");

      socketRef.current?.emit(
        "watchAirports",
        departureCodesRef.current?.split(",")
      );

      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      logger("Disconnected from VATSIM EDCT flight plan updates");
      setIsConnected(false);
    });

    socketRef.current.on("airportNotFound", (airportCodes: string[]) => {
      const message = `${pluralize(
        "Airport",
        airportCodes.length
      )} ${airportCodes.join(", ")} not found`;
      logger(message);
      setSnackbar({
        children: message,
        severity: "warning",
      });
      socketRef.current?.disconnect();
      setIsConnected(false);
    });

    socketRef.current.on("insecureAirportCode", (airportCodes: string[]) => {
      const message = `${pluralize(
        "Airport",
        airportCodes.length
      )} ${airportCodes.join(", ")} not valid`;
      logger(message);
      setSnackbar({
        children: message,
        severity: "error",
      });
      socketRef.current?.disconnect();
      setIsConnected(false);
    });

    socketRef.current.on("connect_error", (error: Error) => {
      logger(`Error connecting for VATSIM EDCT flight plans: ${error.message}`);
      setSnackbar({
        children: `Unable to retrieve VATSIM EDCT flight plans.`,
        severity: "error",
      });
      setIsConnected(null); // null to avoid playing the disconnect sound.
    });

    // Note the use of .io here, to get the manager. reconnect_error fires from
    // the manager, not the socket. Super annoying.
    socketRef.current.io.on("reconnect_error", (error: Error) => {
      logger(
        `Error reconnecting for VATSIM EDCT flight plans: ${error.message}`
      );
      setSnackbar({
        children: `Unable to reconnect to server.`,
        severity: "error",
      });
      setIsConnected(null); // null to avoid playing the disconnect sound.
    });

    // Make sure to disconnect when we are cleaned up
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const onIdle = () => {
    if (isConnected) {
      logger(`Inactivity detected, stopping auto-refresh.`);
      socketRef.current?.disconnect();
      setIsConnected(false);
    }
  };

  const onPrompt = () => {
    if (isConnected) {
      const message = `Inactivity detected, auto-refresh will stop in five minutes.`;
      logger(message);
      setSnackbar({
        children: message,
        severity: "warning",
      });
    }
  };

  const disconnectFromVatsim = () => {
    if (isConnected) {
      socketRef.current?.disconnect();
      setIsConnected(false);
    }
  };

  const cleanCodes = (codes: string): string => {
    return codes
      .split(",")
      .map((code) => code.trim())
      .join(",");
  };

  const toggleVatsimConnection = () => {
    if (departureCodes === "") return;

    // Not currently connected so connect
    if (!isConnected && socketRef.current) {
      setFlightPlans([]);

      // Clean up the airport codes
      const cleanedDepartureCodes = cleanCodes(departureCodes);

      localStorage.setItem("edctDepartureCodes", cleanedDepartureCodes);

      // Issue 709: This is set as both a state and a ref to ensure the
      // airport codes are available in the socket connected event without
      //having to add them as a useEffects() dependency.
      setDepartureCodes(cleanedDepartureCodes);
      departureCodesRef.current = cleanedDepartureCodes;

      socketRef.current.connect();
    }
    // Currently connected so disconnect
    else {
      disconnectFromVatsim();
    }
  };

  useIdleTimer({
    timeout: 1000 * 60 * 60, // 60 minutes
    promptBeforeIdle: 1000 * 60 * 55, // 55 minutes
    onIdle,
    onPrompt,
  });

  const toggleFlightPlanState = (params: GridCellParams) => {
    if (params.field !== "callsign") {
      return;
    }

    const planIndex = flightPlans.findIndex(
      (plan) => plan.callsign === params.value
    );
    if (planIndex !== -1) {
      const updatedFlightPlans = [...flightPlans];

      updatedFlightPlans[planIndex].importState !== ImportState.IMPORTED
        ? (updatedFlightPlans[planIndex].importState = ImportState.IMPORTED)
        : (updatedFlightPlans[planIndex].importState = ImportState.NEW);
      setFlightPlans(updatedFlightPlans);
    }
  };

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <form>
          <Stack direction="row" sx={{ mt: 2, ml: 1 }} spacing={2}>
            <TextField
              label="Departure codes"
              value={departureCodes}
              onChange={(e) => {
                setDepartureCodes(e.target.value);
                disconnectFromVatsim();
              }}
            />
            <IconButton
              onClick={toggleVatsimConnection}
              color={isConnected ? "primary" : "default"}
              title={isConnected ? "Disconnect" : "Connect"}
            >
              <StreamIcon />
            </IconButton>
          </Stack>
        </form>
        <StyledEDCTDataGrid
          sx={{
            mt: 2,
            ml: 1,
            "&.MuiDataGrid-root .MuiDataGrid-cell:focus-within": {
              outline: "none !important",
            },
          }}
          onCellClick={toggleFlightPlanState}
          autoHeight
          rows={flightPlans}
          columns={columns}
          disableRowSelectionOnClick
          getRowId={(row) => (row as IVatsimFlightPlan)._id!}
          getRowClassName={getRowClassName}
          initialState={{
            columns: {
              columnVisibilityModel: {
                _id: false,
              },
            },
          }}
        />
      </Box>

      <AlertSnackbar {...snackbar} onClose={handleSnackbarClose} />
    </>
  );
};

export default VatsimEDCTFlightPlansViewOnly;
