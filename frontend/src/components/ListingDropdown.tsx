import { useEffect, useMemo, useRef, useState } from "react";
import { searchListings, type ListingSummary } from "../api/refdata";

type Props = {
  value: ListingSummary | null;
  onChange: (v: ListingSummary | null) => void;
  placeholder?: string;
  limit?: number;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export function ListingDropdown({
  value,
  onChange,
  placeholder = "Search ticker or company name (e.g. AAPL, Tesla)...",
  limit = 20,
}: Props) {
  const [query, setQuery] = useState<string>(value?.ticker ?? value?.name ?? "");
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (value) {
      setQuery(value.ticker ? `${value.ticker} — ${value.name}` : value.name);
    } else {
      setQuery("");
    }
  }, [value]);

  const canSearch = useMemo(() => debouncedQuery.trim().length >= 1, [debouncedQuery]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr(null);

      if (!canSearch) {
        setItems([]);
        return;
      }

      setLoading(true);
      try {
        const res = await searchListings(debouncedQuery.trim(), limit);
        if (cancelled) return;
        setItems(res);
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message ?? "Failed to load listings");
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [canSearch, debouncedQuery, limit]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocDown(ev: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function selectItem(it: ListingSummary) {
    onChange(it);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setItems([]);
    setErr(null);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          style={{
            flex: 1,
            padding: "10px 10px",
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
        <button type="button" onClick={clear} disabled={!query && !value}>
          Clear
        </button>
      </div>

      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
        {loading && <span>Searching…</span>}
        {!loading && err && <span style={{ color: "crimson" }}>{err}</span>}
        {!loading && !err && value && (
          <span>
            Selected: <b>{value.ticker ?? "(no ticker)"}</b> — {value.name} ({value.venue_code})
          </span>
        )}
        {!loading && !err && !value && query.trim().length > 0 && (
          <span>Pick a result from the list.</span>
        )}
      </div>

      {open && (items.length > 0 || loading || err) && (
        <div
          style={{
            position: "absolute",
            top: 46,
            left: 0,
            right: 0,
            zIndex: 20,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => selectItem(it)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {it.ticker ?? "(no ticker)"} <span style={{ fontWeight: 400 }}>— {it.name}</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {it.venue_code} • {it.venue_name} • {it.currency ?? "-"}
              </div>
            </button>
          ))}

          {!loading && !err && items.length === 0 && (
            <div style={{ padding: 12, opacity: 0.8 }}>No results.</div>
          )}
        </div>
      )}
    </div>
  );
}
