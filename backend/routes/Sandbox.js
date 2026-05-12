import express from 'express';
import { protect } from './Auth.js';
import { evaluateFile, getSandboxSubmissions, listExecutions } from '../controllers/SandboxController.js';

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

router.get('/submissions', protect, getSandboxSubmissions);
router.get('/executions', protect, listExecutions);
router.post('/evaluate', protect, verifyTurnstile, evaluateFile);

export default router;
