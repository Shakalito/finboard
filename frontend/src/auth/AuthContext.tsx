import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "./token";
import { login as apiLogin, me as apiMe, type UserRead } from "../api/auth";

type AuthState = {
  token: string | null;
  user: UserRead | null;
  isLoading: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokenState, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<UserRead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshMe() {
    if (!tokenState) {
      setUser(null);
      return;
    }
    const u = await apiMe(tokenState);
    setUser(u);
  }

  async function signIn(email: string, password: string) {
    setError(null);
    const res = await apiLogin({ email, password });
    setToken(res.access_token);
    setTokenState(res.access_token);
    await refreshMe();
  }

  function signOut() {
    clearToken();
    setTokenState(null);
    setUser(null);
  }

  useEffect(() => {
    // on application startup: if token is in localStorage, get /me
    (async () => {
      setIsLoading(true);
      try {
        if (tokenState) await refreshMe();
      } catch (e: any) {
        // invalid token/expired → log out
        signOut();
        setError(e?.message ?? "Auth error");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(() => ({
    token: tokenState,
    user,
    isLoading,
    error,
    signIn,
    signOut,
    refreshMe,
  }), [tokenState, user, isLoading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
