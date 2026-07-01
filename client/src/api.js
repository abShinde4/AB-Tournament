import { API_BASE_URL, formatFetchError } from "./utils/apiConfig";
import { squadTeamApi } from "./api/squadTeamApi";

const getToken = () => localStorage.getItem("ab_token");

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("API request failed:", API_BASE_URL, endpoint, error);
    }
    throw new Error(formatFetchError(error, endpoint));
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validationMessage = Array.isArray(data.errors)
      ? data.errors
          .map((item) => item.message)
          .filter(Boolean)
          .join(", ")
      : "";

    const statusHint =
      response.status >= 500
        ? "Database Error or server failure — check Render logs."
        : "";

    throw new Error(
      validationMessage || data.message || statusHint || `Request failed (${response.status})`
    );
  }
  return data;
};

export { API_BASE_URL };

export const api = {
  getMatches: (params = "") => request(`/matches${params ? `?${params}` : ""}`),
  joinMatch: (matchId) => request(`/tournaments/${matchId}/join`, { method: "POST" }),
  getMyMatchJoinRequests: () => request("/tournaments/join-requests/my"),
  getDashboard: () => request("/tournaments/dashboard/me"),
  getResults: (params = "") => request(`/results${params ? `?${params}` : ""}`),
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  updateMe: (payload) =>
    request("/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return request("/user/upload-avatar", { method: "POST", body: form });
  },
  addMoney: (payload) =>
    request("/wallet/add-money", { method: "POST", body: JSON.stringify(payload) }),
  getPaymentLinks: () => request("/payments/links"),
  // Wallet payment requests (manual UPI top-ups)
  createWalletPaymentRequest: (payload) =>
    request("/wallet/requests", {
      method: "POST",
      body: JSON.stringify({ utr: payload.utr, amount: payload.amount }),
    }),
  getMyWalletPaymentRequests: () => request("/wallet/requests/my"),
  submitTournamentPayment: (tournamentId, { utr, screenshot }) => {
    const form = new FormData();
    form.append("utr", utr);
    if (screenshot) form.append("paymentScreenshot", screenshot);
    return request(`/payments/tournament/${tournamentId}/submit`, { method: "POST", body: form });
  },
  getMyTournamentPayments: () => request("/payments/my"),
  getTransactions: (params = "") =>
    request(`/wallet/transactions${params ? `?${params}` : ""}`),
  withdraw: (payload) => request("/wallet/withdraw", { method: "POST", body: JSON.stringify(payload) }),
  getWithdrawals: (params = "") =>
    request(`/wallet/withdrawals${params ? `?${params}` : ""}`),
  getLeaderboard: (params = "") => request(`/leaderboard${params ? `?${params}` : ""}`),
  getNotifications: (params = "") =>
    request(`/notifications${params ? `?${params}` : ""}`),
  markNotificationRead: (notificationId) =>
    request(`/notifications/${notificationId}/read`, { method: "PATCH" }),
  sendNotification: (payload) =>
    request("/notifications/send", { method: "POST", body: JSON.stringify(payload) }),
  getAdminStats: () => request("/admin/stats"),
  getAdminUsers: (params = "") => request(`/admin/users${params ? `?${params}` : ""}`),
  getAdminLegacyUsers: (params = "") => request(`/admin/legacy-users${params ? `?${params}` : ""}`),
  assignUserPhone: (userId, phoneNumber) =>
    request(`/admin/users/${userId}/phone`, {
      method: "PATCH",
      body: JSON.stringify({ phoneNumber }),
    }),
  resetUserPassword: (userId, password) =>
    request(`/admin/users/${userId}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    }),
  deactivateUser: (userId) =>
    request(`/admin/users/${userId}/deactivate`, { method: "PATCH" }),
  getAdminRegistrations: (params = "") =>
    request(`/admin/registrations${params ? `?${params}` : ""}`),
  verifyAdminPlayer: (registrationId, payload = {}) =>
    request(`/admin/verify-player/${registrationId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  markAdminPlayerSuspicious: (registrationId, payload = {}) =>
    request(`/admin/mark-suspicious/${registrationId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getAdminWalletOverview: () => request("/admin/wallet-overview"),
  getAdminWithdrawRequests: (params = "") =>
    request(`/admin/withdraw-requests${params ? `?${params}` : ""}`),
  approveWithdrawRequest: (id) =>
    request(`/admin/withdraw-approve/${id}`, { method: "PUT" }),
  rejectWithdrawRequest: (id) =>
    request(`/admin/withdraw-reject/${id}`, { method: "PUT" }),
  getAdminPaymentRequests: (params = "") =>
    request(`/admin/payment-requests${params ? `?${params}` : ""}`),
  getAdminWalletPaymentRequests: (params = "") =>
    request(`/admin/wallet-payment-requests${params ? `?${params}` : ""}`),
  approvePaymentRequest: (id) =>
    request(`/admin/payment-approve/${id}`, { method: "PUT" }),
  rejectPaymentRequest: (id, payload = {}) =>
    request(`/admin/payment-reject/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  approveWalletPaymentRequest: (id) => request(`/admin/wallet-payment-approve/${id}`, { method: "PUT" }),
  rejectWalletPaymentRequest: (id, payload = {}) =>
    request(`/admin/wallet-payment-reject/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  getAdminMatchJoinRequests: (params = "") =>
    request(`/admin/match-join-requests${params ? `?${params}` : ""}`),
  approveMatchJoinRequest: (id) => request(`/admin/match-join-approve/${id}`, { method: "PUT" }),
  rejectMatchJoinRequest: (id, payload = {}) =>
    request(`/admin/match-join-reject/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  refreshMe: () => request("/auth/me"),
  getActiveAnnouncements: () => request("/announcements/active"),
  createAnnouncement: (payload) =>
    request("/announcements", { method: "POST", body: JSON.stringify(payload) }),
  deactivateAnnouncement: (id) =>
    request(`/announcements/${id}/deactivate`, { method: "PATCH" }),
  getAdminAnnouncements: () => request("/announcements"),
  getLicenseEligibility: () => request("/licenses/eligibility"),
  getMyLicense: () => request("/licenses/me"),
  claimLicense: () => request("/licenses/claim", { method: "POST" }),
  verifyLicense: (licenseId, token) => {
    if (licenseId) return request(`/licenses/verify/${encodeURIComponent(licenseId)}`);
    return request(`/licenses/verify?token=${encodeURIComponent(token)}`);
  },
  getAdminLicenses: (params = "") => request(`/licenses/admin/list${params ? `?${params}` : ""}`),
  searchAdminLicenseUsers: (q) => request(`/licenses/admin/search-users?q=${encodeURIComponent(q)}`),
  getAdminLicenseConfig: () => request("/licenses/admin/config"),
  updateAdminLicenseConfig: (payload) =>
    request("/licenses/admin/config", { method: "PATCH", body: JSON.stringify(payload) }),
  adminIssueLicense: (payload) =>
    request("/licenses/admin/issue", { method: "POST", body: JSON.stringify(payload) }),
  adminUpdateLicense: (id, payload) =>
    request(`/licenses/admin/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  createMatch: (payload) =>
    request("/tournaments", { method: "POST", body: JSON.stringify(payload) }),
  updateMatch: (matchId, payload) =>
    request(`/tournaments/${matchId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteMatch: (matchId) => request(`/tournaments/${matchId}`, { method: "DELETE" }),
  publishResults: (payload) =>
    request("/results", { method: "POST", body: JSON.stringify(payload) }),
  publishAdminResults: (payload) =>
    request("/admin/publish-results", { method: "POST", body: JSON.stringify(payload) }),
  // Winner Highlights
  getHighlights: (params = "") =>
    request(`/highlights${params ? `?${params}` : ""}`),
  getMatchHighlights: (matchId, params = "") =>
    request(`/highlights/match/${matchId}${params ? `?${params}` : ""}`),
  getUserHighlights: (userId, params = "") =>
    request(`/highlights/user/${userId}${params ? `?${params}` : ""}`),
  getHighlight: (highlightId) => request(`/highlights/${highlightId}`),
  createUpdateHighlight: (payload) =>
    request("/highlights", { method: "POST", body: JSON.stringify(payload) }),
  deleteHighlight: (highlightId) =>
    request(`/highlights/${highlightId}`, { method: "DELETE" }),
  ...squadTeamApi,
};
