const express = require("express");
const { register, registerLegacy, login, me, updateMe, verifyEmail } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { registerSchema, registerLegacySchema, loginSchema, updateProfileSchema } = require("../validation/schemas");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/register-legacy", validate(registerLegacySchema), registerLegacy);
router.post("/login", validate(loginSchema), login);
router.get("/verify-email", verifyEmail);
router.get("/me", protect, me);
router.patch("/me", protect, validate(updateProfileSchema), updateMe);

module.exports = router;
