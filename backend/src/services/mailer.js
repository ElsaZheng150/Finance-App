const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

/** Sends an email. With no SMTP configured it logs instead (handy for local dev). */
async function sendMail({ to, subject, text, replyTo }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mail simulated] to=${to} subject="${subject}"`);
    return { simulated: true };
  }
  return t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    replyTo,
    subject,
    text,
  });
}

module.exports = { sendMail };
