class InMemoryRateLimiter {
  constructor(windowMs = 60000, maxRequests = 2) {
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
