import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
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
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(sorted);
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
    setActionLoadingId(orderId);

    try {
      await fillOrder(token, orderId);
      setMsg("Order executed successfully!");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to fill order");
    } finally {
      setActionLoadingId(null);
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

  const executeBtnStyle: CSSProperties = {
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    backgroundColor: "#20ad53",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    transition: "background-color 0.2s",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FILLED': return '#26cc62';
      case 'REJECTED':
      case 'CANCELED': return '#ff4d4d';
      case 'NEW':
      case 'SUBMITTED': return '#3b82f6';
      default: return '#8d929b';
    }
  };

  if (!token) {
    return (
      <>
        <Header activeTab="none" />
        <div style={{ ...pageWrapperStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#fff' }}>Dostęp zabroniony</h2>
            <Link to="/login" style={{ color: '#26cc62', fontWeight: 'bold', textDecoration: 'none' }}>Zaloguj się</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeTab="orders" refreshAction={load} refreshLoading={loading} />

      <div style={pageWrapperStyle}>

        {msg && <div style={{ padding: '12px', background: 'rgba(38, 204, 98, 0.1)', color: '#26cc62', border: '1px solid #26cc62', borderRadius: '4px', marginBottom: '20px' }}>{msg}</div>}
        {err && <div style={{ padding: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', marginBottom: '20px' }}>{err}</div>}

        <div style={panelStyle}>
          <div style={headerTitleStyle}>Active & Recent Orders</div>

          {!loading && !err && orders.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8d929b' }}>
              No orders found.
            </div>
          )}

          {orders.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Time</th>
                    <th style={tableHeaderStyle}>Side</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Qty</th>
                    <th style={tableHeaderStyle}>Instrument</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Order ID</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((o) => {
                    const isBuy = o.side === 'BUY';
                    const statusColor = getStatusColor(o.state);
                    const isActionable = o.state === "NEW" || o.state === "SUBMITTED";

                    return (
                      <tr key={o.id}>
                        <td style={{ ...tableCellStyle, color: '#8d929b', fontSize: '12px' }}>
                          {fmtDate(o.created_at)}
                        </td>
                        <td style={{ ...tableCellStyle, fontWeight: 700, color: isBuy ? '#26cc62' : '#ff4d4d' }}>
                          {o.side}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                          {o.qty}
                        </td>
                        <td style={{ ...tableCellStyle, fontFamily: 'monospace', color: '#d1d4dc' }}>
                          {o.instrument_id}
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: `${statusColor}20`,
                            color: statusColor,
                            border: `1px solid ${statusColor}40`
                          }}>
                            {o.state}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, fontFamily: 'monospace', color: '#64748b', fontSize: '11px' }}>
                          {o.id}
                        </td>

                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                          {isActionable ? (
                            <button
                              onClick={() => onFill(o.id)}
                              disabled={actionLoadingId === o.id || loading}
                              style={{
                                ...executeBtnStyle,
                                opacity: actionLoadingId === o.id ? 0.7 : 1,
                                cursor: actionLoadingId === o.id ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {actionLoadingId === o.id ? "..." : "EXECUTE"}
                            </button>
                          ) : (
                            <span style={{ opacity: 0.3, fontSize: '18px' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !err && orders.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
              Showing {Math.min(DEFAULT_LIMIT, orders.length)} of {orders.length} orders
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}