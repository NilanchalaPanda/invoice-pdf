const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Create Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// PDF Generation Rate Limiter - 5 requests per minute per user
const pdfGenerationLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'pdf_limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  keyGenerator: (req) => `${req.user._id}`, // Rate limit per user
  message: {
    error: 'Too many PDF generation requests',
    message: 'You have exceeded the limit of 5 PDF generations per minute. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have exceeded the limit of 5 PDF generations per minute. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// General API Rate Limiter - 100 requests per minute per IP
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'api_limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    error: 'Too many API requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth Rate Limiter - 10 requests per minute per IP
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'auth_limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 auth requests per minute per IP
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  pdfGenerationLimiter,
  generalLimiter,
  authLimiter,
  redis
};