const mongoose = require("mongoose");

const licenseConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "license_config" },
    foundingMemberLimit: { type: Number, default: 15, min: 1, max: 100 },
    foundingRequiredMatches: { type: Number, default: 2, min: 1, max: 50 },
    regularRequiredMatches: { type: Number, default: 5, min: 1, max: 50 },
    foundingSlotsClaimed: { type: Number, default: 0, min: 0 },
    tiers: {
      type: [String],
      default: ["Bronze", "Silver", "Gold", "Elite"],
    },
    defaultTier: { type: String, default: "Bronze" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LicenseConfig", licenseConfigSchema);
