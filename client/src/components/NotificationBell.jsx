import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import toast from "react-hot-toast";
import {
  loadSeenNotificationIds,
  playNotificationSound,
  saveSeenNotificationIds,
  unlockNotificationAudio,
} from "../utils/notificationSound";

const POLL_MS = 15000;
const BELL_RING_MS = 650;

const formatTimeAgo = (timestamp) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
};

const isPaymentNotification = (item) => {
  const title = item.title?.toLowerCase() || "";
  return (
    title.includes("payment approved") ||
    title.includes("payment rejected") ||
    title.includes("wallet credited")
  );
};

const NotificationBell = () => {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [bellRinging, setBellRinging] = useState(false);
  const seenNotificationIds = useRef(loadSeenNotificationIds(user?._id));
  const ringTimerRef = useRef(null);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const triggerBellRing = useCallback(() => {
    setBellRinging(true);
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    ringTimerRef.current = setTimeout(() => setBellRinging(false), BELL_RING_MS);
  }, []);

  const handleNewNotifications = useCallback(
    async (newNotifications) => {
      if (newNotifications.length === 0) return;

      newNotifications.forEach((item) => {
        if (isPaymentNotification(item)) {
          toast.success(item.message || item.title || "New payment notification");
        } else {
          toast(item.message || item.title || "New notification", { icon: "🔔" });
        }
      });

      triggerBellRing();
      await playNotificationSound();
    },
    [triggerBellRing]
  );

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return undefined;

    seenNotificationIds.current = loadSeenNotificationIds(user._id);

    const unlockOnGesture = () => unlockNotificationAudio();
    document.addEventListener("click", unlockOnGesture, { once: true, passive: true });
    document.addEventListener("touchstart", unlockOnGesture, { once: true, passive: true });

    const fetchNotifications = async () => {
      try {
        const res = await api.getNotifications("limit=20");
        const fetched = res.data || [];
        const previousIds = seenNotificationIds.current;
        const hasBaseline = previousIds.size > 0;

        if (hasBaseline) {
          const newNotifications = fetched.filter((item) => !previousIds.has(item._id));
          await handleNewNotifications(newNotifications);
        }

        setItems(fetched);
        const nextSeen = new Set(fetched.map((item) => item._id));
        seenNotificationIds.current = nextSeen;
        saveSeenNotificationIds(nextSeen, user._id);
      } catch {
        // silent in navbar
      }
    };

    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("click", unlockOnGesture);
      document.removeEventListener("touchstart", unlockOnGesture);
      if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    };
  }, [isAuthenticated, user?._id, handleNewNotifications]);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notif-wrap">
      <button
        className={`notif-btn${bellRinging ? " notif-btn--ring" : ""}`}
        type="button"
        onClick={() => {
          unlockNotificationAudio();
          setOpen((prev) => !prev);
        }}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        Bell {unreadCount > 0 && <span className={`notif-dot${bellRinging ? " notif-dot--pulse" : ""}`}>{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel card">
          <h4>Notifications</h4>
          {items.length === 0 && <p className="muted">No notifications yet.</p>}
          <div className="notif-list">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                className={`notif-item ${item.isRead ? "read" : ""}`}
                onClick={() => markRead(item._id)}
              >
                <div className="notif-item-header">
                  <strong>{item.title}</strong>
                  <span className="notif-time">{formatTimeAgo(item.createdAt)}</span>
                </div>
                <span>{item.message}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
