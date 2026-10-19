const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const sign = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, monthlyBudget: u.monthlyBudget });

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: "Name, email and a password of 8+ characters are required." });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ error: "That email is already registered." });
  }
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await User.findOne({ email: email.toLowerCase() }));
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).json({ error: "Wrong email or password." });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

module.exports = router;
