import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api";
import { DEFAULT_UPI_ID } from "../utils/upi";
import UpiPaymentPanel from "./UpiPaymentPanel";
import WalletRequestForm from "./WalletRequestForm";

const statusLabel = (status) => {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
};

const WalletRechargeModal = ({ isOpen, onClose, suggestedAmount = 100, title = "Add Money" }) => {
  const [links, setLinks] = useState({ upiId: DEFAULT_UPI_ID, payeeName: "AB Tournament" });
  const [requests, setRequests] = useState([]);
  const [step, setStep] = useState("pay");
  const navigate = useNavigate();

  const refreshRequests = async () => {
    try {
      const res = await api.getMyWalletPaymentRequests();
      setRequests(res.data || []);
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setStep("pay");
    api
      .getPaymentLinks()
      .then((res) =>
        setLinks({
          upiId: res.upiId || DEFAULT_UPI_ID,
          payeeName: res.payeeName || "AB Tournament",
        })
      )
      .catch(() => {});
    refreshRequests();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal card payment-modal modal-scrollable">
        <div className="modal-nav">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Back
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              onClose?.();
              navigate("/tournaments");
            }}
          >
            Go to Matches
          </button>
        </div>

        <h3>{title}</h3>
        <p className="muted">UPI Manual Payment — funds are credited after admin approval.</p>

        {step === "pay" && (
          <>
            <UpiPaymentPanel
              upiId={links.upiId}
              payeeName={links.payeeName}
              amount={suggestedAmount}
              note="Wallet recharge"
              onPaid={() => {
                setStep("submit");
                toast("Paste your UTR after successful payment.", { icon: "ℹ️" });
              }}
            />
            <button className="btn btn-secondary full-width" type="button" onClick={() => setStep("submit")}>
              I have paid — Submit UTR
            </button>
          </>
        )}

        {step === "submit" && (
          <>
            <p className="payment-utr-reminder">Paste your UTR after successful payment.</p>
            <WalletRequestForm
              defaultAmount={suggestedAmount}
              onSuccess={async () => {
                toast.success("Payment Submitted");
                await refreshRequests();
                setStep("pay");
              }}
            />
            <button className="btn btn-secondary full-width" type="button" onClick={() => setStep("pay")}>
              Back to UPI
            </button>
          </>
        )}

        <section className="wallet-history-inline">
          <h4>Wallet Recharge Requests</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>UTR</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="4">No wallet requests yet.</td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request._id}>
                      <td>₹{request.amount}</td>
                      <td>{request.utr}</td>
                      <td>
                        <span className={`status-badge status-${request.status}`}>
                          {statusLabel(request.status)}
                        </span>
                      </td>
                      <td>{new Date(request.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <button className="btn btn-secondary full-width" type="button" onClick={onClose} style={{ marginTop: 12 }}>
          Close
        </button>
      </div>
    </div>
  );
};

export default WalletRechargeModal;
