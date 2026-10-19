const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const auth = require("./middleware/auth");

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

if (process.env.NODE_ENV !== "test") {
  app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 }));
  // The shame button sends real email: keep it from being spammed.
  app.use("/api/shame", rateLimit({ windowMs: 60 * 60 * 1000, limit: 30 }));
}

app.use("/api/auth", require("./routes/auth"));
app.use("/api/me", auth, require("./routes/me"));
app.use("/api/transactions", auth, require("./routes/transactions"));
app.use("/api/summary", auth, require("./routes/summary"));
app.use("/api/loans", auth, require("./routes/loans"));
app.use("/api/contacts", auth, require("./routes/contacts"));
app.use("/api/shame", auth, require("./routes/shame"));

// Serve the built React app in production
const dist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(dist));
app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));

module.exports = app;
