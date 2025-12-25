from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..common.db import SessionLocal
from ..auth_service.router import get_current_user
from ..auth_service.db_models import User

from uuid import UUID
from .db_models import Account, AccountEntry
from .schemas import AccountRead, AccountCreate, DepositRequest, BalanceResponse

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_account_owned(db: Session, account_id: UUID, user_id: UUID) -> Account | None:
    stmt = select(Account).where(Account.id == account_id, Account.user_id == user_id)
    return db.execute(stmt).scalar_one_or_none()


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


@router.post("/accounts/{account_id}/deposit", status_code=status.HTTP_201_CREATED)
def deposit_cash(
    account_id: UUID,
    payload: DepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    acc = get_account_owned(db, account_id, current_user.id)
    if acc is None:
        raise HTTPException(status_code=404, detail="Account not found")

    entry = AccountEntry(
        account_id=acc.id,
        currency=payload.currency.upper(),
        amount=payload.amount,
        type="DEPOSIT",
        ref_id=None,
    )
    db.add(entry)
    db.commit()
    return {"status": "ok"}


@router.get("/accounts/{account_id}/balance", response_model=BalanceResponse)
def get_balance(
    account_id: UUID,
    currency: str = "USD",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    acc = get_account_owned(db, account_id, current_user.id)
    if acc is None:
        raise HTTPException(status_code=404, detail="Account not found")

    cur = currency.upper()

    stmt = select(func.coalesce(func.sum(AccountEntry.amount), 0)).where(
        AccountEntry.account_id == acc.id,
        AccountEntry.currency == cur,
    )
    bal = db.execute(stmt).scalar_one()

    return BalanceResponse(account_id=acc.id, currency=cur, balance=float(bal))
