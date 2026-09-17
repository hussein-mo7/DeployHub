import axios from "axios";

/** True when the server responded 401 (session actually invalid). */
export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/** True when the request never reached the API (backend down, proxy refused, etc.). */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response == null;
}
