const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { normalizePhone } = require("../utils/phoneUtils");

const createToken = (userId) =>
  jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const serializeUser = (user) => ({
  id: user._id,
  _id: user._id,
  username: user.username,
  fullName: user.fullName || "",
  phoneNumber: user.phoneNumber || "",
  phone: user.phoneNumber || "",
  phoneVerified: Boolean(user.phoneVerified),
  email: user.email || "",
  walletBalance: user.walletBalance,
  virtualFunds: user.virtualFunds,
  avatar: user.avatar,
  xp: user.xp,
  level: user.level,
  role: user.role,
  isVerified: user.isVerified,
  isActive: user.isActive !== false,
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
    const { fullName, phoneNumber, phone, password, bgmiUid, freeFireUid } = req.validated.body;
    const normalizedPhone = normalizePhone(phoneNumber || phone);

    if (!normalizedPhone) {
      return res.status(400).json({ message: "Phone number is required." });
    }

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
      password: hashed,
      bgmiUid: bgmiUid?.trim() || "",
      freeFireUid: freeFireUid?.trim() || "",
      role,
      isVerified: true,
      phoneVerified: true,
      isActive: true,
    });

    return res.status(201).json({
      token: createToken(user._id),
      user: serializeUser(user),
      message: "Registration successful.",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      if (field === "phoneNumber") {
        return res.status(409).json({ message: "Phone number already registered." });
      }
      if (field === "email") {
        return res.status(409).json({ message: "This email is already in use." });
      }
      return res.status(409).json({ message: "An account with these details already exists." });
    }
    // eslint-disable-next-line no-console
    console.error("Registration failed", {
      phoneNumber: req.validated?.body?.phoneNumber || req.validated?.body?.phone || null,
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { phoneNumber, phone, password } = req.validated.body;
    const normalizedPhone = normalizePhone(phoneNumber || phone);

    const user = normalizedPhone ? await User.findOne({ phoneNumber: normalizedPhone }) : null;
    if (!user) {
      return res.status(401).json({
        message:
          "Invalid phone number or password. If you have an older account, ask admin to link your phone number.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "This account has been deactivated. Contact admin for help." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid phone number or password." });
    }

    return res.json({
      token: createToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login failed", {
      phoneNumber: req.validated?.body?.phoneNumber || req.validated?.body?.phone || null,
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

const me = async (req, res) => {
  return res.json({ user: serializeUser(req.user) });
};

const updateMe = async (req, res) => {
  try {
    const { username, fullName, bgmiName, bgmiUid, freeFireName, freeFireUid } = req.validated.body;
    const updates = {};
    if (username) updates.username = username;
    if (fullName) updates.fullName = fullName;
    if (bgmiName !== undefined) updates.bgmiName = bgmiName;
    if (bgmiUid !== undefined) updates.bgmiUid = bgmiUid;
    if (freeFireName !== undefined) updates.freeFireName = freeFireName;
    if (freeFireUid !== undefined) updates.freeFireUid = freeFireUid;

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

module.exports = { register, login, me, updateMe };
