import { Box, Stack } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import debug from "debug";
import { useCallback, useEffect, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useLoaderData } from "react-router-dom";
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

const logger = debug("edct:EDCTFlightPlans");

interface VastimEDCTFlightPlansProps {
  isConnected: boolean | null;
}
const VatsimEDCTFlightPlans = ({ isConnected }: VastimEDCTFlightPlansProps) => {
  const { socket, setSnackbar } = useAppContext();
  const bellPlayer = useAudio("/bell.mp3");
  const [flightPlans, setFlightPlans] = useImmer<vatsimEDCT[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);
  const { departureCodes, arrivalCodes } =
    useLoaderData() as AirportCodesFormData;

  const connectToVatsim = useCallback(() => {
    setFlightPlans([]);
    socket.connect();
  }, [setFlightPlans, socket]);

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
      bellPlayer.play();
      setHasNew(false);
      setHasUpdates(false);
    }
  }, [hasNew, hasUpdates, bellPlayer]);

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
        <AirportCodes showArrivalCodes />
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
