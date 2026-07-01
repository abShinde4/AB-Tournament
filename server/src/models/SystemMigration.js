const mongoose = require("mongoose");

const systemMigrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    ranAt: { type: Date, default: Date.now },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemMigration", systemMigrationSchema);
