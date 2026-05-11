import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { clearAccessToken, getAccessToken, setAccessToken } from "./tokenStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setTokenState] = useState(() => getAccessToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((token) => {
    setTokenState(token);
    setAccessToken(token);
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setTokenState("");
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    const res = await http.get("/auth/me");
    setUser(res.data.user);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await http.post("/auth/login", { email, password });
    setToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, [setToken]);

  const register = useCallback(async ({ email, password, fullName, role }) => {
    const res = await http.post("/auth/register", { email, password, fullName, role });
    setToken(res.data.accessToken);
    setUser(res.data.user);
  }, [setToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshMe();
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout, refreshMe]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      loading,
      login,
      register,
      logout,
      refreshMe,
      isAuthenticated: Boolean(accessToken)
    }),
    [accessToken, user, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

