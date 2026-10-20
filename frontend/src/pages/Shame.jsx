import { useEffect, useState } from "react";
import { api, money } from "../api";

export default function Shame() {
  const [contacts, setContacts] = useState([]);
  const [history, setHistory] = useState([]);
  const [c, setC] = useState({ name: "", email: "" });
  const [buy, setBuy] = useState({ item: "", amount: "", note: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null);

  const load = async () => {
    setContacts(await api("/contacts"));
    setHistory(await api("/shame"));
  };
  useEffect(() => { load(); }, []);

  const addContact = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/contacts", { method: "POST", body: c });
      setC({ name: "", email: "" });
      load();
    } catch (err) { setError(err.message); }
  };

  const removeContact = async (id) => { await api(`/contacts/${id}`, { method: "DELETE" }); load(); };

  const shame = async (e) => {
    e.preventDefault();
    setError("");
    if (!window.confirm(`This emails ${contacts.length} ${contacts.length === 1 ? "person" : "people"} right now. Send it?`)) return;
    try {
      setSent(await api("/shame", { method: "POST", body: buy }));
      setBuy({ item: "", amount: "", note: "" });
      load();
    } catch (err) { setError(err.message); }
  };

  const outcome = async (id, value) => {
    await api(`/shame/${id}`, { method: "PATCH", body: { outcome: value } });
    setSent(null);
    load();
  };

  return (
    <>
      <h1>The shame button</h1>
      <p className="muted">About to buy something you'll regret? Tell your accountability list first. They get an email with the item and the price.</p>

      <form className="panel shamebox" onSubmit={shame}>
        <h2>What are you about to buy?</h2>
        <div className="inline wrap">
          <input placeholder="Item" value={buy.item} onChange={(e) => setBuy({ ...buy, item: e.target.value })} required />
          <input type="number" min="0.01" step="0.01" placeholder="Price" value={buy.amount} onChange={(e) => setBuy({ ...buy, amount: e.target.value })} required />
        </div>
        <input placeholder="Your excuse (optional)" value={buy.note} onChange={(e) => setBuy({ ...buy, note: e.target.value })} />
        <button className="shamebtn" disabled={contacts.length === 0}>
          Shame me
        </button>
        {contacts.length === 0 && <p className="muted">Add at least one contact below to unlock the button.</p>}
        {error && <p className="error">{error}</p>}
      </form>

      {sent && (
        <section className="panel sentbox">
          <h2>Sent to {sent.notified} of {sent.totalContacts} contacts</h2>
          <p>So, {money(sent.amount)} for {sent.item}. What did you decide?</p>
          <div className="inline">
            <button className="btn primary" onClick={() => outcome(sent._id, "skipped")}>I skipped it</button>
            <button className="btn" onClick={() => outcome(sent._id, "bought")}>I bought it anyway</button>
          </div>
        </section>
      )}

      <div className="two">
        <section className="panel">
          <h2>Your accountability list</h2>
          <p className="muted">Only add people who've agreed to get these emails.</p>
          <form className="inline wrap" onSubmit={addContact}>
            <input placeholder="Name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} required />
            <input type="email" placeholder="Email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} required />
            <button className="btn">Add contact</button>
          </form>
          <ul className="rows">
            {contacts.map((x) => (
              <li key={x._id}>
                <span className="grow">{x.name} <small className="muted">{x.email}</small></span>
                <button className="link" onClick={() => removeContact(x._id)}>Remove</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Shame history</h2>
          {history.length === 0 && <p className="muted">Nothing yet. Good, or you haven't tried it.</p>}
          <ul className="rows">
            {history.map((h) => (
              <li key={h._id}>
                <span className="grow">{h.item} <small className="muted">{money(h.amount)}</small></span>
                <span className={`tag ${h.outcome}`}>{h.outcome === "pending" ? "undecided" : h.outcome}</span>
                {h.outcome === "pending" && (
                  <>
                    <button className="link" onClick={() => outcome(h._id, "skipped")}>Skipped</button>
                    <button className="link" onClick={() => outcome(h._id, "bought")}>Bought</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
