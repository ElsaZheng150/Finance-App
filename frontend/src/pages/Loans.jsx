import { useEffect, useState } from "react";
import { api, money } from "../api";

const years = (m) => (m >= 24 ? `${(m / 12).toFixed(1)} years` : `${m} months`);

function LoanCard({ loan, onChange }) {
  const [extra, setExtra] = useState(50);
  const [calc, setCalc] = useState(null);

  useEffect(() => {
    api(`/loans/${loan._id}/payoff?extra=${extra}`).then(setCalc).catch(() => {});
  }, [loan, extra]);

  const updateBalance = async () => {
    const v = window.prompt("New balance:", loan.balance);
    if (v === null || isNaN(Number(v))) return;
    await api(`/loans/${loan._id}`, { method: "PATCH", body: { balance: Number(v) } });
    onChange();
  };
  const remove = async () => {
    if (!window.confirm(`Delete ${loan.name}?`)) return;
    await api(`/loans/${loan._id}`, { method: "DELETE" });
    onChange();
  };

  return (
    <section className="panel">
      <div className="loanhead">
        <h2>{loan.name} <span className="tag">{loan.type}</span></h2>
        <div>
          <button className="link" onClick={updateBalance}>Update balance</button>
          <button className="link" onClick={remove}>Delete</button>
        </div>
      </div>
      <p className="big">{money(loan.balance)}</p>
      <p className="muted">{loan.apr}% APR, {money(loan.minPayment)} minimum a month</p>

      <label className="slider">
        What if I pay an extra <b>{money(extra)}</b> a month?
        <input type="range" min="0" max="500" step="10" value={extra} onChange={(e) => setExtra(Number(e.target.value))} />
      </label>
      {calc && !calc.base && <p className="neg">At the minimum payment, this loan never shrinks. Interest outpaces it.</p>}
      {calc?.base && calc.boosted && (
        <p>
          Debt-free in <b>{years(calc.boosted.months)}</b> instead of {years(calc.base.months)}, saving{" "}
          <b className="pos">{money(calc.base.totalInterest - calc.boosted.totalInterest)}</b> in interest.
        </p>
      )}
    </section>
  );
}

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [form, setForm] = useState({ name: "", type: "federal", balance: "", apr: "", minPayment: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api("/loans").then(setLoans);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/loans", { method: "POST", body: form });
      setForm({ name: "", type: "federal", balance: "", apr: "", minPayment: "" });
      load();
    } catch (err) { setError(err.message); }
  };

  const total = loans.reduce((s, l) => s + l.balance, 0);

  return (
    <>
      <h1>Student loans</h1>
      <p className="muted">Total owed: <b>{money(total)}</b>. Highest interest rate first, because that's the one to attack.</p>

      <form className="panel inline wrap" onSubmit={add}>
        <input placeholder="Loan name (e.g. Direct Subsidized)" value={form.name} onChange={set("name")} required />
        <select value={form.type} onChange={set("type")}>
          <option value="federal">Federal</option>
          <option value="private">Private</option>
        </select>
        <input type="number" min="0" step="0.01" placeholder="Balance" value={form.balance} onChange={set("balance")} required />
        <input type="number" min="0" step="0.01" placeholder="APR %" value={form.apr} onChange={set("apr")} required />
        <input type="number" min="0" step="0.01" placeholder="Min payment / mo" value={form.minPayment} onChange={set("minPayment")} required />
        <button className="btn primary">Add loan</button>
        {error && <p className="error">{error}</p>}
      </form>

      {loans.length === 0 && <p className="muted">No loans added yet. Add one above to see a payoff estimate.</p>}
      {loans.map((l) => <LoanCard key={l._id} loan={l} onChange={load} />)}
    </>
  );
}
