import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "./PageLoader";

interface AuthenticationGuardProps {
  role: "admin" | "user";
  component: React.ComponentType<object>;
}

export const AuthenticationGuard = ({
  component,
}: AuthenticationGuardProps) => {
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => (
      <div className="page-layout">
        <PageLoader />
      </div>
    ),
  });

  return <Component />;
};
