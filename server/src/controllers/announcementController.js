const Announcement = require("../models/Announcement");

const listActiveAnnouncements = async (_req, res) => {
  const data = await Announcement.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title message priority createdAt");
  return res.json({ data });
};

const createAnnouncement = async (req, res) => {
  const { title, message, priority } = req.validated.body;
  const announcement = await Announcement.create({
    title,
    message,
    priority: priority || "normal",
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
