const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Match = require("../models/Match");
const SquadTeam = require("../models/SquadTeam");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { debitWalletAndVirtualFunds } = require("./walletBalanceService");
const { normalizeMatchStatus } = require("./matchJoinService");
const { generateTeamId } = require("./teamIdService");
const {
  isTeamLocked,
  assertTeamEditable,
  getTeamStatusBadge,
  isMatchStarted,
} = require("./squadTeamLockService");

const MAX_PLAYERS_PER_TEAM = 4;
const CLIENT_URL = process.env.CLIENT_URL || "https://ab-tournament.vercel.app";

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getMaxTeams = (match) => match.maxTeams ?? Math.floor((match.maxPlayers || 100) / 4);

const assertSquadMatch = (match) => {
  if (!match) throw createHttpError("Match not found.", 404);
  if (match.matchType !== "Squad") {
    throw createHttpError("This tournament is not a Squad match.");
  }
};

const serializeTeam = (team, match) => {
  const doc = typeof team.toObject === "function" ? team.toObject() : { ...team };
  delete doc.teamPasswordHash;
  const status = getTeamStatusBadge(doc, match);
  return {
    ...doc,
    playerCount: doc.players.length,
    maxPlayers: MAX_PLAYERS_PER_TEAM,
    isFull: doc.players.length >= MAX_PLAYERS_PER_TEAM,
    isLocked: isTeamLocked(match, doc),
    statusBadge: status.badge,
    statusLabel: status.label,
  };
};

const buildInviteMessage = (team, match) => {
  return `🏆 Join my BGMI Squad!\n\nTournament:\n${match.title}\n\nTeam ID:\n${team.teamId}\n\nOpen:\n${CLIENT_URL}/tournaments`;
};

const syncTeamLockState = async (team, match, session) => {
  if (isMatchStarted(match) && !team.isLocked) {
    team.isLocked = true;
    team.lockedAt = new Date();
    await team.save(session ? { session } : undefined);
  }
};

const createSquadTeam = async ({
  userId,
  tournamentId,
  teamName,
  teamPassword,
  leaderBgmiUid,
  leaderWhatsapp,
  teamLogo,
  teamDescription,
}) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const match = await Match.findById(tournamentId).session(session);
      assertSquadMatch(match);

      if (normalizeMatchStatus(match) !== "Upcoming" || isMatchStarted(match)) {
        throw createHttpError("Cannot create team after tournament has started.");
      }

      const existingLeaderTeam = await SquadTeam.findOne({
        tournament: tournamentId,
        leaderUser: userId,
      }).session(session);
      if (existingLeaderTeam) {
        throw createHttpError("You already created a team for this tournament.", 409);
      }

      const existingMemberTeam = await SquadTeam.findOne({
        tournament: tournamentId,
        "players.user": userId,
      }).session(session);
      if (existingMemberTeam) {
        throw createHttpError("You are already in a team for this tournament.", 409);
      }

      const teamCount = await SquadTeam.countDocuments({ tournament: tournamentId }).session(session);
      const maxTeams = getMaxTeams(match);
      if (teamCount >= maxTeams) {
        throw createHttpError("No team slots left for this tournament.");
      }

      const user = await User.findById(userId).session(session);
      if (!user) throw createHttpError("User not found.", 401);

      if (user.walletBalance < match.entryFee || user.virtualFunds < match.entryFee) {
        throw createHttpError("Please add wallet balance before creating a squad.", 402);
      }

      const teamPasswordHash = await bcrypt.hash(teamPassword, 10);
      await debitWalletAndVirtualFunds({ userId, amountInr: match.entryFee, session });

      const generatedTeamId = await generateTeamId(session);

      const [team] = await SquadTeam.create(
        [
          {
            teamName: teamName.trim(),
            teamId: generatedTeamId,
            teamPasswordHash,
            leaderUser: userId,
            leaderName: user.username,
            leaderWhatsapp: leaderWhatsapp.trim(),
            leaderBgmiUid: leaderBgmiUid.trim(),
            teamLogo: teamLogo?.trim() || "",
            teamDescription: teamDescription?.trim() || "",
            tournament: tournamentId,
            players: [
              {
                user: userId,
                username: user.username,
                bgmiUid: leaderBgmiUid.trim(),
                isLeader: true,
                joinedAt: new Date(),
              },
            ],
            paymentStatus: "paid",
            entryFeePaid: match.entryFee,
          },
        ],
        { session }
      );

      const [transaction] = await Transaction.create(
        [
          {
            user: userId,
            type: "debit",
            amount: match.entryFee,
            source: "squad_team_entry",
            description: `Squad team entry for ${match.title} (${generatedTeamId})`,
            status: "success",
          },
        ],
        { session }
      );

      team.transactionId = transaction._id;
      await team.save({ session });

      await Registration.create(
        [{ user: userId, match: tournamentId, squadTeam: team._id }],
        { session }
      );

      match.joinedTeamsCount = teamCount + 1;
      const totalRegistrations = await Registration.countDocuments({ match: tournamentId }).session(session);
      match.joinedPlayersCount = totalRegistrations;
      await match.save({ session });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { xp: 10 } },
        { session, new: true }
      ).select("-password");

      await Notification.create(
        [
          {
            user: userId,
            type: "match_joined",
            title: "Squad Team Created",
            message: `Your team ${team.teamName} (${generatedTeamId}) was created for ${match.title}.`,
            metadata: { matchId: tournamentId, teamId: generatedTeamId },
          },
        ],
        { session }
      );

      result = {
        team: serializeTeam(team, match),
        walletBalance: updatedUser.walletBalance,
      };
    });
    return result;
  } finally {
    session.endSession();
  }
};

