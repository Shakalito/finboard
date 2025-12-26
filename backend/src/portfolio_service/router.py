from __future__ import annotations
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..common.db import SessionLocal
from ..auth_service.router import get_current_user
from ..auth_service.db_models import User

from ..refdata_service.db_models import Listing, Instrument, Venue
from ..marketdata_service.external_finnhub import FinnhubClient

from .db_models import Account, AccountEntry, Order, Position
from .schemas import AccountRead, AccountCreate, DepositRequest, BalanceResponse, PlaceOrderRequest, OrderRead

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


def get_balance_value(db: Session, account_id: UUID, currency: str) -> float:
    stmt = select(func.coalesce(func.sum(AccountEntry.amount), 0)).where(
        AccountEntry.account_id == account_id,
        AccountEntry.currency == currency,
    )
    bal = db.execute(stmt).scalar_one()
    return float(bal)


def get_instrument_by_listing(db: Session, listing_id: UUID) -> Instrument | None:
    stmt = (
        select(Instrument)
        .join(Listing, Listing.instrument_id == Instrument.id)
        .where(Listing.id == listing_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_listing_with_joins(db: Session, listing_id: UUID):
    stmt = (
        select(Listing, Instrument, Venue)
        .join(Instrument, Listing.instrument_id == Instrument.id)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(Listing.id == listing_id)
    )
    return db.execute(stmt).one_or_none()


def get_position_qty(db: Session, account_id: UUID, instrument_id: UUID) -> float:
    stmt = select(Position).where(
        Position.account_id == account_id,
        Position.instrument_id == instrument_id,
    )
    pos = db.execute(stmt).scalar_one_or_none()
    if pos is None:
        return 0.0
    return float(pos.quantity)



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


@router.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def place_market_order(
    payload: PlaceOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    acc = get_account_owned(db, payload.account_id, current_user.id)
    if acc is None:
        raise HTTPException(status_code=404, detail="Account not found")

    row = get_listing_with_joins(db, payload.listing_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing, instrument, venue = row

    if not listing.ticker:
        raise HTTPException(status_code=400, detail="Listing has no ticker configured")

    side = payload.side.upper()
    qty = payload.qty

    if side == "BUY":
        client = FinnhubClient()
        q = client.fetch_quote(symbol=listing.ticker)
        price = q.get("c")

        if price is None:
            raise HTTPException(status_code=502, detail="Quote price unavailable")

        price_f = float(price)

        # (multi-currency FX can be done later)
        cash = get_balance_value(db, acc.id, acc.base_currency)
        cost = qty * price_f

        if cash < cost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient cash: need {cost:.2f} {acc.base_currency}, have {cash:.2f} {acc.base_currency}",
            )

    elif side == "SELL":
        pos_qty = get_position_qty(db, acc.id, instrument.id)
        if pos_qty < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient position qty: trying to sell {qty}, have {pos_qty}",
            )
    else:
        raise HTTPException(status_code=400, detail="Invalid side")

    order = Order(
        account_id=acc.id,
        instrument_id=instrument.id,
        side=side,
        type="MARKET",
        qty=qty,
        limit_price=None,
        state="NEW",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return OrderRead.model_validate(order)


@router.get("/orders/me", response_model=list[OrderRead])
def list_my_orders(
    account_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # optional filter by account_id
    stmt = (
        select(Order)
        .join(Account, Order.account_id == Account.id)
        .where(Account.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    if account_id:
        stmt = stmt.where(Order.account_id == account_id)

    rows = db.execute(stmt).scalars().all()
    return [OrderRead.model_validate(x) for x in rows]
