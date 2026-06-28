const {
  createSquadTeam,
  joinSquadTeam,
  updateSquadTeam,
  kickSquadPlayer,
  getMySquadTeam,
  getTournamentSquadStats,
  getInviteMessage,
} = require("../services/squadTeamService");

const sendError = (res, error) => {
  const status = error.statusCode || 500;
  return res.status(status).json({ message: error.message || "Request failed." });
};

const createTeam = async (req, res) => {
  try {
    const { tournamentId, teamName, leaderBgmiUid, leaderWhatsapp, teamLogo, teamDescription } =
      req.validated.body;
    const result = await createSquadTeam({
      userId: req.user._id,
      tournamentId,
      teamName,
      leaderBgmiUid,
      leaderWhatsapp,
      teamLogo,
      teamDescription,
    });
    return res.status(201).json({
      message: "Squad team created successfully.",
      ...result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const joinTeam = async (req, res) => {
  try {
    const { teamId, bgmiUid, tournamentId } = req.validated.body;
    const result = await joinSquadTeam({
      userId: req.user._id,
      teamId,
      bgmiUid,
      tournamentId,
    });
    return res.status(201).json({
      message: "Joined squad team successfully.",
      ...result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.validated.params;
    const team = await updateSquadTeam({
      userId: req.user._id,
      teamId,
      updates: req.validated.body,
    });
    return res.json({ message: "Team updated successfully.", team });
  } catch (error) {
    return sendError(res, error);
  }
};

const kickPlayer = async (req, res) => {
  try {
    const { teamId, userId } = req.validated.params;
    const result = await kickSquadPlayer({
      leaderId: req.user._id,
      teamId,
      playerUserId: userId,
    });
    return res.json({ message: "Player removed from team.", ...result });
  } catch (error) {
    return sendError(res, error);
  }
};

const getMyTeam = async (req, res) => {
  try {
    const { tournamentId } = req.validated.params;
    const team = await getMySquadTeam(req.user._id, tournamentId);
    return res.json({ team });
  } catch (error) {
    return sendError(res, error);
  }
};

const getTournamentStats = async (req, res) => {
  try {
    const { tournamentId } = req.validated.params;
    const stats = await getTournamentSquadStats(tournamentId);
    return res.json(stats);
  } catch (error) {
    return sendError(res, error);
  }
};

const getTeamInvite = async (req, res) => {
  try {
    const { teamId } = req.validated.params;
    const data = await getInviteMessage(req.user._id, teamId);
    return res.json(data);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createTeam,
  joinTeam,
  updateTeam,
  kickPlayer,
  getMyTeam,
  getTournamentStats,
  getTeamInvite,
};
