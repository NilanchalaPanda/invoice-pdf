const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Generate PDF from invoice data
const generatePDF = async (invoiceData) => {
  let browser;
  
  try {
    // Launch browser with minimal configuration for better performance
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
      ]
    });

    const page = await browser.newPage();
    
    // Generate HTML content for the invoice
    const htmlContent = generateInvoiceHTML(invoiceData);
    
    // Set page content
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Ensure uploads directory exists
    const uploadsDir = await ensureUploadsDir();
    
    // Generate unique filename
    const filename = `invoice_${invoiceData.invoiceNumber}_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Generate PDF
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    console.log(`PDF generated: ${filename}`);
    return filename; // Return relative path for storage
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Generate HTML template for invoice
const generateInvoiceHTML = (invoice) => {
  const { 
    invoiceNumber, 
    clientName, 
    clientEmail, 
    items, 
    subtotal, 
    taxRate, 
    taxAmount, 
    total, 
    dueDate, 
    notes,
    createdAt 
  } = invoice;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          color: #333;
          line-height: 1.6;
          background: #fff;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        
        .invoice-title {
          font-size: 32px;
          color: #1f2937;
          font-weight: 300;
        }
        
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        
        .invoice-info, .client-info {
          flex: 1;
        }
        
        .client-info {
          text-align: right;
        }
        
        .info-label {
          font-weight: bold;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        
        .info-value {
          font-size: 16px;
          margin-bottom: 15px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .items-table th {
          background: #f9fafb;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table tr:hover {
          background: #f9fafb;
        }
        
        .text-right {
          text-align: right;
        }
        
        .totals {
          float: right;
          width: 300px;
          margin-top: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .total-row.final {
          border-bottom: 3px solid #2563eb;
          font-weight: bold;
          font-size: 18px;
          color: #1f2937;
        }
        
        .notes {
          margin-top: 40px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">InvoiceGen</div>
          <div class="invoice-title">INVOICE</div>
        </div>
        
        <div class="invoice-details">
          <div class="invoice-info">
            <div class="info-label">Invoice Number</div>
            <div class="info-value">${invoiceNumber}</div>
            
            <div class="info-label">Issue Date</div>
            <div class="info-value">${new Date(createdAt).toLocaleDateString()}</div>
            
            <div class="info-label">Due Date</div>
            <div class="info-value">${new Date(dueDate).toLocaleDateString()}</div>
          </div>
          
          <div class="client-info">
            <div class="info-label">Bill To</div>
            <div class="info-value">
              <strong>${clientName}</strong><br>
              ${clientEmail}
            </div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${item.price.toFixed(2)}</td>
                <td class="text-right">${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          ${taxRate > 0 ? `
            <div class="total-row">
              <span>Tax (${taxRate}%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row final">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="clear: both;"></div>
        
        ${notes ? `
          <div class="notes">
            <div class="info-label">Notes</div>
            <div>${notes}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleDateString()} by InvoiceGen</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generatePDF
};