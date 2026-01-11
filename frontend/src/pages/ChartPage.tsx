import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getOhlcv, type OhlcvResponse } from "../api/ohlcv";
import { getListing, type ListingDetail } from "../api/refdata";
import { LineCloseChart } from "../charts/LineCloseChart";
import { CandlestickChart } from "../charts/CandlestickChart";
import { sma, rsi } from "../marketdata/indicators";
import { RsiChart } from "../charts/RsiChart";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useAuth } from "../auth/AuthContext";

type RangeKey = "3m" | "6m" | "1y" | "5y";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function ChartPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<OhlcvResponse | null>(null);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("1y");
  const [showRsi, setShowRsi] = useState(false);

  const query = useMemo(() => {
    if (range === "3m") return { date_from: isoDaysAgo(90), limit: 120 };
    if (range === "6m") return { date_from: isoDaysAgo(180), limit: 220 };
    if (range === "1y") return { date_from: isoDaysAgo(365), limit: 320 };
    return { date_from: isoDaysAgo(365 * 5), limit: 1400 };
  }, [range]);

  const sma20 = useMemo(() => {
    if (!data?.points?.length) return undefined;
    return sma(data.points, 20).map(p => p.value);
  }, [data]);

  const sma50 = useMemo(() => {
    if (!data?.points?.length) return undefined;
    return sma(data.points, 50).map(p => p.value);
  }, [data]);

  const rsi14 = useMemo(() => {
    if (!data?.points?.length) return undefined;
    return rsi(data.points, 14).map(p => p.value);
  }, [data]);

  useEffect(() => {

    if (!token) {
      navigate("/login");
      return;
    }

    (async () => {
      if (!listingId) return;
      setErr(null);
      setData(null);
      setListing(null);
      try {
        const [ohlcvRes, listingRes] = await Promise.all([
          getOhlcv(listingId, query),
          getListing(listingId)
        ]);
        setData(ohlcvRes);
        setListing(listingRes);
      } catch (e: any) {
        setErr(e?.message ?? "Error loading chart data");
      }
    })();
  }, [listingId, query, token, navigate]);


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
    display: "flex",
    flexDirection: "column",
  };

  const subNavStyle: CSSProperties = {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    alignItems: 'center',
    borderBottom: "1px solid #2a2e39",
    paddingBottom: "12px",
  };

  const backLinkStyle: CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#8d929b",
    textDecoration: "none",
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const panelStyle: CSSProperties = {
    backgroundColor: "#1e222d",
    borderRadius: "6px",
    border: "1px solid #2a2e39",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  };

  const headerTitleStyle: CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "4px",
  };

  const rangeBtnStyle = (isActive: boolean): CSSProperties => ({
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: isActive ? "#26cc62" : "#2a2e39",
    color: isActive ? "#ffffff" : "#8d929b",
    border: isActive ? "1px solid #26cc62" : "1px solid #434651",
    borderRadius: "4px",
    transition: "all 0.2s",
  });

  const toggleBtnStyle = (isActive: boolean): CSSProperties => ({
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: isActive ? "#3b82f6" : "#2a2e39",
    color: isActive ? "#ffffff" : "#8d929b",
    border: isActive ? "1px solid #3b82f6" : "1px solid #434651",
    borderRadius: "4px",
    transition: "all 0.2s",
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  const chartTitleStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#d1d4dc',
    marginBottom: '10px',
    borderLeft: '3px solid #26cc62',
    paddingLeft: '10px'
  };


  return (
    <>
      <Header activeTab="none" />

      <div style={pageWrapperStyle}>

        {/* SUB-NAV */}
        <div style={subNavStyle}>
          <Link to="/watchlist" style={backLinkStyle}>&larr; Back to Watchlist</Link>
          <span style={{ color: '#434651' }}>|</span>
          <Link to="/portfolio" style={backLinkStyle}>Portfolio</Link>
        </div>

        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={headerTitleStyle}>
                <span style={{ color: '#26cc62' }}>{listing ? listing.ticker : 'Loading...'}</span>
                {listing && <span style={{ fontWeight: 400, color: '#8d929b', marginLeft: '10px' }}>{listing.name}</span>}
              </h2>
              <div style={{ fontSize: '13px', color: '#8d929b' }}>
                Daily interval • {range.toUpperCase()} Range
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#8d929b', marginRight: '4px' }}>Range:</span>
                {(["3m", "6m", "1y", "5y"] as RangeKey[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    style={rangeBtnStyle(range === r)}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#8d929b', marginRight: '4px' }}>Indicators:</span>
                <button
                  onClick={() => setShowRsi(!showRsi)}
                  style={toggleBtnStyle(showRsi)}
                >
                  {showRsi ? "Hide RSI" : "Show RSI"}
                </button>
              </div>
            </div>
          </div>

          {err && <div style={{ padding: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px' }}>{err}</div>}

          {!err && !data && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#8d929b' }}>
              Loading chart data...
            </div>
          )}

          {data && data.points.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#8d929b' }}>
              No OHLCV data available for this asset.
            </div>
          )}

          {data && data.points.length > 0 && (
            <>
              <div>
                <div style={chartTitleStyle}>Candlestick Chart</div>
                <div style={{ height: '400px', width: '100%' }}>
                  <CandlestickChart points={data.points} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #2a2e39', paddingTop: '20px' }}>
                <div style={chartTitleStyle}>Moving Averages (SMA 20/50)</div>
                <div style={{ height: '350px', width: '100%' }}>
                  <LineCloseChart
                    points={data.points}
                    sma20={sma20}
                    sma50={sma50}
                  />
                </div>
              </div>

              {showRsi && (
                <div style={{ borderTop: '1px solid #2a2e39', paddingTop: '20px' }}>
                  <div style={chartTitleStyle}>Relative Strength Index (14)</div>
                  <div style={{ height: '200px', width: '100%' }}>
                    <RsiChart
                      timestamps={data.points.map((p) => p.ts)}
                      rsi={rsi14 ?? []}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}