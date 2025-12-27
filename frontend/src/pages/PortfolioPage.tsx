import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  getMyAccounts,
  getBalance,
  getMyPositions,
  placeOrder,
  type AccountRead,
  type BalanceResponse,
  type PositionRead,
} from "../api/portfolio";

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || Number.isNaN(n)) return "-";
  return n.toFixed(digits);
}

export function PortfolioPage() {
  const { token } = useAuth();

  const [account, setAccount] = useState<AccountRead | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [positions, setPositions] = useState<PositionRead[]>([]);

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [listingId, setListingId] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState<number>(1);

  const currency = useMemo(() => account?.base_currency ?? "USD", [account]);

  async function loadAll() {
    setErr(null);
    setMsg(null);

    if (!token) {
      setErr("You must be logged in.");
      return;
    }

    setLoading(true);
    try {
      const accs = await getMyAccounts(token);
      const paper = accs[0] ?? null;
      setAccount(paper);

      if (paper) {
        const [bal, pos] = await Promise.all([
          getBalance(token, paper.id, paper.base_currency),
          getMyPositions(token),
        ]);
        setBalance(bal);
        setPositions(pos);
      } else {
        setBalance(null);
        setPositions([]);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Load error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // no “promise ignored”
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onPlaceOrder() {
    setErr(null);
    setMsg(null);

    if (!token) return;
    if (!account) {
      setErr("No account.");
      return;
    }
    if (!listingId) {
      setErr("listing_id is required.");
      return;
    }
    if (!qty || qty <= 0) {
      setErr("qty must be > 0");
      return;
    }

    try {
      const res = await placeOrder(token, {
        account_id: account.id,
        listing_id: listingId,
        side,
        qty,
      });
      setMsg(`Order placed: ${res.id} (${res.state})`);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Order error");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2>Portfolio</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/watchlist">Watchlist</Link>
        <Link to="/listings">Listings</Link>
        <Link to="/portfolio/orders">Orders</Link>
        <Link to="/portfolio/deposit">Deposit</Link>
        <button onClick={() => void loadAll()} disabled={loading}>
          Refresh
        </button>
      </div>

      {msg && <p>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {loading && <p>Loading...</p>}

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Account</div>
        {!account && <div>No account found.</div>}
        {account && (
          <>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {account.type} • {account.base_currency} • {account.id}
            </div>
            <div style={{ marginTop: 8 }}>
              Cash balance: <b>{balance ? fmt(balance.balance, 2) : "-"}</b> {currency}
            </div>
          </>
        )}
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Buy / Sell</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label>
            listing_id:
            <input
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              placeholder="UUID (refdata.listings)"
              style={{ marginLeft: 8, width: 360 }}
            />
          </label>

          <label>
            side:
            <select value={side} onChange={(e) => setSide(e.target.value as any)} style={{ marginLeft: 8 }}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>

          <label>
            qty:
            <input
              type="number"
              value={qty}
              min={0}
              step={1}
              onChange={(e) => setQty(Number(e.target.value))}
              style={{ marginLeft: 8, width: 120 }}
            />
          </label>

          <button onClick={onPlaceOrder} disabled={!account || loading}>
            Submit
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          Tip: listing_id from DB (refdata.listings).
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Positions</div>

        {positions.length === 0 && <div>No positions.</div>}

        {positions.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                  <th style={{ padding: 8 }}>Ticker</th>
                  <th style={{ padding: 8 }}>Qty</th>
                  <th style={{ padding: 8 }}>Avg</th>
                  <th style={{ padding: 8 }}>Last</th>
                  <th style={{ padding: 8 }}>Value</th>
                  <th style={{ padding: 8 }}>PnL</th>
                  <th style={{ padding: 8 }}>PnL %</th>
                  <th style={{ padding: 8 }}>As of</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.position_id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                    <td style={{ padding: 8 }}>
                      <div style={{ fontWeight: 600 }}>{p.ticker ?? "(no ticker)"}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{p.name}</div>
                    </td>
                    <td style={{ padding: 8 }}>{fmt(p.qty, 2)}</td>
                    <td style={{ padding: 8 }}>{fmt(p.avg_price, 2)}</td>
                    <td style={{ padding: 8 }}>{fmt(p.last_price, 2)}</td>
                    <td style={{ padding: 8 }}>{fmt(p.market_value, 2)}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{ color: (p.unrealized_pnl_abs ?? 0) < 0 ? "crimson" : "inherit" }}>
                        {fmt(p.unrealized_pnl_abs, 2)}
                      </span>
                    </td>
                    <td style={{ padding: 8 }}>
                      <span style={{ color: (p.unrealized_pnl_pct ?? 0) < 0 ? "crimson" : "inherit" }}>
                        {p.unrealized_pnl_pct == null ? "-" : `${fmt(p.unrealized_pnl_pct, 2)}%`}
                      </span>
                    </td>
                    <td style={{ padding: 8, fontSize: 12, opacity: 0.8 }}>
                      {p.asof ? new Date(p.asof).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
