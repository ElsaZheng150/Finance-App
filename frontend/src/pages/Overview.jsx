import { useEffect, useState } from "react";
import { api, money } from "../api";

export default function Overview({ month, user, onUser }) {
  const [s, setS] = useState(null);
  const [budget, setBudget] = useState(user.monthlyBudget || "");

  useEffect(() => { api(`/summary?month=${month}`).then(setS); }, [month]);

  const saveBudget = async (e) => {
    e.preventDefault();
    onUser(await api("/me", { method: "PATCH", body: { monthlyBudget: Number(budget) || 0 } }));
    setS(await api(`/summary?month=${month}`));
  };

  if (!s) return <p>Loading…</p>;

  const pct = s.monthlyBudget ? Math.min(100, (s.spending / s.monthlyBudget) * 100) : 0;
  const over = s.monthlyBudget && s.spending > s.monthlyBudget;
  const cats = Object.entries(s.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] || 1;

  return (
    <>
      <h1>Hi {user.name.split(" ")[0]}, here's your month</h1>

      <section className="stats">
        <div className="panel"><span className="lbl">Money in</span><b className="pos">{money(s.income)}</b></div>
        <div className="panel"><span className="lbl">Money out</span><b>{money(s.spending)}</b></div>
        <div className="panel"><span className="lbl">Left over</span><b className={s.net < 0 ? "neg" : "pos"}>{money(s.net)}</b></div>
      </section>

      <section className="panel">
        <h2>Monthly spending budget</h2>
        <form className="inline" onSubmit={saveBudget}>
          <input type="number" min="0" step="1" placeholder="e.g. 900" value={budget} onChange={(e) => setBudget(e.target.value)} />
          <button className="btn">Save budget</button>
        </form>
        {s.monthlyBudget > 0 && (
          <>
            <div className="bar"><div className={`fill ${over ? "bad" : ""}`} style={{ width: `${pct}%` }} /></div>
            <p className={over ? "neg" : "muted"}>
              {over
                ? `You're ${money(s.spending - s.monthlyBudget)} over budget.`
                : `${money(s.monthlyBudget - s.spending)} left of ${money(s.monthlyBudget)}.`}
            </p>
          </>
        )}
      </section>

      <div className="two">
        <section className="panel">
          <h2>Where it went</h2>
          {cats.length === 0 && <p className="muted">No spending logged this month. Add some on the Spending tab.</p>}
          {cats.map(([name, total]) => (
            <div key={name} className="catrow">
              <span>{name}</span>
              <div className="bar slim"><div className="fill" style={{ width: `${(total / maxCat) * 100}%` }} /></div>
              <b>{money(total)}</b>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2>Student loans</h2>
          <p className="big">{money(s.loanBalance)}</p>
          <p className="muted">Minimum payments total {money(s.loanMinPayments)} a month.</p>
          <h2 className="gap">Saved by shame</h2>
          <p className="big pos">{money(s.shameSaved)}</p>
          <p className="muted">{s.shameSkips} purchase{s.shameSkips === 1 ? "" : "s"} skipped.</p>
        </section>
      </div>
    </>
  );
}
