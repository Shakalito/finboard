from __future__ import annotations

from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..refdata_service.db_models import Listing, Instrument, Venue
from .external_finnhub import FinnhubClient
from .schemas import FinnhubQuoteRaw


def fetch_quotes_batch(db: Session, listing_ids: list[UUID]) -> dict:
    """
    Returns:
      {
        "results": { "<listing_id>": { ...QuoteResponse-like dict... } | None },
        "errors":  { "<listing_id>": "error msg" }
      }
    """
    client = FinnhubClient()

    stmt = (
        select(Listing, Instrument, Venue)
        .join(Instrument, Listing.instrument_id == Instrument.id)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(Listing.id.in_(listing_ids))
    )
    rows = db.execute(stmt).all()
    by_id: dict[UUID, tuple] = {l.id: (l, i, v) for (l, i, v) in rows}

    results: dict[str, dict | None] = {} 
    errors: dict[str, str] = {}

    for lid in listing_ids:
        str_lid = str(lid)

        if lid not in by_id:
            results[str_lid] = None
            errors[str_lid] = "Listing not found"
            continue

        listing, instrument, venue = by_id[lid]
        if not listing.ticker:
            results[str_lid] = None
            errors[str_lid] = "Listing has no ticker configured"
            continue

        try:
            raw = client.fetch_quote(symbol=listing.ticker)
            validated = FinnhubQuoteRaw.model_validate(raw)

           
            results[str_lid] = {
                "listing_id": str_lid, 
                "instrument_id": str(instrument.id),
                "venue_id": str(venue.id),
                "ticker": listing.ticker,
                "price": validated.c,
                "open": validated.o,
                "high": validated.h,
                "low": validated.l,
                "prev_close": validated.pc,
                "timestamp": client.parse_timestamp(validated.t).isoformat().replace("+00:00", "Z")
                if validated.t
                else None,
            }
        except Exception as e:
            results[str_lid] = None
            errors[str_lid] = str(e)

    return {"results": results, "errors": errors}
