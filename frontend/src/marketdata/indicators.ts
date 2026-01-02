export type CandleLike = {
  ts: string;
  close: number;
};

export type SeriesPoint = {
  ts: string;
  value: number | null;
};

export function sma(points: CandleLike[], period: number): SeriesPoint[] {
  if (period <= 0) throw new Error("SMA period must be > 0");
  if (!points.length) return [];

  const out: SeriesPoint[] = new Array(points.length);
  let sum = 0;

  for (let i = 0; i < points.length; i++) {
    const c = points[i].close;
    sum += c;

    if (i >= period) {
      sum -= points[i - period].close;
    }

    const v = i >= period - 1 ? sum / period : null;
    out[i] = { ts: points[i].ts, value: v };
  }

  return out;
}

export function rsi(points: CandleLike[], period: number): SeriesPoint[] {
  if (period <= 0) throw new Error("RSI period must be > 0");
  if (points.length === 0) return [];
  if (points.length === 1) return [{ ts: points[0].ts, value: null }];

  const out: SeriesPoint[] = points.map((p) => ({ ts: p.ts, value: null }));

  const deltas: number[] = new Array(points.length).fill(0);
  for (let i = 1; i < points.length; i++) {
    deltas[i] = points[i].close - points[i - 1].close;
  }

  if (points.length <= period) return out;

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const d = deltas[i];
    if (d >= 0) gainSum += d;
    else lossSum += -d;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  out[period].value = calcRsiValue(avgGain, avgLoss);

  for (let i = period + 1; i < points.length; i++) {
    const d = deltas[i];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    out[i].value = calcRsiValue(avgGain, avgLoss);
  }

  return out;
}

function calcRsiValue(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0 && avgGain === 0) return 50;
  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}