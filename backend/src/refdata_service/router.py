from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from ..common.db import SessionLocal
from .db_models import Listing, Instrument, Venue
from .schemas import ListingSummary, ListingDetail

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/listings", response_model=list[ListingSummary])
def search_listings(
    q: str | None = Query(default=None, description="Fragment tickera lub nazwy spółki"),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):

    stmt = (
        select(Listing, Instrument, Venue)
        .join(Instrument, Listing.instrument_id == Instrument.id)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(Listing.active.is_(True))
    )

    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                Listing.ticker.ilike(pattern),
                Instrument.name.ilike(pattern),
            )
        )

    stmt = stmt.limit(limit)

    rows = db.execute(stmt).all()

    results: list[ListingSummary] = []
    for listing, instrument, venue in rows:
        results.append(
            ListingSummary(
                id=listing.id,
                ticker=listing.ticker,
                name=instrument.name,
                venue_code=venue.code,
                venue_name=venue.name,
                currency=listing.currency,
            )
        )

    return results


@router.get("/listings/{listing_id}", response_model=ListingDetail)
def get_listing_detail(
    listing_id: UUID,
    db: Session = Depends(get_db),
):
    stmt = (
        select(Listing, Instrument, Venue)
        .join(Instrument, Listing.instrument_id == Instrument.id)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(Listing.id == listing_id)
    )

    row = db.execute(stmt).one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    listing, instrument, venue = row

    return ListingDetail(
        id=listing.id,
        instrument_id=listing.instrument_id,
        venue_id=listing.venue_id,
        ticker=listing.ticker,
        isin=listing.isin,
        name=instrument.name,
        venue_code=venue.code,
        venue_name=venue.name,
        currency=listing.currency,
        quote_currency=listing.quote_currency,
        market_code=listing.market_code,
        active=listing.active,
    )
