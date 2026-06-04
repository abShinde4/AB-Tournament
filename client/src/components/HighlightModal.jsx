import { useState } from "react";
import "./HighlightModal.css";

const HighlightModal = ({ isOpen, highlight, onClose }) => {
  const [activeTab, setActiveTab] = useState("youtube");

  if (!isOpen || !highlight) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    // Extract video ID from YouTube URL
    let videoId;
    if (url.includes("youtube.com/shorts/")) {
      videoId = url.split("/shorts/")[1]?.split("?")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("youtube.com/watch")) {
      videoId = new URLSearchParams(new URL(url).search).get("v");
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const youtubeEmbedUrl = getYouTubeEmbedUrl(highlight.youtubeUrl);

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
            {activeTab === "youtube" && youtubeEmbedUrl ? (
              <iframe
                width="100%"
                height="500"
                src={youtubeEmbedUrl}
                title={highlight.winnerName}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : activeTab === "youtube" && highlight.youtubeUrl ? (
              <a href={highlight.youtubeUrl} target="_blank" rel="noopener noreferrer" className="highlight-link-button">
                Open YouTube Short ↗️
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
