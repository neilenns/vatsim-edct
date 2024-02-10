import { useAuth0 } from "@auth0/auth0-react";
import { Box, Button, Typography } from "@mui/material";

const PendingPage = () => {
  const { logout } = useAuth0();

  const handleSignout = async () => {
    await logout({
      logoutParams: {
        returnTo: window.location.origin,
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
      <Typography sx={{ textAlign: "center" }}>
        Your account is pending approval.
        <br />
        You&apos;ll receive an email once your account is activated.
      </Typography>
      <Button
        size="large"
        style={{ marginTop: "8px" }}
        onClick={() => {
          void (async () => {
            await handleSignout();
          })();
        }}
      >
        Sign out
      </Button>
    </Box>
  );
};

export default PendingPage;
