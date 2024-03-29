import { DateTime } from "luxon";
import { IVatsimFlightPlan } from "../interfaces/IVatsimFlightPlan.mts";
import http from "../utils/http.mts";

export async function updateEdct(
  authToken: string,
  _id: string | undefined,
  sentEDCT: boolean,
  EDCT: DateTime | null | undefined
): Promise<IVatsimFlightPlan | undefined> {
  if (!_id) {
    return;
  }

  const response = await http
    .authorized(authToken)
    .put(`vatsim/flightPlans/edct`, {
      _id,
      sentEDCT,
      EDCT: EDCT === undefined ? undefined : EDCT?.toISO() ?? null,
    });

  if (response.status === 200) {
    return response.data as IVatsimFlightPlan;
  } else if (response.status === 401) {
    throw new Error(`Unauthorized`);
  } else {
    throw new Error(response.statusText);
  }
}
