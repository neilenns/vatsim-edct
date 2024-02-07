import { Stream as StreamIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, TextField } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import debug from "debug";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useSearchParams } from "react-router-dom";
import { useImmer } from "use-immer";
import { useAppContext } from "../hooks/useAppContext.mts";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";
import { processIncomingEDCT } from "../utils/vatsim.mts";
import vatsimEDCT from "../utils/vatsimEDCT.mts";
import { useAudio } from "./AudioHook";
import EDCTDataGrid from "./EDCTDataGrid";
import Legend from "./Legend";

const logger = debug("edct:EDCTFlightPlans");

interface VastimEDCTFlightPlansProps {
  isConnected: boolean | null;
}
const VatsimEDCTFlightPlans = ({ isConnected }: VastimEDCTFlightPlansProps) => {
  const { socket, setSnackbar } = useAppContext();
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
  const [searchParams] = useSearchParams();

  // Set the window title
  useEffect(() => {
    document.title = `EDCT planning`;
  }, []);

  // Pre-fill the departure and arrival field with the codes from the URL.
  useEffect(() => {
    setDepartureCodes(searchParams.get("d") ?? "");
    setArrivalCodes(searchParams.get("a") ?? "");
  }, [searchParams]);

  // Set up playing sounds when new or updated plans are received
  useEffect(() => {
    if (hasNew || hasUpdates) {
      bellPlayer.play();
      setHasNew(false);
      setHasUpdates(false);
    }
  }, [hasNew, hasUpdates, bellPlayer]);

  // This method of handling socket events comes from
  // https://dev.to/bravemaster619/how-to-use-socket-io-client-correctly-in-react-app-o65
  const onConnect = useCallback(() => {
    logger("Connected for VATSIM EDCT flight plan updates");

    socket.emit(
      "watchEDCT",
      departureCodesRef.current.split(","),
      arrivalCodesCodesRef.current.split(",")
    );
  }, [socket]);

  const onVatsimEDCTupdate = useCallback(
    (vatsimPlans: IVatsimFlightPlan[]) => {
      logger("Received VATSIM EDCT flight plans");
      console.log("Received flight plans");

      // This just feels like a giant hack to get around the closure issues of useEffect and
      // useState not having flightPlans be the current value every time the update event is received.
      setFlightPlans((currentPlans) => {
        const result = processIncomingEDCT(currentPlans, vatsimPlans);
        setHasNew(result.hasNew);
        setHasUpdates(result.hasUpdates);
      });
    },
    [setFlightPlans]
  );

  // Register for connect events
  useEffect(() => {
    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket, onConnect]);

  // Register for updated data events
  useEffect(() => {
    socket.on("vatsimEDCTupdate", onVatsimEDCTupdate);
    return () => {
      socket.off("vatsimEDCTupdate", onVatsimEDCTupdate);
    };
  }, [socket, onVatsimEDCTupdate]);

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
      setSnackbar({
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

  const toggleVatsimConnection = useCallback(() => {
    if (departureCodes === "" || arrivalCodes === "") {
      setSnackbar({
        children: `Departure and arrival codes must be specified.`,
        severity: `error`,
      });
      return;
    }

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
  }, [arrivalCodes, departureCodes, isConnected, setFlightPlans, socket]);

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
            allowEdit
          />
          <Legend />
        </Stack>
      </Box>
    </>
  );
};

export default VatsimEDCTFlightPlans;
