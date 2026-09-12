import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

function processQueue(success: boolean) {
  refreshQueue.forEach((callback) => callback(success));
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/verify-email") ||
      requestUrl.includes("/auth/resend-verification");

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((success) => {
          if (success) {
            resolve(api(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/refresh");
      processQueue(true);
      return api(originalRequest);
    } catch {
      processQueue(false);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export async function checkHealth() {
  const { data } = await api.get("/health");
  return data;
}
