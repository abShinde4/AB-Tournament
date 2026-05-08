const nodemailer = require("nodemailer");

// Email service for sending verification emails and notifications
let transporter = null;

const initializeEmailService = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || "gmail";
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;

  if (!emailUser || !emailPassword) {
    console.warn(
      "⚠️  Email disabled - missing EMAIL_USER or EMAIL_PASS. " +
        "Set EMAIL_USER and use a Gmail App Password (16 chars) in EMAIL_PASS."
    );
    transporter = null;
    return;
  }

  try {
    if (emailProvider === "gmail") {
      transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
          user: emailUser,
          pass: emailPassword,
        },

        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,

        tls: {
          rejectUnauthorized: false,
        },
      });
    } else if (emailProvider === "smtp" && smtpHost) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: Number(smtpPort) === 465,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
    } else {
      console.warn("⚠️  Email service not configured. Verification emails will not be sent.");
      transporter = null;
      return;
    }

    transporter.verify((verifyError) => {
      if (verifyError) {
        if (
          verifyError.responseCode === 535 ||
          /Username and Password not accepted|5\.7\.8/.test(verifyError.message)
        ) {
          console.warn(
            "⚠️  Gmail authentication failed. Use a Gmail App Password (16 chars) in EMAIL_PASS, not your regular Gmail password."
          );
        } else {
          console.warn("⚠️  Email transporter verification failed:", verifyError.message);
        }
        transporter = null;
      } else {
        console.log("✓ Email service configured");
      }
    });
  } catch (error) {
    if (error.responseCode === 535 || /Username and Password not accepted|5\.7\.8/.test(error.message)) {
      console.error(
        "✗ Gmail authentication failed. Use a Gmail App Password (16 chars) in EMAIL_PASS, not your regular Gmail password."
      );
    } else {
      console.error("✗ Email initialization failed:", error);
    }
    transporter = null;
  }
};

const sendVerificationEmail = async (email, verificationToken) => {
  if (!transporter) {
    console.warn(`⚠️  Email not sent to ${email} - service not configured`);
    return { sent: false, reason: "Email service not configured" };
  }

  const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ Verification email sent to ${email}`);
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    console.error(`✗ Failed to send verification email to ${email}:`, error.message);
    return { sent: false, reason: error.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  if (!transporter) {
    console.warn(`⚠️  Email not sent to ${email} - service not configured`);
    return { sent: false, reason: "Email service not configured" };
  }

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset email sent to ${email}`);
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    console.error(`✗ Failed to send password reset email to ${email}:`, error.message);
    return { sent: false, reason: error.message };
  }
};

const sendOtpEmail = async (email, otp) => {
  if (!transporter) {
    console.warn(`⚠️  Email not sent to ${email} - service not configured`);
    return { sent: false, reason: "Email service not configured" };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ OTP email sent to ${email}`);
    return { sent: true, messageId: result.messageId };
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
