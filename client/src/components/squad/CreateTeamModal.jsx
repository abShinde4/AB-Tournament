import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api";
import "./squad-team.css";

const CreateTeamModal = ({ isOpen, match, user, onClose, onSuccess }) => {
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    teamName: "",
    teamPassword: "",
    leaderBgmiUid: user?.bgmiUid || "",
    leaderWhatsapp: user?.whatsappNumber || user?.phoneNumber || "",
  });
  const [result, setResult] = useState(null);

  if (!isOpen || !match) return null;

  const entryFee = match.entryFee || 20;
  const walletBalance = user?.walletBalance ?? 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!form.teamName.trim() || !form.teamPassword.trim() || !form.leaderBgmiUid.trim() || !form.leaderWhatsapp.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (form.teamPassword.length < 4) {
      toast.error("Team password must be at least 4 characters.");
      return;
    }
    setStep("payment");
  };

  const handlePayAndCreate = async () => {
    if (walletBalance < entryFee) {
      toast.error("Please add wallet balance before creating a squad.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.createTeam({
        tournamentId: match._id,
        teamName: form.teamName.trim(),
        teamPassword: form.teamPassword,
        leaderBgmiUid: form.leaderBgmiUid.trim(),
        leaderWhatsapp: form.leaderWhatsapp.trim(),
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
        <h3>Create Squad Team</h3>

        {step === "form" && (
          <form onSubmit={handleContinue}>
            <div className="form-group">
              <label>Team Name *</label>
              <input name="teamName" value={form.teamName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Team Password *</label>
              <input
                name="teamPassword"
                type="password"
                value={form.teamPassword}
                onChange={handleChange}
                placeholder="Share with teammates to join"
                required
              />
            </div>
            <div className="form-group">
              <label>BGMI UID *</label>
              <input name="leaderBgmiUid" value={form.leaderBgmiUid} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>WhatsApp Number *</label>
              <input
                name="leaderWhatsapp"
                value={form.leaderWhatsapp}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="10-digit number"
                required
              />
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
            <p className="v2-muted">Only the team leader pays the squad entry fee.</p>
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
            <p className="v2-muted">Share Team ID and password with your squad members.</p>
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
