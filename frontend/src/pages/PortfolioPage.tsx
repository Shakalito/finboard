import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  createPaperAccount,
  deposit,
  getAccountBalance,
  getMyAccounts,
  getMyPositions,
  placeOrder,
  type AccountRead,
  type PositionRead,
} from "../api/portfolio";
import { ListingDropdown } from "../components/ListingDropdown";
import type { ListingSummary } from "../api/refdata";

type Side = "BUY" | "SELL";

function fmtMoney(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(2);
}

function fmtNum(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return String(v);
}

export function PortfolioPage() {
  const { token } = useAuth();

  const [account, setAccount] = useState<AccountRead | null>(null);
  const [cash, setCash] = useState<number | null>(null);
  const [positions, setPositions] = useState<PositionRead[]>([]);
  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [depAmount, setDepAmount] = useState<string>("1000");

  const [side, setSide] = useState<Side>("BUY");
  const [selectedListing, setSelectedListing] = useState<ListingSummary | null>(null);
  const [qty, setQty] = useState<string>("1");
  const [tradeBusy, setTradeBusy] = useState(false);

  const canUseApi = useMemo(() => !!token, [token]);

  async function ensurePaperAccount(): Promise<AccountRead> {
    const accs = await getMyAccounts(token!);
    const paper = accs.find((a) => a.type === "PAPER") ?? null;
    if (paper) return paper;

    return await createPaperAccount(token!, "USD");
  }

  async function refreshAll() {
    if (!token) return;
    setLoading(true);
    setErr(null);

    try {
      const paper = await ensurePaperAccount();
      setAccount(paper);

      const bal = await getAccountBalance(token, paper.id, paper.base_currency);
      setCash(bal.balance);

      const pos = await getMyPositions(token);
      setPositions(pos);
    } catch (e: any) {
      setErr(e?.message ?? "Portfolio load error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setAccount(null);
      setCash(null);
      setPositions([]);
      return;
    }
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onDepositClick() {
    setMsg(null);
    setErr(null);
    if (!token) return;
    if (!account) {
      setErr("No account available.");
      return;
    }

    const amount = Number(depAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr("Deposit amount must be > 0.");
      return;
    }

    try {
      await deposit(token, account.id, amount, account.base_currency);
      setMsg("Deposit completed.");
      await refreshAll();
    } catch (e: any) {
      setErr(e?.message ?? "Deposit error");
    }
  }

  async function onTradeClick() {
    setMsg(null);
    setErr(null);

    if (!token) return;
    if (!account) {
      setErr("No account available.");
      return;
    }

    if (!selectedListing?.id) {
      setErr("Please select a listing from the dropdown first.");
      return;
    }

    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      setErr("Quantity must be greater than 0.");
      return;
    }

    setTradeBusy(true);
    try {
      await placeOrder(token, {
        account_id: account.id,
        listing_id: selectedListing.id,
        side,
        qty: q,
      });

      setMsg(`${side} order created successfully.`);
      //setSelectedListing(null)
      await refreshAll();
    } catch (e: any) {
      setErr(e?.message ?? "Order error");
    } finally {
      setTradeBusy(false);
    }
  }

  if (!token) {
    return (
      <div style={{ padding: 24, maxWidth: 1100 }}>
        <h2>Portfolio</h2>
        <p style={{ color: "crimson" }}>You must be logged in to view portfolio.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/login">Login</Link>
          <Link to="/me">Me</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2>Portfolio</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/watchlist">Watchlist</Link>
        <Link to="/portfolio/orders">Orders</Link>
        <Link to="/portfolio/executions">Executions</Link>
        <Link to="/portfolio/deposit">Deposit</Link>
        <button onClick={() => refreshAll()} disabled={loading}>
          Refresh
        </button>
      </div>

      {msg && <p>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ fontWeight: 700 }}>Account</div>
          {!account && <div>Loading account...</div>}
          {account && (
            <>
              <div style={{ fontSize: 13, opacity: 0.85 }}>id: {account.id}</div>
              <div>
                Cash balance:{" "}
                <b>
                  {cash == null ? "—" : fmtMoney(cash)} {account.base_currency}
                </b>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <input
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  placeholder="Deposit amount"
                  style={{ width: 160 }}
                />
                <button onClick={() => onDepositClick()} disabled={loading}>
                  Deposit
                </button>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  Tip: base currency = {account.base_currency}
                </span>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>Trade</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setSide("BUY")}
                disabled={tradeBusy}
                style={{
                  fontWeight: side === "BUY" ? 700 : 400,
                }}
              >
                BUY
              </button>
              <button
                onClick={() => setSide("SELL")}
                disabled={tradeBusy}
                style={{
                  fontWeight: side === "SELL" ? 700 : 400,
                }}
              >
                SELL
              </button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.8 }}>
                Listing (select by ticker/name)
              </div>
              <ListingDropdown value={selectedListing} onChange={setSelectedListing} />
            </div>


            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="qty"
              style={{ width: 120 }}
              disabled={tradeBusy || !canUseApi}
            />

            <button onClick={() => onTradeClick()} disabled={tradeBusy || !account}
            style={{
              padding: "8px 16px",
              cursor: (tradeBusy || !selectedListing?.id) ? "not-allowed" : "pointer",
              backgroundColor: side === "BUY" ? "#e8f5e9" : "#ffebee",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}>
              {tradeBusy ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Positions</div>

          {loading && <div>Loading...</div>}
          {!loading && positions.length === 0 && <div>No positions.</div>}

          {!loading && positions.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Ticker</th>
                    <th style={th}>Name</th>
                    <th style={th}>Venue</th>
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
                      <td style={td}>{p.venue_code}</td>
                      <td style={td}>{fmtNum(p.qty)}</td>
                      <td style={td}>{fmtMoney(p.avg_price)}</td>
                      <td style={td}>{fmtMoney(p.last_price)}</td>
                      <td style={td}>{fmtMoney(p.market_value)}</td>
                      <td style={td}>{fmtMoney(p.unrealized_pnl_abs)}</td>
                      <td style={td}>
                        {p.unrealized_pnl_pct == null ? "—" : (p.unrealized_pnl_pct * 100).toFixed(2) + "%"}
                      </td>
                      <td style={td}>{p.asof ? new Date(p.asof).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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
