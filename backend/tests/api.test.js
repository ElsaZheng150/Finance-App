process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

jest.mock("../src/services/mailer", () => ({ sendMail: jest.fn().mockResolvedValue({}) }));

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const { sendMail } = require("../src/services/mailer");
const { payoff } = require("../src/utils/loanMath");

let mongod, token;
const authed = (r) => r.set("Authorization", `Bearer ${token}`);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Sam", email: "sam@uni.edu", password: "password123" })
    .expect(201);
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("rejects requests without a token", async () => {
  await request(app).get("/api/transactions").expect(401);
});

test("login works and rejects bad password", async () => {
  await request(app).post("/api/auth/login").send({ email: "sam@uni.edu", password: "password123" }).expect(200);
  await request(app).post("/api/auth/login").send({ email: "sam@uni.edu", password: "nope" }).expect(401);
});

test("income and spending roll up into the summary", async () => {
  await authed(request(app).post("/api/transactions")).send({ type: "income", category: "Job", amount: 500 }).expect(201);
  await authed(request(app).post("/api/transactions")).send({ type: "expense", category: "Food", amount: 120 }).expect(201);
  const res = await authed(request(app).get("/api/summary")).expect(200);
  expect(res.body.income).toBe(500);
  expect(res.body.spending).toBe(120);
  expect(res.body.net).toBe(380);
  expect(res.body.byCategory.Food).toBe(120);
});

test("loans: create and what-if payoff", async () => {
  const loan = await authed(request(app).post("/api/loans"))
    .send({ name: "Direct Sub", type: "federal", balance: 10000, apr: 5, minPayment: 150 })
    .expect(201);
  const res = await authed(request(app).get(`/api/loans/${loan.body._id}/payoff?extra=100`)).expect(200);
  expect(res.body.boosted.months).toBeLessThan(res.body.base.months);
});

test("payoff returns null when payment can't cover interest", () => {
  expect(payoff(10000, 12, 50)).toBeNull();
});

test("shame button needs contacts, then emails all of them", async () => {
  await authed(request(app).post("/api/shame")).send({ item: "Sneakers", amount: 180 }).expect(400);

  await authed(request(app).post("/api/contacts")).send({ name: "Mom", email: "mom@home.com" }).expect(201);
  await authed(request(app).post("/api/contacts")).send({ name: "Roommate", email: "rm@uni.edu" }).expect(201);

  const res = await authed(request(app).post("/api/shame")).send({ item: "Sneakers", amount: 180 }).expect(201);
  expect(sendMail).toHaveBeenCalledTimes(2);
  expect(res.body.notified).toBe(2);

  const upd = await authed(request(app).patch(`/api/shame/${res.body._id}`)).send({ outcome: "skipped" }).expect(200);
  expect(upd.body.outcome).toBe("skipped");

  const summary = await authed(request(app).get("/api/summary")).expect(200);
  expect(summary.body.shameSaved).toBe(180);
});

test("users can't see each other's data", async () => {
  const other = await request(app)
    .post("/api/auth/register")
    .send({ name: "Alex", email: "alex@uni.edu", password: "password123" });
  const res = await request(app).get("/api/loans").set("Authorization", `Bearer ${other.body.token}`).expect(200);
  expect(res.body).toHaveLength(0);
});
