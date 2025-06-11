const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generatePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    const filepath = path.join("uploads", filename);

    // Ensure uploads directory exists
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }

    doc.pipe(fs.createWriteStream(filepath));

    // PDF Content
    doc.fontSize(20).text("INVOICE", 50, 50);
    doc.fontSize(12);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 100);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 50, 120);
    doc.text(`Customer: ${invoice.customerName}`, 50, 140);
    doc.text(`Amount: $${invoice.amount.toFixed(2)}`, 50, 160);

    doc.end();

    doc.on("end", () => {
      resolve(filename);
    });

    doc.on("error", (error) => {
      reject(error);
    });
  });
};

module.exports = generatePDF;
