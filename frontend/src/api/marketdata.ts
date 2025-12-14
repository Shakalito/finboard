import { apiFetch } from "./client";

export type QuoteResponse = {
  listing_id: string;
  instrument_id: string;
  venue_id: string | null;
  ticker: string | null;

  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  prev_close: number | null;
  timestamp: string | null;
};

export type BatchQuotesRequest = {
  listing_ids: string[];
};

export type BatchQuotesResponse = {
  results: Record<string, QuoteResponse | null>;
  errors: Record<string, string>;
};

export function getQuotesBatch(listingIds: string[]): Promise<BatchQuotesResponse> {
  return apiFetch<BatchQuotesResponse>("/marketdata/quotes", {
    method: "POST",
    body: JSON.stringify({ listing_ids: listingIds } satisfies BatchQuotesRequest),
  });
}
