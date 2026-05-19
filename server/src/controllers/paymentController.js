const mongoose = require("mongoose");
const Match = require("../models/Match");
const TournamentPayment = require("../models/TournamentPayment");
const Registration = require("../models/Registration");
const Notification = require("../models/Notification");
const { registerUserForMatch } = require("../services/matchJoinService");

const DEFAULT_UPI_ID = "7743845982@kotak811";

const getPaymentLinks = (_req, res) => {
  const phonepeLink = process.env.PAYMENT_PHONEPE_LINK || "";
  const gpayLink = process.env.PAYMENT_GPAY_LINK || "";
  const defaultLink = process.env.PAYMENT_LINK || phonepeLink || gpayLink;
  const upiId = process.env.PAYMENT_UPI_ID || DEFAULT_UPI_ID;

  return res.json({
    phonepeLink,
    gpayLink,
    defaultLink,
    upiId,
    payeeName: process.env.PAYMENT_PAYEE_NAME || "AB Tournament",
    paymentMethod: "upi_manual",
  });
};

const submitTournamentPayment = async (req, res) => {
  const { tournamentId } = req.validated.params;
  const utrRaw = req.validated.body.utr || req.body.utr;
  const utr = String(utrRaw).trim().toUpperCase();

  if (!utr || utr.length < 6) {
    return res.status(400).json({ message: "Please enter a valid UTR / Transaction ID." });
  }

  const match = await Match.findById(tournamentId);
  if (!match) {
    return res.status(404).json({ message: "Tournament not found." });
  }

  const alreadyJoined = await Registration.findOne({
    user: req.user._id,
    match: tournamentId,
  });
  if (alreadyJoined) {
    return res.status(409).json({ message: "You have already joined this tournament." });
  }

  const existingPending = await TournamentPayment.findOne({
    user: req.user._id,
    tournament: tournamentId,
    paymentStatus: "pending",
  });
  if (existingPending) {
    return res.status(400).json({
      message: "You already have a pending payment for this tournament.",
      payment: existingPending,
    });
  }

  const duplicateUtr = await TournamentPayment.findOne({
    utr,
    paymentStatus: { $in: ["pending", "success"] },
  });
  if (duplicateUtr) {
    return res.status(409).json({ message: "This UTR has already been used. Please check and try again." });
  }

  let paymentScreenshot = "";
  if (req.file) {
    paymentScreenshot = `/uploads/${req.file.filename}`;
  }

  try {
    const payment = await TournamentPayment.create({
      user: req.user._id,
      tournament: tournamentId,
      paymentAmount: match.entryFee,
      utr,
      paymentScreenshot,
      paymentStatus: "pending",
    });

    await Notification.create({
      user: req.user._id,
      type: "general",
      title: "Payment Submitted",
      message: `Your payment for ${match.title} is pending admin verification.`,
      metadata: { paymentId: payment._id, tournamentId, utr },
    });

    return res.status(201).json({
      message: "Payment submitted successfully. Awaiting admin verification.",
      payment,
    });
  } catch (error) {
    if (error.code === 11000) {
      const keyPattern = error.keyPattern || {};
      if (keyPattern.utr) {
        return res.status(409).json({ message: "This UTR has already been used. Please check and try again." });
      }
      return res.status(400).json({ message: "You already have a pending payment for this tournament." });
    }
    return res.status(500).json({ message: error.message || "Failed to submit payment." });
  }
};

const listMyTournamentPayments = async (req, res) => {
  const items = await TournamentPayment.find({ user: req.user._id })
    .populate("tournament", "title game entryFee startTime status")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return res.json({ data: items });
};

const listTournamentPaymentsAdmin = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const filter = {};
  if (status) filter.paymentStatus = status;

  const [items, total] = await Promise.all([
    TournamentPayment.find(filter)
      .populate("user", "username email bgmiName bgmiUid freeFireName freeFireUid")
      .populate("tournament", "title game entryFee startTime status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TournamentPayment.countDocuments(filter),
  ]);

  return res.json({
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const approveTournamentPayment = async (req, res) => {
  const { id } = req.validated.params;
  const session = await mongoose.startSession();

  try {
    let joinResult = null;

    await session.withTransaction(async () => {
      const payment = await TournamentPayment.findOne({
        _id: id,
        paymentStatus: "pending",
      }).session(session);

      if (!payment) {
        throw new Error("Payment request not found or already processed.");
      }

      const duplicateUtr = await TournamentPayment.findOne({
        utr: payment.utr,
        paymentStatus: "success",
        _id: { $ne: payment._id },
      }).session(session);

      if (duplicateUtr) {
        throw new Error("This UTR has already been approved for another payment.");
      }

      joinResult = await registerUserForMatch({
        userId: payment.user,
        matchId: payment.tournament,
        session,
        paymentNote: `UTR ${payment.utr}`,
      });

      payment.paymentStatus = "success";
      payment.reviewedBy = req.user._id;
      payment.reviewedAt = new Date();
      await payment.save({ session });

      await Notification.create(
        [
          {
            user: payment.user,
            type: "match_joined",
            title: "Payment Approved",
            message: `Your payment was approved. You joined ${joinResult.match.title} successfully.`,
            metadata: { matchId: joinResult.match._id, paymentId: payment._id },
          },
        ],
        { session }
      );
    });

    return res.json({
      message: "Payment approved. User joined the tournament.",
      paymentStatus: "success",
      joinedPlayersCount: joinResult?.joinedPlayersCount,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    return res.status(status).json({
      message: error.message || "Payment approval failed.",
      requiresGamingProfile: error.requiresGamingProfile,
    });
  } finally {
    session.endSession();
  }
};

const rejectTournamentPayment = async (req, res) => {
  const { id } = req.validated.params;
  const reason = req.validated.body?.reason || "Payment could not be verified.";

  const payment = await TournamentPayment.findOneAndUpdate(
    { _id: id, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: "rejected",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    },
    { new: true }
  ).populate("tournament", "title");

  if (!payment) {
    return res.status(404).json({ message: "Payment request not found or already processed." });
  }

  await Notification.create({
    user: payment.user,
    type: "general",
    title: "Payment Rejected",
    message: `Your payment for ${payment.tournament?.title || "tournament"} was rejected. ${reason}`,
    metadata: { paymentId: payment._id },
  });

  return res.json({ message: "Payment rejected.", payment });
};

module.exports = {
  getPaymentLinks,
  submitTournamentPayment,
  listMyTournamentPayments,
  listTournamentPaymentsAdmin,
  approveTournamentPayment,
  rejectTournamentPayment,
};
