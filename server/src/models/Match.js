const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    game: { type: String, enum: ["Free Fire", "BGMI"], required: true },
    entryFee: { type: Number, required: true, min: 0, default: 20 },
    prizePool: { type: Number, required: true, min: 0 },
    startTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Upcoming", "Live", "Completed"],
      default: "Upcoming",
    },
    maxPlayers: { type: Number, default: 100, min: 1 },
    roomId: { type: String, default: "", trim: true },
    roomPassword: { type: String, default: "", trim: true },
    roomUnlockTime: { type: Date, default: null },
    isRoomPublished: { type: Boolean, default: false },
    isRoomVisible: { type: Boolean, default: false },
    resultsPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
