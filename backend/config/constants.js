module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/your-database",
};
