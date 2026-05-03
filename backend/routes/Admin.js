import express from 'express';
import { protect } from './Auth.js';
import {
  getAdminStats,
  getAllUsers,
  updateUserProfile,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getPendingSubmissions,
  moderateSubmission,
  forceDeleteSubmission,
  getAllSubmissionsAdmin,
  getRecentActivity,
  getModerationStats,
  getAllComments,
  deleteComment,
  deletePeerReview,
} from '../controllers/AdminController.js';

const router = express.Router();

function requireAdminOrModerator(req, res, next) {
  const role = req.user?.role;
  if (role !== 'Administrator' && role !== 'Moderator') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

function requireAdmin(req, res, next) {
  const role = req.user?.role;
  if (role !== 'Administrator') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

router.get('/stats', protect, requireAdmin, getAdminStats);
router.get('/users', protect, requireAdmin, getAllUsers);
router.put('/users/:userId', protect, requireAdmin, updateUserProfile);
router.put('/users/:userId/role', protect, requireAdmin, updateUserRole);
router.put('/users/:userId/suspend', protect, requireAdmin, suspendUser);
router.put('/users/:userId/unsuspend', protect, requireAdmin, unsuspendUser);
router.delete('/users/:userId', protect, requireAdmin, deleteUser);
router.get('/submissions/all', protect, requireAdmin, getAllSubmissionsAdmin);
router.delete('/submissions/:submissionId', protect, requireAdmin, forceDeleteSubmission);
router.delete('/comments/:commentId', protect, requireAdminOrModerator, deleteComment);
router.delete('/reviews/:reviewId', protect, requireAdminOrModerator, deletePeerReview);
router.get('/activity', protect, requireAdmin, getRecentActivity);

router.get('/moderation/stats', protect, requireAdminOrModerator, getModerationStats);
router.get('/moderation/pending', protect, requireAdminOrModerator, getPendingSubmissions);
router.get('/moderation/comments', protect, requireAdminOrModerator, getAllComments);
router.put('/moderation/submissions/:submissionId', protect, requireAdminOrModerator, moderateSubmission);
router.delete('/moderation/comments/:commentId', protect, requireAdminOrModerator, deleteComment);

export default router;
