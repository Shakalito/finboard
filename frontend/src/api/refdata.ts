import { apiFetch } from "./client";

export type ListingSummary = {
  id: string;
  ticker: string | null;
  name: string;
  venue_code: string;
  venue_name: string;
  currency: string | null;
};

export function searchListings(q: string, limit = 20): Promise<ListingSummary[]> {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  params.set("limit", String(limit));

  return apiFetch<ListingSummary[]>(`/refdata/listings?${params.toString()}`, {
    method: "GET",
  });
}
