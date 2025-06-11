const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["processing", "completed"],
      default: "processing",
    },
    pdfPath: { type: String },
    invoiceNumber: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
