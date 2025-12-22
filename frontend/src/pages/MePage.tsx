import { useAuth } from "../auth/AuthContext";

export function MePage() {
  const { user, token, isLoading, error, signOut, refreshMe } = useAuth();

  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2>Me</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!token && (
        <p>
          Not logged in. Go to <a href="/login">Login</a>
        </p>
      )}

      {token && !user && <p>Token exists, but user not loaded.</p>}

      {user && (
        <>
          <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
{JSON.stringify(user, null, 2)}
          </pre>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => refreshMe()}>Refresh /me</button>
            <button onClick={() => signOut()}>Sign out</button>
          </div>
        </>
      )}
    </div>
  );
}
