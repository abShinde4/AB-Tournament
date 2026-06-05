import { useEffect, useState } from "react";
import { getYouTubeEmbedUrl } from "../utils/youtubeUtils";
import "./HighlightModal.css";

const HighlightModal = ({ isOpen, highlight, onClose }) => {
  const [activeTab, setActiveTab] = useState("youtube");
  const [embedFailed, setEmbedFailed] = useState(false);

  const youtubeEmbedUrl = highlight ? getYouTubeEmbedUrl(highlight.youtubeUrl) : null;

  useEffect(() => {
    if (!isOpen || !highlight) return;

    setEmbedFailed(false);

    if (youtubeEmbedUrl) {
      console.log("[WinnerHighlight] YouTube iframe src:", youtubeEmbedUrl);
      console.log("[WinnerHighlight] Generated embed URL:", youtubeEmbedUrl);
    } else if (highlight.youtubeUrl) {
      console.warn("[WinnerHighlight] Could not generate embed URL from:", highlight.youtubeUrl);
    }
  }, [isOpen, highlight, youtubeEmbedUrl]);

  if (!isOpen || !highlight) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleIframeError = () => {
    console.warn("[WinnerHighlight] YouTube embed failed, showing fallback link.");
    setEmbedFailed(true);
  };

  const showYouTubeFallback = highlight.youtubeUrl && (!youtubeEmbedUrl || embedFailed);

  return (
    <div className="highlight-modal-backdrop" onClick={handleBackdropClick}>
      <div className="highlight-modal">
        <button className="highlight-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="highlight-modal-header">
          <h2>{highlight.winnerName}</h2>
          <p className="highlight-modal-team">{highlight.teamName}</p>
        </div>

        <div className="highlight-modal-content">
          <div className="highlight-modal-tabs">
            {highlight.youtubeUrl && (
              <button
                className={`highlight-tab ${activeTab === "youtube" ? "active" : ""}`}
                onClick={() => setActiveTab("youtube")}
              >
                📺 YouTube Short
              </button>
            )}
            {highlight.instagramUrl && (
              <button
                className={`highlight-tab ${activeTab === "instagram" ? "active" : ""}`}
                onClick={() => setActiveTab("instagram")}
              >
                📱 Instagram Reel
              </button>
            )}
          </div>

          <div className="highlight-modal-viewer">
            {activeTab === "youtube" && youtubeEmbedUrl && !embedFailed ? (
              <iframe
                width="100%"
                height="500"
                src={youtubeEmbedUrl}
                title={highlight.winnerName}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                onError={handleIframeError}
              />
            ) : null}

            {activeTab === "youtube" && showYouTubeFallback ? (
              <a
                href={highlight.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="highlight-link-button"
              >
                Watch on YouTube
              </a>
            ) : null}

            {activeTab === "instagram" && highlight.instagramUrl && (
              <a href={highlight.instagramUrl} target="_blank" rel="noopener noreferrer" className="highlight-link-button">
                Open Instagram Reel ↗️
              </a>
            )}
          </div>

          <div className="highlight-modal-info">
            <div className="highlight-info-grid">
              <div className="highlight-info-item">
                <span className="highlight-info-label">Prize Amount</span>
                <span className="highlight-info-value">₹{highlight.prizeAmount?.toLocaleString()}</span>
              </div>
              <div className="highlight-info-item">
                <span className="highlight-info-label">Match Type</span>
                <span className="highlight-info-value">{highlight.matchType}</span>
              </div>
              <div className="highlight-info-item">
                <span className="highlight-info-label">Map</span>
                <span className="highlight-info-value">{highlight.map}</span>
              </div>
              <div className="highlight-info-item">
                <span className="highlight-info-label">Game</span>
                <span className="highlight-info-value">{highlight.match?.game}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightModal;
