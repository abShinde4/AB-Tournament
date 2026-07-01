const mongoose = require("mongoose");
const crypto = require("crypto");
const Registration = require("../models/Registration");
const User = require("../models/User");
const GamerLicense = require("../models/GamerLicense");
const LicenseConfig = require("../models/LicenseConfig");
const { generateLicenseId, generateVerificationToken } = require("./licenseIdService");

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getDefaultConfig = async () => {
  let config = await LicenseConfig.findById("license_config");
  if (!config) {
    config = await LicenseConfig.create({ _id: "license_config" });
  }
  return config;
};

const countApprovedMatches = async (userId) =>
  Registration.countDocuments({ user: userId });

const serializeLicense = (license) => {
  const doc = typeof license.toObject === "function" ? license.toObject() : license;
  return {
    ...doc,
    isFoundingMember: Boolean(doc.foundingMemberNumber),
    foundingBadge: doc.foundingMemberNumber
      ? `Founding Season 1 · Member #${doc.foundingMemberNumber}`
      : null,
    displayImageUrl: doc.imageUrl || doc.cdnUrl || doc.instagramUrl || doc.driveUrl || "",
  };
};

const getEligibility = async (userId) => {
  const [config, approvedMatches, existingLicense] = await Promise.all([
    getDefaultConfig(),
    countApprovedMatches(userId),
    GamerLicense.findOne({ user: userId }).select("status licenseId foundingMemberNumber"),
  ]);

  if (existingLicense) {
    return {
      hasLicense: true,
      license: serializeLicense(existingLicense),
      approvedMatches,
      eligible: false,
      remainingMatches: 0,
      reason: "You already have a verified gamer license.",
      foundingPhaseOpen: config.foundingSlotsClaimed < config.foundingMemberLimit,
    };
  }

  const foundingPhaseOpen = config.foundingSlotsClaimed < config.foundingMemberLimit;
  const foundingRequired = config.foundingRequiredMatches;
  const regularRequired = config.regularRequiredMatches;

  if (foundingPhaseOpen && approvedMatches >= foundingRequired) {
    return {
      hasLicense: false,
      approvedMatches,
      eligible: true,
      remainingMatches: 0,
      claimType: "founding",
      foundingPhaseOpen: true,
      foundingSlotsRemaining: config.foundingMemberLimit - config.foundingSlotsClaimed,
      requiredMatches: foundingRequired,
    };
  }

  if (!foundingPhaseOpen && approvedMatches >= regularRequired) {
    return {
      hasLicense: false,
      approvedMatches,
      eligible: true,
      remainingMatches: 0,
      claimType: "regular",
      foundingPhaseOpen: false,
      requiredMatches: regularRequired,
    };
  }

  const requiredMatches = foundingPhaseOpen ? foundingRequired : regularRequired;
  const remainingMatches = Math.max(requiredMatches - approvedMatches, 0);

  return {
    hasLicense: false,
    approvedMatches,
    eligible: false,
    remainingMatches,
    claimType: foundingPhaseOpen ? "founding" : "regular",
    foundingPhaseOpen,
    requiredMatches,
    message: `You need ${remainingMatches} more approved match${remainingMatches === 1 ? "" : "es"}.`,
  };
};

const claimLicense = async (userId) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const existing = await GamerLicense.findOne({ user: userId }).session(session);
      if (existing) {
        throw createHttpError("You already claimed a verified gamer license.", 409);
      }

      const [user, config, approvedMatches] = await Promise.all([
        User.findById(userId).session(session),
        LicenseConfig.findById("license_config").session(session),
        countApprovedMatches(userId),
      ]);

      if (!user) throw createHttpError("User not found.", 404);

      const cfg =
        config ||
        (await LicenseConfig.create([{ _id: "license_config" }], { session }))[0];

      const foundingPhaseOpen = cfg.foundingSlotsClaimed < cfg.foundingMemberLimit;
      let foundingMemberNumber = null;

      if (foundingPhaseOpen) {
        if (approvedMatches < cfg.foundingRequiredMatches) {
          throw createHttpError(
            `You need ${cfg.foundingRequiredMatches - approvedMatches} more approved match(es) to claim.`,
            403
          );
        }
        const updatedConfig = await LicenseConfig.findOneAndUpdate(
          { _id: "license_config", foundingSlotsClaimed: { $lt: cfg.foundingMemberLimit } },
          { $inc: { foundingSlotsClaimed: 1 } },
          { new: true, session }
        );
        if (!updatedConfig) {
          throw createHttpError("Founding member slots are full. Complete more matches to claim.", 403);
        }
        foundingMemberNumber = updatedConfig.foundingSlotsClaimed;
      } else if (approvedMatches < cfg.regularRequiredMatches) {
        throw createHttpError(
          `You need ${cfg.regularRequiredMatches - approvedMatches} more approved match(es) to claim.`,
          403
        );
      }

      const licenseId = await generateLicenseId(session);
      let verificationToken = generateVerificationToken();
      let tokenExists = await GamerLicense.findOne({ verificationToken }).session(session);
      while (tokenExists) {
        verificationToken = generateVerificationToken();
        tokenExists = await GamerLicense.findOne({ verificationToken }).session(session);
      }

      const now = new Date();
      const [license] = await GamerLicense.create(
        [
          {
            licenseId,
            user: userId,
            playerName: user.fullName || user.username,
            bgmiUid: user.bgmiUid || "",
            level: user.level || 1,
            xp: user.xp || 0,
            tier: cfg.defaultTier || "Bronze",
            status: "active",
            foundingMemberNumber,
            verificationToken,
            issueDate: now,
            claimDate: now,
            approvedMatchesAtClaim: approvedMatches,
          },
        ],
        { session }
      );

      result = serializeLicense(license);
    });
    return result;
  } finally {
    session.endSession();
  }
};

