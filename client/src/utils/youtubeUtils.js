const YOUTUBE_VIDEO_ID_REGEX = /^[\w-]{11}$/;

const sanitizeVideoId = (id) => {
  if (!id) return null;
  const cleaned = id.split("?")[0].split("&")[0].split("/")[0].trim();
  return YOUTUBE_VIDEO_ID_REGEX.test(cleaned) ? cleaned : null;
};

export const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname;

    if (host === "youtu.be") {
      return sanitizeVideoId(path.slice(1));
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (path.startsWith("/shorts/")) {
        return sanitizeVideoId(path.split("/shorts/")[1]);
      }
      if (path.startsWith("/embed/")) {
        return sanitizeVideoId(path.split("/embed/")[1]);
      }
      if (path === "/watch") {
        return sanitizeVideoId(parsed.searchParams.get("v"));
      }
    }
  } catch {
    // Fall through to regex extraction.
  }

  const regexPatterns = [
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/shorts\/([\w-]{11})/i,
    /youtube\.com\/embed\/([\w-]{11})/i,
    /[?&]v=([\w-]{11})/i,
  ];

  for (const pattern of regexPatterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return sanitizeVideoId(match[1]);
    }
  }

  return null;
};

export const getYouTubeEmbedUrl = (url) => {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

export const getYouTubeThumbnailUrl = (url) => {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};
