import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import Skeleton from "../components/Skeleton";
import Countdown from "../components/Countdown";
import { PlayerCountBar } from "../components/PlayerCountBar";
import WalletRechargeModal from "../components/WalletRechargeModal";
import SquadTeamActions from "../components/squad/SquadTeamActions";
import SquadTeamCardStats from "../components/squad/SquadTeamCardStats";
import "../components/squad/squad-team.css";

const formatCountdown = (msLeft) => {
  if (msLeft <= 0) return "Match Started";
  const totalSeconds = Math.floor(msLeft / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const MATCH_TYPES = ["Solo", "Duo", "Squad", "TDM", "Arena", "Custom"];
const MAP_NAMES = ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa", "Random"];
const PERSPECTIVES = ["TPP", "FPP"];

const TournamentPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState("");
  const [now, setNow] = useState(Date.now());
  const [activeFilter, setActiveFilter] = useState("all");
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [roomUnlockNotified, setRoomUnlockNotified] = useState({});
  const [walletModal, setWalletModal] = useState({ open: false, amount: 100, title: "Pay Now" });
  const { isAuthenticated, setUser, user } = useAuth();
  const walletBalance = user?.walletBalance ?? 0;

  const loadMatches = async () => {
    const res = await api.getMatches("limit=25");
    setMatches(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMatches().catch(() => {
      setLoading(false);
      toast.error("Unable to load matches.");
    });
    const minuteRefresh = setInterval(() => {
      loadMatches().catch(() => {});
    }, 60 * 1000);
    const secondTicker = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(minuteRefresh);
      clearInterval(secondTicker);
    };
  }, []);

  useEffect(() => {
    if (!matches.length) return;
    const newlyUnlocked = {};

    matches.forEach((match) => {
      const unlockTime = match.roomUnlockedAt ? new Date(match.roomUnlockedAt).getTime() : null;
      const isUnlocked = unlockTime && now >= unlockTime && match.isRoomVisible;

      if (isUnlocked && !roomUnlockNotified[match._id]) {
        newlyUnlocked[match._id] = true;
        toast.success(`Room unlocked for ${match.title}`);
      }
    });

    if (Object.keys(newlyUnlocked).length) {
      setRoomUnlockNotified((prev) => ({ ...prev, ...newlyUnlocked }));
    }
  }, [matches, now, roomUnlockNotified]);

  const handleCopy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  };

  const handleJoin = async (matchId) => {
    if (!isAuthenticated) {
      toast.error("Please login first.");
      return;
    }
    try {
      setLoadingId(matchId);
      await api.joinMatch(matchId);
      toast.success("Join request submitted. Awaiting admin approval.");
      await loadMatches();
    } catch (error) {
      const msg = error.message || "Failed to join match.";
      if (msg.toLowerCase().includes("insufficient")) {
        toast.error("Insufficient Wallet Balance");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoadingId("");
    }
  };

  const bgmiMatches = matches.filter((m) => m.game === "BGMI");
  const ffMatches = matches.filter((m) => m.game === "Free Fire");
  const showBGMI = activeFilter === "all" || activeFilter === "bgmi";
  const showFF = activeFilter === "all" || activeFilter === "freefire";

  const renderCard = (match) => {
    const msLeft = new Date(match.startTime).getTime() - now;
    const isLiveSoon = msLeft > 0 && msLeft <= 10 * 60 * 1000;
    const started = msLeft <= 0;

    const revealPassword = Boolean(revealedPasswords[match._id]);

    // Check if room is published and unlocked
    const unlockTime = match.roomUnlockTime ? new Date(match.roomUnlockTime).getTime() : null;
    const isUnlocked = match.isRoomPublished && unlockTime && now >= unlockTime;

    return (
      <article className={`card tournament-card ${match.isRoomPublished && !isUnlocked ? "locked-card" : ""}`} key={match._id}>
        <div className="match-head">
          <h3>{match.title}</h3>
          <span className={`game-badge ${match.game === "BGMI" ? "badge-bgmi" : "badge-ff"}`}>
            {match.game}
          </span>
        </div>
        <p>Entry Fee: ₹{match.entryFee || 20}</p>
        <p>Prize Pool: ₹{match.prizePool}</p>
        <p>Status: {match.status}</p>
        <p className="countdown-text">
          Starts in: <strong>{formatCountdown(msLeft)}</strong>
        </p>
        {isLiveSoon && !started && <span className="live-badge">LIVE</span>}

        <section className="match-details">
          <h4>Match Details</h4>
          <div className="match-detail-grid">
            <div className="match-detail-pill">
              <span className="match-detail-label">🎮 Type</span>
              <strong>{match.matchType || "Not Specified"}</strong>
            </div>
            <div className="match-detail-pill">
              <span className="match-detail-label">🗺️ Map</span>
              <strong>{match.map || "Not Specified"}</strong>
            </div>
            <div className="match-detail-pill">
              <span className="match-detail-label">⚔️ Mode</span>
              <strong>{match.perspective || "Not Specified"}</strong>
            </div>
          </div>
        </section>

        {match.isRoomPublished && !isUnlocked && (
          <div className="room-section locked">
            <div className="room-locked">
              <div className="room-locked-icon">🔒</div>
              <div>
                <p>Room unlocks in <Countdown unlockTime={match.roomUnlockTime} /></p>
                <p className="room-locked-subtitle">Only room credentials are hidden until unlock.</p>
              </div>
            </div>
            <div className="room-details locked">
              <div className="room-card-row">
                <span className="room-label">🎮 Room ID</span>
                <span className="room-value blurred-placeholder">████████</span>
              </div>
              <div className="room-card-row">
                <span className="room-label">🔑 Password</span>
                <span className="room-value blurred-placeholder">████████</span>
              </div>
            </div>
          </div>
        )}
        {isUnlocked && (
          <div className="room-section">
            <div className="room-box">
              {match.roomId && match.roomPassword ? (
                <>
                  <div className="room-card-row">
                    <span className="room-label">🎮 Room ID</span>
                    <div className="room-row-actions">
                      <span className="room-value">{match.roomId}</span>
                      <button className="room-action" type="button" onClick={() => handleCopy(match.roomId, "Room ID")}>Copy</button>
                    </div>
                  </div>
                  <div className="room-card-row">
                    <span className="room-label">🔑 Password</span>
                    <div className="room-row-actions">
                      <span className={`room-value ${revealPassword ? "" : "password-hidden"}`}>
                        {revealPassword ? match.roomPassword : "••••••••"}
                      </span>
                      <button
                        className="room-action"
                        type="button"
                        onClick={() => setRevealedPasswords((prev) => ({ ...prev, [match._id]: !prev[match._id] }))}
                      >
                        {revealPassword ? "Hide" : "Reveal"}
                      </button>
                      <button className="room-action" type="button" onClick={() => handleCopy(match.roomPassword, "Password")}>Copy</button>
                    </div>
                  </div>
                </>
              ) : (
                <p>🔒 Join this match to view room details.</p>
              )}
            </div>
          </div>
        )}

        {match.isSquadMatch ? (
          <>
            <SquadTeamCardStats
              joinedTeamsCount={match.joinedTeamsCount || 0}
              maxTeams={match.maxTeams || 25}
              remainingTeamSlots={match.remainingTeamSlots ?? 0}
            />
            <SquadTeamActions
              match={match}
              user={user}
              isAuthenticated={isAuthenticated}
              walletBalance={walletBalance}
              onRefresh={loadMatches}
            />
          </>
        ) : (
          <>
        {walletBalance < (match.entryFee || 20) && !match.isJoined && match.joinRequestStatus !== "pending" && match.remainingSlots > 0 && (
          <div className="wallet-warning-card">
            <strong>⚠ Insufficient Wallet Balance</strong>
            <div className="wallet-warning-row">
              <span>Entry Fee:</span>
              <span>₹{match.entryFee || 20}</span>
            </div>
            <div className="wallet-warning-row">
              <span>Wallet Balance:</span>
              <span>₹{walletBalance}</span>
            </div>
            <div className="wallet-warning-row">
              <span>Required:</span>
              <span>₹{Math.max((match.entryFee || 20) - walletBalance, 0)}</span>
            </div>
            <p>Add Money to continue.</p>
          </div>
        )}

        <PlayerCountBar 
          joinedCount={match.joinedPlayersCount || 0} 
          maxPlayers={match.maxPlayers || 100}
        />

        <div className="tournament-actions">
          {match.isJoined ? (
            <button className="btn btn-secondary full-width" type="button" disabled>
              Joined
            </button>
          ) : match.joinRequestStatus === "pending" ? (
            <button className="btn btn-secondary full-width" type="button" disabled>
              Pending Approval
            </button>
          ) : (
            <button
              className="btn btn-primary full-width"
              type="button"
              disabled={match.remainingSlots === 0}
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error("Please login first.");
                  return;
                }
                if (walletBalance >= (match.entryFee || 20)) {
                  handleJoin(match._id);
                  return;
                }
                const amountToAdd = Math.max((match.entryFee || 20) - walletBalance, 0);
                setWalletModal({
                  open: true,
                  amount: amountToAdd || (match.entryFee || 20),
                  title: `Add ₹${amountToAdd} to Wallet`,
                });
              }}
            >
              {match.remainingSlots === 0
                ? "Tournament Full"
                : walletBalance >= (match.entryFee || 20)
                ? "Join Match with Wallet"
                : `Add ₹${Math.max((match.entryFee || 20) - walletBalance, 0)} to Wallet`}
            </button>
          )}
        </div>
          </>
        )}
      </article>
    );
  };

  return (
    <main className="page">
      <h2>Tournaments</h2>
      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`filter-tab ${activeFilter === "bgmi" ? "active" : ""}`}
          onClick={() => setActiveFilter("bgmi")}
        >
          BGMI
        </button>
        <button
          type="button"
          className={`filter-tab ${activeFilter === "freefire" ? "active" : ""}`}
          onClick={() => setActiveFilter("freefire")}
        >
          Free Fire
        </button>
      </div>
      <section className="grid">
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <article className="card" key={idx}>
              <Skeleton height={20} width="60%" />
              <Skeleton height={14} />
              <Skeleton height={14} />
              <Skeleton height={14} />
            </article>
          ))}
      </section>

      {showBGMI && (
        <section className="match-section bgmi-section">
          <h3>🎮 BGMI Tournaments</h3>
          <div className="grid">
            {bgmiMatches.map(renderCard)}
            {!loading && bgmiMatches.length === 0 && (
              <article className="card">
                <p>No BGMI matches available</p>
              </article>
            )}
          </div>
        </section>
      )}

      {showFF && (
        <section className="match-section ff-section">
          <h3>🔥 Free Fire Tournaments</h3>
          <div className="grid">
            {ffMatches.map(renderCard)}
            {!loading && ffMatches.length === 0 && (
              <article className="card">
                <p>No Free Fire matches available</p>
              </article>
            )}
          </div>
        </section>
      )}

      {!loading && matches.length === 0 && (
        <article className="card">
          <h3>No tournaments available right now</h3>
          <p>New matches will appear here soon. Please check again in a few minutes.</p>
        </article>
      )}

      <WalletRechargeModal
        isOpen={walletModal.open}
        suggestedAmount={walletModal.amount}
        title={walletModal.title}
        onClose={() => setWalletModal({ open: false, amount: 100, title: "Pay Now" })}
      />
    </main>
  );
};

export default TournamentPage;
