const express = require("express");
const cors = require("cors");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);

app.get("/health", (req, res) => {
  res.send("OK");
});

module.exports = app;
