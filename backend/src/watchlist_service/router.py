from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError

from ..common.db import SessionLocal
from ..auth_service.router import get_current_user
from ..auth_service.db_models import User
from ..refdata_service.db_models import Listing, Instrument, Venue
from .db_models import WatchlistItem
from .schemas import WatchlistCreate, WatchlistItemRead

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def get_listing_with_joins(db: Session, listing_id: UUID):
    stmt = (
        select(Listing, Instrument, Venue)
        .join(Instrument, Listing.instrument_id == Instrument.id)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(Listing.id == listing_id)
    )
    return db.execute(stmt).one_or_none()



@router.get("/me", response_model=list[WatchlistItemRead])
def get_my_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # join: watchlist -> listings -> instruments -> venues
    stmt = (
        select(WatchlistItem, Listing, Instrument, Venue)
        .join(Listing, and_(
            WatchlistItem.instrument_id == Listing.instrument_id,
            WatchlistItem.venue_id == Listing.venue_id,
        ))
        .join(Instrument, Listing.instrument_id == Instrument.id)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.created_at.desc())
    )

    rows = db.execute(stmt).all()

    results: list[WatchlistItemRead] = []
    for w, listing, instrument, venue in rows:
        results.append(
            WatchlistItemRead(
                id=w.id,
                listing_id=listing.id,
                instrument_id=w.instrument_id,
                venue_id=w.venue_id,
                ticker=listing.ticker,
                name=instrument.name,
                venue_code=venue.code,
                venue_name=venue.name,
                label=w.label,
                created_at=w.created_at,
            )
        )

    return results


@router.post("", response_model=WatchlistItemRead, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    payload: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    row = get_listing_with_joins(db, payload.listing_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    listing, instrument, venue = row

    # check if exist
    existing_stmt = select(WatchlistItem).where(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.instrument_id == instrument.id,
        WatchlistItem.venue_id == venue.id,
    )
    existing = db.execute(existing_stmt).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instrument is already on your watchlist",
        )

    item = WatchlistItem(
        user_id=current_user.id,
        instrument_id=instrument.id,
        venue_id=venue.id,
        label=payload.label,
    )

    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # on race condition - return the same message
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instrument is already on your watchlist",
        )

    db.refresh(item)

    return WatchlistItemRead(
        id=item.id,
        listing_id=listing.id,
        instrument_id=item.instrument_id,
        venue_id=item.venue_id,
        ticker=listing.ticker,
        name=instrument.name,
        venue_code=venue.code,
        venue_name=venue.name,
        label=item.label,
        created_at=item.created_at,
    )


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    watchlist_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    stmt = select(WatchlistItem).where(
        WatchlistItem.id == watchlist_id,
        WatchlistItem.user_id == current_user.id,
    )

    item = db.execute(stmt).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found",
        )

    db.delete(item)
    db.commit()
    # 204 – bez body
    return
