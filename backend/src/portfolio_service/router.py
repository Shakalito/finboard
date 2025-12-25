from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common.db import SessionLocal
from ..auth_service.router import get_current_user
from ..auth_service.db_models import User

from .db_models import Account
from .schemas import AccountRead

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
