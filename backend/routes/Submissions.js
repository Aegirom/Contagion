import express from "express";
import { getAllSubmissions, postSubmission, getUserSubmissions, getUserStats } from '../controllers/SubmissionsController.js';
import { protect } from './Auth.js';
const router = express.Router();

router.get("/get", getAllSubmissions);
router.get("/mine", protect, getUserSubmissions);
router.get("/stats", protect, getUserStats);
router.post("/post", postSubmission);

export default router;