const verifyLicense = async ({ licenseId, token }) => {
  let license = null;
  if (licenseId) {
    license = await GamerLicense.findOne({
      licenseId: licenseId.trim().toUpperCase(),
      status: "active",
    }).populate("user", "username fullName avatar");
  } else if (token) {
    license = await GamerLicense.findOne({
      verificationToken: token.trim(),
      status: "active",
    }).populate("user", "username fullName avatar");
  }

  if (!license) {
    return { valid: false, message: "Invalid License" };
  }

  const approvedMatches = await countApprovedMatches(license.user._id || license.user);

  return {
    valid: true,
    license: {
      licenseId: license.licenseId,
      playerName: license.playerName,
      bgmiUid: license.bgmiUid,
      tier: license.tier,
      status: license.status,
      issueDate: license.issueDate,
      claimDate: license.claimDate,
      approvedMatchesAtClaim: license.approvedMatchesAtClaim,
      currentApprovedMatches: approvedMatches,
      foundingMemberNumber: license.foundingMemberNumber,
      foundingBadge: license.foundingMemberNumber
        ? `Founding Season 1 · Member #${license.foundingMemberNumber}`
        : null,
      verificationToken: license.verificationToken,
    },
  };
};

const getMyLicense = async (userId) => {
  const license = await GamerLicense.findOne({ user: userId });
  if (!license) return null;
  return serializeLicense(license);
};

const adminUpdateLicense = async ({ licenseId, adminId, updates }) => {
  const license = await GamerLicense.findOne({
    $or: [{ _id: licenseId }, { licenseId: String(licenseId).toUpperCase() }],
  });
  if (!license) throw createHttpError("License not found.", 404);

  const allowed = [
    "status",
    "tier",
    "imageUrl",
    "instagramUrl",
    "cdnUrl",
    "driveUrl",
    "rejectionReason",
    "playerName",
    "bgmiUid",
  ];

  allowed.forEach((key) => {
    if (updates[key] !== undefined) license[key] = updates[key];
  });

  if (updates.status === "active" || updates.status === "rejected" || updates.status === "disabled") {
    license.reviewedBy = adminId;
    license.reviewedAt = new Date();
  }

  await license.save();
  return serializeLicense(license);
};

const adminCreateLicenseForUser = async ({ userId, adminId, tier }) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const existing = await GamerLicense.findOne({ user: userId }).session(session);
      if (existing) throw createHttpError("User already has a license.", 409);

      const user = await User.findById(userId).session(session);
      if (!user) throw createHttpError("User not found.", 404);

      const config = await getDefaultConfig();
      const approvedMatches = await countApprovedMatches(userId);
      const licenseId = await generateLicenseId(session);
      const verificationToken = crypto.randomBytes(16).toString("hex");
      const now = new Date();

      const [license] = await GamerLicense.create(
        [
          {
            licenseId,
            user: userId,
            playerName: user.fullName || user.username,
            bgmiUid: user.bgmiUid || "",
            level: user.level || 1,
            xp: user.xp || 0,
            tier: tier || config.defaultTier || "Bronze",
            status: "active",
            verificationToken,
            issueDate: now,
            claimDate: now,
            approvedMatchesAtClaim: approvedMatches,
            reviewedBy: adminId,
            reviewedAt: now,
          },
        ],
        { session }
      );

      result = serializeLicense(license);
    });
    return result;
  } finally {
    session.endSession();
  }
};

const updateConfig = async (patch) => {
  const config = await LicenseConfig.findByIdAndUpdate(
    "license_config",
    { $set: patch },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return config;
};

module.exports = {
  getDefaultConfig,
  getEligibility,
  claimLicense,
  verifyLicense,
  getMyLicense,
  adminUpdateLicense,
  adminCreateLicenseForUser,
  updateConfig,
  serializeLicense,
  countApprovedMatches,
};
