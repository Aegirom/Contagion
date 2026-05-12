/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  forgotPassword as apiForgotPassword,
} from "../services/authService";
import API from "../services/api";

export const AuthContext = createContext();

const normalizeUser = (userData) => {
  if (!userData) return null;
  const id = userData.user_id || userData.id;
  return {
    ...userData,
    id,
    user_id: id,
  };
};

const getStoredTokens = () => {
  const localTokens = localStorage.getItem("authTokens");
  if (localTokens) {
    try {
      return { tokens: JSON.parse(localTokens), storage: "local" };
    } catch {
      return { tokens: null, storage: null };
    }
  }
  const sessionTokens = sessionStorage.getItem("authTokens");
  if (sessionTokens) {
    try {
      return { tokens: JSON.parse(sessionTokens), storage: "session" };
    } catch {
      return { tokens: null, storage: null };
    }
  }
  return { tokens: null, storage: null };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState({
    accessToken: null,
    refreshToken: null,
  });

  const updateUserFromStorage = useCallback(() => {
    const { storage } = getStoredTokens();
    if (storage === "local") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          setUser(normalizeUser(JSON.parse(userStr)));
        } catch {
          // ignore
        }
      }
    } else if (storage === "session") {
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        try {
          setUser(normalizeUser(JSON.parse(userStr)));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Load user and tokens from storage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { tokens: authTokens, storage } = getStoredTokens();

        if (authTokens && authTokens.accessToken) {
          const response = await API.get("/auth/me");
          const userData = normalizeUser(response.data);

          setUser(userData);
          setTokens(authTokens);

          if (storage === "local") {
            localStorage.setItem("user", JSON.stringify(userData));
          } else if (storage === "session") {
            sessionStorage.setItem("user", JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Only clear storage if it's a genuine auth failure, not network issues
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("authTokens");
          localStorage.removeItem("user");
          sessionStorage.removeItem("authTokens");
          sessionStorage.removeItem("user");
        }
        // For network errors or other issues, keep tokens and let retry handle it
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for token refresh events from API interceptor
  useEffect(() => {
    const handleTokensRefreshed = (event) => {
      const newTokens = event.detail;
      setTokens(newTokens);
      updateUserFromStorage();
    };

    window.addEventListener("auth:tokensRefreshed", handleTokensRefreshed);
    return () =>
      window.removeEventListener("auth:tokensRefreshed", handleTokensRefreshed);
  }, [updateUserFromStorage]);

  const login = async (email, password, rememberMe, turnstileToken) => {
    setLoading(true);
    try {
      const response = await apiLogin(email, password, turnstileToken);
      const { user: userData, tokens: authTokens } = response;
      const normalizedUser = normalizeUser(userData);

      setUser(normalizedUser);
      setTokens(authTokens);

      if (rememberMe) {
        sessionStorage.removeItem("authTokens");
        sessionStorage.removeItem("user");
        localStorage.setItem("authTokens", JSON.stringify(authTokens));
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      } else {
        localStorage.removeItem("authTokens");
        localStorage.removeItem("user");
        sessionStorage.setItem("authTokens", JSON.stringify(authTokens));
        sessionStorage.setItem("user", JSON.stringify(normalizedUser));
      }

      return { success: true, user: normalizedUser, tokens: authTokens };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || "Login failed";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await apiRegister(userData);

      const { user: newUser, message } = response;

      return {
        success: true,
        message: message || "Verification email sent. Please check your inbox.",
        user: newUser,
      };
    } catch (error) {
      console.error("Register error:", error);
      const errorMessage = error.response?.data?.error || "Registration failed";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const response = await apiForgotPassword(email);
      return { success: true, message: response.message };
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to send reset link";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTokens({ accessToken: null, refreshToken: null });
    localStorage.removeItem("authTokens");
    localStorage.removeItem("user");
    sessionStorage.removeItem("authTokens");
    sessionStorage.removeItem("user");
    console.log("Logged out");
    window.location.href = "/login";
  };

  const updateUser = (userData) => {
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);

    // Update whichever storage is being used
    if (localStorage.getItem("authTokens")) {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } else if (sessionStorage.getItem("authTokens")) {
      sessionStorage.setItem("user", JSON.stringify(normalizedUser));
    }
  };

  const value = {
    user,
    loading,
    tokens,
    login,
    register,
    logout,
    forgotPassword,
    updateUser,
    isAuthenticated: !!user && !!tokens.accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
