import type { AxiosError } from "axios";

interface ApiErrorBody {
  error?: {
    message?: string;
    code?: string;
  };
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    return axiosError.response?.data?.error?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
