import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { usePaperAccount } from "../portfolio/usePaperAccount";

export function PortfolioPage() {
  const { token } = useAuth();
  const { account, balance, currency, loading, error, refresh } = usePaperAccount(token);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2>Portfolio</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/watchlist">Watchlist</Link>
        <Link to="/portfolio/orders">Orders</Link>
        <Link to="/portfolio/executions">Executions</Link>
        <Link to="/portfolio/deposit">Deposit</Link>
        <button onClick={() => refresh()} disabled={loading}>
          Refresh
        </button>
      </div>

      {!token && <p style={{ color: "crimson" }}>You must be logged in.</p>}

      {token && loading && <p>Loading portfolio...</p>}
      {token && error && <p style={{ color: "crimson" }}>{error}</p>}

      {token && !loading && account && (
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 8 }}>
            <div style={{ opacity: 0.8 }}>Account</div>
            <div style={{ fontWeight: 700 }}>
              {account.type} ({account.base_currency})
            </div>

            <div style={{ opacity: 0.8 }}>Cash balance</div>
            <div style={{ fontWeight: 700 }}>
              {balance != null ? `${balance.toFixed(2)} ${currency}` : "-"}
            </div>

            <div style={{ opacity: 0.8 }}>Account ID</div>
            <div style={{ fontFamily: "monospace", fontSize: 12 }}>{account.id}</div>
          </div>
        </div>
      )}

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        Tip: listing_id from DB (refdata.listings).
      </p>

      <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
        <h3>Trading</h3>
        <p style={{ opacity: 0.7 }}>Placeholder. To be continued.</p>
      </div>
    </div>
  );
}
