const Announcement = require("../models/Announcement");

const isAnnouncementVisible = (item, now = new Date()) => {
  if (!item.isActive) return false;
  if (item.startDate && now < new Date(item.startDate)) return false;
  if (item.endDate && now > new Date(item.endDate)) return false;
  return true;
};

const listActiveAnnouncements = async (_req, res) => {
  const now = new Date();
  const data = await Announcement.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(20)
    .select(
      "title message description priority startDate endDate imageUrl buttonText buttonLink createdAt"
    );

  return res.json({
    data: data.filter((item) => isAnnouncementVisible(item, now)),
  });
};

const createAnnouncement = async (req, res) => {
  const {
    title,
    message,
    description,
    priority,
    startDate,
    endDate,
    imageUrl,
    buttonText,
    buttonLink,
  } = req.validated.body;

  const announcement = await Announcement.create({
    title,
    message,
    description: description || message,
    priority: priority || "normal",
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    imageUrl: imageUrl || "",
    buttonText: buttonText || "",
    buttonLink: buttonLink || "",
    createdBy: req.user._id,
    isActive: true,
  });

  return res.status(201).json({ message: "Announcement created.", announcement });
};

const listAllAnnouncements = async (_req, res) => {
  const data = await Announcement.find().sort({ createdAt: -1 }).limit(50);
  return res.json({ data });
};

const deactivateAnnouncement = async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!announcement) return res.status(404).json({ message: "Announcement not found." });
  return res.json({ message: "Announcement deactivated.", announcement });
};

module.exports = {
  listActiveAnnouncements,
  createAnnouncement,
  listAllAnnouncements,
  deactivateAnnouncement,
};
