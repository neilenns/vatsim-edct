import socketIOClient from "socket.io-client";
import { ENV } from "./env.mjs";

const socket = socketIOClient(ENV.VITE_SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
});

export default socket;
