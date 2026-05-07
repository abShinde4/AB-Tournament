import { useState } from 'react';
import Countdown from './Countdown';
import './RoomDisplay.css';

/**
 * Room Display Component
 * Shows room ID and password based on unlock time
 * Supports copy and password reveal features
 */
export function RoomDisplay({ matchDetails }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  if (!matchDetails) return null;

  const now = Date.now();
  const unlockTime = matchDetails.roomUnlockedAt ? new Date(matchDetails.roomUnlockedAt).getTime() : null;
  const isUnlocked = unlockTime && now >= unlockTime && matchDetails.isRoomVisible;

  // Handle copy to clipboard
  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isUnlocked) {
    // Show countdown
    return (
      <div className="room-locked">
        <div className="lock-icon">🔒</div>
        <h3>Room Details Coming Soon</h3>
        <p className="countdown-text">
          Room unlocks in <Countdown unlockTime={matchDetails.roomUnlockedAt} />
        </p>
        <p className="unlock-info">
          Room details will be available 10 minutes before match start
        </p>
      </div>
    );
  }

  // Show room details
  return (
    <div className="room-unlocked">
      <div className="unlock-icon">🔓</div>
      <h3>Room Details</h3>

      {/* Room ID Section */}
      <div className="room-section">
        <div className="section-header">
          <label>Room ID</label>
          <button
            className="copy-btn"
            onClick={() => handleCopy(matchDetails.roomId, 'Room ID')}
            title="Copy Room ID"
          >
            📋 Copy
          </button>
        </div>
        <div className="room-value">{matchDetails.roomId}</div>
      </div>

      {/* Password Section */}
      <div className="room-section">
        <div className="section-header">
          <label>Password</label>
          <div className="password-actions">
            <button
              className="toggle-btn"
              onClick={() => setPasswordVisible(!passwordVisible)}
              title={passwordVisible ? 'Hide password' : 'Show password'}
            >
              {passwordVisible ? '🙈 Hide' : '👁️ Show'}
            </button>
            <button
              className="copy-btn"
              onClick={() => handleCopy(matchDetails.roomPassword, 'Password')}
              title="Copy Password"
            >
              📋 Copy
            </button>
          </div>
        </div>
        <div className="room-value password-field">
          {passwordVisible ? matchDetails.roomPassword : '•'.repeat(matchDetails.roomPassword.length)}
        </div>
      </div>

      {/* Feedback Message */}
      {copyFeedback && <div className="copy-feedback">{copyFeedback}</div>}

      {/* Info Message */}
      <p className="room-info">
        ✓ You have access to room details as a joined participant
      </p>
    </div>
  );
}

export default RoomDisplay;
