import API from "./api";

// Register a new user
export const register = async (userData) => {
  const response = await API.post("/auth/register", {
    username: userData.name,
    email: userData.email,
    password: userData.password,
    "cf-turnstile-response": userData.turnstileToken,
  });
  return response.data;
};

// Login user
export const login = async (email, password, turnstileToken) => {
  const response = await API.post("/auth/login", {
    email,
    password,
    "cf-turnstile-response": turnstileToken,
  });
  return response.data;
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await API.post("/auth/forgot-password", {
    email,
  });
  return response.data;
};

// Refresh token
export const refreshToken = async (refreshToken) => {
  const response = await API.post("/auth/refresh-token", {
    refreshToken,
  });
  return response.data;
};

// Verify email
export const verifyEmail = async (token) => {
  const response = await API.post("/auth/verify-email", {
    token,
  });
  return response.data;
};

// Reset password
export const resetPassword = async (token, newPassword) => {
  const response = await API.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return response.data;
};
