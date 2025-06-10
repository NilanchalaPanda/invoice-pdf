const express = require('express');
const {
  createInvoice,
  getUserInvoices,
  downloadInvoice,
  getInvoice,
  createInvoiceValidation
} = require('../controllers/invoiceController');
const { authenticate } = require('../middlewares/auth');
const { generalLimiter, pdfGenerationLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

// Apply general rate limiting to all invoice routes
router.use(generalLimiter);

// All invoice routes require authentication
router.use(authenticate);

// POST /api/invoices - Create new invoice (with PDF generation rate limiting)
router.post('/', pdfGenerationLimiter, createInvoiceValidation, createInvoice);

// GET /api/invoices - Get user's invoices
router.get('/', getUserInvoices);

// GET /api/invoices/:invoiceId - Get single invoice
router.get('/:invoiceId', getInvoice);

// GET /api/invoices/:invoiceId/download - Download invoice PDF
router.get('/:invoiceId/download', downloadInvoice);

module.exports = router;