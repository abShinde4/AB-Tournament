const Match = require("../models/Match");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const Result = require("../models/Result");
const mongoose = require("mongoose");
const roomUnlockMs = 10 * 60 * 1000;

const normalizeMatchStatus = (match) => {
  const now = Date.now();
  const start = new Date(match.startTime).getTime();
  const liveWindowMs = 1000 * 60 * 45;
  if (match.status === "Completed") return "Completed";
  if (now >= start + liveWindowMs) return "Completed";
  if (now >= start) return "Live";
  return "Upcoming";
};

const serializeMatch = (match, joinedMatchIds = new Set()) => {
  const item = typeof match.toObject === "function" ? match.toObject() : match;
  const now = Date.now();
  const unlockTime = item.roomUnlockTime ? new Date(item.roomUnlockTime).getTime() : null;
  const isRoomVisible = item.isRoomPublished && unlockTime && now >= unlockTime;

  const joinedPlayersCount = typeof item.joinedPlayersCount === "number" ? item.joinedPlayersCount : 0;
  const safe = {
    ...item,
    status: normalizeMatchStatus(match),
    roomId: "",
    roomPassword: "",
    password: "",
    isRoomPublished: item.isRoomPublished,
    roomUnlockTime: item.roomUnlockTime,
    isRoomVisible,
    joinedPlayersCount,
    remainingSlots: (item.maxPlayers || 100) - joinedPlayersCount,
  };

  const userJoined = joinedMatchIds.has(String(item._id));
  if (safe.isRoomVisible && userJoined) {
    safe.roomId = item.roomId || "";
    safe.roomPassword = item.roomPassword || "";
    safe.password = item.roomPassword || "";
  }

  return safe;
};

const defaultMatches = () => [
  {
    title: "AB Free Fire Solo Cup",
    game: "Free Fire",
    entryFee: 20,
    prizePool: 200,
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 3),
    status: "Upcoming",
    maxPlayers: 100,
    joinedPlayersCount: 0,
  },
  {
    title: "AB BGMI Squad Clash",
    game: "BGMI",
    entryFee: 20,
    prizePool: 500,
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 7),
    status: "Upcoming",
    maxPlayers: 100,
    joinedPlayersCount: 0,
  },
];

const ensureDefaultMatches = async () => {
  const total = await Match.countDocuments();
  if (total > 0 || process.env.NODE_ENV === "production") return;
  await Match.insertMany(defaultMatches());
};

