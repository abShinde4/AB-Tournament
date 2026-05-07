const express = require("express");
const path = require("path");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../controllers/userController");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${unique}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only jpeg, jpg, png images are allowed."), false);
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post("/upload-avatar", protect, upload.single("avatar"), uploadAvatar);

// Multer errors (file too large, invalid type) should be 400, not 500.
// eslint-disable-next-line no-unused-vars
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Avatar must be <= 2MB." : err.message || "Upload failed.";
    return res.status(400).json({ message });
  }
  if (err && err.message) {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: "Upload failed." });
});

module.exports = router;
