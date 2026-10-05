import express from 'express';
import { generateCompletion } from '../services/openai.js';
import { captionPrompt, hashtagPrompt, rewritePrompt, hookPrompt } from '../services/prompts.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = express.Router();

// Apply middleware
router.use(rateLimitMiddleware);
router.use(authMiddleware);

router.post('/caption', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.title) return res.status(400).json({ error: 'Title is required' });
    const prompt = captionPrompt(payload);
    const resultStr = await generateCompletion(prompt, 'You are an expert social media manager. You always reply in valid JSON.');
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultStr);
    } catch (e) {
      // Fallback if not valid JSON, clean it up
      const cleaned = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }
    
    res.json({ result: parsedResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/hashtags', async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) return res.status(400).json({ error: 'Context is required' });
    const prompt = hashtagPrompt(context);
    const result = await generateCompletion(prompt);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rewrite', async (req, res) => {
  try {
    const { text, tone } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const prompt = rewritePrompt(text, tone);
    const result = await generateCompletion(prompt);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/hooks', async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) return res.status(400).json({ error: 'Context is required' });
    const prompt = hookPrompt(context);
    const result = await generateCompletion(prompt);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
