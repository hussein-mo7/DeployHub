import axios from "axios";
import { toast as sonnerToast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error";

export const toast = sonnerToast;

export function toastSuccess(message: string): void {
  sonnerToast.success(message);
}

export function toastError(message: string): void {
  sonnerToast.error(message);
}

export function toastApiError(error: unknown, fallback: string): void {
  let message = getApiErrorMessage(error, fallback);
  if (axios.isAxiosError(error) && error.response?.status === 503) {
    message = `${message} Start the worker (npm run worker) if deploys or SSH install stay pending.`;
  }
  sonnerToast.error(message);
}
