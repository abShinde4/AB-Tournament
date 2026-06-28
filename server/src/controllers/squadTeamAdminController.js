const SquadTeam = require("../models/SquadTeam");
const {
  serializeTeam,
  getMaxTeams,
} = require("../services/squadTeamService");

const listAdminTeams = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const skip = (page - 1) * limit;

  const andConditions = [];
  if (req.query.tournamentId) {
    andConditions.push({ tournament: req.query.tournamentId });
  }

  const search = (req.query.search || "").trim();
  const teamId = (req.query.teamId || "").trim();
  const teamName = (req.query.teamName || "").trim();
  const leaderName = (req.query.leaderName || "").trim();
  const whatsapp = (req.query.whatsapp || "").trim();

  const orFilters = [];
  if (search) {
    orFilters.push(
      { teamId: { $regex: search, $options: "i" } },
      { teamName: { $regex: search, $options: "i" } },
      { leaderName: { $regex: search, $options: "i" } },
      { leaderWhatsapp: { $regex: search, $options: "i" } }
    );
  }
  if (teamId) orFilters.push({ teamId: { $regex: teamId, $options: "i" } });
  if (teamName) orFilters.push({ teamName: { $regex: teamName, $options: "i" } });
  if (leaderName) orFilters.push({ leaderName: { $regex: leaderName, $options: "i" } });
  if (whatsapp) orFilters.push({ leaderWhatsapp: { $regex: whatsapp, $options: "i" } });
  if (orFilters.length) andConditions.push({ $or: orFilters });

  const statusFilter = req.query.status || "ALL";
  if (statusFilter === "READY") {
    andConditions.push({ $expr: { $eq: [{ $size: "$players" }, 4] } });
  } else if (statusFilter === "WAITING") {
    andConditions.push({ $expr: { $lt: [{ $size: "$players" }, 4] } });
    andConditions.push({ isLocked: { $ne: true } });
  } else if (statusFilter === "LOCKED") {
    andConditions.push({ isLocked: true });
  }

  const filter = andConditions.length ? { $and: andConditions } : {};

  const [teams, total] = await Promise.all([
    SquadTeam.find(filter)
      .populate("tournament", "title game matchType startTime status")
      .populate("leaderUser", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SquadTeam.countDocuments(filter),
  ]);

  const enriched = teams.map((team) => serializeTeam(team, team.tournament));

  return res.json({
    data: enriched,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const getAdminTeamDetail = async (req, res) => {
  const team = await SquadTeam.findOne({ teamId: req.params.teamId.trim().toUpperCase() })
    .populate("tournament", "title game matchType startTime status entryFee prizePool")
    .populate("leaderUser", "username email bgmiUid bgmiName")
    .populate("players.user", "username email bgmiUid bgmiName");

  if (!team) return res.status(404).json({ message: "Team not found." });

  return res.json({ team: serializeTeam(team, team.tournament) });
};

const getAdminOverview = async (_req, res) => {
  const [totalTeams, readyTeams, waitingTeams, lockedTeams] = await Promise.all([
    SquadTeam.countDocuments({}),
    SquadTeam.countDocuments({ $expr: { $eq: [{ $size: "$players" }, 4] } }),
    SquadTeam.countDocuments({
      $expr: { $lt: [{ $size: "$players" }, 4] },
      isLocked: { $ne: true },
    }),
    SquadTeam.countDocuments({ isLocked: true }),
  ]);

  return res.json({
    totalTeams,
    readyTeams,
    waitingTeams,
    lockedTeams,
  });
};

module.exports = { listAdminTeams, getAdminTeamDetail, getAdminOverview };
