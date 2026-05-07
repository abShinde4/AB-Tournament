const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    avatar: { type: String, default: "" },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Used to allow/deny withdrawals (security requirement).
    // Default is true to avoid blocking existing users in dev.
    emailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpiry: { type: Date, default: null },
    // OTP login system
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    // Gaming identity verification
    bgmiName: { type: String, default: "", trim: true },
    bgmiUid: { type: String, default: "", trim: true },
    freeFireName: { type: String, default: "", trim: true },
    freeFireUid: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
