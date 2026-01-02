import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getOhlcv, type OhlcvResponse } from "../api/ohlcv";
import { LineCloseChart } from "../charts/LineCloseChart";
import { CandlestickChart } from "../charts/CandlestickChart";
import { Link } from "react-router-dom";
import { sma, rsi } from "../marketdata/indicators";
import { RsiChart } from "../charts/RsiChart";


type RangeKey = "3m" | "6m" | "1y" | "5y";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function ChartPage() {
  const { listingId } = useParams<{ listingId: string }>();

  const [data, setData] = useState<OhlcvResponse | null>(null);
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
    (async () => {
      if (!listingId) return;
      setErr(null);
      setData(null);
      try {
        const res = await getOhlcv(listingId, query);
        setData(res);
      } catch (e: any) {
        setErr(e?.message ?? "OHLCV error");
      }
    })();
  }, [listingId, query]);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2>Chart</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/watchlist">Back to watchlist</Link>
        <Link to="/listings">Search listings</Link>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span>Range:</span>
        <button onClick={() => setRange("3m")} disabled={range === "3m"}>3M</button>
        <button onClick={() => setRange("6m")} disabled={range === "6m"}>6M</button>
        <button onClick={() => setRange("1y")} disabled={range === "1y"}>1Y</button>
        <button onClick={() => setRange("5y")} disabled={range === "5y"}>5Y</button>

        <span style={{ marginLeft: 12 }}>Indicators:</span>
        <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showRsi}
            onChange={(e) => setShowRsi(e.target.checked)}
          />
          show RSI
        </label>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!err && !data && <p>Loading...</p>}

      {data && data.points.length === 0 && <p>No OHLCV data for this listing.</p>}

      {data && data.points.length > 0 && (
        <>
          <h3 style={{ marginTop: 16 }}>Candlestick (D1)</h3>
          <CandlestickChart points={data.points} />

          <h3 style={{ marginTop: 24 }}>Close line (D1) with SMA</h3>
          <LineCloseChart
            points={data.points}
            sma20={sma20}
            sma50={sma50}
          />
          {showRsi && (
            <>
              <h3 style={{ marginTop: 24 }}>RSI (14)</h3>
              <RsiChart
                timestamps={data.points.map((p) => p.ts)}
                rsi={rsi14 ?? []}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
