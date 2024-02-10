import { useAuth0 } from "@auth0/auth0-react";
import { Box, Button, Typography } from "@mui/material";

const WelcomePage = () => {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/edct",
      },
    });
  };

  const handleSignup = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/edct",
      },
      authorizationParams: {
        screen_hint: "signup",
      },
    });
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <img
        src="/appicon.svg"
        alt="Airplane taking off"
        width="128"
        height="128"
      />
      <Typography variant="h3" gutterBottom>
        Welcome
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        style={{ marginTop: "16px" }}
        onClick={() => {
          void (async () => {
            await handleLogin();
          })();
        }}
      >
        Login
      </Button>
      <Button
        size="large"
        style={{ marginTop: "8px" }}
        onClick={() => {
          void (async () => {
            await handleSignup();
          })();
        }}
      >
        Sign up
      </Button>
    </Box>
  );
};

export default WelcomePage;
