import { createContext, useState } from "react";
import socketIOClient, { Socket } from "socket.io-client";
import { ENV } from "../env.mjs";

// From https://blog.logrocket.com/how-to-use-react-context-typescript/

interface Props {
  children: React.ReactNode;
}

export const SocketContext = createContext<Socket | null>(null);

const SocketProvider = ({ children }: Props) => {
  const [socket] = useState(
    socketIOClient(ENV.VITE_SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token: ENV.VITE_API_KEY },
    })
  );

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
