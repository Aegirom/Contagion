import express from "express";
import {
  getLeaderboard,
  getMyLeaderboardPosition,
} from "../controllers/LeaderboardController.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", optionalAuth, getLeaderboard);

router.get("/me", protect, getMyLeaderboardPosition);

export default router;
