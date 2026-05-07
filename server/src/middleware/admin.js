const requireAdmin = (req, res, next) => {
  const adminSecret = req.headers["x-admin-secret"];
  const bySecret = adminSecret && adminSecret === process.env.ADMIN_SECRET;
  const byRole = req.user?.role === "admin";

  if (!bySecret && !byRole) {
    return res.status(403).json({ message: "Admin access denied." });
  }

  return next();
};

module.exports = { requireAdmin };
