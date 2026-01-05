import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createAlert, type AlertCondition } from "../api/alerts";
import { searchListings, type ListingSummary } from "../api/refdata";

export function NewAlertPage() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [listingId, setListingId] = useState<string>("");
  const [condition, setCondition] = useState<AlertCondition>("ABOVE");
  const [target, setTarget] = useState<string>("300");
  const [currency, setCurrency] = useState<string>("USD");

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const t = Number(target);
    return Boolean(listingId) && Number.isFinite(t) && t > 0;
  }, [listingId, target]);

  useEffect(() => {
    if (!token) {
      nav("/login");
    }
  }, [token, nav]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await searchListings(q, 20);
        if (cancelled) return;
        setListings(res);
        if (!listingId && res.length > 0) setListingId(res[0].id);
        if (res.length > 0 && res[0].currency) setCurrency(res[0].currency ?? "USD");
      } catch {
        if (cancelled) return;
        setListings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!token) {
      setErr("You must be logged in.");
      return;
    }
    if (!canSubmit) {
      setErr("Fill listing and valid target price.");
      return;
    }

    setLoading(true);
    try {
      await createAlert(token, {
        listing_id: listingId,
        condition,
        target_price: Number(target),
      });
      setMsg("Alert created.");
      nav("/alerts");
    } catch (ex: any) {
      setErr(ex?.message ?? "Failed to create alert.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2>New alert</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/alerts">Back</Link>
      </div>

      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label>
          Search listing
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. AAPL"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Listing
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            disabled={loading}
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.ticker ?? "(no ticker)"} — {l.name} ({l.venue_code})
              </option>
            ))}
            {listings.length === 0 && <option value="">No results</option>}
          </select>
        </label>

        <label>
          Condition
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as AlertCondition)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            disabled={loading}
          >
            <option value="ABOVE">ABOVE</option>
            <option value="BELOW">BELOW</option>
          </select>
        </label>

        <label>
          Target price
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            inputMode="decimal"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            disabled={loading}
          />
        </label>

        <label>
          Currency
          <input
            value={currency}
            disabled
            style={{ width: "100%", padding: 8, marginTop: 6, opacity: 0.8 }}
          />
        </label>

        <button type="submit" disabled={loading || !canSubmit} style={{ padding: 10 }}>
          Create alert
        </button>
      </form>
    </div>
  );
}
