const mongoose = require("mongoose");

const teamIdCounterSchema = new mongoose.Schema({
  _id: { type: String, default: "squad_team_id" },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model("TeamIdCounter", teamIdCounterSchema);
