import "../squad/squad-team.css";

const SquadTeamWinner = ({ results = [] }) => {
  const winners = results.filter((r) => r.rank === 1);
  if (!winners.length) return null;

  return (
    <section>
      <h3>🏆 Squad Team Winners</h3>
      {winners.map((team) => (
        <article className="squad-winner-card" key={team._id}>
          <h3>🥇 Winner Team</h3>
          <p><strong>Team Name:</strong> {team.teamName}</p>
          <p><strong>Team ID:</strong> {team.teamId}</p>
          <p><strong>Leader:</strong> {team.leaderName}</p>
          <p><strong>Total Kills:</strong> {team.kills}</p>
          <p><strong>Prize Won:</strong> ₹{team.winnings?.toLocaleString?.() ?? team.winnings}</p>
          <div className="squad-winner-players">
            <strong>Players</strong>
            {(team.players || []).map((player, index) => (
              <div className="squad-winner-player" key={player.user?._id || player.user || index}>
                <span>{player.username}{player.isLeader ? " 👑" : ""}</span>
                <span>{player.kills ?? 0} kills</span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
};

export default SquadTeamWinner;
