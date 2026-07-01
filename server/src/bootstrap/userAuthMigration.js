const User = require("../models/User");
const SystemMigration = require("../models/SystemMigration");

const MIGRATION_NAME = "user_auth_phone_migration_v1";
const PHONE_VERIFIED_BACKFILL = "phone_verified_backfill_v2";

const hasValidPhone = (phoneNumber) => /^[6-9]\d{9}$/.test(String(phoneNumber || ""));

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
const runUserAuthMigration = async () => {
  const alreadyRan = await SystemMigration.findOne({ name: MIGRATION_NAME });
  if (!alreadyRan) {
    const stats = {
      scanned: 0,
      phoneVerifiedSet: 0,
      isActiveSet: 0,
      timestampsFixed: 0,
    };

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

    await SystemMigration.create({ name: MIGRATION_NAME, stats });
    // eslint-disable-next-line no-console
    console.log(`User auth migration complete (${MIGRATION_NAME}):`, stats);
  }

  await runPhoneVerifiedBackfill();
};

module.exports = { runUserAuthMigration, MIGRATION_NAME, PHONE_VERIFIED_BACKFILL };
