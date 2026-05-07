const express = require("express");
const {
  addMoney,
  listTransactions,
  createPaymentOrder,
  verifyPaymentAndCredit,
  withdraw,
  listWithdrawals,
} = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { addMoneySchema, createPaymentOrderSchema, verifyPaymentSchema, withdrawSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/transactions", protect, listTransactions);
router.post("/add-money", protect, validate(addMoneySchema), addMoney);
router.post("/create-order", protect, validate(createPaymentOrderSchema), createPaymentOrder);
router.post("/verify-payment", protect, validate(verifyPaymentSchema), verifyPaymentAndCredit);
router.post("/withdraw", protect, validate(withdrawSchema), withdraw);
router.get("/withdrawals", protect, listWithdrawals);

module.exports = router;
