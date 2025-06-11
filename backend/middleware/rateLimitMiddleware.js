const rateLimiter = require("../utils/rateLimiter");

class InMemoryRateLimiter {
  constructor(windowMs = 60000, maxRequests = 5) {
    this.windowMs = windowMs; // 1 minute
    this.maxRequests = maxRequests; // 5 requests per minute
    this.store = new Map(); // userId -> array of timestamps

    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.windowMs);
  }

  async checkRateLimit(userId) {
    const key = `pdf_rate_limit:${userId}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.store.has(key)) {
      this.store.set(key, []);
    }

    // Get and clean the old timestamps
    let requests = this.store.get(key);
    requests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit is reached
    if (requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...requests);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(oldestRequest + this.windowMs),
      };
    }

    // Only push now if under the limit
    requests.push(now);
    this.store.set(key, requests);

    return {
      allowed: true,
      remaining: this.maxRequests - requests.length,
      resetTime: new Date(windowStart + this.windowMs),
    };
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, requests] of this.store.entries()) {
      const validRequests = requests.filter(
        (timestamp) => timestamp > windowStart
      );
      if (validRequests.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, validRequests);
      }
    }
  }

  // Clean up when shutting down
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = new InMemoryRateLimiter();

const pdfRateLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await rateLimiter.checkRateLimit(userId);
    console.log("Result - ", result);

    // Add rate limit headers
    res.set({
      "X-RateLimit-Limit": "5",
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.resetTime.toISOString(),
    });

    if (!result.allowed) {
      return res.status(429).json({
        message: "Rate limit exceeded",
        error: "Too many PDF generation requests",
        retryAfter: Math.ceil((result.resetTime - new Date()) / 1000),
        resetTime: result.resetTime.toISOString(),
      });
    }

    next();
  } catch (error) {
    console.error("Rate limit middleware error:", error);
    // Don't block request if rate limiter fails
    next();
  }
};

module.exports = pdfRateLimit;
