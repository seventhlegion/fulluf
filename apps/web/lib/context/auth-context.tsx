"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GetTokenFn } from "@/lib/helpers/http";
import {
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  getUsernameFromCookie,
} from "@/lib/cookies";
import { refresh } from "@/lib/api/requests";
import { isTokenExpired } from "@/lib/jwt";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  getToken: GetTokenFn;
  setAuth: (accessToken: string, refreshToken: string, username: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    username: null,
  });
  const [ready, setReady] = useState(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    setState({
      accessToken: getAccessTokenFromCookie(),
      refreshToken: getRefreshTokenFromCookie(),
      username: getUsernameFromCookie(),
    });
    setReady(true);
  }, []);

  const getToken = useCallback<GetTokenFn>(() => {
    if (state.accessToken && !isTokenExpired(state.accessToken)) {
      return state.accessToken;
    }
    if (typeof window !== "undefined") {
      const access = getAccessTokenFromCookie();
      const refreshTok = getRefreshTokenFromCookie();
      if (access && !isTokenExpired(access)) return access;
      if (refreshTok && !isTokenExpired(refreshTok)) {
        if (!refreshPromiseRef.current) {
          refreshPromiseRef.current = refresh(refreshTok)
            .then((res) => {
              setAuthCookies(res.accessToken, res.refreshToken, res.username);
              setState({
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                username: res.username,
              });
              return res.accessToken;
            })
            .catch(() => {
              clearAuthCookies();
              setState({
                accessToken: null,
                refreshToken: null,
                username: null,
              });
              return null;
            })
            .finally(() => {
              refreshPromiseRef.current = null;
            });
        }
        return refreshPromiseRef.current;
      }
    }
    return null;
  }, [state.accessToken, state.refreshToken]);

  const setAuth = useCallback(
    (accessToken: string, refreshToken: string, username: string) => {
      setAuthCookies(accessToken, refreshToken, username);
      setState({ accessToken, refreshToken, username });
    },
    [],
  );

  const clearAuth = useCallback(() => {
    clearAuthCookies();
    setState({
      accessToken: null,
      refreshToken: null,
      username: null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      getToken,
      setAuth,
      clearAuth,
      isAuthenticated: !!(state.accessToken || state.refreshToken),
      ready,
    }),
    [state, getToken, setAuth, clearAuth, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
