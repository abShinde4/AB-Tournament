const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 1 },
    source: {
      type: String,
      enum: [
        "add_money",
        "match_entry",
        "match_winnings",
        "admin_adjustment",
        "withdraw_request",
        "withdraw_refund",
        "squad_team_entry",
        "squad_team_winnings",
      ],
      required: true,
    },
    description: { type: String, trim: true, maxlength: 200 },
    reason: { type: String, trim: true, maxlength: 200 },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    referenceId: { type: String, trim: true, maxlength: 64 },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
