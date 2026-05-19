const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const WithdrawRequest = require("../models/WithdrawRequest");
const mongoose = require("mongoose");

const creditWallet = async ({ userId, amountInr, referenceId, description, session, creditVirtualFunds = true }) => {
  const inc = { walletBalance: amountInr };
  if (creditVirtualFunds) inc.virtualFunds = amountInr;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: inc },
    { new: true, session }
  ).select("-password");

  const txPayload = {
    user: userId,
    type: "credit",
    amount: amountInr,
    source: "add_money",
    description,
    referenceId,
    status: "success",
  };

  if (session) {
    await Transaction.create([txPayload], { session });
  } else {
    await Transaction.create(txPayload);
  }

  const notificationPayload = {
    user: userId,
    type: "wallet_credit",
    title: "Money Added",
    message: `INR ${amountInr} added to your wallet successfully.`,
    metadata: { amount: amountInr, referenceId },
  };

  if (session) {
    await Notification.create([notificationPayload], { session });
  } else {
    await Notification.create(notificationPayload);
  }

  return updatedUser;
};

const addMoney = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      message: "Direct wallet top-up is disabled. Use Pay Now on a tournament to pay via UPI.",
    });
  }

  const { amount } = req.validated.body;
  const referenceId = `PAY_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const updatedUser = await creditWallet({
    userId: req.user._id,
    amountInr: amount,
    referenceId,
    description: "Wallet top-up (development only)",
  });

  return res.status(201).json({
    message: "Money added successfully",
    walletBalance: updatedUser.walletBalance,
    virtualFunds: updatedUser.virtualFunds,
    transactionRef: referenceId,
  });
};

const debitWalletAndVirtualFunds = async ({ userId, amountInr, session }) => {
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      walletBalance: { $gte: amountInr },
      virtualFunds: { $gte: amountInr },
    },
    { $inc: { walletBalance: -amountInr, virtualFunds: -amountInr } },
    { new: true, session }
  ).select("-password");

  if (!updatedUser) {
    const err = new Error("Insufficient Wallet Balance");
    err.statusCode = 400;
    throw err;
  }

  return updatedUser;
};

const listTransactions = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments({ user: req.user._id }),
  ]);

  return res.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

const listWithdrawals = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    WithdrawRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WithdrawRequest.countDocuments(filter),
  ]);

  return res.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

const withdraw = async (req, res) => {
  const userId = req.user._id;
  const { amount, upiId } = req.validated.body;

  const withdrawFee = Number(process.env.WITHDRAW_FEE_INR || 0);
  const dailyLimit = Number(process.env.WITHDRAW_DAILY_LIMIT_INR || 0);
  const fee = Number.isFinite(withdrawFee) && withdrawFee > 0 ? withdrawFee : 0;

  const totalDebited = amount + fee;
  const upiNormalized = upiId.trim().toLowerCase();

  const session = await mongoose.startSession();
  let createdRequest = null;

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session).select("walletBalance emailVerified");

      if (user?.emailVerified === false && process.env.NODE_ENV === "production") {
        throw new Error("Email not verified.");
      }

      const existingPending = await WithdrawRequest.findOne({
        user: userId,
        status: "pending",
      }).session(session);

      if (existingPending) {
        throw new Error("You already have a pending withdrawal request.");
      }

      if (dailyLimit > 0) {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        const todayAgg = await WithdrawRequest.aggregate([
          {
            $match: {
              user: userId,
              status: { $in: ["pending", "approved"] },
              createdAt: { $gte: start },
            },
          },
          { $group: { _id: null, total: { $sum: "$totalDebited" } } },
        ]).session(session);

        const totalToday = todayAgg[0]?.total ?? 0;
        if (totalToday + totalDebited > dailyLimit) {
          throw new Error("Daily withdraw limit exceeded.");
        }
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, walletBalance: { $gte: totalDebited } },
        { $inc: { walletBalance: -totalDebited } },
        { new: true, session }
      ).select("walletBalance");

      if (!updatedUser) {
        throw new Error("Insufficient wallet balance.");
      }

      createdRequest = await WithdrawRequest.create(
        [
          {
            user: userId,
            amount,
            upiId: upiNormalized,
            status: "pending",
            processingFee: fee,
            totalDebited,
          },
        ],
        { session }
      );

      const withdrawDoc = createdRequest?.[0] || createdRequest;
      const referenceId = `WD_${withdrawDoc._id}_${Date.now()}`;

      await Transaction.create(
        [
          {
            user: userId,
            type: "debit",
            amount: totalDebited,
            source: "withdraw_request",
            reason: "Withdraw Request",
            description: `Withdraw request: ₹${amount}${fee ? ` + fee ₹${fee}` : ""}`,
            referenceId,
            status: "success",
          },
        ],
        { session }
      );
    });

    const responseUser = await User.findById(userId).select("walletBalance");
    return res.status(201).json({
      message: "Withdraw request created. Amount deducted from wallet.",
      withdrawal: {
        id: createdRequest?.[0]?._id || createdRequest?._id,
        amount,
        upiId: upiNormalized,
        status: "pending",
        processingFee: fee,
        totalDebited,
      },
      walletBalance: responseUser.walletBalance,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "You already have a pending withdrawal request." });
    }
    return res.status(400).json({ message: error.message || "Withdraw failed." });
  } finally {
    session.endSession();
  }
};

module.exports = {
  addMoney,
  listTransactions,
  withdraw,
  listWithdrawals,
  creditWallet,
  debitWalletAndVirtualFunds,
};
