import { useAuth0 } from "@auth0/auth0-react";
import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const WelcomePage = () => {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/edct",
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
        component={Link}
        to="/signup"
      >
        Sign up
      </Button>
    </Box>
  );
};

export default WelcomePage;
