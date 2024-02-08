import { LoaderFunction } from "react-router";

export const AirportCodesLoader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);

  return {
    departureCodes: url.searchParams.get("d"),
    arrivalCodes: url.searchParams.get("a"),
  };
};
