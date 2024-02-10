import React from "react";
import ReactDOM from "react-dom/client";
import AppTheme from "./components/AppTheme.tsx";
import { AppContextProvider } from "./context/AppContext.tsx";
import "./index.css";
import App from "./pages/App.tsx";

const root = document.getElementById("root");

root &&
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppContextProvider>
        <AppTheme>
          <App />
        </AppTheme>
      </AppContextProvider>
    </React.StrictMode>
  );
