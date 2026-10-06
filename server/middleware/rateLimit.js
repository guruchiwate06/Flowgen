// Rate limiting: 5 requests per 48 hours per user
const requestCounts = new Map();
const LIMIT = 5;
const WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

export const rateLimitMiddleware = (req, res, next) => {
  // Identify by authenticated user ID if available, otherwise client IP
  const identifier = req.user?.uid || req.user?.user_id || req.user?.sub || req.ip || req.connection?.remoteAddress || 'anonymous';
  const now = Date.now();
  
  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  const limitData = requestCounts.get(identifier);
  if (now > limitData.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (limitData.count >= LIMIT) {
    const hoursRemaining = Math.max(1, Math.ceil((limitData.resetTime - now) / (60 * 60 * 1000)));
    return res.status(429).json({ 
      error: `Limit reached: You have used your 5 free AI requests. Limit resets in ${hoursRemaining} hour(s).` 
    });
  }

  limitData.count++;
  next();
};
