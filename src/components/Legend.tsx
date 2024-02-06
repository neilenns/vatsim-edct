import { Typography } from "@mui/material";

const Legend = () => {
  return (
    <Typography>
      Legend: <span className="vatsim--prefile">Prefile</span>{" "}
      <span className="vatsim--new">New</span>{" "}
      <span className="vatsim--updated">Updated</span>
    </Typography>
  );
};

export default Legend;
