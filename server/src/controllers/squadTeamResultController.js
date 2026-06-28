const mongoose = require("mongoose");
const SquadTeam = require("../models/SquadTeam");
const SquadTeamResult = require("../models/SquadTeamResult");
const Match = require("../models/Match");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const publishSquadResults = async (req, res) => {
  const { matchId, teams } = req.validated.body;
  const session = await mongoose.startSession();

  try {
    let published = [];

    await session.withTransaction(async () => {
      const match = await Match.findById(matchId).session(session);
      if (!match) throw new Error("Match not found.");
      if (match.matchType !== "Squad") throw new Error("This match is not a Squad tournament.");
      if (match.resultsPublished) throw new Error("Results already published for this match.");

      const sorted = [...teams].sort((a, b) => b.kills - a.kills);

      for (let i = 0; i < sorted.length; i += 1) {
        const row = sorted[i];
        const rank = i + 1;
        const squadTeam = await SquadTeam.findOne({
          teamId: row.teamId.trim().toUpperCase(),
          tournament: matchId,
        }).session(session);

        if (!squadTeam) throw new Error(`Squad team not found: ${row.teamId}`);

        const killsMap = new Map((row.playerKills || []).map((p) => [String(p.userId), p.kills]));
        const resultPlayers = squadTeam.players.map((player) => ({
          user: player.user,
          username: player.username,
          bgmiUid: player.bgmiUid,
          kills: killsMap.get(String(player.user)) ?? 0,
          isLeader: player.isLeader,
        }));

        const totalKills = row.kills ?? resultPlayers.reduce((sum, p) => sum + p.kills, 0);
        const winnings = row.winnings ?? 0;
        const perPlayerWinnings =
          winnings > 0 && resultPlayers.length > 0
            ? Math.floor(winnings / resultPlayers.length)
            : 0;

        await SquadTeamResult.findOneAndUpdate(
          { match: matchId, squadTeam: squadTeam._id },
          {
            teamId: squadTeam.teamId,
            teamName: squadTeam.teamName,
            leaderUser: squadTeam.leaderUser,
            leaderName: squadTeam.leaderName,
            players: resultPlayers,
            kills: totalKills,
            winnings,
            rank,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, session }
        );

        for (const player of resultPlayers) {
          if (perPlayerWinnings <= 0) continue;

          await User.findByIdAndUpdate(
            player.user,
            { $inc: { walletBalance: perPlayerWinnings, xp: rank === 1 ? 50 : 10 } },
            { session }
          );

          await Transaction.create(
            [
              {
                user: player.user,
                type: "credit",
                amount: perPlayerWinnings,
                source: "squad_team_winnings",
                description: `Squad winnings from ${match.title} (${squadTeam.teamId})`,
                status: "success",
              },
            ],
            { session }
          );

          await Notification.create(
            [
              {
                user: player.user,
                type: "result_published",
                title: "Squad Result Published",
                message: `Team ${squadTeam.teamName} finished rank #${rank} in ${match.title}.`,
                metadata: { matchId, teamId: squadTeam.teamId, rank, winnings: perPlayerWinnings },
              },
            ],
            { session }
          );
        }

        published.push({
          teamId: squadTeam.teamId,
          teamName: squadTeam.teamName,
          rank,
          kills: totalKills,
          winnings,
        });
      }

      match.resultsPublished = true;
      match.status = "Completed";
      await match.save({ session });
    });

    return res.status(201).json({
      message: "Squad team results published successfully.",
      matchId,
      teams: published,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to publish squad results." });
  } finally {
    session.endSession();
  }
};

const listSquadResults = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.matchId) filter.match = req.query.matchId;

  const [results, total] = await Promise.all([
    SquadTeamResult.find(filter)
      .populate("match", "title game matchType startTime status prizePool")
      .populate("leaderUser", "username")
      .sort({ rank: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SquadTeamResult.countDocuments(filter),
  ]);

  return res.json({
    data: results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

module.exports = { publishSquadResults, listSquadResults };
