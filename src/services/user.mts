import { IAuth0User } from "../interfaces/IUser.mts";
import http from "../utils/http.mts";

export async function getUserInfo(
  authToken: string,
  sub?: string
): Promise<IAuth0User | undefined> {
  if (!sub) {
    return;
  }

  const response = await http.get(authToken, `users/me`);

  if (response.status === 200) {
    return response.data as IAuth0User;
  } else if (response.status === 401) {
    throw new Error(`Unauthorized`);
  } else {
    throw new Error(response.statusText);
  }
}
