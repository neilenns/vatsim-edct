import { GlobalStyles, useTheme } from "@mui/material";

const GlobalAppStyles = () => {
  const theme = useTheme();

  const styles = {
    "& .vatsim--callsign": {
      fontWeight: "bold",
      cursor: "pointer",
    },
    "& .vatsim--prefile": {
      fontStyle: "italic",
    },
    "& .vatsim--new": {
      color: theme.palette.success.main,
    },
    "& .vatsim--updated": {
      color: theme.palette.error.main,
    },
    "& .vatsim-imported": {
      color: theme.palette.text.primary,
    },
  };

  return <GlobalStyles styles={styles} />;
};

export default GlobalAppStyles;
