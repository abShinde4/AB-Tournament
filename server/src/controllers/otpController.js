const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOtpEmail } = require("../utils/emailService");

const createToken = (userId) =>
  jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user without password (OTP login only)
      user = await User.create({
        email: email.toLowerCase(),
        username: email.split("@")[0],
        password: crypto.randomBytes(32).toString("hex"), // Random password for OAuth-like behavior
        role: process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() 
          ? "admin" 
          : "user",
      });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to user
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    // Send OTP via email
    const emailResult = await sendOtpEmail(email, otp);

    return res.json({
      message: emailResult.sent 
        ? "OTP sent successfully to your email." 
        : "Unable to send email, please try again.",
      sent: emailResult.sent,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP.", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpiry) {
      return res.status(401).json({ message: "OTP not found. Please request a new OTP." });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(401).json({ message: "OTP has expired. Please request a new OTP." });
    }

    // Check if OTP matches
    if (user.otp !== otp.toString()) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      if (user.otpAttempts >= 5) {
        user.otp = null;
        user.otpExpiry = null;
        user.otpAttempts = 0;
        await user.save();
        return res.status(401).json({ message: "Too many attempts. Please request a new OTP." });
      }

      return res.status(401).json({ 
        message: "Invalid OTP.",
        attemptsLeft: 5 - user.otpAttempts,
      });
    }

    // OTP is valid, login user
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.isVerified = true;
    user.emailVerified = true;
    await user.save();

    return res.json({
      token: createToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      message: "Login successful!",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "OTP verification failed.", error: error.message });
  }
};

module.exports = { sendOtp, verifyOtp };
