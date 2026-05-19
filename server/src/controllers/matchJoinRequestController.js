const mongoose = require("mongoose");
const Match = require("../models/Match");
const MatchJoinRequest = require("../models/MatchJoinRequest");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { normalizeMatchStatus } = require("../services/matchJoinService");
const { registerUserForMatchWithWallet } = require("../services/matchJoinService");

const submitMatchJoinRequest = async (req, res) => {
  const { matchId } = req.params;
  const userId = req.user._id;

  const match = await Match.findById(matchId);
  if (!match) return res.status(404).json({ message: "Match not found." });

  const effectiveStatus = normalizeMatchStatus(match);
  if (effectiveStatus !== "Upcoming") {
    return res.status(400).json({ message: "You can join only upcoming matches." });
  }

  const alreadyJoined = await Registration.findOne({ user: userId, match: matchId });
  if (alreadyJoined) {
    return res.status(409).json({ message: "Already joined this match." });
  }

  const pendingJoin = await MatchJoinRequest.findOne({
    user: userId,
    match: matchId,
    status: "pending",
  });
  if (pendingJoin) {
    return res.status(400).json({ message: "You already have a pending join request for this match." });
  }

  const currentCount = await Registration.countDocuments({ match: matchId });
  if (currentCount >= (match.maxPlayers ?? 100)) {
    return res.status(400).json({ message: "Match is full." });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(401).json({ message: "User not found." });

  if (user.walletBalance < match.entryFee || user.virtualFunds < match.entryFee) {
    return res.status(400).json({ message: "Insufficient Wallet Balance" });
  }

  const isBgmi = match.game === "BGMI";
  const isFreeFire = match.game === "Free Fire";
  if (isBgmi && (!user.bgmiName || !user.bgmiUid)) {
    return res.status(400).json({
      message: "Please complete your BGMI gaming profile before joining.",
      requiresGamingProfile: true,
    });
  }
  if (isFreeFire && (!user.freeFireName || !user.freeFireUid)) {
    return res.status(400).json({
      message: "Please complete your Free Fire gaming profile before joining.",
      requiresGamingProfile: true,
    });
  }

  try {
    const joinRequest = await MatchJoinRequest.create({
      user: userId,
      username: user.username,
      match: matchId,
      entryFee: match.entryFee,
      status: "pending",
    });

    await Notification.create({
      user: userId,
      type: "general",
      title: "Join Request Submitted",
      message: `Your request to join ${match.title} is pending admin approval.`,
      metadata: { matchId, joinRequestId: joinRequest._id },
    });

    return res.status(201).json({
      message: "Match join request submitted. Awaiting admin approval.",
      joinRequest,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already have a pending join request for this match." });
    }
    return res.status(500).json({ message: error.message || "Failed to submit join request." });
  }
};

const listMyMatchJoinRequests = async (req, res) => {
  const items = await MatchJoinRequest.find({ user: req.user._id })
    .populate("match", "title game entryFee startTime status")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return res.json({ data: items });
};

const listMatchJoinRequestsAdmin = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const filter = {};
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    MatchJoinRequest.find(filter)
      .populate("user", "username email walletBalance virtualFunds")
      .populate("match", "title game entryFee startTime status maxPlayers joinedPlayersCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    MatchJoinRequest.countDocuments(filter),
  ]);

  return res.json({
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const approveMatchJoinRequest = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const joinReq = await MatchJoinRequest.findOne({ _id: id, status: "pending" }).session(session);
      if (!joinReq) throw new Error("Join request not found or already processed.");

      result = await registerUserForMatchWithWallet({
        userId: joinReq.user,
        matchId: joinReq.match,
        session,
      });

      joinReq.status = "approved";
      joinReq.reviewedBy = req.user._id;
      joinReq.reviewedAt = new Date();
      await joinReq.save({ session });

      await Notification.create(
        [
          {
            user: joinReq.user,
            type: "match_joined",
            title: "Join Approved",
            message: `You joined ${result.match.title} successfully.`,
            metadata: { matchId: result.match._id },
          },
        ],
        { session }
      );
    });

    return res.json({
      message: "Join approved. User added to tournament.",
      walletBalance: result.updatedUser.walletBalance,
      virtualFunds: result.updatedUser.virtualFunds,
      joinedPlayersCount: result.joinedPlayersCount,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      message: error.message || "Failed to approve join request.",
      requiresGamingProfile: error.requiresGamingProfile,
    });
  } finally {
    session.endSession();
  }
};

const rejectMatchJoinRequest = async (req, res) => {
  const { id } = req.params;
  const reason = req.body?.reason || "Join request could not be approved.";

  const updated = await MatchJoinRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    {
      $set: {
        status: "rejected",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    },
    { new: true }
  ).populate("match", "title");

  if (!updated) {
    return res.status(404).json({ message: "Join request not found or already processed." });
  }

  await Notification.create({
    user: updated.user,
    type: "general",
    title: "Join Request Rejected",
    message: `Your request to join ${updated.match?.title || "tournament"} was rejected.`,
    metadata: { joinRequestId: updated._id },
  });

  return res.json({ message: "Join request rejected.", joinRequest: updated });
};

module.exports = {
  submitMatchJoinRequest,
  listMyMatchJoinRequests,
  listMatchJoinRequestsAdmin,
  approveMatchJoinRequest,
  rejectMatchJoinRequest,
};
