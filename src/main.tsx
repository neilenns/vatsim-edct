import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import AppTheme from "./components/AppTheme.tsx";
import { AuthenticationGuard } from "./components/AuthenticationGuard.tsx";
import { AppContextProvider } from "./context/AppContext.tsx";
import { Auth0ProviderWithNavigate } from "./context/Auth0ProviderWithNavigate.tsx";
import "./index.css";
import { AirportCodesLoader } from "./loaders/AirportCodesLoader.tsx";
import CallbackPage from "./pages/Callback.tsx";
import Edct from "./pages/EDCT.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";
import Logout from "./pages/Logout.tsx";
import PendingPage from "./pages/Pending.tsx";
import WelcomePage from "./pages/Welcome.tsx";

const root = document.getElementById("root");

const router = createBrowserRouter([
  {
    children: [
      {
        path: "/",
        element: <WelcomePage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/pending",
        element: <PendingPage />,
        errorElement: <ErrorPage />,
      },
      {
        id: "callback",
        path: "/callback",
        element: <CallbackPage />,
      },
      {
        id: "logout",
        path: "/logout",
        element: <Logout />,
        errorElement: <ErrorPage />,
      },
      {
        children: [
          {
            id: "edct",
            path: "/edct",
            element: <AuthenticationGuard component={Edct} />,
            errorElement: <ErrorPage />,
            loader: AirportCodesLoader,
          },
          {
            id: "view",
            path: "/view",
            element: <Edct />,
            errorElement: <ErrorPage />,
            loader: AirportCodesLoader,
          },
        ],
      },
    ],
  },
]);

root &&
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppContextProvider>
        <Auth0ProviderWithNavigate>
          <AppTheme>
            <RouterProvider router={router} />
          </AppTheme>
        </Auth0ProviderWithNavigate>
      </AppContextProvider>
    </React.StrictMode>
  );
