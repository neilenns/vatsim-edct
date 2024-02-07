import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const useSocket = () => {
  const socket = useContext(SocketContext);

  if (!socket) {
    throw new Error("useSocket has to be used within <SocketProvider>");
  }

  return socket;
};

export default useSocket;
