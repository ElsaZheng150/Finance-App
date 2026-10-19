const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["federal", "private"], default: "federal" },
    balance: { type: Number, required: true, min: 0 },
    apr: { type: Number, required: true, min: 0 }, // percent, e.g. 5.5
    minPayment: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);

