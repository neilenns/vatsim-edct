import { useMemo } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthenticationGuard } from "../components/AuthenticationGuard";
import { AirportCodesLoader } from "../loaders/AirportCodesLoader";
import Edct from "./EDCT";
import ErrorPage from "./ErrorPage";
import WelcomePage from "./Welcome";
import CallbackPage from "./Callback";
import Logout from "./Logout";

const App = () => {
  const router = useMemo(() => {
    return createBrowserRouter([
      {
        children: [
          {
            path: "/",
            element: <WelcomePage />,
            errorElement: <ErrorPage />,
          },
          {
            path: "/logout",
            element: <Logout />,
            errorElement: <ErrorPage />,
          },
          {
            path: "/callback",
            element: <CallbackPage />,
            errorElement: <ErrorPage />,
          },
          {
            children: [
              {
                id: "edct",
                path: "/edct",
                element: <AuthenticationGuard component={Edct} role="TMU" />,
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
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
