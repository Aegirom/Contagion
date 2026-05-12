import express from 'express';
import { getAiEvaluation, triggerAiEvaluation } from '../controllers/AiEvaluationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:submissionId', protect, getAiEvaluation);

router.post('/:submissionId/evaluate', protect, triggerAiEvaluation);

export default router;
