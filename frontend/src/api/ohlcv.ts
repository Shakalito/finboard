import { apiFetch } from "./client";

export type OhlcvPoint = {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

export type OhlcvResponse = {
  listing_id: string;
  instrument_id: string;
  venue_id: string;
  timeframe: string;
  points: OhlcvPoint[];
};

export type Timeframe = "m1" | "m5" | "m15" | "h1" | "h4" | "d1" | "w1" | "mo1";

export type OhlcvQuery = {
  timeframe?: Timeframe;
  limit?: number;
  date_from?: string; // ISO
  date_to?: string;   // ISO
};


export function getOhlcv(listingId: string, q: OhlcvQuery = {}): Promise<OhlcvResponse> {
  const params = new URLSearchParams({
    listing_id: listingId,
    timeframe: q.timeframe ?? "d1",
    limit: String(q.limit ?? 300),
  });

  if (q.date_from) params.set("date_from", q.date_from);
  if (q.date_to) params.set("date_to", q.date_to);

  return apiFetch<OhlcvResponse>(`/marketdata/ohlcv?${params.toString()}`, { method: "GET" });
}
