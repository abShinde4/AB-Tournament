import "./squad-team.css";

const SquadTeamCardStats = ({ joinedTeamsCount = 0, remainingTeamSlots = 0 }) => (
  <div className="squad-team-stats">
    <div className="squad-team-stat">
      <div className="squad-team-stat-label">Teams Registered</div>
      <div className="squad-team-stat-value">{joinedTeamsCount} Teams</div>
    </div>
    <div className="squad-team-stat">
      <div className="squad-team-stat-label">Slots Left</div>
      <div className="squad-team-stat-value">{remainingTeamSlots} Teams</div>
    </div>
  </div>
);

export default SquadTeamCardStats;
