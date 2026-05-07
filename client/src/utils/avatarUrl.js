export const buildAvatarUrl = (avatar) => {
  if (!avatar) return "";

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = apiBase.replace(/\/api\/?$/, "");

  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }

  const normalized = avatar.replace(/\\/g, "/");
  const uploadsIndex = normalized.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return `${baseUrl}${normalized.slice(uploadsIndex)}`;
  }

  if (normalized.startsWith("/")) {
    return `${baseUrl}${normalized}`;
  }

  return `${baseUrl}/${normalized}`;
};
