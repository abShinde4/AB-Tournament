const express = require("express");
const { addMoney, listTransactions, withdraw, listWithdrawals } = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { addMoneySchema, withdrawSchema } = require("../validation/schemas");

const router = express.Router();

const path = require("path");
const multer = require("multer");
const { submitWalletPaymentRequest, listMyWalletRequests } = require("../controllers/walletPaymentController");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadsDir),
	filename: (_req, file, cb) => {
		const safeExt = path.extname(file.originalname).toLowerCase();
		const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, `payment-${unique}${safeExt}`);
	},
});

const fileFilter = (_req, file, cb) => {
	const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
	if (!allowed.includes(file.mimetype)) return cb(new Error("Only jpeg, jpg, png, webp images are allowed."), false);
	return cb(null, true);
};

const uploadScreenshot = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } }).single("screenshot");
const handleUpload = (req, res, next) => {
	uploadScreenshot(req, res, (err) => {
		if (err) {
			return res.status(400).json({ message: err.message || "Upload failed." });
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
