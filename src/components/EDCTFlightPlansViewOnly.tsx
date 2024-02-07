import { Stream as StreamIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, TextField } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import debug from "debug";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useIdleTimer } from "react-idle-timer";
import { useImmer } from "use-immer";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";
import socket from "../socket.mjs";
import { processIncomingEDCT } from "../utils/vatsim.mts";
import vatsimEDCT from "../utils/vatsimEDCT.mts";
import { AlertSnackbarProps } from "./AlertSnackbar";
import { useAudio } from "./AudioHook";
import EDCTDataGrid from "./EDCTDataGrid";
import Legend from "./Legend";

const logger = debug("edct:EDCTFlightPlansViewOnly");

interface VatsimEDCTFlightPlansViewOnlyProps {
  isConnected: boolean | null;
  onSetSnackbar: Dispatch<SetStateAction<AlertSnackbarProps>>;
}

const VatsimEDCTFlightPlansViewOnly = ({
  isConnected,
  onSetSnackbar,
}: VatsimEDCTFlightPlansViewOnlyProps) => {
  const bellPlayer = useAudio("/bell.mp3");
  const [flightPlans, setFlightPlans] = useImmer<vatsimEDCT[]>([]);
  const [departureCodes, setDepartureCodes] = useState(
    localStorage.getItem("edctDepartureCodes") ?? ""
  );
  // This is a non-rendering version of edctDepartureCodes and edctArrivalCodes that can get safely used in useEffect()
  // to send the airport codes to the connected socket.
  const departureCodesRef = useRef<string>(
    localStorage.getItem("edctDepartureCodes") ?? ""
  );
  const [hasNew, setHasNew] = useState(false);
  const [hasEDCTUpdates, setHasEDCTUpdates] = useState(false);

  useEffect(() => {
    if (hasNew || hasEDCTUpdates) {
      bellPlayer.play();
      setHasNew(false);
      setHasEDCTUpdates(false);
    }
  }, [hasNew, bellPlayer, hasEDCTUpdates]);

  useEffect(() => {
    document.title = `EDCT assignments`;

    socket.on(
      "vatsimEDCTViewOnlyUpdate",
      (vatsimPlans: IVatsimFlightPlan[]) => {
        logger("Received VATSIM EDCT flight plans");

        setFlightPlans((draft) => {
          const result = processIncomingEDCT(draft, vatsimPlans);
          setHasNew(result.hasNew);
          setHasEDCTUpdates(result.hasEDCTUpdates);
        });
      }
    );

    socket.on("connect", () => {
      logger("Connected for VATSIM EDCT flight plan updates");

      socket.emit("watchEDCTViewOnly", departureCodesRef.current.split(","));
    });
  }, [setFlightPlans]);

  const onIdle = () => {
    if (isConnected) {
      logger(`Inactivity detected, stopping auto-refresh.`);
      socket.disconnect();
    }
  };

  const onPrompt = () => {
    if (isConnected) {
      const message = `Inactivity detected, auto-refresh will stop in five minutes.`;
      logger(message);
      onSetSnackbar({
        children: message,
        severity: "warning",
      });
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
    if (!isConnected) {
      setFlightPlans([]);

      // Clean up the airport codes
      const cleanedDepartureCodes = cleanCodes(departureCodes);

      localStorage.setItem("edctDepartureCodes", cleanedDepartureCodes);

      // Issue 709: This is set as both a state and a ref to ensure the
      // airport codes are available in the socket connected event without
      //having to add them as a useEffects() dependency.
      setDepartureCodes(cleanedDepartureCodes);
      departureCodesRef.current = cleanedDepartureCodes;

      socket.connect();
    }
    // Currently connected so disconnect
    else {
      socket.disconnect();
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
                socket.disconnect();
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
            onSetSnackbar={onSetSnackbar}
          />
          <Legend />
        </Stack>
      </Box>
    </>
  );
};

export default VatsimEDCTFlightPlansViewOnly;
