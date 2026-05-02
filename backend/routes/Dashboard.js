import express from 'express';
import { protect } from './Auth.js';
import { getActivityFeed, getAnalystReputation, getQuickActions } from '../controllers/DashboardController.js';

const router = express.Router();

// GET /dashboard/activity - Get user's activity feed
router.get('/activity', protect, getActivityFeed);

// GET /dashboard/reputation - Get user's reputation and rank info
router.get('/reputation', protect, getAnalystReputation);

// GET /dashboard/quick-actions - Get available quick actions
router.get('/quick-actions', protect, getQuickActions);

export default router;
