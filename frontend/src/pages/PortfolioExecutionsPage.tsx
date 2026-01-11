import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { getMyExecutions, type ExecutionRead } from "../api/portfolioHistory";

const DEFAULT_LIMIT = 50;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function fmtMoney(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(2);
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
      const sorted = data.sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime());
      setExecs(sorted);
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


  const pageWrapperStyle: CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#131722",
    paddingTop: "24px",
    paddingBottom: "40px",
    paddingLeft: "24px",
    paddingRight: "24px",
    boxSizing: "border-box",
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    color: "#d1d4dc",
    display: "flex",
    flexDirection: "column",
  };

  const panelStyle: CSSProperties = {
    backgroundColor: "#1e222d",
    borderRadius: "6px",
    border: "1px solid #2a2e39",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };

  const headerTitleStyle: CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "#ffffff",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const tableHeaderStyle: CSSProperties = {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "2px solid #2a2e39",
    color: "#8d929b",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
  };

  const tableCellStyle: CSSProperties = {
    padding: "12px 10px",
    borderBottom: "1px solid #2a2e39",
    color: "#d1d4dc",
    fontSize: "13px",
    verticalAlign: "middle",
  };

  if (!token) {
    return (
      <>
        <Header activeTab="none" />
        <div style={{ ...pageWrapperStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#fff' }}>Dostęp zabroniony</h2>
            <Link to="/login" style={{ color: '#26cc62', textDecoration: 'none', fontWeight: 'bold' }}>Zaloguj się</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeTab="history" refreshAction={load} refreshLoading={loading} />

      <div style={pageWrapperStyle}>

        {err && <div style={{ padding: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', marginBottom: '20px' }}>{err}</div>}

        <div style={panelStyle}>
          <div style={headerTitleStyle}>Executions History</div>

          {!loading && !err && execs.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8d929b' }}>
              No executions found.
            </div>
          )}

          {execs.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Executed At</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Qty</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Price</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Fee</th>
                    <th style={tableHeaderStyle}>Order ID</th>
                    <th style={tableHeaderStyle}>Exec ID</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((x) => (
                    <tr key={x.id}>
                      <td style={{ ...tableCellStyle, color: '#8d929b', fontSize: '12px' }}>
                        {fmtDate(x.executed_at)}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 700 }}>
                        {x.qty}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'right', color: '#ffffff' }}>
                        {fmtMoney(x.price)}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'right', color: '#ff4d4d' }}>
                        {x.fee > 0 ? `-${fmtMoney(x.fee)}` : "0.00"} <span style={{ fontSize: '10px', color: '#8d929b' }}>{x.fee_currency}</span>
                      </td>
                      <td style={{ ...tableCellStyle, fontFamily: 'monospace', color: '#64748b', fontSize: '11px' }}>
                        {x.order_id}
                      </td>
                      <td style={{ ...tableCellStyle, fontFamily: 'monospace', color: '#64748b', fontSize: '11px' }}>
                        {x.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !err && execs.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
              Showing {Math.min(DEFAULT_LIMIT, execs.length)} of {execs.length} executions
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}