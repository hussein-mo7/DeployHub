import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { isUnauthorizedError } from "@/lib/api-errors";
import { notifySessionExpired } from "@/lib/session-expired";

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

function isAuthBypassRefresh(url: string): boolean {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/verify-email") ||
    url.includes("/auth/resend-verification") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password")
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isAuthBypassRefresh(requestUrl)) {
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
    } catch (refreshError) {
      processQueue(false);
      if (
        isUnauthorizedError(refreshError) &&
        !requestUrl.includes("/auth/me")
      ) {
        notifySessionExpired();
      }
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
