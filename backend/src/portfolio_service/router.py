from __future__ import annotations
from uuid import UUID

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, update, desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..common.db import SessionLocal
from ..auth_service.router import get_current_user
from ..auth_service.db_models import User

from ..refdata_service.db_models import Listing, Instrument, Venue
from ..marketdata_service.external_finnhub import FinnhubClient

from .db_models import Account, AccountEntry, Order, Position, Execution
from .schemas import AccountRead, AccountCreate, DepositRequest, BalanceResponse, PlaceOrderRequest, OrderRead, FillOrderRequest, ExecutionRead, PositionRead

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

def get_order_owned(db: Session, order_id: UUID, user_id: UUID) -> Order | None:
    stmt = (
        select(Order)
        .join(Account, Order.account_id == Account.id)
        .where(Order.id == order_id, Account.user_id == user_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_active_listing_for_instrument(db: Session, instrument_id: UUID):
    stmt = (
        select(Listing, Instrument, Venue)
        .join(Instrument, Listing.instrument_id == Instrument.id)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(
            Listing.instrument_id == instrument_id,
            Listing.active.is_(True),
        )
        .order_by(Listing.ticker.asc().nulls_last())
        .limit(1)
    )
    return db.execute(stmt).one_or_none()


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
        .order_by(desc(Order.created_at))
    )
    if account_id:
        stmt = stmt.where(Order.account_id == account_id)

    rows = db.execute(stmt).scalars().all()
    return [OrderRead.model_validate(x) for x in rows]


@router.post("/orders/{order_id}/fill", response_model=ExecutionRead, status_code=status.HTTP_201_CREATED)
def fill_order(
    order_id: UUID,
    payload: FillOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = get_order_owned(db, order_id, current_user.id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.state != "NEW":
        raise HTTPException(status_code=400, detail=f"Order is not fillable (state={order.state})")

    # For now  refdata is NASDAQ-only
    listing_stmt = (
        select(Listing, Venue)
        .join(Venue, Listing.venue_id == Venue.id)
        .where(Listing.instrument_id == order.instrument_id, Listing.active.is_(True))
        .limit(1)
    )
    listing_row = db.execute(listing_stmt).one_or_none()
    if listing_row is None:
        raise HTTPException(status_code=400, detail="No active listing for this instrument")

    listing, venue = listing_row

    if not listing.ticker:
        raise HTTPException(status_code=400, detail="Listing has no ticker configured")

    # quote price
    client = FinnhubClient()
    q = client.fetch_quote(symbol=listing.ticker)
    price = q.get("c")
    if price is None:
        raise HTTPException(status_code=502, detail="Quote price unavailable")

    price_f = float(price)
    qty_f = float(order.qty)
    notional = qty_f * price_f

    # lock-free simple approach; for production you'd want SELECT FOR UPDATE
    acc_stmt = select(Account).where(Account.id == order.account_id)
    acc = db.execute(acc_stmt).scalar_one()

    fee = float(payload.fee or 0)
    fee_cur = (payload.fee_currency or acc.base_currency).upper() if fee > 0 else None

    if order.side == "BUY":
        cash = get_balance_value(db, acc.id, acc.base_currency)
        need = notional + (fee if fee_cur == acc.base_currency else 0.0)
        if cash < need:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient cash to fill: need {need:.2f} {acc.base_currency}, have {cash:.2f} {acc.base_currency}",
            )

        db.add(AccountEntry(
            account_id=acc.id,
            currency=acc.base_currency,
            amount=-notional,
            type="TRADE_CASH",
            ref_id=order.id,
        ))

    elif order.side == "SELL":
        pos_qty = get_position_qty(db, acc.id, order.instrument_id)
        if pos_qty < qty_f:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient position qty to fill: trying to sell {qty_f}, have {pos_qty}",
            )

        db.add(AccountEntry(
            account_id=acc.id,
            currency=acc.base_currency,
            amount=notional,
            type="TRADE_CASH",
            ref_id=order.id,
        ))
    else:
        raise HTTPException(status_code=400, detail="Invalid order side")

    if fee > 0 and fee_cur:
        db.add(AccountEntry(
            account_id=acc.id,
            currency=fee_cur,
            amount=-fee,
            type="TRADE_FEE",
            ref_id=order.id,
        ))

    pos_stmt = select(Position).where(
        Position.account_id == acc.id,
        Position.instrument_id == order.instrument_id,
    )
    pos = db.execute(pos_stmt).scalar_one_or_none()

    if order.side == "BUY":
        if pos is None:
            pos = Position(
                account_id=acc.id,
                instrument_id=order.instrument_id,
                quantity=qty_f,
                avg_price=price_f,
            )
            db.add(pos)
        else:
            old_qty = float(pos.quantity)
            old_avg = float(pos.avg_price)
            new_qty = old_qty + qty_f
            # weighted avg
            new_avg = ((old_qty * old_avg) + (qty_f * price_f)) / new_qty if new_qty != 0 else 0.0
            pos.quantity = new_qty
            pos.avg_price = new_avg

    else:
        if pos is None:
            raise HTTPException(status_code=400, detail="Position missing (cannot sell)")
        old_qty = float(pos.quantity)
        new_qty = old_qty - qty_f
        if new_qty < 0:
            raise HTTPException(status_code=400, detail="Position qty would go negative")
        pos.quantity = new_qty

    exe = Execution(
        order_id=order.id,
        price=price_f,
        qty=qty_f,
        fee=fee,
        fee_currency=fee_cur,
    )
    db.add(exe)

    order.state = "FILLED"

    db.commit()
    db.refresh(exe)

    return ExecutionRead.model_validate(exe)


@router.get("/positions/me", response_model=list[PositionRead])
async def get_my_positions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    acc_stmt = select(Account).where(
        Account.user_id == current_user.id,
        Account.type == "PAPER",
    )
    account = db.execute(acc_stmt).scalar_one_or_none()
    if account is None:
        return []

    pos_stmt = (
        select(Position)
        .where(
            Position.account_id == account.id,
            Position.quantity > 0,
        )
        .order_by(Position.instrument_id.asc())
    )
    positions = db.execute(pos_stmt).scalars().all()
    if not positions:
        return []

    enriched: list[dict] = []
    tickers: list[str] = []
    ticker_to_listing_id: dict[str, UUID] = {}

    for pos in positions:
        qty = float(pos.quantity)
        avg = float(pos.avg_price)

        row = get_active_listing_for_instrument(db, pos.instrument_id)
        if row is None:
            enriched.append(
                {
                    "pos": pos,
                    "qty": qty,
                    "avg": avg,
                    "listing": None,
                    "instrument": None,
                    "venue": None,
                    "ticker": None,
                }
            )
            continue

        listing, instrument, venue = row
        ticker = listing.ticker

        if ticker:
            tickers.append(ticker)
            ticker_to_listing_id[ticker] = listing.id

        enriched.append(
            {
                "pos": pos,
                "qty": qty,
                "avg": avg,
                "listing": listing,
                "instrument": instrument,
                "venue": venue,
                "ticker": ticker,
            }
        )

    client = FinnhubClient()
    quotes_by_ticker = await client.fetch_quotes_many(tickers, concurrency=5) if tickers else {}

    results: list[PositionRead] = []

    for item in enriched:
        pos: Position = item["pos"]
        qty: float = item["qty"]
        avg: float = item["avg"]

        listing: Listing | None = item["listing"]
        instrument: Instrument | None = item["instrument"]
        venue: Venue | None = item["venue"]
        ticker: str | None = item["ticker"]

        last_price: float | None = None
        asof: datetime | None = None

        if ticker:
            q = quotes_by_ticker.get(ticker) or {}
            price = q.get("c")
            ts = q.get("t")

            if price is not None:
                try:
                    last_price = float(price)
                except (TypeError, ValueError):
                    last_price = None

            if ts:
                try:
                    asof = datetime.fromtimestamp(int(ts), tz=timezone.utc)
                except (TypeError, ValueError):
                    asof = None

        market_value = None
        pnl_abs = None
        pnl_pct = None

        if last_price is not None:
            market_value = qty * last_price
            pnl_abs = (last_price - avg) * qty
            pnl_pct = ((last_price / avg) - 1.0) * 100.0 if avg != 0 else None

        listing_id = listing.id if listing is not None else None
        name = instrument.name if instrument is not None else "(unknown instrument)"
        venue_code = venue.code if venue is not None else ""

        results.append(
            PositionRead(
                position_id=pos.id,
                account_id=pos.account_id,
                instrument_id=pos.instrument_id,
                listing_id=listing_id,
                ticker=ticker,
                name=name,
                venue_code=venue_code,
                qty=qty,
                avg_price=avg,
                last_price=last_price,
                market_value=market_value,
                unrealized_pnl_abs=pnl_abs,
                unrealized_pnl_pct=pnl_pct,
                asof=asof,
            )
        )

    return results


@router.get("/executions/me", response_model=list[ExecutionRead])
def get_my_executions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Execution)
        .join(Order, Order.id == Execution.order_id)
        .join(Account, Account.id == Order.account_id)
        .where(Account.user_id == current_user.id)
        .order_by(desc(Execution.executed_at))
    )

    rows = db.execute(stmt).scalars().all()
    return [ExecutionRead.model_validate(r) for r in rows]
