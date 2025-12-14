import { apiFetch } from "./client";

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  birth_date?: string | null; // YYYY-MM-DD
  gender?: string | null;
};

export type UserRead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  timezone: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export function register(payload: RegisterPayload): Promise<UserRead> {
  return apiFetch<UserRead>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function me(token: string): Promise<UserRead> {
  return apiFetch<UserRead>("/auth/me", { method: "GET" }, token);
}
