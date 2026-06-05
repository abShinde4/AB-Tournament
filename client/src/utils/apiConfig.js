export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const isApiUrlConfigured = Boolean(import.meta.env.VITE_API_URL);

export const formatFetchError = (error, endpoint = "") => {
  const message = error?.message || "Request failed";

  if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
    return "API URL Missing — set VITE_API_URL in Vercel and redeploy.";
  }

  if (message === "Failed to fetch" || error?.name === "TypeError") {
    const apiUrl = API_BASE_URL;

    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      apiUrl.startsWith("http://")
    ) {
      return "Mixed Content Error — production API URL must use HTTPS.";
    }

    if (endpoint) {
      return `Backend Offline or CORS Error — unable to reach ${apiUrl}${endpoint}`;
    }

    return "Backend Offline or CORS Error — unable to reach the API server.";
  }

  return message;
};
