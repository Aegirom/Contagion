import express from 'express';
import { protect } from '../middleware/auth.js';
import { getActivityFeed, getAnalystReputation } from '../controllers/DashboardController.js';

const router = express.Router();

router.get('/activity', protect, getActivityFeed);

router.get('/reputation', protect, getAnalystReputation);

export default router;
