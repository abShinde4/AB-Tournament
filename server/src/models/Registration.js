const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    joinedAt: { type: Date, default: Date.now },
    // Player verification
    isPlayerVerified: { type: Boolean, default: false },
    verificationNotes: { type: String, default: "", trim: true },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    squadTeam: { type: mongoose.Schema.Types.ObjectId, ref: "SquadTeam", default: null },
  },
  { timestamps: true }
);

registrationSchema.index({ user: 1, match: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
