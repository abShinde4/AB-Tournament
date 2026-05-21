const express = require("express");
const { addMoney, listTransactions, withdraw, listWithdrawals } = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { addMoneySchema, withdrawSchema } = require("../validation/schemas");
const { submitWalletPaymentRequest, listMyWalletRequests } = require("../controllers/walletPaymentController");

const router = express.Router();

router.get("/transactions", protect, listTransactions);
router.post("/add-money", protect, validate(addMoneySchema), addMoney);
router.post("/withdraw", protect, validate(withdrawSchema), withdraw);
router.get("/withdrawals", protect, listWithdrawals);

router.post("/requests", protect, submitWalletPaymentRequest);
router.get("/requests/my", protect, listMyWalletRequests);

module.exports = router;
