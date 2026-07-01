const GamerLicense = require("../models/GamerLicense");
const LicenseConfig = require("../models/LicenseConfig");

const syncLicenseConfig = async () => {
  const foundingCount = await GamerLicense.countDocuments({
    foundingMemberNumber: { $ne: null },
  });

  await LicenseConfig.findByIdAndUpdate(
    "license_config",
    {
      $setOnInsert: {
        foundingMemberLimit: 15,
        foundingRequiredMatches: 2,
        regularRequiredMatches: 5,
        defaultTier: "Bronze",
        tiers: ["Bronze", "Silver", "Gold", "Elite"],
      },
      $max: { foundingSlotsClaimed: foundingCount },
    },
    { upsert: true }
  );
};

module.exports = { syncLicenseConfig };
