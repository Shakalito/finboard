import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type CandlestickData,
  type UTCTimestamp,
  type ISeriesApi,
} from "lightweight-charts";
import type { OhlcvPoint } from "../api/ohlcv";

type Props = {
  points: OhlcvPoint[];
};

function toUtcTimestamp(iso: string): UTCTimestamp {
  return Math.floor(new Date(iso).getTime() / 1000) as UTCTimestamp;
}

export function CandlestickChart({ points }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  const candleData = useMemo<CandlestickData[]>(() => {
    return points.map((p) => ({
      time: toUtcTimestamp(p.ts),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));
  }, [points]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 360,
      width: containerRef.current.clientWidth,
    });

    const series = (chart as any).addCandlestickSeries() as ISeriesApi<"Candlestick">;

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };
    resizeHandlerRef.current = handleResize;
    window.addEventListener("resize", handleResize);

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }
      resizeHandlerRef.current = null;

      chart.remove();

      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    seriesRef.current.setData(candleData);
    chartRef.current.timeScale().fitContent();
  }, [candleData]);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}
