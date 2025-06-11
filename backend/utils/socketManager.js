// socketManager.js
let io;

const initializeSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*", // Adjust this to your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("a user connected");

    // Join user to their own room
    socket.on("join", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });

  console.log("Socket.IO initialized successfully");
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io not initialized! Call initializeSocket() first."
    );
  }
  return io;
};

module.exports = { initializeSocket, getIO };
