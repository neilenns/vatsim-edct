import { ActionFunctionArgs, redirect } from "react-router";
import { AirportCodesFormData } from "../components/AirportCodes";

const cleanCodes = (codes: string): string => {
  return codes
    .split(",")
    .map((code) => code.trim())
    .join(",");
};

const AirportCodesAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const values = Object.fromEntries(formData) as AirportCodesFormData;

  // Clean up the airport codes and save them to local storage for
  // pre-filling the form on future loads
  const cleanedDepartureCodes = cleanCodes(values.departureCodes);
  localStorage.setItem("edctDepartureCodes", cleanedDepartureCodes);

  return redirect(`/view?d=${values.departureCodes}`);
};

export default AirportCodesAction;
