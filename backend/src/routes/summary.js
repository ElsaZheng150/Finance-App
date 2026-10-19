const router = require("express").Router();
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Loan = require("../models/Loan");
const User = require("../models/User");
const ShameLog = require("../models/ShameLog");
const { monthRange } = require("./transactions");

router.get("/", async (req, res) => {
  const { month, start, end } = monthRange(req.query.month);
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const rows = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: { type: "$type", category: "$category" }, total: { $sum: "$amount" } } },
  ]);

  let income = 0, spending = 0;
  const byCategory = {};
  for (const r of rows) {
    if (r._id.type === "income") income += r.total;
    else { spending += r.total; byCategory[r._id.category] = r.total; }
  }

  const [loans, user, saved] = await Promise.all([
    Loan.find({ user: userId }),
    User.findById(userId),
    ShameLog.aggregate([
      { $match: { user: userId, outcome: "skipped" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    month,
    income,
    spending,
    net: income - spending,
    byCategory,
    monthlyBudget: user.monthlyBudget,
    loanBalance: loans.reduce((s, l) => s + l.balance, 0),
    loanMinPayments: loans.reduce((s, l) => s + l.minPayment, 0),
    shameSaved: saved[0]?.total || 0,
    shameSkips: saved[0]?.count || 0,
  });
});

module.exports = router;
