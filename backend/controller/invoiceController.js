const Invoice = require("../models/Invoice");
const generatePDF = require("../utils/pdfGenerator");
const pdfQueue = require("../utils/pdfQueue");
const { getIO } = require("../utils/socketManager");

const createInvoice = async (req, res) => {
  try {
    const { customerName, amount, date } = req.body;
    const invoiceNumber = `INV-${Date.now()}`;

    // Input validation
    if (!customerName || !amount || !date) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["customerName", "amount", "date"],
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const invoice = new Invoice({
      userId: req.user.userId,
      customerName,
      amount,
      date,
      invoiceNumber,
      status: "processing",
    });

    await invoice.save();

    // Return invoice immediately
    res.status(201).json({
      message: "Invoice created successfully",
      invoice: {
        _id: invoice._id,
        customerName: invoice.customerName,
        amount: invoice.amount,
        date: invoice.date,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
      },
    });

    // Emit initial status via WebSocket
    const io = getIO();
    io.to(`user_${req.user.userId}`).emit("invoiceStatusUpdate", {
      invoiceId: invoice._id,
      status: "processing",
      message: "Invoice created, PDF generation queued",
    });

    // Add PDF generation job to queue
    const job = await pdfQueue.add(
      "generatePDF",
      {
        invoice: {
          _id: invoice._id,
          customerName: invoice.customerName,
          amount: invoice.amount,
          date: invoice.date,
          invoiceNumber: invoice.invoiceNumber,
        },
        userId: req.user.userId,
      },
      {
        priority: 1, // Normal priority
        attempts: 3, // Retry 3 times
      }
    );

    // Emit queue status via WebSocket
    io.to(`user_${req.user.userId}`).emit("invoiceStatusUpdate", {
      invoiceId: invoice._id,
      status: "queued",
      jobId: job.id,
      message: `PDF generation job ${job.id} queued for processing`,
    });

    console.log(
      `PDF generation job ${job.id} queued for invoice ${invoice._id}`
    );
  } catch (error) {
    console.error("Error creating invoice:", error);

    res.status(500).json({
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

const getUserInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });

    res.json({ invoices });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getInvoiceStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ status: invoice.status, pdfPath: invoice.pdfPath });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const downloadInvoicePdf = async (req, res) => {
  const fs = require("fs");
  const path = require("path");
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!invoice || !invoice.pdfPath) {
      return res.status(404).json({ message: "Invoice or PDF not found" });
    }

    const filepath = path.join("uploads", invoice.pdfPath);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: "PDF file not found" });
    }

    res.download(filepath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createInvoice,
  getUserInvoices,
  getInvoiceStatus,
  downloadInvoicePdf,
};
