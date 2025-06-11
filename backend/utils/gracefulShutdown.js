// const rateLimiter = require("./rateLimiter");
const pdfQueue = require("./pdfQueue");

const gracefulShutdown = () => {
  console.log("Received shutdown signal, cleaning up...");

  // Clean up rate limiter
  rateLimiter.destroy();

  // Clean up queue
  pdfQueue.destroy();

  console.log("Cleanup completed");
  process.exit(0);
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = gracefulShutdown;
