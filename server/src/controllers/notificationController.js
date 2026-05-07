const Notification = require("../models/Notification");

const listNotifications = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: req.user._id }),
  ]);

  return res.json({
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ message: "Notification not found" });
  }

  return res.json({ message: "Notification marked as read", data: updated });
};

module.exports = { listNotifications, markAsRead };
