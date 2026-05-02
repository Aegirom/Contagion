import express from 'express';
import { protect } from './Auth.js';
import { evaluateFile, getSandboxSubmissions, listExecutions } from '../controllers/SandboxController.js';

const router = express.Router();

router.get('/submissions', protect, getSandboxSubmissions);
router.get('/executions', protect, listExecutions);
router.post('/evaluate', protect, evaluateFile);

export default router;
