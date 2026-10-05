// Basic in-memory rate limiting for demonstration
const requestCounts = new Map();
const LIMIT = 100;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  const limitData = requestCounts.get(ip);
  if (now > limitData.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (limitData.count >= LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again tomorrow.' });
  }

  limitData.count++;
  next();
};
