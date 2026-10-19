
const mongoose = require("mongoose");

const shameLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    item: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, default: "" },
    notified: { type: Number, default: 0 },
    totalContacts: { type: Number, default: 0 },
    outcome: { type: String, enum: ["pending", "skipped", "bought"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShameLog", shameLogSchema);
