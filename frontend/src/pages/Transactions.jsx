import { useEffect, useState } from "react";
import { api, money } from "../api";

const CATEGORIES = {
  expense: ["Food", "Rent", "Textbooks", "Transport", "Fun", "Subscriptions", "Clothes", "Other"],
  income: ["Job", "Financial aid", "Scholarship", "Family", "Other"],
};

export default function Transactions({ type, month }) {
  const label = type === "expense" ? "Spending" : "Income";
  const today = new Date().toISOString().slice(0, 10);
  const blank = { category: CATEGORIES[type][0], amount: "", note: "", date: today };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api(`/transactions?type=${type}&month=${month}`).then(setItems);
  useEffect(() => { setForm(blank); load(); }, [type, month]);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/transactions", { method: "POST", body: { ...form, type } });
      setForm({ ...blank, category: form.category });
      load();
    } catch (err) { setError(err.message); }
  };

  const remove = async (id) => { await api(`/transactions/${id}`, { method: "DELETE" }); load(); };
  const total = items.reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <h1>{label}</h1>
      <form className="panel inline wrap" onSubmit={add}>
        <select value={form.category} onChange={set("category")}>
          {CATEGORIES[type].map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="number" min="0.01" step="0.01" placeholder="Amount" value={form.amount} onChange={set("amount")} required />
        <input placeholder="Note (optional)" value={form.note} onChange={set("note")} />
        <input type="date" value={form.date} onChange={set("date")} />
        <button className="btn primary">Add {type === "expense" ? "expense" : "income"}</button>
        {error && <p className="error">{error}</p>}
      </form>

      <section className="panel">
        <h2>{month}: {money(total)}</h2>
        {items.length === 0 && <p className="muted">Nothing logged for this month yet.</p>}
        <ul className="rows">
          {items.map((t) => (
            <li key={t._id}>
              <span className="tag">{t.category}</span>
              <span className="grow">{t.note || "—"}<small className="muted"> {t.date.slice(0, 10)}</small></span>
              <b>{money(t.amount)}</b>
              <button className="link" onClick={() => remove(t._id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
