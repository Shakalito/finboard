from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class WatchlistCreate(BaseModel):
    listing_id: UUID
    label: str | None = Field(default=None, max_length=100)


class WatchlistItemRead(BaseModel):
    id: UUID
    listing_id: UUID
    instrument_id: UUID
    venue_id: UUID | None
    ticker: str | None
    name: str
    venue_code: str
    venue_name: str
    label: str | None
    created_at: datetime

    class Config:
        from_attributes = True
