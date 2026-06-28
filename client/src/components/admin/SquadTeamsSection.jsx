import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api";
import SquadTeamCard from "./SquadTeamCard";
import SquadResultsPublish from "../squad/SquadResultsPublish";
import "../squad/squad-team.css";

const SquadTeamsSection = ({ matches = [] }) => {
  const [teams, setTeams] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    tournamentId: "",
  });

  const squadMatches = matches.filter((m) => m.matchType === "Squad");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });
      if (filters.search) params.set("search", filters.search);
      if (filters.status !== "ALL") params.set("status", filters.status);
      if (filters.tournamentId) params.set("tournamentId", filters.tournamentId);

      const [listRes, overviewRes] = await Promise.all([
        api.adminListTeams(params.toString()),
        api.adminOverview(),
      ]);
      setTeams(listRes.data || []);
      setPagination(listRes.pagination || { totalPages: 1 });
      setOverview(overviewRes);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTeams();
  }, [loadTeams]);

  return (
    <section className="card admin-section">
      <h3>Squad Teams</h3>
      {overview && (
        <p style={{ color: "#c0c0c0" }}>
          Total: {overview.totalTeams} | 🟢 Ready: {overview.readyTeams} | 🟡 Waiting: {overview.waitingTeams}
        </p>
      )}

      <div className="admin-squad-search-row">
        <input
          placeholder="Search Team ID, Name, Leader, WhatsApp"
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
        >
          <option value="ALL">All Status</option>
          <option value="READY">🟢 READY</option>
          <option value="WAITING">🟡 WAITING</option>
          <option value="LOCKED">🔒 LOCKED</option>
        </select>
        <select
          value={filters.tournamentId}
          onChange={(e) => setFilters((p) => ({ ...p, tournamentId: e.target.value }))}
        >
          <option value="">All Squad Matches</option>
          {squadMatches.map((m) => (
            <option key={m._id} value={m._id}>{m.title}</option>
          ))}
        </select>
        <button type="button" className="btn btn-secondary" onClick={() => { setPage(1); loadTeams(); }}>
          Search
        </button>
      </div>

      {loading && <p>Loading squad teams...</p>}
      {!loading && teams.length === 0 && <p>No squad teams found.</p>}

      <div className="admin-squad-grid">
        {teams.map((team) => (
          <SquadTeamCard
            key={team._id}
            team={team}
            expanded={expandedId === team._id}
            onToggle={() => setExpandedId((prev) => (prev === team._id ? null : team._id))}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span style={{ alignSelf: "center" }}>Page {page} / {pagination.totalPages || 1}</span>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={page >= (pagination.totalPages || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      <SquadResultsPublish squadMatches={squadMatches} onPublished={loadTeams} />
    </section>
  );
};

export default SquadTeamsSection;
