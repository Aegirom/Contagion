import express from 'express';
import { getAiEvaluation, triggerAiEvaluation } from '../controllers/AiEvaluationController.js';
import { protect } from './Auth.js';

const router = express.Router();

// Get AI evaluation for a specific submission
router.get('/:submissionId', protect, getAiEvaluation);

// Trigger a new AI evaluation for a specific submission
router.post('/:submissionId/evaluate', protect, triggerAiEvaluation);

export default router;
