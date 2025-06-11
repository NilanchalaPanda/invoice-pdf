const Invoice = require("../models/Invoice");
const generatePDF = require("../utils/pdfGenerator");

const createInvoice = async (req, res) => {
  try {
    const { customerName, amount, date } = req.body;
    const invoiceNumber = `INV-${Date.now()}`;

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

    // Generate PDF in background
    setTimeout(async () => {
      try {
        const filename = await generatePDF(invoice);
        await Invoice.findByIdAndUpdate(invoice._id, {
          status: "completed",
          pdfPath: filename,
        });
      } catch (error) {
        console.error("PDF generation failed:", error);
      }
    }, 2000); // Simulate processing time
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
