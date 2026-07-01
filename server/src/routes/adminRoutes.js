const express = require("express");
const {
  listUsers,
  listLegacyUsers,
  assignUserPhone,
  resetUserPassword,
  deactivateUser,
  listRegistrations,
  walletOverview,
  dashboardStats,
  listWithdrawRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
  // existing tournament payment handlers are already imported from adminController
  listTournamentPaymentsAdmin,
  approveTournamentPayment,
  rejectTournamentPayment,
  
  // wallet payment requests will be handled in walletPaymentController
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
  paymentIdParamSchema,
  adminPublishResultsSchema,
  publishRoomSchema,
  verifyPlayerSchema,
  adminAssignPhoneSchema,
  adminResetPasswordSchema,
  userIdParamSchema,
} = require("../validation/schemas");

const router = express.Router();

router.get("/stats", protect, requireAdmin, dashboardStats);
router.get("/users", protect, requireAdmin, listUsers);
router.get("/legacy-users", protect, requireAdmin, listLegacyUsers);
router.patch(
  "/users/:userId/phone",
  protect,
  requireAdmin,
  validate(adminAssignPhoneSchema),
  assignUserPhone
);
router.patch(
  "/users/:userId/reset-password",
  protect,
  requireAdmin,
  validate(adminResetPasswordSchema),
  resetUserPassword
);
router.patch(
  "/users/:userId/deactivate",
  protect,
  requireAdmin,
  validate(userIdParamSchema),
  deactivateUser
);
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
router.get("/payment-requests", protect, requireAdmin, listTournamentPaymentsAdmin);
router.put(
  "/payment-approve/:id",
  protect,
  requireAdmin,
  validate(paymentIdParamSchema),
  approveTournamentPayment
);
router.put(
  "/payment-reject/:id",
  protect,
  requireAdmin,
  validate(paymentIdParamSchema),
  rejectTournamentPayment
);

// Wallet top-up admin endpoints
const {
  listWalletRequestsAdmin,
  approveWalletRequest,
  rejectWalletRequest,
} = require("../controllers/walletPaymentController");

router.get("/wallet-payment-requests", protect, requireAdmin, listWalletRequestsAdmin);
router.put(
  "/wallet-payment-approve/:id",
  protect,
  requireAdmin,
  validate(paymentIdParamSchema),
  approveWalletRequest
);
router.put(
  "/wallet-payment-reject/:id",
  protect,
  requireAdmin,
  validate(paymentIdParamSchema),
  rejectWalletRequest
);

const {
  listMatchJoinRequestsAdmin,
  approveMatchJoinRequest,
  rejectMatchJoinRequest,
} = require("../controllers/matchJoinRequestController");

router.get("/match-join-requests", protect, requireAdmin, listMatchJoinRequestsAdmin);
router.put(
  "/match-join-approve/:id",
  protect,
  requireAdmin,
  validate(paymentIdParamSchema),
  approveMatchJoinRequest
);
router.put(
  "/match-join-reject/:id",
  protect,
  requireAdmin,
  validate(paymentIdParamSchema),
  rejectMatchJoinRequest
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
