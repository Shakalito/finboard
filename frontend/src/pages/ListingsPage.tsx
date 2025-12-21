import { useEffect, useState } from "react";
import { searchListings, type ListingSummary } from "../api/refdata";
import { addToWatchlist } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";

export function ListingsPage() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function doSearch() {
    setErr(null);
    setMsg(null);
    try {
      const res = await searchListings(q, 20);
      setItems(res);
    } catch (e: any) {
      setErr(e?.message ?? "Search error");
    }
  }

  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd(listingId: string) {
    setErr(null);
    setMsg(null);
    if (!token) {
      setErr("You must be logged in to add to watchlist.");
      return;
    }
    try {
      await addToWatchlist(token, { listing_id: listingId });
      setMsg("Added to watchlist.");
    } catch (e: any) {
      setErr(e?.message ?? "Add error");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2>Search listings</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for listings by ticker or name (e.g. AAPL)"
          style={{ flex: 1 }}
        />
        <button onClick={doSearch}>Search</button>
        <a href="/watchlist">My watchlist</a>
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
                {x.venue_code} / {x.venue_name} • {x.currency ?? "-"}
              </div>
            </div>
            <button onClick={() => onAdd(x.id)} disabled={!token}>
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
