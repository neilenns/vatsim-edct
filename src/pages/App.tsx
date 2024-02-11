import { Logout } from "@mui/icons-material";
import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router-dom";
import { AuthenticationGuard } from "../components/AuthenticationGuard";
import { Auth0ProviderWithNavigate } from "../context/Auth0ProviderWithNavigate";
import { AirportCodesLoader } from "../loaders/AirportCodesLoader";
import CallbackPage from "./Callback";
import Edct from "./EDCT";
import ErrorPage from "./ErrorPage";
import PendingPage from "./Pending";
import WelcomePage from "./Welcome";

const App = () => {
  const router = createBrowserRouter([
    {
      element: <Auth0ProviderWithNavigate />,
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
              element: <AuthenticationGuard role="tmu" component={Edct} />,
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

  return <RouterProvider router={router} />;
};

export default App;
