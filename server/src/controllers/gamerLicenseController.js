const {
  getDefaultConfig,
  getEligibility,
  claimLicense,
  verifyLicense,
  getMyLicense,
  adminUpdateLicense,
  adminCreateLicenseForUser,
  updateConfig,
  serializeLicense,
} = require("../services/gamerLicenseService");
const GamerLicense = require("../models/GamerLicense");
const User = require("../models/User");

const sendError = (res, error) => {
  const status = error.statusCode || 500;
  return res.status(status).json({ message: error.message || "Request failed." });
};

const getEligibilityHandler = async (req, res) => {
  try {
    const data = await getEligibility(req.user._id);
    return res.json(data);
  } catch (error) {
    return sendError(res, error);
  }
};

const getMyLicenseHandler = async (req, res) => {
  try {
    const license = await getMyLicense(req.user._id);
    return res.json({ license });
  } catch (error) {
    return sendError(res, error);
  }
};

const claimLicenseHandler = async (req, res) => {
  try {
    const license = await claimLicense(req.user._id);
    return res.status(201).json({ message: "Verified Gamer License claimed successfully.", license });
  } catch (error) {
    return sendError(res, error);
  }
};

const verifyLicenseHandler = async (req, res) => {
  try {
    const { licenseId } = req.params;
    const { token } = req.query;
    const result = await verifyLicense({ licenseId, token });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

const adminListLicenses = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const term = req.query.search.trim();
      const users = await User.find({
        $or: [
          { username: new RegExp(term, "i") },
          { fullName: new RegExp(term, "i") },
          { phoneNumber: term },
          { email: term },
        ],
      }).select("_id");
      filter.$or = [
        { licenseId: new RegExp(term, "i") },
        { playerName: new RegExp(term, "i") },
        { user: { $in: users.map((u) => u._id) } },
      ];
    }

    const [data, total] = await Promise.all([
      GamerLicense.find(filter)
        .populate("user", "username fullName phoneNumber email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      GamerLicense.countDocuments(filter),
    ]);

    return res.json({
      data: data.map(serializeLicense),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminSearchUsers = async (req, res) => {
  try {
    const term = (req.query.q || "").trim();
    if (!term) return res.json({ data: [] });

    const users = await User.find({
      $or: [
        { username: new RegExp(term, "i") },
        { fullName: new RegExp(term, "i") },
        { phoneNumber: term.replace(/\D/g, "").slice(-10) },
        { email: term.toLowerCase() },
      ],
    })
      .select("username fullName phoneNumber email bgmiUid role")
      .limit(10);

    const licenses = await GamerLicense.find({ user: { $in: users.map((u) => u._id) } });
    const licenseMap = new Map(licenses.map((l) => [String(l.user), serializeLicense(l)]));

    return res.json({
      data: users.map((u) => ({
        ...u.toObject(),
        license: licenseMap.get(String(u._id)) || null,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminUpdateLicenseHandler = async (req, res) => {
  try {
    const license = await adminUpdateLicense({
      licenseId: req.params.id,
      adminId: req.user._id,
      updates: req.validated.body,
    });
    return res.json({ message: "License updated.", license });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminCreateLicenseHandler = async (req, res) => {
  try {
    const { userId, tier } = req.validated.body;
    const license = await adminCreateLicenseForUser({
      userId,
      adminId: req.user._id,
      tier,
    });
    return res.status(201).json({ message: "License issued.", license });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminGetConfig = async (_req, res) => {
  try {
    const config = await getDefaultConfig();
    return res.json({ config });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminUpdateConfig = async (req, res) => {
  try {
    const config = await updateConfig(req.validated.body);
    return res.json({ message: "License config updated.", config });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getEligibilityHandler,
  getMyLicenseHandler,
  claimLicenseHandler,
  verifyLicenseHandler,
  adminListLicenses,
  adminSearchUsers,
  adminUpdateLicenseHandler,
  adminCreateLicenseHandler,
  adminGetConfig,
  adminUpdateConfig,
};
