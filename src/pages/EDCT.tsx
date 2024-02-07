import {
  DarkMode as DarkModeIcon,
  Help as HelpIcon,
  LightMode as LightModeIcon,
  VolumeOff as MutedIcon,
  VolumeMute as UnmutedIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useColorScheme,
} from "@mui/material";
import debug from "debug";
import { DateTime } from "luxon";
import pluralize from "pluralize";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AlertSnackbar, {
  AlertSnackBarOnClose,
  AlertSnackbarProps,
} from "../components/AlertSnackbar";
import VatsimEDCTFlightPlans from "../components/EDCTFlightPlans";
import VatsimEDCTFlightPlansViewOnly from "../components/EDCTFlightPlansViewOnly";
import useAppContext from "../context/AppContext";
import socket from "../socket.mjs";

const logger = debug("edct:EDCTPage");

const Edct = () => {
  const viewOnly = useLocation().pathname === "/view";
  const { mode, setMode } = useColorScheme();
  const { muted, setMuted } = useAppContext();
  const [currentTime, setCurrentTime] = useState<DateTime>(DateTime.utc());
  const [snackbar, setSnackbar] = useState<AlertSnackbarProps>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Update current time every minute
    const intervalId = setInterval(() => {
      setCurrentTime(DateTime.utc());
    }, 1000); // 1000 milliseconds = 1 second

    // Clear interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures effect runs only once on mount

  const toggleDarkMode = () => {
    mode === "light" ? setMode("dark") : setMode("light");
  };

  const toggleMuted = () => {
    setMuted(!muted);
  };

  const handleSnackbarClose: AlertSnackBarOnClose = () => {
    setSnackbar(null);
  };

  // The main page takes care of basic socket connection states and reporting
  // any errors that might be returned from the socket. This frees
  // the two sub pages from all the code duplication: they only handle
  // the events related to the specific data they want to retrieve.
  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      logger("Disconnected from VATSIM updates");
      setIsConnected(false);
    });

    // Note the use of .io here, to get the manager. reconnect_error fires from
    // the manager, not the socket. Super annoying.
    socket.io.on("reconnect_error", (error: Error) => {
      logger(`Error reconnecting to VATSIM updates: ${error.message}`);
      setSnackbar({
        children: `Unable to reconnect to server.`,
        severity: "error",
      });
      setIsConnected(null); // null to avoid playing the disconnect sound.
    });

    socket.on("airportNotFound", (airportCodes: string[]) => {
      const message = `${pluralize(
        "Airport",
        airportCodes.length
      )} ${airportCodes.join(", ")} not found`;
      logger(message);
      setSnackbar({
        children: message,
        severity: "warning",
      });
      socket.disconnect();
      setIsConnected(false);
    });

    socket.on("insecureAirportCode", (airportCodes: string[]) => {
      const message = `${pluralize(
        "Airport",
        airportCodes.length
      )} ${airportCodes.join(", ")} not valid`;
      logger(message);
      setSnackbar({
        children: message,
        severity: "error",
      });
      socket.disconnect();
      setIsConnected(false);
    });

    socket.on("connect_error", (error: Error) => {
      logger(`Error connecting to VATSIM updates: ${error.message}`);
      setSnackbar({
        children: `Unable to connect for VATSIM updates: ${error.message}.`,
        severity: "error",
      });
      setIsConnected(null); // null to avoid playing the disconnect sound.
    });

    // Make sure to disconnect when we are cleaned up
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* AppBar */}
      <AppBar
        position="static"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {viewOnly ? "EDCT assignments" : "EDCT planning"}
          </Typography>
          <Typography sx={{ mr: 1, color: "text.primary" }}>
            {currentTime.toLocaleString(DateTime.TIME_24_WITH_SECONDS)}
          </Typography>
          <IconButton
            component={Link}
            to="/help"
            title="Help"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HelpIcon />
          </IconButton>
          <IconButton
            onClick={toggleMuted}
            aria-label={muted ? "unmute" : "mute"}
          >
            {muted ? <MutedIcon /> : <UnmutedIcon />}
          </IconButton>
          <IconButton
            onClick={toggleDarkMode}
            aria-label={
              mode === "dark" ? "Turndark mode off" : "Turn dark mode on"
            }
          >
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Core page */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {viewOnly ? (
          <VatsimEDCTFlightPlansViewOnly
            onSetSnackbar={setSnackbar}
            isConnected={isConnected}
          />
        ) : (
          <VatsimEDCTFlightPlans
            onSetSnackbar={setSnackbar}
            isConnected={isConnected}
          />
        )}
        <AlertSnackbar {...snackbar} onClose={handleSnackbarClose} />
      </Box>
    </Box>
  );
};

export default Edct;
