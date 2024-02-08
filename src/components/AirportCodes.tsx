import { Button, Stack, TextField } from "@mui/material";
import { useFormik } from "formik";
import { useLoaderData, useNavigation, useSubmit } from "react-router-dom";
import * as yup from "yup";
import { useAppContext } from "../hooks/useAppContext.mts";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AirportCodesFormData = {
  showArrivalCodes: boolean;
  departureCodes: string;
  arrivalCodes: string;
};

const validationSchema = yup.object({
  // This is a hidden field in the form that gets used to conditionally validate the arrival codes
  showArrivalCodes: yup.boolean(),
  departureCodes: yup.string().required("Airport code is required"),
  arrivalCodes: yup.string().when("showArrivalCodes", {
    is: true,
    then: (schema) => schema.required("Airport code is required"),
  }),
});

interface AirportCodesProps {
  showArrivalCodes?: boolean;
}

const AirportCodes = ({ showArrivalCodes }: AirportCodesProps) => {
  const submit = useSubmit();
  const navigation = useNavigation();
  const { isConnected, socket } = useAppContext();
  const { departureCodes, arrivalCodes } =
    useLoaderData() as AirportCodesFormData;

  const formik = useFormik<AirportCodesFormData>({
    initialValues: {
      showArrivalCodes: showArrivalCodes ?? false,
      departureCodes,
      arrivalCodes,
    },
    validationSchema,
    onSubmit: (values) => {
      if (
        departureCodes === values.departureCodes &&
        arrivalCodes === values.arrivalCodes
      ) {
        // If the codes didn't change then just reconnect the socket.
        socket.connect();
      } else {
        // replace: true prevents the history stack from filling with garbage.
        // It comes from https://reactrouter.com/en/main/start/tutorial#managing-the-history-stack
        submit(values, { replace: true });
      }
    },
  });

  return (
    <form method="post" onSubmit={formik.handleSubmit}>
      <Stack direction="row" sx={{ mt: 2, ml: 1 }} spacing={2}>
        <input
          type="checkbox"
          id="showArrivalCodes"
          name="showArrivalCodes"
          hidden
        />
        <TextField
          id="departureCodes"
          name="departureCodes"
          label="Departure airports"
          required
          value={formik.values.departureCodes}
          onChange={(e) => {
            formik.handleChange(e);
            socket.disconnect();
          }}
          onBlur={formik.handleBlur}
          error={
            formik.touched.departureCodes &&
            Boolean(formik.errors.departureCodes)
          }
          helperText={
            formik.touched.departureCodes && formik.errors.departureCodes
          }
        />
        {showArrivalCodes && (
          <TextField
            id="arrivalCodes"
            name="arrivalCodes"
            label="Arrival airports"
            value={formik.values.arrivalCodes}
            required
            onChange={(e) => {
              formik.handleChange(e);
              socket.disconnect();
            }}
            onBlur={formik.handleBlur}
            error={
              formik.touched.arrivalCodes && Boolean(formik.errors.arrivalCodes)
            }
            helperText={
              formik.touched.arrivalCodes && formik.errors.arrivalCodes
            }
          />
        )}
        {!isConnected() && (
          <Button type="submit" disabled={navigation.state === "submitting"}>
            Connect
          </Button>
        )}
        {isConnected() && (
          <Button
            onClick={() => {
              socket.disconnect();
            }}
          >
            Disconnect
          </Button>
        )}
      </Stack>
    </form>
  );
};

export default AirportCodes;
