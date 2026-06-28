const { normalizeMatchStatus } = require("./matchJoinService");

const isMatchStarted = (match) => {
  if (!match?.startTime) return false;
  return Date.now() >= new Date(match.startTime).getTime();
};

const isTeamLocked = (match, team) => {
  if (team?.isLocked) return true;
  if (isMatchStarted(match)) return true;
  return normalizeMatchStatus(match) !== "Upcoming";
};

const assertTeamEditable = (match, team) => {
  if (isTeamLocked(match, team)) {
    const err = new Error("Tournament has started — team is locked.");
    err.statusCode = 400;
    throw err;
  }
};

const getTeamStatusBadge = (team, match) => {
  if (isTeamLocked(match, team)) {
    return { badge: "LOCKED", label: "🔒 LOCKED", playerCount: team.players.length };
  }
  if (team.players.length >= 4) {
    return { badge: "READY", label: "🟢 READY", playerCount: team.players.length };
  }
  return { badge: "WAITING", label: "🟡 WAITING", playerCount: team.players.length };
};

module.exports = {
  isMatchStarted,
  isTeamLocked,
  assertTeamEditable,
  getTeamStatusBadge,
};
