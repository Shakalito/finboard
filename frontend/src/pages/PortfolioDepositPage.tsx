import { useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deposit } from "../api/portfolio";
import { useAuth } from "../auth/AuthContext";
import { usePaperAccount } from "../portfolio/usePaperAccount";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function PortfolioDepositPage() {
  const { token } = useAuth();
  const { account, loading: accountLoading, error: accountError, refresh } = usePaperAccount(token);
  const navigate = useNavigate();

  const [amount, setAmount] = useState<string>("10000");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => 
    !!token && !!account && !accountLoading && !submitting, 
    [token, account, accountLoading, submitting]
  );

  async function onSubmit() {
    setMsg(null);
    setErr(null);

    if (!token) {
      setErr("You must be logged in.");
      return;
    }
    if (!account) {
      setErr("Account not ready yet.");
      return;
    }

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setErr("Amount must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      await deposit(token, account.id, parsed, account.base_currency);
      await refresh();
      setMsg("Deposit successful. Redirecting...");
      setTimeout(() => navigate("/portfolio"), 1000);
    } catch (e: any) {
      setErr(e?.message ?? "Deposit error");
      setSubmitting(false);
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
    display: 'flex',
    flexDirection: 'column', 
   
  };

  const panelStyle: CSSProperties = {
    backgroundColor: "#1e222d",
    borderRadius: "6px",
    border: "1px solid #2a2e39",
    padding: "30px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    margin: "0 auto", 
    marginBottom: "40px" 
  };

  const headerTitleStyle: CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: "#ffffff",
    marginBottom: "4px",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const labelStyle: CSSProperties = {
    fontSize: "12px",
    color: "#8d929b",
    marginBottom: "6px",
    display: "block",
    fontWeight: 500
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#131722",
    border: "1px solid #434651",
    borderRadius: "4px",
    color: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
    fontWeight: 700
  };

  const btnStyle: CSSProperties = {
    width: "100%",
    padding: "14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: !canSubmit ? "not-allowed" : "pointer",
    backgroundColor: !canSubmit ? "#2a2e39" : "#26cc62",
    color: !canSubmit ? "#8d929b" : "#ffffff",
    border: "none",
    borderRadius: "4px",
    textTransform: "uppercase",
    transition: "background-color 0.2s",
    marginTop: "10px"
  };

  const linkStyle: CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#8d929b",
    textDecoration: "none",
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  if (!token) {
    return (
      <>
        <Header activeTab="none" />
        <div style={{ ...pageWrapperStyle, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
             <h2 style={{color: '#fff'}}>Dostęp zabroniony</h2>
             <Link to="/login" style={{color: '#26cc62', textDecoration: 'none', fontWeight: 'bold'}}>Zaloguj się</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeTab="deposit" />

      <div style={pageWrapperStyle}>
        <div style={panelStyle}>
          
          <div>
            <h2 style={headerTitleStyle}>Deposit Funds</h2>
            <p style={{textAlign: 'center', color: '#8d929b', fontSize: '13px', margin: '4px 0 0 0'}}>
                Add paper money to your trading account
            </p>
          </div>

          {accountError && <div style={{padding: '10px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', textAlign: 'center'}}>{accountError}</div>}
          {msg && <div style={{padding: '10px', background: 'rgba(38, 204, 98, 0.1)', color: '#26cc62', border: '1px solid #26cc62', borderRadius: '4px', textAlign: 'center'}}>{msg}</div>}
          {err && <div style={{padding: '10px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', textAlign: 'center'}}>{err}</div>}

          <div>
            <label style={labelStyle}>Amount to Deposit</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 10000"
                    type="number"
                    style={inputStyle}
                    disabled={submitting || accountLoading}
                />
                <span style={{
                    position: 'absolute', 
                    right: '16px', 
                    color: '#8d929b', 
                    fontWeight: 600,
                    fontSize: '14px'
                }}>
                    {account?.base_currency || "USD"}
                </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                Funds will be immediately available for trading.
            </div>
          </div>

          <button 
            onClick={onSubmit} 
            disabled={!canSubmit}
            style={btnStyle}
          >
            {submitting ? "PROCESSING..." : "CONFIRM DEPOSIT"}
          </button>

          <Link to="/portfolio" style={{...linkStyle, justifyContent: 'center', marginTop: '10px'}}>
             Cancel
          </Link>

        </div>

        <Footer />
      </div>
    </>
  );
}