import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import toast from "react-hot-toast";

const formatTimeAgo = (timestamp) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
};

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const fetchNotifications = async () => {
      try {
        const res = await api.getNotifications("limit=20");
        setItems(res.data || []);
      } catch {
        // silent in navbar
      }
    };
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 60 * 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

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
      <button className="notif-btn" type="button" onClick={() => setOpen((prev) => !prev)}>
        Bell {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
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
