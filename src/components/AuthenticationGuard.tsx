import { User, useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "./PageLoader";
import { useEffect, useState } from "react";
import { UserWithRoles } from "../context/Auth0ProviderWithNavigate";
import ErrorDisplay from "./ErrorDisplay";
import { Typography } from "@mui/material";
import { getUserInfo } from "../services/user.mts";
import { useAppContext } from "../hooks/useAppContext.mts";

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
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0<
    User & UserWithRoles
  >();
  const { userInfo, setUserInfo } = useAppContext();

  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => <PageLoader />,
  });

  // Perform additional validation after withAuthenticationRequired completes
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Async method to fetch the user info and verify the role.
    // This way of calling async inside useEffect comes from https://devtrium.com/posts/async-functions-useeffect.
    const fetchData = async () => {
      const userInfo = await getUserInfo(
        await getAccessTokenSilently(),
        user?.sub
      );

      setUserInfo(userInfo);

      if (!userInfo?.roles.includes(role)) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }

      setIsAuthorizing(false);
    };

    // Actually call the async method
    fetchData().catch((err) => {
      console.error(err);
    });
  }, [isAuthenticated, user, role, getAccessTokenSilently, setUserInfo]);

  // While authorizing is taking place return the page loader
  if (isAuthorizing) {
    return <PageLoader />;
  }

  // Pending users get told to hang tight.
  if (userInfo?.isPending) {
    return (
      <ErrorDisplay>
        <Typography align="center">
          Your account is pending approval.
          <br />
          You&apos;ll receive an email once your account is activated.
        </Typography>
      </ErrorDisplay>
    );
  }

  // Unauthorized users get denied.
  if (!isAuthorized) {
    return (
      <ErrorDisplay>
        <Typography align="center">
          You do not have the required permissions to view this page.
        </Typography>
      </ErrorDisplay>
    );
  }
  // Authenticated gets to see the component.
  else {
    return <AuthenticatedComponent />;
  }
};
