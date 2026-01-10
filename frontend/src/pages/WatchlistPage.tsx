import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom"; 
import { getMyWatchlist, removeFromWatchlist, type WatchlistItemRead } from "../api/watchlist";
import { useAuth } from "../auth/AuthContext";
import { useQuotes } from "../marketdata/useQuotes";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

function fmtMoney(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(2);
}

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
    if (!token) return;

    try {
      const res = await getMyWatchlist(token);
      setItems(res);
    } catch (e: any) {
      setErr(e?.message ?? "Load error");
    }
  }

  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onRemove(id: string) {
    setErr(null);
    setMsg(null);
    if (!token) return;
    try {
      await removeFromWatchlist(token, id);
      setMsg("Item removed from watchlist.");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setErr(e?.message ?? "Remove error");
    }
  }

  const handleRefresh = () => {
      reload(); 
      load();   
  };


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

  const actionBtnStyle = (variant: 'remove' | 'chart'): CSSProperties => ({
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: variant === 'remove' ? "rgba(255, 77, 77, 0.1)" : "#2a2e39",
    color: variant === 'remove' ? "#ff4d4d" : "#26cc62",
    border: variant === 'remove' ? "1px solid #ff4d4d" : "1px solid #2a2e39",
    borderRadius: "4px",
    textDecoration: "none",
    display: "inline-block",
    transition: "all 0.2s",
  });

  if (!token) {
    return (
      <>
        <Header activeTab="none" />
        <div style={{ ...pageWrapperStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
             <h2 style={{color: '#fff'}}>Dostęp zabroniony</h2>
             <p style={{color: '#8d929b', marginBottom: '20px'}}>Musisz się zalogować, aby zobaczyć watchlistę.</p>
             <Link to="/login" style={{color: '#26cc62', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold'}}>Zaloguj się</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeTab="watchlist" refreshAction={handleRefresh} />

      <div style={pageWrapperStyle}>
        
        {msg && <div style={{padding: '12px', background: 'rgba(38, 204, 98, 0.1)', color: '#26cc62', border: '1px solid #26cc62', borderRadius: '4px', marginBottom: '20px'}}>{msg}</div>}
        {err && <div style={{padding: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', marginBottom: '20px'}}>{err}</div>}

        <div style={panelStyle}>
          <div style={headerTitleStyle}>My Watchlist</div>

          {items.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8d929b' }}>
              Your watchlist is empty. Go to <Link to="/listings" style={{color: '#26cc62'}}>Search Assets</Link> to add some.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Symbol</th>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Exchange</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Price</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Time</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((x) => {
                    const q = quotes[x.listing_id];
                    
                    return (
                      <tr key={x.id}>
                        <td style={{...tableCellStyle, fontWeight: 700, color: '#fff'}}>
                          {x.ticker ?? "—"}
                        </td>
                        <td style={tableCellStyle}>{x.name}</td>
                        <td style={tableCellStyle}>
                          {x.venue_code} <span style={{color: '#8d929b', fontSize: '11px'}}>{x.venue_name}</span>
                        </td>
                        
                        {/* PRICE COLUMN */}
                        <td style={{...tableCellStyle, textAlign: 'right', fontWeight: 600}}>
                          {q?.loading && <span style={{color: '#8d929b'}}>...</span>}
                          
                          {!q?.loading && q?.error && (
                             <span style={{color: '#ff4d4d', fontSize: '11px'}}>Error</span>
                          )}

                          {!q?.loading && !q?.error && q?.data ? (
                             <span style={{color: '#ffffff'}}>{fmtMoney(q.data.price)}</span>
                          ) : null}
                          
                          {!q?.loading && !q?.error && !q?.data && <span style={{color: '#8d929b'}}>—</span>}
                        </td>

                        {/* TIME COLUMN */}
                        <td style={{...tableCellStyle, textAlign: 'right', color: '#8d929b', fontSize: '12px'}}>
                           {q?.data?.timestamp ? new Date(q.data.timestamp).toLocaleTimeString() : "—"}
                        </td>

                        {/* ACTIONS COLUMN */}
                        <td style={{...tableCellStyle, textAlign: 'right'}}>
                           <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                             <Link 
                               to={`/chart/${x.listing_id}`} 
                               style={actionBtnStyle('chart')}
                             >
                               CHART
                             </Link>
                             <button 
                               onClick={() => onRemove(x.id)}
                               style={{
                                 ...actionBtnStyle('remove'),
                                 display: 'inline-flex', 
                                 alignItems: 'center'
                               }}
                             >
                               REMOVE
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