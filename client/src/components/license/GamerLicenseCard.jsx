import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, Maximize2, Share2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import "./license.css";

const tierColors = {
  Bronze: "#cd7f32",
  Silver: "#c0c0c0",
  Gold: "#ffd700",
  Elite: "#a855f7",
};

const GamerLicenseCard = ({ license, compact = false, showActions = true, onFullscreen }) => {
  const [qrDataUrl, setQrDataUrl] = useState("");

  const verifyUrl = useMemo(() => {
    if (typeof window === "undefined" || !license?.licenseId) return "";
    return `${window.location.origin}/verify/${license.licenseId}`;
  }, [license?.licenseId]);

  useEffect(() => {
    if (!verifyUrl) return;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: compact ? 96 : 128 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [verifyUrl, compact]);

  if (!license) return null;

  const displayImage = license.displayImageUrl || license.imageUrl || license.cdnUrl;
  const tierColor = tierColors[license.tier] || tierColors.Bronze;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      toast.success("Verification link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${license.playerName} — Verified Gamer License`,
          text: `Verify license ${license.licenseId}`,
          url: verifyUrl,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    copyLink();
  };

  const downloadLicense = () => {
    if (displayImage) {
      window.open(displayImage, "_blank", "noopener,noreferrer");
      return;
    }
    window.print();
  };

  return (
    <div className={`gamer-license-card ${compact ? "compact" : ""}`}>
      {license.foundingMemberNumber && (
        <div className="license-founding-badge">Founding Season 1 · Member #{license.foundingMemberNumber}</div>
      )}

      {displayImage ? (
        <div className="license-admin-image-wrap">
          <img src={displayImage} alt="Verified Gamer License" className="license-admin-image" />
        </div>
      ) : (
        <div className="license-card-inner" style={{ borderColor: tierColor }}>
          <div className="license-card-header">
            <ShieldCheck size={28} style={{ color: tierColor }} />
            <div>
              <span className="license-brand">AB Tournament</span>
              <strong>Verified Gamer License</strong>
            </div>
          </div>
          <div className="license-card-body">
            <div>
              <span className="license-label">License ID</span>
              <strong>{license.licenseId}</strong>
            </div>
            <div>
              <span className="license-label">Player</span>
              <strong>{license.playerName}</strong>
            </div>
            <div>
              <span className="license-label">BGMI UID</span>
              <strong>{license.bgmiUid || "—"}</strong>
            </div>
            <div className="license-meta-row">
              <div>
                <span className="license-label">Tier</span>
                <strong style={{ color: tierColor }}>{license.tier}</strong>
              </div>
              <div>
                <span className="license-label">Level</span>
                <strong>{license.level}</strong>
              </div>
              <div>
                <span className="license-label">XP</span>
                <strong>{license.xp}</strong>
              </div>
            </div>
            <div>
              <span className="license-label">Issue Date</span>
              <strong>{new Date(license.issueDate).toLocaleDateString()}</strong>
            </div>
          </div>
          {qrDataUrl && (
            <div className="license-qr-wrap">
              <img src={qrDataUrl} alt="License verification QR" className="license-qr" />
              <span className="license-qr-caption">Scan to verify</span>
            </div>
          )}
        </div>
      )}

      {showActions && (
        <div className="license-actions">
          <button type="button" className="btn btn-secondary" onClick={onFullscreen}>
            <Maximize2 size={16} /> View
          </button>
          <button type="button" className="btn btn-secondary" onClick={downloadLicense}>
            <Download size={16} /> Download
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => window.open(verifyUrl, "_blank")}>
            <ExternalLink size={16} /> Open
          </button>
          <button type="button" className="btn btn-primary" onClick={shareLink}>
            <Share2 size={16} /> Share
          </button>
          <button type="button" className="btn btn-tertiary" onClick={copyLink}>
            <Copy size={16} /> Copy Link
          </button>
        </div>
      )}
    </div>
  );
};

export default GamerLicenseCard;
