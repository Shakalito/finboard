from uuid import UUID
from pydantic import BaseModel


class ListingBase(BaseModel):
    id: UUID
    instrument_id: UUID
    venue_id: UUID
    ticker: str | None
    isin: str | None
    currency: str | None
    quote_currency: str | None
    market_code: str | None
    active: bool


class ListingSummary(BaseModel):
    id: UUID
    ticker: str | None
    name: str            # name of the instrument
    venue_code: str
    venue_name: str
    currency: str | None

    class Config:
        from_attributes = True


class ListingDetail(BaseModel):
    id: UUID
    instrument_id: UUID
    venue_id: UUID
    ticker: str | None
    isin: str | None
    name: str
    venue_code: str
    venue_name: str
    currency: str | None
    quote_currency: str | None
    market_code: str | None
    active: bool

    class Config:
        from_attributes = True
