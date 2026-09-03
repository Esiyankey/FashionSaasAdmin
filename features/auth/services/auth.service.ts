import { apiClient } from "@/services/http-client";
import type { AuthSession, AuthUser, ForgotPasswordInput, LoginInput, ResetPasswordInput } from "../types";

export function login(input: LoginInput): Promise<AuthSession> {
  return apiClient.post<AuthSession>("/admin/auth/login", { body: input });
}

export function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  return apiClient.post<void>("/admin/auth/forgot-password", { body: input });
}

export function resetPassword(input: ResetPasswordInput): Promise<void> {
  return apiClient.post<void>("/admin/auth/reset-password", { body: input });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiClient.get<AuthUser>("/admin/auth/me");
}

export function logout(): Promise<void> {
  return apiClient.post<void>("/admin/auth/logout");
}
