import { useEffect, useState } from "react";
import { api } from "../api";
import Skeleton from "../components/Skeleton";
import { buildAvatarUrl } from "../utils/avatarUrl";

const LeaderboardPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLeaderboard("limit=25")
      .then((res) => setRows(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const medalClass = (rank) => {
    if (rank === 1) return "top-gold";
    if (rank === 2) return "top-silver";
    if (rank === 3) return "top-bronze";
    return "";
  };

  return (
    <main className="page">
      <h2>Global Leaderboard</h2>
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Wins</th>
                <th>Earnings</th>
                <th>Matches</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan="5">
                      <Skeleton height={16} />
                    </td>
                  </tr>
                ))}
              {!loading &&
                rows.map((row) => (
                  <tr key={row.userId} className={`leaderboard-row ${medalClass(row.rank)}`}>
                    <td>
                      {row.rank === 1 ? "👑 #1" : `#${row.rank}`}
                      {row.rank === 1 ? <span className="winner-badge">🏆 Winner</span> : null}
                    </td>
                    <td>
                      <div className="leaderboard-player">
                        <img
                          src={row.avatar ? buildAvatarUrl(row.avatar) : "/default-avatar.svg"}
                          alt={row.username}
                          className="leaderboard-avatar"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = "/default-avatar.svg";
                          }}
                        />
                        <span>{row.username}</span>
                      </div>
                    </td>
                    <td>{row.totalWins}</td>
                    <td>INR {row.totalEarnings}</td>
                    <td>{row.totalMatches}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default LeaderboardPage;
