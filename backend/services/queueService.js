const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { generatePDF } = require('./pdfService');
const Invoice = require('../models/Invoice');

// Create Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Create PDF generation queue
const pdfQueue = new Queue('pdf-generation', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 20,     // Keep last 20 failed jobs
    attempts: 3,          // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Add job to queue
const addPDFGenerationJob = async (invoiceId, userId, invoiceData) => {
  try {
    const job = await pdfQueue.add('generate-pdf', {
      invoiceId,
      userId,
      invoiceData,
      timestamp: Date.now()
    }, {
      jobId: `pdf-${invoiceId}`, // Unique job ID to prevent duplicates
      delay: 1000, // Small delay to ensure database consistency
    });

    console.log(`PDF generation job added: ${job.id}`);
    return job.id;
  } catch (error) {
    console.error('Error adding PDF generation job:', error);
    throw error;
  }
};

// Create worker to process PDF generation jobs
const createPDFWorker = (io) => {
  const worker = new Worker('pdf-generation', async (job) => {
    const { invoiceId, userId, invoiceData } = job.data;
    
    try {
      console.log(`Processing PDF generation for invoice: ${invoiceId}`);
      
      // Update job progress
      await job.updateProgress(25);
      
      // Generate PDF
      const pdfPath = await generatePDF(invoiceData);
      await job.updateProgress(75);
      
      // Update invoice in database
      const invoice = await Invoice.findByIdAndUpdate(
        invoiceId,
        { 
          status: 'completed',
          pdfPath: pdfPath,
          jobId: job.id
        },
        { new: true }
      );
      
      await job.updateProgress(100);
      
      // Emit real-time update to user
      io.to(`user_${userId}`).emit('invoiceStatusUpdate', {
        invoiceId,
        status: 'completed',
        pdfPath,
        invoice
      });
      
      console.log(`PDF generated successfully for invoice: ${invoiceId}`);
      return { success: true, pdfPath, invoiceId };
      
    } catch (error) {
      console.error(`PDF generation failed for invoice ${invoiceId}:`, error);
      
      // Update invoice status to failed
      await Invoice.findByIdAndUpdate(invoiceId, { 
        status: 'failed',
        jobId: job.id
      });
      
      // Emit failure update to user
      io.to(`user_${userId}`).emit('invoiceStatusUpdate', {
        invoiceId,
        status: 'failed',
        error: error.message
      });
      
      throw error;
    }
  }, {
    connection: redis,
    concurrency: 5, // Process up to 5 jobs simultaneously
    limiter: {
      max: 10,      // Maximum 10 jobs
      duration: 60000, // per minute
    },
  });

  // Worker event handlers
  worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  return worker;
};

// Get queue statistics
const getQueueStats = async () => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      pdfQueue.getWaiting(),
      pdfQueue.getActive(),
      pdfQueue.getCompleted(),
      pdfQueue.getFailed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return null;
  }
};

module.exports = {
  pdfQueue,
  addPDFGenerationJob,
  createPDFWorker,
  getQueueStats
};