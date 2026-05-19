const mongoose = require("mongoose");

const tournamentPaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    paymentAmount: { type: Number, required: true, min: 1 },
    utr: { type: String, required: true, trim: true, uppercase: true },
    paymentScreenshot: { type: String, trim: true, default: "" },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "rejected"],
      default: "pending",
      required: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true }
);

tournamentPaymentSchema.index({ user: 1, tournament: 1, createdAt: -1 });
tournamentPaymentSchema.index(
  { user: 1, tournament: 1 },
  { unique: true, partialFilterExpression: { paymentStatus: "pending" } }
);
tournamentPaymentSchema.index(
  { utr: 1 },
  {
    unique: true,
    partialFilterExpression: { paymentStatus: { $in: ["pending", "success"] } },
  }
);

module.exports = mongoose.model("TournamentPayment", tournamentPaymentSchema);
