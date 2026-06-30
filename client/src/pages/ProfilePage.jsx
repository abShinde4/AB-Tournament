import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import AddMoneyModal from "../components/AddMoneyModal";
import WithdrawModal from "../components/WithdrawModal";
import Skeleton from "../components/Skeleton";
import { useAuth } from "../context/useAuth";
import { buildAvatarUrl } from "../utils/avatarUrl";

const HistoryList = ({ items, emptyText, renderItem }) => (
  <div className="v2-list">
    {items.length === 0 ? (
      <p className="v2-empty">{emptyText}</p>
    ) : (
      items.map(renderItem)
    )}
  </div>
);

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);
  const walletRef = useRef(null);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    bgmiUid: user?.bgmiUid || "",
  });
  const [gamingForm, setGamingForm] = useState({
    bgmiName: user?.bgmiName || "",
    bgmiUid: user?.bgmiUid || "",
    freeFireName: user?.freeFireName || "",
    freeFireUid: user?.freeFireUid || "",
  });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [gamingLoading, setGamingLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance ?? 0);
  const [stats, setStats] = useState({ totalMatchesJoined: 0, totalWins: 0, totalLosses: 0 });
  const [joinedMatches, setJoinedMatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [walletRequests, setWalletRequests] = useState([]);
  const [matchPayments, setMatchPayments] = useState([]);
  const [matchJoinRequests, setMatchJoinRequests] = useState([]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return "N/A";
    return new Date(user.createdAt).toLocaleDateString();
  }, [user?.createdAt]);

  const refundTransactions = useMemo(
    () => transactions.filter((tx) => tx.source === "withdraw_refund"),
    [transactions]
  );

  const loadAll = async () => {
    const [dashboardRes, txRes, withdrawalsRes, walletRequestsRes, matchPaymentsRes, joinRequestsRes, meRes] =
      await Promise.all([
        api.getDashboard(),
        api.getTransactions("limit=30"),
        api.getWithdrawals("limit=30"),
        api.getMyWalletPaymentRequests(),
        api.getMyTournamentPayments(),
        api.getMyMatchJoinRequests(),
        api.refreshMe(),
      ]);

    setWalletBalance(meRes.user?.walletBalance ?? dashboardRes.walletBalance ?? 0);
    setStats({
      totalMatchesJoined: dashboardRes.stats?.totalMatchesJoined || 0,
      totalWins: dashboardRes.stats?.totalWins || 0,
      totalLosses: Math.max(
        (dashboardRes.stats?.totalMatchesJoined || 0) - (dashboardRes.stats?.totalWins || 0),
        0
      ),
    });
    setJoinedMatches(dashboardRes.joinedMatches || []);
    setTransactions(txRes.data || []);
    setWithdrawals(withdrawalsRes.data || []);
    setWalletRequests(walletRequestsRes.data || []);
    setMatchPayments(matchPaymentsRes.data || []);
    setMatchJoinRequests(joinRequestsRes.data || []);
    setUser((prev) => ({
      ...prev,
      ...meRes.user,
      walletBalance: meRes.user?.walletBalance ?? prev?.walletBalance,
    }));
    setLoading(false);
  };

  useEffect(() => {
    loadAll().catch((err) => toast.error(err.message));
    const interval = setInterval(() => loadAll().catch(() => {}), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProfileForm({
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      bgmiUid: user?.bgmiUid || "",
    });
    setGamingForm({
      bgmiName: user?.bgmiName || "",
      bgmiUid: user?.bgmiUid || "",
      freeFireName: user?.freeFireName || "",
      freeFireUid: user?.freeFireUid || "",
    });
  }, [user?.fullName, user?.phoneNumber, user?.bgmiUid, user?.bgmiName, user?.freeFireName, user?.freeFireUid]);

  useEffect(() => {
    if (window.location.hash === "#wallet" && walletRef.current) {
      walletRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const onProfileSubmit = async (event) => {
    event.preventDefault();
    try {
      setProfileLoading(true);
      const payload = {
        fullName: profileForm.fullName.trim(),
        bgmiUid: profileForm.bgmiUid.trim(),
      };
      if (profileForm.phoneNumber.trim()) {
        payload.phoneNumber = profileForm.phoneNumber.replace(/\D/g, "").slice(-10);
      }
      const res = await api.updateMe(payload);
      setUser(res.user);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const onGamingSubmit = async (event) => {
    event.preventDefault();
    try {
      setGamingLoading(true);
      const res = await api.updateMe(gamingForm);
      setUser(res.user);
      toast.success("Gaming profile updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGamingLoading(false);
    }
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      toast.error("Only jpeg, jpg, png images are allowed.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be <= 2MB.");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const onUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      const res = await api.uploadAvatar(selectedFile);
      setUser(res.user);
      setSelectedFile(null);
      setPreviewUrl("");
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const avatarSrc = previewUrl ? previewUrl : user?.avatar ? buildAvatarUrl(user.avatar) : "";

  if (loading) {
    return (
      <main className="page v2-page">
        <Skeleton lines={8} />
      </main>
    );
  }

  return (
    <main className="page v2-page">
      <h2 className="v2-page-title">👤 Profile</h2>

      <section className="card profile-v2-header-wrap">
        <div className="profile-v2-header">
          <div className="avatar-wrap">
            {avatarSrc ? (
              <img
                className="profile-v2-avatar"
                src={avatarSrc}
                alt="Avatar"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/default-avatar.svg";
                }}
              />
            ) : (
              <div className="avatar-placeholder profile-v2-avatar" aria-label="Avatar placeholder">
                {(user?.fullName || user?.username || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{user?.fullName || user?.username || "User"}</h3>
            <p className="v2-muted">
              {user?.phoneNumber ? `+91 ${user.phoneNumber}` : user?.email || "Add phone in profile"}
            </p>
            {user?.bgmiUid && <p className="v2-muted">BGMI UID: {user.bgmiUid}</p>}
            <p className="v2-muted">Member since {memberSince}</p>
          </div>
        </div>
        <div className="profile-actions v2-wallet-actions" style={{ marginTop: "1rem" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={onFileChange}
            style={{ display: "none" }}
          />
          <button className="btn btn-secondary v2-btn-full" type="button" onClick={onPickFile}>
            Change Avatar
          </button>
          <button
            className="btn btn-primary v2-btn-full"
            type="button"
            disabled={!selectedFile || uploading}
            onClick={onUpload}
          >
            {uploading ? "Uploading..." : selectedFile ? "Save Avatar" : "Upload Avatar"}
          </button>
        </div>
      </section>

      <div className="profile-v2-stats">
        <div className="profile-v2-stat card">
          <strong>{stats.totalMatchesJoined}</strong>
          <span>Joined</span>
        </div>
        <div className="profile-v2-stat card">
          <strong>{stats.totalWins}</strong>
          <span>Wins</span>
        </div>
        <div className="profile-v2-stat card">
          <strong>{stats.totalLosses}</strong>
          <span>Losses</span>
        </div>
      </div>

      <section id="wallet" ref={walletRef} className="card v2-section v2-wallet-balance">
        <h3>Wallet Balance</h3>
        <p className="v2-wallet-amount">₹{walletBalance}</p>
        <div className="v2-wallet-actions">
          <button className="btn btn-primary v2-btn-full" type="button" onClick={() => setShowRecharge(true)}>
            Add Money
          </button>
          <button className="btn btn-secondary v2-btn-full" type="button" onClick={() => setShowWithdraw(true)}>
            Withdraw
          </button>
        </div>
      </section>

      <section className="card v2-section">
        <h3>Recharge History</h3>
        <HistoryList
          items={walletRequests}
          emptyText="No recharge requests yet."
          renderItem={(req) => (
            <div key={req._id} className="v2-list-item">
              <div>
                <strong>₹{req.amount}</strong>
                <span className="v2-muted">UTR: {req.utr}</span>
              </div>
              <span className={`status-badge status-${req.status}`}>{req.status}</span>
            </div>
          )}
        />
      </section>

      <section className="card v2-section">
        <h3>Withdraw History</h3>
        <HistoryList
          items={withdrawals}
          emptyText="No withdraw requests yet."
          renderItem={(w) => (
            <div key={w._id} className="v2-list-item">
              <div>
                <strong>₹{w.amount}</strong>
                <span className="v2-muted">{w.upiId || "UPI"}</span>
              </div>
              <span className={`status-badge status-${w.status}`}>{w.status}</span>
            </div>
          )}
        />
      </section>

      <section className="card v2-section">
        <h3>Match Payment History</h3>
        <HistoryList
          items={matchPayments}
          emptyText="No tournament payments yet."
          renderItem={(p) => (
            <div key={p._id} className="v2-list-item">
              <div>
                <strong>{p.match?.title || "Tournament"}</strong>
                <span className="v2-muted">UTR: {p.utr || "—"}</span>
              </div>
              <span className={`status-badge status-${p.status}`}>{p.status}</span>
            </div>
          )}
        />
      </section>

      <section className="card v2-section">
        <h3>Match Join Requests</h3>
        <HistoryList
          items={matchJoinRequests}
          emptyText="No match join requests yet."
          renderItem={(req) => (
            <div key={req._id} className="v2-list-item">
              <div>
                <strong>{req.match?.title || "Match"}</strong>
                <span className="v2-muted">₹{req.entryFee}</span>
              </div>
              <span className={`status-badge status-${req.status}`}>{req.status}</span>
            </div>
          )}
        />
      </section>

      <section className="card v2-section">
        <h3>Refund History</h3>
        <HistoryList
          items={refundTransactions}
          emptyText="No refunds yet."
          renderItem={(tx) => (
            <div key={tx._id} className="v2-list-item">
              <div>
                <strong>{tx.description || "Withdraw refund"}</strong>
                <span className="v2-muted">{new Date(tx.createdAt).toLocaleString()}</span>
              </div>
              <span className="v2-credit">+₹{tx.amount}</span>
            </div>
          )}
        />
      </section>

      <section className="card v2-section">
        <h3>All Transactions</h3>
        <HistoryList
          items={transactions}
          emptyText="No transactions yet."
          renderItem={(tx) => (
            <div key={tx._id} className="v2-list-item">
              <div>
                <strong>{tx.description || tx.source}</strong>
                <span className="v2-muted">{new Date(tx.createdAt).toLocaleString()}</span>
              </div>
              <span className={tx.type === "credit" ? "v2-credit" : "v2-debit"}>
                {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
              </span>
            </div>
          )}
        />
      </section>

      <section className="card v2-section">
        <h3>Joined Matches</h3>
        <HistoryList
          items={joinedMatches}
          emptyText="No joined matches yet."
          renderItem={(match) => (
            <div key={match.id} className="v2-list-item">
              <div>
                <strong>{match.title}</strong>
                <span className="v2-muted">
                  {match.game} · {match.status}
                </span>
              </div>
              <span className="v2-muted">{match.startTime ? new Date(match.startTime).toLocaleDateString() : "—"}</span>
            </div>
          )}
        />
      </section>

      <section className="card v2-section">
        <h3>Profile Details</h3>
        <form onSubmit={onProfileSubmit} className="v2-form">
          <label className="v2-label">
            Full Name
            <input
              className="v2-input"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
            />
          </label>
          <label className="v2-label">
            Phone Number
            <input
              className="v2-input"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit number"
              value={profileForm.phoneNumber}
              onChange={(e) =>
                setProfileForm((p) => ({
                  ...p,
                  phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
            />
          </label>
          <label className="v2-label">
            BGMI UID
            <input
              className="v2-input"
              value={profileForm.bgmiUid}
              onChange={(e) => setProfileForm((p) => ({ ...p, bgmiUid: e.target.value }))}
            />
          </label>
          {user?.email && <p className="v2-muted">Email (legacy): {user.email}</p>}
          <button className="btn btn-primary v2-btn-full" type="submit" disabled={profileLoading}>
            {profileLoading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      <section className="card v2-section">
        <h3>Gaming Identity</h3>
        <form onSubmit={onGamingSubmit} className="v2-form">
          <label className="v2-label">
            BGMI Name
            <input
              className="v2-input"
              value={gamingForm.bgmiName}
              onChange={(e) => setGamingForm((p) => ({ ...p, bgmiName: e.target.value }))}
            />
          </label>
          <label className="v2-label">
            BGMI UID
            <input
              className="v2-input"
              value={gamingForm.bgmiUid}
              onChange={(e) => setGamingForm((p) => ({ ...p, bgmiUid: e.target.value }))}
            />
          </label>
          <label className="v2-label">
            Free Fire Name
            <input
              className="v2-input"
              value={gamingForm.freeFireName}
              onChange={(e) => setGamingForm((p) => ({ ...p, freeFireName: e.target.value }))}
            />
          </label>
          <label className="v2-label">
            Free Fire UID
            <input
              className="v2-input"
              value={gamingForm.freeFireUid}
              onChange={(e) => setGamingForm((p) => ({ ...p, freeFireUid: e.target.value }))}
            />
          </label>
          <button className="btn btn-primary v2-btn-full" type="submit" disabled={gamingLoading}>
            {gamingLoading ? "Saving..." : "Save Gaming Profile"}
          </button>
        </form>
      </section>

      <AddMoneyModal
        isOpen={showRecharge}
        onClose={() => {
          setShowRecharge(false);
          loadAll();
        }}
      />
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => {
          setShowWithdraw(false);
          loadAll();
        }}
        existingPending={withdrawals.filter((w) => w.status === "pending")}
      />
    </main>
  );
};

export default ProfilePage;
