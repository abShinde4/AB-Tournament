import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api";
import SquadTeamInvite from "./SquadTeamInvite";
import "./squad-team.css";

const CreateTeamModal = ({ isOpen, match, user, onClose, onSuccess }) => {
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    teamName: "",
    leaderBgmiUid: user?.bgmiUid || "",
    leaderWhatsapp: "",
    teamLogo: "",
    teamDescription: "",
  });
  const [result, setResult] = useState(null);

  if (!isOpen || !match) return null;

  const entryFee = match.entryFee || 20;
  const walletBalance = user?.walletBalance ?? 0;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!form.teamName.trim() || !form.leaderBgmiUid.trim() || !form.leaderWhatsapp.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }
    setStep("payment");
  };

  const handlePayAndCreate = async () => {
    if (walletBalance < entryFee) {
      toast.error("Insufficient Wallet Balance");
      return;
    }
    setLoading(true);
    try {
      const res = await api.createTeam({
        tournamentId: match._id,
        teamName: form.teamName.trim(),
        leaderBgmiUid: form.leaderBgmiUid.trim(),
        leaderWhatsapp: form.leaderWhatsapp.trim(),
        teamLogo: form.teamLogo.trim(),
        teamDescription: form.teamDescription.trim(),
      });
      setResult(res);
      toast.success(`Team created! ID: ${res.team?.teamId}`);
      onSuccess?.(res);
      setStep("success");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setResult(null);
    onClose();
  };

  return (
    <div className="squad-modal-backdrop" onClick={handleClose}>
      <div className="squad-modal" onClick={(e) => e.stopPropagation()}>
        <h3>👑 Create Squad Team</h3>

        {step === "form" && (
          <form onSubmit={handleContinue}>
            <div className="form-group">
              <label>Team Name *</label>
              <input name="teamName" value={form.teamName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Team Leader Name</label>
              <input value={user?.username || ""} disabled />
            </div>
            <div className="form-group">
              <label>BGMI UID *</label>
              <input name="leaderBgmiUid" value={form.leaderBgmiUid} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>WhatsApp Number *</label>
              <input name="leaderWhatsapp" value={form.leaderWhatsapp} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Team Logo URL (optional)</label>
              <input name="teamLogo" value={form.teamLogo} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>Team Description (optional)</label>
              <textarea name="teamDescription" value={form.teamDescription} onChange={handleChange} rows={3} />
            </div>
            <div className="squad-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Continue</button>
            </div>
          </form>
        )}

        {step === "payment" && (
          <div>
            <p>Entry Fee: <strong>₹{entryFee}</strong></p>
            <p>Wallet Balance: <strong>₹{walletBalance}</strong></p>
            <p>Only the team leader pays the full squad entry fee.</p>
            <div className="squad-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep("form")}>Back</button>
              <button type="button" className="btn btn-primary" disabled={loading} onClick={handlePayAndCreate}>
                {loading ? "Processing..." : `Pay ₹${entryFee} & Create Team`}
              </button>
            </div>
          </div>
        )}

        {step === "success" && result && (
          <div>
            <p><strong>Team ID:</strong> {result.team?.teamId}</p>
            <p><strong>Team Name:</strong> {result.team?.teamName}</p>
            <SquadTeamInvite inviteMessage={result.inviteMessage} teamId={result.team?.teamId} />
            <div className="squad-modal-actions">
              <button type="button" className="btn btn-primary" onClick={handleClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTeamModal;
