import { Box, Stack } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import debug from "debug";
import { useCallback, useEffect } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useLoaderData } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext.mts";
import { useVatsim } from "../hooks/useVatsim.mts";
import {
  IVatsimFlightPlan,
  ImportState,
} from "../interfaces/IVatsimFlightPlan.mts";
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const {
    processIncomingEDCT,
    hasNew,
    setHasNew,
    hasEDCTUpdates,
    setHasEDCTUpdates,
    currentEDCT,
    setCurrentEDCT,
  } = useVatsim();
  const { departureCodes } = useLoaderData() as AirportCodesFormData;

  const connectToVatsim = useCallback(() => {
    setCurrentEDCT([]);
    socket.connect();
  }, [setCurrentEDCT, socket]);

  // Set the window title and get the query params
  useEffect(() => {
    document.title = `EDCT assignments`;
  }, []);

  // Connect if codes were provided
  useEffect(() => {
    if (!departureCodes) {
      return;
    }

    connectToVatsim();
  }, [departureCodes, connectToVatsim]);

  // Play bell sounds on new or updated flight plans
  useEffect(() => {
    if (hasNew || hasEDCTUpdates) {
      void bellPlayer.play();
      setHasNew(false);
      setHasEDCTUpdates(false);
    }
  }, [hasNew, bellPlayer, hasEDCTUpdates, setHasNew, setHasEDCTUpdates]);

  // This method of handling socket events comes from
  // https://dev.to/bravemaster619/how-to-use-socket-io-client-correctly-in-react-app-o65
  const onConnect = useCallback(() => {
    if (!departureCodes) {
      return;
    }

    logger("Connected for VATSIM EDCT flight plan updates");

    socket.emit("watchEDCTViewOnly", departureCodes.split(","));
  }, [departureCodes, socket]);

  const onVatsimEDCTViewOnlyUpdate = useCallback(
    (vatsimPlans: IVatsimFlightPlan[]) => {
      logger("Received VATSIM EDCT flight plans");
      console.log("Received VATSIM EDCT flight plans");

      processIncomingEDCT(vatsimPlans);
    },
    [processIncomingEDCT]
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

      setCurrentEDCT((draft) => {
        const index = draft.findIndex((plan) => plan.callsign === params.value);

        if (index !== -1) {
          draft[index].importState !== ImportState.IMPORTED
            ? (draft[index].importState = ImportState.IMPORTED)
            : (draft[index].importState = ImportState.NEW);
        }
      });
    },
    [setCurrentEDCT]
  );

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <AirportCodes />
        <Stack sx={{ mt: 2, ml: 1 }} spacing={2}>
          <EDCTDataGrid
            onToggleFlightPlanState={toggleFlightPlanState}
            flightPlans={currentEDCT}
            initialState={{
              sorting: {
                sortModel: [{ field: "minutesToEDCT", sort: "asc" }],
              },
            }}
          />
          <Legend />
        </Stack>
      </Box>
    </>
  );
};

export default VatsimEDCTFlightPlansViewOnly;
