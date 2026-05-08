const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const resultRoutes = require("./routes/resultRoutes");
const walletRoutes = require("./routes/walletRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ab-tournament.vercel.app",
    "https://ab-tournament-git-main-abshinde4s-projects.vercel.app"
  ],
  
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 250,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", globalLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "AB Tournament API", now: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/otp", authLimiter, otpRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/matches", tournamentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ message: err.message || "Server error" });
});

module.exports = app;
