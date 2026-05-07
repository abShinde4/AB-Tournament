const Result = require("../models/Result");
const User = require("../models/User");
const Match = require("../models/Match");
const Notification = require("../models/Notification");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

const listResults = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    Result.find()
      .populate("match", "title game prizePool startTime status")
      .populate("user", "username")
      .sort({ createdAt: -1, rank: 1 })
      .skip(skip)
      .limit(limit),
    Result.countDocuments(),
  ]);

  return res.json({
    data: results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const publishResults = async (req, res) => {
  const { matchId, winners } = req.validated.body;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: "Match not found." });
  }
  if (match.resultsPublished) {
    return res.status(409).json({ message: "Results already published for this match." });
  }

  const published = [];
  for (const winner of winners) {
    const winnings = winner.winnings ?? 0;
    const created = await Result.findOneAndUpdate(
      { match: matchId, user: winner.userId },
      {
        rank: winner.rank,
        score: winner.score ?? 0,
        winnings,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    let xpAwarded = false;

    // Award win XP exactly once per match/user.
    if (winner.rank === 1) {
      const marked = await Result.findOneAndUpdate(
        { match: matchId, user: winner.userId, xpAwardedForWin: false },
        { $set: { xpAwardedForWin: true } },
        { new: true }
      );
      if (marked) {
        const xpEarned = 50;
        xpAwarded = true;
        const user = await User.findById(winner.userId);
        const newXp = (user?.xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 100) + 1;
        await User.findByIdAndUpdate(
          winner.userId,
          {
            $inc: { xp: xpEarned },
            $set: { level: newLevel },
          },
          { new: true }
        );
      }
    }

    if (winnings > 0) {
      await Promise.all([
        User.findByIdAndUpdate(winner.userId, { $inc: { walletBalance: winnings } }),
        Transaction.create({
          user: winner.userId,
          type: "credit",
          amount: winnings,
          source: "match_winnings",
          description: `Winnings from ${match.title}`,
          status: "success",
        }),
        Notification.create({
          user: winner.userId,
          type: "result_published",
          title: "Result Published",
          message: `Result published for ${match.title}. You won INR ${winnings}.`,
          metadata: { matchId, rank: winner.rank, winnings },
        }),
      ]);
    }

    published.push({
      userId: winner.userId,
      rank: created.rank,
      score: created.score,
      winnings: created.winnings,
      xpAwarded,
    });
  }

  await Match.findByIdAndUpdate(matchId, { status: "Completed", resultsPublished: true });

  return res.status(201).json({
    message: "Results published",
    matchId,
    totalPublished: published.length,
    winners: published,
  });
};

const myRecentResults = async (req, res) => {
  const results = await Result.find({ user: req.user._id })
    .populate("match", "title game startTime")
    .populate("user", "username")
    .sort({ createdAt: -1 })
    .limit(10);
  return res.json({ data: results });
};

const adminPublishResults = async (req, res) => {
  const { matchId, players } = req.validated.body;
  const session = await mongoose.startSession();

  try {
    let publishedRows = [];

    await session.withTransaction(async () => {
      const match = await Match.findById(matchId).session(session);
      if (!match) {
        throw new Error("Match not found.");
      }
      if (match.resultsPublished) {
        throw new Error("Results already published for this match.");
      }

      const emails = players.map((item) => item.email.toLowerCase());
      const users = await User.find({ email: { $in: emails } })
        .select("_id email")
        .session(session);
      const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

      const missing = emails.filter((email) => !byEmail.has(email));
      if (missing.length > 0) {
        throw new Error(`Users not found: ${missing.join(", ")}`);
      }

      const sorted = [...players].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.kills - a.kills;
      });

      for (let i = 0; i < sorted.length; i += 1) {
        const row = sorted[i];
        const user = byEmail.get(row.email.toLowerCase());
        const rank = i + 1;

        await Result.findOneAndUpdate(
          { match: matchId, user: user._id },
          {
            rank,
            kills: row.kills,
            score: row.score,
            winnings: row.winnings,
            xpAwardedForWin: true,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, session }
        );

        const userBeforeUpdate = await User.findById(user._id).session(session);
        const newXp = (userBeforeUpdate?.xp || 0) + 50;
        const newLevel = Math.floor(newXp / 100) + 1;

        await User.findByIdAndUpdate(
          user._id,
          {
            $inc: {
              walletBalance: row.winnings,
              xp: 50,
            },
            $set: {
              level: newLevel,
            },
          },
          { session, new: true }
        );

        if (row.winnings > 0) {
          await Transaction.create(
            [
              {
                user: user._id,
                type: "credit",
                amount: row.winnings,
                source: "match_winnings",
                reason: "Match Winning",
                description: `Result payout from ${match.title}`,
                status: "success",
              },
            ],
            { session }
          );
        }

        publishedRows.push({
          email: row.email,
          rank,
          kills: row.kills,
          score: row.score,
          winnings: row.winnings,
        });
      }

      match.resultsPublished = true;
      match.status = "Completed";
      await match.save({ session });
    });

    return res.status(201).json({
      message: "Results published successfully.",
      matchId,
      totalPublished: publishedRows.length,
      players: publishedRows,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to publish results." });
  } finally {
    session.endSession();
  }
};

module.exports = { listResults, publishResults, myRecentResults, adminPublishResults };
