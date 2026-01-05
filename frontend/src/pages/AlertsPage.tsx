import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { deleteAlert, getMyAlerts, setAlertActive, type AlertRead } from "../api/alerts";

type Filter = "active" | "inactive" | "all";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function AlertsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AlertRead[]>([]);
  const [filter, setFilter] = useState<Filter>("active");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr(null);
    setMsg(null);
    if (!token) {
      setErr("You must be logged in.");
      return;
    }
    setLoading(true);
    try {
      const activeParam = filter === "all" ? undefined : filter === "active";
      const data = await getMyAlerts(token, activeParam);
      setItems(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(err => console.error("Failed to load alerts", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter]);

  async function onToggle(a: AlertRead) {
    if (!token) return;
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      await setAlertActive(token, a.id, !a.is_active);
      setMsg("Updated.");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update alert.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      await deleteAlert(token, id);
      setMsg("Deleted.");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete alert.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2>Alerts</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
        <Link to="/me">Me</Link>
        <Link to="/portfolio">Portfolio</Link>
        <Link to="/alerts/new">New alert</Link>
        <Link to="/watchlist">Watchlist</Link>

        <button onClick={load} disabled={loading}>
          Refresh
        </button>

        <div style={{ marginLeft: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ opacity: 0.8 }}>Filter:</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} disabled={loading}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="all">all</option>
          </select>
        </div>
      </div>

      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {loading && <p>Loading...</p>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Created</th>
              <th style={th}>Listing</th>
              <th style={th}>Condition</th>
              <th style={th}>Target</th>
              <th style={th}>Active</th>
              <th style={th}>Triggered</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td style={td}>{fmtDate(a.created_at)}</td>
                <td style={td} title={a.listing_id}>
                  {a.ticker ?? "(no ticker)"}{" "}
                    <span style={{ opacity: 0.6 }}>
                      {a.venue_code ? `(${a.venue_code})` : ""}
                    </span>
                </td>
                <td style={td}>{a.condition}</td>
                <td style={td}>
                  {a.target_price} {a.currency}
                </td>
                <td style={td}>
                  <button onClick={() => onToggle(a)} disabled={loading}>
                    {a.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
                <td style={td}>{fmtDate(a.last_triggered_at)}</td>
                <td style={td}>
                  <button onClick={() => onDelete(a.id)} disabled={loading}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && (
              <tr>
                <td style={td} colSpan={7}>
                  No alerts.
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
