import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api";
import "./squad-team.css";

const SquadResultsPublish = ({ squadMatches = [], onPublished }) => {
  const [matchId, setMatchId] = useState("");
  const [rows, setRows] = useState([{ teamId: "", kills: 0, winnings: 0 }]);
  const [loading, setLoading] = useState(false);

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, { teamId: "", kills: 0, winnings: 0 }]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!matchId) {
      toast.error("Select a squad match.");
      return;
    }
    const teams = rows
      .filter((r) => r.teamId.trim())
      .map((r) => ({
        teamId: r.teamId.trim().toUpperCase(),
        kills: Number(r.kills) || 0,
        winnings: Number(r.winnings) || 0,
      }));
    if (!teams.length) {
      toast.error("Add at least one team result.");
      return;
    }
    setLoading(true);
    try {
      await api.publishSquadResults({ matchId, teams });
      toast.success("Squad results published");
      onPublished?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!squadMatches.length) return null;

  return (
    <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,107,53,0.2)" }}>
      <h4>Publish Squad Team Results</h4>
      <form onSubmit={handlePublish}>
        <div className="form-group">
          <label>Squad Match</label>
          <select value={matchId} onChange={(e) => setMatchId(e.target.value)} required>
            <option value="">Select match</option>
            {squadMatches.map((m) => (
              <option key={m._id} value={m._id}>{m.title}</option>
            ))}
          </select>
        </div>
        {rows.map((row, index) => (
          <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Team ID (AB-SQ-0001)"
              value={row.teamId}
              onChange={(e) => updateRow(index, "teamId", e.target.value)}
            />
            <input
              type="number"
              placeholder="Kills"
              value={row.kills}
              onChange={(e) => updateRow(index, "kills", e.target.value)}
            />
            <input
              type="number"
              placeholder="Winnings ₹"
              value={row.winnings}
              onChange={(e) => updateRow(index, "winnings", e.target.value)}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={addRow}>Add Team Row</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Publishing..." : "Publish Squad Results"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SquadResultsPublish;
