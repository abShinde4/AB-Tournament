import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";

const WalletRequestForm = ({ defaultAmount = 100, onSuccess, onClose }) => {
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState(defaultAmount);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!utr.trim()) return toast.error("Please enter UTR");
    if (!amount || Number(amount) <= 0) return toast.error("Amount must be > 0");
    setSubmitting(true);
    try {
      await api.createWalletPaymentRequest({
        utr: utr.trim(),
        amount: Number(amount),
      });
      toast.success("Payment Submitted");
      setUtr("");
      await onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg = err.message || "Failed to submit request";
      if (msg.toLowerCase().includes("utr")) {
        toast.error("Duplicate UTR — this transaction ID was already used.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="publisher-form" onSubmit={submit} style={{ marginTop: 12 }}>
      <div className="form-group">
        <label>Amount (INR)</label>
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Enter UTR / Transaction ID</label>
        <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 012020675896" required />
        <p className="phonepe-receipt-note phonepe-receipt-note--inline">
          Use the UTR shown in your PhonePe payment receipt
        </p>
      </div>
      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Payment"}
        </button>
      </div>
    </form>
  );
};

export default WalletRequestForm;
