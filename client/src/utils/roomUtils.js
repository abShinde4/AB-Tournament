/**
 * Room system utility functions
 * Handles room logic on the frontend
 */

/**
 * Check if room is unlocked and accessible
 */
import { API_BASE_URL, formatFetchError } from "./apiConfig";

export const isRoomUnlocked = (matchDetails) => {
  if (!matchDetails || !matchDetails.isRoomPublished) return false;

  const now = Date.now();
  const unlockTime = matchDetails.roomUnlockedAt 
    ? new Date(matchDetails.roomUnlockedAt).getTime() 
    : null;

  return unlockTime && now >= unlockTime;
};

/**
 * Get room unlock time in milliseconds from now
 * Returns -1 if already unlocked, null if no unlock time
 */
export const getTimeUntilUnlock = (matchDetails) => {
  if (!matchDetails || !matchDetails.roomUnlockedAt) return null;

  const now = Date.now();
  const unlockTime = new Date(matchDetails.roomUnlockedAt).getTime();
  const diff = unlockTime - now;

  if (diff <= 0) return -1; // Already unlocked
  return diff;
};

/**
 * Format time difference as readable string
 * e.g., "5 minutes, 30 seconds"
 */
export const formatTimeUntilUnlock = (timeDiff) => {
  if (timeDiff === null || timeDiff === undefined) return null;
  if (timeDiff < 0) return 'Room is now available';

  const totalSeconds = Math.floor(timeDiff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

  return parts.join(', ');
};

/**
 * API call to fetch match details with room info
 */
export const fetchMatchDetails = async (matchId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/details`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // eslint-disable-next-line no-console
    console.log("Response:", response);

    if (!response.ok) {
      throw new Error(`Failed to fetch match details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("API URL:", API_BASE_URL);
    // eslint-disable-next-line no-console
    console.log("Error:", error);
    console.error("Error fetching match details:", formatFetchError(error, `/matches/${matchId}/details`));
    return null;
  }
};

/**
 * API call for admin to publish room
 */
export const publishRoom = async (matchId, roomId, roomPassword, token) => {
  const authToken = token || localStorage.getItem("ab_token");
  if (!authToken) {
    throw new Error("Missing authentication token. Please login again.");
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/admin/publish-room/${matchId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId: roomId.trim(),
      roomPassword: roomPassword.trim(),
    }),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("API URL:", API_BASE_URL);
    // eslint-disable-next-line no-console
    console.log("Error:", error);
    throw new Error(formatFetchError(error, `/admin/publish-room/${matchId}`));
  }

  // eslint-disable-next-line no-console
  console.log("Response:", response);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || `Failed to publish room: ${response.status}`;
    throw new Error(message);
  }

  return data;
};

export default {
  isRoomUnlocked,
  getTimeUntilUnlock,
  formatTimeUntilUnlock,
  fetchMatchDetails,
  publishRoom,
};
