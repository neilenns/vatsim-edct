import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IUser } from "../interfaces/IUser.mts";
import socketIOClient from "socket.io-client";
import { ENV } from "../env.mts";

// This method of setting up app context in TypeScript comes from
// https://gist.github.com/JLarky/5a1642abd8741f2683a817f36dd48e78#file-darkcontextminimal-tsx
export type SetUserFunction = Dispatch<
  SetStateAction<Partial<IUser> | undefined>
>;

const useProviderValue = () => {
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
      auth: { token: ENV.VITE_API_KEY },
    })
  );

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
    }),
    [muted, autoHideImported, hideInformational, streamingMode, socket]
  );
};

type Context = ReturnType<typeof useProviderValue>;

export const AppContext = createContext<Context | undefined>(undefined);
AppContext.displayName = "AppContext"; // For debugging

export const AppContextProvider = (props: PropsWithChildren) => {
  const value = useProviderValue();

  return <AppContext.Provider value={value} {...props} />;
};
