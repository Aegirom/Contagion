import express from 'express';
import { protect } from '../middleware/auth.js';
import { verifyTurnstile } from '../middleware/turnstile.js';
import { evaluateFile, getSandboxSubmissions, listExecutions } from '../controllers/SandboxController.js';
import validate from '../middleware/validate.js';
import { evaluateFileSchema } from '../validation/sandbox.js';

const router = express.Router();

router.get('/submissions', protect, getSandboxSubmissions);
router.get('/executions', protect, listExecutions);
router.post('/evaluate', protect, verifyTurnstile, validate(evaluateFileSchema), evaluateFile);

export default router;
