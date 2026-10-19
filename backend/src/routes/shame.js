const router = require("express").Router();
const Contact = require("../models/Contact");
const ShameLog = require("../models/ShameLog");
const User = require("../models/User");
const { sendMail } = require("../services/mailer");

router.get("/", async (req, res) => {
  res.json(await ShameLog.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50));
});

// THE SHAME BUTTON: emails everyone on your contact list what you're about to buy.
router.post("/", async (req, res) => {
  const { item, amount, note } = req.body;
  const price = Number(amount);
  if (!item || !(price > 0)) {
    return res.status(400).json({ error: "Tell us what you're about to buy and how much it costs." });
  }

  const contacts = await Contact.find({ user: req.user.id });
  if (!contacts.length) {
    return res.status(400).json({ error: "Add at least one contact before using the Shame Button." });
  }

  const user = await User.findById(req.user.id);
  const money = `$${price.toFixed(2)}`;
  const subject = `${user.name} is about to spend ${money} on: ${item}`;

  const results = await Promise.allSettled(
    contacts.map((c) =>
      sendMail({
        to: c.email,
        replyTo: user.email,
        subject,
        text:
          `Hi ${c.name},\n\n` +
          `${user.name} added you as a spending accountability buddy on Campus Cash, ` +
          `and just hit the Shame Button.\n\n` +
          `About to buy: ${item}\nPrice: ${money}\n` +
          (note ? `Their excuse: ${note}\n` : "") +
          `\nTalk them out of it (or don't). Reply to this email to reach ${user.name}.\n`,
      })
    )
  );
  const notified = results.filter((r) => r.status === "fulfilled").length;

  const log = await ShameLog.create({
    user: req.user.id, item, amount: price, note,
    notified, totalContacts: contacts.length,
  });
  res.status(201).json(log);
});

// Record what happened: did the shame work?
router.patch("/:id", async (req, res) => {
  if (!["skipped", "bought"].includes(req.body.outcome)) {
    return res.status(400).json({ error: "Outcome must be 'skipped' or 'bought'." });
  }
  const log = await ShameLog.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { outcome: req.body.outcome },
    { new: true }
  );
  log ? res.json(log) : res.status(404).json({ error: "Not found" });
});

module.exports = router;
