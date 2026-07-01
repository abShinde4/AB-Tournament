const express = require("express");
const { register, login, me, updateMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema, updateProfileSchema } = require("../validation/schemas");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);
router.patch("/me", protect, validate(updateProfileSchema), updateMe);

module.exports = router;
