const { Resend } = require("resend");
const nodemailer = require("nodemailer");

// Email service for sending verification emails and notifications
let transporter = null;
let emailProvider = null; // "resend" | "gmail" | null
let senderEmail = null;

const initializeEmailService = () => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Priority 1: Try Resend API
  if (resendApiKey) {
    try {
      transporter = new Resend(resendApiKey);
      emailProvider = "resend";
      senderEmail = "onboarding@resend.dev";
      console.log("✓ Email service initialized: Resend API");
      return;
    } catch (error) {
      console.error("✗ Resend initialization failed:", error.message);
      // Fall through to Gmail SMTP
    }
  }

  // Priority 2: Try Nodemailer with Gmail SMTP
  if (emailUser && emailPass) {
    try {
      // Validate Gmail App Password (should be 16 characters without spaces)
      const cleanPass = emailPass.replace(/\s+/g, "");
      if (cleanPass.length !== 16) {
        console.warn(
          "⚠️  EMAIL_PASS does not appear to be a valid Gmail App Password (should be 16 characters). " +
          "Email service will not be available."
        );
        transporter = null;
        emailProvider = null;
        return;
      }

      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: cleanPass,
        },
      });

      emailProvider = "gmail";
      senderEmail = emailUser;
      console.log(`✓ Email service initialized: Gmail SMTP (${emailUser})`);
      return;
    } catch (error) {
      console.error("✗ Gmail SMTP initialization failed:", error.message);
    }
  }

  // No email provider configured
  console.warn(
    "⚠️  Email service disabled - no email provider configured.\n" +
    "   Option 1: Set RESEND_API_KEY for Resend API\n" +
    "   Option 2: Set EMAIL_USER and EMAIL_PASS for Gmail SMTP (16-char app password)"
  );
  transporter = null;
  emailProvider = null;
};

const sendVerificationEmail = async (email, verificationToken) => {
  if (!transporter) {
    console.warn(`⚠️  Email not sent to ${email} - email service not configured`);
    return { sent: false, reason: "Email service not configured" };
  }

  const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: senderEmail,
    to: email,
    subject: "AB Tournament - Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to AB Tournament!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <p>Click the button below to verify your email:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p><small>${verificationUrl}</small></p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">If you did not create this account, please ignore this email.</p>
      </div>
    `,
    text: `Welcome to AB Tournament!\n\nVerify your email: ${verificationUrl}\n\nThis link will expire in 24 hours.`,
  };

  try {
    let result;
    if (emailProvider === "resend") {
      result = await transporter.emails.send(mailOptions);
      console.log(`✓ Verification email sent to ${email} (via Resend)`);
      return { sent: true, messageId: result.id };
    } else if (emailProvider === "gmail") {
      result = await transporter.sendMail(mailOptions);
      console.log(`✓ Verification email sent to ${email} (via Gmail SMTP)`);
      return { sent: true, messageId: result.messageId };
    }
  } catch (error) {
    console.error(`✗ Failed to send verification email to ${email}:`, error.message);
    return { sent: false, reason: error.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  if (!transporter) {
    console.warn(`⚠️  Email not sent to ${email} - email service not configured`);
    return { sent: false, reason: "Email service not configured" };
  }

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: senderEmail,
    to: email,
    subject: "AB Tournament - Password Reset",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
    text: `Reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.`,
  };

  try {
    let result;
    if (emailProvider === "resend") {
      result = await transporter.emails.send(mailOptions);
      console.log(`✓ Password reset email sent to ${email} (via Resend)`);
      return { sent: true, messageId: result.id };
    } else if (emailProvider === "gmail") {
      result = await transporter.sendMail(mailOptions);
      console.log(`✓ Password reset email sent to ${email} (via Gmail SMTP)`);
      return { sent: true, messageId: result.messageId };
    }
  } catch (error) {
    console.error(`✗ Failed to send password reset email to ${email}:`, error.message);
    return { sent: false, reason: error.message };
  }
};

const sendOtpEmail = async (email, otp) => {
  if (!transporter) {
    console.warn(`⚠️  Email not sent to ${email} - email service not configured`);
    return { sent: false, reason: "Email service not configured" };
  }

  const mailOptions = {
    from: senderEmail,
    to: email,
    subject: "AB Tournament - Your OTP Login Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your One-Time Password (OTP)</h2>
        <p>Use the following code to log in to your AB Tournament account:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 4px;">
          <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p><strong>Important:</strong></p>
        <ul>
          <li>This code will expire in 5 minutes</li>
          <li>Never share this code with anyone</li>
          <li>If you did not request this code, please ignore this email</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `,
    text: `Your AB Tournament OTP: ${otp}\n\nThis code will expire in 5 minutes. Never share this code with anyone.`,
  };

  try {
    let result;
    if (emailProvider === "resend") {
      result = await transporter.emails.send(mailOptions);
      console.log(`✓ OTP email sent to ${email} (via Resend)`);
      return { sent: true, messageId: result.id };
    } else if (emailProvider === "gmail") {
      result = await transporter.sendMail(mailOptions);
      console.log(`✓ OTP email sent to ${email} (via Gmail SMTP)`);
      return { sent: true, messageId: result.messageId };
    }
  } catch (error) {
    console.error(`✗ Failed to send OTP email to ${email}:`, error.message);
    return { sent: false, reason: error.message };
  }
};

module.exports = {
  initializeEmailService,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
};
