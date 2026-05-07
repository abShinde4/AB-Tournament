const Result = require("../models/Result");

const getLeaderboard = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const leaderboard = await Result.aggregate([
    {
      $group: {
        _id: "$user",
        totalWins: { $sum: { $cond: [{ $eq: ["$rank", 1] }, 1, 0] } },
        totalEarnings: { $sum: "$winnings" },
        totalMatches: { $sum: 1 },
      },
    },
    { $sort: { totalEarnings: -1, totalWins: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        username: "$user.username",
        avatar: "$user.avatar",
        totalWins: 1,
        totalEarnings: 1,
        totalMatches: 1,
      },
    },
  ]);

  return res.json({
    data: leaderboard.map((item, index) => ({
      rank: skip + index + 1,
      ...item,
    })),
    pagination: { page, limit },
  });
};

module.exports = { getLeaderboard };
