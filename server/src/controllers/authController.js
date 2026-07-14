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

const duplicateFieldMessage = (field) => {
  switch (field) {
    case "phoneNumber":
      return "Phone number already exists.";
    case "bgmiUid":
      return "This BGMI UID is already linked to another account.";
    case "freeFireUid":
      return "This Free Fire UID is already linked to another account.";
    case "username":
      return "Username already taken. Please try again.";
    case "email":
      return "This email is already in use.";
    default:
      return "An account with these details already exists.";
  }
};

const normalizeOptionalValue = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const register = async (req, res) => {
  try {
    const body = req.validated?.body || {};
    const { username, email, phoneNumber, password, confirmPassword, bgmiUid, freeFireUid } = body;
    const normalizedUsername = (username || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedPhone = normalizePhone(phoneNumber);
    const normalizedBgmiUid = normalizeOptionalValue(bgmiUid);
    const normalizedFreeFireUid = normalizeOptionalValue(freeFireUid);

    if (!normalizedPhone) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername }).select("_id");
    if (existingUsername) {
      return res.status(409).json({ message: duplicateFieldMessage("username") });
    }

    const existingEmail = await User.findOne({ email: normalizedEmail }).select("_id");
    if (existingEmail) {
      return res.status(409).json({ message: duplicateFieldMessage("email") });
    }

    const existingPhone = await User.findOne({ phoneNumber: normalizedPhone }).select("_id");
    if (existingPhone) {
      return res.status(409).json({ message: "Phone number already exists." });
    }

    if (normalizedBgmiUid) {
      const bgmiTaken = await User.findOne({ bgmiUid: normalizedBgmiUid }).select("_id");
      if (bgmiTaken) {
        return res.status(409).json({ message: duplicateFieldMessage("bgmiUid") });
      }
    }

    if (normalizedFreeFireUid) {
      const freeFireTaken = await User.findOne({ freeFireUid: normalizedFreeFireUid }).select("_id");
      if (freeFireTaken) {
        return res.status(409).json({ message: duplicateFieldMessage("freeFireUid") });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const adminPhone = process.env.ADMIN_PHONE ? normalizePhone(process.env.ADMIN_PHONE) : null;
    const role =
      (adminEmail && normalizedEmail === adminEmail) ||
      (adminPhone && normalizedPhone === adminPhone)
        ? "admin"
        : "user";

    const userData = {
      username: normalizedUsername,
      fullName: normalizedUsername,
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      password: hashed,
      role,
      isVerified: true,
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    };

    if (normalizedBgmiUid) userData.bgmiUid = normalizedBgmiUid;
    if (normalizedFreeFireUid) userData.freeFireUid = normalizedFreeFireUid;

    const user = await User.create(userData);

    return res.status(201).json({
      token: createToken(user._id),
      user: serializeUser(user),
      message: "Registration successful.",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: duplicateFieldMessage(field) });
    }
    // eslint-disable-next-line no-console
    console.error("Registration failed", {
      username: req.validated?.body?.username || null,
      email: req.validated?.body?.email || null,
      phoneNumber: req.validated?.body?.phoneNumber || null,
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.validated.body;

    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    if (!user && username) {
      user = await User.findOne({ username });
    }
    if (!user && phoneNumber) {
      const normalizedPhone = normalizePhone(phoneNumber);
      if (normalizedPhone) {
        user = await User.findOne({ phoneNumber: normalizedPhone });
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "This account has been deactivated. Contact admin for help." });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    return res.json({
      token: createToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login failed", {
      username: req.validated?.body?.username || null,
      email: req.validated?.body?.email || null,
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
    if (bgmiUid !== undefined) updates.bgmiUid = bgmiUid || undefined;
    if (freeFireName !== undefined) updates.freeFireName = freeFireName;
    if (freeFireUid !== undefined) updates.freeFireUid = freeFireUid || undefined;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: duplicateFieldMessage(field) });
    }
    // eslint-disable-next-line no-console
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Profile update failed.", error: error.message });
  }
};

module.exports = { register, login, me, updateMe };
