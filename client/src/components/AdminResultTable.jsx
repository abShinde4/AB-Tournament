import { useEffect, useMemo, useState } from "react";

const emptyRow = () => ({ email: "", kills: 0, score: 0, winnings: 0, rank: 1 });

const sortAndRank = (rows) => {
  const indexed = rows.map((row, idx) => ({ ...row, _idx: idx }));
  indexed.sort((a, b) => {
    if (Number(b.score) !== Number(a.score)) return Number(b.score) - Number(a.score);
    return Number(b.kills) - Number(a.kills);
  });
  const ranked = indexed.map((row, index) => ({ ...row, rank: index + 1 }));
  ranked.sort((a, b) => a._idx - b._idx);
  return ranked.map(({ _idx, ...item }) => item);
};

const AdminResultTable = ({ onPublish, loading }) => {
  const [rows, setRows] = useState([emptyRow()]);

  useEffect(() => {
    setRows((prev) => sortAndRank(prev));
  }, [rows.length]);

  const rankedRows = useMemo(() => sortAndRank(rows), [rows]);

  const updateRow = (index, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return sortAndRank(next);
    });
  };

  const addRow = () => setRows((prev) => sortAndRank([...prev, emptyRow()]));
  const removeRow = (index) =>
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return sortAndRank(next.length > 0 ? next : [emptyRow()]);
    });

  const publish = () => onPublish(rankedRows);

  return (
    <div className="admin-result-table">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Player Email</th>
              <th>Kills</th>
              <th>Score</th>
              <th>Rank</th>
              <th>Winnings</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rankedRows.map((row, index) => (
              <tr key={`result-row-${index}`}>
                <td>
                  <input
                    type="email"
                    placeholder="player@email.com"
                    value={row.email}
                    onChange={(e) => updateRow(index, "email", e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={row.kills}
                    onChange={(e) => updateRow(index, "kills", Number(e.target.value || 0))}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={row.score}
                    onChange={(e) => updateRow(index, "score", Number(e.target.value || 0))}
                    required
                  />
                </td>
                <td>
                  <span className="rank-chip">#{row.rank}</span>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={row.winnings}
                    onChange={(e) => updateRow(index, "winnings", Number(e.target.value || 0))}
                    required
                  />
                </td>
                <td>
                  <button className="btn btn-secondary" type="button" onClick={() => removeRow(index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row">
        <button className="btn btn-secondary" type="button" onClick={addRow}>
          Add Row (+)
        </button>
        <button className="btn btn-primary" type="button" onClick={publish} disabled={loading}>
          {loading ? "Publishing..." : "Publish Results"}
        </button>
      </div>
    </div>
  );
};

export default AdminResultTable;