const joinSquadTeam = async ({ userId, teamId, teamPassword, bgmiUid, tournamentId }) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const normalizedTeamId = teamId.trim().toUpperCase();
      const team = await SquadTeam.findOne({ teamId: normalizedTeamId })
        .select("+teamPasswordHash")
        .session(session);
      if (!team) throw createHttpError("Invalid Team ID.", 404);

      if (!team.teamPasswordHash) {
        throw createHttpError("This team cannot accept new members. Contact admin.");
      }
      const passwordMatch = await bcrypt.compare(teamPassword, team.teamPasswordHash);
      if (!passwordMatch) {
        throw createHttpError("Invalid team password.");
      }

      if (tournamentId && String(team.tournament) !== String(tournamentId)) {
        throw createHttpError("Team ID does not belong to this tournament.");
      }

      const match = await Match.findById(team.tournament).session(session);
      assertSquadMatch(match);
      await syncTeamLockState(team, match, session);

      if (isTeamLocked(match, team)) {
        throw createHttpError("Tournament has started — team is locked.");
      }

      if (team.players.length >= MAX_PLAYERS_PER_TEAM) {
        throw createHttpError("Team is full (4/4 players).");
      }

      const existingMemberTeam = await SquadTeam.findOne({
        tournament: team.tournament,
        "players.user": userId,
      }).session(session);
      if (existingMemberTeam) {
        throw createHttpError("You are already in a team for this tournament.", 409);
      }

      const existingRegistration = await Registration.findOne({
        user: userId,
        match: team.tournament,
      }).session(session);
      if (existingRegistration) {
        throw createHttpError("You are already registered for this tournament.", 409);
      }

      const user = await User.findById(userId).session(session);
      if (!user) throw createHttpError("User not found.", 401);

      team.players.push({
        user: userId,
        username: user.username,
        bgmiUid: bgmiUid.trim(),
        isLeader: false,
        joinedAt: new Date(),
      });
      await team.save({ session });

      await Registration.create(
        [{ user: userId, match: team.tournament, squadTeam: team._id }],
        { session }
      );

      match.joinedPlayersCount = await Registration.countDocuments({ match: team.tournament }).session(session);
      await match.save({ session });

      await Notification.create(
        [
          {
            user: userId,
            type: "match_joined",
            title: "Joined Squad Team",
            message: `You joined team ${team.teamName} (${team.teamId}) for ${match.title}.`,
            metadata: { matchId: team.tournament, teamId: team.teamId },
          },
          {
            user: team.leaderUser,
            type: "general",
            title: "New Team Member",
            message: `${user.username} joined your squad team ${team.teamName}.`,
            metadata: { matchId: team.tournament, teamId: team.teamId },
          },
        ],
        { session }
      );

      result = { team: serializeTeam(team, match) };
    });
    return result;
  } finally {
    session.endSession();
  }
};

