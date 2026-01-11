import { useEffect, useMemo, useState, type FormEvent, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createAlert, type AlertCondition } from "../api/alerts";
import { ListingDropdown } from "../components/ListingDropdown";
import { type ListingSummary } from "../api/refdata";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Notification } from "../components/Notification";

export function NewAlertPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [selectedListing, setSelectedListing] = useState<ListingSummary | null>(null);
  const [condition, setCondition] = useState<AlertCondition>("ABOVE");
  const [target, setTarget] = useState<string>("");

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const t = Number(target);
    return Boolean(selectedListing) && Number.isFinite(t) && t > 0;
  }, [selectedListing, target]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!token) {
      setErr("You must be logged in.");
      return;
    }
    if (!selectedListing) {
      setErr("Please select a listing.");
      return;
    }
    if (!canSubmit) {
      setErr("Enter a valid target price.");
      return;
    }

    setLoading(true);
    try {
      await createAlert(token, {
        listing_id: selectedListing.id,
        condition,
        target_price: Number(target),
      });
      setMsg("Alert created successfully.");
      setTimeout(() => navigate("/alerts"), 1000);
    } catch (ex: any) {
      setErr(ex?.message ?? "Failed to create alert.");
    } finally {
      setLoading(false);
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
    maxWidth: "500px",
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
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    textAlign: "center"
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
    padding: "10px 12px",
    fontSize: "14px",
    backgroundColor: "#131722",
    border: "1px solid #434651",
    borderRadius: "4px",
    color: "#ffffff",
    outline: "none",
    boxSizing: "border-box"
  };

  const btnStyle: CSSProperties = {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: loading || !canSubmit ? "not-allowed" : "pointer",
    backgroundColor: loading || !canSubmit ? "#2a2e39" : "#26cc62",
    color: loading || !canSubmit ? "#8d929b" : "#ffffff",
    border: "none",
    borderRadius: "4px",
    textTransform: "uppercase",
    marginTop: "10px",
    transition: "background-color 0.2s"
  };

  const backLinkStyle: CSSProperties = {
    display: "block",
    textAlign: "center",
    marginTop: "16px",
    color: "#8d929b",
    textDecoration: "none",
    fontSize: "13px"
  };

  return (
    <>
      <Header activeTab="none" />

      <div style={pageWrapperStyle}>
        <div style={panelStyle}>
          <h2 style={headerTitleStyle}>Create New Alert</h2>

          {msg && (
            <Notification message={msg} type="success" onClose={() => setMsg(null)} />
          )}
          {err && (
            <Notification message={err} type="error" onClose={() => setErr(null)} />
          )}

          <form onSubmit={onSubmit}>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Select Asset</label>
              <div style={{ height: '40px' }}>
                <ListingDropdown value={selectedListing} onChange={setSelectedListing} placeholder="Search for asset (e.g. AAPL)..." />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AlertCondition)}
                style={inputStyle}
                disabled={loading}
              >
                <option value="ABOVE">Price Goes Above ( &gt; )</option>
                <option value="BELOW">Price Goes Below ( &lt; )</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Target Price</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  style={inputStyle}
                  disabled={loading}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  color: '#8d929b',
                  fontSize: '12px'
                }}>
                  {selectedListing?.currency || 'USD'}
                </span>
              </div>
            </div>

            <button type="submit" style={btnStyle} disabled={loading || !canSubmit}>
              {loading ? "CREATING..." : "CREATE ALERT"}
            </button>

            <Link to="/alerts" style={backLinkStyle}>
              Cancel and go back
            </Link>

          </form>
        </div>

        <Footer />
      </div>
    </>
  );
}