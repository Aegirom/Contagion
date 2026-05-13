import pool from "../config/db.js";
import sql from "mssql";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
  updatePassword,
  verifyUserEmail,
} from "../models/User.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";
import { convertR2ToHttpUrl } from "../services/r2Service.js";
import {
  generateTokens,
  JWT_SIGN_OPTIONS,
  validatePassword,
} from "../services/authService.js";
import { addToBlacklist, isBlacklisted } from "../services/tokenBlacklistService.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: passwordErrors[0] });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const newUser = await createUser({ username, email, password });
    await sendVerificationEmail(email, newUser.user_id, username);

    res.status(201).json({
      message:
        "Verification email sent. Please check your email to verify your account.",
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const active = user.is_active === 1 || user.is_active === true;
    if (!active) {
      return res.status(403).json({
        error:
          "Please verify your email before logging in. Check your inbox for the verification link.",
      });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(
      user.user_id,
      user.email,
      user.role,
    );

    await pool
      .request()
      .input("user_id", sql.INT, user.user_id)
      .query(
        "UPDATE Users SET last_login = GETDATE() WHERE user_id = @user_id",
      );

    const profileResult = await pool
      .request()
      .input("user_id", sql.INT, user.user_id)
      .query("SELECT avatar_url FROM User_Profiles WHERE user_id = @user_id");

    const avatarUrl = profileResult.recordset[0]?.avatar_url
      ? convertR2ToHttpUrl(profileResult.recordset[0].avatar_url)
      : null;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        expertise_level: user.expertise_level,
        reputation_score: user.reputation_score,
        created_at: user.created_at,
        profile: {
          avatar_url: avatarUrl,
        },
      },
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
      return res
        .status(200)
        .json({ message: "If the email exists, a reset link has been sent" });
    }

    await sendPasswordResetEmail(email, user.user_id, user.username);
    res
      .status(200)
      .json({ message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
        issuer: "contagion",
        audience: "contagion-api",
      },
      (err, decoded) => {
        if (err) {
          const status = err.name === "TokenExpiredError" ? 401 : 403;
          const message =
            err.name === "TokenExpiredError"
              ? "Refresh token has expired"
              : "Invalid refresh token";
          return res.status(status).json({ error: message });
        }

        if (decoded.jti && isBlacklisted(decoded.jti)) {
          return res.status(401).json({ error: "Token has been revoked" });
        }

        if (decoded.jti) addToBlacklist(decoded.jti);

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(
          decoded.userId,
          decoded.email,
          decoded.role,
        );

        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/auth",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ accessToken, refreshToken: newRefreshToken });
      },
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        {
          algorithms: ["HS256"],
          issuer: "contagion",
          audience: "contagion-api",
        },
        (err, decoded) => {
          if (!err && decoded.jti) {
            addToBlacklist(decoded.jti);
          }
        },
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "contagion",
      audience: "contagion-email",
    });

    if (decoded.type !== "verification") {
      return res.status(400).json({ error: "Invalid token type" });
    }

    await verifyUserEmail(decoded.userId);
    res
      .status(200)
      .json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    console.error("Email verification error:", error);
    if (error.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({
          error: "Verification link has expired. Please request a new one.",
        });
    }
    res.status(500).json({ error: "Invalid or expired verification token" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "contagion",
      audience: "contagion-email",
    });

    if (decoded.type !== "password-reset") {
      return res.status(400).json({ error: "Invalid token type" });
    }

    await updatePassword(decoded.userId, newPassword);
    res
      .status(200)
      .json({
        message:
          "Password reset successful. You can now login with your new password.",
      });
  } catch (error) {
    console.error("Password reset error:", error);
    if (error.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({
          error: "Password reset link has expired. Please request a new one.",
        });
    }
    res.status(500).json({ error: "Invalid or expired reset token" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profileResult = await pool
      .request()
      .input("user_id", sql.INT, user.user_id)
      .query(
        "SELECT profile_id, full_name, bio, avatar_url FROM User_Profiles WHERE user_id = @user_id",
      );

    const profile = profileResult.recordset[0] || {};

    if (profile.avatar_url) {
      profile.avatar_url = convertR2ToHttpUrl(profile.avatar_url);
    }

    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      expertise_level: user.expertise_level,
      reputation_score: user.reputation_score,
      is_active: user.is_active,
      created_at: user.created_at,
      profile,
    });
  } catch (error) {
    console.error("Get current user error:", error.message);
    if (req.user && req.user.userId) {
      return res.json({
        user_id: req.user.userId,
        username: req.user.email?.split("@")[0] || "user",
        email: req.user.email,
        role: "Analyst",
        expertise_level: null,
        reputation_score: 0,
        is_active: true,
        created_at: null,
        profile: {},
      });
    }
    res.status(500).json({ error: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { full_name, bio, avatar_url } = req.body;
    const userId = req.user.userId;

    const existingProfile = await pool
      .request()
      .input("user_id", sql.INT, userId)
      .query("SELECT profile_id FROM User_Profiles WHERE user_id = @user_id");

    if (existingProfile.recordset.length === 0) {
      await pool
        .request()
        .input("user_id", sql.INT, userId)
        .input("full_name", sql.NVARCHAR, full_name || null)
        .input("bio", sql.NVARCHAR, bio || null)
        .input("avatar_url", sql.NVARCHAR, avatar_url || null)
        .query(
          "INSERT INTO User_Profiles (user_id, full_name, bio, avatar_url) VALUES (@user_id, @full_name, @bio, @avatar_url)",
        );
    } else {
      await pool
        .request()
        .input("user_id", sql.INT, userId)
        .input("full_name", sql.NVARCHAR, full_name || null)
        .input("bio", sql.NVARCHAR, bio || null)
        .input("avatar_url", sql.NVARCHAR, avatar_url || null)
        .query(
          "UPDATE User_Profiles SET full_name = ISNULL(@full_name, full_name), bio = ISNULL(@bio, bio), avatar_url = ISNULL(@avatar_url, avatar_url), updated_at = GETDATE() WHERE user_id = @user_id",
        );
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool
      .request()
      .input("user_id", sql.INT, userId)
      .query(
        "SELECT profile_id, full_name, bio, avatar_url FROM User_Profiles WHERE user_id = @user_id",
      );

    const profile = result.recordset[0] || null;
    res.json({ profile });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
