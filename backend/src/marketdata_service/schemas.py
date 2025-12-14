from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class OhlcvPoint(BaseModel):
    ts: datetime = Field(..., description="Timestamp (UTC) of the candle.")
    open: float = Field(..., description="Opening price.")
    high: float = Field(..., description="Maximum price.")
    low: float = Field(..., description="Minimum price.")
    close: float = Field(..., description="Closing price.")
    volume: float | None = Field(None, description="Trading volume.")


class OhlcvResponse(BaseModel):
    listing_id: UUID
    instrument_id: UUID
    venue_id: UUID
    timeframe: str
    points: list[OhlcvPoint]


class QuoteResponse(BaseModel):
    listing_id: UUID
    instrument_id: UUID
    venue_id: UUID | None
    ticker: str | None

    price: float | None
    open: float | None
    high: float | None
    low: float | None
    prev_close: float | None
    timestamp: datetime | None


class FinnhubQuoteRaw(BaseModel):
    c: float | None = None
    o: float | None = None
    h: float | None = None
    l: float | None = None
    pc: float | None = None
    t: int | None = None

    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }

class BatchQuotesRequest(BaseModel):
    listing_ids: list[UUID] = Field(..., min_length=1, max_length=100)

class BatchQuotesResponse(BaseModel):
    results: dict[UUID, QuoteResponse | None]
    errors: dict[UUID, str]