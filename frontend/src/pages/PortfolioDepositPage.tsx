import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyAccounts, deposit } from "../api/portfolio";

export function PortfolioDepositPage() {
  const { token } = useAuth();
  const [amount, setAmount] = useState<number>(10000);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onDeposit() {
    setErr(null);
    setMsg(null);
    if (!token) {
      setErr("You must be logged in.");
      return;
    }
    try {
      const accs = await getMyAccounts(token);
      const account = accs[0];
      if (!account) {
        setErr("No account found.");
        return;
      }
      await deposit(token, account.id, amount, account.base_currency);
      setMsg("Deposit OK");
    } catch (e: any) {
      setErr(e?.message ?? "Deposit error");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2>Deposit</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/portfolio">Back to portfolio</Link>
        <Link to="/watchlist">Watchlist</Link>
      </div>

      {msg && <p>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>
          amount:
          <input
            type="number"
            value={amount}
            min={0}
            step={1}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ marginLeft: 8, width: 200 }}
          />
        </label>
        <button onClick={onDeposit}>Deposit</button>
      </div>
    </div>
  );
}
