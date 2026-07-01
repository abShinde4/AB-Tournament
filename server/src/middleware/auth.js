const jwt = require("jsonwebtoken");
const User = require("../models/User");

const extractToken = (authHeader = "") => {
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
};

const protect = async (req, res, next) => {
  const token = extractToken(req.headers.authorization || "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account deactivated." });
    }
    req.user = user;
    req.tokenMeta = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req.headers.authorization || "");
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (user) {
      req.user = user;
      req.tokenMeta = decoded;
    }
  } catch (_error) {
    // Ignore bad token for optional auth paths.
  }
  return next();
};

module.exports = { protect, optionalAuth };
