const dotenv = require("dotenv");
const path = require("path");
const app = require("./app");
const connectDb = require("./config/db");
const User = require("./models/User");
const { ensureAdminUser } = require("./bootstrap/adminUser");
const { syncPaymentRequestIndexes } = require("./bootstrap/paymentRequestIndexes");
const { startRoomVisibilityJob } = require("./jobs/roomVisibilityJob");
const { initializeEmailService } = require("./utils/emailService");
const { ensureUploadsDir } = require("./middleware/optionalScreenshotUpload");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true,
});

process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled Rejection:", err);
});

const PORT = process.env.PORT || 5000;

const validateEnvironment = () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing in .env");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in .env");
  }

  if (!process.env.CLIENT_URL) {
    // eslint-disable-next-line no-console
    console.warn(
      "CLIENT_URL missing — CORS still allows localhost and *.vercel.app, but set CLIENT_URL on Render for custom domains."
    );
  } else {
    // eslint-disable-next-line no-console
    console.log("CLIENT_URL configured:", process.env.CLIENT_URL);
  }

  if (!process.env.RESEND_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    // eslint-disable-next-line no-console
    console.warn("RESEND_API_KEY and Gmail SMTP credentials are both missing — email delivery disabled.");
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // eslint-disable-next-line no-console
    console.warn(
      "Email disabled - missing EMAIL_USER or EMAIL_PASS. Verification emails will not be sent. " +
        "Set EMAIL_USER and a Gmail App Password (16 chars) in EMAIL_PASS."
    );
  } else if (process.env.EMAIL_PASS.length !== 16) {
    // eslint-disable-next-line no-console
    console.warn(
      "EMAIL_PASS does not look like a Gmail App Password. Use a 16-character app password, not your normal Gmail password."
    );
  }
};

const resetLegacyWalletBalances = async () => {
  try {
    const result = await User.updateMany({ walletBalance: 100 }, { $set: { walletBalance: 0 } });
    if (result.modifiedCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`Reset ${result.modifiedCount} legacy wallet balance(s) from ₹100 to ₹0.`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to reset legacy wallet balances:", error);
  }
};

const startServer = async () => {
  try {
    // Validate required environment variables before startup
    validateEnvironment();

    // Initialize email service with safe fallback
    initializeEmailService();

    await connectDb();
    await syncPaymentRequestIndexes();
    ensureUploadsDir();
    await resetLegacyWalletBalances();
    await ensureAdminUser();
    startRoomVisibilityJob();

    // eslint-disable-next-line no-console
    console.log("Starting server...");
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
