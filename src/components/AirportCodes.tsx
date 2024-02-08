import { Button, Stack, TextField } from "@mui/material";
import { useFormik } from "formik";
import { useNavigation, useSubmit } from "react-router-dom";
import * as yup from "yup";
import { useAppContext } from "../hooks/useAppContext.mts";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AirportCodesFormData = {
  departureCodes: string;
  arrivalCodes: string;
};

const validationSchema = yup.object({
  departureCodes: yup
    .string()
    .required("At least one departure code is required"),
});

const AirportCodes = () => {
  const submit = useSubmit();
  const navigation = useNavigation();
  const { isConnected, socket } = useAppContext();

  const formik = useFormik<AirportCodesFormData>({
    initialValues: {
      departureCodes: localStorage.getItem("edctDepartureCodes") ?? "",
      arrivalCodes: localStorage.getItem("edctArrivalCodes") ?? "",
    },
    validationSchema,
    onSubmit: (values) => {
      submit(values, { method: "get" });
    },
  });

  const disconnect = () => {
    socket.disconnect();
  };

  return (
    <form method="post" onSubmit={formik.handleSubmit}>
      <Stack direction="row" sx={{ mt: 2, ml: 1 }} spacing={2}>
        <TextField
          id="departureCodes"
          name="departureCodes"
          value={formik.values.departureCodes}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.departureCodes &&
            Boolean(formik.errors.departureCodes)
          }
          helperText={
            formik.touched.departureCodes && formik.errors.departureCodes
          }
        />
        {!isConnected() && (
          <Button type="submit" disabled={navigation.state === "submitting"}>
            Connect
          </Button>
        )}
        {isConnected() && <Button onClick={disconnect}>Disconnect</Button>}
      </Stack>
    </form>
  );
};

export default AirportCodes;
