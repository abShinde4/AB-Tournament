const mongoose = require("mongoose");

const squadResultPlayerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true, trim: true },
    bgmiUid: { type: String, default: "", trim: true },
    kills: { type: Number, default: 0, min: 0 },
    isLeader: { type: Boolean, default: false },
  },
  { _id: false }
);

const squadTeamResultSchema = new mongoose.Schema(
  {
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    squadTeam: { type: mongoose.Schema.Types.ObjectId, ref: "SquadTeam", required: true },
    teamId: { type: String, required: true, trim: true },
    teamName: { type: String, required: true, trim: true },
    leaderUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    leaderName: { type: String, required: true, trim: true },
    players: { type: [squadResultPlayerSchema], default: [] },
    kills: { type: Number, default: 0, min: 0 },
    winnings: { type: Number, default: 0, min: 0 },
    rank: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

squadTeamResultSchema.index({ match: 1, squadTeam: 1 }, { unique: true });
squadTeamResultSchema.index({ match: 1, rank: 1 });

module.exports = mongoose.model("SquadTeamResult", squadTeamResultSchema);
