const crypto = require("crypto");
const LicenseCounter = require("../models/LicenseCounter");

const LICENSE_PREFIX = "AB-BGMI-";

const generateLicenseId = async (session) => {
  const year = String(new Date().getFullYear()).slice(-2);
  const counterKey = `license_${year}`;

  const counter = await LicenseCounter.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );

  const padded = String(counter.seq).padStart(6, "0");
  return `${LICENSE_PREFIX}${year}-${padded}`;
};

const generateVerificationToken = () => crypto.randomBytes(16).toString("hex");

module.exports = { generateLicenseId, generateVerificationToken, LICENSE_PREFIX };
