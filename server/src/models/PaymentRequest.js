const mongoose = require("mongoose");

const PaymentRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String },
    amount: { type: Number, required: true, min: 1 },
    utr: { type: String, required: true, trim: true, uppercase: true },
    screenshot: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

PaymentRequestSchema.index(
  { utr: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "approved"] } } }
);
PaymentRequestSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("PaymentRequest", PaymentRequestSchema);
