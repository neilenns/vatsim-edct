import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import socketIOClient, { Socket } from "socket.io-client";
import SocketContext from "../context/SocketContext";
import { ENV } from "../env.mjs";
import ILoginResponse from "../interfaces/ILoginResponse.mts";
import http from "../utils/http.mts";

const App = () => {
  const [socket] = useState<Socket>(
    socketIOClient(ENV.VITE_SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token: ENV.VITE_API_KEY },
    })
  );

  const navigate = useNavigate();

  const verifyUser = useCallback(() => {
    http
      .post<ILoginResponse>("refreshToken", {})
      .then((response) => {
        setTimeout(verifyUser, 5 * 60 * 1000);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);
      })
      .catch(() => {
        localStorage.clear();
      });
  }, []);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  // Watch for changes to local storage for a logout key and if it's there that
  // means the site was logged out in a different tab. Refresh the page and log out!
  const syncLogout = useCallback(
    (event: StorageEvent) => {
      if (event.key === "logout") {
        navigate("/");
      }
    },
    [navigate]
  );

  // Register for events on local storage to watch for cross-tab logout.
  useEffect(() => {
    window.addEventListener("storage", syncLogout);
    return () => {
      window.removeEventListener("storage", syncLogout);
    };
  }, [syncLogout]);

  return (
    <SocketContext.Provider value={socket}>
      <Outlet />
    </SocketContext.Provider>
  );
};

export default App;
