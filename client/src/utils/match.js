export const getLiveStatus = (startTime, originalStatus = "Upcoming") => {
  if (originalStatus === "Completed") return "Completed";
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const liveWindowMs = 1000 * 60 * 45;
  if (now >= start + liveWindowMs) return "Completed";
  if (now >= start) return "Live";
  return "Upcoming";
};

export const getCountdown = (startTime) => {
  const diff = new Date(startTime).getTime() - Date.now();
  if (diff <= 0) return "Started";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${hours}h ${mins}m`;
};
