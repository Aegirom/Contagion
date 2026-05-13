import express from "express";
import { register, login, forgotPassword, refreshToken, verifyEmail, resetPassword, getMe, updateProfile, getProfile, logout } from "../controllers/AuthController.js";
import { getFullUserProfile, updateFullUserProfile, uploadAvatar } from "../controllers/ProfileController.js";
import { protect } from "../middleware/auth.js";
import { verifyTurnstile } from "../middleware/turnstile.js";
import validate from "../middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, refreshTokenSchema, updateProfileSchema } from "../validation/auth.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", verifyTurnstile, validate(loginSchema), login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/refresh-token", validate(refreshTokenSchema), refreshToken);
router.post("/logout", logout);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.get("/me", protect, getMe);
router.put("/profile", protect, validate(updateProfileSchema), updateProfile);
router.get("/profile", protect, getProfile);
router.get("/profile/full", protect, getFullUserProfile);
router.put("/profile/full", protect, updateFullUserProfile);
router.post("/profile/avatar", protect, uploadAvatar);

export default router;
