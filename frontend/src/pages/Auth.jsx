import { useState } from "react";
import { api } from "../api";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api(`/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", body: form });
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="authwrap">
      <div className="authintro">
        <h1>Shame Finance</h1>
        <p>Track spending, income and student loans. And when you're about to drop $180 on blind boxes, hit the shame button and let your friends talk you out of it.</p>
      </div>
      <form className="panel authform" onSubmit={submit}>
        <h2>{mode === "login" ? "Log in" : "Create your account"}</h2>
        {mode === "register" && (
          <label>Name<input value={form.name} onChange={set("name")} required /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
        <label>Password<input type="password" minLength={8} value={form.password} onChange={set("password")} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary">{mode === "login" ? "Log in" : "Sign up"}</button>
        <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
      </form>
    </div>
  );
}
