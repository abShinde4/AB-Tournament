import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import Skeleton from "../components/Skeleton";
import Countdown from "../components/Countdown";

const formatCountdown = (msLeft) => {
  if (msLeft <= 0) return "Match Started";
  const totalSeconds = Math.floor(msLeft / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const TournamentPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState("");
  const [now, setNow] = useState(Date.now());
  const [activeFilter, setActiveFilter] = useState("all");
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [roomUnlockNotified, setRoomUnlockNotified] = useState({});
  const { isAuthenticated, setUser } = useAuth();

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
      const res = await api.joinMatch(matchId);
      toast.success("Match joined successfully");
      setUser((prev) => ({
        ...prev,
        walletBalance: res.walletBalance,
        xp: res.xp ?? prev?.xp,
        level: res.level ?? prev?.level,
      }));
    } catch (error) {
      toast.error(error.message);
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

        <button
          className="btn btn-primary"
          onClick={() => handleJoin(match._id)}
          type="button"
          disabled={loadingId === match._id}
        >
          {loadingId === match._id ? "Joining..." : "Join Now"}
        </button>
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
    </main>
  );
};

export default TournamentPage;
