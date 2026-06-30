const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
