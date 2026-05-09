import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import AdminResultTable from "../components/AdminResultTable";
import AdminRoomPublisher from "../components/AdminRoomPublisher";

const initialMatch = {
  title: "",
  game: "Free Fire",
  entryFee: 20,
  prizePool: 200,
  startTime: "",
  status: "Upcoming",
  maxPlayers: 100,
};

const AdminPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [walletOverview, setWalletOverview] = useState(null);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [matchForm, setMatchForm] = useState(initialMatch);
  const [resultMatchId, setResultMatchId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishingMatchId, setPublishingMatchId] = useState(null);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const canAccess = user?.role === "admin";

  const load = async () => {
    const [statsRes, matchesRes, usersRes, regRes, walletRes, withdrawRes] = await Promise.all([
      api.getAdminStats(),
      api.getMatches("limit=30"),
      api.getAdminUsers("limit=12"),
      api.getAdminRegistrations("limit=20"),
      api.getAdminWalletOverview(),
      api.getAdminWithdrawRequests("limit=50"),
    ]);
    // eslint-disable-next-line no-console
    console.log("Admin stats received:", statsRes);
    // Map the API response to the expected stats format
    const mappedStats = {
      users: statsRes.totalUsers,
      matches: statsRes.totalMatches,
      registrations: statsRes.totalRegistrations,
      results: statsRes.totalResults,
    };
    // eslint-disable-next-line no-console
    console.log("Mapped stats for display:", mappedStats);
    setStats(mappedStats);
    setMatches(matchesRes.data || []);
    setUsers(usersRes.data || []);
    setRegistrations(regRes.data || []);
    setWalletOverview(walletRes);
    setWithdrawRequests(withdrawRes.data || []);
  };

  useEffect(() => {
    if (!canAccess) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((error) => toast.error(error.message));
  }, [canAccess]);

  const createMatch = async (event) => {
    event.preventDefault();
    try {
      await api.createMatch({
        ...matchForm,
        entryFee: Number(matchForm.entryFee),
        prizePool: Number(matchForm.prizePool),
        maxPlayers: Number(matchForm.maxPlayers),
        startTime: new Date(matchForm.startTime).toISOString(),
      });
      setMatchForm(initialMatch);
      toast.success("Tournament created");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeMatch = async (matchId) => {
    try {
      await api.deleteMatch(matchId);
      toast.success("Tournament deleted");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const publishResult = async (rows) => {
    try {
      if (!resultMatchId) {
        toast.error("Select a match first.");
        return;
      }
      const hasInvalid = rows.some(
        (row) =>
          !row.email.trim() ||
          Number(row.kills) < 0 ||
          Number(row.score) < 0 ||
          Number(row.winnings) < 0
      );
      if (hasInvalid) {
        toast.error("Please fill valid email/score/kills/winnings.");
        return;
      }
      setPublishing(true);
      await api.publishAdminResults({
        matchId: resultMatchId,
        players: rows.map((row) => ({
          email: row.email.trim().toLowerCase(),
          kills: Number(row.kills),
          score: Number(row.score),
          rank: Number(row.rank),
          winnings: Number(row.winnings),
        })),
      });
      toast.success("Results published");
      setResultMatchId("");
      load();
    } catch (error) {
      toast.error(error.message || "Invalid payload or failed publish");
    } finally {
      setPublishing(false);
    }
  };

  const approveWithdraw = async (requestId) => {
    try {
      await api.approveWithdrawRequest(requestId);
      toast.success("Withdraw approved");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const rejectWithdraw = async (requestId) => {
    try {
      await api.rejectWithdrawRequest(requestId);
      toast.success("Withdraw rejected and refunded");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const searchUsers = async (query) => {
    setSearchingUsers(true);
    try {
      const res = await api.getAdminUsers(`limit=10&search=${encodeURIComponent(query)}`);
      setSearchResults(res.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to search users");
    } finally {
      setSearchingUsers(false);
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    try {
      if (!notificationTitle.trim() || !notificationMessage.trim()) {
        toast.error("Please enter title and message.");
        return;
      }
      if (recipientType === "specific" && !selectedUser) {
        toast.error("Please select a user.");
        return;
      }

      await api.sendNotification({
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
        recipientType,
        userId: recipientType === "specific" ? selectedUser?._id : undefined,
      });

      toast.success("Notification sent successfully.");
      setNotificationTitle("");
      setNotificationMessage("");
      setRecipientType("all");
      setUserSearch("");
      setSearchResults([]);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const verifyRegistration = async (registrationId) => {
    try {
      await api.verifyAdminPlayer(registrationId, { notes: "Verified by admin" });
      toast.success("Player verified successfully");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const markSuspiciousRegistration = async (registrationId) => {
    try {
      await api.markAdminPlayerSuspicious(registrationId, { notes: "Marked suspicious by admin" });
      toast.success("Player marked suspicious");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!canAccess) {
    return (
      <main className="page">
        <section className="card">
          <h2>Admin Panel</h2>
          <p className="state-text">Access denied. Register/login with admin email.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <h2>Admin Dashboard</h2>
      <section className="grid">
        <article className="card stat-card"><h4>Matches</h4><p>{stats?.matches ?? 0}</p></article>
        <article className="card stat-card"><h4>Users</h4><p>{stats?.users ?? 0}</p></article>
        <article className="card stat-card"><h4>Registrations</h4><p>{stats?.registrations ?? 0}</p></article>
        <article className="card stat-card"><h4>Results</h4><p>{stats?.results ?? 0}</p></article>
      </section>

      <section className="card">
        <h3>Create Tournament</h3>
        <form className="form-grid" onSubmit={createMatch}>
          <input placeholder="Title" value={matchForm.title} onChange={(e) => setMatchForm({ ...matchForm, title: e.target.value })} required />
          <select value={matchForm.game} onChange={(e) => setMatchForm({ ...matchForm, game: e.target.value })}>
            <option>Free Fire</option>
            <option>BGMI</option>
          </select>
          <input type="number" placeholder="Entry fee" value={matchForm.entryFee} onChange={(e) => setMatchForm({ ...matchForm, entryFee: e.target.value })} required />
          <input type="number" placeholder="Prize pool" value={matchForm.prizePool} onChange={(e) => setMatchForm({ ...matchForm, prizePool: e.target.value })} required />
          <input type="datetime-local" value={matchForm.startTime} onChange={(e) => setMatchForm({ ...matchForm, startTime: e.target.value })} required />
          <input type="number" placeholder="Max players" value={matchForm.maxPlayers} onChange={(e) => setMatchForm({ ...matchForm, maxPlayers: e.target.value })} required />
          <button className="btn btn-primary" type="submit">Create</button>
        </form>
      </section>

      <section className="card">
        <h3>Send Notification</h3>
        <form className="form-grid" onSubmit={sendNotification}>
          <input
            placeholder="Notification Title"
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Notification Message"
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            rows={4}
            required
          />
          <div>
            <label htmlFor="recipientType">Recipient</label>
            <select
              id="recipientType"
              value={recipientType}
              onChange={(e) => {
                setRecipientType(e.target.value);
                if (e.target.value === "all") {
                  setSelectedUser(null);
                  setUserSearch("");
                  setSearchResults([]);
                }
              }}
            >
              <option value="all">All Users</option>
              <option value="specific">Specific User</option>
            </select>
          </div>
          {recipientType === "specific" && (
            <>
              <input
                placeholder="Search username or email"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <button
                className="btn btn-secondary"
                type="button"
                disabled={!userSearch.trim() || searchingUsers}
                onClick={() => searchUsers(userSearch.trim())}
              >
                {searchingUsers ? "Searching..." : "Search Users"}
              </button>
              <select
                value={selectedUser?._id || ""}
                onChange={(e) => {
                  const selected = searchResults.find((u) => u._id === e.target.value);
                  setSelectedUser(selected || null);
                }}
              >
                <option value="">Select user</option>
                {searchResults.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </>
          )}
          <button className="btn btn-primary" type="submit">
            Send Notification
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Manage Tournaments</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Status</th><th>Prize</th><th>Action</th></tr></thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match._id}>
                  <td>{match.title}</td>
                  <td>{match.status}</td>
                  <td>INR {match.prizePool}</td>
                  <td>
                    <button className="btn btn-secondary" type="button" onClick={() => removeMatch(match._id)}>Delete</button>
                    <button 
                      className="btn btn-primary" 
                      type="button" 
                      onClick={() => setPublishingMatchId(publishingMatchId === match._id ? null : match._id)}
                      style={{ marginLeft: '8px' }}
                    >
                      📢 Room
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {publishingMatchId && (
        <section className="card">
          <AdminRoomPublisher
            matchId={publishingMatchId}
            token={user?.token}
            onSuccess={() => {
              setPublishingMatchId(null);
              load(); // Refresh matches to show updated status
              toast.success('Room published successfully!');
            }}
          />
        </section>
      )}

      <section className="card">
        <h3>Publish Results</h3>
        <select value={resultMatchId} onChange={(e) => setResultMatchId(e.target.value)}>
          <option value="">Select match</option>
          {matches.map((match) => (
            <option key={match._id} value={match._id}>
              {match.title} ({match.game})
            </option>
          ))}
        </select>
        <p className="muted">Rank is auto-calculated from score, then kills (descending).</p>
        <AdminResultTable onPublish={publishResult} loading={publishing} />
      </section>

      <section className="grid two-col">
        <article className="card">
          <h3>Users</h3>
          <ul className="list">
            {users.map((u) => (
              <li key={u._id}>
                {u.username} - {u.email}
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Registrations</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Game</th>
                  <th>Match</th>
                  <th>Verified</th>
                  <th>Details</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan="6">No registrations found.</td>
                  </tr>
                ) : (
                  registrations.map((r) => (
                    <tr key={r._id}>
                      <td>
                        {r.user?.username || "Unknown"}
                        <br />
                        <span className="muted">{r.user?.email}</span>
                      </td>
                      <td>{r.match?.game}</td>
                      <td>{r.match?.title}</td>
                      <td>{r.isPlayerVerified ? "Yes" : "No"}</td>
                      <td>
                        {r.user?.bgmiName && <div>BGMI: {r.user.bgmiName}</div>}
                        {r.user?.bgmiUid && <div>UID: {r.user.bgmiUid}</div>}
                        {r.user?.freeFireName && <div>Free Fire: {r.user.freeFireName}</div>}
                        {r.user?.freeFireUid && <div>UID: {r.user.freeFireUid}</div>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => verifyRegistration(r._id)}
                            disabled={r.isPlayerVerified}
                          >
                            Verify
                          </button>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => markSuspiciousRegistration(r._id)}
                          >
                            Suspicious
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="card">
        <h3>Wallet Overview</h3>
        <p>Total Wallet Balance: INR {walletOverview?.totalWalletBalance ?? 0}</p>
      </section>

      <section className="card">
        <h3>Withdraw Requests</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>UPI ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawRequests.length === 0 ? (
                <tr>
                  <td colSpan="5">No withdraw requests found.</td>
                </tr>
              ) : (
                withdrawRequests.map((r) => (
                  <tr key={r._id}>
                    <td>{r.user?.username || "User"}</td>
                    <td>₹{r.amount}</td>
                    <td>{r.upiId}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === "pending" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-secondary" type="button" onClick={() => approveWithdraw(r._id)}>
                            Approve
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={() => rejectWithdraw(r._id)}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default AdminPage;
