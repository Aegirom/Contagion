import express from 'express';
import { createUser, findUserByEmail, findUserById, verifyPassword, updatePassword, verifyUserEmail, isUserActive } from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import sql from 'mssql';
import { getFullUserProfile, updateFullUserProfile, uploadAvatar } from '../controllers/ProfileController.js';

// Middleware to protect routes - verifies JWT and sets req.user
export const protect = (req, res, next) => {
  let token;

  console.log('=== PROTECT MIDDLEWARE DEBUG ===');
  console.log('Authorization header:', req.headers.authorization ? 'present' : 'missing');
  console.log('Full auth header:', req.headers.authorization);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token ? token.substring(0, 20) + '...' : 'null');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      console.log('User decoded:', decoded);
      next();
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log('No token found');
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

const router = express.Router();


export const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};


router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }


    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const newUser = await createUser({ username, email, password });

    // Send verification email
    await sendVerificationEmail(email, newUser.user_id, username);

    res.status(201).json({
      message: 'Verification email sent. Please check your email to verify your account.',
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }


    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active (email verified)
    const active = user.is_active === 1 || user.is_active === true;
    if (!active) {
      return res.status(403).json({ error: 'Please verify your email before logging in. Check your inbox for the verification link.' });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }


    const { accessToken, refreshToken } = generateTokens(user.user_id, user.email);


    await pool.request()
      .input('user_id', sql.INT, user.user_id)
      .query(`UPDATE Users SET last_login = GETDATE() WHERE user_id = @user_id`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        expertise_level: user.expertise_level
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});


router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }


    const user = await findUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Send password reset email
    await sendPasswordResetEmail(email, user.user_id, user.username);

    res.status(200).json({
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }


    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId, decoded.email);

      res.json({
        accessToken,
        refreshToken: newRefreshToken
      });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify email endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'verification') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Verify user's email
    await verifyUserEmail(decoded.userId);

    res.status(200).json({
      message: 'Email verified successfully. You can now login.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
    }
    res.status(500).json({ error: 'Invalid or expired verification token' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Update password
    await updatePassword(decoded.userId, newPassword);

    res.status(200).json({
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Password reset link has expired. Please request a new one.' });
    }
    res.status(500).json({ error: 'Invalid or expired reset token' });
  }
});

// GET /auth/me - Get current user (protected)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user profile
    const profileResult = await pool.request()
      .input('user_id', sql.INT, user.user_id)
      .query('SELECT profile_id, full_name, bio, avatar_url FROM User_Profiles WHERE user_id = @user_id');

    const profile = profileResult.recordset[0] || {};

    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      expertise_level: user.expertise_level,
      reputation_score: user.reputation_score,
      is_active: user.is_active,
      created_at: user.created_at,
      profile: profile
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /auth/profile - Update user profile (protected)
router.put('/profile', protect, async (req, res) => {
  try {
    const { full_name, bio, avatar_url } = req.body;
    const userId = req.user.userId;

    // Check if profile exists
    const existingProfile = await pool.request()
      .input('user_id', sql.INT, userId)
      .query('SELECT profile_id FROM User_Profiles WHERE user_id = @user_id');

    if (existingProfile.recordset.length === 0) {
      // Create new profile
      await pool.request()
        .input('user_id', sql.INT, userId)
        .input('full_name', sql.NVARCHAR, full_name || null)
        .input('bio', sql.NVARCHAR, bio || null)
        .input('avatar_url', sql.NVARCHAR, avatar_url || null)
        .query('INSERT INTO User_Profiles (user_id, full_name, bio, avatar_url) VALUES (@user_id, @full_name, @bio, @avatar_url)');
    } else {
      // Update existing profile
      await pool.request()
        .input('user_id', sql.INT, userId)
        .input('full_name', sql.NVARCHAR, full_name || null)
        .input('bio', sql.NVARCHAR, bio || null)
        .input('avatar_url', sql.NVARCHAR, avatar_url || null)
        .query('UPDATE User_Profiles SET full_name = ISNULL(@full_name, full_name), bio = ISNULL(@bio, bio), avatar_url = ISNULL(@avatar_url, avatar_url), updated_at = GETDATE() WHERE user_id = @user_id');
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /auth/profile - Get current user's profile (protected)
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.request()
      .input('user_id', sql.INT, userId)
      .query('SELECT profile_id, full_name, bio, avatar_url FROM User_Profiles WHERE user_id = @user_id');

    const profile = result.recordset[0] || null;

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /auth/profile/full - Get complete user profile with user data (protected)
router.get('/profile/full', protect, getFullUserProfile);

// PUT /auth/profile/full - Update complete user profile (protected)
router.put('/profile/full', protect, updateFullUserProfile);

// POST /auth/profile/avatar - Upload avatar image (protected)
router.post('/profile/avatar', protect, uploadAvatar);

export default router;
