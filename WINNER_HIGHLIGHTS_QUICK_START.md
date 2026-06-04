# Winner Highlights - Quick Reference for Admins

## Quick Start (30 seconds)

### Step 1: Publish Results
1. Go to **Admin Dashboard**
2. Create/select a tournament match
3. Go to **Publish Results** section
4. Add winners and click **Publish**

### Step 2: Add Winner Highlight
1. Find **Winner Highlights** section in admin panel
2. Click **➕ Add Winner Highlight** button
3. Fill the form:
   - Select a winner (from published results)
   - Enter winner display name
   - Enter team name
   - Enter prize amount
   - Select match type (Solo/Duo/Squad/etc)
   - Enter map name (Erangel/Miramar/etc)
   - **Paste YouTube Shorts URL** (required)
   - (Optional) Paste Instagram Reel URL
   - (Optional) Paste custom thumbnail URL
4. Click **Save Highlight**

### Step 3: View on Results Page
1. Go to **Results** page (public page)
2. See **🏆 Winner Highlights** section at top
3. Highlight appears as card with thumbnail
4. Users can click card to watch

---

## Getting YouTube Shorts URLs

### How to Find
1. Open YouTube
2. Search for gaming highlights
3. Click on a Shorts video
4. Copy the URL from browser address bar

### Valid URL Formats

✅ **YouTube Shorts URLs** (any of these work):
```
https://youtube.com/shorts/dQw4w9WgXcQ
https://www.youtube.com/shorts/dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
https://youtube.com/watch?v=dQw4w9WgXcQ
```

### Getting Video ID
- **Shorts URL**: ID is after `/shorts/` → `dQw4w9WgXcQ`
- **Regular URL**: ID after `v=` parameter → `dQw4w9WgXcQ`
- **Short URL**: ID after `/` → `dQw4w9WgXcQ`

### YouTube Thumbnail
Thumbnail auto-generates! No need to provide custom one.
- Large: `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg`
- Standard: `https://img.youtube.com/vi/{VIDEO_ID}/sddefault.jpg`

---

## Getting Instagram Reels URLs

### How to Find
1. Open Instagram
2. Go to a profile
3. Find a Reel
4. Tap "..." (three dots)
5. Tap "Share"
6. Copy link

### Valid URL Format

✅ **Instagram Reels URLs**:
```
https://instagram.com/reel/ABC123DEF456/
https://www.instagram.com/reel/ABC123DEF456/
```

