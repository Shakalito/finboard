import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  createPaperAccount,
  getAccountBalance,
  getMyAccounts,
  getMyPositions,
  type AccountRead,
  type BalanceResponse,
  type PositionRead,
} from "../api/portfolio";

function fmtMoney(v: number | null | undefined, currency = "USD") {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v.toFixed(2)} ${currency}`;
}

function fmtNum(v: number | null | undefined, digits = 2) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(digits);
}

function fmtPct(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(2)}%`;
}

export function PortfolioPage() {
  const { token } = useAuth();

  const [account, setAccount] = useState<AccountRead | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [positions, setPositions] = useState<PositionRead[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  const currency = useMemo(() => account?.base_currency ?? "USD", [account]);

  async function loadAll() {
    if (!token) return;

    setLoading(true);
    setErr(null);

    try {
      let accs = await getMyAccounts(token);
      let paper = accs.find((a) => a.type === "PAPER") ?? null;

      if (!paper) {
        paper = await createPaperAccount(token, "USD");
      }

      setAccount(paper);

      const bal = await getAccountBalance(token, paper.id, paper.base_currency);
      setBalance(bal);

      const pos = await getMyPositions(token);
      setPositions(pos);
    } catch (e: any) {
      setErr(e?.message ?? "Portfolio load error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div style={{ padding: 24, maxWidth: 1100 }}>
        <h2>Portfolio</h2>
        <p>You must be logged in.</p>
        <Link to="/login">Go to login</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2>Portfolio</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/watchlist">Watchlist</Link>
        <Link to="/portfolio/deposit">Deposit</Link>
        <Link to="/portfolio/orders">Orders</Link>
        <Link to="/portfolio/executions">Executions</Link>

        <button onClick={() => void loadAll()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.8 }}>Paper account</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>
          Cash balance: {fmtMoney(balance?.balance ?? null, currency)}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          account_id: {account?.id ?? "—"}
        </div>
      </div>

      <h3>Positions</h3>

      {positions.length === 0 && <p>No positions.</p>}

      {positions.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Ticker</th>
                <th style={th}>Name</th>
                <th style={th}>Qty</th>
                <th style={th}>Avg</th>
                <th style={th}>Last</th>
                <th style={th}>Value</th>
                <th style={th}>PnL</th>
                <th style={th}>PnL %</th>
                <th style={th}>As of</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.position_id}>
                  <td style={td}>{p.ticker ?? "—"}</td>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{fmtNum(p.qty, 4)}</td>
                  <td style={td}>{fmtMoney(p.avg_price, currency)}</td>

                  {/* NULL PRICE SUPPORT: last_price może być null */}
                  <td style={td}>{fmtMoney(p.last_price ?? null, currency)}</td>

                  {/* market_value może być null, jeśli last_price null */}
                  <td style={td}>{fmtMoney(p.market_value ?? null, currency)}</td>

                  {/* pnl może być null */}
                  <td style={td}>{fmtMoney(p.unrealized_pnl_abs ?? null, currency)}</td>
                  <td style={td}>{fmtPct(p.unrealized_pnl_pct ?? null)}</td>

                  <td style={td}>
                    {p.asof ? new Date(p.asof).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            Note: Last/Value/PnL can be “—” when price is unavailable.
          </div>
        </div>
      )}
    </div>
  );
}

const th: CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid #ddd",
  fontWeight: 700,
  fontSize: 13,
};

const td: CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid #eee",
  fontSize: 13,
};
