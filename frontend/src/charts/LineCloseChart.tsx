import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { OhlcvPoint } from "../api/ohlcv";

type Props = {
  points: OhlcvPoint[];
};

export function LineCloseChart({ points }: Props) {
  const data = points.map((p) => ({
    ts: p.ts,
    close: p.close,
  }));

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            }}
            minTickGap={40}
          />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
          />
          <Line type="monotone" dataKey="close" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
