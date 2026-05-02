import express from "express";
import { getLeaderboard, getMyLeaderboardPosition } from "../controllers/LeaderboardController.js";

const router = express.Router();

router.get("/", getLeaderboard);

router.get("/me", getMyLeaderboardPosition);

export default router;
