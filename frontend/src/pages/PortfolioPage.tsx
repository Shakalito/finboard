import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Header } from "../components/Header";
import { Notification } from "../components/Notification";
import { Footer } from "../components/Footer";
import {
  createPaperAccount,
  deposit,
  getAccountBalance,
  getMyAccounts,
  getMyPositions,
  placeOrder,
  type AccountRead,
  type PositionRead,
} from "../api/portfolio";
import { getQuotesBatch, type QuoteResponse } from "../api/marketdata";
import { ListingDropdown } from "../components/ListingDropdown";
import type { ListingSummary } from "../api/refdata";

// --- KONFIGURACJA ---
// Prowizja 0.25% (0.0025)
const COMMISSION_RATE = 0.0025;

type Side = "BUY" | "SELL";

function fmtMoney(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "-";
  return v.toFixed(2);
}

function fmtNum(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "-";
  return String(v);
}

export function PortfolioPage() {
  const { token } = useAuth();
  const [account, setAccount] = useState<AccountRead | null>(null);
  const [cash, setCash] = useState<number | null>(null);
  const [positions, setPositions] = useState<PositionRead[]>([]);
  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [depAmount, setDepAmount] = useState<string>("1000");

  const [side, setSide] = useState<Side>("BUY");
  const [selectedListing, setSelectedListing] = useState<ListingSummary | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [qty, setQty] = useState<string>("1");
  const [tradeBusy, setTradeBusy] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  async function ensurePaperAccount(): Promise<AccountRead> {
    const accs = await getMyAccounts(token!);
    const paper = accs.find((a) => a.type === "PAPER") ?? null;
    if (paper) return paper;
    return await createPaperAccount(token!, "USD");
  }

  async function refreshAll() {
    if (!token) return;
    setLoading(true);
    setErr(null);

    try {
      const paper = await ensurePaperAccount();
      setAccount(paper);

      const bal = await getAccountBalance(token, paper.id, paper.base_currency);
      setCash(bal.balance);

      const pos = await getMyPositions(token);
      setPositions(pos);
    } catch (e: any) {
      setErr(e?.message ?? "Portfolio load error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setAccount(null);
      setCash(null);
      setPositions([]);
      return;
    }
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!selectedListing) {
      setQuote(null);
      return;
    }
    // Reset quote while loading
    setQuote(null);

    getQuotesBatch([selectedListing.id])
      .then(res => {
        const q = res.results[selectedListing.id];
        if (q) setQuote(q);
      })
      .catch(error => {
        console.error("Failed to fetch quote", error);
      });
  }, [selectedListing]);

  async function onDepositClick() {
    setMsg(null);
    setErr(null);
    if (!token) return;
    if (!account) {
      setErr("No account available.");
      return;
    }

    const amount = Number(depAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr("Deposit amount must be > 0.");
      return;
    }

    try {
      await deposit(token, account.id, amount, account.base_currency);
      setMsg("Deposit completed.");
      await refreshAll();
    } catch (e: any) {
      setErr(e?.message ?? "Deposit error");
    }
  }

  async function onTradeClick() {
    setMsg(null);
    setErr(null);

    if (!token) return;
    if (!account) {
      setErr("No account available.");
      return;
    }

    if (!selectedListing?.id) {
      setErr("Please select a listing from the dropdown first.");
      return;
    }

    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      setErr("Quantity must be greater than 0.");
      return;
    }

    setTradeBusy(true);
    try {
      // Backend powinien sam przeliczyć fee i odjąć środki,
      // my wysyłamy tylko intencję zlecenia.
      await placeOrder(token, {
        account_id: account.id,
        listing_id: selectedListing.id,
        side,
        qty: q,
      });

      setMsg(`${side} order created successfully.`);
      // Czyścimy formularz po sukcesie (opcjonalne)
      // setQty("1"); 
      await refreshAll();
    } catch (e: any) {
      setErr(e?.message ?? "Order error");
    } finally {
      setTradeBusy(false);
    }
  }

  // --- STYLES ---
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
    padding: "10px 12px",
    fontSize: "14px",
    backgroundColor: "#131722",
    border: "1px solid #434651",
    borderRadius: "4px",
    color: "#ffffff",
    boxSizing: "border-box",
    outline: "none",
    width: "100%",
  };

  const btnStyle = (variant: 'green' | 'red' | 'gray', isHover: boolean): CSSProperties => {
    let bg = "#2a2e39";
    let color = "#d1d4dc";
    let border = "none";

    if (variant === 'green') {
      bg = isHover ? "#20ad53" : "#26cc62";
      color = "#ffffff";
    } else if (variant === 'red') {
      bg = isHover ? "#ff3333" : "#ff4d4d";
      color = "#ffffff";
    } else {
      bg = isHover ? "#3a3f4e" : "#2a2e39";
    }

    return {
      padding: "10px 16px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      backgroundColor: bg,
      color: color,
      border: border,
      borderRadius: "4px",
      transition: "background-color 0.2s",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    };
  };

  const sideBtnStyle = (btnSide: Side): CSSProperties => ({
    flex: 1,
    padding: "12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: side === btnSide
      ? (btnSide === "BUY" ? "#26cc62" : "#ff4d4d")
      : "#2a2e39",
    color: side === btnSide ? "#ffffff" : "#8d929b",
    transition: "all 0.2s",
  });

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
  };

  const gridContainerStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  };

  // --- RENDER ---

  if (!token) {
    return (
      <>
        <Header activeTab="none" />
        <div style={{ ...pageWrapperStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#fff' }}>Dostęp zabroniony</h2>
            <p style={{ color: '#8d929b', marginBottom: '20px' }}>Musisz się zalogować, aby zobaczyć portfel.</p>
            <Link to="/login" style={{ color: '#26cc62', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold' }}>Zaloguj się</Link>
          </div>
        </div>
      </>
    );
  }

  if (loading || !account) {
    return (
      <>
        <Header activeTab="dashboard" refreshAction={refreshAll} refreshLoading={loading} />
        <div style={{ ...pageWrapperStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              border: '3px solid rgba(38, 204, 98, 0.1)',
              borderTop: '3px solid #26cc62',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ color: '#8d929b', fontSize: '16px', fontWeight: 500 }}>Loading Dashboard...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeTab="dashboard" refreshAction={refreshAll} refreshLoading={loading} />

      <div style={pageWrapperStyle}>

        {msg && <Notification message={msg} type="success" onClose={() => setMsg(null)} />}
        {err && <Notification message={err} type="error" onClose={() => setErr(null)} />}

        <div style={gridContainerStyle}>

          {/* PANEL 1: ACCOUNT */}
          <div style={panelStyle}>
            <div style={headerTitleStyle}>Account Summary</div>

            {account && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '12px', color: '#8d929b', marginBottom: '4px' }}>TOTAL EQUITY</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>ID: {account.id}</div>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff' }}>
                    {(() => {
                      const totalMktVal = positions.reduce((acc, p) => acc + (p.market_value || 0), 0);
                      const equity = (cash || 0) + totalMktVal;
                      return fmtMoney(equity);
                    })()} <span style={{ fontSize: '16px', color: '#8d929b' }}>{account.base_currency}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8d929b', marginBottom: '4px' }}>AVAILABLE CASH</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#d1d4dc' }}>
                      {cash == null ? "-" : fmtMoney(cash)} <span style={{ fontSize: '12px', color: '#8d929b' }}>{account.base_currency}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8d929b', marginBottom: '4px' }}>UNREALIZED P&L</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>
                      {(() => {
                        const totalPnl = positions.reduce((acc, p) => acc + (p.unrealized_pnl_abs || 0), 0);
                        const color = totalPnl >= 0 ? '#26cc62' : '#ff4d4d';
                        return (
                          <span style={{ color }}>
                            {totalPnl > 0 ? "+" : ""}{fmtMoney(totalPnl)} <span style={{ fontSize: '12px', color: '#8d929b' }}>{account.base_currency}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8d929b', marginBottom: '4px' }}>RETURN %</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>
                      {(() => {
                        const totalCostBasis = positions.reduce((acc, p) => acc + ((p.market_value || 0) - (p.unrealized_pnl_abs || 0)), 0);
                        const totalPnl = positions.reduce((acc, p) => acc + (p.unrealized_pnl_abs || 0), 0);
                        if (totalCostBasis === 0) return <span style={{ color: '#8d929b' }}>0.00%</span>;
                        const retPct = (totalPnl / totalCostBasis) * 100;
                        const color = retPct >= 0 ? '#26cc62' : '#ff4d4d';
                        return (
                          <span style={{ color }}>
                            {retPct > 0 ? "+" : ""}{retPct.toFixed(2)}%
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8d929b', marginBottom: '4px' }}>OPEN POSITIONS</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#d1d4dc' }}>
                      {positions.length}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#8d929b', display: 'block', marginBottom: '6px' }}>Quick Deposit</label>
                    <input
                      value={depAmount}
                      onChange={(e) => {
                        setDepAmount(e.target.value);
                        setMsg(null);
                        setErr(null);
                      }}
                      placeholder="Amount"
                      type="number"
                      style={inputStyle}
                    />
                  </div>
                  <button
                    onClick={() => onDepositClick()}
                    disabled={loading}
                    style={btnStyle('gray', hoveredBtn === 'deposit')}
                    onMouseEnter={() => setHoveredBtn('deposit')}
                    onMouseLeave={() => setHoveredBtn(null)}
                  >
                    DEPOSIT
                  </button>
                </div>
              </>
            )}
          </div>

          {/* PANEL 2: NEW ORDER */}
          <div style={panelStyle}>
            <div style={headerTitleStyle}>New Order</div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
              <button onClick={() => setSide("BUY")} disabled={tradeBusy} style={sideBtnStyle("BUY")}>BUY</button>
              <button onClick={() => setSide("SELL")} disabled={tradeBusy} style={sideBtnStyle("SELL")}>SELL</button>
            </div>

            {/* Asset + Price */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#8d929b', display: 'block', marginBottom: '6px' }}>Asset</label>
                <div style={{ height: '40px' }}>
                  <ListingDropdown value={selectedListing} onChange={setSelectedListing} />
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: '100px', paddingBottom: '4px' }}>
                <div style={{ fontSize: '11px', color: '#8d929b', marginBottom: '4px' }}>Unit Price</div>
                <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>
                  {quote?.price != null ? fmtMoney(quote.price) : "-"} <span style={{ fontSize: '10px', color: '#64748b' }}>{selectedListing?.currency ?? ""}</span>
                </div>
              </div>
            </div>

            {/* Qty + Fee Calculation */}
            {(() => {
              const price = quote?.price ?? 0;
              const q = Number(qty);
              const rawTotal = price * q;
              // Obliczamy fee
              const estimatedFee = rawTotal * COMMISSION_RATE;
              // Koszt całkowity: Przy kupnie dodajemy fee, przy sprzedaży odejmujemy od zysku
              const totalWithFee = side === "BUY" ? rawTotal + estimatedFee : rawTotal - estimatedFee;

              return (
                <>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: '#8d929b', display: 'block', marginBottom: '6px' }}>Quantity</label>
                      <div style={{
                        display: 'flex', alignItems: 'center', background: '#131722',
                        border: '1px solid #434651', borderRadius: '4px', height: '40px'
                      }}>
                        <input
                          value={qty}
                          onChange={(e) => { setQty(e.target.value); setMsg(null); setErr(null); }}
                          placeholder="1" type="number" min="1"
                          style={{
                            ...inputStyle, border: 'none', height: '100%', fontSize: '15px', fontWeight: 500,
                            paddingLeft: '12px', width: '100%', background: 'transparent'
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #434651', height: '100%' }}>
                          <button
                            onClick={() => setQty(prev => (Number(prev) || 0) + 1 + "")}
                            disabled={tradeBusy}
                            style={{
                              flex: 1, width: '24px', background: '#2a2e39', border: 'none', borderBottom: '1px solid #434651',
                              color: '#d1d4dc', fontSize: '10px', cursor: 'pointer', borderTopRightRadius: '3px'
                            }}
                          >▲</button>
                          <button
                            onClick={() => setQty(prev => Math.max(1, (Number(prev) || 0) - 1) + "")}
                            disabled={tradeBusy}
                            style={{
                              flex: 1, width: '24px', background: '#2a2e39', border: 'none',
                              color: '#d1d4dc', fontSize: '10px', cursor: 'pointer', borderBottomRightRadius: '3px'
                            }}
                          >▼</button>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '100px', paddingBottom: '4px' }}>
                      <div style={{ fontSize: '11px', color: '#8d929b', marginBottom: '4px' }}>Est. Fee ({(COMMISSION_RATE * 100).toFixed(2)}%)</div>
                      <div style={{ fontSize: '13px', color: '#ff4d4d', fontWeight: 500 }}>
                        {selectedListing && q > 0 && price > 0
                          ? `-${fmtMoney(estimatedFee)}`
                          : "0.00"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#8d929b', marginBottom: '4px' }}>
                        Total {side === "BUY" ? "Cost" : "Proceeds"}
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: (() => {
                          if (q <= 0) return "#d1d4dc";
                          if (!selectedListing) return "#ffffff";
                          if (side === "BUY" && cash != null && totalWithFee > cash) return "#ff4d4d";
                          if (side === "SELL") {
                            const pos = positions.find(p => p.listing_id === selectedListing.id);
                            if (q > (pos?.qty ?? 0)) return "#ff4d4d";
                          }
                          return "#ffffff";
                        })()
                      }}>
                        {q > 0 && price > 0 ? fmtMoney(totalWithFee) : "-"}
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>
                          {selectedListing?.currency ?? "USD"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!account) { setErr("No account available."); return; }
                      if (!selectedListing) { setErr("Please select a listing first."); return; }
                      const valQ = Number(qty);
                      if (!Number.isFinite(valQ) || valQ <= 0) { setErr("Quantity must be greater than 0."); return; }

                      // WALIDACJA FEE
                      if (side === "BUY") {
                        if (cash != null && totalWithFee > cash) {
                          setErr(`Insufficient funds. Cost: ${fmtMoney(totalWithFee)} (incl. fee), Cash: ${fmtMoney(cash)}.`);
                          return;
                        }
                      } else {
                        const pos = positions.find(p => p.listing_id === selectedListing.id);
                        const owned = pos?.qty ?? 0;
                        if (valQ > owned) {
                          setErr(`Insufficient shares. You have ${owned} but are trying to sell ${valQ}.`);
                          return;
                        }
                      }

                      onTradeClick();
                    }}
                    disabled={tradeBusy}
                    style={{
                      ...btnStyle(side === "BUY" ? 'green' : 'red', hoveredBtn === 'trade'),
                      width: '100%',
                      opacity: tradeBusy ? 0.6 : 1
                    }}
                    onMouseEnter={() => setHoveredBtn('trade')}
                    onMouseLeave={() => setHoveredBtn(null)}
                  >
                    {tradeBusy ? "PROCESSING..." : (side === "BUY" ? "PLACE BUY ORDER" : "PLACE SELL ORDER")}
                  </button>
                </>
              );
            })()}

          </div>
        </div>

        {/* OPEN POSITIONS TABLE */}
        <div style={panelStyle}>
          <div style={headerTitleStyle}>Open Positions</div>

          {loading && <div style={{ color: '#8d929b', padding: '20px' }}>Loading data...</div>}
          {!loading && positions.length === 0 && <div style={{ color: '#8d929b', padding: '20px', textAlign: 'center' }}>No open positions</div>}

          {!loading && positions.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Instrument</th>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Venue</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Volume</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Open Price</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Market Price</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Value</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>P&L</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Net %</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const pnl = p.unrealized_pnl_abs || 0;
                    const pnlColor = pnl >= 0 ? "#26cc62" : "#ff4d4d";
                    return (
                      <tr key={p.position_id}>
                        <td style={{ ...tableCellStyle, fontWeight: 700, color: '#fff' }}>{p.ticker ?? "-"}</td>
                        <td style={tableCellStyle}>{p.name}</td>
                        <td style={tableCellStyle}>{p.venue_code}</td>
                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>{fmtNum(p.qty)}</td>
                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>{fmtMoney(p.avg_price)}</td>
                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>{fmtMoney(p.last_price)}</td>
                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>{fmtMoney(p.market_value)}</td>
                        <td style={{ ...tableCellStyle, textAlign: 'right', color: pnlColor, fontWeight: 600 }}>
                          {pnl > 0 ? "+" : ""}{fmtMoney(pnl)}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'right', color: pnlColor }}>
                          {p.unrealized_pnl_pct == null ? "-" : (p.unrealized_pnl_pct * 100).toFixed(2) + "%"}
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