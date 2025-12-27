import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deposit } from "../api/portfolio";
import { useAuth } from "../auth/AuthContext";
import { usePaperAccount } from "../portfolio/usePaperAccount";

export function PortfolioDepositPage() {
  const { token } = useAuth();
  const { account, loading, error, refresh } = usePaperAccount(token);
  const nav = useNavigate();

  const [amount, setAmount] = useState<string>("10000");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const canSubmit = useMemo(() => !!token && !!account && !loading, [token, account, loading]);

  async function onSubmit() {
    setMsg(null);
    setErr(null);

    if (!token) {
      setErr("You must be logged in.");
      return;
    }
    if (!account) {
      setErr("Account not ready yet.");
      return;
    }

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setErr("Amount must be a positive number.");
      return;
    }

    try {
      await deposit(token, account.id, parsed, account.base_currency);
      await refresh();
      setMsg("Deposit successful.");
      nav("/portfolio");
    } catch (e: any) {
      setErr(e?.message ?? "Deposit error");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>Deposit</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/portfolio">Back to portfolio</Link>
        <Link to="/watchlist">Watchlist</Link>
      </div>

      {!token && <p style={{ color: "crimson" }}>You must be logged in.</p>}
      {token && error && <p style={{ color: "crimson" }}>{error}</p>}

      {msg && <p>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "grid", gap: 10 }}>
        <label>
          Amount
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            placeholder="e.g. 10000"
          />
        </label>

        <button onClick={onSubmit} disabled={!canSubmit}>
          Submit deposit
        </button>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Currency will use account base_currency.
        </div>
      </div>
    </div>
  );
}
