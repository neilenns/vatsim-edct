import { useMemo } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthenticationGuard } from "../components/AuthenticationGuard";
import { AirportCodesLoader } from "../loaders/AirportCodesLoader";
import Callback from "./Callback";
import Edct from "./EDCT";
import ErrorPage from "./ErrorPage";
import Logout from "./Logout";
import WelcomePage from "./Welcome";

const App = () => {
  const router = useMemo(() => {
    return createBrowserRouter([
      {
        errorElement: <ErrorPage />,
        children: [
          {
            path: "/",
            element: <WelcomePage />,
          },
          {
            path: "/logout",
            element: <Logout />,
          },
          {
            path: "/callback",
            element: <Callback />,
          },
          {
            children: [
              {
                id: "edct",
                path: "/edct",
                element: <AuthenticationGuard component={Edct} role="TMU" />,
                loader: AirportCodesLoader,
              },
              {
                id: "view",
                path: "/view",
                element: <Edct />,
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
