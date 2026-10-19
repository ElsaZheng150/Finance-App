const router = require("express").Router();
const Loan = require("../models/Loan");
const { payoff } = require("../utils/loanMath");

router.get("/", async (req, res) => {
  res.json(await Loan.find({ user: req.user.id }).sort({ apr: -1 }));
});

router.post("/", async (req, res) => {
  try {
    const { name, type, balance, apr, minPayment } = req.body;
    res.status(201).json(
      await Loan.create({
        user: req.user.id, name, type,
        balance: Number(balance), apr: Number(apr), minPayment: Number(minPayment),
      })
    );
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  const allowed = ["name", "type", "balance", "apr", "minPayment"];
  const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  try {
    const loan = await Loan.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, update, {
      new: true, runValidators: true,
    });
    loan ? res.json(loan) : res.status(404).json({ error: "Not found" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  const loan = await Loan.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  loan ? res.status(204).end() : res.status(404).json({ error: "Not found" });
});

// What-if: how fast could you pay this off if you add $X per month?
router.get("/:id/payoff", async (req, res) => {
  const loan = await Loan.findOne({ _id: req.params.id, user: req.user.id });
  if (!loan) return res.status(404).json({ error: "Not found" });
  const extra = Math.max(0, Number(req.query.extra) || 0);
  res.json({
    base: payoff(loan.balance, loan.apr, loan.minPayment),
    boosted: payoff(loan.balance, loan.apr, loan.minPayment + extra),
    extra,
  });
});

module.exports = router;
