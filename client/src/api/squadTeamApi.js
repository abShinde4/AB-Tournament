import { API_BASE_URL, formatFetchError } from "../utils/apiConfig";

const getToken = () => localStorage.getItem("ab_token");

const squadRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/squad-teams${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(formatFetchError(error, `/squad-teams${endpoint}`), { cause: error });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Squad team request failed");
  }
  return data;
};

export const squadTeamApi = {
  createTeam: (payload) =>
    squadRequest("/create", { method: "POST", body: JSON.stringify(payload) }),
  joinTeam: (payload) =>
    squadRequest("/join", { method: "POST", body: JSON.stringify(payload) }),
  updateTeam: (teamId, payload) =>
    squadRequest(`/${teamId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  kickPlayer: (teamId, userId) =>
    squadRequest(`/${teamId}/players/${userId}`, { method: "DELETE" }),
  getMyTeam: (tournamentId) => squadRequest(`/my/${tournamentId}`),
  getTournamentStats: (tournamentId) => squadRequest(`/tournament/${tournamentId}/stats`),
  getInvite: (teamId) => squadRequest(`/${teamId}/invite`),
  getSquadResults: (params = "") => squadRequest(`/results/list${params ? `?${params}` : ""}`),
  adminListTeams: (params = "") => squadRequest(`/admin/list${params ? `?${params}` : ""}`),
  adminGetTeam: (teamId) => squadRequest(`/admin/${teamId}`),
  adminOverview: () => squadRequest("/admin/overview"),
  publishSquadResults: (payload) =>
    squadRequest("/admin/results/publish", { method: "POST", body: JSON.stringify(payload) }),
};
