import { Box, Stack } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import debug from "debug";
import { useCallback, useEffect, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { useImmer } from "use-immer";
import { useAppContext } from "../hooks/useAppContext.mts";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";
import { processIncomingEDCT } from "../utils/vatsim.mts";
import vatsimEDCT from "../utils/vatsimEDCT.mts";
import AirportCodes, { AirportCodesFormData } from "./AirportCodes";
import { useAudio } from "./AudioHook";
import EDCTDataGrid from "./EDCTDataGrid";
import Legend from "./Legend";

const logger = debug("edct:EDCTFlightPlansViewOnly");

interface VatsimEDCTFlightPlansViewOnlyProps {
  isConnected: boolean | null;
}

const VatsimEDCTFlightPlansViewOnly = ({
  isConnected,
}: VatsimEDCTFlightPlansViewOnlyProps) => {
  const { socket, setSnackbar } = useAppContext();
  const bellPlayer = useAudio("/bell.mp3");
  const [flightPlans, setFlightPlans] = useImmer<vatsimEDCT[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const [hasEDCTUpdates, setHasEDCTUpdates] = useState(false);
  const [searchParams] = useSearchParams();
  const airportCodes = useLoaderData() as AirportCodesFormData;

  const connectToVatsim = useCallback(() => {
    setFlightPlans([]);
    socket.connect();
  }, [setFlightPlans, socket]);

  // Set the window title and get the query params
  useEffect(() => {
    document.title = `EDCT assignments`;
  }, []);

  // Connect if codes were provided
  useEffect(() => {
    if (!airportCodes.departureCodes) {
      return;
    }

    connectToVatsim();
  }, [airportCodes.departureCodes, connectToVatsim, searchParams]);

  // Play bell sounds on new or updated flight plans
  useEffect(() => {
    if (hasNew || hasEDCTUpdates) {
      bellPlayer.play();
      setHasNew(false);
      setHasEDCTUpdates(false);
    }
  }, [hasNew, bellPlayer, hasEDCTUpdates]);

  // This method of handling socket events comes from
  // https://dev.to/bravemaster619/how-to-use-socket-io-client-correctly-in-react-app-o65
  const onConnect = useCallback(() => {
    if (!airportCodes.departureCodes) {
      return;
    }

    logger("Connected for VATSIM EDCT flight plan updates");

    socket.emit("watchEDCTViewOnly", airportCodes.departureCodes.split(","));
  }, [airportCodes.departureCodes, socket]);

  const onVatsimEDCTViewOnlyUpdate = useCallback(
    (vatsimPlans: IVatsimFlightPlan[]) => {
      logger("Received VATSIM EDCT flight plans");
      console.log("Received VATSIM EDCT flight plans");

      setFlightPlans((draft) => {
        const result = processIncomingEDCT(draft, vatsimPlans);
        setHasNew(result.hasNew);
        setHasEDCTUpdates(result.hasEDCTUpdates);
      });
    },
    [setFlightPlans]
  );

  // Register for socket connection events
  useEffect(() => {
    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket, onConnect]);

  // Register for updated data events
  useEffect(() => {
    socket.on("vatsimEDCTViewOnlyUpdate", onVatsimEDCTViewOnlyUpdate);

    return () => {
      socket.off("vatsimEDCTViewOnlyUpdate", onVatsimEDCTViewOnlyUpdate);
    };
  }, [socket, onVatsimEDCTViewOnlyUpdate]);

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
        <AirportCodes />
        <Stack sx={{ mt: 2, ml: 1 }} spacing={2}>
          <EDCTDataGrid
            onToggleFlightPlanState={toggleFlightPlanState}
            flightPlans={flightPlans}
          />
          <Legend />
        </Stack>
      </Box>
    </>
  );
};

export default VatsimEDCTFlightPlansViewOnly;
