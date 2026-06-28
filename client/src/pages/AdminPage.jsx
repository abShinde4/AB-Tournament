import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, API_BASE_URL } from "../api";
import { useAuth } from "../context/useAuth";
import AdminResultTable from "../components/AdminResultTable";
import AdminRoomPublisher from "../components/AdminRoomPublisher";
import HighlightForm from "../components/HighlightForm";
import SquadTeamsSection from "../components/admin/SquadTeamsSection";

const initialMatch = {
  title: "",
  game: "Free Fire",
  entryFee: 20,
  prizePool: 200,
  startTime: "",
  status: "Upcoming",
  maxPlayers: 100,
  matchType: "",
  map: "",
  perspective: "",
};

const AdminPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [walletOverview, setWalletOverview] = useState(null);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [walletPaymentRequests, setWalletPaymentRequests] = useState([]);
  const [matchJoinRequests, setMatchJoinRequests] = useState([]);
  const [matchForm, setMatchForm] = useState(initialMatch);
  const [resultMatchId, setResultMatchId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishingMatchId, setPublishingMatchId] = useState(null);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [results, setResults] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [highlightLoading, setHighlightLoading] = useState(false);
  const [showHighlightForm, setShowHighlightForm] = useState(false);

  const canAccess = user?.role === "admin";

  const load = async () => {
    const [statsRes, matchesRes, usersRes, regRes, walletRes, withdrawRes, paymentRes, walletPaymentRes, matchJoinRes, resultsRes, highlightsRes] =
      await Promise.all([
      api.getAdminStats(),
      api.getMatches("limit=30"),
      api.getAdminUsers("limit=12"),
      api.getAdminRegistrations("limit=20"),
      api.getAdminWalletOverview(),
      api.getAdminWithdrawRequests("limit=50"),
      api.getAdminPaymentRequests("limit=50&status=pending"),
      api.getAdminWalletPaymentRequests("limit=50&status=pending"),
      api.getAdminMatchJoinRequests("limit=50&status=pending"),
      api.getResults("limit=100"),
      api.getHighlights("limit=20"),
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
    setPaymentRequests(paymentRes.data || []);
    setWalletPaymentRequests(walletPaymentRes.data || []);
    setMatchJoinRequests(matchJoinRes.data || []);
    setResults(resultsRes.data || []);
    setHighlights(highlightsRes.data || []);
  };

  useEffect(() => {
    if (!canAccess) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((error) => toast.error(error.message));
  }, [canAccess]);

  const createMatch = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...matchForm,
        entryFee: Number(matchForm.entryFee),
        prizePool: Number(matchForm.prizePool),
        maxPlayers: Number(matchForm.maxPlayers),
        startTime: new Date(matchForm.startTime).toISOString(),
      };
      if (!payload.matchType) delete payload.matchType;
      if (!payload.map) delete payload.map;
      if (!payload.perspective) delete payload.perspective;

      if (editingMatchId) {
        await api.updateMatch(editingMatchId, payload);
        toast.success("Tournament updated");
      } else {
        await api.createMatch(payload);
        toast.success("Tournament created");
      }

      setMatchForm(initialMatch);
      setEditingMatchId(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const editMatch = (match) => {
    setMatchForm({
      title: match.title || "",
      game: match.game || "Free Fire",
      entryFee: match.entryFee ?? 20,
      prizePool: match.prizePool ?? 200,
      startTime: match.startTime ? new Date(match.startTime).toISOString().slice(0, 16) : "",
      status: match.status || "Upcoming",
      maxPlayers: match.maxPlayers ?? 100,
      matchType: match.matchType || "",
      map: match.map || "",
      perspective: match.perspective || "",
    });
    setEditingMatchId(match._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setMatchForm(initialMatch);
    setEditingMatchId(null);
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

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

  const approvePayment = async (requestId) => {
    try {
      await api.approvePaymentRequest(requestId);
      toast.success("Payment approved — user joined tournament");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const approveWalletPayment = async (requestId) => {
    try {
      await api.approveWalletPaymentRequest(requestId);
      toast.success("Payment Approved — Wallet Credited");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const approveMatchJoin = async (requestId) => {
    try {
      await api.approveMatchJoinRequest(requestId);
      toast.success("Match Joined Successfully");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const rejectMatchJoin = async (requestId) => {
    try {
      await api.rejectMatchJoinRequest(requestId, { reason: "Join request could not be approved" });
      toast.success("Join request rejected");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const rejectPayment = async (requestId) => {
    try {
      await api.rejectPaymentRequest(requestId, { reason: "Payment could not be verified" });
      toast.success("Payment rejected");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const rejectWalletPayment = async (requestId) => {
    try {
      await api.rejectWalletPaymentRequest(requestId, { reason: "Payment could not be verified" });
      toast.success("Payment Rejected");
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

  const handleCreateHighlight = async (formData) => {
    setHighlightLoading(true);
    try {
      const payload = {
        resultId: formData.resultId || undefined,
        matchId: formData.matchId || undefined,
        userId: formData.userId || undefined,
        winnerName: formData.winnerName?.trim() || undefined,
        teamName: formData.teamName?.trim() || undefined,
        prizeAmount:
          formData.prizeAmount === "" || formData.prizeAmount === null
            ? undefined
            : Number(formData.prizeAmount),
        matchType: formData.matchType?.trim() || undefined,
        map: formData.map?.trim() || undefined,
        youtubeUrl: formData.youtubeUrl?.trim() || undefined,
        instagramUrl: formData.instagramUrl?.trim() || undefined,
        thumbnailUrl: formData.thumbnailUrl?.trim() || undefined,
        description: formData.description?.trim() || undefined,
      };
      await api.createUpdateHighlight(payload);
      toast.success("Winner highlight added successfully!");
      setShowHighlightForm(false);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setHighlightLoading(false);
    }
  };

  const handleDeleteHighlight = async (highlightId) => {
    if (!window.confirm("Are you sure you want to delete this highlight?")) return;
    try {
      await api.deleteHighlight(highlightId);
      toast.success("Highlight deleted successfully");
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
          <select value={matchForm.matchType} onChange={(e) => setMatchForm({ ...matchForm, matchType: e.target.value })}>
            <option value="">Match Type</option>
            <option value="Solo">Solo</option>
            <option value="Duo">Duo</option>
            <option value="Squad">Squad</option>
            <option value="TDM">TDM</option>
            <option value="Arena">Arena</option>
            <option value="Custom">Custom</option>
          </select>
          <select value={matchForm.map} onChange={(e) => setMatchForm({ ...matchForm, map: e.target.value })}>
            <option value="">Map</option>
            <option value="Erangel">Erangel</option>
            <option value="Miramar">Miramar</option>
            <option value="Sanhok">Sanhok</option>
            <option value="Vikendi">Vikendi</option>
            <option value="Livik">Livik</option>
            <option value="Nusa">Nusa</option>
            <option value="Random">Random</option>
          </select>
          <select value={matchForm.perspective} onChange={(e) => setMatchForm({ ...matchForm, perspective: e.target.value })}>
            <option value="">Perspective</option>
            <option value="TPP">TPP</option>
            <option value="FPP">FPP</option>
          </select>
          <input type="number" placeholder="Entry fee" value={matchForm.entryFee} onChange={(e) => setMatchForm({ ...matchForm, entryFee: e.target.value })} required />
          <input type="number" placeholder="Prize pool" value={matchForm.prizePool} onChange={(e) => setMatchForm({ ...matchForm, prizePool: e.target.value })} required />
          <input type="datetime-local" value={matchForm.startTime} onChange={(e) => setMatchForm({ ...matchForm, startTime: e.target.value })} required />
          <input type="number" placeholder="Max players" value={matchForm.maxPlayers} onChange={(e) => setMatchForm({ ...matchForm, maxPlayers: e.target.value })} required />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="submit">
              {editingMatchId ? "Update Tournament" : "Create"}
            </button>
            {editingMatchId && (
              <button className="btn btn-secondary" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
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
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => editMatch(match)}
                      style={{ marginLeft: '8px' }}
                    >
                      Edit
                    </button>
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

      <section className="card">
        <h3>Winner Highlights</h3>
        <button 
          className="btn btn-primary" 
          type="button"
          onClick={() => setShowHighlightForm(!showHighlightForm)}
          style={{ marginBottom: "16px" }}
        >
          {showHighlightForm ? "Cancel" : "➕ Add Winner Highlight"}
        </button>

        {showHighlightForm && (
          <HighlightForm 
            results={results}
            onSubmit={handleCreateHighlight}
            isLoading={highlightLoading}
            onCancel={() => setShowHighlightForm(false)}
          />
        )}

        <div style={{ marginTop: "20px" }}>
          <h4>Existing Highlights</h4>
          {highlights.length === 0 ? (
            <p className="state-text">No highlights added yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Winner</th>
                    <th>Team</th>
                    <th>Prize</th>
                    <th>Match</th>
                    <th>YouTube</th>
                    <th>Instagram</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {highlights.map((h) => (
                    <tr key={h._id}>
                      <td>{h.winnerName}</td>
                      <td>{h.teamName}</td>
                      <td>₹{h.prizeAmount}</td>
                      <td>{h.match?.title || "—"}</td>
                      <td>{h.youtubeUrl ? "✓" : "—"}</td>
                      <td>{h.instagramUrl ? "✓" : "—"}</td>
                      <td>
                        <button 
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => handleDeleteHighlight(h._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
        <h3>Payment Verification</h3>
        <p className="muted">Approve UTR payments to register users for tournaments.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Tournament</th>
                <th>Amount</th>
                <th>UTR</th>
                <th>Screenshot</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paymentRequests.length === 0 ? (
                <tr>
                  <td colSpan="7">No pending payment requests.</td>
                </tr>
              ) : (
                paymentRequests.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.user?.username || "User"}
                      <br />
                      <span className="muted">{p.user?.email}</span>
                    </td>
                    <td>{p.tournament?.title || "—"}</td>
                    <td>₹{p.paymentAmount}</td>
                    <td>{p.utr}</td>
                    <td>
                      {p.paymentScreenshot ? (
                        <a
                          href={`${apiOrigin}${p.paymentScreenshot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{p.paymentStatus}</td>
                    <td>
                      {p.paymentStatus === "pending" ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="btn btn-secondary" type="button" onClick={() => approvePayment(p._id)}>
                            Approve
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={() => rejectPayment(p._id)}>
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

      <section className="card">
        <h3>Wallet Recharge Requests</h3>
        <p className="muted">Manual Payment Verification — approve UPI wallet top-ups.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>User ID</th>
                <th>Amount</th>
                <th>UTR</th>
                <th>Balance</th>
                <th>Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {walletPaymentRequests.length === 0 ? (
                <tr>
                  <td colSpan="8">No pending wallet recharge requests.</td>
                </tr>
              ) : (
                walletPaymentRequests.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.user?.username || p.username || "User"}
                      <br />
                      <span className="muted">{p.user?.email}</span>
                    </td>
                    <td className="muted">{String(p.user?._id || "").slice(-8)}</td>
                    <td>₹{p.amount}</td>
                    <td>{p.utr}</td>
                    <td>₹{p.user?.walletBalance ?? 0}</td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${p.status}`}>{p.status}</span>
                    </td>
                    <td>
                      {p.status === "pending" ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="btn btn-secondary" type="button" onClick={() => approveWalletPayment(p._id)}>
                            Approve Recharge
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={() => rejectWalletPayment(p._id)}>
                            Reject Recharge
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

      <section className="card">
        <h3>Match Join Requests</h3>
        <p className="muted">Approve wallet-based tournament entries.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Tournament</th>
                <th>Entry Fee</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {matchJoinRequests.length === 0 ? (
                <tr>
                  <td colSpan="7">No pending match join requests.</td>
                </tr>
              ) : (
                matchJoinRequests.map((jr) => (
                  <tr key={jr._id}>
                    <td>
                      {jr.user?.username || jr.username}
                      <br />
                      <span className="muted">{jr.user?.email}</span>
                    </td>
                    <td>{jr.match?.title || "—"}</td>
                    <td>₹{jr.entryFee}</td>
                    <td>₹{jr.user?.walletBalance ?? 0}</td>
                    <td>
                      <span className={`status-badge status-${jr.status}`}>{jr.status}</span>
                    </td>
                    <td>{new Date(jr.createdAt).toLocaleString()}</td>
                    <td>
                      {jr.status === "pending" ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="btn btn-secondary" type="button" onClick={() => approveMatchJoin(jr._id)}>
                            Approve Join
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={() => rejectMatchJoin(jr._id)}>
                            Reject Join
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

      <SquadTeamsSection matches={matches} />
    </main>
  );
};

export default AdminPage;
