const mongoose = require("mongoose");
const PaymentRequest = require("../models/PaymentRequest");
const TournamentPayment = require("../models/TournamentPayment");
const User = require("../models/User");
const { creditWallet } = require("./walletController");
const Notification = require("../models/Notification");

const submitWalletPaymentRequest = async (req, res) => {
  const utrRaw = req.body.utr || req.validated?.body?.utr || "";
  const utr = String(utrRaw || "").trim().toUpperCase();
  const amount = Number(req.body.amount || req.validated?.body?.amount || 0);

  if (!utr || utr.length < 4) return res.status(400).json({ message: "Please enter a valid UTR." });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Amount must be > 0." });

  // prevent duplicate utr across tournament payments and wallet requests
  const dupInTournament = await TournamentPayment.findOne({ utr, paymentStatus: { $in: ["pending", "success"] } });
  if (dupInTournament) return res.status(409).json({ message: "This UTR has already been used. Please check and try again." });

  const dupInRequests = await PaymentRequest.findOne({ utr, status: { $in: ["pending", "approved"] } });
  if (dupInRequests) return res.status(409).json({ message: "This UTR has already been used. Please check and try again." });

  let screenshotPath = "";
  if (req.file?.filename) {
    screenshotPath = `/uploads/${req.file.filename}`;
  }

  try {
    const pr = await PaymentRequest.create({
      user: req.user._id,
      username: req.user.username,
      amount,
      utr,
      screenshot: screenshotPath,
      status: "pending",
    });

    await Notification.create({
      user: req.user._id,
      type: "general",
      title: "Payment Submitted",
      message: `Your wallet top-up request for INR ${amount} is pending admin verification.`,
      metadata: { paymentRequestId: pr._id, utr },
    });

    return res.status(201).json({
      message: "Payment submitted. Awaiting admin verification.",
      paymentRequest: pr,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to submit request." });
  }
};

const listMyWalletRequests = async (req, res) => {
  const items = await PaymentRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  return res.json({ data: items });
};

const listWalletRequestsAdmin = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const filter = {};
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    PaymentRequest.find(filter)
      .populate("user", "username email walletBalance virtualFunds")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PaymentRequest.countDocuments(filter),
  ]);

  return res.json({ data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
};

const approveWalletRequest = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    let updatedRequest = null;
    await session.withTransaction(async () => {
      const reqDoc = await PaymentRequest.findOne({ _id: id, status: "pending" }).session(session);
      if (!reqDoc) throw new Error("Payment request not found or already processed.");

      const dupInTournament = await TournamentPayment.findOne({ utr: reqDoc.utr, paymentStatus: "success" }).session(session);
      if (dupInTournament) throw new Error("This UTR has already been approved for another payment.");

      const updatedUser = await creditWallet({
        userId: reqDoc.user,
        amountInr: reqDoc.amount,
        referenceId: `WPR_${reqDoc.utr}`,
        description: `Wallet top-up UTR ${reqDoc.utr}`,
        session,
        creditVirtualFunds: true,
      });

      reqDoc.status = "approved";
      reqDoc.reviewedBy = req.user._id;
      reqDoc.reviewedAt = new Date();
      await reqDoc.save({ session });

      await Notification.create(
        [
          {
            user: reqDoc.user,
            type: "wallet_credit",
            title: "Wallet Credited",
            message: `INR ${reqDoc.amount} credited to your wallet.`,
            metadata: { paymentRequestId: reqDoc._id },
          },
        ],
        { session }
      );

      updatedRequest = reqDoc;
    });

    const user = await User.findById(updatedRequest.user).select("walletBalance virtualFunds");
    return res.json({
      message: "Payment approved and wallet credited.",
      request: updatedRequest,
      walletBalance: user?.walletBalance,
      virtualFunds: user?.virtualFunds,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to approve request." });
  } finally {
    session.endSession();
  }
};

const rejectWalletRequest = async (req, res) => {
  const { id } = req.params;
  const reason = req.body?.reason || "Payment could not be verified.";

  const updated = await PaymentRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "rejected", reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason: reason } },
    { new: true }
  ).populate("user", "username email");

  if (!updated) return res.status(404).json({ message: "Payment request not found or already processed." });

  await Notification.create({
    user: updated.user._id,
    type: "general",
    title: "Payment Rejected",
    message: `Your wallet top-up request was rejected. ${reason}`,
    metadata: { paymentRequestId: updated._id },
  });

  return res.json({ message: "Payment request rejected.", request: updated });
};

module.exports = {
  submitWalletPaymentRequest,
  listMyWalletRequests,
  listWalletRequestsAdmin,
  approveWalletRequest,
  rejectWalletRequest,
};
