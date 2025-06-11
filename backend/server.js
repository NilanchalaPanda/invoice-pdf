// server.js
const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./utils/socketManager");

const connectDB = require("./config/db");
const { PORT } = require("./config/constants");

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export only the server (no need to export io anymore)
module.exports = { server };
