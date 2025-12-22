import { useEffect, useMemo, useState } from "react";
import { getQuotesBatch, type QuoteResponse } from "../api/marketdata";

type QuoteState = {
  data?: QuoteResponse;
  error?: string;
  loading: boolean;
};

export function useQuotes(listingIds: string[], refreshMs = 0) {
  const [map, setMap] = useState<Record<string, QuoteState>>({});

  const idsKey = useMemo(() => listingIds.slice().sort().join(","), [listingIds]);

  async function loadOnce() {
    const ids = listingIds.filter(Boolean);
    if (ids.length === 0) return;

    setMap((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = { ...next[id], loading: true };
      return next;
    });

    try {
      const res = await getQuotesBatch(ids);

      setMap((prev) => {
        const next = { ...prev };

        for (const id of ids) {
          const data = res.results[id] ?? undefined;
          const err = res.errors[id];

          if (data) {
            next[id] = { loading: false, data };
          } else if (err) {
            next[id] = { loading: false, error: err };
          } else {
            next[id] = { loading: false, error: "Unknown quote error" };
          }
        }

        return next;
      });
    } catch (e: any) {
      const msg = e?.message ?? "Batch quotes error";
      setMap((prev) => {
        const next = { ...prev };
        for (const id of ids) next[id] = { loading: false, error: msg };
        return next;
      });
    }
  }

  useEffect(() => {
    loadOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    if (!refreshMs || refreshMs < 5000) return;
    const t = setInterval(() => loadOnce(), refreshMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, refreshMs]);

  return { quotes: map, reload: loadOnce };
}
