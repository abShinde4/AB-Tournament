const Notification = require("../models/Notification");
const User = require("../models/User");

const listNotifications = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const filter = {
    $or: [
      { user: req.user._id },
      { isGlobal: true },
    ],
  };

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  const data = items.map((item) => {
    const notification = item.toObject();
    if (notification.isGlobal) {
      notification.isRead = Array.isArray(notification.readBy)
        ? notification.readBy.some((userId) => String(userId) === String(req.user._id))
        : false;
    }
    return notification;
  });

  return res.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  if (notification.isGlobal) {
    if (notification.readBy?.some((userId) => String(userId) === String(req.user._id))) {
      return res.json({ message: "Notification already marked as read", data: notification });
    }
    notification.readBy = [...new Set([...(notification.readBy || []), req.user._id])];
    await notification.save();
    return res.json({ message: "Notification marked as read", data: notification });
  }

  if (String(notification.user) !== String(req.user._id)) {
    return res.status(404).json({ message: "Notification not found" });
  }

  notification.isRead = true;
  await notification.save();
  return res.json({ message: "Notification marked as read", data: notification });
};

const sendNotification = async (req, res) => {
  const { title, message, recipientType, userId } = req.validated.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required." });
  }

  if (recipientType === "specific") {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required for specific notifications." });
    }
    const user = await User.findById(userId).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const notification = await Notification.create({
      user: user._id,
      type: "admin",
      title,
      message,
      isGlobal: false,
      isRead: false,
    });
    return res.status(201).json({ message: "Notification sent to user.", data: notification });
  }

  if (recipientType === "all") {
    const notification = await Notification.create({
      user: null,
      type: "admin",
      title,
      message,
      isGlobal: true,
      isRead: false,
      readBy: [],
    });
    return res.status(201).json({ message: "Notification sent to all users.", data: notification });
  }

  return res.status(400).json({ message: "Invalid recipient type." });
};

module.exports = { listNotifications, markAsRead, sendNotification };
