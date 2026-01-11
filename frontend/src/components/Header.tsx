import { type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";


export type ActiveTab =
  | "dashboard"
  | "watchlist"
  | "listings"
  | "orders"
  | "history"
  | "alerts"
  | "deposit"
  | "none";

type Props = {
  activeTab: ActiveTab;
  refreshAction?: () => void;
  refreshLoading?: boolean;
};

export function Header({ activeTab, refreshAction, refreshLoading = false }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();


  const navStyle: CSSProperties = {
    height: "60px",
    width: "100%",
    backgroundColor: "#1e222d",
    borderBottom: "1px solid #2a2e39",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    boxSizing: "border-box",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000,
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  };

  const navLogoStyle: CSSProperties = {
    fontSize: "20px",
    fontWeight: "700",
    color: "#26cc62",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  };

  const subNavStyle: CSSProperties = {
    position: "fixed",
    top: "60px",
    left: 0,
    right: 0,
    height: "50px",
    backgroundColor: "#131722",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    borderBottom: "1px solid #2a2e39",
    zIndex: 900,
    gap: "4px"
  };

  const subNavLinkStyle = (isActive: boolean): CSSProperties => ({
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    color: isActive ? "#ffffff" : "#8d929b",
    textDecoration: "none",
    borderRadius: "4px",
    backgroundColor: isActive ? "#2a2e39" : "transparent",
    transition: "all 0.2s",
  });

  const depositLinkStyle = (isActive: boolean): CSSProperties => ({
    ...subNavLinkStyle(isActive),
    color: isActive ? "#ffffff" : "#26cc62",
    fontWeight: 600,
  });

  const refreshBtnStyle: CSSProperties = {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: '#26cc62',
    cursor: refreshLoading ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    opacity: refreshLoading ? 0.5 : 1
  };

  return (
    <>

      <nav style={navStyle}>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <Link to="/" style={navLogoStyle}>
            FINBOARD
          </Link>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/portfolio" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>TRADING</Link>
            <Link to="/me" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>ACCOUNT</Link>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {user && (
            <Link to="/me" style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", textDecoration: "none", cursor: "pointer" }}>
              {user.email}
            </Link>
          )}
          <button
            onClick={() => { signOut(); navigate("/login"); }}
            style={{
              background: 'transparent',
              border: '1px solid #ff4d4d',
              color: '#ff4d4d',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            LOGOUT
          </button>
        </div>
      </nav>


      <div style={subNavStyle}>
        <Link to="/portfolio" style={subNavLinkStyle(activeTab === 'dashboard')}>Dashboard</Link>
        <Link to="/watchlist" style={subNavLinkStyle(activeTab === 'watchlist')}>Watchlist</Link>
        <Link to="/listings" style={subNavLinkStyle(activeTab === 'listings')}>Search Assets</Link>
        <Link to="/portfolio/orders" style={subNavLinkStyle(activeTab === 'orders')}>Orders</Link>
        <Link to="/portfolio/executions" style={subNavLinkStyle(activeTab === 'history')}>History</Link>
        <Link to="/alerts" style={subNavLinkStyle(activeTab === 'alerts')}>Alerts</Link>

        <Link to="/portfolio/deposit" style={depositLinkStyle(activeTab === 'deposit')}>Deposit</Link>

        {refreshAction && (
          <button
            onClick={refreshAction}
            disabled={refreshLoading}
            style={refreshBtnStyle}
          >
            {refreshLoading ? "LOADING..." : "REFRESH DATA ↻"}
          </button>
        )}
      </div>


      <div style={{ height: "110px" }} />
    </>
  );
}