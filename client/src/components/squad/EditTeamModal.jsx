import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api";
import "./squad-team.css";

const EditTeamModal = ({ isOpen, team, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    teamName: "",
    leaderBgmiUid: "",
    leaderWhatsapp: "",
    teamLogo: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !team) return;
    setForm({
      teamName: team.teamName || "",
      leaderBgmiUid: team.leaderBgmiUid || "",
      leaderWhatsapp: team.leaderWhatsapp || "",
      teamLogo: team.teamLogo || "",
    });
  }, [isOpen, team]);

  if (!isOpen || !team) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateTeam(team.teamId, form);
      toast.success("Team updated");
      onSuccess?.(res.team);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="squad-modal-backdrop" onClick={onClose}>
      <div className="squad-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Squad Team</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name</label>
            <input name="teamName" value={form.teamName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>BGMI UID</label>
            <input name="leaderBgmiUid" value={form.leaderBgmiUid} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>WhatsApp Number</label>
            <input name="leaderWhatsapp" value={form.leaderWhatsapp} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Team Logo URL</label>
            <input name="teamLogo" value={form.teamLogo} onChange={handleChange} />
          </div>
          <div className="squad-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;
