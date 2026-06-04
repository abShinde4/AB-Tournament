const mongoose = require("mongoose");

const winnerHighlightSchema = new mongoose.Schema(
  {
    result: { type: mongoose.Schema.Types.ObjectId, ref: "Result", default: null },
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    winnerName: { type: String, default: null },
    teamName: { type: String, default: null },
    prizeAmount: { type: Number, default: null, min: 0 },
    matchType: { type: String, default: null },
    map: { type: String, default: null },
    youtubeUrl: { type: String, default: null },
    instagramUrl: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    description: { type: String, default: null },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for faster queries
winnerHighlightSchema.index({ match: 1 });
winnerHighlightSchema.index({ user: 1 });
winnerHighlightSchema.index({ createdAt: -1 });

module.exports = mongoose.model("WinnerHighlight", winnerHighlightSchema);
