const User = require("../models/User");

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

module.exports = { debitWalletAndVirtualFunds };
