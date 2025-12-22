import { apiFetch, apiFetchVoid } from "./client";

export type WatchlistItemRead = {
  id: string;
  listing_id: string;
  instrument_id: string;
  venue_id: string | null;

  ticker: string | null;
  name: string;
  venue_code: string;
  venue_name: string;

  label: string | null;
  created_at: string; // ISO
};

export type WatchlistCreate = {
  listing_id: string;
  label?: string | null;
};

export function getMyWatchlist(token: string): Promise<WatchlistItemRead[]> {
  return apiFetch<WatchlistItemRead[]>("/watchlist/me", { method: "GET" }, token);
}

export function addToWatchlist(token: string, payload: WatchlistCreate): Promise<WatchlistItemRead> {
  return apiFetch<WatchlistItemRead>(
    "/watchlist",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export function removeFromWatchlist(token: string, watchlistId: string): Promise<void> {
  return apiFetchVoid(`/watchlist/${watchlistId}`, { method: "DELETE" }, token);
}
