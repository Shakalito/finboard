import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import { searchListings, type ListingSummary } from "../api/refdata";
import { addToWatchlist } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function ListingsPage() {
  const { token } = useAuth(); 

  const [q, setQ] = useState("");
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function doSearch() {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await searchListings(q, 50); 
      setItems(res);
    } catch (e: any) {
      setErr(e?.message ?? "Search error");
      setItems([]);
    } finally {
      setLoading(false);
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
    
    setActionLoadingId(listingId);
    try {
      await addToWatchlist(token, { listing_id: listingId });
      setMsg("Successfully added to watchlist.");
    } catch (e: any) {
      setErr(e?.message ?? "Add error");
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      doSearch();
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

  const inputStyle: CSSProperties = {
    flex: 1,
    padding: "10px 12px",
    fontSize: "14px",
    backgroundColor: "#131722",
    border: "1px solid #434651",
    borderRadius: "4px",
    color: "#ffffff",
    outline: "none",
  };

  const searchBtnStyle: CSSProperties = {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "#26cc62",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    textTransform: "uppercase",
    transition: "background-color 0.2s",
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

  const addBtnStyle: CSSProperties = {
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    textTransform: "uppercase",
    transition: "all 0.2s",
  };

  return (
    <>
      <Header activeTab="listings" />

      <div style={pageWrapperStyle}>
        
        {msg && <div style={{padding: '12px', background: 'rgba(38, 204, 98, 0.1)', color: '#26cc62', border: '1px solid #26cc62', borderRadius: '4px', marginBottom: '20px'}}>{msg}</div>}
        {err && <div style={{padding: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', marginBottom: '20px'}}>{err}</div>}

        <div style={panelStyle}>
          <div style={headerTitleStyle}>Search Instruments</div>

          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by ticker or company name (e.g. NVDA, Apple)..."
              style={inputStyle}
              autoFocus
            />
            <button onClick={doSearch} style={searchBtnStyle} disabled={loading}>
              {loading ? "SEARCHING..." : "SEARCH"}
            </button>
          </div>
          <div style={{fontSize: '12px', color: '#64748b', marginBottom: '12px'}}>
             Try searching for: AAPL, TSLA, MSFT, BTC, EURUSD...
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Symbol</th>
                  <th style={tableHeaderStyle}>Company Name</th>
                  <th style={tableHeaderStyle}>Exchange</th>
                  <th style={tableHeaderStyle}>Currency</th>
                  <th style={{...tableHeaderStyle, textAlign: 'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading && (
                    <tr>
                        <td colSpan={5} style={{padding: '40px', textAlign: 'center', color: '#8d929b'}}>
                           No results found. Try a different search query.
                        </td>
                    </tr>
                )}
                
                {items.map((x) => {
                  const isAdding = actionLoadingId === x.id;
                  return (
                    <tr key={x.id}>
                      <td style={{...tableCellStyle, fontWeight: 700, color: '#fff'}}>
                        {x.ticker ?? "—"}
                      </td>
                      <td style={tableCellStyle}>{x.name}</td>
                      <td style={tableCellStyle}>
                        {x.venue_code} <span style={{fontSize: '11px', color: '#64748b'}}>{x.venue_name}</span>
                      </td>
                      <td style={tableCellStyle}>{x.currency ?? "-"}</td>
                      <td style={{...tableCellStyle, textAlign: 'right'}}>
                        <button 
                            onClick={() => onAdd(x.id)} 
                            disabled={!token || isAdding}
                            style={{
                                ...addBtnStyle,
                                backgroundColor: !token ? '#2a2e39' : '#3b82f6',
                                color: !token ? '#64748b' : '#fff',
                                cursor: !token || isAdding ? 'not-allowed' : 'pointer',
                                opacity: isAdding ? 0.7 : 1
                            }}
                        >
                            {isAdding ? "ADDING..." : "ADD TO WATCHLIST"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}