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
  sonnerToast.error(getApiErrorMessage(error, fallback));
}
