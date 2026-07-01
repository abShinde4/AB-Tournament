const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    imageUrl: { type: String, default: "", trim: true, maxlength: 500 },
    buttonText: { type: String, default: "", trim: true, maxlength: 40 },
    buttonLink: { type: String, default: "", trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, startDate: 1, endDate: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
