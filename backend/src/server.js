require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is required");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`Campus Cash API on :${PORT}`)))
  .catch((err) => { console.error(err); process.exit(1); });
