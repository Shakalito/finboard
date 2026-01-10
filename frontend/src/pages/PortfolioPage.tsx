import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Header } from "../components/Header";
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
import { ListingDropdown } from "../components/ListingDropdown";
import type { ListingSummary } from "../api/refdata";

type Side = "BUY" | "SELL";

function fmtMoney(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(2);
}

function fmtNum(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
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
  const [qty, setQty] = useState<string>("1");
  const [tradeBusy, setTradeBusy] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const canUseApi = useMemo(() => !!token, [token]);

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
  }, [token]);

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
      await placeOrder(token, {
        account_id: account.id,
        listing_id: selectedListing.id,
        side,
        qty: q,
      });

      setMsg(`${side} order created successfully.`);
      await refreshAll();
    } catch (e: any) {
      setErr(e?.message ?? "Order error");
    } finally {
      setTradeBusy(false);
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
    gridTemplateColumns: "1fr 1fr", 
    gap: "24px",
    marginBottom: "24px",
  };

  if (!token) {
    return (
      <>
        <Header activeTab="none" />
        <div style={{ ...pageWrapperStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
             <h2 style={{color: '#fff'}}>Dostęp zabroniony</h2>
             <p style={{color: '#8d929b', marginBottom: '20px'}}>Musisz się zalogować, aby zobaczyć portfel.</p>
             <Link to="/login" style={{color: '#26cc62', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold'}}>Zaloguj się</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeTab="dashboard" refreshAction={refreshAll} refreshLoading={loading} />

      <div style={pageWrapperStyle}>
        
        {msg && <div style={{padding: '12px', background: 'rgba(38, 204, 98, 0.1)', color: '#26cc62', border: '1px solid #26cc62', borderRadius: '4px', marginBottom: '20px'}}>{msg}</div>}
        {err && <div style={{padding: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', marginBottom: '20px'}}>{err}</div>}

        <div style={gridContainerStyle}>
          
          <div style={panelStyle}>
            <div style={headerTitleStyle}>Account Summary</div>
            
            {!account && <div style={{color: '#8d929b'}}>Loading account details...</div>}
            
            {account && (
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                  <div>
                    <div style={{fontSize: '12px', color: '#8d929b', marginBottom: '4px'}}>AVAILABLE CASH</div>
                    <div style={{fontSize: '32px', fontWeight: 700, color: '#ffffff'}}>
                      {cash == null ? "—" : fmtMoney(cash)} <span style={{fontSize: '16px', color: '#8d929b'}}>{account.base_currency}</span>
                    </div>
                  </div>
                  <div style={{fontSize: '12px', color: '#8d929b'}}>ID: {account.id.substring(0, 8)}...</div>
                </div>

                <div style={{height: '1px', background: '#2a2e39', margin: '4px 0'}}></div>

                <div style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
                  <div style={{flex: 1}}>
                    <label style={{fontSize: '12px', color: '#8d929b', display: 'block', marginBottom: '6px'}}>Quick Deposit</label>
                    <input
                      value={depAmount}
                      onChange={(e) => setDepAmount(e.target.value)}
                      placeholder="Amount"
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

          <div style={panelStyle}>
            <div style={headerTitleStyle}>New Order</div>
            
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={() => setSide("BUY")} disabled={tradeBusy} style={sideBtnStyle("BUY")}>BUY</button>
              <button onClick={() => setSide("SELL")} disabled={tradeBusy} style={sideBtnStyle("SELL")}>SELL</button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px'}}>
              <div>
                <label style={{fontSize: '12px', color: '#8d929b', display: 'block', marginBottom: '6px'}}>Asset</label>
                <div style={{ height: '40px' }}>
                    <ListingDropdown value={selectedListing} onChange={setSelectedListing} />
                </div>
              </div>
              <div>
                <label style={{fontSize: '12px', color: '#8d929b', display: 'block', marginBottom: '6px'}}>Volume</label>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="Lots"
                  style={{...inputStyle, height: '40px'}}
                  disabled={tradeBusy || !canUseApi}
                />
              </div>
            </div>

            <button 
              onClick={() => onTradeClick()} 
              disabled={tradeBusy || !account}
              style={{
                ...btnStyle(side === "BUY" ? 'green' : 'red', hoveredBtn === 'trade'),
                marginTop: 'auto'
              }}
              onMouseEnter={() => setHoveredBtn('trade')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              {tradeBusy ? "PROCESSING..." : `PLACE ${side} ORDER`}
            </button>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={headerTitleStyle}>Open Positions</div>
          
          {loading && <div style={{color: '#8d929b', padding: '20px'}}>Loading data...</div>}
          {!loading && positions.length === 0 && <div style={{color: '#8d929b', padding: '20px', textAlign: 'center'}}>No open positions</div>}

          {!loading && positions.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Instrument</th>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Venue</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Volume</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Open Price</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Market Price</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Value</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>P&L</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Net %</th>
                    <th style={{...tableHeaderStyle, textAlign: 'right'}}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const pnl = p.unrealized_pnl_abs || 0;
                    const pnlColor = pnl >= 0 ? "#26cc62" : "#ff4d4d";
                    
                    return (
                      <tr key={p.position_id}>
                        <td style={{...tableCellStyle, fontWeight: 700, color: '#fff'}}>{p.ticker ?? "—"}</td>
                        <td style={tableCellStyle}>{p.name}</td>
                        <td style={tableCellStyle}>{p.venue_code}</td>
                        <td style={{...tableCellStyle, textAlign: 'right'}}>{fmtNum(p.qty)}</td>
                        <td style={{...tableCellStyle, textAlign: 'right'}}>{fmtMoney(p.avg_price)}</td>
                        <td style={{...tableCellStyle, textAlign: 'right'}}>{fmtMoney(p.last_price)}</td>
                        <td style={{...tableCellStyle, textAlign: 'right'}}>{fmtMoney(p.market_value)}</td>
                        <td style={{...tableCellStyle, textAlign: 'right', color: pnlColor, fontWeight: 600}}>
                          {pnl > 0 ? "+" : ""}{fmtMoney(pnl)}
                        </td>
                        <td style={{...tableCellStyle, textAlign: 'right', color: pnlColor}}>
                          {p.unrealized_pnl_pct == null ? "—" : (p.unrealized_pnl_pct * 100).toFixed(2) + "%"}
                        </td>
                        <td style={{...tableCellStyle, textAlign: 'right', color: '#8d929b', fontSize: '12px'}}>
                           {p.asof ? new Date(p.asof).toLocaleTimeString() : "—"}
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