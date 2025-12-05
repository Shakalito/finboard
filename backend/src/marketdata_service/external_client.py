from datetime import datetime, timedelta, timezone
from typing import Literal

import httpx

from ..common.config import settings


FinnhubResolution = Literal["D"]


class FinnhubClient:
    def __init__(self):
        self.base_url = settings.finnhub_base_url.rstrip("/")
        self.api_key = settings.finnhub_api_key

        # print(f"DEBUG: Finnhub API Key loaded: {self.api_key}")

    def fetch_ohlcv_daily(
        self,
        symbol: str,
        days_back: int = 365,
    ) -> list[dict]:

        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days_back)

        params = {
            "symbol": symbol,
            "resolution": "D",
            "from": int(start.timestamp()),
            "to": int(end.timestamp()),
            "token": self.api_key,
        }

        url = f"{self.base_url}/stock/candle"

        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        status = data.get("s")
        if status != "ok":
            # 'no_data' and other bs
            return []

        t_list = data.get("t", [])
        o_list = data.get("o", [])
        h_list = data.get("h", [])
        l_list = data.get("l", [])
        c_list = data.get("c", [])
        v_list = data.get("v", [])

        points: list[dict] = []
        for ts, o, h, l, c, v in zip(t_list, o_list, h_list, l_list, c_list, v_list):
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            points.append(
                {
                    "ts": dt,
                    "open": float(o),
                    "high": float(h),
                    "low": float(l),
                    "close": float(c),
                    "volume": float(v) if v is not None else None,
                }
            )

        return points
