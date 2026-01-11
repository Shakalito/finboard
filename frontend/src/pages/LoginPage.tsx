import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Footer } from "../components/Footer";
import { Notification } from "../components/Notification";

export function LoginPage() {
  const { signIn, token, sessionExpired } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("jan@example.com");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(location.state?.message || null);

  const [isHovered, setIsHovered] = useState(false);

  const from = location.state?.from?.pathname || "/me";

  // If session expired, show message once
  useEffect(() => {
    if (sessionExpired) {
      setMsg("Your session has expired. Please log in again.");
    }
  }, [sessionExpired]);

  useEffect(() => {
    if (token) {
      if (location.state?.message) {
        // If we have a message (e.g. from RequireAuth but token appeared), clear it?
        // Actually if token is present we redirect, so main thing is navigation
      }
      navigate(from, { replace: true });
    }
  }, [token, navigate, from, location.state]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (e: any) {
      setMsg(null);
      setErr(e?.message ?? "Login error");
    }
  }

  const pageWrapperStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#131722",
    display: "flex",
    flexDirection: "column",
    color: "#000000ff",
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  };

  const containerStyle: React.CSSProperties = {
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxSizing: "border-box",
    backgroundColor: "#1e222d",
    borderRadius: "4px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
    border: "1px solid #2a2e39",
    margin: "auto",
    marginBottom: "40px",
  };

  const headerStyle: React.CSSProperties = {
    margin: "0 0 30px 0",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "600",
    color: "#ffffffff",
    letterSpacing: "0.5px",
  };

  const formStyle: React.CSSProperties = {
    display: "grid",
    gap: "20px",
  };

  const inputStyle: React.CSSProperties = {
    padding: "12px 16px",
    fontSize: "15px",
    backgroundColor: "#2a2e39",
    border: "1px solid #434651",
    borderRadius: "4px",
    color: "#ffffff",
    boxSizing: "border-box",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    backgroundColor: isHovered ? "#20ad53" : "#26cc62",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    transition: "background-color 0.2s",
  };

  const linkStyle: React.CSSProperties = {
    color: "#26cc62",
    textDecoration: "none",
    fontWeight: "500",
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={containerStyle}>
        <h2 style={headerStyle}>Login to <span style={{ color: "#26cc62" }}>FINBOARD</span></h2>

        <form onSubmit={onSubmit} style={formStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#8d929b' }}>E-mail</label>
            <input
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter e-mail"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#8d929b' }}>Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <button
            style={buttonStyle}
            type="submit"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Sign In
          </button>
        </form>

        {msg && <Notification message={msg} type="success" onClose={() => setMsg(null)} duration={10000} />}
        {err && <Notification message={err} type="error" onClose={() => setErr(null)} />}

        <p style={{ marginTop: 30, textAlign: "center", fontSize: "14px", color: "#8d929b" }}>
          Don't have an account? <a href="/register" style={linkStyle}>Sign Up</a>
        </p>
      </div>

      <Footer />
    </div>
  );
}
