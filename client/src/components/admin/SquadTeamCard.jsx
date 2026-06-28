import "../squad/squad-team.css";

const statusClass = (badge) => {
  if (badge === "READY") return "ready";
  if (badge === "WAITING") return "waiting";
  return "locked";
};

const SquadTeamCard = ({ team, expanded, onToggle }) => {
  const players = team.players || [];

  return (
    <article className="admin-squad-card" onClick={onToggle}>
      <div className="admin-squad-card-header">
        <div>
          <h4 style={{ margin: 0 }}>{team.teamName}</h4>
          <p style={{ margin: "4px 0 0", color: "#ff6b35", fontWeight: 700 }}>{team.teamId}</p>
        </div>
        <span className={`squad-team-badge ${statusClass(team.statusBadge)}`}>
          {team.statusLabel} ({team.playerCount}/4)
        </span>
      </div>

      <div className="admin-squad-card-meta">
        <div><strong>Leader:</strong> {team.leaderName}</div>
        <div><strong>WhatsApp:</strong> {team.leaderWhatsapp}</div>
        <div><strong>Leader UID:</strong> {team.leaderBgmiUid}</div>
        <div><strong>Payment:</strong> {team.paymentStatus === "paid" ? "✅ Paid" : team.paymentStatus}</div>
        <div><strong>Match:</strong> {team.tournament?.title || "—"}</div>
        <div><strong>Created:</strong> {team.createdAt ? new Date(team.createdAt).toLocaleString() : "—"}</div>
      </div>

      {expanded && (
        <div className="squad-player-list" style={{ marginTop: 16 }}>
          <strong>Players</strong>
          {players.map((player, index) => (
            <div className="squad-player-row" key={player.user?._id || player.user || index}>
              <div>
                <strong>{index + 1}. {player.username}{player.isLeader ? " 👑" : ""}</strong>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>UID: {player.bgmiUid}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Joined: {player.joinedAt ? new Date(player.joinedAt).toLocaleString() : "—"}
                </div>
              </div>
            </div>
          ))}
          {players.length === 0 && <p>No players yet.</p>}
        </div>
      )}
    </article>
  );
};

export default SquadTeamCard;
