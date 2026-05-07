# AB Tournament Backend - Environment Variables Guide

This document describes all required and optional environment variables for the backend.

## Database Configuration
```
MONGODB_URI=mongodb://localhost:27017/ab-tournament
NODE_ENV=development
```

## JWT & Security
```
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
ADMIN_EMAIL=admin@example.com
```

## Email Configuration (REQUIRED for email verification)

### Gmail Option
```
EMAIL_PROVIDER=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=your-gmail@gmail.com
FRONTEND_URL=http://localhost:3000
```

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use the app-specific password in EMAIL_PASSWORD

### Generic SMTP Option
```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

## Payment Gateway (Razorpay - Optional)
```
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## Wallet & Withdrawal Settings
```
WITHDRAW_FEE_INR=50
WITHDRAW_DAILY_LIMIT_INR=10000
```

## Server Configuration
```
PORT=5000
```

## Full Example .env File

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/ab-tournament
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-at-least-32-chars-long-for-security
ADMIN_EMAIL=admin@example.com

# Email Service (Gmail)
EMAIL_PROVIDER=gmail
EMAIL_USER=tournaments@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=tournaments@gmail.com
FRONTEND_URL=http://localhost:3000

# Email Service (SMTP - Alternative)
# EMAIL_PROVIDER=smtp
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# EMAIL_USER=apikey
# EMAIL_PASSWORD=your-sendgrid-api-key
# EMAIL_FROM=noreply@ab-tournament.com

# Razorpay Payment
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# Withdrawal Settings
WITHDRAW_FEE_INR=50
WITHDRAW_DAILY_LIMIT_INR=10000

# Server
PORT=5000
```

## Email Verification Flow

1. User registers with email
2. Backend generates `verificationToken` (32-byte hex string)
3. Email sent to user with verification link: `{FRONTEND_URL}/verify-email?token={verificationToken}`
4. User clicks link or visits endpoint: `GET /api/auth/verify-email?token={token}`
5. Backend validates token and sets `isVerified: true`
6. In production, login is blocked until email is verified
7. In development, users can login without verification

## Security Notes

- **JWT_SECRET**: Should be at least 32 characters, use a strong random string
- **EMAIL_PASSWORD**: Use app-specific passwords for Gmail, not your main password
- **FRONTEND_URL**: Used in email links, must match your actual frontend URL
- **MONGODB_URI**: For production, use MongoDB Atlas with authentication

## Troubleshooting

### Email not sending?
- Check `EMAIL_PROVIDER` is set correctly
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- For Gmail: Ensure app-specific password is generated (not your account password)
- Check server logs for email service errors

### Login blocked after registration?
- This is by design in production mode
- Users must verify email first: check your email for verification link
- In development, email verification is not required

### Wallet operations failing?
- Ensure MongoDB is running and `MONGODB_URI` is correct
- Check user has sufficient wallet balance before joining match
- Verify `WITHDRAW_FEE_INR` and `WITHDRAW_DAILY_LIMIT_INR` are numbers

