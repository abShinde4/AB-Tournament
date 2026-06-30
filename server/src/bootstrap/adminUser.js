const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { normalizePhone } = require("../utils/phoneUtils");

const ensureAdminUser = async () => {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
  const adminName = process.env.ADMIN_NAME?.trim() || adminUsername;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPhone = process.env.ADMIN_PHONE ? normalizePhone(process.env.ADMIN_PHONE) : null;

  if (!adminPassword) {
    // eslint-disable-next-line no-console
    console.warn("Admin bootstrap skipped. Set ADMIN_PASSWORD in .env");
    return;
  }

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    // eslint-disable-next-line no-console
    console.log(
      `Admin account already exists (${existingAdmin.email || existingAdmin.phoneNumber || existingAdmin.username}). Skipping bootstrap.`
    );
    return;
  }

  if (adminEmail) {
    const byEmail = await User.findOne({ email: adminEmail });
    if (byEmail) {
      if (byEmail.role !== "admin") {
        byEmail.role = "admin";
        await byEmail.save();
      }
      // eslint-disable-next-line no-console
      console.log(`Existing user promoted to admin: ${adminEmail}`);
      return;
    }
  }

  if (adminPhone) {
    const byPhone = await User.findOne({ phoneNumber: adminPhone });
    if (byPhone) {
      if (byPhone.role !== "admin") {
        byPhone.role = "admin";
        await byPhone.save();
      }
      // eslint-disable-next-line no-console
      console.log(`Existing user promoted to admin: ${adminPhone}`);
      return;
    }
  }

  const byUsername = await User.findOne({ username: adminUsername });
  if (byUsername) {
    if (byUsername.role !== "admin") {
      byUsername.role = "admin";
      await byUsername.save();
    }
    // eslint-disable-next-line no-console
    console.log(`Existing user promoted to admin: ${adminUsername}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const userData = {
    username: adminUsername,
    fullName: adminName,
    password: hashedPassword,
    role: "admin",
    isVerified: true,
    emailVerified: true,
  };

  if (adminEmail) userData.email = adminEmail;
  if (adminPhone) {
    userData.phoneNumber = adminPhone;
    userData.whatsappNumber = adminPhone;
  }

  await User.create(userData);
  // eslint-disable-next-line no-console
  console.log(`Admin account created: ${adminEmail || adminPhone || adminUsername}`);
};

module.exports = { ensureAdminUser };
