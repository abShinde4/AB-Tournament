# Room System Integration Guide

## Overview

Your AB Tournament now has a secure room system with:
- **Room publishing**: Admins can publish room ID and password for matches
- **Time-based access**: Room details unlock 10 minutes before match starts
- **Secure display**: Only joined players see room credentials
- **User-friendly UI**: Countdown timer, copy buttons, password reveal

---

## Backend API Reference

### 1. Publish Room (Admin Only)

**Endpoint:** `POST /api/admin/publish-room/:matchId`

**Headers:**
```javascript
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "roomId": "ROOM-12345",
  "roomPassword": "PASSWORD123"
}
```

**Response:**
```json
{
  "message": "Room published successfully.",
  "match": {
    "id": "match-id",
    "title": "AB Free Fire Solo Cup",
    "roomId": "ROOM-12345",
    "roomUnlockTime": "2026-05-02T10:50:00Z",
    "isRoomPublished": true
  }
}
```

### 2. Get Match Details with Room Info

**Endpoint:** `GET /api/matches/:matchId/details`

**Headers:**
```javascript
{
  "Authorization": "Bearer YOUR_TOKEN"
}
```

**Response (Before Unlock):**
```json
{
  "id": "match-id",
  "title": "AB Free Fire Solo Cup",
  "roomId": "",
  "roomPassword": "",
  "isRoomVisible": false,
  "roomUnlockedAt": "2026-05-02T10:50:00Z",
  "status": "Upcoming"
}
```

**Response (After Unlock):**
```json
{
  "id": "match-id",
  "title": "AB Free Fire Solo Cup",
  "roomId": "ROOM-12345",
  "roomPassword": "PASSWORD123",
  "isRoomVisible": true,
  "roomUnlockedAt": "2026-05-02T10:50:00Z",
  "status": "Live"
}
```

---

## Frontend Components

### 1. RoomDisplay Component

Shows room details with copy and password reveal features.

**Usage:**
```jsx
import RoomDisplay from './components/RoomDisplay';
import { fetchMatchDetails } from './utils/roomUtils';
import { useEffect, useState } from 'react';

export function MatchDetailsPage() {
  const [matchDetails, setMatchDetails] = useState(null);
  const token = localStorage.getItem('token');
  const matchId = 'some-match-id';

  useEffect(() => {
    fetchMatchDetails(matchId, token).then(setMatchDetails);
  }, [matchId, token]);

  return (
    <div>
      <h1>{matchDetails?.title}</h1>
      <RoomDisplay matchDetails={matchDetails} />
    </div>
  );
}
```

**Props:**
- `matchDetails` (object): Match data with room info from API

**Features:**
- ✅ Countdown timer until room unlocks
- ✅ Copy Room ID button
- ✅ Reveal/Hide password button
- ✅ Copy password button
- ✅ Success feedback messages
- ✅ Responsive mobile design

---

### 2. Countdown Component

Reusable countdown timer in MM:SS format.

**Usage:**
```jsx
import Countdown from './components/Countdown';

export function MyComponent() {
  const unlockTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  return (
    <div>
      <p>
        Room unlocks in <Countdown unlockTime={unlockTime} />
      </p>
    </div>
  );
}
```

**Props:**
- `unlockTime` (string | Date): ISO string or Date object for unlock time

**Returns:**
- `null` if already unlocked
- `MM:SS` format while counting down

---

### 3. AdminRoomPublisher Component

Admin interface to publish room details for a match.

**Usage:**
```jsx
import AdminRoomPublisher from './components/AdminRoomPublisher';

export function AdminMatchPage() {
  const token = localStorage.getItem('token');
  const matchId = 'some-match-id';

  const handleSuccess = (result) => {
    console.log('Room published:', result);
    // Refresh match data or show notification
  };

  return (
    <div>
      <h1>Manage Match</h1>
      <AdminRoomPublisher
        matchId={matchId}
        token={token}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

**Props:**
- `matchId` (string): The match ID to publish room for
- `token` (string): JWT token for authorization
- `onSuccess` (function, optional): Callback when room published successfully

---

## Utility Functions

### Room Utilities (`utils/roomUtils.js`)

```javascript
import {
  isRoomUnlocked,
  getTimeUntilUnlock,
  formatTimeUntilUnlock,
  fetchMatchDetails,
  publishRoom,
} from './utils/roomUtils';

// Check if room is accessible
const unlocked = isRoomUnlocked(matchDetails);

// Get time until unlock in milliseconds
const timeMs = getTimeUntilUnlock(matchDetails);

// Format time as readable string
const timeStr = formatTimeUntilUnlock(timeMs);
// Output: "5 minutes, 30 seconds"

// Fetch match details
const details = await fetchMatchDetails(matchId, token);

