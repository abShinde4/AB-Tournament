const mongoose = require("mongoose");

const squadPlayerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true, trim: true },
    bgmiUid: { type: String, required: true, trim: true },
    joinedAt: { type: Date, default: Date.now },
    isLeader: { type: Boolean, default: false },
  },
  { _id: false }
);

const squadTeamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, trim: true },
    teamId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    leaderUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    leaderName: { type: String, required: true, trim: true },
    leaderWhatsapp: { type: String, required: true, trim: true },
    leaderBgmiUid: { type: String, required: true, trim: true },
    teamLogo: { type: String, default: "", trim: true },
    teamDescription: { type: String, default: "", trim: true },
    teamPasswordHash: { type: String, default: null, select: false },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    players: { type: [squadPlayerSchema], default: [] },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    entryFeePaid: { type: Number, default: 0, min: 0 },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

squadTeamSchema.index({ tournament: 1, leaderUser: 1 }, { unique: true });
squadTeamSchema.index({ tournament: 1, "players.user": 1 }, { unique: true });
squadTeamSchema.index({ teamName: 1 });
squadTeamSchema.index({ leaderWhatsapp: 1 });

module.exports = mongoose.model("SquadTeam", squadTeamSchema);
