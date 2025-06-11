const Invoice = require("../models/Invoice");
const generatePDF = require("../utils/pdfGenerator");
const { io } = require("../server");
const { getIO } = require("../utils/socketManager");

// const createInvoice = async (req, res) => {
//   try {
//     const { customerName, amount, date } = req.body;
//     const invoiceNumber = `INV-${Date.now()}`;

//     const invoice = new Invoice({
//       userId: req.user.userId,
//       customerName,
//       amount,
//       date,
//       invoiceNumber,
//       status: "processing",
//     });

//     await invoice.save();

//     // Return invoice immediately
//     res.status(201).json({
//       message: "Invoice created successfully",
//       invoice: {
//         _id: invoice._id,
//         customerName: invoice.customerName,
//         amount: invoice.amount,
//         date: invoice.date,
//         invoiceNumber: invoice.invoiceNumber,
//         status: invoice.status,
//       },
//     });

//     // Generate PDF in background
//     setTimeout(async () => {
//       try {
//         const filename = await generatePDF(invoice);
//         await Invoice.findByIdAndUpdate(invoice._id, {
//           status: "completed",
//           pdfPath: filename,
//         });
//       } catch (error) {
//         console.error("PDF generation failed:", error);
//       }
//     }, 2000); // Simulate processing time
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

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

    // Generate PDF in background (don't await this)
    generatePDFInBackground(invoice, req.user.userId);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Separate function to handle PDF generation in background
const generatePDFInBackground = async (invoice, userId) => {
  try {
    const filename = await generatePDF(invoice);
    await Invoice.findByIdAndUpdate(invoice._id, {
      status: "completed",
      pdfPath: filename,
    });

    const io = getIO();
    console.log("SOCKET IO : ", io); // Should now show the io object

    // Emit a WebSocket event to notify the client
    io.to(`user_${userId}`).emit("invoiceStatusUpdate", {
      invoiceId: invoice._id,
      status: "completed",
      pdfPath: filename,
    });

    console.log(`PDF generated successfully for invoice ${invoice._id}`);
  } catch (error) {
    console.error("PDF generation failed:", error);

    try {
      await Invoice.findByIdAndUpdate(invoice._id, {
        status: "failed",
      });

      const io = getIO();
      io.to(`user_${userId}`).emit("invoiceStatusUpdate", {
        invoiceId: invoice._id,
        status: "failed",
      });
    } catch (updateError) {
      console.error("Failed to update invoice status:", updateError);
    }
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
