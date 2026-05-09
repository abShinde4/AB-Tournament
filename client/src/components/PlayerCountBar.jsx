import './PlayerCountBar.css';

/**
 * PlayerCountBar Component
 * Shows joined player count, max slots, and remaining slots with neon progress bar
 */
export function PlayerCountBar({ joinedCount = 0, maxPlayers = 100 }) {
  const remainingSlots = Math.max(0, maxPlayers - joinedCount);
  const fillPercentage = (joinedCount / maxPlayers) * 100;
  const isLowSlots = remainingSlots <= 10 && remainingSlots > 0;
  const isFull = remainingSlots === 0;

  return (
    <div className="player-count-container">
      {/* Joined Count Display */}
      <div className="count-display">
        <div className="count-stat">
          <span className="count-label">Joined:</span>
          <span className="count-value">{joinedCount}/{maxPlayers}</span>
        </div>
        <div className="count-stat">
          <span className="count-label">Slots Left:</span>
          <span className={`count-value ${isFull ? 'full' : isLowSlots ? 'warning' : ''}`}>
            {remainingSlots}
          </span>
        </div>
      </div>

      {/* Neon Progress Bar */}
      <div className="progress-wrapper">
        <div className={`progress-bar ${isFull ? 'full' : isLowSlots ? 'warning' : ''}`}>
          <div
            className="progress-fill"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
        <div className="progress-percentage">{Math.round(fillPercentage)}% Full</div>
      </div>

      {/* Warning Badge */}
      {isLowSlots && (
        <div className="slots-warning">
          ⚠️ Only {remainingSlots} {remainingSlots === 1 ? 'slot' : 'slots'} left!
        </div>
      )}

      {isFull && (
        <div className="slots-full">
          🔴 Tournament Full
        </div>
      )}
    </div>
  );
}
