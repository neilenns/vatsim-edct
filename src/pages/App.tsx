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
            element: <Callback />,
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
