const express = require("express");
const path = require("path");
const multer = require("multer");
const {
  getPaymentLinks,
  submitTournamentPayment,
  listMyTournamentPayments,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { submitPaymentSchema } = require("../validation/schemas");

const router = express.Router();

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
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only jpeg, jpg, png, webp images are allowed."), false);
  }
  return cb(null, true);
};

const uploadScreenshot = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
}).single("paymentScreenshot");

const handleUpload = (req, res, next) => {
  uploadScreenshot(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Screenshot must be <= 3MB." : err.message || "Upload failed.";
      return res.status(400).json({ message });
    }
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed." });
    }
    return next();
  });
};

router.get("/links", getPaymentLinks);
router.get("/my", protect, listMyTournamentPayments);
router.post(
  "/tournament/:tournamentId/submit",
  protect,
  handleUpload,
  validate(submitPaymentSchema),
  submitTournamentPayment
);

module.exports = router;
