// authService.js
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const API_URL = `${apiConfig.development.baseURL}/auth`;

// Register a new user
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username: userData.name,
      email: userData.email,
      password: userData.password
    });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Forgot password
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, {
      email
    });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

// Refresh token
export const refreshToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${API_URL}/refresh-token`, {
      refreshToken
    });
    return response.data;
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
};

// Verify email
export const verifyEmail = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/verify-email`, {
      token
    });
    return response.data;
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/reset-password`, {
      token,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};
