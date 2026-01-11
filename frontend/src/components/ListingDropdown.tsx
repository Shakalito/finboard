import { useEffect, useRef, useState, type KeyboardEvent } from "react";
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
  placeholder = "Search ticker...",
  limit = 20,
}: Props) {
  const formatDisplay = (item: ListingSummary) =>
    item.ticker ? `${item.ticker} — ${item.name}` : item.name;

  const [query, setQuery] = useState<string>("");
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hoverClear, setHoverClear] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const isSelectionUpdate = useRef(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (value) {
      setQuery(formatDisplay(value));
      isSelectionUpdate.current = true;
    }
  }, [value]);

  const canSearch = true; // Always allow search to support "instant" results on click

  useEffect(() => {
    if (isSelectionUpdate.current) {
      isSelectionUpdate.current = false;
      return;
    }

    let cancelled = false;

    async function run() {
      setErr(null);
      if (cancelled) return;

      // Only search if the dropdown is open (user has focused/clicked)
      if (!isOpen) {
        setItems([]);
        return;
      }

      setLoading(true);
      try {
        const res = await searchListings(debouncedQuery.trim(), limit);
        if (cancelled) return;
        setItems(res);
        setHighlightedIndex(-1);
        // setIsOpen(true); // Already true if we passed the check above
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message ?? "Error loading listings");
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [debouncedQuery, limit, isOpen]);

  useEffect(() => {
    function onDocDown(ev: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function selectItem(it: ListingSummary) {
    setQuery(formatDisplay(it));
    isSelectionUpdate.current = true;
    onChange(it);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setItems([]);
    setErr(null);
    setIsOpen(false);
    isSelectionUpdate.current = true;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === "ArrowDown") setIsOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && items[highlightedIndex]) {
          selectItem(items[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  }


  const styles = {
    container: {
      position: "relative" as const,
      width: "100%",
      fontFamily: "Roboto, sans-serif",
    },
    row: {
      display: "flex",
      gap: "8px",
      height: "40px",
    },
    input: {
      flex: 1,
      padding: "0 12px",
      fontSize: "14px",
      backgroundColor: "#131722",
      border: isOpen ? "1px solid #26cc62" : "1px solid #434651",
      borderRadius: "4px",
      color: "#ffffff",
      outline: "none",
      height: "100%",
    },
    clearBtn: {
      padding: "0 14px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      backgroundColor: hoverClear ? "#434651" : "#2a2e39",
      color: hoverClear ? "#ffffff" : "#8d929b",
      border: "1px solid #434651",
      borderRadius: "4px",
      transition: "all 0.2s",
      textTransform: "uppercase" as const,
      height: "100%",
      display: "flex",
      alignItems: "center",
    },
    dropdown: {
      position: "absolute" as const,
      top: "calc(100% + 4px)",
      left: 0,
      right: 0,
      zIndex: 100,
      backgroundColor: "#1e222d",
      border: "1px solid #434651",
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      maxHeight: "300px",
      overflowY: "auto" as const,
    },
    item: (isActive: boolean) => ({
      padding: "10px 12px",
      cursor: "pointer",
      backgroundColor: isActive ? "#2a2e39" : "transparent",
      borderBottom: "1px solid #2a2e39",
      color: "#d1d4dc",
    }),
    ticker: {
      fontWeight: 700,
      color: "#ffffff",
      fontSize: "14px",
    },
    meta: {
      fontSize: "12px",
      color: "#8d929b",
      marginTop: "2px",
    },
  };

  return (
    <div ref={wrapRef} style={styles.container}>
      <div style={styles.row}>
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={styles.input}
        />


        {(query || value) && (
          <button
            type="button"
            onClick={clear}
            style={styles.clearBtn}
            onMouseEnter={() => setHoverClear(true)}
            onMouseLeave={() => setHoverClear(false)}
          >
            CLEAR
          </button>
        )}
      </div>

      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, minHeight: 18 }}>
        {loading && <span style={{ color: '#8d929b' }}>Searching...</span>}
        {!loading && err && <span style={{ color: "#ff4d4d" }}>{err}</span>}
      </div>

      {isOpen && (items.length > 0 || !loading) && !err && (
        <div style={styles.dropdown}>
          {items.map((it, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={it.id || index}
                onClick={() => selectItem(it)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={styles.item(isHighlighted)}
              >
                <div style={styles.ticker}>
                  {it.ticker ?? ""} <span style={{ fontWeight: 400, color: '#d1d4dc' }}>— {it.name}</span>
                </div>
                <div style={styles.meta}>
                  {it.venue_code} • {it.venue_name}
                </div>
              </div>
            );
          })}

          {items.length === 0 && query.length > 0 && (
            <div style={{ padding: 12, color: '#8d929b', textAlign: 'center' }}>No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}