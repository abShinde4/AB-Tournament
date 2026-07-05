const User = require("../models/User");
const SystemMigration = require("../models/SystemMigration");
const { normalizePhone } = require("../utils/phoneUtils");

const MIGRATION_NAME = "user_auth_phone_migration_v1";
const PHONE_VERIFIED_BACKFILL = "phone_verified_backfill_v2";

const hasValidPhone = (phoneNumber) => /^[6-9]\d{9}$/.test(String(phoneNumber || ""));

const normalizeEmail = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

const runPhoneVerifiedBackfill = async () => {
  const alreadyRan = await SystemMigration.findOne({ name: PHONE_VERIFIED_BACKFILL });
  if (alreadyRan) return alreadyRan.stats;

  const [verifiedResult, unverifiedResult] = await Promise.all([
    User.updateMany({ phoneNumber: { $regex: /^[6-9]\d{9}$/ } }, { $set: { phoneVerified: true } }),
    User.updateMany(
      {
        $or: [
          { phoneNumber: { $exists: false } },
          { phoneNumber: null },
          { phoneNumber: "" },
          { phoneNumber: { $not: { $regex: /^[6-9]\d{9}$/ } } },
        ],
      },
      { $set: { phoneVerified: false } }
    ),
  ]);

  const stats = {
    phoneVerifiedTrue: verifiedResult.modifiedCount,
    phoneVerifiedFalse: unverifiedResult.modifiedCount,
  };

  await SystemMigration.create({ name: PHONE_VERIFIED_BACKFILL, stats });
  // eslint-disable-next-line no-console
  console.log(`Phone verified backfill complete (${PHONE_VERIFIED_BACKFILL}):`, stats);
  return stats;
};

/**
 * One-time migration: backfill phoneVerified, isActive, timestamps.
 * Never overwrites existing phone numbers or password hashes.
 */
const ensureAuthIndexes = async () => {
  try {
    await User.collection.dropIndex("email_1").catch(() => {});
    await User.collection.dropIndex("phoneNumber_1").catch(() => {});
    await User.collection.createIndex({ phoneNumber: 1 }, { unique: true, sparse: true, name: "phoneNumber_1" });
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true, name: "email_1" });
    await User.updateMany({ $or: [{ email: null }, { email: "" }, { email: { $exists: false } }] }, { $unset: { email: "" } });
    // eslint-disable-next-line no-console
    console.log("Auth indexes ensured for phone/email uniqueness.");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Auth index refresh skipped:", error.message || error);
  }
};

const runUserAuthMigration = async () => {
  const alreadyRan = await SystemMigration.findOne({ name: MIGRATION_NAME });
  if (!alreadyRan) {
    const stats = {
      scanned: 0,
      phoneVerifiedSet: 0,
      isActiveSet: 0,
      timestampsFixed: 0,
      phoneNormalized: 0,
      emailNormalized: 0,
      phoneConflictsResolved: 0,
    };

    const seenPhones = new Map();
    const cursor = User.find({}).cursor();
    // eslint-disable-next-line no-restricted-syntax
    for await (const user of cursor) {
      stats.scanned += 1;
      const updates = {};
      const now = new Date();

      if (user.phoneVerified === undefined || user.phoneVerified === null) {
        updates.phoneVerified = hasValidPhone(user.phoneNumber);
        stats.phoneVerifiedSet += 1;
      }

      if (user.isActive === undefined || user.isActive === null) {
        updates.isActive = true;
        stats.isActiveSet += 1;
      }

      const normalizedPhone = normalizePhone(user.phoneNumber);
      if (normalizedPhone && normalizedPhone !== user.phoneNumber) {
        updates.phoneNumber = normalizedPhone;
        stats.phoneNormalized += 1;
      } else if (!normalizedPhone && user.phoneNumber) {
        updates.phoneNumber = null;
        updates.phoneVerified = false;
        stats.phoneNormalized += 1;
      }

      if (normalizedPhone && !seenPhones.has(normalizedPhone)) {
        seenPhones.set(normalizedPhone, user._id.toString());
      }

      const normalizedEmail = normalizeEmail(user.email);
      if (normalizedEmail !== user.email) {
        updates.email = normalizedEmail;
        stats.emailNormalized += 1;
      }
      if (user.email === "") {
        updates.email = null;
        stats.emailNormalized += 1;
      }

      if (!user.createdAt) {
        updates.createdAt = now;
        stats.timestampsFixed += 1;
      }
      if (!user.updatedAt) {
        updates.updatedAt = user.createdAt || now;
        stats.timestampsFixed += 1;
      }

      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
      }
    }

    try {
      await User.syncIndexes();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("User index sync skipped:", error.message || error);
    }

    await ensureAuthIndexes();

    await SystemMigration.create({ name: MIGRATION_NAME, stats });
    // eslint-disable-next-line no-console
    console.log(`User auth migration complete (${MIGRATION_NAME}):`, stats);
  }

  await ensureAuthIndexes();
  await runPhoneVerifiedBackfill();
};

module.exports = { runUserAuthMigration, MIGRATION_NAME, PHONE_VERIFIED_BACKFILL };
