from datetime import datetime, timezone
from typing import Any, Dict

import asyncio
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

    async def fetch_quote_async(self, client: httpx.AsyncClient, symbol: str) -> Dict[str, Any]:
        url = f"{self.base_url}/quote"
        params = {"symbol": symbol, "token": self.api_key}
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

    async def fetch_quotes_many(self, symbols: list[str], concurrency: int = 5) -> dict[str, Dict[str, Any]]:
        results: dict[str, Dict[str, Any]] = {}
        sem = asyncio.Semaphore(concurrency)

        async with httpx.AsyncClient(timeout=10.0) as client:
            async def one(sym: str):
                async with sem:
                    try:
                        results[sym] = await self.fetch_quote_async(client, sym)
                    except Exception:
                        results[sym] = {}

            await asyncio.gather(*(one(s) for s in symbols))

        return results