const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/emailService");

const createToken = (userId) =>
  jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const register = async (req, res) => {
  try {
    const { username, email, password } = req.validated.body;
    // eslint-disable-next-line no-console
    console.log("Register request received", { username, email });

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const role =
      process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase()
        ? "admin"
        : "user";
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // eslint-disable-next-line no-console
    console.log("Saving user:", email);
    const user = await User.create({
      username,
      email,
      password: hashed,
      role,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
    });

    // eslint-disable-next-line no-console
    console.log("User saved successfully", { email: user.email, id: user._id });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
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
      message: emailResult.sent 
        ? "Registration successful. Please verify your email." 
        : "Registration successful. Email service unavailable - you may need to verify manually.",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.validated.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Check if email is verified
    if (!user.isVerified && process.env.NODE_ENV === "production") {
      return res.status(403).json({ 
        message: "Please verify your email before login.",
        isVerified: false,
      });
    }

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
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: "Verification token is required." });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    // Mark email as verified
    user.isVerified = true;
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return res.json({ 
      message: "Email verified successfully!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Verification failed.", error: error.message });
  }
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const updateMe = async (req, res) => {
  try {
    const { username, email, bgmiName, bgmiUid, freeFireName, freeFireUid } = req.validated.body;
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (bgmiName !== undefined) updates.bgmiName = bgmiName;
    if (bgmiUid !== undefined) updates.bgmiUid = bgmiUid;
    if (freeFireName !== undefined) updates.freeFireName = freeFireName;
    if (freeFireUid !== undefined) updates.freeFireUid = freeFireUid;

    if (email) {
      const existing = await User.findOne({
        email,
        _id: { $ne: req.user._id },
      });
      if (existing) {
        return res.status(409).json({ message: "Email already in use." });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.json({ user });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Profile update failed.", error: error.message });
  }
};

module.exports = { register, login, me, updateMe, verifyEmail };
