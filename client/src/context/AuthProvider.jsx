import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(localStorage.getItem("ab_token"))
  );

  useEffect(() => {
    if (!isLoading) return;
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem("ab_token");
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [isLoading]);

  const setSession = ({ token, user: currentUser }) => {
    localStorage.setItem("ab_token", token);
    setUser(currentUser);
  };

  const logout = () => {
    localStorage.removeItem("ab_token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      setSession,
      logout,
      setUser,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
