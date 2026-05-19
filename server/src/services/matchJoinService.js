const Match = require("../models/Match");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { debitWalletAndVirtualFunds } = require("./walletBalanceService");

const normalizeMatchStatus = (match) => {
  const now = Date.now();
  const start = new Date(match.startTime).getTime();
  const liveWindowMs = 1000 * 60 * 45;
  if (match.status === "Completed") return "Completed";
  if (now >= start + liveWindowMs) return "Completed";
  if (now >= start) return "Live";
  return "Upcoming";
};

/**
 * Registers a user for a match without debiting wallet (manual payment approval).
 */
const registerUserForMatch = async ({ userId, matchId, session, paymentNote = "" }) => {
  const match = await Match.findById(matchId).session(session);
  if (!match) {
    const err = new Error("Match not found.");
    err.statusCode = 404;
    throw err;
  }

  const effectiveStatus = normalizeMatchStatus(match);
  if (effectiveStatus !== "Upcoming") {
    const err = new Error("You can join only upcoming matches.");
    err.statusCode = 400;
    throw err;
  }

  const existing = await Registration.findOne({ user: userId, match: matchId }).session(session);
  if (existing) {
    const err = new Error("Already joined this match.");
    err.statusCode = 409;
    throw err;
  }

  const currentCount = await Registration.countDocuments({ match: matchId }).session(session);
  const maxPlayers = match.maxPlayers ?? 100;
  if (currentCount >= maxPlayers) {
    const err = new Error("Match is full.");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId).session(session);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 401;
    throw err;
  }

  const isBgmi = match.game === "BGMI";
  const isFreeFire = match.game === "Free Fire";
  if (isBgmi && (!user.bgmiName || !user.bgmiUid)) {
    const err = new Error(
      "Please complete your BGMI gaming profile before joining. Add BGMI Name and UID in your profile."
    );
    err.statusCode = 400;
    err.requiresGamingProfile = true;
    throw err;
  }
  if (isFreeFire && (!user.freeFireName || !user.freeFireUid)) {
    const err = new Error(
      "Please complete your Free Fire gaming profile before joining. Add Free Fire Name and UID in your profile."
    );
    err.statusCode = 400;
    err.requiresGamingProfile = true;
    throw err;
  }

  try {
    await Registration.create([{ user: userId, match: matchId }], { session });
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error("Already joined this match.");
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }

  const totalRegistrations = await Registration.countDocuments({ match: matchId }).session(session);
  match.joinedPlayersCount = totalRegistrations;
  await match.save({ session });

  const xpEarned = 10;
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: xpEarned } },
    { session, new: true }
  ).select("-password");

  if (updatedUser && updatedUser.xp) {
    const newLevel = Math.floor(updatedUser.xp / 100) + 1;
    if (newLevel !== updatedUser.level) {
      await User.findByIdAndUpdate(userId, { level: newLevel }, { session });
      updatedUser.level = newLevel;
    }
  }

  const entryDescription = paymentNote
    ? `Entry paid for ${match.title} (${paymentNote})`
    : `Entry paid for ${match.title}`;

  await Transaction.create(
    [
      {
        user: userId,
        type: "debit",
        amount: match.entryFee,
        source: "match_entry",
        description: entryDescription,
        referenceId: paymentNote || undefined,
        status: "success",
      },
    ],
    { session }
  );

  await Notification.create(
    [
      {
        user: userId,
        type: "match_joined",
        title: "Tournament Joined",
        message: `You joined ${match.title} successfully.`,
        metadata: { matchId: match._id, startTime: match.startTime },
      },
    ],
    { session }
  );

  return {
    match,
    updatedUser,
    joinedPlayersCount: match.joinedPlayersCount,
    remainingSlots: maxPlayers - match.joinedPlayersCount,
  };
};

/**
 * Registers user and debits wallet + virtualFunds by entry fee.
 */
const registerUserForMatchWithWallet = async ({ userId, matchId, session }) => {
  const match = await Match.findById(matchId).session(session);
  if (!match) {
    const err = new Error("Match not found.");
    err.statusCode = 404;
    throw err;
  }

  const effectiveStatus = normalizeMatchStatus(match);
  if (effectiveStatus !== "Upcoming") {
    const err = new Error("You can join only upcoming matches.");
    err.statusCode = 400;
    throw err;
  }

  const existing = await Registration.findOne({ user: userId, match: matchId }).session(session);
  if (existing) {
    const err = new Error("Already joined this match.");
    err.statusCode = 409;
    throw err;
  }

  const currentCount = await Registration.countDocuments({ match: matchId }).session(session);
  const maxPlayers = match.maxPlayers ?? 100;
  if (currentCount >= maxPlayers) {
    const err = new Error("Match is full.");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId).session(session);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 401;
    throw err;
  }

  const isBgmi = match.game === "BGMI";
  const isFreeFire = match.game === "Free Fire";
  if (isBgmi && (!user.bgmiName || !user.bgmiUid)) {
    const err = new Error("Please complete your BGMI gaming profile before joining.");
    err.statusCode = 400;
    err.requiresGamingProfile = true;
    throw err;
  }
  if (isFreeFire && (!user.freeFireName || !user.freeFireUid)) {
    const err = new Error("Please complete your Free Fire gaming profile before joining.");
    err.statusCode = 400;
    err.requiresGamingProfile = true;
    throw err;
  }

  await debitWalletAndVirtualFunds({ userId, amountInr: match.entryFee, session });

  try {
    await Registration.create([{ user: userId, match: matchId }], { session });
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error("Already joined this match.");
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }

  const totalRegistrations = await Registration.countDocuments({ match: matchId }).session(session);
  match.joinedPlayersCount = totalRegistrations;
  await match.save({ session });

  const xpEarned = 10;
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: xpEarned } },
    { session, new: true }
  ).select("-password");

  if (updatedUser?.xp) {
    const newLevel = Math.floor(updatedUser.xp / 100) + 1;
    if (newLevel !== updatedUser.level) {
      await User.findByIdAndUpdate(userId, { level: newLevel }, { session });
      updatedUser.level = newLevel;
    }
  }

  await Transaction.create(
    [
      {
        user: userId,
        type: "debit",
        amount: match.entryFee,
        source: "match_entry",
        description: `Entry paid for ${match.title}`,
        status: "success",
      },
    ],
    { session }
  );

  await Notification.create(
    [
      {
        user: userId,
        type: "match_joined",
        title: "Tournament Joined",
        message: `You joined ${match.title} successfully.`,
        metadata: { matchId: match._id, startTime: match.startTime },
      },
    ],
    { session }
  );

  return {
    match,
    updatedUser,
    joinedPlayersCount: match.joinedPlayersCount,
    remainingSlots: maxPlayers - match.joinedPlayersCount,
  };
};

module.exports = { registerUserForMatch, registerUserForMatchWithWallet, normalizeMatchStatus };