// Publish room (admin only)
const result = await publishRoom(matchId, roomId, roomPassword, token);
```

---

## Complete Example: Match Details Page

```jsx
import { useEffect, useState } from 'react';
import RoomDisplay from './components/RoomDisplay';
import { fetchMatchDetails } from './utils/roomUtils';

export function MatchDetailsPage() {
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const matchId = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const details = await fetchMatchDetails(matchId, token);
      setMatchDetails(details);
      setLoading(false);
    };

    loadDetails();

    // Refresh every 30 seconds to update room status
    const interval = setInterval(loadDetails, 30000);
    return () => clearInterval(interval);
  }, [matchId, token]);

  if (loading) return <div>Loading...</div>;
  if (!matchDetails) return <div>Match not found</div>;

  return (
    <div className="match-details">
      <h1>{matchDetails.title}</h1>
      
      <div className="match-info">
        <p>Game: {matchDetails.game}</p>
        <p>Players: {matchDetails.maxPlayers}</p>
        <p>Prize Pool: ₹{matchDetails.prizePool}</p>
        <p>Status: {matchDetails.status}</p>
      </div>

      {/* Room Details Section */}
      <RoomDisplay matchDetails={matchDetails} />
    </div>
  );
}
```

---

## Complete Example: Admin Match Management Page

```jsx
import { useState } from 'react';
import AdminRoomPublisher from './components/AdminRoomPublisher';

export function AdminMatchManagePage() {
  const [publishedMatches, setPublishedMatches] = useState([]);
  const token = localStorage.getItem('token');
  const matchId = 'match-id-to-manage';

  const handleRoomPublished = (result) => {
    setPublishedMatches([...publishedMatches, result.match.id]);
    alert('Room published! Players can see details 10 minutes before match.');
  };

  const isPublished = publishedMatches.includes(matchId);

  return (
    <div className="admin-panel">
      <h1>Match Management</h1>

      {isPublished ? (
        <div className="success-box">
          ✓ Room has been published for this match
        </div>
      ) : (
        <AdminRoomPublisher
          matchId={matchId}
          token={token}
          onSuccess={handleRoomPublished}
        />
      )}
    </div>
  );
}
```

---

## Security Features

1. **Access Control**
   - Only joined players can access room details
   - Non-joined players see 403 error
   - Authentication via JWT required

2. **Time-based Visibility**
   - Room locked until 10 minutes before match
   - Countdown shown to users
   - Prevents premature disclosure

3. **Password Security**
   - Hidden by default with reveal button
   - Can copy to clipboard without revealing
   - Not visible in browser history (copied via JS)

4. **Data Validation**
   - Room ID and password required
   - Admin-only publishing
   - Validates match exists before publishing

---

## Testing Checklist

- [ ] Admin can publish room details via API
- [ ] Room unlock time calculated correctly (10 min before start)
- [ ] Non-joined users see 403 error when fetching details
- [ ] Joined users see countdown before unlock time
- [ ] Joined users see room details after unlock time
- [ ] Copy button works for Room ID
- [ ] Copy button works for Password
- [ ] Reveal/Hide password toggle works
- [ ] Countdown stops and disappears after unlock
- [ ] Responsive on mobile devices

---

## Troubleshooting

### Room details not showing?
1. Verify you joined the match
2. Check API response has `isRoomPublished: true`
3. Verify current time >= `roomUnlockedAt`

### Copy buttons not working?
- Requires HTTPS in production (clipboard API security)
- Check browser console for errors
- Verify `navigator.clipboard` is available

### Admin can't publish room?
1. Verify admin role: `req.user.role === 'admin'`
2. Check match exists in database
3. Verify JWT token is valid

### Countdown stuck?
1. Check system time on server/client
2. Verify `unlockTime` is valid ISO date string
3. Component should auto-stop at 00:00

---

## File Summary

**Backend Files Modified:**
- `server/src/models/Match.js` - Added `roomUnlockTime`, `isRoomPublished`
- `server/src/controllers/adminController.js` - Added `publishRoom` function
- `server/src/routes/adminRoutes.js` - Added publish room route
- `server/src/validation/schemas.js` - Added `publishRoomSchema`
- `server/src/controllers/tournamentController.js` - Updated `getMatchDetails` logic

**Frontend Files Created:**
- `client/src/components/RoomDisplay.jsx` - Main room display component
- `client/src/components/RoomDisplay.css` - Room display styles
- `client/src/components/Countdown.jsx` - Countdown timer component
- `client/src/components/AdminRoomPublisher.jsx` - Admin publisher component
- `client/src/components/AdminRoomPublisher.css` - Publisher styles
- `client/src/utils/roomUtils.js` - Utility functions

---

## Next Steps

1. ✅ Update your match details pages to use `RoomDisplay`
2. ✅ Add `AdminRoomPublisher` to admin match management page
3. ✅ Test with real match data
4. ✅ Deploy to production
5. ✅ Monitor for issues

**Your room system is ready to use!** 🚀
