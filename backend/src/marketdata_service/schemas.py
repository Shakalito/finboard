from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class OhlcvPoint(BaseModel):
    ts: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float | None


class OhlcvResponse(BaseModel):
    listing_id: UUID
    instrument_id: UUID
    venue_id: UUID
    timeframe: str
    points: list[OhlcvPoint]
