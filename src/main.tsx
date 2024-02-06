import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppTheme from "./components/AppTheme.tsx";
import { AuthenticationGuard } from "./components/AuthenticationGuard.tsx";
import { AppContextProvider } from "./context/AppContext.tsx";
import "./index.css";

// Routes
import App from "./pages/App.tsx";
import Edct from "./pages/EDCT.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";
import LoginSignup from "./pages/LoginSignup.tsx";
import Logout from "./pages/Logout.tsx";
import WelcomePage from "./pages/Welcome.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomePage />,
    errorElement: <ErrorPage />,
  },
  {
    id: "login",
    path: "/login",
    element: <LoginSignup />,
    errorElement: <ErrorPage />,
  },
  {
    id: "signup",
    path: "/signup",
    element: <LoginSignup />,
    errorElement: <ErrorPage />,
  },
  {
    id: "logout",
    path: "/logout",
    element: <Logout />,
    errorElement: <ErrorPage />,
  },
  {
    element: <App />,
    children: [
      {
        id: "edct",
        path: "/edct",
        element: <AuthenticationGuard role="user" component={<Edct />} />,
        errorElement: <ErrorPage />,
      },
      {
        id: "view",
        path: "/view",
        element: <Edct />,
        errorElement: <ErrorPage />,
      },
    ],
  },
]);

const root = document.getElementById("root");

root &&
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppContextProvider>
        <AppTheme>
          <RouterProvider router={router} />
        </AppTheme>
      </AppContextProvider>
    </React.StrictMode>
  );
