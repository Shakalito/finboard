import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function MePage() {
  const { user, token, isLoading, error, signOut, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const pageWrapperStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#131722",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    color: "#d1d4dc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center", // Center vertically
    paddingBottom: "80px", // Extra padding at bottom
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "720px",
    backgroundColor: "#1e222d",
    borderRadius: "4px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
    border: "1px solid #2a2e39",
    overflow: "hidden",
    margin: "0 auto",
    marginBottom: "40px",
  };

  const headerStyle: React.CSSProperties = {
    padding: "20px 30px",
    borderBottom: "1px solid #2a2e39",
    backgroundColor: "#222633",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const contentStyle: React.CSSProperties = {
    padding: "30px",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "30px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#8d929b",
    marginBottom: "5px",
    display: "block",
    textTransform: "uppercase",
    fontWeight: 600,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "15px",
    color: "#ffffff",
  };



  const btnBaseStyle: React.CSSProperties = {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    borderRadius: "4px",
    border: "none",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
    textTransform: "uppercase",
  };

  const primaryBtnStyle = (isHover: boolean): React.CSSProperties => ({
    ...btnBaseStyle,
    backgroundColor: isHover ? "#20ad53" : "#26cc62",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(38, 204, 98, 0.2)",
  });

  const secondaryBtnStyle = (isHover: boolean): React.CSSProperties => ({
    ...btnBaseStyle,
    backgroundColor: isHover ? "#3a3f4e" : "#2a2e39",
    color: "#d1d4dc",
    border: "1px solid #434651",
  });

  const dangerBtnStyle = (isHover: boolean): React.CSSProperties => ({
    ...btnBaseStyle,
    backgroundColor: isHover ? "rgba(255, 77, 77, 0.1)" : "transparent",
    color: "#ff4d4d",
    border: "1px solid #ff4d4d",
  });

  const badgeStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "4px 8px",
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: isActive ? "rgba(38, 204, 98, 0.1)" : "rgba(255, 77, 77, 0.1)",
    color: isActive ? "#26cc62" : "#ff4d4d",
    border: `1px solid ${isActive ? "#26cc62" : "#ff4d4d"}`,
    marginLeft: "10px",
  });

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    borderTop: "1px solid #2a2e39",
    paddingTop: "20px",
  };

  if (isLoading) {
    return (
      <>
        <Header activeTab="none" />
        <div style={{ ...pageWrapperStyle, justifyContent: 'center', paddingTop: 0, alignItems: 'center' }}>
          <div style={{ color: "#26cc62", fontWeight: "bold" }}>LOADING DATA...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeTab="none" />

      <div style={pageWrapperStyle}>

        <div style={containerStyle}>
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2 style={titleStyle}>User Profile</h2>
              {user && (
                <>
                  <span style={badgeStyle(!!user.is_active)}>{user.is_active ? "Active" : "Inactive"}</span>
                  <span style={badgeStyle(!!user.is_verified)}>{user.is_verified ? "Verified" : "Unverified"}</span>
                </>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#8d929b', fontFamily: 'monospace' }}>ID: {user?.id}</div>
          </div>

          <div style={contentStyle}>
            {error && (
              <div style={{ color: "#ff4d4d", marginBottom: "20px", textAlign: "center", padding: "10px", background: "rgba(255, 77, 77, 0.1)", borderRadius: "4px" }}>
                {error}
              </div>
            )}

            {token && !user && <div style={{ color: '#8d929b' }}>Synchronizing user data...</div>}

            {user && (
              <>
                <div style={gridStyle}>
                  <div>
                    <span style={labelStyle}>First Name</span>
                    <div style={valueStyle}>{user.first_name}</div>
                  </div>
                  <div>
                    <span style={labelStyle}>Last Name</span>
                    <div style={valueStyle}>{user.last_name}</div>
                  </div>
                  <div>
                    <span style={labelStyle}>Email</span>
                    <div style={valueStyle}>{user.email}</div>
                  </div>
                  <div>
                    <span style={labelStyle}>Timezone</span>
                    <div style={valueStyle}>{user.timezone || "Europe/Warsaw"}</div>
                  </div>
                </div>



                <div style={actionsStyle}>
                  <Link
                    to="/portfolio"
                    style={{ ...primaryBtnStyle(hoveredBtn === 'portfolio'), marginRight: "auto" }}
                    onMouseEnter={() => setHoveredBtn('portfolio')}
                    onMouseLeave={() => setHoveredBtn(null)}
                  >
                    Open Portfolio
                  </Link>

                  <button
                    onClick={() => refreshMe()}
                    style={secondaryBtnStyle(hoveredBtn === 'refresh')}
                    onMouseEnter={() => setHoveredBtn('refresh')}
                    onMouseLeave={() => setHoveredBtn(null)}
                  >
                    Refresh Data
                  </button>

                  <button
                    onClick={() => { signOut(); navigate("/login"); }}
                    style={dangerBtnStyle(hoveredBtn === 'signout')}
                    onMouseEnter={() => setHoveredBtn('signout')}
                    onMouseLeave={() => setHoveredBtn(null)}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}