import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { OhlcvPoint } from "../api/ohlcv";

type Props = {
  points: OhlcvPoint[];
  sma20?: (number | null)[];
  sma50?: (number | null)[];
};

export function LineCloseChart({ points, sma20, sma50 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0) setWidth(w);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(
    () =>
      points.map((p, i) => ({
        ts: p.ts,
        close: p.close,
        sma20: sma20?.[i] ?? null,
        sma50: sma50?.[i] ?? null,
      })),
    [points, sma20, sma50]
  );

  return (
    <div ref={containerRef} style={{ width: "100%", height: 350, minHeight: 350, minWidth: 0 }}>
      {width > 0 && (
        <LineChart width={width} height={350} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            }}
            minTickGap={40}
          />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleString()} />
          <Legend />

          <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} name="Close" />
          <Line type="monotone" dataKey="sma20" stroke="#ff7300" dot={false} connectNulls name="SMA 20" />
          <Line type="monotone" dataKey="sma50" stroke="#10b981" dot={false} connectNulls name="SMA 50" />
        </LineChart>
      )}
    </div>
  );
}
