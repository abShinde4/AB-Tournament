const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ensureAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    // eslint-disable-next-line no-console
    console.warn("Admin bootstrap skipped. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const username = process.env.ADMIN_USERNAME?.trim() || "admin";

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      username,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  // eslint-disable-next-line no-console
  console.log(`Admin account ready: ${adminEmail}`);
};

module.exports = { ensureAdminUser };
