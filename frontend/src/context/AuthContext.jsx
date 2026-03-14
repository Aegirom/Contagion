import { createContext, useState } from 'react';
import { login as apiLogin, register as apiRegister, forgotPassword as apiForgotPassword } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState({ accessToken: null, refreshToken: null });

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiLogin(email, password);
      const { user: userData, tokens: authTokens } = response;

      setUser(userData);
      setTokens(authTokens);
      localStorage.setItem('authTokens', JSON.stringify(authTokens));
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true, user: userData, tokens: authTokens };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
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
      return { success: true, message: message || 'Verification email sent. Please check your inbox.', user: newUser };
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
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
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send reset link';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTokens({ accessToken: null, refreshToken: null });
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');
    console.log('Logged out');
  };

  const value = {
    user,
    loading,
    tokens,
    login,
    register,
    logout,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
