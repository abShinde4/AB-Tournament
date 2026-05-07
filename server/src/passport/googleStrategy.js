const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

if (!clientID || !clientSecret) {
  console.warn(
    "⚠️  Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable Google login."
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(new Error("Google account has no email."));
        }

        const avatar = profile.photos?.[0]?.value || "";
        const username = profile.displayName || email.split("@")[0];

        const existing = await User.findOne({ email });
        if (existing) {
          existing.avatar = avatar || existing.avatar;
          existing.isVerified = true;
          existing.emailVerified = true;
          if (!existing.username) existing.username = username;
          await existing.save();
          return done(null, existing);
        }

        const randomPassword = crypto.randomBytes(32).toString("hex");
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const role = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

        const user = await User.create({
          username,
          email,
          password: hashedPassword,
          avatar,
          role,
          isVerified: true,
          emailVerified: true,
        });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
