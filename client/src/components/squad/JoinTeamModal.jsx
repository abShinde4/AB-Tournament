import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api";
import "./squad-team.css";

const JoinTeamModal = ({ isOpen, match, onClose, onSuccess }) => {
  const [form, setForm] = useState({ teamId: "", teamPassword: "", bgmiUid: "" });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !match) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.teamId.trim() || !form.teamPassword.trim() || !form.bgmiUid.trim()) {
      toast.error("Team ID, password, and BGMI UID are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.joinTeam({
        teamId: form.teamId.trim().toUpperCase(),
        teamPassword: form.teamPassword,
        bgmiUid: form.bgmiUid.trim(),
        tournamentId: match._id,
      });
      toast.success("Joined squad team successfully!");
      onSuccess?.(res.team);
      onClose();
      setForm({ teamId: "", teamPassword: "", bgmiUid: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="squad-modal-backdrop" onClick={onClose}>
      <div className="squad-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Join Team</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team ID *</label>
            <input
              value={form.teamId}
              onChange={(e) => setForm((p) => ({ ...p, teamId: e.target.value }))}
              placeholder="AB-SQ-0001"
              required
            />
          </div>
          <div className="form-group">
            <label>Team Password *</label>
            <input
              type="password"
              value={form.teamPassword}
              onChange={(e) => setForm((p) => ({ ...p, teamPassword: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>BGMI UID *</label>
            <input
              value={form.bgmiUid}
              onChange={(e) => setForm((p) => ({ ...p, bgmiUid: e.target.value }))}
              required
            />
          </div>
          <div className="squad-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinTeamModal;
