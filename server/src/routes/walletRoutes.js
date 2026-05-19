const express = require("express");
const { addMoney, listTransactions, withdraw, listWithdrawals } = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { addMoneySchema, withdrawSchema } = require("../validation/schemas");

const router = express.Router();

const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { submitWalletPaymentRequest, listMyWalletRequests } = require("../controllers/walletPaymentController");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		try {
			fs.mkdirSync(uploadsDir, { recursive: true });
			cb(null, uploadsDir);
		} catch (err) {
			cb(err);
		}
	},
	filename: (_req, file, cb) => {
		const safeExt = path.extname(file.originalname).toLowerCase();
		const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, `payment-${unique}${safeExt}`);
	},
});

const fileFilter = (_req, file, cb) => {
	const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
	if (!allowed.includes(file.mimetype)) {
		// Skip invalid screenshot; UTR-only submission still allowed.
		return cb(null, false);
	}
	return cb(null, true);
};

const uploadScreenshot = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } }).single(
	"screenshot"
);

/** Screenshot is optional — never block wallet recharge if upload/storage fails (e.g. Render ephemeral disk). */
const handleUpload = (req, res, next) => {
	uploadScreenshot(req, res, (err) => {
		if (err) {
			// eslint-disable-next-line no-console
			console.warn("Wallet recharge screenshot upload skipped:", err?.message || err);
		}
		return next();
	});
};

router.get("/transactions", protect, listTransactions);
router.post("/add-money", protect, validate(addMoneySchema), addMoney);
router.post("/withdraw", protect, validate(withdrawSchema), withdraw);
router.get("/withdrawals", protect, listWithdrawals);

// Wallet payment requests (manual UPI top-ups)
router.post("/requests", protect, handleUpload, submitWalletPaymentRequest);
router.get("/requests/my", protect, listMyWalletRequests);

module.exports = router;
