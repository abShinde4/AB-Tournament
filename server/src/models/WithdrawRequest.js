const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 30 },
    upiId: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    processingFee: { type: Number, default: 0, min: 0 },
    totalDebited: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

withdrawRequestSchema.index({ user: 1, status: 1, createdAt: -1 });
// Enforces "max 1 pending withdraw per user" at DB level.
withdrawRequestSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);

