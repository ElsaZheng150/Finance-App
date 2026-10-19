const router = require("express").Router();
const Contact = require("../models/Contact");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CONTACTS = 20;

router.get("/", async (req, res) => {
  res.json(await Contact.find({ user: req.user.id }).sort({ name: 1 }));
});

router.post("/", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !EMAIL_RE.test(email || "")) {
    return res.status(400).json({ error: "A name and a valid email are required." });
  }
  if ((await Contact.countDocuments({ user: req.user.id })) >= MAX_CONTACTS) {
    return res.status(400).json({ error: `You can add up to ${MAX_CONTACTS} contacts.` });
  }
  try {
    res.status(201).json(await Contact.create({ user: req.user.id, name, email }));
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 400).json({
      error: e.code === 11000 ? "That contact is already on your list." : e.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  const c = await Contact.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  c ? res.status(204).end() : res.status(404).json({ error: "Not found" });
});

module.exports = router;
