const TeamIdCounter = require("../models/TeamIdCounter");

const TEAM_ID_PREFIX = "AB-SQ-";

const generateTeamId = async (session) => {
  const counter = await TeamIdCounter.findByIdAndUpdate(
    "squad_team_id",
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );

  const padded = String(counter.seq).padStart(4, "0");
  return `${TEAM_ID_PREFIX}${padded}`;
};

module.exports = { generateTeamId, TEAM_ID_PREFIX };
