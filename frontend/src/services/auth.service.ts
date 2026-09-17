import { api } from "./api";
import type { AuthResponse, MessageResponse, RegisterResponse } from "@/types/auth.types";
import type { LoginForm, RegisterForm } from "@/lib/validations/auth.schema";

export async function register(data: RegisterForm): Promise<RegisterResponse> {
  const { confirmPassword: _, ...payload } = data;
  const response = await api.post<RegisterResponse>("/auth/register", payload);
  return response.data;
}

export async function login(data: LoginForm): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getMe(): Promise<AuthResponse> {
  const response = await api.get<AuthResponse>("/auth/me");
  return response.data;
}

export async function updateProfile(data: { name: string }): Promise<AuthResponse> {
  const response = await api.patch<AuthResponse>("/auth/me", data);
  return response.data;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>("/auth/change-password", data);
  return response.data;
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(data: {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>("/auth/reset-password", data);
  return response.data;
}

export async function verifyEmail(token: string): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>("/auth/verify-email", { token });
  return response.data;
}

export async function resendVerification(email: string): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>("/auth/resend-verification", { email });
  return response.data;
}

export async function refreshSession(): Promise<void> {
  await api.post("/auth/refresh");
}
