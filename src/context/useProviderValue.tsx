import { useCallback, useEffect, useMemo, useState } from "react";
import socketIOClient from "socket.io-client";
import { AlertSnackbarProps } from "../components/AlertSnackbar";
import { ENV } from "../env.mts";
import { IAuth0User } from "../interfaces/IAuth0User.mts";
import { useImmer } from "use-immer";

export const useProviderValue = () => {
  const [snackbar, setSnackbar] = useState<AlertSnackbarProps>(null);
  const [muted, setMuted] = useState(localStorage.getItem("muted") === "true"); // Results in a default vaue of false
  const [autoHideImported, setAutoHideImported] = useState(
    localStorage.getItem("autoHideImported") === "true" // Results in a default vaue of false
  );
  const [hideInformational, setHideInformational] = useState(
    localStorage.getItem("autoHideInformational") !== "false" // Results in a default vaue of true
  );
  const [streamingMode, setStreamingMode] = useState(
    localStorage.getItem("streamingMode") == "true" // Results in a default vaue of false
  );
  const [socket] = useState(
    socketIOClient(ENV.VITE_SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
    })
  );
  const [userInfo, setUserInfo] = useImmer<IAuth0User | undefined>();

  // Save to local storage so on page refresh this isn't lost. So dumb. Why do people use context?
  useEffect(() => {
    localStorage.setItem("muted", muted.toString());
  }, [muted]);

  useEffect(() => {
    localStorage.setItem("autoHideImported", autoHideImported.toString());
  }, [autoHideImported]);

  useEffect(() => {
    localStorage.setItem("hideInformational", hideInformational.toString());
  }, [hideInformational]);

  useEffect(() => {
    localStorage.setItem("streamingMode", streamingMode.toString());
  }, [streamingMode]);

  const isConnected = useCallback(() => {
    return socket.connected;
  }, [socket]);

  return useMemo(
    () => ({
      muted,
      setMuted,
      autoHideImported,
      setAutoHideImported,
      hideInformational,
      setHideInformational,
      streamingMode,
      setStreamingMode,
      socket,
      snackbar,
      setSnackbar,
      isConnected,
      userInfo,
      setUserInfo,
    }),
    [
      muted,
      autoHideImported,
      hideInformational,
      streamingMode,
      socket,
      snackbar,
      isConnected,
      userInfo,
    ]
  );
};
