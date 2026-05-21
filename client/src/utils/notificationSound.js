const SOUND_URL = "/sounds/notification.mp3";
const MIN_PLAY_INTERVAL_MS = 2500;
const seenStorageKey = (userId) =>
  userId ? `ab_seen_notification_ids_${userId}` : "ab_seen_notification_ids";

let audioInstance = null;
let lastPlayedAt = 0;
let audioUnlocked = false;

export const loadSeenNotificationIds = (userId) => {
  try {
    const raw = sessionStorage.getItem(seenStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

export const saveSeenNotificationIds = (ids, userId) => {
  try {
    sessionStorage.setItem(seenStorageKey(userId), JSON.stringify([...ids]));
  } catch {
    // ignore quota / private mode
  }
};

const getAudio = () => {
  if (!audioInstance) {
    audioInstance = new Audio(SOUND_URL);
    audioInstance.preload = "auto";
  }
  return audioInstance;
};

/** Unlock audio output after a user gesture (required on many mobile browsers). */
export const unlockNotificationAudio = () => {
  if (audioUnlocked) return;
  const audio = getAudio();
  const previousVolume = audio.volume;
  audio.volume = 0.001;
  const playAttempt = audio.play();
  if (!playAttempt) {
    audioUnlocked = true;
    audio.volume = previousVolume;
    return;
  }
  playAttempt
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = previousVolume;
      audioUnlocked = true;
    })
    .catch(() => {
      audio.volume = previousVolume;
    });
};

export const playNotificationSound = async () => {
  const now = Date.now();
  if (now - lastPlayedAt < MIN_PLAY_INTERVAL_MS) return false;

  const audio = getAudio();
  audio.currentTime = 0;

  try {
    await audio.play();
    lastPlayedAt = now;
    return true;
  } catch {
    return false;
  }
};
