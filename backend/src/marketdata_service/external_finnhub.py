from datetime import datetime, timezone
from typing import Any, Dict

import httpx

from ..common.config import settings


class FinnhubClient:
    def __init__(self) -> None:
        self.base_url = settings.finnhub_base_url.rstrip("/")
        self.api_key = settings.finnhub_api_key

    def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        url = f"{self.base_url}/quote"
        params = {
            "symbol": symbol,
            "token": self.api_key,
        }

        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        return data

    @staticmethod
    def parse_timestamp(unix_ts: int | None) -> datetime | None:
        if not unix_ts:
            return None
        return datetime.fromtimestamp(unix_ts, tz=timezone.utc)

