const EventEmitter = require("events");
const generatePDF = require("./pdfGenerator");
const Invoice = require("../models/Invoice");
const { getIO } = require("./socketManager");

class InMemoryQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency || 2;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 2000;

    // Queue management
    this.jobs = new Map(); // jobId -> job data
    this.waitingJobs = []; // Array of job IDs waiting to be processed
    this.activeJobs = new Set(); // Set of job IDs currently being processed
    this.completedJobs = []; // Array of completed job results
    this.failedJobs = []; // Array of failed job results

    this.jobIdCounter = 1;
    this.isProcessing = false;

    // Start processing
    this.startProcessing();
  }

  async add(jobType, data, options = {}) {
    const jobId = this.jobIdCounter++;
    const job = {
      id: jobId,
      type: jobType,
      data: data,
      options: options,
      attempts: 0,
      maxAttempts: options.attempts || this.retryAttempts,
      createdAt: new Date(),
      status: "waiting",
    };

    this.jobs.set(jobId, job);
    this.waitingJobs.push(jobId);

    this.emit("waiting", job);

    // Trigger processing
    this.processJobs();

    return { id: jobId };
  }

  async processJobs() {
    if (this.isProcessing || this.activeJobs.size >= this.concurrency) {
      return;
    }

    this.isProcessing = true;

    while (
      this.waitingJobs.length > 0 &&
      this.activeJobs.size < this.concurrency
    ) {
      const jobId = this.waitingJobs.shift();
      const job = this.jobs.get(jobId);

      if (!job) continue;

      this.activeJobs.add(jobId);
      job.status = "active";
      job.startedAt = new Date();

      this.emit("active", job);

      // Process job in background
      this.processJob(job).catch((err) => {
        console.error(`Error processing job ${jobId}:`, err);
      });
    }

    this.isProcessing = false;
  }

  async processJob(job) {
    const { invoice, userId } = job.data;
    const io = getIO();

    try {
      job.attempts++;

      // Emit job started status
      io.to(`user_${userId}`).emit("invoiceStatusUpdate", {
        invoiceId: invoice._id,
        status: "generating",
        jobId: job.id,
        progress: 0,
        message: "PDF generation started",
      });

      // Simulate progress updates
      this.updateProgress(job, 10);

      // Generate PDF
      const filename = await generatePDF(invoice);
      this.updateProgress(job, 80);

      // Update database
      await Invoice.findByIdAndUpdate(invoice._id, {
        status: "completed",
        pdfPath: filename,
      });
      this.updateProgress(job, 90);

      // Mark job as completed
      job.status = "completed";
      job.completedAt = new Date();
      job.result = { filename, invoiceId: invoice._id };

      this.activeJobs.delete(job.id);
      this.completedJobs.push(job);

      // Emit completion status via WebSocket
      io.to(`user_${userId}`).emit("invoiceStatusUpdate", {
        invoiceId: invoice._id,
        status: "completed",
        pdfPath: filename,
        jobId: job.id,
        progress: 100,
        message: "PDF generated successfully",
      });

      this.updateProgress(job, 100);
      this.emit("completed", job, job.result);

      console.log(`PDF generated successfully for invoice ${invoice._id}`);

      // Continue processing other jobs
      this.processJobs();
    } catch (error) {
      console.error("PDF generation failed:", error);

      this.activeJobs.delete(job.id);

      // Check if we should retry
      if (job.attempts < job.maxAttempts) {
        console.log(
          `Retrying job ${job.id}, attempt ${job.attempts + 1}/${
            job.maxAttempts
          }`
        );

        // Add back to waiting queue with delay
        setTimeout(() => {
          this.waitingJobs.push(job.id);
          job.status = "waiting";
          this.processJobs();
        }, this.retryDelay * Math.pow(2, job.attempts - 1)); // Exponential backoff

        // Emit retry status
        io.to(`user_${userId}`).emit("invoiceStatusUpdate", {
          invoiceId: invoice._id,
          status: "retrying",
          jobId: job.id,
          attempt: job.attempts,
          maxAttempts: job.maxAttempts,
          message: `PDF generation failed, retrying (${job.attempts}/${job.maxAttempts})`,
        });
      } else {
        // Max attempts reached, mark as failed
        job.status = "failed";
        job.failedAt = new Date();
        job.error = error.message;

        this.failedJobs.push(job);

        // Update invoice status to failed
        await Invoice.findByIdAndUpdate(invoice._id, {
          status: "failed",
        });

        // Emit failure status via WebSocket
        io.to(`user_${userId}`).emit("invoiceStatusUpdate", {
          invoiceId: invoice._id,
          status: "failed",
          jobId: job.id,
          error: error.message,
          message: "PDF generation failed after all retry attempts",
        });

        this.emit("failed", job, error);
      }

      // Continue processing other jobs
      this.processJobs();
    }
  }

  updateProgress(job, progress) {
    const { userId, invoice } = job.data;
    const io = getIO();

    this.emit("progress", job, progress);

    // Emit progress updates in real-time
    io.to(`user_${userId}`).emit("invoiceProgress", {
      invoiceId: invoice._id,
      jobId: job.id,
      progress: progress,
      message: `PDF generation ${progress}% complete`,
    });
  }

  // Get queue statistics
  getStats() {
    return {
      waiting: this.waitingJobs.length,
      active: this.activeJobs.size,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
      total: this.jobs.size,
    };
  }

  // Get jobs by status
  getWaiting() {
    return this.waitingJobs.map((id) => this.jobs.get(id)).filter(Boolean);
  }

  getActive() {
    return Array.from(this.activeJobs)
      .map((id) => this.jobs.get(id))
      .filter(Boolean);
  }

  getCompleted() {
    return this.completedJobs.slice(-100); // Return last 100
  }

  getFailed() {
    return this.failedJobs.slice(-50); // Return last 50
  }

  startProcessing() {
    // Process jobs every second
    this.processingInterval = setInterval(() => {
      if (
        this.waitingJobs.length > 0 &&
        this.activeJobs.size < this.concurrency
      ) {
        this.processJobs();
      }
    }, 1000);
  }

  // Clean up when shutting down
  destroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Create and export queue instance
const pdfQueue = new InMemoryQueue({
  concurrency: 2,
  retryAttempts: 3,
  retryDelay: 2000,
});

module.exports = pdfQueue;
