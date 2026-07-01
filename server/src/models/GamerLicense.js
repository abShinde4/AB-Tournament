const mongoose = require("mongoose");

const gamerLicenseSchema = new mongoose.Schema(
  {
    licenseId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    playerName: { type: String, required: true, trim: true, maxlength: 60 },
    bgmiUid: { type: String, default: "", trim: true, maxlength: 32 },
    level: { type: Number, default: 1, min: 1 },
    xp: { type: Number, default: 0, min: 0 },
    tier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Elite"],
      default: "Bronze",
    },
    status: {
      type: String,
      enum: ["active", "pending", "disabled", "rejected"],
      default: "active",
    },
    foundingMemberNumber: { type: Number, default: null, min: 1, max: 15 },
    verificationToken: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    claimDate: { type: Date, default: Date.now },
    approvedMatchesAtClaim: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, default: "", trim: true, maxlength: 500 },
    instagramUrl: { type: String, default: "", trim: true, maxlength: 500 },
    cdnUrl: { type: String, default: "", trim: true, maxlength: 500 },
    driveUrl: { type: String, default: "", trim: true, maxlength: 500 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

gamerLicenseSchema.index({ status: 1, createdAt: -1 });
gamerLicenseSchema.index({ foundingMemberNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("GamerLicense", gamerLicenseSchema);
