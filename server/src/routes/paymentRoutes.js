const express = require("express");
const {
  getPaymentLinks,
  submitTournamentPayment,
  listMyTournamentPayments,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { submitPaymentSchema } = require("../validation/schemas");
const { createOptionalScreenshotUpload } = require("../middleware/optionalScreenshotUpload");

const router = express.Router();

const optionalPaymentScreenshotUpload = createOptionalScreenshotUpload("paymentScreenshot");

router.get("/links", getPaymentLinks);
router.get("/my", protect, listMyTournamentPayments);
router.post(
  "/tournament/:tournamentId/submit",
  protect,
  optionalPaymentScreenshotUpload,
  validate(submitPaymentSchema),
  submitTournamentPayment
);

module.exports = router;
