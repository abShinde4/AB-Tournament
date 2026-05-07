const express = require("express");
const {
  listUsers,
  listRegistrations,
  walletOverview,
  dashboardStats,
  listWithdrawRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
  publishRoom,
  verifyPlayer,
  markPlayerSuspicious,
} = require("../controllers/adminController");
const { adminPublishResults } = require("../controllers/resultController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const {
  withdrawIdParamSchema,
  adminPublishResultsSchema,
  publishRoomSchema,
  verifyPlayerSchema,
} = require("../validation/schemas");

const router = express.Router();

router.get("/stats", protect, requireAdmin, dashboardStats);
router.get("/users", protect, requireAdmin, listUsers);
router.get("/registrations", protect, requireAdmin, listRegistrations);
router.get("/wallet-overview", protect, requireAdmin, walletOverview);
router.get("/withdraw-requests", protect, requireAdmin, listWithdrawRequests);
router.put(
  "/withdraw-approve/:id",
  protect,
  requireAdmin,
  validate(withdrawIdParamSchema),
  approveWithdrawRequest
);
router.put(
  "/withdraw-reject/:id",
  protect,
  requireAdmin,
  validate(withdrawIdParamSchema),
  rejectWithdrawRequest
);
router.post(
  "/publish-results",
  protect,
  requireAdmin,
  validate(adminPublishResultsSchema),
  adminPublishResults
);
router.post(
  "/publish-room/:matchId",
  protect,
  requireAdmin,
  validate(publishRoomSchema),
  publishRoom
);

router.patch(
  "/verify-player/:registrationId",
  protect,
  requireAdmin,
  validate(verifyPlayerSchema),
  verifyPlayer
);

router.patch(
  "/mark-suspicious/:registrationId",
  protect,
  requireAdmin,
  validate(verifyPlayerSchema),
  markPlayerSuspicious
);

module.exports = router;