### Instagram Requirements
- Account must be **public** (private won't work)
- Reel must be **public** (not archived)
- User must have permission to share

---

## Form Guide

### Required Fields

| Field | Example | Note |
|-------|---------|------|
| Winner | Select from dropdown | Must be published result |
| Winner Name | "Shreyash" or "SOUMENDRA" | Display name for card |
| Team Name | "Phoenix Squad" | Team name if applicable |
| Prize Amount | 5000 | In rupees (₹) |
| Match Type | Squad | Solo, Duo, Squad, TDM, Arena, Custom |
| Map | Erangel | Game map name |
| YouTube URL | https://youtube.com/shorts/... | At least YouTube OR Instagram |

### Optional Fields

| Field | Example | Note |
|-------|---------|------|
| Instagram URL | https://instagram.com/reel/... | Supports Reels only |
| Thumbnail URL | https://example.com/thumb.jpg | If not provided, YouTube auto-generates |

### Validation Rules

❌ **Will be rejected if**:
- No winner selected
- Winner name is blank
- Team name is blank
- Prize amount is 0 or blank
- Match type is blank
- Map is blank
- **Both YouTube AND Instagram URLs are blank**
- URL format is invalid

---

## Common Issues & Solutions

### Issue: "Invalid YouTube URL"

**Cause**: Wrong URL format

**Solution**:
1. Go to YouTube
2. Open the Shorts video
3. Copy URL from address bar (make sure it says "youtube.com" or "youtu.be")
4. Paste directly into form

**Example**:
- ❌ Wrong: `youtube.com/watch?v=abcabc` (not Shorts)
- ✅ Correct: `youtube.com/shorts/abcabc`

---

### Issue: "Invalid Instagram URL"

**Cause**: 
- Wrong URL format
- Account is private
- Reel is archived

**Solution**:
1. Check account is **public**
2. Check Reel is **visible**
3. Get fresh URL by sharing
4. Paste in format: `instagram.com/reel/{ID}/`

---

### Issue: "At least one URL required"

**Cause**: Both YouTube and Instagram URLs are empty

**Solution**:
- Add YouTube Shorts URL (easier, auto-thumbnail)
- OR add Instagram Reel URL (for Instagram users)
- OR add both!

---

### Issue: Thumbnail not showing

**Cause**: Custom thumbnail URL is broken

**Solution**:
1. Leave thumbnail field empty
2. Use YouTube URL (auto-generates from video)
3. OR check image URL is publicly accessible

---

### Issue: Highlight not appearing on Results page

**Cause**: 
- Result not published yet
- Highlight not saved
- Filter/pagination issue

**Solution**:
1. Check result is published first
2. Verify admin form showed success message
3. Refresh Results page (F5)
4. Check other pages if paginated

---

## Best Practices

### Naming
- **Winner Name**: Use player's IGN (in-game name)
  - ✅ Good: "Shreyash", "SOUMENDRA", "Gamerz91"
  - ❌ Bad: "Player 1", "ABC", "xyz123"

- **Team Name**: Use actual team name or squad
  - ✅ Good: "Phoenix Squad", "Elite Forces", "Solo Win"
  - ❌ Bad: "Team", "Group", "Players"

### URLs
- **YouTube**: Always prefer Shorts for mobile users
- **Instagram**: Only add if account is verified/famous
- **Thumbnail**: Only add if YouTube URL is unavailable

### Timing
- Add highlights **right after results published**
- Update with best videos **within 24 hours**
- Delete old/irrelevant highlights **regularly**

---

## URL Examples

### YouTube Shorts
```
https://youtube.com/shorts/dQw4w9WgXcQ?t=1
https://www.youtube.com/shorts/AbCdEfGhIjK?si=XyZ123
```

### Instagram Reels
```
https://instagram.com/reel/CvB7xZhB8qN/
https://www.instagram.com/reel/CuA5xZhA7pM/?utm_source=ig_web_copy_link
```

### Thumbnail (PNG/JPG)
```
https://example.com/images/thumbnail.jpg
https://cdn.example.com/gaming/highlight-thumb.png
https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg
```

---

## Statistics Tracked

When you add a highlight, we track:

- 📊 **Views**: Increments each time someone opens modal
- 📅 **Created**: When admin added the highlight
- 📝 **Match Info**: Which tournament/match
- 👤 **Winner**: Which player
- 🎮 **Game Type**: Solo/Duo/Squad/TDM/Arena
- 🗺️ **Map**: Which map was played
- 💰 **Prize**: Amount won

---

## Keyboard Shortcuts

- **Tab**: Move between form fields
- **Enter**: Submit form
- **Escape**: Close modal (when viewing highlight)
- **Spacebar**: Play/pause YouTube (when embedded)

---

## Mobile Admin Access

To add highlights on phone:

1. Login to admin panel on mobile
2. Scroll down to **Winner Highlights**
3. Tap **➕ Add Winner Highlight**
4. Form is mobile-responsive
5. Enter details on mobile keyboard
6. Tap **Save Highlight**

Works on:
- ✅ iPhone (Safari)
- ✅ Android (Chrome)
- ✅ iPad
- ✅ Any mobile browser

---

## Permissions

- **Admin**: ✅ Create, Edit, Delete highlights
- **Non-Admin**: ❌ Cannot create (admin-only)
- **Everyone**: ✅ Can view highlights on Results page

---

## Data Privacy

Highlights are:
- ✅ Stored in MongoDB (encrypted)
- ✅ Displayed publicly on Results page
- ✅ No personal data collected
- ✅ Can be deleted anytime

---

## FAQ

### Q: Can users add highlights?
A: No, only admins. Users can only view.

### Q: Can I edit after creating?
A: Select same winner again and update form (auto-updates).

### Q: Do videos upload to server?
A: No! Only URLs stored. Videos stay on YouTube/Instagram.

### Q: How many highlights can I add?
A: Unlimited! No storage concerns.

### Q: Are YouTube Shorts free?
A: Yes, free to use and embed (if public).

### Q: Can I use Instagram if private?
A: No, account must be public.

### Q: How long until highlight appears?
A: Instantly after saving!

### Q: Can I schedule highlights for later?
A: Not yet. Post immediately when published.

### Q: What if video gets deleted?
A: Link will break. Update URL or delete highlight.

### Q: How many users can view one highlight?
A: Unlimited! It's just a link.

### Q: Can I download highlights?
A: They stay on YouTube/Instagram. Just linking.

---

## Support

If you run into issues:

1. **Check URL format** - Copy directly from YouTube/Instagram
2. **Check form validation** - All required fields filled
3. **Check winner published** - Results must be published first
4. **Refresh page** - Sometimes cache issues
5. **Check console** - Browser F12 → Console tab for errors

Contact developers if issues persist!

---

## Checklist

Before adding a highlight:

- [ ] Results published for that match
- [ ] Winner's YouTube Shorts video ready
- [ ] Winner name finalized
- [ ] Team name ready
- [ ] Prize amount confirmed
- [ ] Match type correct
- [ ] Map name correct

---

**Status**: Ready to Use  
**Last Updated**: 2024-06-04
