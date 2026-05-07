const path = require("path");
const User = require("../models/User");

const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Avatar image is required." });
  }

  // Public URL served by express static (/uploads).
  const avatarFilename = path.basename(req.file.filename);
  const avatarUrl = `/uploads/${avatarFilename}`;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  ).select("-password");

  return res.json({ user });
};

module.exports = { uploadAvatar };
