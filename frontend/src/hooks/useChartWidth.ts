import { useState, useEffect, type RefObject } from "react";

export function useChartWidth<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0) setWidth(w);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}