import { create } from "zustand";
import * as authService from "@/services/auth.service";
import type { User } from "@/types/auth.types";
import type { LoginForm, RegisterForm } from "@/lib/validations/auth.schema";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  register: (data: RegisterForm) => Promise<{ email: string }>;
  login: (data: LoginForm) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      const { user } = await authService.getMe();
      set({ user, isInitialized: true });
    } catch {
      set({ user: null, isInitialized: true });
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(data);
      set({ isLoading: false });
      return { email: result.email };
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, "Registration failed"),
      });
      throw error;
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.login(data);
      set({ user, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, "Login failed"),
      });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));

export function getAuthErrorCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "error" in error.response.data &&
    error.response.data.error &&
    typeof error.response.data.error === "object" &&
    "code" in error.response.data.error &&
    typeof error.response.data.error.code === "string"
  ) {
    return error.response.data.error.code;
  }
  return undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "error" in error.response.data &&
    error.response.data.error &&
    typeof error.response.data.error === "object" &&
    "message" in error.response.data.error &&
    typeof error.response.data.error.message === "string"
  ) {
    return error.response.data.error.message;
  }
  return fallback;
}
