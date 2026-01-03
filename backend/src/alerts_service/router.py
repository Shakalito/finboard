from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session

from ..common.db import SessionLocal
from ..auth_service.router import get_current_user
from ..auth_service.db_models import User
from ..refdata_service.db_models import Listing
from .db_models import PriceAlert
from .schemas import AlertCreate, AlertRead, AlertUpdate

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_listing_exists(db: Session, listing_id: UUID) -> None:
    stmt = select(Listing.id).where(Listing.id == listing_id)
    exists_ = db.execute(stmt).scalar_one_or_none()
    if exists_ is None:
        raise HTTPException(status_code=404, detail="Listing not found")


@router.post("", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_listing_exists(db, payload.listing_id)

    alert = PriceAlert(
        user_id=current_user.id,
        listing_id=payload.listing_id,
        condition=payload.condition,
        target_price=payload.target_price,
        currency=payload.currency,
        is_active=True,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return AlertRead.model_validate(alert)


@router.get("/me", response_model=list[AlertRead])
def list_my_alerts(
    active: bool | None = Query(default=None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(PriceAlert)
        .where(PriceAlert.user_id == current_user.id)
        .order_by(desc(PriceAlert.created_at))
    )
    if active is not None:
        stmt = stmt.where(PriceAlert.is_active.is_(active))

    rows = db.execute(stmt).scalars().all()
    return [AlertRead.model_validate(x) for x in rows]


@router.patch("/{alert_id}", response_model=AlertRead)
def update_alert(
    alert_id: UUID,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PriceAlert).where(
        PriceAlert.id == alert_id,
        PriceAlert.user_id == current_user.id,
    )
    alert = db.execute(stmt).scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_active = payload.is_active
    alert.updated_at = func.now()

    db.commit()
    db.refresh(alert)
    return AlertRead.model_validate(alert)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PriceAlert).where(
        PriceAlert.id == alert_id,
        PriceAlert.user_id == current_user.id,
    )
    alert = db.execute(stmt).scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return
