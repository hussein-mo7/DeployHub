import { create } from "zustand";
import * as authService from "@/services/auth.service";
import type { User } from "@/types/auth.types";
import type { LoginForm, RegisterForm, UpdateProfileForm } from "@/lib/validations/auth.schema";

interface AuthState {
  user: User | null;
  accessTokenTtlSeconds: number | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  register: (data: RegisterForm) => Promise<{ email: string }>;
  login: (data: LoginForm) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
  updateProfile: (data: UpdateProfileForm) => Promise<void>;
  clearError: () => void;
}

function applyAuthResponse(
  set: (partial: Partial<AuthState>) => void,
  response: { user: User; session: { accessTokenTtlSeconds: number } },
  extra?: Partial<AuthState>,
) {
  set({
    user: response.user,
    accessTokenTtlSeconds: response.session.accessTokenTtlSeconds,
    ...extra,
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessTokenTtlSeconds: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      const response = await authService.getMe();
      applyAuthResponse(set, response, { isInitialized: true });
    } catch {
      set({ user: null, accessTokenTtlSeconds: null, isInitialized: true });
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
      const response = await authService.login(data);
      applyAuthResponse(set, response, { isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, "Login failed"),
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ user: null, accessTokenTtlSeconds: null });
    }
  },

  clearSession: () => set({ user: null, accessTokenTtlSeconds: null }),

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.updateProfile(data);
      applyAuthResponse(set, response, { isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, "Failed to update profile"),
      });
      throw error;
    }
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
