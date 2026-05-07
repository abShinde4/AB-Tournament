import { useState } from 'react';
import toast from 'react-hot-toast';
import { publishRoom } from '../utils/roomUtils';
import './AdminRoomPublisher.css';

/**
 * Admin component to publish room details for a match
 */
export function AdminRoomPublisher({ matchId, token, onSuccess }) {
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!roomId.trim() || !roomPassword.trim()) {
      setError('Room ID and password are required');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await publishRoom(matchId, roomId, roomPassword, token);
      setMessage(result.message || 'Room published successfully.');
      setRoomId('');
      setRoomPassword('');
      if (onSuccess) onSuccess(result);
    } catch (error) {
      const errorMessage = error?.message || 'Failed to publish room. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-room-publisher">
      <h3>📢 Publish Room Details</h3>

      <form onSubmit={handlePublish} className="publisher-form">
        {/* Room ID Input */}
        <div className="form-group">
          <label htmlFor="roomId">Room ID</label>
          <input
            id="roomId"
            type="text"
            placeholder="e.g., ROOM-12345"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={loading}
            required
          />
          <small>The ID players will see to join the room</small>
        </div>

        {/* Password Input */}
        <div className="form-group">
          <label htmlFor="roomPassword">Room Password</label>
          <input
            id="roomPassword"
            type="text"
            placeholder="e.g., PASS123"
            value={roomPassword}
            onChange={(e) => setRoomPassword(e.target.value)}
            disabled={loading}
            required
          />
          <small>The password players will use to join</small>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Success Message */}
        {message && <div className="success-message">✓ {message}</div>}

        {/* Submit Button */}
        <button type="submit" disabled={loading} className="publish-btn">
          {loading ? 'Publishing...' : '🔓 Publish Room'}
        </button>
      </form>

      {/* Info Box */}
      <div className="info-box">
        <p>
          <strong>Note:</strong> Room details will be visible to joined players 10 minutes 
          before the match starts. Players can only access this if they have joined the match.
        </p>
      </div>
    </div>
  );
}

export default AdminRoomPublisher;
