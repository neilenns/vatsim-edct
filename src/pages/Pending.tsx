import { Box, Typography } from "@mui/material";

const PendingPage = () => {
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
    </Box>
  );
};

export default PendingPage;
