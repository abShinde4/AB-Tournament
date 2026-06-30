import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";
import Skeleton from "../components/Skeleton";
import WinnerHighlightCard from "../components/WinnerHighlightCard";
import HighlightModal from "../components/HighlightModal";
import SquadTeamWinner from "../components/results/SquadTeamWinner";

const ResultPage = () => {
  const [results, setResults] = useState([]);
  const [squadResults, setSquadResults] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getResults("limit=50"),
      api.getHighlights("limit=50"),
      api.getSquadResults("limit=50"),
    ])
      .then(([resultsRes, highlightsRes, squadResultsRes]) => {
        setResults(resultsRes.data || []);
        setHighlights(highlightsRes.data || []);
        setSquadResults(squadResultsRes.data || []);
        if ((resultsRes.data || []).length > 0) {
          toast.success("Results loaded");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const groupedResults = useMemo(() => {
    const map = new Map();
    results.forEach((result) => {
      const key = result.match?._id || "unknown";
      if (!map.has(key)) {
        map.set(key, { match: result.match, ranks: [] });
      }
      map.get(key).ranks.push(result);
    });
    return [...map.values()];
  }, [results]);

  const handleHighlightClick = (highlight) => {
    setSelectedHighlight(highlight);
    setShowModal(true);
  };

  return (
    <main className="page v2-page">
      <h2 className="v2-page-title">📢 Results</h2>
      {error && <p className="state-text">{error}</p>}
      {loading && <Skeleton height={220} />}

      <SquadTeamWinner results={squadResults} />
      
      {/* Winner Highlights Section */}
      {highlights.length > 0 && (
        <section className="card">
          <h3>🏆 Winner Highlights</h3>
          <div className="highlights-grid">
            {highlights.map((highlight) => (
              <WinnerHighlightCard
                key={highlight._id}
                highlight={highlight}
                onCardClick={() => handleHighlightClick(highlight)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Results Table Section */}
      {groupedResults.map((group) => (
        <section className="card" key={group.match?._id || "unknown"}>
          <h3>{group.match?.title || "Match"}</h3>
          <p>{group.match?.game}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Winner</th>
                  <th>Score</th>
                  <th>Winnings</th>
                </tr>
              </thead>
              <tbody>
                {group.ranks
                  .sort((a, b) => a.rank - b.rank)
                  .map((item) => (
                    <tr key={item._id}>
                      <td>#{item.rank}</td>
                      <td>{item.user?.username || "Player"}</td>
                      <td>{item.score}</td>
                      <td>₹{item.winnings}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      
      {!loading && groupedResults.length === 0 && (
        <section className="card">
          <h3>No results published yet</h3>
          <p>Match results will be shown here after admins publish them.</p>
        </section>
      )}

      {/* Highlight Modal */}
      <HighlightModal 
        isOpen={showModal} 
        highlight={selectedHighlight}
        onClose={() => setShowModal(false)}
      />
    </main>
  );
};

export default ResultPage;
