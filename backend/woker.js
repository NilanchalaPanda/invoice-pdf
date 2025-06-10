const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createPDFWorker } = require('./services/queueService');

require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invoicegen', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Worker: MongoDB connected'))
.catch(err => console.error('Worker: MongoDB connection error:', err));

// Create HTTP server and Socket.io for worker
const server = createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize PDF worker
const worker = createPDFWorker(io);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Worker: Received SIGTERM, shutting down gracefully...');
  await worker.close();
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker: Received SIGINT, shutting down gracefully...');
  await worker.close();
  await mongoose.connection.close();
  process.exit(0);
});

// Error handling
worker.on('error', (error) => {
  console.error('Worker error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('PDF Worker started successfully');
console.log('Waiting for PDF generation jobs...');