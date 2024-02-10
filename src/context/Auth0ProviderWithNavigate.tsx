import { Auth0Provider, LogoutOptions, User } from "@auth0/auth0-react";
import { Outlet, useNavigate } from "react-router-dom";
import { ENV } from "../env.mts";

interface AppState {
  returnTo?: string;
}

export type LogoutMethod = (options?: LogoutOptions) => Promise<void>;

export interface UserWithRoles extends User {
  "https://my-app.example.com/roles"?: string[];
}

export const Auth0ProviderWithNavigate = () => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo ?? window.location.pathname);
  };

  if (
    !(
      ENV.VITE_AUTH0_DOMAIN &&
      ENV.VITE_AUTH0_CLIENT_ID &&
      ENV.VITE_AUTH0_CALLBACK_URL
    )
  ) {
    return null;
  }

  return (
    <Auth0Provider
      domain={ENV.VITE_AUTH0_DOMAIN}
      clientId={ENV.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: ENV.VITE_AUTH0_CALLBACK_URL,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      <Outlet />
    </Auth0Provider>
  );
};
