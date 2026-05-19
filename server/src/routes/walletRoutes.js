const express = require("express");
const { addMoney, listTransactions, withdraw, listWithdrawals } = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { addMoneySchema, withdrawSchema } = require("../validation/schemas");
const { createOptionalScreenshotUpload } = require("../middleware/optionalScreenshotUpload");
const { submitWalletPaymentRequest, listMyWalletRequests } = require("../controllers/walletPaymentController");

const router = express.Router();

const optionalScreenshotUpload = createOptionalScreenshotUpload("screenshot");

router.get("/transactions", protect, listTransactions);
router.post("/add-money", protect, validate(addMoneySchema), addMoney);
router.post("/withdraw", protect, validate(withdrawSchema), withdraw);
router.get("/withdrawals", protect, listWithdrawals);

router.post("/requests", protect, optionalScreenshotUpload, submitWalletPaymentRequest);
router.get("/requests/my", protect, listMyWalletRequests);

module.exports = router;
