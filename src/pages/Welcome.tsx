import { Box, Typography, Button } from "@mui/material";
import { Link, Navigate } from "react-router-dom";

const WelcomePage = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token !== null && token !== "") {
    if (role === "admin") {
      return <Navigate to="/edct" />;
    }

    return <Navigate to="/edct" />;
  }

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
        component={Link}
        to="/login"
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
