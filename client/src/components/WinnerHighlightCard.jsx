import { getYouTubeThumbnailUrl } from "../utils/youtubeUtils";
import "./WinnerHighlightCard.css";

const WinnerHighlightCard = ({ highlight, onCardClick }) => {
  const thumbnailUrl =
    highlight.thumbnailUrl || getYouTubeThumbnailUrl(highlight.youtubeUrl);
  const hasVideo = highlight.youtubeUrl || highlight.instagramUrl;

  return (
    <div className="winner-highlight-card" onClick={() => hasVideo && onCardClick()}>
      {/* Thumbnail */}
      <div className="highlight-card-thumbnail">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={highlight.winnerName} 
            onError={(e) => {
              e.target.style.display = 'none';
              const nextElement = e.target.nextElementSibling;
              if (nextElement) {
                nextElement.style.display = 'flex';
              }
            }} 
          />
        ) : null}
        <div className="highlight-card-placeholder" style={{display: thumbnailUrl ? 'none' : 'flex'}}>
          <div className="placeholder-icon">🎮</div>
        </div>

        {/* Overlay Info */}
        <div className="highlight-card-overlay">
          {hasVideo && (
            <button className="highlight-card-play-button">
              ▶️
            </button>
          )}
        </div>

        {/* Badge */}
        {highlight.match?.game && (
          <span className="highlight-card-badge">{highlight.match.game}</span>
        )}
      </div>

      {/* Card Body */}
      <div className="highlight-card-body">
        <div className="highlight-card-header">
          <h3 className="highlight-card-winner">{highlight.winnerName}</h3>
          {highlight.teamName && (
            <p className="highlight-card-team">{highlight.teamName}</p>
          )}
        </div>

        <div className="highlight-card-details">
          {highlight.prizeAmount != null && (
            <div className="highlight-detail-row">
              <span className="highlight-detail-label">Prize:</span>
              <span className="highlight-detail-value">₹{highlight.prizeAmount.toLocaleString()}</span>
            </div>
          )}

          {highlight.matchType && (
            <div className="highlight-detail-row">
              <span className="highlight-detail-label">Match:</span>
              <span className="highlight-detail-value">{highlight.matchType}</span>
            </div>
          )}

          {highlight.map && (
            <div className="highlight-detail-row">
              <span className="highlight-detail-label">Map:</span>
              <span className="highlight-detail-value">{highlight.map}</span>
            </div>
          )}
        </div>

        {/* Video Indicators */}
        <div className="highlight-card-indicators">
          {highlight.youtubeUrl && (
            <span className="highlight-indicator youtube" title="YouTube Short">
              📺
            </span>
          )}
          {highlight.instagramUrl && (
            <span className="highlight-indicator instagram" title="Instagram Reel">
              📱
            </span>
          )}
        </div>

        {/* Watch Button */}
        {hasVideo && (
          <button className="highlight-card-button">
            Watch Highlight
          </button>
        )}
      </div>
    </div>
  );
};

export default WinnerHighlightCard;
