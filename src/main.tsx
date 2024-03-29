import React from "react";
import ReactDOM from "react-dom/client";
import AppTheme from "./components/AppTheme.tsx";
import { AppContextProvider } from "./context/AppContext.tsx";
import { Auth0ProviderWithNavigate } from "./context/Auth0ProviderWithNavigate.tsx";
import "./index.css";
import App from "./pages/App.tsx";
import { SnackbarProvider } from "notistack";
import { ENV } from "./env.mts";

const root = document.getElementById("root");

root &&
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppContextProvider>
        <Auth0ProviderWithNavigate>
          <AppTheme>
            <SnackbarProvider
              autoHideDuration={ENV.VITE_SNACKBAR_AUTOHIDE_DURATION}
              preventDuplicate={true}
              anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
            >
              <App />
            </SnackbarProvider>
          </AppTheme>
        </Auth0ProviderWithNavigate>
      </AppContextProvider>
    </React.StrictMode>
  );
