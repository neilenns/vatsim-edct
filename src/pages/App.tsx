import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthenticationGuard } from "../components/AuthenticationGuard";
import { AirportCodesLoader } from "../loaders/AirportCodesLoader";
import Edct from "./EDCT";
import ErrorPage from "./ErrorPage";
import WelcomePage from "./Welcome";

const App = () => {
  const { getAccessTokenSilently } = useAuth0();

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
  }, [getAccessTokenSilently]);

  return <RouterProvider router={router} />;
};

export default App;
