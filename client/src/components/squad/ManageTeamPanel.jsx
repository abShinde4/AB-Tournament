import toast from "react-hot-toast";
import { api } from "../../api";
import SquadTeamProgress from "./SquadTeamProgress";
import "./squad-team.css";

const ManageTeamPanel = ({ team, currentUserId, onUpdate, onEdit }) => {
  if (!team) return null;

  const isLeader = String(team.leaderUser?._id || team.leaderUser) === String(currentUserId);

  const handleKick = async (userId, username) => {
    if (!window.confirm(`Remove ${username} from the team?`)) return;
    try {
      const res = await api.kickPlayer(team.teamId, userId);
      toast.success("Player removed");
      onUpdate?.(res.team);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="squad-player-list">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{team.teamName}</strong>
        <span className="squad-team-badge leader">👑 {team.teamId}</span>
      </div>
      <SquadTeamProgress playerCount={team.playerCount || team.players?.length || 0} />
      {isLeader && !team.isLocked && (
        <button type="button" className="btn btn-secondary full-width" onClick={onEdit}>
          Edit Team Details
        </button>
      )}
      {(team.players || []).map((player, index) => (
        <div className="squad-player-row" key={player.user?._id || player.user || index}>
          <div>
            <strong>
              {index + 1}. {player.username}
              {player.isLeader ? " 👑" : ""}
            </strong>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>UID: {player.bgmiUid}</div>
          </div>
          {isLeader && !player.isLeader && !team.isLocked && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleKick(player.user?._id || player.user, player.username)}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ManageTeamPanel;
