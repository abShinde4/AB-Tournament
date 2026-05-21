const SAMPLE_TXN_ID = "T2605201437435040187425";
const SAMPLE_UTR = "012020675896";
const SAMPLE_MASKED_ACCOUNT = "XXXXXXXX7312";

const CopyIcon = () => (
  <svg className="phonepe-receipt-copy" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    <path d="M6 16V6a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" fill="none" />
  </svg>
);

const PhonePeReceiptPreview = ({ amount, compact = false }) => {
  const displayAmount = Number(amount) > 0 ? Number(amount) : 300;

  return (
    <div className={`phonepe-receipt-preview${compact ? " phonepe-receipt-preview--compact" : ""}`}>
      <div className="phonepe-receipt-preview-label">Example — find these on your PhonePe receipt</div>
      <div className="phonepe-receipt-card">
        <div className="phonepe-receipt-header">
          <span className="phonepe-receipt-title">Transfer Details</span>
          <span className="phonepe-receipt-chevron" aria-hidden="true">
            ▾
          </span>
        </div>

        <div className="phonepe-receipt-success">
          <span className="phonepe-receipt-success-dot" aria-hidden="true" />
          Successful Payment
        </div>

        <div className="phonepe-receipt-field">
          <span className="phonepe-receipt-field-label">PhonePe Transaction ID</span>
          <div className="phonepe-receipt-field-row">
            <code className="phonepe-receipt-field-value">{SAMPLE_TXN_ID}</code>
            <CopyIcon />
          </div>
        </div>

        <div className="phonepe-receipt-field phonepe-receipt-field--debited">
          <span className="phonepe-receipt-field-label">Debited from</span>
          <div className="phonepe-receipt-debited-row">
            <span className="phonepe-receipt-bank-dot" aria-hidden="true" />
            <span className="phonepe-receipt-account">{SAMPLE_MASKED_ACCOUNT}</span>
            <strong className="phonepe-receipt-amount">₹{displayAmount}</strong>
          </div>
        </div>

        <div className="phonepe-receipt-field phonepe-receipt-field--utr">
          <span className="phonepe-receipt-field-label">UTR Number</span>
          <div className="phonepe-receipt-field-row">
            <code className="phonepe-receipt-field-value phonepe-receipt-utr-value">UTR: {SAMPLE_UTR}</code>
            <CopyIcon />
          </div>
        </div>
      </div>

      <p className="phonepe-receipt-note">Use the UTR shown in your PhonePe payment receipt</p>
    </div>
  );
};

export default PhonePeReceiptPreview;
