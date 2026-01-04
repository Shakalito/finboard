import { useEffect, useState } from "react";
import { getMyWatchlist, removeFromWatchlist, type WatchlistItemRead } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";
import { useQuotes } from "../marketdata/useQuotes";
import { Link } from "react-router-dom";

export function WatchlistPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<WatchlistItemRead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const listingIds = items.map((x) => x.listing_id);
  const { quotes, reload } = useQuotes(listingIds, 0);

  async function load() {
    setErr(null);
    setMsg(null);
    if (!token) {
      setErr("You must be logged in to view watchlist.");
      return;
    }
    try {
      const res = await getMyWatchlist(token);
      setItems(res);
    } catch (e: any) {
      setErr(e?.message ?? "Load error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onRemove(id: string) {
    setErr(null);
    setMsg(null);
    if (!token) return;
    try {
      await removeFromWatchlist(token, id);
      setMsg("Removed.");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setErr(e?.message ?? "Remove error");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2>My watchlist</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <a href="/listings">Search listings</a>
        <a href="/alerts">Alerts</a>
        <a href="/me">Me</a>
        <button onClick={() => reload()} disabled={!items.length}>
          Refresh quotes
        </button>
      </div>

      {msg && <p>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((x) => {
          const q = quotes[x.listing_id];

          return (
            <div
              key={x.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {x.ticker ?? "(no ticker)"} — {x.name}
                </div>

                <div style={{ fontSize: 12, marginTop: 6 }}>
                  {q?.loading && <span>Quote: loading...</span>}

                  {!q?.loading && q?.data?.price != null && (
                    <span>
                      Quote: <b>{q.data.price}</b>{" "}
                      {q.data.timestamp ? `(${new Date(q.data.timestamp).toLocaleString()})` : ""}
                    </span>
                  )}

                  {!q?.loading && q?.error && (
                    <span style={{ color: "crimson" }}>Quote error: {q.error}</span>
                  )}

                  {!q?.loading && !q?.data && !q?.error && <span>Quote: -</span>}
                </div>

                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {x.venue_code} / {x.venue_name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  added: {new Date(x.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Link to={`/chart/${x.listing_id}`} style={{ marginRight: 12 }}>
                  Chart
                </Link>
                <button onClick={() => onRemove(x.id)}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}