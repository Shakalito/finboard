from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .db_models import PriceAlert
from .schemas import AlertCondition


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def evaluate_alert(alert: PriceAlert, last_price: float | None) -> bool:
    if last_price is None:
        return False

    if alert.condition == AlertCondition.ABOVE:
        return last_price >= float(alert.target_price)
    if alert.condition == AlertCondition.BELOW:
        return last_price <= float(alert.target_price)

    return False


def run_alert_evaluator(db: Session) -> dict:

    alerts = db.execute(
        select(PriceAlert).where(PriceAlert.is_active.is_(True))
    ).scalars().all()

    if not alerts:
        return {"checked": 0, "triggered": 0, "skipped_no_quote": 0}

    listing_ids = sorted({a.listing_id for a in alerts})

    from ..marketdata_service.service import fetch_quotes_batch

    quotes = fetch_quotes_batch(db=db, listing_ids=listing_ids)

    # quotes: dict[UUID, QuoteResponse | None] and errors dict[UUID, str]
    results = quotes["results"]
    errors = quotes["errors"]

    triggered = 0
    skipped_no_quote = 0
    now = utc_now()

    for a in alerts:
        q = results.get(a.listing_id)
        if q is None or q.get("price") is None:
            skipped_no_quote += 1
            continue

        price = float(q["price"])
        if evaluate_alert(a, price):
            db.execute(
                update(PriceAlert)
                .where(PriceAlert.id == a.id, PriceAlert.is_active.is_(True))
                .values(
                    is_active=False,
                    last_triggered_at=now,
                    updated_at=now,
                )
            )
            triggered += 1

    db.commit()

    return {
        "checked": len(alerts),
        "triggered": triggered,
        "skipped_no_quote": skipped_no_quote,
        "errors": {str(k): v for k, v in errors.items()},
    }
