import { useEffect, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import PhonePeLogo from "./PhonePeLogo";
import PhonePeReceiptPreview from "./PhonePeReceiptPreview";
import { buildUpiPayUri, isMobileDevice } from "../utils/upi";

const UpiPaymentPanel = ({ upiId, payeeName, amount, note, onPaid }) => {
  const [qrDataUrl, setQrDataUrl] = useState("");

  const upiUri = buildUpiPayUri({
    upiId,
    amount,
    payeeName,
    note,
  });

  useEffect(() => {
    if (!upiId) return;
    QRCode.toDataURL(upiUri, {
      width: 220,
      margin: 2,
      color: { dark: "#e8ecff", light: "#12182b" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [upiUri, upiId]);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      toast.success("UPI ID copied");
    } catch {
      toast.error("Unable to copy UPI ID");
    }
  };

  const payViaUpi = () => {
    if (!upiId) {
      toast.error("UPI ID is not configured.");
      return;
    }

    if (isMobileDevice()) {
      window.location.href = upiUri;
      toast("Complete payment in your UPI app, then submit your UTR.", { icon: "ℹ️" });
    } else {
      toast("Scan the QR code or copy the UPI ID in your UPI app.", { icon: "ℹ️" });
    }

    onPaid?.();
  };

  if (!upiId) return null;

  return (
    <section className="upi-payment-panel">
      <p className="upi-method-label">UPI Manual Payment</p>
      <p className="payment-hint">
        Pay ₹{amount} to the UPI ID below, then submit your UTR.
      </p>

      <div className="upi-id-row">
        <span className="upi-id-label">UPI ID</span>
        <code className="upi-id-value">{upiId}</code>
        <button className="btn btn-secondary upi-copy-btn" type="button" onClick={copyUpiId}>
          Copy
        </button>
      </div>

      {qrDataUrl && (
        <div className="upi-qr-wrap">
          <img src={qrDataUrl} alt={`UPI QR for ${upiId}`} className="upi-qr-image" width={220} height={220} />
          <p className="muted upi-qr-caption">Scan with any UPI app</p>
          <div className="phonepe-brand-strip">
            <PhonePeLogo />
            <span className="phonepe-brand-tagline">Use PhonePe for faster verification</span>
          </div>
        </div>
      )}

      <PhonePeReceiptPreview amount={amount} />

      <p className="payment-utr-paste-hint">After payment, paste your UTR / Transaction ID below</p>

      <button className="btn btn-primary full-width" type="button" onClick={payViaUpi}>
        Pay via UPI
      </button>
    </section>
  );
};

export default UpiPaymentPanel;
