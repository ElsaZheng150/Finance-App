import { useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";
import Auth from "./pages/Auth.jsx";
import Overview from "./pages/Overview.jsx";
import Transactions from "./pages/Transactions.jsx";
import Loans from "./pages/Loans.jsx";
import Shame from "./pages/Shame.jsx";

const TABS = [
  ["overview", "Overview"],
  ["spending", "Spending"],
  ["income", "Income"],
  ["loans", "Student loans"],
  ["shame", "Shame button"],
];

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());
  const [tab, setTab] = useState("overview");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (getToken()) api("/me").then(setUser).catch(() => {}).finally(() => setReady(true));
    const out = () => setUser(null);
    window.addEventListener("shamefinanceapp:logout", out);
    return () => window.removeEventListener("shamefinanceapp:logout", out);
  }, []);

  if (!ready) return null;
  if (!user) return <Auth onAuth={(token, u) => { setToken(token); setUser(u); }} />;

  const logout = () => { setToken(null); setUser(null); };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Shame Finance</div>
        <nav>
          {TABS.map(([id, label]) => (
            <button
              key={id}
              className={`navbtn ${tab === id ? "on" : ""} ${id === "shame" ? "shamenav" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="who">
          <span>{user.name}</span>
          <button className="link" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main className="main">
        {["overview", "spending", "income"].includes(tab) && (
          <div className="monthbar">
            <label>
              Month <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
          </div>
        )}
        {tab === "overview" && <Overview month={month} user={user} onUser={setUser} />}
        {tab === "spending" && <Transactions type="expense" month={month} />}
        {tab === "income" && <Transactions type="income" month={month} />}
        {tab === "loans" && <Loans />}
        {tab === "shame" && <Shame />}
      </main>
    </div>
  );
}
