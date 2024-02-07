import { Stream as StreamIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, TextField } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import debug from "debug";
import pluralize from "pluralize";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import socketIOClient, { Socket } from "socket.io-client";
import { useImmer } from "use-immer";
import { ENV } from "../env.mts";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";
import { processIncomingEDCT } from "../utils/vatsim.mts";
import vatsimEDCT from "../utils/vatsimEDCT.mts";
import AlertSnackbar, {
  AlertSnackBarOnClose,
  AlertSnackbarProps,
} from "./AlertSnackbar";
import { useAudio } from "./AudioHook";
import Legend from "./Legend";
import EDCTDataGrid from "./EDCTDataGrid";

const logger = debug("edct:EDCTFlightPlans");

const VatsimEDCTFlightPlans = () => {
  const bellPlayer = useAudio("/bell.mp3");
  const disconnectedPlayer = useAudio("/disconnected.mp3");
  const [flightPlans, setFlightPlans] = useImmer<vatsimEDCT[]>([]);
  // isConnected is initialized to null so useEffect can tell the difference between first page load
  // and actually being disconnected. Otherwise what happens is on page load the disconnect
  // sound will attempt to play.
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [departureCodes, setDepartureCodes] = useState(
    localStorage.getItem("edctDepartureCodes") ?? ""
  );
  const [arrivalCodes, setArrivalCodes] = useState(
    localStorage.getItem("edctArrivalCodes") ?? ""
  );
  // This is a non-rendering version of edctDepartureCodes and edctArrivalCodes that can get safely used in useEffect()
  // to send the airport codes to the connected socket.
  const departureCodesRef = useRef<string>(
    localStorage.getItem("edctDepartureCodes") ?? ""
  );
  const arrivalCodesCodesRef = useRef<string>(
    localStorage.getItem("edctArrivalCodes") ?? ""
  );
  const [snackbar, setSnackbar] = useState<AlertSnackbarProps>(null);
  const socketRef = useRef<Socket | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);
  const [hasEDCTUpdates, setHasEDCTUpdates] = useState(false);

  const handleSnackbarClose: AlertSnackBarOnClose = () => {
    setSnackbar(null);
  };

  useEffect(() => {
    // The new entry sound plays when:
    // 1. Any new entry is received
    // 2. Non EDCT updates are applied and the user is a TMU
    // 3. EDCT updates are applied and the user is a viewer
    if (hasNew || hasUpdates) {
      bellPlayer.play();
      setHasNew(false);
      setHasUpdates(false);
      setHasEDCTUpdates(false);
    }
  }, [hasNew, hasUpdates, bellPlayer, hasEDCTUpdates]);

  useEffect(() => {
    if (isConnected !== null && !isConnected) {
      disconnectedPlayer.play();
      // Issue 644: Once the sound's played once set isConnected to null
      // so any future calls to this method due to re-renders won't cause
      // the disconnected sound to play.
      setIsConnected(null);
    }
  }, [isConnected, disconnectedPlayer]);

  useEffect(() => {
    document.title = `EDCT planning`;

    socketRef.current = socketIOClient(ENV.VITE_SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token: ENV.VITE_API_KEY },
    });

    socketRef.current.on(
      "vatsimEDCTupdate",
      (vatsimPlans: IVatsimFlightPlan[]) => {
        logger("Received VATSIM EDCT flight plans");

        // This just feels like a giant hack to get around the closure issues of useEffect and
        // useState not having flightPlans be the current value every time the update event is received.
        setFlightPlans((currentPlans) => {
          const result = processIncomingEDCT(currentPlans, vatsimPlans);
          setHasNew(result.hasNew);
          setHasUpdates(result.hasUpdates);
          setHasEDCTUpdates(result.hasEDCTUpdates);
        });
      }
    );

    socketRef.current.on("connect", () => {
      logger("Connected for VATSIM EDCT flight plan updates");

      socketRef.current?.emit(
        "watchEDCT",
        departureCodesRef.current.split(","),
        arrivalCodesCodesRef.current.split(",")
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
  }, [setFlightPlans]);

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
    if (departureCodes === "" || arrivalCodes === "") return;

    // Not currently connected so connect
    if (!isConnected && socketRef.current) {
      setFlightPlans(() => {
        return [];
      });

      // Clean up the airport codes
      const cleanedDepartureCodes = cleanCodes(departureCodes);
      const cleanedArrivalCodes = cleanCodes(arrivalCodes);

      localStorage.setItem("edctDepartureCodes", cleanedDepartureCodes);
      localStorage.setItem("edctArrivalCodes", cleanedArrivalCodes);

      // Issue 709: This is set as both a state and a ref to ensure the
      // airport codes are available in the socket connected event without
      //having to add them as a useEffects() dependency.
      setDepartureCodes(cleanedDepartureCodes);
      departureCodesRef.current = cleanedDepartureCodes;
      setArrivalCodes(cleanedArrivalCodes);
      arrivalCodesCodesRef.current = cleanedArrivalCodes;

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

  const toggleFlightPlanState = useCallback(
    (params: GridCellParams) => {
      if (params.field !== "callsign") {
        return;
      }

      setFlightPlans((draft) => {
        const index = draft.findIndex((plan) => plan.callsign === params.value);

        if (index !== -1) {
          draft[index].importState !== ImportState.IMPORTED
            ? (draft[index].importState = ImportState.IMPORTED)
            : (draft[index].importState = ImportState.NEW);
        }
      });
    },
    [setFlightPlans]
  );

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
            <TextField
              label="Arrival codes"
              value={arrivalCodes}
              onChange={(e) => {
                setArrivalCodes(e.target.value);
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
        <Stack sx={{ mt: 2, ml: 1 }} spacing={2}>
          <EDCTDataGrid
            onToggleFlightPlanState={toggleFlightPlanState}
            flightPlans={flightPlans}
            onSetSnackbar={setSnackbar}
            allowEdit
          />
          <Legend />
        </Stack>
      </Box>

      <AlertSnackbar {...snackbar} onClose={handleSnackbarClose} />
    </>
  );
};

export default VatsimEDCTFlightPlans;
