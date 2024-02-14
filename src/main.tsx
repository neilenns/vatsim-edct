import React from "react";
import ReactDOM from "react-dom/client";
import AppTheme from "./components/AppTheme.tsx";
import { AppContextProvider } from "./context/AppContext.tsx";
import { Auth0ProviderWithNavigate } from "./context/Auth0ProviderWithNavigate.tsx";
import "./index.css";
import App from "./pages/App.tsx";

const root = document.getElementById("root");

root &&
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppContextProvider>
        <Auth0ProviderWithNavigate>
          <AppTheme>
            <App />
          </AppTheme>
        </Auth0ProviderWithNavigate>
      </AppContextProvider>
    </React.StrictMode>
  );
