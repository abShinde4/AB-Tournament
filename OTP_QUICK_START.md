# OTP LOGIN - QUICK START GUIDE

## 🎯 What Was Implemented

Your MERN app now has a complete **EMAIL OTP LOGIN SYSTEM** with:
- ✅ 6-digit OTP generation (random)
- ✅ 5-minute expiration timer
- ✅ Email sending via nodemailer (FREE - no paid service)
- ✅ Auto-user creation on first OTP request
- ✅ Resend OTP when expired
- ✅ Beautiful countdown timer in UI
- ✅ All Google OAuth code removed

## 🚀 How to Use

### Backend API Endpoints

**1. Request OTP:**
```bash
POST http://localhost:5000/api/otp/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "OTP sent successfully to your email.",
  "sent": true
}
```

**2. Verify OTP & Login:**
```bash
POST http://localhost:5000/api/otp/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "username": "user",
    "email": "user@example.com",
    "isVerified": true
  },
  "message": "Login successful!"
}
```

### Frontend UI

In `AuthPage.jsx`, users can now:
1. Click **"Login with OTP"** button
2. Enter email → Click **"Send OTP"**
3. Enter 6-digit code from email
4. Click **"Verify OTP"** to login
5. See countdown timer: "OTP expires in 4:53"
6. Click **"Request New OTP"** if expired

## ⚙️ Configuration

### Step 1: Set Up Email Service

**Option A: Gmail (Recommended)**

1. Go to: https://myaccount.google.com/apppasswords
2. Select: Mail → Windows Computer
3. Copy the 16-character password
4. Update `.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
CLIENT_URL=http://localhost:5173
```

**Option B: Any SMTP Provider**

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
EMAIL_USER=your-email@provider.com
EMAIL_PASS=your-password
CLIENT_URL=http://localhost:5173
```

### Step 2: Restart Server

```bash
npm start
```

You should see:
```
✓ Email service configured
✓ Server running on port 5000
```

## 📱 Testing

### Test Flow:
1. Start server: `npm start`
2. Open browser: http://localhost:5173/auth
3. Click **"Login with OTP"**
4. Enter test email: `test@example.com`
5. Click **"Send OTP"**
6. Check email inbox (or console logs if email disabled)
7. Enter the 6-digit OTP
8. Click **"Verify OTP"**
9. ✅ You should be logged in!

### Check OTP in Console (if email not configured)

When email is not set up, OTP will be logged in server console:
```
✓ OTP email sent to test@example.com
```

You can still test the flow - just extract OTP from the console.

## 🔒 Security Features

- ✅ **6-digit random OTP** - Hard to guess
- ✅ **5-minute expiration** - Time-limited
- ✅ **Max 5 attempts** - Prevents brute force
- ✅ **Auto-lockout** - After failed attempts
- ✅ **JWT tokens** - Secure session management
- ✅ **Rate limited** - 40 requests per 10 minutes

## ❌ What Was Removed

All Google OAuth code has been removed:
- ✅ Deleted: `server/src/passport/googleStrategy.js`
- ✅ Removed: passport packages from `package.json`
- ✅ Removed: All `/api/auth/google` routes
- ✅ Removed: Google button from login UI
- ✅ Removed: `GoogleCallbackPage` route

## 📋 File Changes Summary

### Backend Files Modified:
- `server/src/models/User.js` - Added OTP fields
- `server/src/app.js` - Added OTP routes, removed passport
- `server/src/routes/authRoutes.js` - Removed Google routes
- `server/src/controllers/authController.js` - Removed googleCallback
- `server/src/utils/emailService.js` - Added sendOtpEmail()
- `server/package.json` - Removed passport packages

### Backend Files Created:
- `server/src/controllers/otpController.js` - OTP logic (NEW)
- `server/src/routes/otpRoutes.js` - OTP endpoints (NEW)

### Frontend Files Modified:
- `client/src/pages/AuthPage.jsx` - Full UI overhaul with OTP modes
- `client/src/App.jsx` - Removed Google callback route

### Configuration:
- `.env` - Removed Google credentials

## 🐛 Troubleshooting

### "Email service not configured"
- **Solution**: Update `.env` with valid EMAIL_USER and EMAIL_PASS

### "OTP not found"
- **Solution**: Request new OTP via "Send OTP" button
- OTP expires after 5 minutes

### "Invalid OTP"
- **Solution**: Check email for correct code
- You have 5 attempts before lockout

### "Too many attempts"
- **Solution**: Request new OTP
- Account lockout clears automatically

### Password login still works?
- **Yes!** Password login (`/api/auth/login`) still works
- Both methods are available

## ✨ Features Coming Soon (Optional)

You can add these later:
- [ ] SMS OTP backup
- [ ] Beautiful email templates with branding
- [ ] QR code for multi-device login
- [ ] Two-factor authentication (2FA)
- [ ] Biometric login option
- [ ] Remember device for 30 days

## 📞 Support

If any endpoint returns an error:

1. Check server console for error messages
2. Verify email is properly formatted
3. Check `.env` configuration
4. Ensure MongoDB is running
5. Check network tab in browser DevTools

## 🎉 You're All Set!

Your MERN app now has:
- ✅ Email OTP login (100% free)
- ✅ No more Google OAuth (removed)
- ✅ Email/password login (still works)
- ✅ Automatic user creation
- ✅ Beautiful countdown timer
- ✅ Production-ready code

Enjoy! 🚀
