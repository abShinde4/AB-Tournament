import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import AddMoneyModal from "../components/AddMoneyModal";
import WithdrawModal from "../components/WithdrawModal";
import Skeleton from "../components/Skeleton";
import { useAuth } from "../context/useAuth";

const DashboardPage = () => {
  const [data, setData] = useState({
    walletBalance: 0,
    stats: { totalMatchesJoined: 0, totalWins: 0 },
    joinedMatches: [],
  });
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const { setUser } = useAuth();

  const loadAll = async () => {
    const [dashboardRes, txRes, withdrawalsRes] = await Promise.all([
      api.getDashboard(),
      api.getTransactions("limit=10"),
      api.getWithdrawals("limit=10"),
    ]);
    setData(dashboardRes);
    setTransactions(txRes.data || []);
    setWithdrawals(withdrawalsRes.data || []);
    setUser((prev) => ({ ...prev, walletBalance: dashboardRes.walletBalance }));
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll().catch((err) => {
      setError(err.message);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser]);

  const chartData = [
    { metric: "Matches", value: data.stats?.totalMatchesJoined || 0 },
    { metric: "Wins", value: data.stats?.totalWins || 0 },
    { metric: "Wallet", value: data.walletBalance || 0 },
  ];

  return (
    <main className="page">
      <h2>Dashboard</h2>
      {error && <p className="state-text">{error}</p>}
      <section className="grid">
        <article className="card stat-card">
          <h4>Total Matches Joined</h4>
          <p>{data.stats?.totalMatchesJoined || 0}</p>
        </article>
        <article className="card stat-card">
          <h4>Total Wins</h4>
          <p>{data.stats?.totalWins || 0}</p>
        </article>
        <article className="card stat-card">
          <h4>Wallet Balance</h4>
          <p>INR {data.walletBalance}</p>
        </article>
      </section>

      <section className="card">
        <h3>Wallet Balance</h3>
        <p className="wallet">₹{data.walletBalance}</p>
        <button className="btn btn-primary" type="button" onClick={() => setShowAddMoney(true)}>
          Add Money
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => setShowWithdraw(true)} style={{ marginLeft: 12 }}>
          Withdraw
        </button>
      </section>

      <section className="card">
        <h3>Withdraw Requests</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>UPI ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="3">No withdraw requests found.</td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w._id}>
                    <td>₹{w.amount}</td>
                    <td>{w.upiId}</td>
                    <td>{w.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Performance Snapshot</h3>
        {loading ? (
          <Skeleton height={220} />
        ) : (
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2f3252" />
                <XAxis dataKey="metric" stroke="#c7ceff" />
                <YAxis stroke="#c7ceff" />
                <Tooltip />
                <Bar dataKey="value" fill="#6d56ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card">
        <h3>Joined Matches</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Match</th>
                <th>Game</th>
                <th>Status</th>
                <th>Entry</th>
              </tr>
            </thead>
            <tbody>
              {data.joinedMatches.length === 0 && (
                <tr>
                  <td colSpan="4">No matches joined yet.</td>
                </tr>
              )}
              {data.joinedMatches.map((match) => (
                <tr key={match.id}>
                  <td>{match.title}</td>
                  <td>{match.game}</td>
                  <td>{match.status}</td>
                  <td>₹{match.entryFee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Transaction History</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4">No transactions yet.</td>
                </tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{tx.type}</td>
                  <td>{tx.source}</td>
                  <td>INR {tx.amount}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <AddMoneyModal isOpen={showAddMoney} onClose={() => setShowAddMoney(false)} />
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        existingPending={withdrawals.filter((w) => w.status === "pending")}
        onSuccess={() => loadAll()}
      />
    </main>
  );
};

export default DashboardPage;
