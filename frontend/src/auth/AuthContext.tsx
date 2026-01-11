import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "./token";
import { login as apiLogin, me as apiMe, type UserRead } from "../api/auth";

type AuthState = {
  token: string | null;
  user: UserRead | null;
  isLoading: boolean;
  error: string | null;
  sessionExpired?: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshMe: (token?: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokenState, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<UserRead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionExpired, setSessionExpired] = useState(false);

  async function refreshMe(currentToken?: string) {
    const t = currentToken ?? tokenState;
    if (!t) {
      setUser(null);
      return;
    }
    // We don't set isLoading(true) here because it might be a background refresh
    const u = await apiMe(t);
    setUser(u);
  }

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    setSessionExpired(false);
    try {
      const res = await apiLogin({ email, password });
      setToken(res.access_token);
      setTokenState(res.access_token);
      await refreshMe(res.access_token);
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
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
        // If it was a credential validation error, it likely means expired.
        // We set a special flag so UI can optionally show "Session expired"
        if (e?.message?.includes('validate credentials') || e?.message?.includes('401')) {
          setSessionExpired(true);
        } else {
          setError(e?.message ?? "Auth error");
        }
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
    sessionExpired,
    signIn,
    signOut,
    refreshMe,
  }), [tokenState, user, isLoading, error, sessionExpired]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
