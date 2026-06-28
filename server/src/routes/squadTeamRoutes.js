const express = require("express");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const {
  createTeamBodySchema,
  joinTeamBodySchema,
  updateTeamBodySchema,
  kickPlayerParamsSchema,
  teamIdParamSchema,
  tournamentIdParamSchema,
  publishSquadResultsSchema,
  adminListQuerySchema,
} = require("../validation/squadTeamSchemas");
const {
  createTeam,
  joinTeam,
  updateTeam,
  kickPlayer,
  getMyTeam,
  getTournamentStats,
  getTeamInvite,
} = require("../controllers/squadTeamController");
const {
  listAdminTeams,
  getAdminTeamDetail,
  getAdminOverview,
} = require("../controllers/squadTeamAdminController");
const {
  publishSquadResults,
  listSquadResults,
} = require("../controllers/squadTeamResultController");

const router = express.Router();

router.post("/create", protect, validate(createTeamBodySchema), createTeam);
router.post("/join", protect, validate(joinTeamBodySchema), joinTeam);
router.patch("/:teamId", protect, validate(updateTeamBodySchema), updateTeam);
router.delete("/:teamId/players/:userId", protect, validate(kickPlayerParamsSchema), kickPlayer);
router.get("/my/:tournamentId", protect, validate(tournamentIdParamSchema), getMyTeam);
router.get("/tournament/:tournamentId/stats", validate(tournamentIdParamSchema), getTournamentStats);
router.get("/results/list", listSquadResults);
router.get("/:teamId/invite", protect, validate(teamIdParamSchema), getTeamInvite);

router.get("/admin/overview", protect, requireAdmin, getAdminOverview);
router.get("/admin/list", protect, requireAdmin, validate(adminListQuerySchema), listAdminTeams);
router.get("/admin/:teamId", protect, requireAdmin, validate(teamIdParamSchema), getAdminTeamDetail);
router.post(
  "/admin/results/publish",
  protect,
  requireAdmin,
  validate(publishSquadResultsSchema),
  publishSquadResults
);

module.exports = router;
