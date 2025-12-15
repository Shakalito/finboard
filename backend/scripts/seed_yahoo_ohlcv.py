from __future__ import annotations

import argparse
from datetime import datetime, timezone
from uuid import UUID
from typing import cast

import yfinance as yf
import numpy as np
import math
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from src.common.config import settings
from src.common.db import engine, TimeframeType

from src.refdata_service.db_models import Listing, Instrument, Venue

from src.marketdata_service.db_models import Ohlcv

def fetch_yahoo_daily(ticker: str, period: str = "2y"):
    df = yf.download(
        tickers=ticker,
        period=period,
        interval="1d",
        auto_adjust=False,
        actions=False,
        progress=False,
        threads=False,
    )

    if df is None or df.empty:
        return None

    if df.index.tz is None:
        df.index = df.index.tz_localize(timezone.utc)
    else:
        df.index = df.index.tz_convert(timezone.utc)
    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--listing-id", required=True, help="UUID z refdata.listings")
    parser.add_argument("--period", default="2y", help="Yahoo period, np. 6mo, 1y, 2y, 5y, max")
    parser.add_argument("--timeframe", default="d1", help="Nasze timeframe, domyślnie d1")
    parser.add_argument("--replace", action="store_true", help="Usuń stare świece przed insertem")
    args = parser.parse_args()

    listing_id = UUID(args.listing_id)
    timeframe = args.timeframe


    with Session(engine) as db:
        stmt = (
            select(Listing, Instrument, Venue)
            .join(Instrument, Listing.instrument_id == Instrument.id)
            .join(Venue, Listing.venue_id == Venue.id)
            .where(Listing.id == listing_id)
        )
        row = db.execute(stmt).one_or_none()
        if row is None:
            raise SystemExit("ERROR: Listing not found in DB.")

        listing, instrument, venue = row

        if not listing.ticker:
            raise SystemExit("ERROR: Listing has no ticker. Set refdata.listings.ticker first.")

        ticker = listing.ticker

        df = fetch_yahoo_daily(ticker=ticker, period=args.period)
        if df is None:
            raise SystemExit(f"ERROR: Yahoo returned no data for ticker={ticker}.")

        if args.replace:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Replacing existing data for {instrument.name} ({timeframe})")
            del_stmt = delete(Ohlcv).where(
                Ohlcv.instrument_id == instrument.id,
                Ohlcv.venue_id == venue.id,
                Ohlcv.tf == timeframe,
            )
            db.execute(del_stmt)


            inserted = 0
            for ts, row in df.iterrows():
                dt = ts.to_pydatetime()

                o = row.get("Open").item()
                h = row.get("High").item()
                l = row.get("Low").item()
                c = row.get("Close").item()
                v = row.get("Volume").item()

                if o is None or h is None or l is None or c is None:
                    continue


                volume_value = None
                if not math.isnan(v):
                    volume_value = v

                bar = Ohlcv(
                    instrument_id=instrument.id,
                    venue_id=venue.id,
                    tf=timeframe,
                    ts=dt,
                    open=o,
                    high=h,
                    low=l,
                    close=c,
                    volume=volume_value,
                )
                db.add(bar)
                inserted += 1

        db.commit()

        print("OK")
        print(f"listing_id:  {listing.id}")
        print(f"ticker:      {ticker}")
        print(f"instrument:  {instrument.id}")
        print(f"venue:       {venue.id}")
        print(f"timeframe:   {timeframe}")
        print(f"rows added:  {inserted}")


if __name__ == "__main__":
    main()
