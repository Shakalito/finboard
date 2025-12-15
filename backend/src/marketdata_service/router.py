from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..common.db import SessionLocal
from ..refdata_service.db_models import Listing, Instrument, Venue
from .db_models import Ohlcv
from .schemas import OhlcvPoint, OhlcvResponse, QuoteResponse, FinnhubQuoteRaw
from .external_finnhub import FinnhubClient

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# helper
def get_listing_with_joins(db: Session, listing_id: UUID):
    stmt = (
        select(Listing, Instrument, Venue)
        .join(Instrument, Listing.instrument_id == Instrument.id)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(Listing.id == listing_id)
    )
    return db.execute(stmt).one_or_none()



@router.get("/quote", response_model=QuoteResponse)
def get_quote(
    listing_id: UUID = Query(..., description="ID from refdata.listings"),
    db: Session = Depends(get_db),
):

    row = get_listing_with_joins(db, listing_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    listing, instrument, venue = row

    if not listing.ticker:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing has no ticker configured",
        )

    client = FinnhubClient()
    raw_data = client.fetch_quote(symbol=listing.ticker)

    validated_data = FinnhubQuoteRaw.model_validate(raw_data)

    return QuoteResponse(
        listing_id=listing_id,
        instrument_id=instrument.id,
        venue_id=venue.id,
        ticker=listing.ticker,

        #py2
        price=validated_data.c,
        open=validated_data.o,
        high=validated_data.h,
        low=validated_data.l,
        prev_close=validated_data.pc,

        timestamp=FinnhubClient.parse_timestamp(validated_data.t),
    )



@router.get("/ohlcv", response_model=OhlcvResponse)
def get_ohlcv(
    listing_id: UUID = Query(..., description="Listing ID from refdata.listings"),
    timeframe: str = Query("d1"),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=5000),
    db: Session = Depends(get_db),
):

    row = get_listing_with_joins(db, listing_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    listing, instrument, venue = row

    stmt = (
        select(Ohlcv)
        .where(
            Ohlcv.instrument_id == instrument.id,
            Ohlcv.venue_id == venue.id,
            Ohlcv.tf == timeframe,
        )
        .order_by(Ohlcv.ts.desc())
        .limit(limit)
    )

    if date_from is not None:
        stmt = stmt.where(Ohlcv.ts >= date_from)
    if date_to is not None:
        stmt = stmt.where(Ohlcv.ts <= date_to)

    rows = db.execute(stmt).scalars().all()
    rows = list(reversed(rows))

    points: list[OhlcvPoint] = []
    for r in rows:
        points.append(
            OhlcvPoint(
                ts=r.ts,
                open=float(r.open),
                high=float(r.high),
                low=float(r.low),
                close=float(r.close),
                volume=float(r.volume) if r.volume is not None else None,
            )
        )

    return OhlcvResponse(
        listing_id=listing_id,
        instrument_id=instrument.id,
        venue_id=venue.id,
        timeframe=timeframe,
        points=points,
    )
