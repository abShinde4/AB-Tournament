const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rank: { type: Number, required: true, min: 1 },
    kills: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: 0 },
    winnings: { type: Number, default: 0, min: 0 },
    xpAwardedForWin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resultSchema.index({ match: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);
