import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAlerts } from "../context/AlertsContext";
import { deleteAlert, setAlertActive, type AlertRead } from "../api/alerts";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Notification } from "../components/Notification";

type Filter = "active" | "inactive" | "all";

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

export function AlertsPage() {
  const { token } = useAuth();
  const { alerts, loading, error: ctxError, refresh } = useAlerts();

  const [filter, setFilter] = useState<Filter>("active");
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Combine context error with local action error
  const err = localErr ?? ctxError;

  // Client-side filtering
  const items = alerts.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'active') return a.is_active;
    if (filter === 'inactive') return !a.is_active;
    return true;
  });

  async function onToggle(a: AlertRead) {
    if (!token) return;
    setLocalErr(null);
    setMsg(null);
    setActionLoadingId(a.id);
    try {
      await setAlertActive(token, a.id, !a.is_active);
      setMsg("Alert updated.");
      await refresh(); // Refresh global state to reflect change
    } catch (e: any) {
      setLocalErr(e?.message ?? "Failed to update alert.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    setLocalErr(null);
    setMsg(null);
    setActionLoadingId(id);
    try {
      await deleteAlert(token, id);
      setMsg("Alert deleted.");
      await refresh(); // Refresh global state to remove from list
    } catch (e: any) {
      setLocalErr(e?.message ?? "Failed to delete alert.");
    } finally {
      setActionLoadingId(null);
    }
  }


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

  const actionBtnStyle = (variant: 'toggle' | 'delete'): CSSProperties => ({
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: variant === 'delete' ? "rgba(255, 77, 77, 0.1)" : "#2a2e39",
    color: variant === 'delete' ? "#ff4d4d" : "#d1d4dc",
    border: variant === 'delete' ? "1px solid #ff4d4d" : "1px solid #434651",
    borderRadius: "4px",
    transition: "all 0.2s",
  });

  const selectStyle: CSSProperties = {
    backgroundColor: "#1e222d",
    color: "#d1d4dc",
    border: "1px solid #434651",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "13px",
    outline: "none",
    marginLeft: "6px"
  };

  const createBtnStyle: CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "#26cc62",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase"
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
      <Header activeTab="alerts" refreshAction={() => refresh()} refreshLoading={loading} />

      <div style={pageWrapperStyle}>

        {msg && (
          <Notification message={msg} type="success" onClose={() => setMsg(null)} />
        )}
        {err && (
          <Notification message={err} type="error" onClose={() => setLocalErr(null)} />
        )}

        <div style={panelStyle}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={headerTitleStyle}>Price Alerts</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: "flex", alignItems: "center", fontSize: '13px', color: '#8d929b' }}>
                <span>Filter:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as Filter)}
                  // disabled={loading} // Don't disable during bg polling
                  style={selectStyle}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All</option>
                </select>
              </div>

              <Link to="/alerts/new" style={createBtnStyle}>
                + New Alert
              </Link>
            </div>
          </div>

          {!loading && items.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8d929b' }}>
              No alerts found matching this filter.
            </div>
          )}

          {items.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Created</th>
                    <th style={tableHeaderStyle}>Listing</th>
                    <th style={tableHeaderStyle}>Condition</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Target</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Last Trigger</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => {
                    const isLoading = actionLoadingId === a.id;
                    return (
                      <tr key={a.id}>
                        <td style={{ ...tableCellStyle, color: '#8d929b', fontSize: '12px' }}>
                          {fmtDate(a.created_at)}
                        </td>
                        <td style={tableCellStyle} title={a.listing_id}>
                          <span style={{ fontWeight: 700, color: '#fff' }}>{a.ticker ?? "-"}</span>
                          <span style={{ opacity: 0.6, fontSize: '11px', marginLeft: '6px' }}>
                            {a.venue_code}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, fontWeight: 600 }}>
                          {a.condition === "ABOVE" ? "Above (>)" : "Below (<)"}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'right', color: '#26cc62', fontWeight: 700 }}>
                          {a.target_price} <span style={{ fontSize: '10px', fontWeight: 400, color: '#8d929b' }}>{a.currency}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: a.is_active ? '#26cc6220' : '#8d929b20',
                            color: a.is_active ? '#26cc62' : '#8d929b',
                            border: a.is_active ? '1px solid #26cc6240' : '1px solid #8d929b40'
                          }}>
                            {a.is_active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, color: '#8d929b', fontSize: '12px' }}>
                          {fmtDate(a.last_triggered_at)}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => onToggle(a)}
                              disabled={isLoading || loading}
                              style={actionBtnStyle('toggle')}
                            >
                              {a.is_active ? "DISABLE" : "ENABLE"}
                            </button>
                            <button
                              onClick={() => onDelete(a.id)}
                              disabled={isLoading || loading}
                              style={actionBtnStyle('delete')}
                            >
                              DEL
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}