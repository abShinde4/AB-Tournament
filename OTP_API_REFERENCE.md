# OTP LOGIN - API USAGE EXAMPLES

## 🔐 Authentication Endpoints

### Endpoint 1: Send OTP to Email

**Request:**
```bash
curl -X POST http://localhost:5000/api/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Response (Success - 200):**
```json
{
  "message": "OTP sent successfully to your email.",
  "sent": true
}
```

**Response (Failure - 400):**
```json
{
  "message": "Email is required."
}
```

**Response (Server Error - 500):**
```json
{
  "message": "Failed to send OTP.",
  "error": "SMTP connection failed"
}
```

---

### Endpoint 2: Verify OTP & Get JWT Token

**Request:**
```bash
curl -X POST http://localhost:5000/api/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MzE0ODkzNDU2Nzg5MDAwMDAwMDAwMSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MTQ4OTEyMDAsImV4cCI6MTcxNTQ5NjAwMH0.5Yw3...",
  "user": {
    "id": "663148934567890000000001",
    "username": "userexample",
    "email": "user@example.com",
    "walletBalance": 0,
    "avatar": "",
    "xp": 0,
    "level": 1,
    "role": "user",
    "isVerified": true,
    "createdAt": "2024-05-05T10:20:00.000Z"
  },
  "message": "Login successful!"
}
```

**Response (Invalid OTP - 401):**
```json
{
  "message": "Invalid OTP.",
  "attemptsLeft": 3
}
```

**Response (OTP Expired - 401):**
```json
{
  "message": "OTP has expired. Please request a new OTP."
}
```

**Response (Too Many Attempts - 401):**
```json
{
  "message": "Too many attempts. Please request a new OTP."
}
```

**Response (User Not Found - 401):**
```json
{
  "message": "User not found."
}
```

---

## 💻 Frontend Implementation Examples

### React Component - Send OTP
```jsx
const handleSendOtp = async (email) => {
  try {
    const response = await fetch(
      'http://localhost:5000/api/otp/send-otp',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const data = await response.json();
    console.log(data.message); // "OTP sent successfully..."
    // Move to OTP verification form
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

### React Component - Verify OTP
```jsx
const handleVerifyOtp = async (email, otp) => {
  try {
    const response = await fetch(
      'http://localhost:5000/api/otp/verify-otp',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const data = await response.json();
    
    // Save token
    localStorage.setItem('ab_token', data.token);
    
    // Update user in state
    setUser(data.user);
    
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

### JavaScript - Using OTP in API Calls
```javascript
// After OTP login, use token in all requests
const token = localStorage.getItem('ab_token');

fetch('http://localhost:5000/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📊 Rate Limiting

**Endpoint:** `/api/otp/*`
**Limit:** 40 requests per 10 minutes per IP

**Response when rate limited (429):**
```json
{
  "message": "Too many requests, please try again later."
}
```

---

## 🧪 Example Workflows

### Workflow 1: Complete OTP Login Flow

**Step 1: User requests OTP**
```bash
POST /api/otp/send-otp
Body: { "email": "john@example.com" }

→ User receives email with OTP: 456789
```

**Step 2: User enters OTP**
```bash
POST /api/otp/verify-otp
Body: { 
  "email": "john@example.com",
  "otp": "456789"
}

→ Response with JWT token and user data
```

**Step 3: Use token for authenticated requests**
```bash
GET /api/user/profile
Headers: {
  "Authorization": "Bearer eyJhbGci..."
}

→ User profile loaded
```

---

### Workflow 2: OTP Resend After Expiration

**First Request (OTP sent)**
```bash
POST /api/otp/send-otp
Body: { "email": "jane@example.com" }

Response: { "sent": true }
```

**Wait 5 minutes... OTP expires**

**Second Request (Request new OTP)**
```bash
POST /api/otp/send-otp
Body: { "email": "jane@example.com" }

Response: { "sent": true, "message": "New OTP sent" }
```

---

### Workflow 3: Failed Verification Attempts

**Attempt 1 (Wrong OTP)**
```bash
POST /api/otp/verify-otp
Body: { "email": "bob@example.com", "otp": "000000" }

Response: { 
  "message": "Invalid OTP.",
  "attemptsLeft": 4
}
```

**Attempt 2-4 (Wrong OTP)**
```bash
# Same as above...
# attemptsLeft: 3, 2, 1
```

**Attempt 5 (Final Wrong OTP)**
```bash
POST /api/otp/verify-otp
Body: { "email": "bob@example.com", "otp": "000000" }

Response: { 
  "message": "Too many attempts. Please request a new OTP."
}
```

**Recovery: Request new OTP**
```bash
POST /api/otp/send-otp
Body: { "email": "bob@example.com" }

Response: { "sent": true }
# User can now try again with new OTP
```

---

## 🔄 Data Models

### OTP Request Body
```javascript
{
  "email": "string (required, must be valid email)"
}
```

### OTP Verify Request Body
```javascript
{
  "email": "string (required, must be valid email)",
  "otp": "string (required, exactly 6 digits)"
}
```

### OTP Verify Response
```javascript
{
  "token": "string (JWT token for authentication)",
  "user": {
    "id": "string (MongoDB ObjectId)",
    "username": "string",
    "email": "string",
    "walletBalance": "number",
    "avatar": "string (URL or empty)",
    "xp": "number",
    "level": "number",
    "role": "string (user or admin)",
    "isVerified": "boolean",
    "createdAt": "ISO 8601 date string"
  },
  "message": "string"
}
```

---

## ⚠️ Error Codes Summary

| HTTP | Error | Solution |
|------|-------|----------|
| 400 | Email is required | Provide valid email |
| 400 | OTP must be 6 digits | Enter exactly 6 digits |
| 401 | Invalid OTP | Check email again, verify code |
| 401 | OTP has expired | Click "Request New OTP" |
| 401 | Too many attempts | Request new OTP via send endpoint |
| 401 | User not found | Use send-otp first to create account |
| 429 | Too many requests | Wait before making new requests |
| 500 | Failed to send OTP | Email service issue, check .env |

---

## 🚀 Testing with Postman

### Create OTP Collection in Postman

**Request 1: Send OTP**
```
Method: POST
URL: {{base_url}}/api/otp/send-otp
Headers:
  Content-Type: application/json
Body:
  {
    "email": "test@example.com"
  }
```

**Request 2: Verify OTP**
```
Method: POST
URL: {{base_url}}/api/otp/verify-otp
Headers:
  Content-Type: application/json
Body:
  {
    "email": "test@example.com",
    "otp": "123456"
  }
```

**Set Postman Variable for Token**
```javascript
// In Tests tab of Verify OTP request:
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token);
}
```

**Use Token in Authenticated Requests**
```
Headers:
  Authorization: Bearer {{token}}
```

---

## 📝 Notes

- OTP is valid for exactly 5 minutes
- OTP is numeric (0-9) only, 6 digits
- Email is case-insensitive internally
- User auto-created if doesn't exist
- Email is auto-verified on successful OTP login
- Max 5 verification attempts per OTP
- Token expires in 7 days
- All endpoints use rate limiting

---

## ✅ Validation Rules

**Email:**
- Must be valid email format (RFC 5322)
- Case-insensitive
- Stored in lowercase

**OTP:**
- Exactly 6 digits
- Numeric only (0-9)
- No spaces or special characters
- Generated randomly
- Expires after 5 minutes

**Token:**
- JWT format
- Includes user ID and type
- Expires in 7 days
- Verified on protected routes

