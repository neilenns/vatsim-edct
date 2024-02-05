import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { AppContextProvider } from "./context/AppContext.tsx";
import AppTheme from "./components/AppTheme.tsx";
import { AuthenticationGuard } from "./components/AuthenticationGuard.tsx";

// Routes
import ErrorPage from "./pages/ErrorPage.tsx";
import LoginSignup from "./pages/LoginSignup.tsx";
import Logout from "./pages/Logout.tsx";
import WelcomePage from "./pages/Welcome.tsx";
import EDCT from "./pages/EDCT.tsx";
import App from "./pages/App.tsx";

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
        element: (
          <AuthenticationGuard role="user" component={<EDCT name="Test" />} />
        ),
        errorElement: <ErrorPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppContextProvider>
      <AppTheme>
        <RouterProvider router={router} />
      </AppTheme>
    </AppContextProvider>
  </React.StrictMode>
);
