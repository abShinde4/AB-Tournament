import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../api";
import "./announcement.css";

const DISMISS_KEY = "ab_dismissed_announcements";

const getDismissed = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
  } catch {
    return [];
  }
};

const dismiss = (id) => {
  const current = getDismissed();
  if (!current.includes(id)) {
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...current, id]));
  }
};

const priorityClass = (priority) => {
  if (priority === "urgent") return "announcement-urgent";
  if (priority === "important") return "announcement-important";
  return "announcement-normal";
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed);

  useEffect(() => {
    api
      .getActiveAnnouncements()
      .then((res) => setAnnouncements(res.data || []))
      .catch(() => setAnnouncements([]));
  }, []);

  const visible = announcements.filter((item) => !dismissed.includes(item._id));
  if (!visible.length) return null;

  const handleDismiss = (id) => {
    dismiss(id);
    setDismissed((prev) => [...prev, id]);
  };

  return (
    <div className="announcement-stack">
      {visible.map((item) => (
        <article key={item._id} className={`announcement-card ${priorityClass(item.priority)}`}>
          {item.imageUrl && (
            <img src={item.imageUrl} alt="" className="announcement-card-image" loading="lazy" />
          )}
          <div className="announcement-card-body">
            <div className="announcement-card-top">
              <strong>{item.title}</strong>
              <button
                type="button"
                className="announcement-dismiss"
                aria-label="Dismiss announcement"
                onClick={() => handleDismiss(item._id)}
              >
                <X size={18} />
              </button>
            </div>
            <p>{item.description || item.message}</p>
            {item.buttonText && item.buttonLink && (
              <a
                href={item.buttonLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary announcement-card-btn"
              >
                {item.buttonText}
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default AnnouncementBanner;
