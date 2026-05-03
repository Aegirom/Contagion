import express from 'express';
import { protect } from './Auth.js';
import { getActivityFeed, getAnalystReputation } from '../controllers/DashboardController.js';

const router = express.Router();

// GET /dashboard/activity - Get user's activity feed
router.get('/activity', protect, getActivityFeed);

// GET /dashboard/reputation - Get user's reputation and rank info
router.get('/reputation', protect, getAnalystReputation);

export default router;
