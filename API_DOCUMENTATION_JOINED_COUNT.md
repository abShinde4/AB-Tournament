# Joined Players Count - API & Developer Documentation

## 📡 API Endpoints

### GET /api/tournaments
Returns list of all tournaments with player counts.

**Response**
```json
{
  "data": [
    {
      "_id": "60d5ec49c1234567890abcd1",
      "title": "AB Free Fire Solo Cup",
      "game": "Free Fire",
      "entryFee": 20,
      "prizePool": 200,
      "startTime": "2026-05-09T15:30:00.000Z",
      "status": "Upcoming",
      "maxPlayers": 100,
      "joinedPlayersCount": 78,
      "remainingSlots": 22,
      "roomId": "",
      "roomPassword": "",
      "isRoomPublished": false,
      "isRoomVisible": false,
      "resultsPublished": false,
      "createdAt": "2026-05-01T10:00:00.000Z",
      "updatedAt": "2026-05-09T14:50:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  },
  "serverTime": "2026-05-09T14:55:00.000Z"
}
```

**Query Parameters**
- `page` (default: 1) - Page number for pagination
- `limit` (default: 10, max: 50) - Results per page

**Notes**
- Includes `joinedPlayersCount` for each tournament
- Calculates `remainingSlots` = maxPlayers - joinedPlayersCount
- Available to both authenticated and non-authenticated users

---

### POST /api/tournaments/:matchId/join
User joins a tournament.

**Request**
```
POST /api/tournaments/60d5ec49c1234567890abcd1/join
Authorization: Bearer {token}
```

**Success Response (201)**
```json
{
  "message": "Joined successfully.",
  "walletBalance": 9580,
  "xp": 110,
  "level": 2
}
```

**Error Responses**

(400) Tournament Full
```json
{ "message": "Match is full." }
```

(400) Insufficient Balance
```json
{ "message": "Insufficient wallet balance." }
```

(400) Missing Gaming Profile
```json
{
  "message": "Please complete your Free Fire gaming profile...",
  "requiresGamingProfile": true
}
```

(409) Already Joined
```json
{ "message": "Already joined this match." }
```

(400) Not Upcoming
```json
{ "message": "You can join only upcoming matches." }
```

**What Happens Internally**
1. Validates tournament is Upcoming
2. Checks unique constraint (user not already joined)
3. Counts current registrations
4. Validates tournament not full
5. Verifies user wallet balance
6. Creates registration
7. **Increments joinedPlayersCount** ← Key step
8. Deducts entry fee (transactional)
9. Returns updated user data

---

## 🏗️ Data Model

