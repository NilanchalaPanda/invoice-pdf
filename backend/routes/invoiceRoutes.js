const express = require("express");
const router = express.Router();
const invoiceController = require("../controller/invoiceController");
const authenticateToken = require("../middleware/authMiddleware");
const pdfRateLimit = require("../middleware/rateLimitMiddleware");

router.post(
  "/",
  authenticateToken,
  pdfRateLimit,
  invoiceController.createInvoice
);
router.get("/", authenticateToken, invoiceController.getUserInvoices);
router.get(
  "/:id/status",
  authenticateToken,
  invoiceController.getInvoiceStatus
);
router.get(
  "/:id/download",
  authenticateToken,
  invoiceController.downloadInvoicePdf
);

module.exports = router;
