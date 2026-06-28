import "./squad-team.css";

const SquadTeamProgress = ({ playerCount = 0, maxPlayers = 4 }) => {
  const pct = Math.min(100, Math.round((playerCount / maxPlayers) * 100));
  return (
    <div className="squad-team-progress">
      <div className="squad-team-progress-label">
        <span>Players Joined</span>
        <strong>{playerCount}/{maxPlayers}</strong>
      </div>
      <div className="squad-team-progress-bar">
        <div className="squad-team-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default SquadTeamProgress;
