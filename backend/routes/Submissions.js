import express from "express";
import {
  deleteSubmission,
  getAllSubmissions,
  getPostOverview,
  getSubmissionArtifact,
  getSubmissionByIdPublic,
  getUserDrafts,
  getUserSubmissions,
  getUserStats,
  updateSubmission,
  getUserSavedSubmissions,
  importSubmission,
} from "../controllers/SubmissionsController.js";
import { postSubmission } from "../controllers/SubmissionsController.js";
import { protect, optionalAuth } from "../middleware/auth.js";
import { verifyTurnstile } from "../middleware/turnstile.js";
import validate from "../middleware/validate.js";
import {
  postSubmissionSchema,
  updateSubmissionSchema,
} from "../validation/submissions.js";
const router = express.Router();

router.get("/get", optionalAuth, getAllSubmissions);
router.get("/mine", protect, getUserSubmissions);
router.get("/saved", protect, getUserSavedSubmissions);
router.get("/stats", protect, getUserStats);
router.get("/drafts", protect, getUserDrafts);
router.get("/:id/overview", optionalAuth, getPostOverview);
router.get("/:id/artifact", optionalAuth, getSubmissionArtifact);
router.get("/:id", optionalAuth, getSubmissionByIdPublic);
router.post(
  "/post",
  protect,
  verifyTurnstile,
  validate(postSubmissionSchema),
  postSubmission,
);
router.post("/:id/import", protect, importSubmission);
router.patch(
  "/:id",
  protect,
  validate(updateSubmissionSchema),
  updateSubmission,
);
router.delete("/:id", protect, deleteSubmission);

export default router;
