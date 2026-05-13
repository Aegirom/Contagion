import jwt from "jsonwebtoken";
import crypto from "crypto";

export const JWT_SIGN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'contagion',
  audience: 'contagion-api',
};

export const generateTokens = (userId, email, role) => {
  const accessToken = jwt.sign({ userId, email, role, jti: crypto.randomUUID() }, process.env.JWT_SECRET, {
    ...JWT_SIGN_OPTIONS,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ userId, email, role, jti: crypto.randomUUID() }, process.env.JWT_SECRET, {
    ...JWT_SIGN_OPTIONS,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  return errors;
};
