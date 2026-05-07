import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/useAuth";

const WithdrawModal = ({ isOpen, onClose, existingPending, onSuccess }) => {
  const [amount, setAmount] = useState(30);
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser, user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (existingPending?.length) {
        toast.error("You already have a pending withdrawal.");
        return;
      }

      setLoading(true);
      const res = await api.withdraw({
        amount: Number(amount),
        upiId,
      });

      setUser((prev) => ({ ...prev, walletBalance: res.walletBalance }));
      toast.success("Withdraw request submitted.");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal card">
        <h3>Withdraw</h3>
        <p className="muted">Request money via UPI</p>

        <form onSubmit={submit}>
          <input
            type="number"
            min={30}
            max={50000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (min ₹30)"
            required
          />

          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="UPI ID (example: name@bank)"
            required
          />

          <div className="row">
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading || Boolean(existingPending?.length)}>
              {loading ? "Submitting..." : "Request Withdraw"}
            </button>
          </div>
          {user?.walletBalance < 30 && (
            <p className="state-text">Wallet balance is too low to withdraw.</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;

