const express = require("express");
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const { validate } = require("../middleware/validate");
const { z } = require("zod");

const router = express.Router();

// Validation schemas
const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
  }),
});

router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);

module.exports = router;
