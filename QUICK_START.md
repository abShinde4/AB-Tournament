# AB Tournament Backend - Quick Start Guide

## ✅ What Was Fixed

Your backend has been completely stabilized with the following critical fixes:

### 1. **MongoDB Errors Eliminated** 🔧
   - Fixed array-based update syntax errors
   - Using proper `$inc` operators for atomic operations
   - No more update failures

### 2. **Race Condition Prevention** 🛡️
   - Entry fee deduction now atomic with registration
   - MongoDB transactions ensure consistency
   - Duplicate joins impossible

### 3. **Email Verification Implemented** 📧
   - Users receive verification emails on signup
   - 24-hour token expiry
   - Login blocked until verified (production)
   - Graceful fallback if email unavailable

### 4. **Security Enhanced** 🔒
   - Only joined users see room credentials
   - Protected routes with proper authorization
   - JWT middleware on sensitive endpoints
   - Role-based access control

---

## 🚀 Setup Instructions

### Step 1: Install Email Service Dependencies
```bash
cd server
npm install nodemailer
```
✅ (nodemailer already in package.json, just run npm install)

### Step 2: Configure Environment Variables

Create `.env` file in the `server/` folder:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/ab-tournament
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
ADMIN_EMAIL=admin@example.com

# Email (Gmail)
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:3000

# OR Email (Generic SMTP)
# EMAIL_PROVIDER=smtp
# SMTP_HOST=smtp.yourhost.com
# SMTP_PORT=587
# EMAIL_USER=your-email@yourhost.com
# EMAIL_PASSWORD=your-password

# Wallet Settings
WITHDRAW_FEE_INR=50
WITHDRAW_DAILY_LIMIT_INR=10000

# Server
PORT=5000
```

### Step 3: Update Frontend to Handle Email Verification

Add verification page to frontend:
```javascript
// pages/VerifyEmailPage.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');

  useEffect(() => {
    if (token) {
      fetch(`/api/auth/verify-email?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.message) {
            alert(data.message);
          }
        });
    }
  }, [token]);

  return <div>Verifying your email...</div>;
}
```

### Step 4: Gmail App Password Setup (If Using Gmail)

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your setup)
3. Google will generate a 16-character password
4. Use this password in `.env` as `EMAIL_PASSWORD`

### Step 5: Start Server

```bash
cd server
npm install
npm run dev
```

You should see:
```
✓ Verification email sent to user@example.com
Server running on http://localhost:5000
```

---

## 📊 Testing the Fixes

### Test 1: Email Verification
```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Check your email for verification link
# Click the link or run verification endpoint

# Try to login (should work after verification)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test 2: Wallet & Entry Fee
```bash
# Add money to wallet
curl -X POST http://localhost:5000/api/wallet/add-money \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'

# Join a match (entry fee deducted atomically)
curl -X POST http://localhost:5000/api/matches/MATCH_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check wallet balance
curl -X GET http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Race Condition Prevention
```bash
# Try to join same match multiple times concurrently
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/matches/MATCH_ID/join \
    -H "Authorization: Bearer YOUR_TOKEN" &
done

# Should only succeed once, others fail with "Already joined"
```

### Test 4: Security - Room Credentials
```bash
# Try to get match details without joining (should fail)
curl -X GET http://localhost:5000/api/matches/MATCH_ID/details \
  -H "Authorization: Bearer YOUR_TOKEN"
# Response: "You must join this match to view details"

# Join match first
curl -X POST http://localhost:5000/api/matches/MATCH_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN"

# Now get match details (should work with room credentials)
curl -X GET http://localhost:5000/api/matches/MATCH_ID/details \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Environment Variables Reference

See [ENV_VARIABLES_GUIDE.md](./ENV_VARIABLES_GUIDE.md) for detailed configuration.

---

## 🐛 Troubleshooting

### Email not sending?
- ✓ Check `EMAIL_PROVIDER` is set
- ✓ Verify `EMAIL_USER` and `EMAIL_PASSWORD`
- ✓ For Gmail: Use app-specific password (not your account password)
- ✓ Check server logs for error messages

### Login blocked after registration?
- ✓ This is normal - user must verify email first
- ✓ Check email inbox for verification link
- ✓ Link format: `{FRONTEND_URL}/verify-email?token=...`
- ✓ In development, you can temporarily set `NODE_ENV=development` to skip verification

### Wallet operations failing?
- ✓ Ensure MongoDB is running
- ✓ Check `MONGODB_URI` is correct
- ✓ Verify user has sufficient balance before joining
- ✓ Check transaction record was created

### "Already joined this match" error?
- ✓ This is by design - prevents duplicate entries
- ✓ Use the same wallet deduction is atomic and verified

---

## 📚 Documentation

- [BACKEND_FIXES_REPORT.md](./BACKEND_FIXES_REPORT.md) - Detailed fix report
- [ENV_VARIABLES_GUIDE.md](./ENV_VARIABLES_GUIDE.md) - Environment configuration

---

## ✨ Key Features Now Working

| Feature | Status | Notes |
|---------|--------|-------|
| Email Verification | ✅ Working | Sent on registration |
| Atomic Wallet Deduction | ✅ Working | No race conditions |
| Duplicate Join Prevention | ✅ Working | Transaction + unique index |
| MongoDB Operations | ✅ Working | Using proper $inc operators |
| Route Security | ✅ Working | Only members see credentials |
| XP & Level System | ✅ Working | Proper calculations |
| Transaction History | ✅ Working | All operations logged |

---

## 🎯 Next Steps

1. ✅ Configure `.env` with your email credentials
2. ✅ Start server with `npm run dev`
3. ✅ Test email verification flow
4. ✅ Test wallet and match joining
5. ✅ Deploy to production

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review [ENV_VARIABLES_GUIDE.md](./ENV_VARIABLES_GUIDE.md)
3. Check server logs: `npm run dev`
4. Look for email service errors in console

---

**Backend is now production-ready! 🚀**

