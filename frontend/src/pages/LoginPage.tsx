import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("jan@example.com");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await signIn(email, password);
      setMsg("OK. Logged in. Go to /me");
    } catch (e: any) {
      setErr(e?.message ?? "Login error");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
        <button type="submit">Sign in</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      {err && <p style={{ marginTop: 12, color: "crimson" }}>{err}</p>}

      <p style={{ marginTop: 16 }}>
        Go to <a href="/register">Register</a>
      </p>
    </div>
  );
}
