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

const logger = debug("edct:EDCTFlightPlans");

interface VastimEDCTFlightPlansProps {
  isConnected: boolean | null;
  onSetSnackbar: Dispatch<SetStateAction<AlertSnackbarProps>>;
}
const VatsimEDCTFlightPlans = ({
  isConnected,
  onSetSnackbar,
}: VastimEDCTFlightPlansProps) => {
  const bellPlayer = useAudio("/bell.mp3");
  const [flightPlans, setFlightPlans] = useImmer<vatsimEDCT[]>([]);
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
  const [hasNew, setHasNew] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);

  useEffect(() => {
    // The new entry sound plays when:
    // 1. Any new entry is received
    // 2. Non EDCT updates are applied and the user is a TMU
    // 3. EDCT updates are applied and the user is a viewer
    if (hasNew || hasUpdates) {
      bellPlayer.play();
      setHasNew(false);
      setHasUpdates(false);
    }
  }, [hasNew, hasUpdates, bellPlayer]);

  useEffect(() => {
    document.title = `EDCT planning`;

    socket.on("vatsimEDCTupdate", (vatsimPlans: IVatsimFlightPlan[]) => {
      logger("Received VATSIM EDCT flight plans");

      // This just feels like a giant hack to get around the closure issues of useEffect and
      // useState not having flightPlans be the current value every time the update event is received.
      setFlightPlans((currentPlans) => {
        const result = processIncomingEDCT(currentPlans, vatsimPlans);
        setHasNew(result.hasNew);
        setHasUpdates(result.hasUpdates);
      });
    });

    socket.on("connect", () => {
      logger("Connected for VATSIM EDCT flight plan updates");

      socket.emit(
        "watchEDCT",
        departureCodesRef.current.split(","),
        arrivalCodesCodesRef.current.split(",")
      );
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
    if (departureCodes === "" || arrivalCodes === "") return;

    // Not currently connected so connect
    if (!isConnected) {
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

      // Check done outside setFlightPlans so drafts aren't created for every object in the
      // array.
      const index = flightPlans.findIndex(
        (plan) => plan.callsign === params.value
      );

      if (index !== -1) {
        setFlightPlans((draft) => {
          draft[index].importState !== ImportState.IMPORTED
            ? (draft[index].importState = ImportState.IMPORTED)
            : (draft[index].importState = ImportState.NEW);
        });
      }
    },
    [flightPlans, setFlightPlans]
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
            <TextField
              label="Arrival codes"
              value={arrivalCodes}
              onChange={(e) => {
                setArrivalCodes(e.target.value);
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
            allowEdit
          />
          <Legend />
        </Stack>
      </Box>
    </>
  );
};

export default VatsimEDCTFlightPlans;
