import { enqueueSnackbar } from "notistack";
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

const logger = debug("edct:EDCTFlightPlans");

interface VastimEDCTFlightPlansProps {
  isConnected: boolean | null;
}

const VatsimEDCTFlightPlans = ({ isConnected }: VastimEDCTFlightPlansProps) => {
  const { socket } = useAppContext();
  const bellPlayer = useAudio("/bell.mp3");
  const { departureCodes, arrivalCodes } =
    useLoaderData() as AirportCodesFormData;
  const {
    processIncomingEDCT,
    hasNew,
    setHasNew,
    hasUpdates,
    setHasUpdates,
    currentEDCT,
    setCurrentEDCT,
  } = useVatsim();

  const connectToVatsim = useCallback(() => {
    // setCurrentEDCT([]);
    socket.connect();
  }, [socket]);

  // Set the window title
  useEffect(() => {
    document.title = `EDCT planning`;
  }, []);

  // Connect if codes were provided
  useEffect(() => {
    if (!departureCodes || !arrivalCodes) {
      return;
    }

    connectToVatsim();
  }, [departureCodes, connectToVatsim, arrivalCodes]);

  // Set up playing sounds when new or updated plans are received
  useEffect(() => {
    if (hasNew || hasUpdates) {
      async () => {
        await bellPlayer.play();
      };
      setHasNew(false);
      setHasUpdates(false);
    }
  }, [hasNew, hasUpdates, bellPlayer, setHasNew, setHasUpdates]);

  // This method of handling socket events comes from
  // https://dev.to/bravemaster619/how-to-use-socket-io-client-correctly-in-react-app-o65
  const onConnect = useCallback(() => {
    if (!departureCodes || !arrivalCodes) {
      return;
    }

    logger("Connected for VATSIM EDCT flight plan updates");

    socket.emit(
      "watchEDCT",
      departureCodes.split(","),
      arrivalCodes.split(",")
    );
  }, [arrivalCodes, departureCodes, socket]);

  const onVatsimEDCTupdate = useCallback(
    (vatsimPlans: IVatsimFlightPlan[]) => {
      logger("Received VATSIM EDCT flight plans");
      console.log("Received flight plans");

      processIncomingEDCT(vatsimPlans);
    },
    [processIncomingEDCT]
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
      enqueueSnackbar(message, {
        variant: "warning",
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

      // Check done outside setFlightPlans so drafts aren't created for every object in the
      // array.
      const index = currentEDCT.findIndex(
        (plan) => plan.callsign === params.value
      );

      if (index !== -1) {
        setCurrentEDCT((draft) => {
          draft[index].importState !== ImportState.IMPORTED
            ? (draft[index].importState = ImportState.IMPORTED)
            : (draft[index].importState = ImportState.NEW);
        });
      }
    },
    [currentEDCT, setCurrentEDCT]
  );

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <AirportCodes showArrivalCodes />
        <Stack sx={{ mt: 2, ml: 1 }} spacing={2}>
          <EDCTDataGrid
            onToggleFlightPlanState={toggleFlightPlanState}
            flightPlans={currentEDCT}
            allowEdit
          />
          <Legend />
        </Stack>
      </Box>
    </>
  );
};

export default VatsimEDCTFlightPlans;
