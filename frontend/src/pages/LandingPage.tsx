import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { type CSSProperties } from "react";

export function LandingPage() {
    const { token } = useAuth();

    // No auto-redirect. Logged in users can see the landing page.

    const pageStyle: CSSProperties = {
        minHeight: "100vh",
        backgroundColor: "#0b0e11", // Deep dark background
        color: "#ffffff",
        fontFamily: "'Inter', 'Roboto', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
    };

    const navStyle: CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        background: "rgba(19, 23, 34, 0.8)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 100
    };

    const heroStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "100px 20px 60px",
        position: "relative",
        background: "radial-gradient(circle at 50% 10%, rgba(38, 204, 98, 0.15), transparent 60%)"
    };

    const titleStyle: CSSProperties = {
        fontSize: "64px",
        fontWeight: 800,
        background: "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "24px",
        letterSpacing: "-1px",
        lineHeight: 1.1,
        maxWidth: "800px"
    };

    const subtitleStyle: CSSProperties = {
        fontSize: "20px",
        color: "#8d929b",
        maxWidth: "600px",
        lineHeight: 1.6,
        marginBottom: "40px"
    };

    const btnPrimaryStyle: CSSProperties = {
        padding: "16px 32px",
        fontSize: "16px",
        fontWeight: 700,
        color: "#0b0e11",
        background: "#26cc62",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        textDecoration: "none",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 0 20px rgba(38, 204, 98, 0.4)"
    };

    const featureSectionStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "40px",
        padding: "80px 40px",
        maxWidth: "1200px",
        margin: "0 auto"
    };

    const featureCardStyle: CSSProperties = {
        background: "#1e222d",
        border: "1px solid #2a2e39",
        borderRadius: "16px",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        transition: "transform 0.2s",
        cursor: "default"
    };

    const mockWatchlist = [
        { ticker: "NVDA", change: "+2.4%", color: "#26cc62" },
        { ticker: "MSFT", change: "+1.2%", color: "#26cc62" },
        { ticker: "TSLA", change: "-0.8%", color: "#ff4d4d" },
        { ticker: "AMZN", change: "+0.5%", color: "#26cc62" },
    ];

    const mockOrders = [
        { side: "BUY", ticker: "AAPL", color: "#26cc62" },
        { side: "SELL", ticker: "BTC", color: "#ff4d4d" },
        { side: "BUY", ticker: "NVDA", color: "#26cc62" },
        { side: "SELL", ticker: "TSLA", color: "#ff4d4d" },
    ];

    return (
        <div style={pageStyle}>
            <style>{`
        @media (max-width: 768px) {
          .hero-title { font-size: 42px !important; }
          .hero-mock-grid { grid-template-columns: 1fr !important; }
          .hero-visual { margin-top: 40px !important; }
          .feature-grid { padding: 40px 20px !important; gap: 24px !important; grid-template-columns: 1fr !important; }
        }
      `}</style>

            {/* Navigation */}
            <nav style={navStyle}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#26cc62", letterSpacing: "1px" }}>FINBOARD</div>
                <div style={{ display: "flex", gap: "20px" }}>
                    {token ? (
                        <Link to="/portfolio" style={{ ...btnPrimaryStyle, padding: "10px 24px", fontSize: "14px", background: "#ffffff", color: "#000" }}>Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/login" style={{ color: "#d1d4dc", textDecoration: "none", fontWeight: 600, padding: "10px 20px" }}>Log In</Link>
                            <Link to="/register" style={{ ...btnPrimaryStyle, padding: "10px 24px", fontSize: "14px", background: "#ffffff", color: "#000" }}>Sign Up</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <header style={heroStyle}>
                <h1 style={titleStyle} className="hero-title">
                    Master Your Market <br />
                    <span style={{ color: "#26cc62", WebkitTextFillColor: "#26cc62" }}>With Precision</span>
                </h1>
                <p style={subtitleStyle}>
                    Experience the next generation of portfolio tracking. Real-time data, advanced analytics, and instant alerts-all in one beautiful interface.
                </p>

                {token ? (
                    <Link to="/portfolio" style={btnPrimaryStyle}>Go to Dashboard</Link>
                ) : (
                    <Link to="/register" style={btnPrimaryStyle}>Start Trading Now</Link>
                )}

                {/* Hero Visual */}
                <div
                    className="hero-visual"
                    style={{
                        marginTop: "80px",
                        width: "100%",
                        maxWidth: "1000px",
                        // Removed fixed aspect-ratio to allow content to dictate height on mobile
                        background: "#131722",
                        borderRadius: "12px",
                        border: "1px solid #2a2e39",
                        boxShadow: "0 50px 100px -20px rgba(0,0,0,0.6)",
                        position: "relative",
                        overflow: "hidden",
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                    {/* Fake UI Header */}
                    <div style={{ height: '40px', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff4d4d' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffcc00' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#26cc62' }}></div>
                    </div>
                    {/* Fake Content */}
                    <div className="hero-mock-grid" style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div style={{ background: '#1e222d', borderRadius: '8px', padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#8d929b' }}>AAPL</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>184.25 <span style={{ fontSize: '14px', color: '#26cc62' }}>+1.2%</span></div>
                                </div>
                            </div>
                            {/* CSS Line Chart Mockup */}
                            <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px' }}>
                                {[40, 60, 45, 70, 65, 85, 80, 95, 90, 100, 85, 110].map((h, i) => (
                                    <div key={i} style={{
                                        width: '8%',
                                        height: `${h}%`,
                                        background: `linear-gradient(to top, #26cc6220, #26cc62)`,
                                        borderRadius: '2px 2px 0 0'
                                    }} />
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ background: '#1e222d', borderRadius: '8px', padding: '16px', flex: 1, minHeight: '150px' }}>
                                <div style={{ fontSize: '12px', color: '#8d929b', marginBottom: '8px' }}>Watchlist</div>
                                {mockWatchlist.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2a2e39' }}>
                                        <span style={{ fontWeight: 600 }}>{item.ticker}</span>
                                        <span style={{ color: item.color }}>{item.change}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: '#1e222d', borderRadius: '8px', padding: '16px', flex: 1, minHeight: '150px' }}>
                                <div style={{ fontSize: '12px', color: '#8d929b', marginBottom: '8px' }}>Recent Orders</div>
                                {mockOrders.map((order, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2a2e39' }}>
                                        <span style={{ fontWeight: 600, color: order.color }}>{order.side}</span>
                                        <span style={{ color: '#fff' }}>{order.ticker}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features */}
            <section style={featureSectionStyle} className="feature-grid">
                <div style={featureCardStyle}>
                    <div style={{ fontSize: "32px" }}>⚡</div>
                    <h3 style={{ fontSize: "20px", margin: 0 }}>Real-time Execution</h3>
                    <p style={{ color: "#8d929b", lineHeight: 1.5 }}>
                        Execute simulated trades instantly with real market triggers. Experience the thrill of the market with zero risk.
                    </p>
                </div>
                <div style={featureCardStyle}>
                    <div style={{ fontSize: "32px" }}>🔔</div>
                    <h3 style={{ fontSize: "20px", margin: 0 }}>Smart Alerts</h3>
                    <p style={{ color: "#8d929b", lineHeight: 1.5 }}>
                        Never miss a move. Set dynamic price alerts and get notified precisely when your targets are hit.
                    </p>
                </div>
                <div style={featureCardStyle}>
                    <div style={{ fontSize: "32px" }}>📊</div>
                    <h3 style={{ fontSize: "20px", margin: 0 }}>Deep Analytics</h3>
                    <p style={{ color: "#8d929b", lineHeight: 1.5 }}>
                        Visualize your performance with advanced charting. Track P&L, exposure, and historical returns effortlessly.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: "40px", borderTop: "1px solid #2a2e39", textAlign: "center", color: "#8d929b", fontSize: "14px" }}>
                © 2026 FinBoard Inc. All rights reserved. <br />
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "20px" }}>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                    <span>Contact</span>
                </div>
            </footer>
        </div>
    );
}
