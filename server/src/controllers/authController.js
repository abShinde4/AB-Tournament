const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/emailService");
const { normalizePhone } = require("../utils/phoneUtils");

const createToken = (userId) =>
  jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const serializeUser = (user) => ({
  id: user._id,
  _id: user._id,
  username: user.username,
  fullName: user.fullName || "",
  phoneNumber: user.phoneNumber || "",
  whatsappNumber: user.whatsappNumber || "",
  email: user.email || "",
  walletBalance: user.walletBalance,
  virtualFunds: user.virtualFunds,
  avatar: user.avatar,
  xp: user.xp,
  level: user.level,
  role: user.role,
  isVerified: user.isVerified,
  bgmiUid: user.bgmiUid || "",
  bgmiName: user.bgmiName || "",
  freeFireName: user.freeFireName || "",
  freeFireUid: user.freeFireUid || "",
  createdAt: user.createdAt,
});

const generateUsername = async (fullName, phone) => {
  let base = fullName
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  if (base.length < 3) base = `player${phone.slice(-4)}`;
  let username = base;
  let suffix = 0;
  while (await User.findOne({ username })) {
    suffix += 1;
    username = `${base}${suffix}`.slice(0, 24);
  }
  return username;
};

const register = async (req, res) => {
  try {
    const { fullName, phoneNumber, whatsappNumber, password, bgmiUid } = req.validated.body;
    const normalizedPhone = normalizePhone(phoneNumber);

    const existing = await User.findOne({ phoneNumber: normalizedPhone });
    if (existing) {
      return res.status(409).json({ message: "Phone number already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const username = await generateUsername(fullName, normalizedPhone);
    const adminPhone = process.env.ADMIN_PHONE ? normalizePhone(process.env.ADMIN_PHONE) : null;
    const role = adminPhone && normalizedPhone === adminPhone ? "admin" : "user";

    const user = await User.create({
      username,
      fullName: fullName.trim(),
      phoneNumber: normalizedPhone,
      whatsappNumber: normalizePhone(whatsappNumber || phoneNumber),
      password: hashed,
      bgmiUid: bgmiUid?.trim() || "",
      role,
      isVerified: true,
      emailVerified: true,
    });

    return res.status(201).json({
      token: createToken(user._id),
      user: serializeUser(user),
      message: "Registration successful.",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        message:
          field === "phoneNumber"
            ? "Phone number already registered."
            : "An account with these details already exists.",
      });
    }
    // eslint-disable-next-line no-console
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const registerLegacy = async (req, res) => {
  try {
    const { username, email, password } = req.validated.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const role =
      process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase()
        ? "admin"
        : "user";

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      username,
      email,
      password: hashed,
      role,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
    });

    const emailResult = await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      token: createToken(user._id),
      user: serializeUser(user),
      message: emailResult.sent
        ? "Registration successful. Please verify your email."
        : "Registration successful. Email service unavailable - you may need to verify manually.",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Legacy registration error:", error);
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { phoneNumber, email, password } = req.validated.body;

    if (!phoneNumber && !email) {
      return res.status(400).json({ message: "Enter phone number or email." });
    }

    let user = null;
    if (phoneNumber) {
      user = await User.findOne({ phoneNumber: normalizePhone(phoneNumber) });
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.phoneNumber && !user.isVerified && process.env.NODE_ENV === "production") {
      return res.status(403).json({
        message: "Please verify your email before login.",
        isVerified: false,
      });
    }

    return res.json({
      token: createToken(user._id),
      user: serializeUser(user),
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

    user.isVerified = true;
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return res.json({
      message: "Email verified successfully!",
      user: serializeUser(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Verification failed.", error: error.message });
  }
};

const me = async (req, res) => {
  return res.json({ user: serializeUser(req.user) });
};

const updateMe = async (req, res) => {
  try {
    const { username, email, fullName, phoneNumber, whatsappNumber, bgmiName, bgmiUid, freeFireName, freeFireUid } =
      req.validated.body;
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (fullName) updates.fullName = fullName;
    if (phoneNumber) {
      const normalizedPhone = normalizePhone(phoneNumber);
      const phoneTaken = await User.findOne({
        phoneNumber: normalizedPhone,
        _id: { $ne: req.user._id },
      });
      if (phoneTaken) {
        return res.status(409).json({ message: "Phone number already in use." });
      }
      updates.phoneNumber = normalizedPhone;
    }
    if (whatsappNumber) updates.whatsappNumber = normalizePhone(whatsappNumber);
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

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Profile update failed.", error: error.message });
  }
};

module.exports = { register, registerLegacy, login, me, updateMe, verifyEmail };
