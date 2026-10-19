const router = require("express").Router();
const Transaction = require("../models/Transaction");

function monthRange(month) {
  const m = /^\d{4}-\d{2}$/.test(month || "") ? month : new Date().toISOString().slice(0, 7);
  const [y, mo] = m.split("-").map(Number);
  return { month: m, start: new Date(Date.UTC(y, mo - 1, 1)), end: new Date(Date.UTC(y, mo, 1)) };
}

router.get("/", async (req, res) => {
  const { start, end } = monthRange(req.query.month);
  const filter = { user: req.user.id, date: { $gte: start, $lt: end } };
  if (["income", "expense"].includes(req.query.type)) filter.type = req.query.type;
  res.json(await Transaction.find(filter).sort({ date: -1 }));
});

router.post("/", async (req, res) => {
  try {
    const { type, category, amount, note, date } = req.body;
    const tx = await Transaction.create({
      user: req.user.id, type, category, amount: Number(amount), note, date: date || undefined,
    });
    res.status(201).json(tx);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  tx ? res.status(204).end() : res.status(404).json({ error: "Not found" });
});

module.exports = router;
module.exports.monthRange = monthRange;
