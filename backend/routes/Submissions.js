import express from "express";
import { deleteSubmission, getAllSubmissions, getSubmissionById, getUserDrafts, postSubmission, getUserSubmissions, getUserStats, updateSubmission } from '../controllers/SubmissionsController.js';
import { protect } from './Auth.js';
const router = express.Router();

router.get("/get", protect, getAllSubmissions);
router.get("/mine", protect, getUserSubmissions);
router.get("/stats", protect, getUserStats);
router.get("/drafts", protect, getUserDrafts);
router.get("/:id", protect, getSubmissionById);
router.post("/post", protect, postSubmission);
router.patch("/:id", protect, updateSubmission);
router.delete("/:id", protect, deleteSubmission);

export default router;
