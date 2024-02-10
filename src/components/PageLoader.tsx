import { Box, CircularProgress } from "@mui/material";

export const PageLoader = () => {
  return (
    <Box
      sx={{
        width: 100,
        height: 100,
        display: "flex",
        margin: "auto",
      }}
    >
      <CircularProgress />
    </Box>
  );
};
