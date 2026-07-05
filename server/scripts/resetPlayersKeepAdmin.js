#!/usr/bin/env node
const path = require("path");
const dotenv = require("dotenv");
const connectDb = require("../src/config/db");
const User = require("../src/models/User");
const Registration = require("../src/models/Registration");
const TournamentPayment = require("../src/models/TournamentPayment");
const Transaction = require("../src/models/Transaction");
const WithdrawRequest = require("../src/models/WithdrawRequest");
const MatchJoinRequest = require("../src/models/MatchJoinRequest");
const SquadTeam = require("../src/models/SquadTeam");
const GamerLicense = require("../src/models/GamerLicense");
const { normalizePhone } = require("../src/utils/phoneUtils");

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const main = async () => {
  try {
    await connectDb();

    const adminPhone = process.env.ADMIN_PHONE ? normalizePhone(process.env.ADMIN_PHONE) : null;
    const legacyAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";

    const adminFilter = {
      $or: [
        { role: "admin" },
        ...(legacyAdminEmail ? [{ email: legacyAdminEmail }] : []),
        ...(adminPhone ? [{ phoneNumber: adminPhone }] : []),
        { username: adminUsername },
      ],
    };

    const adminUsers = await User.find(adminFilter).select("_id username fullName phoneNumber email role");

    if (adminUsers.length === 0) {
      console.warn("No admin user matched the preserved admin filter. No users were deleted.");
      process.exit(0);
    }

    console.log("Admin user(s) that will be preserved:");
    console.log(JSON.stringify(adminUsers, null, 2));
    console.log("Deletion filter:", JSON.stringify({ $and: [{ _id: { $nin: adminUsers.map((user) => user._id) } }, { role: { $ne: "admin" } }] }, null, 2));

    const deletedIds = adminUsers.map((user) => user._id);
    const deleteResult = await User.deleteMany({
      _id: { $nin: deletedIds },
      role: { $ne: "admin" },
    });

    const relatedCleanupResults = {};
    const cleanupCollection = async (model, filter, label) => {
      const result = await model.deleteMany(filter);
      relatedCleanupResults[label] = result.deletedCount;
    };

    await cleanupCollection(Registration, { user: { $in: deletedIds } }, "registrations");
    await cleanupCollection(TournamentPayment, { user: { $in: deletedIds } }, "tournamentPayments");
    await cleanupCollection(Transaction, { user: { $in: deletedIds } }, "transactions");
    await cleanupCollection(WithdrawRequest, { user: { $in: deletedIds } }, "withdrawRequests");
    await cleanupCollection(MatchJoinRequest, { user: { $in: deletedIds } }, "matchJoinRequests");
    await cleanupCollection(GamerLicense, { user: { $in: deletedIds } }, "gamerLicenses");
    await cleanupCollection(SquadTeam, { leaderUser: { $in: deletedIds } }, "squadTeams");

    console.log("Reset summary:");
    console.log(JSON.stringify({
      adminUsersPreserved: adminUsers.length,
      nonAdminUsersDeleted: deleteResult.deletedCount,
      relatedCollectionsCleaned: relatedCleanupResults,
    }, null, 2));
  } catch (error) {
    console.error("Player reset failed:", error.message || error);
    process.exit(1);
  } finally {
    await require("mongoose").disconnect().catch(() => {});
  }
};

main();
