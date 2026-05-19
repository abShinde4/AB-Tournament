const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

const ensureUploadsDir = () => {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Could not create uploads directory:", error.message);
  }
};

/**
 * Screenshot is optional. Upload/storage errors never block the request handler.
 */
const createOptionalScreenshotUpload = (fieldName = "screenshot") => {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadsDir();
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const safeExt = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `payment-${unique}${safeExt}`);
    },
  });

  const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Invalid screenshot type"), false);
      }
      return cb(null, true);
    },
    limits: { fileSize: 3 * 1024 * 1024 },
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.warn(
          `Optional screenshot upload skipped (${fieldName}):`,
          err.message || err.code || err
        );
        req.file = undefined;
      }
      return next();
    });
  };
};

module.exports = { createOptionalScreenshotUpload, ensureUploadsDir, uploadsDir };
