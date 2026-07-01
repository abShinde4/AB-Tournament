const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { normalizePhone } = require("../utils/phoneUtils");

const hasValidPhone = (phoneNumber) => /^[6-9]\d{9}$/.test(String(phoneNumber || ""));

const syncAdminPassword = async (adminUser, adminPassword) => {
  const matches = await bcrypt.compare(adminPassword, adminUser.password);
  if (matches) return false;

  adminUser.password = await bcrypt.hash(adminPassword, 10);
  await adminUser.save();
  // eslint-disable-next-line no-console
  console.log("Admin password hash synced from ADMIN_PASSWORD.");
  return true;
};

const attachAdminPhone = async (adminUser, adminPhone) => {
  if (hasValidPhone(adminUser.phoneNumber)) return false;

  const phoneTaken = await User.findOne({
    phoneNumber: adminPhone,
    _id: { $ne: adminUser._id },
  });
  if (phoneTaken) {
    // eslint-disable-next-line no-console
    console.warn(
      `ADMIN_PHONE (${adminPhone}) is already used by another account. Assign a unique phone to the admin user manually.`
    );
    return false;
  }

  adminUser.phoneNumber = adminPhone;
  adminUser.phoneVerified = true;
  adminUser.isVerified = true;
  adminUser.isActive = true;
  await adminUser.save();
  // eslint-disable-next-line no-console
  console.log(`Assigned ADMIN_PHONE to admin (${adminUser.username}).`);
  return true;
};

const ensureAdminUser = async () => {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
  const adminName = process.env.ADMIN_NAME?.trim() || adminUsername;
  const legacyAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPhone = process.env.ADMIN_PHONE ? normalizePhone(process.env.ADMIN_PHONE) : null;

  if (!adminPassword) {
    // eslint-disable-next-line no-console
    console.warn("Admin bootstrap skipped. Set ADMIN_PASSWORD in .env");
    return;
  }

  let adminUser =
    (await User.findOne({ role: "admin" })) ||
    (legacyAdminEmail ? await User.findOne({ email: legacyAdminEmail }) : null) ||
    (adminPhone ? await User.findOne({ phoneNumber: adminPhone }) : null) ||
    (await User.findOne({ username: adminUsername }));

  if (adminUser) {
    let changed = false;
    if (adminUser.role !== "admin") {
      adminUser.role = "admin";
      changed = true;
    }
    if (adminPhone) {
      changed = (await attachAdminPhone(adminUser, adminPhone)) || changed;
    } else if (!hasValidPhone(adminUser.phoneNumber)) {
      // eslint-disable-next-line no-console
      console.warn(
        "Admin account has no phone number. Set ADMIN_PHONE in .env so admin can sign in."
      );
    }
    changed = (await syncAdminPassword(adminUser, adminPassword)) || changed;
    if (changed) {
      await adminUser.save();
    }
    // eslint-disable-next-line no-console
    console.log(
      `Admin account ready (${adminUser.phoneNumber || adminUser.username || legacyAdminEmail || "admin"}).`
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const userData = {
    username: adminUsername,
    fullName: adminName,
    password: hashedPassword,
    role: "admin",
    isVerified: true,
    phoneVerified: Boolean(adminPhone),
    isActive: true,
  };

  if (legacyAdminEmail) userData.email = legacyAdminEmail;
  if (adminPhone) userData.phoneNumber = adminPhone;

  await User.create(userData);
  // eslint-disable-next-line no-console
  console.log(`Admin account created: ${adminPhone || adminUsername}`);
};

module.exports = { ensureAdminUser };
