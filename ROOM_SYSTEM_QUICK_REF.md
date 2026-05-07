# Room System - Quick Reference

## ✅ What's Been Added

### Backend (Server)

#### 1. **Match Model Updates**
- Added `roomUnlockTime: Date` - When room becomes visible
- Added `isRoomPublished: Boolean` - Whether room is published

#### 2. **Admin API Endpoint**
```
POST /api/admin/publish-room/:matchId
Request: { roomId, roomPassword }
Response: { message, match }
```

#### 3. **Match Details API Update**
```
GET /api/matches/:matchId/details
Response includes:
- roomId, roomPassword (if unlocked and joined)
- roomUnlockedAt (timestamp)
- isRoomVisible (boolean)
```

### Frontend (Client)

#### 1. **RoomDisplay Component**
- Shows countdown if room locked
- Shows room ID + password if unlocked
- Features: Copy buttons, reveal password, feedback messages
- Fully responsive

#### 2. **Countdown Component**
- Reusable countdown timer
- Formats as MM:SS
- Auto-stops at unlock

#### 3. **AdminRoomPublisher Component**
- Simple form for admins to publish rooms
- Input validation
- Success/error messages

#### 4. **Room Utilities**
- `isRoomUnlocked()` - Check access
- `getTimeUntilUnlock()` - Get time diff
- `formatTimeUntilUnlock()` - Format as text
- `fetchMatchDetails()` - API call
- `publishRoom()` - Publish API call

---

## 🔒 Security Flow

```
1. Admin publishes room:
   POST /api/admin/publish-room/:matchId
   → roomUnlockTime = startTime - 10 min

2. User joins match (already atomic):
   POST /api/matches/:matchId/join
   → Wallet deducted (atomic)
   → Transaction recorded

3. User fetches match details:
   GET /api/matches/:matchId/details
   → Check: joined? + published? + unlocked?
   → If yes: Show roomId + roomPassword
   → If no: Show locked + countdown

4. User can copy/reveal password:
   → Copy to clipboard (no history)
   → Toggle password visibility
   → Success feedback
```

---

## 📱 Usage Quick Start

### For Frontend Developers

**1. In your Match Details Page:**
```jsx
import RoomDisplay from './components/RoomDisplay';

<RoomDisplay matchDetails={matchDetails} />
```

**2. In your Admin Panel:**
```jsx
import AdminRoomPublisher from './components/AdminRoomPublisher';

<AdminRoomPublisher
  matchId={matchId}
  token={token}
  onSuccess={handlePublished}
/>
```

**3. Fetch match details:**
```jsx
import { fetchMatchDetails } from './utils/roomUtils';

const details = await fetchMatchDetails(matchId, token);
```

---

## 📊 Database Changes

### Match Document Before
```json
{
  "_id": "...",
  "title": "Match Name",
  "roomId": "ROOM-123",
  "roomPassword": "PASS123",
  "isRoomVisible": false
}
```

### Match Document After
```json
{
  "_id": "...",
  "title": "Match Name",
  "roomId": "ROOM-123",
  "roomPassword": "PASS123",
  "roomUnlockTime": "2026-05-02T10:50:00Z",
  "isRoomPublished": true,
  "isRoomVisible": false
}
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| POST | `/api/admin/publish-room/:matchId` | ✅ | Admin | Publish room details |
| GET | `/api/matches/:matchId/details` | ✅ | User | Get room details (if joined) |
| POST | `/api/matches/:matchId/join` | ✅ | User | Join match (existing) |

---

## 📋 Files Modified/Created

### Modified (Backend)
```
✏️  server/src/models/Match.js
✏️  server/src/controllers/adminController.js
✏️  server/src/routes/adminRoutes.js
✏️  server/src/validation/schemas.js
✏️  server/src/controllers/tournamentController.js
```

### Created (Frontend)
```
✨ client/src/components/RoomDisplay.jsx
✨ client/src/components/RoomDisplay.css
✨ client/src/components/Countdown.jsx
✨ client/src/components/AdminRoomPublisher.jsx
✨ client/src/components/AdminRoomPublisher.css
✨ client/src/utils/roomUtils.js
```

### Documentation
```
📖 ROOM_SYSTEM_INTEGRATION.md (this guide)
```

---

## ⏰ Timeline: Room Unlock Logic

```
Match Start: 11:00 AM
Room Unlock: 10:50 AM (10 min before)

Before 10:50:
  - Admin publishes: ✓
  - User sees: "Room unlocks in XX:XX" (countdown)
  - Room data: { roomId: "", roomPassword: "", isRoomVisible: false }

After 10:50:
  - User sees: Room ID + Password (revealed or hidden)
  - Can copy/reveal/hide
  - Room data: { roomId: "...", roomPassword: "...", isRoomVisible: true }
```

---

## 🧪 Quick Test Commands

### Test 1: Publish Room (as admin)
```bash
curl -X POST http://localhost:5000/api/admin/publish-room/MATCH_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "ROOM-12345",
    "roomPassword": "PASSWORD123"
  }'
```

### Test 2: Get Match Details (as joined user)
```bash
curl -X GET http://localhost:5000/api/matches/MATCH_ID/details \
  -H "Authorization: Bearer USER_TOKEN"
```

### Test 3: Get Match Details (before unlock)
Response should have empty roomId/roomPassword + unlock time

### Test 4: Get Match Details (after unlock)
Response should have roomId + roomPassword visible

---

## ✅ Verification Checklist

Before deploying:

- [ ] Match model has `roomUnlockTime` field
- [ ] Match model has `isRoomPublished` field
- [ ] Admin can publish room via API
- [ ] Room unlock time = startTime - 10 minutes
- [ ] Non-joined users get 403 on details endpoint
- [ ] Joined users see countdown before unlock
- [ ] Joined users see room after unlock
- [ ] Copy button works (check browser console)
- [ ] Password reveal/hide toggles
- [ ] All components import correctly
- [ ] No TypeScript errors
- [ ] Mobile responsive works

---

## 🎯 Key Features

✅ **Secure** - Only joined users see credentials  
✅ **Timed** - Room unlocks 10 min before match  
✅ **User-friendly** - Countdown, copy, reveal buttons  
✅ **Mobile** - Fully responsive design  
✅ **Admin-controlled** - Admins publish when ready  
✅ **Atomic** - Entry fee still atomic (not changed)  
✅ **Minimal** - No breaking changes to existing code  

---

## 🚀 Deploy Steps

1. ✅ Install dependencies (no new npm packages needed)
2. ✅ Deploy backend (new endpoint, model fields)
3. ✅ Deploy frontend (new components, utils)
4. ✅ Test workflow end-to-end
5. ✅ Monitor for errors

**All changes are backward compatible!** Existing features keep working. 

---

## 📞 Need Help?

See [ROOM_SYSTEM_INTEGRATION.md](./ROOM_SYSTEM_INTEGRATION.md) for:
- Complete usage examples
- Component API reference
- Security details
- Troubleshooting guide
- Integration examples

---

**Room System Ready!** ✨
