import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function MePage() {
  const { user, token, isLoading, error, signOut, refreshMe } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2>Me</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {error && <p style={{ color: "crimson" }}>{error}</p>}


      {token && !user && <div>Loading user data...</div>}

      {user && (
        <>
          <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(user, null, 2)}
          </pre>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link to="/portfolio" style={{ marginRight: "auto" }}>Portfolio</Link>
            <button onClick={() => refreshMe()}>Refresh /me</button>
            <button onClick={() => { signOut(); navigate("/login"); }}>Sign out</button>
          </div>
        </>
      )}
    </div>
  );
}
