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
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import VatsimEDCTFlightPlans from "../components/EDCTFlightPlans";
import VatsimEDCTFlightPlansViewOnly from "../components/EDCTFlightPlansViewOnly";
import useAppContext from "../context/AppContext";

const Edct = () => {
  const viewOnly = useLocation().pathname === "/view";
  const { mode, setMode } = useColorScheme();
  const { muted, setMuted } = useAppContext();
  const [currentTime, setCurrentTime] = useState<DateTime>(DateTime.utc());

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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* AppBar */}
      <AppBar
        position="static"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {viewOnly ? "EDCT" : "EDCT planning"}
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
          <VatsimEDCTFlightPlansViewOnly />
        ) : (
          <VatsimEDCTFlightPlans />
        )}
      </Box>
    </Box>
  );
};

export default Edct;