const listMatches = async (req, res) => {
  await ensureDefaultMatches();

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const [matches, total] = await Promise.all([
    Match.find().sort({ startTime: 1 }).skip(skip).limit(limit),
    Match.countDocuments(),
  ]);

  let joinedMatchIds = new Set();
  if (req.user?._id && matches.length > 0) {
    const registrations = await Registration.find({
      user: req.user._id,
      match: { $in: matches.map((m) => m._id) },
    }).select("match");
    joinedMatchIds = new Set(registrations.map((entry) => String(entry.match)));
  }

  const matchIds = matches.map((match) => match._id);
  const registrationCounts = await Registration.aggregate([
    { $match: { match: { $in: matchIds } } },
    { $group: { _id: "$match", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(registrationCounts.map((item) => [String(item._id), item.count]));

  const patchedMatches = matches.map((match) => {
    const item = match.toObject();
    const actualCount = countMap.get(String(match._id)) || 0;
    if (typeof item.joinedPlayersCount !== "number" || item.joinedPlayersCount !== actualCount) {
      item.joinedPlayersCount = actualCount;
    }
    return item;
  });

  const bulkOps = patchedMatches
    .filter((item) => typeof item.joinedPlayersCount === "number" && item.joinedPlayersCount !== matches.find((m) => String(m._id) === String(item._id)).joinedPlayersCount)
    .map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { joinedPlayersCount: item.joinedPlayersCount },
      },
    }));
  if (bulkOps.length) {
    await Match.bulkWrite(bulkOps);
  }

  return res.json({
    data: patchedMatches.map((match) => serializeMatch(match, joinedMatchIds)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    serverTime: new Date().toISOString(),
  });
};

const createMatch = async (req, res) => {
  const { title, game, entryFee, prizePool, startTime, status, maxPlayers, roomId, roomPassword } =
    req.validated.body;
  const startDate = new Date(startTime);
  const roomReady = Boolean(roomId && roomPassword);
  const shouldBeVisible = roomReady && startDate.getTime() - Date.now() <= roomUnlockMs;

  const match = await Match.create({
    title,
    game,
    entryFee: entryFee ?? 20,
    prizePool,
    startTime: startDate,
    status: status ?? "Upcoming",
    maxPlayers: maxPlayers ?? 100,
    joinedPlayersCount: 0,
    roomId: roomId ?? "",
    roomPassword: roomPassword ?? "",
    isRoomVisible: shouldBeVisible,
  });

  return res.status(201).json(match);
};

const updateMatch = async (req, res) => {
  const { matchId } = req.validated.params;
  const patch = { ...req.validated.body };
  if (patch.startTime) {
    patch.startTime = new Date(patch.startTime);
  }
  const finalStart = patch.startTime;
  const hasRoomCredentials =
    typeof patch.roomId === "string" || typeof patch.roomPassword === "string";
  if (hasRoomCredentials || finalStart) {
    const current = await Match.findById(matchId).select("startTime roomId roomPassword");
    if (!current) {
      return res.status(404).json({ message: "Match not found." });
    }
    const nextStart = finalStart || current.startTime;
    const nextRoomId = patch.roomId ?? current.roomId;
    const nextRoomPassword = patch.roomPassword ?? current.roomPassword;
    const roomReady = Boolean(nextRoomId && nextRoomPassword);
    if (!patch.isRoomVisible) {
      patch.isRoomVisible = roomReady && new Date(nextStart).getTime() - Date.now() <= roomUnlockMs;
    }
  }
  const match = await Match.findByIdAndUpdate(matchId, patch, { new: true });
  if (!match) {
    return res.status(404).json({ message: "Match not found." });
  }
  return res.json(match);
};

const deleteMatch = async (req, res) => {
  const { matchId } = req.validated.params;
  const match = await Match.findByIdAndDelete(matchId);
  if (!match) {
    return res.status(404).json({ message: "Match not found." });
  }
  await Registration.deleteMany({ match: matchId });
  return res.json({ message: "Match deleted successfully." });
};

const joinMatch = async (req, res) => {
  const { matchId } = req.params;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const match = await Match.findById(matchId).session(session);
    if (!match) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Match not found." });
    }

    const effectiveStatus = normalizeMatchStatus(match);
    if (effectiveStatus !== "Upcoming") {
      await session.abortTransaction();
      return res.status(400).json({ message: "You can join only upcoming matches." });
    }

    const existing = await Registration.findOne({ user: req.user._id, match: matchId }).session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(409).json({ message: "Already joined this match." });
    }

    const currentCount = await Registration.countDocuments({ match: matchId }).session(session);
    const maxPlayers = match.maxPlayers ?? 100;
    if (currentCount >= maxPlayers) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Match is full." });
    }

    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(401).json({ message: "User not found." });
    }

    if (user.walletBalance < match.entryFee) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Insufficient wallet balance." });
    }

    const isBgmi = match.game === "BGMI";
    const isFreeFire = match.game === "Free Fire";
    if (isBgmi && (!user.bgmiName || !user.bgmiUid)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Please complete your BGMI gaming profile before joining. Add BGMI Name and UID in your profile.",
        requiresGamingProfile: true,
      });
    }
    if (isFreeFire && (!user.freeFireName || !user.freeFireUid)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Please complete your Free Fire gaming profile before joining. Add Free Fire Name and UID in your profile.",
        requiresGamingProfile: true,
      });
    }

    try {
      await Registration.create([{ user: req.user._id, match: matchId }], { session });
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000) {
        return res.status(409).json({ message: "Already joined this match." });
      }
      throw error;
    }

    const totalRegistrations = await Registration.countDocuments({ match: matchId }).session(session);
    match.joinedPlayersCount = totalRegistrations;
    await match.save({ session });

    const xpEarned = 10;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          walletBalance: -match.entryFee,
          xp: xpEarned,
        },
      },
      { session, new: true }
    ).select("-password");

    if (updatedUser && updatedUser.xp) {
      const newLevel = Math.floor(updatedUser.xp / 100) + 1;
      if (newLevel !== updatedUser.level) {
        await User.findByIdAndUpdate(
          req.user._id,
          { level: newLevel },
          { session }
        );
        updatedUser.level = newLevel;
      }
    }

    await Transaction.create(
      [
        {
          user: req.user._id,
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
          user: req.user._id,
          type: "match_joined",
          title: "Tournament Joined",
          message: `You joined ${match.title} successfully.`,
          metadata: { matchId: match._id, startTime: match.startTime },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      message: "Joined successfully.",
      walletBalance: updatedUser.walletBalance,
      xp: updatedUser.xp,
      level: updatedUser.level,
      joinedPlayersCount: match.joinedPlayersCount,
      remainingSlots: maxPlayers - match.joinedPlayersCount,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error joining match:", error);
    return res.status(500).json({ message: error.message || "Failed to join match." });
  } finally {
    await session.endSession();
  }
};

const dashboard = async (req, res) => {
  const registrations = await Registration.find({ user: req.user._id }).populate("match");
  const resultsCount = await Result.countDocuments({
    user: req.user._id,
    rank: 1,
  });

  return res.json({
    walletBalance: (await User.findById(req.user._id).select("walletBalance"))?.walletBalance ?? 0,
    stats: {
      totalMatchesJoined: registrations.length,
      totalWins: resultsCount,
    },
    joinedMatches: registrations.map((entry) => ({
      id: entry.match?._id,
      title: entry.match?.title,
      game: entry.match?.game,
      status: entry.match ? normalizeMatchStatus(entry.match) : "Upcoming",
      startTime: entry.match?.startTime,
      prizePool: entry.match?.prizePool,
      entryFee: entry.match?.entryFee,
    })),
  });
};

/**
 * Get match details with room credentials
 * Only accessible to users who have joined the match
 */
const getMatchDetails = async (req, res) => {
  const { matchId } = req.params;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: "Match not found." });
  }

  // Verify user has joined (req.registration set by requireMatchJoined middleware)
  if (!req.registration) {
    return res.status(403).json({ message: "You must join this match to view details." });
  }

  const item = match.toObject();
  const details = {
    ...item,
    status: normalizeMatchStatus(match),
  };

  // Check if room is published and unlocked
  const now = Date.now();
  const unlockTime = match.roomUnlockTime ? new Date(match.roomUnlockTime).getTime() : null;
  const isRoomUnlocked = unlockTime && now >= unlockTime;

  if (match.isRoomPublished && isRoomUnlocked) {
    // Room is published and time has passed - show credentials
    details.roomId = item.roomId || "";
    details.roomPassword = item.roomPassword || "";
    details.password = item.roomPassword || "";
    details.isRoomVisible = true;
    details.roomUnlockedAt = match.roomUnlockTime;
  } else {
    // Room not ready yet - hide credentials and show unlock time
    details.roomId = "";
    details.roomPassword = "";
    details.password = "";
    details.isRoomVisible = false;
    details.roomUnlockedAt = match.roomUnlockTime || null;
  }

  return res.json(details);
};

module.exports = {
  listMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  joinMatch,
  dashboard,
  getMatchDetails,
};
