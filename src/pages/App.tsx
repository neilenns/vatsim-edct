import { useAuth0 } from "@auth0/auth0-react";
import { Outlet } from "react-router-dom";
import { PageLoader } from "../components/PageLoader";

const App = () => {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return <PageLoader />;
  } else {
    return <Outlet />;
  }
};

export default App;
