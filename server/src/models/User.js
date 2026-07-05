const mongoose = require("mongoose");
const { normalizePhone } = require("../utils/phoneUtils");

const normalizeEmail = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
};

const normalizeOptionalString = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
    },
    fullName: { type: String, required: true, trim: true, maxlength: 60 },
    phoneNumber: {
      type: String,
      trim: true,
      set: (value) => normalizePhone(value),
    },
    phoneVerified: { type: Boolean, default: false },
    whatsappNumber: { type: String, default: "", trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
      set: normalizeEmail,
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
    virtualFunds: {
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
    isActive: { type: Boolean, default: true },
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
    bgmiUid: { type: String, default: "", trim: true, set: normalizeOptionalString },
    freeFireName: { type: String, default: "", trim: true },
    freeFireUid: { type: String, default: "", trim: true, set: normalizeOptionalString },
  },
  { timestamps: true }
);

userSchema.pre("save", async function normalizeEmailBeforeSave() {
  if (typeof this.email === "string" && this.email.trim() === "") {
    this.email = undefined;
  }
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true, name: "phoneNumber_1" });
userSchema.index({ email: 1 }, { unique: true, sparse: true, name: "email_1" });
userSchema.index({ bgmiUid: 1 }, { unique: true, sparse: true, name: "bgmiUid_1" });
userSchema.index({ freeFireUid: 1 }, { unique: true, sparse: true, name: "freeFireUid_1" });

module.exports = mongoose.model("User", userSchema);
