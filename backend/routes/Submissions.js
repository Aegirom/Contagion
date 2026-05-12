import express from "express";
import {
  deleteSubmission,
  getAllSubmissions,
  getSubmissionById,
  getSubmissionByIdPublic,
  getUserDrafts,
  optionalAuth,
  postSubmission,
  getUserSubmissions,
  getUserStats,
  updateSubmission,
  getUserSavedSubmissions,
  importSubmission
} from '../controllers/SubmissionsController.js';
import { protect } from './Auth.js';
import validate from '../middleware/validate.js';
import { postSubmissionSchema, updateSubmissionSchema } from '../validation/submissions.js';
const router = express.Router();

const verifyTurnstile = async (req, res, next) => {
  const token = req.body['cf-turnstile-response'];
  if (!token) {
    return res.status(400).json({ error: 'Please complete the CAPTCHA' });
  }
  try {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET,
        response: token
      })
    });
    const data = await verify.json();
    if (!data.success) {
      return res.status(400).json({ error: 'CAPTCHA failed' });
    }
    next();
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return res.status(500).json({ error: 'CAPTCHA verification failed' });
  }
};

router.get("/get", optionalAuth, getAllSubmissions);
router.get("/mine", protect, getUserSubmissions);
router.get("/saved", protect, getUserSavedSubmissions);
router.get("/stats", protect, getUserStats);
router.get("/drafts", protect, getUserDrafts);
router.get("/:id", optionalAuth, getSubmissionByIdPublic);
router.post("/post", protect, verifyTurnstile, validate(postSubmissionSchema), postSubmission);
router.post("/:id/import", protect, importSubmission);
router.patch("/:id", protect, validate(updateSubmissionSchema), updateSubmission);
router.delete("/:id", protect, deleteSubmission);

export default router;
