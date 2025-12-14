import { useState } from "react";
import { register } from "../api/auth";

export function RegisterPage() {
  const [firstName, setFirstName] = useState("Jan");
  const [lastName, setLastName] = useState("Kowalski");
  const [email, setEmail] = useState("jan@example.com");
  const [password, setPassword] = useState("password123");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      const u = await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      setMsg(`OK. Created user: ${u.email}`);
    } catch (e: any) {
      setErr(e?.message ?? "Register error");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>Register</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="first_name" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="last_name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
        <button type="submit">Create account</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      {err && <p style={{ marginTop: 12, color: "crimson" }}>{err}</p>}

      <p style={{ marginTop: 16 }}>
        Go to <a href="/login">Login</a>
      </p>
    </div>
  );
}
