const Match = require("../models/Match");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Result = require("../models/Result");
const Transaction = require("../models/Transaction");
const WithdrawRequest = require("../models/WithdrawRequest");
const mongoose = require("mongoose");

const listUsers = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({}, "-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  return res.json({
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const listRegistrations = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [registrations, total] = await Promise.all([
    Registration.find()
      .populate(
        "user",
        "username email bgmiName bgmiUid freeFireName freeFireUid"
      )
      .populate("match", "title game status startTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments(),
  ]);

  return res.json({
    data: registrations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const verifyPlayer = async (req, res) => {
  const { registrationId } = req.validated.params;
  const { notes } = req.validated.body;

  try {
    const registration = await Registration.findByIdAndUpdate(
      registrationId,
      {
        isPlayerVerified: true,
        verificationNotes: notes || "",
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
      },
      { new: true }
    )
      .populate("user", "username email bgmiName bgmiUid freeFireName freeFireUid")
      .populate("match", "title game");

    return res.json({
      message: "Player verified successfully",
      registration,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to verify player." });
  }
};

const markPlayerSuspicious = async (req, res) => {
  const { registrationId } = req.validated.params;
  const { notes } = req.validated.body;

  try {
    const registration = await Registration.findByIdAndUpdate(
      registrationId,
      {
        isPlayerVerified: false,
        verificationNotes: notes || "Marked suspicious",
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
      },
      { new: true }
    )
      .populate("user", "username email bgmiName bgmiUid freeFireName freeFireUid")
      .populate("match", "title game");

    return res.json({
      message: "Player marked as suspicious",
      registration,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to mark player." });
  }
};

const walletOverview = async (_req, res) => {
  const [userStats, txStats, balanceStats] = await Promise.all([
    User.aggregate([{ $group: { _id: null, totalUsers: { $sum: 1 } } }]),
    Transaction.aggregate([
      {
        $group: {
          _id: "$source",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    User.aggregate([{ $group: { _id: null, totalWalletBalance: { $sum: "$walletBalance" } } }]),
  ]);

  return res.json({
    totalUsers: userStats[0]?.totalUsers || 0,
    totalWalletBalance: balanceStats[0]?.totalWalletBalance || 0,
    transactionsBySource: txStats,
  });
};

const dashboardStats = async (_req, res) => {
  const [totalMatches, totalUsers, totalRegistrations, totalResults] = await Promise.all([
    Match.countDocuments({}),
    User.countDocuments({}),
    Registration.countDocuments({}),
    Result.countDocuments({}),
  ]);
  // eslint-disable-next-line no-console
  console.log("Mongo total users:", totalUsers);
  // eslint-disable-next-line no-console
  console.log("Dashboard stats:", { totalMatches, totalUsers, totalRegistrations, totalResults });
  return res.json({
    totalUsers,
    totalMatches,
    totalRegistrations,
    totalResults,
  });
};

const listWithdrawRequests = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const filter = {};
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    WithdrawRequest.find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WithdrawRequest.countDocuments(filter),
  ]);

  return res.json({
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const approveWithdrawRequest = async (req, res) => {
  const { id } = req.validated.params;

  const updated = await WithdrawRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "approved" } },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: "Withdraw request not found." });
  return res.json({ message: "Withdraw approved", withdrawal: updated });
};

const rejectWithdrawRequest = async (req, res) => {
  const { id } = req.validated.params;
  const session = await mongoose.startSession();

  try {
    let refundWalletBalance = null;

    await session.withTransaction(async () => {
      const withdrawReq = await WithdrawRequest.findOne({ _id: id, status: "pending" })
        .session(session)
        .exec();

      if (!withdrawReq) {
        throw new Error("Withdraw request not found or already processed.");
      }

      withdrawReq.status = "rejected";
      await withdrawReq.save({ session });

      const updatedUser = await User.findByIdAndUpdate(
        withdrawReq.user,
        { $inc: { walletBalance: withdrawReq.totalDebited } },
        { new: true, session }
      ).select("walletBalance");

      refundWalletBalance = updatedUser.walletBalance;

      await Transaction.create(
        [
          {
            user: withdrawReq.user,
            type: "credit",
            amount: withdrawReq.totalDebited,
            source: "withdraw_refund",
            reason: "Withdraw Rejected",
            description: `Refund for withdraw request ${withdrawReq._id}`,
            status: "success",
          },
        ],
        { session }
      );
    });

    return res.json({ message: "Withdraw rejected and refunded", walletBalance: refundWalletBalance });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Withdraw reject failed." });
  } finally {
    session.endSession();
  }
};

const publishRoom = async (req, res) => {
  const { matchId } = req.validated.params;
  const { roomId, roomPassword } = req.validated.body;

  // Validate inputs
  if (!roomId || !roomPassword) {
    return res.status(400).json({ message: "Room ID and password are required." });
  }

  try {
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    // Calculate unlock time: 10 minutes before match starts
    const roomUnlockTime = new Date(new Date(match.startTime).getTime() - 10 * 60 * 1000);

    // Update match with room details
    const updated = await Match.findByIdAndUpdate(
      matchId,
      {
        roomId: roomId.trim(),
        roomPassword: roomPassword.trim(),
        roomUnlockTime,
        isRoomPublished: true,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Room published successfully.",
      match: {
        id: updated._id,
        title: updated.title,
        roomId: updated.roomId,
        roomUnlockTime: updated.roomUnlockTime,
        isRoomPublished: updated.isRoomPublished,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to publish room." });
  }
};

module.exports = {
  listUsers,
  listRegistrations,
  walletOverview,
  dashboardStats,
  listWithdrawRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
  publishRoom,
  verifyPlayer,
  markPlayerSuspicious,
};
