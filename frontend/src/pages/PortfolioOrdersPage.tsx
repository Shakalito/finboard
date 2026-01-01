import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyOrders } from "../api/portfolioHistory";
import { fillOrder, type OrderRead } from "../api/portfolio";

const DEFAULT_LIMIT = 50;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function PortfolioOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderRead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shown = useMemo(() => orders.slice(0, DEFAULT_LIMIT), [orders]);

  async function load() {
    setErr(null);
    if (!token) {
      setErr("You must be logged in.");
      return;
    }
    setLoading(true);
    try {
      const data = await getMyOrders(token);
      setOrders(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function onFill(orderId: string) {
      if (!token) return;
      setErr(null);
      setMsg(null);
      setLoading(true);
      try {
        await fillOrder(token, orderId);
        setMsg("Order filled successfully!");
        await load(); 
      } catch (e: any) {
        setErr(e?.message ?? "Failed to fill order");
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2>Portfolio • Orders</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/portfolio">Back to portfolio</Link>
        <Link to="/portfolio/executions">Executions</Link>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {msg && <p style={{ color: "green", fontWeight: "bold" }}>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !err && (
        <p style={{ opacity: 0.8 }}>
          Showing {Math.min(DEFAULT_LIMIT, orders.length)} of {orders.length} orders (display limit set in UI).
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Created</th>
              <th style={th}>Side</th>
              <th style={th}>Qty</th>
              <th style={th}>State</th>
              <th style={th}>Instrument</th>
              <th style={th}>Account</th>
              <th style={th}>Order ID</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id}>
                <td style={td}>{fmtDate(o.created_at)}</td>
                <td style={td}>{o.side}</td>
                <td style={td}>{o.qty}</td>
                <td style={td}>{o.state}</td>
                <td style={td} title={o.instrument_id}>
                  {o.instrument_id.slice(0, 8)}…
                </td>
                <td style={td} title={o.account_id}>
                  {o.account_id.slice(0, 8)}…
                </td>
                <td style={td} title={o.id}>
                  {o.id.slice(0, 8)}…
                </td>

                <td style={td}>
                  {o.state === "NEW" || o.state === "SUBMITTED" ? (
                    <button onClick={() => onFill(o.id)} disabled={loading}>
                      Execute
                    </button>
                  ) : (
                    <span style={{ opacity: 0.5 }}>—</span>
                  )}
                </td>
              </tr>
            ))}

            {shown.length === 0 && !loading && (
              <tr>
                <td style={td} colSpan={8}>
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
