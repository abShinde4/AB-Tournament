import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import { buildAvatarUrl } from "../utils/avatarUrl";

const badgeForLevel = (level) => {
  if (level >= 10) return "Legend";
  if (level >= 5) return "Pro";
  return "Beginner";
};

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [gamingForm, setGamingForm] = useState({
    bgmiName: user?.bgmiName || "",
    bgmiUid: user?.bgmiUid || "",
    freeFireName: user?.freeFireName || "",
    freeFireUid: user?.freeFireUid || "",
  });
  const [loading, setLoading] = useState(false);
  const [gamingLoading, setGamingLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [stats, setStats] = useState({
    totalMatchesJoined: 0,
    totalWins: 0,
    walletBalance: user?.walletBalance ?? 0,
  });
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return "N/A";
    return new Date(user.createdAt).toLocaleDateString();
  }, [user?.createdAt]);

  const computedLevel = useMemo(() => {
    const xp = Number(user?.xp ?? 0);
    return Number(user?.level ?? Math.floor(xp / 100) + 1);
  }, [user?.level, user?.xp]);

  const xpProgress = useMemo(() => {
    const xp = Number(user?.xp ?? 0);
    const current = ((xp % 100) + 100) % 100;
    return { current, total: 100 };
  }, [user?.xp]);

  useEffect(() => {
    setForm({
      username: user?.username || "",
      email: user?.email || "",
    });
    setGamingForm({
      bgmiName: user?.bgmiName || "",
      bgmiUid: user?.bgmiUid || "",
      freeFireName: user?.freeFireName || "",
      freeFireUid: user?.freeFireUid || "",
    });
  }, [user?.username, user?.email, user?.bgmiName, user?.bgmiUid, user?.freeFireName, user?.freeFireUid]);

  useEffect(() => {
    let cancelled = false;
    api
      .getDashboard()
      .then((res) => {
        if (cancelled) return;
        setStats({
          totalMatchesJoined: res.stats?.totalMatchesJoined || 0,
          totalWins: res.stats?.totalWins || 0,
          walletBalance: res.walletBalance ?? user?.walletBalance ?? 0,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const onGamingSubmit = async (event) => {
    event.preventDefault();
    try {
      setGamingLoading(true);
      const res = await api.updateMe(gamingForm);
      setUser(res.user);
      toast.success("Gaming profile updated successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGamingLoading(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const res = await api.updateMe(form);
      setUser(res.user);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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

  const avatarSrc = previewUrl
    ? previewUrl
    : user?.avatar
      ? buildAvatarUrl(user.avatar)
      : "";

  return (
    <main className="page">
      <section className="card gradient-card profile-hero">
        <div className="profile-top">
          <div className="avatar-wrap">
            {avatarSrc ? (
              <img
                className="avatar-img"
                src={avatarSrc}
                alt="Avatar"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/default-avatar.svg";
                }}
              />
            ) : (
              <div className="avatar-placeholder" aria-label="Avatar placeholder">
                {(user?.username || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-meta">
            <h2 style={{ margin: 0 }}>{user?.username || "User"}</h2>
            <p className="muted" style={{ margin: "0.15rem 0 0" }}>
              {user?.email} • Member since {memberSince}
            </p>
            <div className="profile-badges">
              <span className="pill">⭐ Level {computedLevel}</span>
              <span className="pill pill-muted">{badgeForLevel(computedLevel)}</span>
              <span className="pill pill-muted">{user?.role || "user"}</span>
            </div>
          </div>
          <div className="profile-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
            <button className="btn btn-secondary" type="button" onClick={onPickFile}>
              Choose Avatar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!selectedFile || uploading}
              onClick={onUpload}
              style={{ marginLeft: 10 }}
            >
              {uploading ? "Uploading..." : selectedFile ? "Upload" : "Upload Avatar"}
            </button>
          </div>
        </div>

        <div className="xp-block">
          <div className="xp-row">
            <span className="muted">XP</span>
            <span>
              {xpProgress.current}/100 (Total: {user?.xp ?? 0})
            </span>
          </div>
          <div className="xp-bar" role="progressbar" aria-valuenow={xpProgress.current} aria-valuemin={0} aria-valuemax={100}>
            <div className="xp-bar-fill" style={{ width: `${Math.min(100, Math.max(0, xpProgress.current))}%` }} />
          </div>
        </div>
      </section>

      <section className="grid">
        <article className="card stat-card">
          <h4>Total Matches Joined</h4>
          <p>{stats.totalMatchesJoined}</p>
        </article>
        <article className="card stat-card">
          <h4>Total Wins</h4>
          <p>{stats.totalWins}</p>
        </article>
        <article className="card stat-card">
          <h4>Wallet Balance</h4>
          <p>INR {stats.walletBalance}</p>
        </article>
      </section>

      <section className="card gradient-card">
        <h3 style={{ marginTop: 0 }}>🎮 Gaming Identity</h3>
        <p className="muted" style={{ marginTop: "-0.2rem" }}>
          Add your in-game names and UIDs for player verification. This helps admins verify you during tournaments.
        </p>
        <p style={{ color: "#ffb347", fontSize: "0.9rem", marginBottom: "1rem" }}>
          ⚠️ Joining with wrong UID or IGN may result in disqualification.
        </p>
        <form onSubmit={onGamingSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ margin: "0 0 0.8rem", color: "#5a63ff" }}>BGMI Profile</h4>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <input
                placeholder="BGMI Name (IGN)"
                value={gamingForm.bgmiName}
                onChange={(e) => setGamingForm((prev) => ({ ...prev, bgmiName: e.target.value }))}
              />
              <input
                placeholder="BGMI UID"
                value={gamingForm.bgmiUid}
                onChange={(e) => setGamingForm((prev) => ({ ...prev, bgmiUid: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ margin: "0 0 0.8rem", color: "#ff6f40" }}>Free Fire Profile</h4>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <input
                placeholder="Free Fire Name (IGN)"
                value={gamingForm.freeFireName}
                onChange={(e) => setGamingForm((prev) => ({ ...prev, freeFireName: e.target.value }))}
              />
              <input
                placeholder="Free Fire UID"
                value={gamingForm.freeFireUid}
                onChange={(e) => setGamingForm((prev) => ({ ...prev, freeFireUid: e.target.value }))}
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={gamingLoading}>
            {gamingLoading ? "Saving..." : "Save Gaming Profile"}
          </button>
        </form>
      </section>

      <section className="card gradient-card">
        <h3 style={{ marginTop: 0 }}>👤 Profile Information</h3>
        <p className="muted" style={{ marginTop: "-0.2rem" }}>
          Update your username or email.
        </p>
        <form onSubmit={onSubmit} className="form-grid">
          <input
            required
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default ProfilePage;
