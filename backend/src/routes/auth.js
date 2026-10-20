const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client();
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
  if (user && !user.passwordHash) {
    return res.status(401).json({ error: "This account uses Google sign-in. Use the Google button." });
  }
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).json({ error: "Wrong email or password." });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential || !process.env.GOOGLE_CLIENT_ID) {
    return res.status(400).json({ error: "Google sign-in isn't set up." });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Google sign-in failed. Try again." });
  }
  if (!payload.email || !payload.email_verified) {
    return res.status(401).json({ error: "Your Google email isn't verified." });
  }

  let user = await User.findOne({
    $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }],
  });
  if (!user) {
    user = await User.create({
      name: payload.name || payload.email.split("@")[0],
      email: payload.email,
      googleId: payload.sub,
    });
  } else if (!user.googleId) {
    user.googleId = payload.sub; // link Google to an existing email/password account
    await user.save();
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

module.exports = router;
