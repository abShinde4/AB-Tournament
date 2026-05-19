const mongoose = require("mongoose");

const matchJoinRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, trim: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    entryFee: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true }
);

matchJoinRequestSchema.index({ user: 1, match: 1, createdAt: -1 });
matchJoinRequestSchema.index(
  { user: 1, match: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("MatchJoinRequest", matchJoinRequestSchema);
