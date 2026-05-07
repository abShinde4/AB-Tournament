const express = require("express");
const {
  listMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  joinMatch,
  dashboard,
  getMatchDetails,
} = require("../controllers/tournamentController");
const { protect, optionalAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { requireMatchJoined } = require("../middleware/matchAccess");
const { validate } = require("../middleware/validate");
const { createMatchSchema, updateMatchSchema, idParamSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", optionalAuth, listMatches);
router.post("/", protect, requireAdmin, validate(createMatchSchema), createMatch);
router.patch("/:matchId", protect, requireAdmin, validate(updateMatchSchema), updateMatch);
router.delete("/:matchId", protect, requireAdmin, validate(idParamSchema), deleteMatch);
router.post("/:matchId/join", protect, validate(idParamSchema), joinMatch);
router.get("/:matchId/details", protect, validate(idParamSchema), requireMatchJoined, getMatchDetails);
router.get("/dashboard/me", protect, dashboard);

module.exports = router;
