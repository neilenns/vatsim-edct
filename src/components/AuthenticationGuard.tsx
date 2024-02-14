import { User, useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "./PageLoader";
import { useEffect, useState } from "react";
import { UserWithRoles } from "../context/Auth0ProviderWithNavigate";
import ErrorDisplay from "./ErrorDisplay";
import { Typography } from "@mui/material";

interface AuthenticationGuardProps {
  role: string;
  component: React.ComponentType<object>;
}

export const AuthenticationGuard = ({
  role,
  component: Component,
}: AuthenticationGuardProps) => {
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const { isAuthenticated, user } = useAuth0<User & UserWithRoles>();

  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => <PageLoader />,
  });

  // Perform additional validation after withAuthenticationRequired completes
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!user?.["https://my-app.example.com/roles"]?.includes(role)) {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }

    setIsAuthorizing(false);
  }, [isAuthenticated, user, role]);

  // While authorizing is taking place return the page loader
  if (isAuthorizing) {
    return <PageLoader />;
  }

  // At this point authorization is done so show the content based
  // on the required role.
  if (!isAuthorized) {
    return (
      <ErrorDisplay>
        <Typography>
          You do not have the required permissions to view this page.
        </Typography>
      </ErrorDisplay>
    );
  } else {
    return <AuthenticatedComponent />;
  }
};
