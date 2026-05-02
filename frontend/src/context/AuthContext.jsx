/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState({
    accessToken: null,
    refreshToken: null,
  });

  // Load user and tokens from storage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const localTokens = localStorage.getItem("authTokens");
        const sessionTokens = sessionStorage.getItem("authTokens");

        // localStorage takes priority (remember me was active)
        if (localTokens) {
          const authTokens = JSON.parse(localTokens);
          API.defaults.headers["Authorization"] =
            `Bearer ${authTokens.accessToken}`;

          const response = await API.get("/auth/me");
          const userData = normalizeUser(response.data);

          setUser(userData);
          setTokens(authTokens);
          localStorage.setItem("user", JSON.stringify(userData));
        } else if (sessionTokens) {
          const authTokens = JSON.parse(sessionTokens);
          API.defaults.headers["Authorization"] =
            `Bearer ${authTokens.accessToken}`;

          const response = await API.get("/auth/me");
          const userData = normalizeUser(response.data);

          setUser(userData);
          setTokens(authTokens);
          sessionStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("authTokens");
        localStorage.removeItem("user");
        sessionStorage.removeItem("authTokens");
        sessionStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password, rememberMe) => {
    setLoading(true);
    try {
      const response = await apiLogin(email, password);
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

      API.defaults.headers["Authorization"] =
        `Bearer ${authTokens.accessToken}`;

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
      // New flow: user must verify email before login
      // Response contains message and user info (but no tokens)
      const { user: newUser, message } = response;

      // Return success - user needs to verify email
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
    delete API.defaults.headers["Authorization"];
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
    // Check if user is authenticated
    isAuthenticated: !!user && !!tokens.accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
