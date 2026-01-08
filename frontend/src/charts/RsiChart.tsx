
import { useMemo, useRef } from "react";
import { useChartWidth } from "../hooks/useChartWidth";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { formatFinancialValue } from "../utils/formatters";

type Props = {
  timestamps: string[];
  rsi: (number | null)[];
};

export function RsiChart({ timestamps, rsi }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const width = useChartWidth(containerRef);

  const data = useMemo(
    () =>
      timestamps.map((ts, i) => ({
        ts,
        rsi: rsi[i] ?? null,
      })),
    [timestamps, rsi]
  );

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: 180, minHeight: 180, minWidth: 0 }}
    >
      {width > 0 && (
        <LineChart
          width={width}
          height={180}
          data={data}
          syncId="chart-sync"
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            }}
            minTickGap={40}
          />
          <YAxis domain={[0, 100]} tickFormatter={(v) => formatFinancialValue(v, "rsi")} />
          <Tooltip
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
            formatter={(value: number | undefined, name: string | undefined) => {
              if (value === undefined) return ["", name ?? ""];
              return [formatFinancialValue(value, "rsi"), name ?? ""];
            }}
          />

          <ReferenceLine
            y={70}
            strokeDasharray="3 3"
            label={{ value: "Overbought (70)", position: "insideTopLeft" }}
          />
          <ReferenceLine
            y={30}
            strokeDasharray="3 3"
            label={{ value: "Oversold (30)", position: "insideBottomLeft" }}
          />

          <Line type="monotone" dataKey="rsi" dot={false} name="RSI (14)" />
        </LineChart>
      )}
    </div>
  );
}