const updateSquadTeam = async ({ userId, teamId, updates }) => {
  const team = await SquadTeam.findOne({ teamId: teamId.trim().toUpperCase() });
  if (!team) throw createHttpError("Team not found.", 404);
  if (String(team.leaderUser) !== String(userId)) {
    throw createHttpError("Only the team leader can edit the team.", 403);
  }

  const match = await Match.findById(team.tournament);
  assertSquadMatch(match);
  await syncTeamLockState(team, match);
  assertTeamEditable(match, team);

  if (updates.teamName !== undefined) team.teamName = updates.teamName.trim();
  if (updates.leaderBgmiUid !== undefined) {
    team.leaderBgmiUid = updates.leaderBgmiUid.trim();
    const leaderPlayer = team.players.find((p) => p.isLeader);
    if (leaderPlayer) leaderPlayer.bgmiUid = updates.leaderBgmiUid.trim();
  }
  if (updates.leaderWhatsapp !== undefined) team.leaderWhatsapp = updates.leaderWhatsapp.trim();
  if (updates.teamLogo !== undefined) team.teamLogo = updates.teamLogo.trim();

  await team.save();
  return serializeTeam(team, match);
};

const kickSquadPlayer = async ({ leaderId, teamId, playerUserId }) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const team = await SquadTeam.findOne({ teamId: teamId.trim().toUpperCase() }).session(session);
      if (!team) throw createHttpError("Team not found.", 404);
      if (String(team.leaderUser) !== String(leaderId)) {
        throw createHttpError("Only the team leader can remove players.", 403);
      }
      if (String(playerUserId) === String(leaderId)) {
        throw createHttpError("Leader cannot remove themselves.");
      }

      const match = await Match.findById(team.tournament).session(session);
      assertSquadMatch(match);
      await syncTeamLockState(team, match, session);
      assertTeamEditable(match, team);

      const playerIndex = team.players.findIndex((p) => String(p.user) === String(playerUserId));
      if (playerIndex === -1) throw createHttpError("Player not found in this team.", 404);

      team.players.splice(playerIndex, 1);
      await team.save({ session });

      await Registration.deleteOne({ user: playerUserId, match: team.tournament }).session(session);

      match.joinedPlayersCount = await Registration.countDocuments({ match: team.tournament }).session(session);
      await match.save({ session });

      await Notification.create(
        [
          {
            user: playerUserId,
            type: "general",
            title: "Removed From Squad Team",
            message: `You were removed from team ${team.teamName} (${team.teamId}).`,
            metadata: { matchId: team.tournament, teamId: team.teamId },
          },
        ],
        { session }
      );

      result = { team: serializeTeam(team, match) };
    });
    return result;
  } finally {
    session.endSession();
  }
};

const getMySquadTeam = async (userId, tournamentId) => {
  const team = await SquadTeam.findOne({
    tournament: tournamentId,
    "players.user": userId,
  }).populate("leaderUser", "username email");

  if (!team) return null;

  const match = await Match.findById(tournamentId);
  await syncTeamLockState(team, match);
  return serializeTeam(team, match);
};

const getTournamentSquadStats = async (tournamentId) => {
  const match = await Match.findById(tournamentId);
  if (!match) throw createHttpError("Match not found.", 404);

  const joinedTeamsCount = await SquadTeam.countDocuments({ tournament: tournamentId });
  const maxTeams = getMaxTeams(match);

  return {
    tournamentId,
    joinedTeamsCount,
    maxTeams,
    remainingTeamSlots: Math.max(maxTeams - joinedTeamsCount, 0),
    isSquadMatch: match.matchType === "Squad",
  };
};

const getInviteMessage = async (userId, teamId) => {
  const team = await SquadTeam.findOne({ teamId: teamId.trim().toUpperCase() });
  if (!team) throw createHttpError("Team not found.", 404);

  const isMember = team.players.some((p) => String(p.user) === String(userId));
  if (!isMember) throw createHttpError("You are not a member of this team.", 403);

  const match = await Match.findById(team.tournament);
  return { inviteMessage: buildInviteMessage(team, match), teamId: team.teamId };
};

module.exports = {
  MAX_PLAYERS_PER_TEAM,
  getMaxTeams,
  serializeTeam,
  buildInviteMessage,
  createSquadTeam,
  joinSquadTeam,
  updateSquadTeam,
  kickSquadPlayer,
  getMySquadTeam,
  getTournamentSquadStats,
  getInviteMessage,
  getTeamStatusBadge,
  isTeamLocked,
};
