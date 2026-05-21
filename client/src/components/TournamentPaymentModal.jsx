import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { DEFAULT_UPI_ID } from "../utils/upi";
import PhonePeReceiptPreview from "./PhonePeReceiptPreview";
import UpiPaymentPanel from "./UpiPaymentPanel";

const TournamentPaymentModal = ({ isOpen, onClose, match, onSubmitted }) => {
  const [step, setStep] = useState("pay");
  const [links, setLinks] = useState({
    phonepeLink: "",
    gpayLink: "",
    defaultLink: "",
    upiId: DEFAULT_UPI_ID,
    payeeName: "AB Tournament",
  });
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUtrHint, setShowUtrHint] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep("pay");
    setUtr("");
    setScreenshot(null);
    setShowUtrHint(false);
    api
      .getPaymentLinks()
      .then((res) =>
        setLinks({
          phonepeLink: res.phonepeLink || "",
          gpayLink: res.gpayLink || "",
          defaultLink: res.defaultLink || "",
          upiId: res.upiId || DEFAULT_UPI_ID,
          payeeName: res.payeeName || "AB Tournament",
        })
      )
      .catch(() => {
        setLinks((prev) => ({ ...prev, upiId: DEFAULT_UPI_ID }));
      });
  }, [isOpen, match?._id]);

  if (!isOpen || !match) return null;

  const entryFee = match.entryFee || 20;
  const upiId = links.upiId || DEFAULT_UPI_ID;

  const goToUtrStep = () => {
    setShowUtrHint(true);
    setStep("utr");
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    const trimmedUtr = utr.trim();
    if (trimmedUtr.length < 6) {
      toast.error("Please enter a valid UTR / Transaction ID.");
      return;
    }

    try {
      setLoading(true);
      await api.submitTournamentPayment(match._id, {
        utr: trimmedUtr,
        screenshot,
      });
      toast.success("Payment submitted. Awaiting admin verification.");
      onSubmitted?.();
      onClose();
    } catch (error) {
      const msg = error.message || "Payment submission failed.";
      if (msg.toLowerCase().includes("utr")) {
        toast.error("Duplicate UTR — this transaction ID was already used.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal card payment-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>Pay Entry Fee — {match.title}</h3>
        <p className="muted">Amount: ₹{entryFee}</p>

        {step === "pay" && (
          <>
            <UpiPaymentPanel
              upiId={upiId}
              payeeName={links.payeeName}
              amount={entryFee}
              note={`${match.title} entry`}
              onPaid={goToUtrStep}
            />

            {(links.phonepeLink || links.gpayLink) && (
              <div className="payment-alt-links">
                <p className="muted">Or pay via app link</p>
                <div className="row payment-link-row">
                  {links.phonepeLink && (
                    <a
                      className="btn btn-secondary"
                      href={links.phonepeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={goToUtrStep}
                    >
                      PhonePe
                    </a>
                  )}
                  {links.gpayLink && (
                    <a
                      className="btn btn-secondary"
                      href={links.gpayLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={goToUtrStep}
                    >
                      GPay
                    </a>
                  )}
                </div>
              </div>
            )}

            {showUtrHint && (
              <p className="payment-utr-reminder">After payment, paste your UTR / Transaction ID below</p>
            )}

            <button className="btn btn-secondary full-width" type="button" onClick={goToUtrStep}>
              I have paid — Enter UTR
            </button>
          </>
        )}

        {step === "utr" && (
          <form onSubmit={submitPayment}>
            {showUtrHint && (
              <p className="payment-utr-reminder">After payment, paste your UTR / Transaction ID below</p>
            )}
            <PhonePeReceiptPreview amount={entryFee} compact />
            <label htmlFor="utr-input">Enter UTR / Transaction ID</label>
            <p className="phonepe-receipt-note phonepe-receipt-note--inline">
              Use the UTR shown in your PhonePe payment receipt
            </p>
            <input
              id="utr-input"
              type="text"
              placeholder="e.g. 012020675896"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              required
              minLength={6}
              maxLength={50}
              autoComplete="off"
            />
            <label htmlFor="screenshot-input">Payment screenshot (optional)</label>
            <input
              id="screenshot-input"
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
            <div className="row">
              <button className="btn btn-secondary" type="button" onClick={() => setStep("pay")}>
                Back
              </button>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Payment"}
              </button>
            </div>
          </form>
        )}

        <button className="btn btn-secondary full-width" type="button" onClick={onClose} style={{ marginTop: 12 }}>
          Close
        </button>
      </div>
    </div>
  );
};

export default TournamentPaymentModal;
