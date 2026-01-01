import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyExecutions, type ExecutionRead } from "../api/portfolioHistory";


const DEFAULT_LIMIT = 50;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function PortfolioExecutionsPage() {
  const { token } = useAuth();
  const [execs, setExecs] = useState<ExecutionRead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shown = useMemo(() => execs.slice(0, DEFAULT_LIMIT), [execs]);

  async function load() {
    setErr(null);
    if (!token) {
      setErr("You must be logged in.");
      return;
    }
    setLoading(true);
    try {
      const data = await getMyExecutions(token);
      setExecs(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load executions.");
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
      <h2>Portfolio • Executions</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/portfolio">Back to portfolio</Link>
        <Link to="/portfolio/orders">Orders</Link>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !err && (
        <p style={{ opacity: 0.8 }}>
          Showing {Math.min(DEFAULT_LIMIT, execs.length)} of {execs.length} executions (limit in UI).
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Executed</th>
              <th style={th}>Qty</th>
              <th style={th}>Price</th>
              <th style={th}>Fee</th>
              <th style={th}>Order ID</th>
              <th style={th}>Exec ID</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((x) => (
              <tr key={x.id}>
                <td style={td}>{fmtDate(x.executed_at)}</td>
                <td style={td}>{x.qty}</td>
                <td style={td}>{x.price}</td>
                <td style={td}>
                  {x.fee}
                  {x.fee_currency ? ` ${x.fee_currency}` : ""}
                </td>
                <td style={td} title={x.order_id}>
                  {x.order_id.slice(0, 8)}…
                </td>
                <td style={td} title={x.id}>
                  {x.id.slice(0, 8)}…
                </td>
              </tr>
            ))}

            {shown.length === 0 && !loading && (
              <tr>
                <td style={td} colSpan={6}>
                  No executions.
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
