import {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import socketIOClient from "socket.io-client";
import { AlertSnackbarProps } from "../components/AlertSnackbar";
import { ENV } from "../env.mts";
import { IAuth0User } from "../interfaces/IAuth0User.mts";
import { useImmer } from "use-immer";

const useProviderValue = () => {
  const [snackbar, setSnackbar] = useState<AlertSnackbarProps>(null);
  const [muted, setMuted] = useState(localStorage.getItem("muted") === "true"); // Results in a default vaue of false
  const [socket] = useState(
    socketIOClient(ENV.VITE_SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
    })
  );
  const [userInfo, setUserInfo] = useImmer<IAuth0User | undefined>(undefined);

  // Save to local storage so on page refresh this isn't lost. So dumb. Why do people use context?
  useEffect(() => {
    localStorage.setItem("muted", muted.toString());
  }, [muted]);

  const isConnected = useCallback(() => {
    return socket.connected;
  }, [socket]);

  return useMemo(
    () => ({
      muted,
      setMuted,
      socket,
      snackbar,
      setSnackbar,
      isConnected,
      userInfo,
      setUserInfo,
    }),
    [muted, socket, snackbar, isConnected, userInfo, setUserInfo]
  );
};

type Context = ReturnType<typeof useProviderValue>;

export const AppContext = createContext<Context | undefined>(undefined);
AppContext.displayName = "AppContext"; // For debugging

export const AppContextProvider = (props: PropsWithChildren) => {
  const value = useProviderValue();

  return <AppContext.Provider value={value} {...props} />;
};
