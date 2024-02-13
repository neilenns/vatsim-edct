import { ActionFunction } from "react-router";

const cleanCodes = (codes: string | null): string | null => {
  if (!codes) {
    return null;
  }
  return codes
    .split(",")
    .map((code) => code.trim())
    .join(",");
};

interface AppAction {
  getAccessTokenSilently: () => Promise<string>; // <-- or whatever this needs to be
}

export const AirportCodesLoader =
  ({ getAccessTokenSilently }: AppAction): ActionFunction =>
  async ({ request }) => {
    const url = new URL(request.url);

    console.log(await getAccessTokenSilently());
    return {
      departureCodes: cleanCodes(url.searchParams.get("departureCodes")) ?? "",
      arrivalCodes: cleanCodes(url.searchParams.get("arrivalCodes")) ?? "",
    };
  };
