import { LoaderFunction } from "react-router";

const cleanCodes = (codes: string | null): string => {
  if (!codes) {
    return "";
  }
  return codes
    .split(",")
    .map((code) => code.trim())
    .join(",");
};

export const AirportCodesLoader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);

  return {
    departureCodes: cleanCodes(url.searchParams.get("departureCodes")),
    arrivalCodes: cleanCodes(url.searchParams.get("arrivalCodes")),
  };
};
