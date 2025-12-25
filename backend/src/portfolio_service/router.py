from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..common.db import SessionLocal
from ..auth_service.router import get_current_user
from ..auth_service.db_models import User

from .db_models import Account
from .schemas import AccountRead, AccountCreate

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/health")
def portfolio_health():
    return {"status": "ok"}


@router.get("/accounts/me", response_model=list[AccountRead])
def get_my_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Account).where(Account.user_id == current_user.id)
    rows = db.execute(stmt).scalars().all()
    return [AccountRead.model_validate(x) for x in rows]


@router.post("/accounts", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
def create_paper_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Account).where(
        Account.user_id == current_user.id,
        Account.type == "PAPER",
    )
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        return AccountRead.model_validate(existing)

    acc = Account(
        user_id=current_user.id,
        base_currency=payload.base_currency.upper(),
        type="PAPER",
    )
    db.add(acc)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        again = db.execute(stmt).scalar_one_or_none()
        if again:
            return AccountRead.model_validate(again)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create account",
        )

    db.refresh(acc)
    return AccountRead.model_validate(acc)
