import express from "express";
import {
  getComments,
  addComment,
  deleteComment,
  getLikes,
  getUserLike,
  toggleLike,
  getShares,
  toggleShare,
  getSaves,
  getUserSave,
  toggleSave
} from "../controllers/PostsController.js";
import { protect } from "./Auth.js";

const router = express.Router();

// Comments
router.get("/:submissionId/comments", getComments);
router.post("/:submissionId/comments", protect, addComment);
router.delete("/comments/:commentId", protect, deleteComment);

// Likes
router.get("/:submissionId/likes", getLikes);
router.get("/:submissionId/likes/me", protect, getUserLike);
router.post("/:submissionId/likes", protect, toggleLike);

// Shares
router.get("/:submissionId/shares", getShares);
router.post("/:submissionId/shares", protect, toggleShare);

// Saves
router.get("/:submissionId/saves", getSaves);
router.get("/:submissionId/saves/me", protect, getUserSave);
router.post("/:submissionId/saves", protect, toggleSave);

export default router;