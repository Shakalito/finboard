import { Link } from "react-router-dom";

export function PortfolioOrdersPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2>Portfolio Orders</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/portfolio">Back to portfolio</Link>
        <Link to="/watchlist">Watchlist</Link>
      </div>

      <p style={{ opacity: 0.8 }}>
        Placeholder. TBC
      </p>
    </div>
  );
}