### Match Schema
```javascript
{
  _id: ObjectId,
  title: String,
  game: "Free Fire" | "BGMI",
  entryFee: Number,
  prizePool: Number,
  startTime: Date,
  status: "Upcoming" | "Live" | "Completed",
  maxPlayers: Number,              // Maximum slots
  joinedPlayersCount: Number,      // ← NEW: Current joined
  roomId: String,
  roomPassword: String,
  roomUnlockTime: Date,
  isRoomPublished: Boolean,
  isRoomVisible: Boolean,
  resultsPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Registration Schema
```javascript
{
  _id: ObjectId,
  user: ObjectId,                  // Ref to User
  match: ObjectId,                 // Ref to Match
  joinedAt: Date,
  isPlayerVerified: Boolean,
  verificationNotes: String,
  verifiedAt: Date,
  verifiedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Unique Index
db.registrations.createIndex({ user: 1, match: 1 }, { unique: true })
```

---

## 🔧 Backend Implementation Details

### Tournament Controller - serializeMatch()

**Location**: `server/src/controllers/tournamentController.js`

**Purpose**: Serialize match data for API response

**Key Additions**:
```javascript
const serializeMatch = (match, joinedMatchIds = new Set()) => {
  // ... existing code ...
  
  const safe = {
    ...item,
    // ... other fields ...
    joinedPlayersCount: item.joinedPlayersCount || 0,      // ← NEW
    remainingSlots: (item.maxPlayers || 100) - (item.joinedPlayersCount || 0),  // ← NEW
  };
  
  return safe;
};
```

**Returns**:
- `joinedPlayersCount`: Current number of joined players
- `remainingSlots`: Calculated remaining slots

### Tournament Controller - joinMatch()

**Location**: `server/src/controllers/tournamentController.js`

**New Logic**:
```javascript
// After creating registration:
await Match.findByIdAndUpdate(
  matchId,
  { $inc: { joinedPlayersCount: 1 } },  // ← Atomic increment
  { session }
);
```

**Why This Works**:
- Uses atomic `$inc` operator
- Increments within transaction session
- Ensures consistency even with concurrent joins
- No race conditions

---

## 💾 Database Operations

### Increment Count
```javascript
// When user joins
await Match.findByIdAndUpdate(
  matchId,
  { $inc: { joinedPlayersCount: 1 } },
  { session }
);
```

### Check If Full
```javascript
// Before allowing join
const currentCount = await Registration.countDocuments({ 
  match: matchId 
}).session(session);

if (currentCount >= match.maxPlayers) {
  // Prevent join
}
```

### Sync Counts (One-time)
```javascript
// If needed to resync from Registration collection
const matches = await Match.find();

for (const match of matches) {
  const count = await Registration.countDocuments({ 
    match: match._id 
  });
  
  await Match.findByIdAndUpdate(
    match._id,
    { joinedPlayersCount: count }
  );
}
```

---

## 🎯 Frontend Integration

### PlayerCountBar Component

**Location**: `client/src/components/PlayerCountBar.jsx`

**Props**:
```typescript
interface PlayerCountBarProps {
  joinedCount: number;      // Current joined count
  maxPlayers: number;       // Max slots (default: 100)
}
```

**Example Usage**:
```jsx
import { PlayerCountBar } from '../components/PlayerCountBar';

<PlayerCountBar 
  joinedCount={match.joinedPlayersCount} 
  maxPlayers={match.maxPlayers}
/>
```

**Renders**:
- Joined count display: "Joined: X/100"
- Remaining slots: "Slots Left: Y"
- Progress bar: X% filled
- Status indicators (warning/full)
- Animated effects

### Tournament Page Integration

**Location**: `client/src/pages/TournamentPage.jsx`

**Key Changes**:
```jsx
// Import component
import { PlayerCountBar } from '../components/PlayerCountBar';

// Render in card
<PlayerCountBar 
  joinedCount={match.joinedPlayersCount || 0} 
  maxPlayers={match.maxPlayers || 100}
/>

// Disable button when full
disabled={loadingId === match._id || match.remainingSlots === 0}

// Update button text
{loadingId === match._id ? "Joining..." : 
 match.remainingSlots === 0 ? "Tournament Full" : 
 "Join Now"}

// Auto-refresh after join
const res = await api.joinMatch(matchId);
await loadMatches();  // ← Instant update
```

---

## 📊 State Management Flow

```
User Clicks Join
    ↓
handleJoin(matchId)
    ↓
api.joinMatch(matchId)
    ↓
Backend: joinMatch()
    ↓
Validate & Create Registration
    ↓
$inc joinedPlayersCount
    ↓
Deduct Fee & Create Transaction
    ↓
Return Success
    ↓
Frontend: loadMatches()  ← Auto-refresh
    ↓
API: listMatches()
    ↓
Response includes updated joinedPlayersCount
    ↓
setMatches(newMatches)
    ↓
PlayerCountBar re-renders with new count
```

---

## 🔒 Data Integrity Features

### 1. Unique Constraint
```javascript
registrationSchema.index({ user: 1, match: 1 }, { unique: true });
```
- Prevents duplicate registrations at DB level
- Handles race conditions

### 2. Transaction-Based Updates
```javascript
await session.withTransaction(async () => {
  // All operations atomic
  // Rollback if any fail
  // Count always accurate
});
```

### 3. Atomic Increment
```javascript
{ $inc: { joinedPlayersCount: 1 } }
```
- Single operation, no race conditions
- Consistent across concurrent requests

### 4. Session Lock
```javascript
.session(session)  // Locks document during transaction
```
- Prevents dirty reads
- Ensures isolation

---

## 🚀 Performance Considerations

### Queries
- `GET /tournaments` - Indexed by startTime, no N+1 queries
- Count calculated from existing joinedPlayersCount field
- No additional database queries needed

### Optimization
- Pagination limits results (max 50 per page)
- Serialization happens in memory
- No blocking operations

### Caching (Optional Enhancement)
```javascript
// Could add Redis caching:
const cacheKey = `match:${matchId}:count`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Update cache after increment
await redis.setex(cacheKey, 300, JSON.stringify(match));
```

---

## 🧪 Testing Scenarios

### Unit Test: joinMatch Count Increment
```javascript
test('should increment joinedPlayersCount on successful join', async () => {
  const match = await Match.create({ maxPlayers: 10, joinedPlayersCount: 0 });
  
  // Join match
  await api.post(`/tournaments/${match._id}/join`);
  
  // Verify count
  const updated = await Match.findById(match._id);
  expect(updated.joinedPlayersCount).toBe(1);
});
```

### Integration Test: Full Tournament
```javascript
test('should prevent join when tournament full', async () => {
  const match = await Match.create({ 
    maxPlayers: 2, 
    joinedPlayersCount: 2 
  });
  
  const res = await api.post(`/tournaments/${match._id}/join`);
  
  expect(res.status).toBe(400);
  expect(res.body.message).toContain('full');
});
```

### E2E Test: User Journey
```javascript
test('should show updated count after join', async () => {
  // 1. Load tournament page
  // 2. Verify count shows "Joined: 0/100"
  // 3. Click Join
  // 4. Verify API call succeeds
  // 5. Verify count updates to "Joined: 1/100"
  // 6. Verify progress bar fills to 1%
});
```

---

## 📈 Analytics Potential

With this system, you can track:

```javascript
// Get tournament fill rate
const match = await Match.findById(matchId);
const fillRate = (match.joinedPlayersCount / match.maxPlayers) * 100;

// Get popular tournaments
const popular = await Match.find()
  .sort({ joinedPlayersCount: -1 })
  .limit(5);

// Get fill trends
const trends = await Match.aggregate([
  {
    $project: {
      title: 1,
      fillPercentage: {
        $multiply: [
          { $divide: ['$joinedPlayersCount', '$maxPlayers'] },
          100
        ]
      }
    }
  }
]);

// Alert when tournament almost full
const almostFull = await Match.find({
  $expr: {
    $lte: [
      { $subtract: ['$maxPlayers', '$joinedPlayersCount'] },
      5  // Less than 5 slots left
    ]
  }
});
```

---

## 🔄 Maintenance & Monitoring

### Health Check: Count Accuracy
```javascript
const verifyCountAccuracy = async () => {
  const matches = await Match.find();
  
  for (const match of matches) {
    const registrationCount = await Registration.countDocuments({ 
      match: match._id 
    });
    
    if (registrationCount !== match.joinedPlayersCount) {
      console.warn(`Mismatch for ${match._id}: 
        DB count: ${registrationCount}, 
        joinedPlayersCount: ${match.joinedPlayersCount}`
      );
      
      // Auto-fix
      match.joinedPlayersCount = registrationCount;
      await match.save();
    }
  }
};
```

### Monitor Join Errors
```javascript
// Log all join errors for debugging
app.post('/api/tournaments/:matchId/join', 
  async (req, res) => {
    try {
      // ... join logic
    } catch (error) {
      logger.error('Join failed', {
        matchId: req.params.matchId,
        userId: req.user._id,
        error: error.message
      });
    }
  }
);
```

---

## 📚 Related Documentation

- [Joined Players Count System](./JOINED_PLAYERS_COUNT_SYSTEM.md)
- [Quick Start Guide](./QUICK_START_JOINED_COUNT.md)
- [MongoDB Schema Reference](./server/src/models/Match.js)
- [Tournament Controller](./server/src/controllers/tournamentController.js)
- [Frontend Component](./client/src/components/PlayerCountBar.jsx)
