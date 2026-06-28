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
    matchType: {
      type: String,
      enum: ["Solo", "Duo", "Squad", "TDM", "Arena", "Custom"],
      trim: true,
    },
    map: {
      type: String,
      enum: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa", "Random"],
      trim: true,
    },
    perspective: {
      type: String,
      enum: ["TPP", "FPP"],
      trim: true,
    },
    maxPlayers: { type: Number, default: 100, min: 1 },
    joinedPlayersCount: { type: Number, default: 0, min: 0 },
    maxTeams: { type: Number, default: null, min: 1 },
    joinedTeamsCount: { type: Number, default: 0, min: 0 },
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
