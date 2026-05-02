import express from "express";
import {
  getLeaderboard,
  getMyLeaderboardPosition,
} from "../controllers/LeaderboardController.js";
import { protect } from "./Auth.js";

const router = express.Router();

router.get("/", getLeaderboard);

router.get("/me", protect, getMyLeaderboardPosition);

export default router;
