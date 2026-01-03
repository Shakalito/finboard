import { useMemo, useRef } from "react";
import { useChartWidth } from "../hooks/useChartWidth";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { OhlcvPoint } from "../api/ohlcv";
import { formatFinancialValue } from "../utils/formatters";

type Props = {
  points: OhlcvPoint[];
  sma20?: (number | null)[];
  sma50?: (number | null)[];
};

export function LineCloseChart({ points, sma20, sma50 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const width = useChartWidth(containerRef);

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
        <LineChart width={width} height={350} data={data} syncId="chart-sync" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            }}
            minTickGap={40}
          />
          <YAxis domain={["auto", "auto"]} tickFormatter={(v) => formatFinancialValue(v, "price")} />
          <Tooltip
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
            formatter={(value: number | undefined) => {
              if (value === undefined) return ["", ""];
              return [formatFinancialValue(value, "price"), ""];
            }}
          />
          <Legend />

          <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} name="Close" />
          <Line type="monotone" dataKey="sma20" stroke="#ff7300" dot={false} connectNulls name="SMA 20" />
          <Line type="monotone" dataKey="sma50" stroke="#10b981" dot={false} connectNulls name="SMA 50" />
        </LineChart>
      )}
    </div>
  );
}