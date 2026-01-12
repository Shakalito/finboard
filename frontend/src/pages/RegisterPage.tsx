import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../api/auth";
import { Footer } from "../components/Footer";

export function RegisterPage() {
  const [firstName, setFirstName] = useState("Jan");
  const [lastName, setLastName] = useState("Kowalski");
  const [email, setEmail] = useState("jan@example.com");
  const [password, setPassword] = useState("password123");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [isHovered, setIsHovered] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      const u = await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      setMsg(`Success! User created: ${u.email}`);
    } catch (e: any) {
      setErr(e?.message ?? "Registration error");
    }
  }

  const pageWrapperStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#131722",
    display: "flex",
    flexDirection: "column",

    color: "#d1d4dc",
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  };

  const containerStyle: React.CSSProperties = {
    padding: "40px",
    width: "100%",
    maxWidth: "480px",
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
    color: "#ffffff",
    letterSpacing: "0.5px",
  };

  const formStyle: React.CSSProperties = {
    display: "grid",
    gap: "20px",
  };

  const gridRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    color: "#8d929b",
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
    marginTop: "10px",
  };

  const linkStyle: React.CSSProperties = {
    color: "#26cc62",
    textDecoration: "none",
    fontWeight: "500",
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={{ position: 'absolute', top: '20px', left: '24px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#26cc62', fontWeight: 'bold', fontSize: '24px', letterSpacing: '1px' }}>FINBOARD</Link>
      </div>
      <div style={containerStyle}>
        <h2 style={headerStyle}>
          Create account in <span style={{ color: '#26cc62' }}>FINBOARD</span>
        </h2>

        <form onSubmit={onSubmit} style={formStyle}>

          <div style={gridRowStyle}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                style={inputStyle}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jan"
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                style={inputStyle}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Kowalski"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>E-mail</label>
            <input
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@example.com"
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Sign Up
          </button>
        </form>

        {msg && (
          <div style={{ marginTop: 20, padding: "10px", backgroundColor: "rgba(38, 204, 98, 0.1)", border: "1px solid #26cc62", borderRadius: "4px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#26cc62" }}>{msg}</p>
          </div>
        )}

        {err && (
          <div style={{ marginTop: 20, padding: "10px", backgroundColor: "rgba(255, 77, 77, 0.1)", border: "1px solid #ff4d4d", borderRadius: "4px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#ff4d4d" }}>{err}</p>
          </div>
        )}

        <p style={{ marginTop: 30, textAlign: "center", fontSize: "14px", color: "#8d929b" }}>
          Already have an account? <a href="/login" style={linkStyle}>Sign In</a>
        </p>
      </div>

      <Footer />
    </div>
  );
}
