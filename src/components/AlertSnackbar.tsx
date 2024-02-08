import {
  Alert,
  AlertProps,
  Snackbar,
  SnackbarCloseReason,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { ENV } from "../env.mts";
import { useAppContext } from "../hooks/useAppContext.mts";

export type AlertSnackBarOnClose = (reason: SnackbarCloseReason) => undefined;

export type AlertSnackbarProps = {
  children?: AlertProps["children"] | null;
  severity?: AlertProps["severity"] | undefined;
} | null;

const AlertSnackbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { snackbar, setSnackbar } = useAppContext();

  useEffect(() => {
    if (snackbar === null) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [snackbar, setSnackbar]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    !!snackbar?.children && (
      <Snackbar
        open={isOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={handleClose}
        autoHideDuration={ENV.VITE_SNACKBAR_AUTOHIDE_DURATION}
      >
        <Alert severity={snackbar.severity}>{snackbar.children}</Alert>
      </Snackbar>
    )
  );
};

export default AlertSnackbar;
