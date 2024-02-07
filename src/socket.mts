import socketIOClient from "socket.io-client";
import { ENV } from "./env.mjs";

const socket = socketIOClient(ENV.VITE_SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  auth: { token: ENV.VITE_API_KEY },
});

export default socket;
