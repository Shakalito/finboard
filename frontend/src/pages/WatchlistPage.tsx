import { useEffect, useState } from "react";
import { getMyWatchlist, removeFromWatchlist, type WatchlistItemRead } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";

export function WatchlistPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<WatchlistItemRead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Remove error");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2>My watchlist</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <a href="/listings">Search listings</a>
        <a href="/me">Me</a>
      </div>

      {msg && <p>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((x) => (
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
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {x.venue_code} / {x.venue_name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                added: {new Date(x.created_at).toLocaleString()}
              </div>
            </div>
            <button onClick={() => onRemove(x.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
