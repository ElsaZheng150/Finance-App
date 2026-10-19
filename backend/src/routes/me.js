const router = require("express").Router();
const User = require("../models/User");

const pub = (u) => ({ id: u._id, name: u.name, email: u.email, monthlyBudget: u.monthlyBudget });

router.get("/", async (req, res) => {
  res.json(pub(await User.findById(req.user.id)));
});

router.patch("/", async (req, res) => {
  const budget = Number(req.body.monthlyBudget);
  if (!(budget >= 0)) return res.status(400).json({ error: "Budget must be 0 or more." });
  res.json(pub(await User.findByIdAndUpdate(req.user.id, { monthlyBudget: budget }, { new: true })));
});

module.exports = router;
