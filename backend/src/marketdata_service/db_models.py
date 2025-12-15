from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from ..common.db import Base, TimeframeType


class Ohlcv(Base):
    __tablename__ = "ohlcv"
    __table_args__ = {"schema": "marketdata"}

    instrument_id = Column(UUID(as_uuid=True), ForeignKey("refdata.instruments.id"), primary_key=True)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("refdata.venues.id"), primary_key=True)
    tf = Column(TimeframeType, primary_key=True)  # enum timeframe in DB, string here
    ts = Column(DateTime(timezone=True), primary_key=True)  # UTC

    open = Column(Numeric(18, 8), nullable=False)
    high = Column(Numeric(18, 8), nullable=False)
    low = Column(Numeric(18, 8), nullable=False)
    close = Column(Numeric(18, 8), nullable=False)
    volume = Column(Numeric(28, 8), nullable=True)


class QuoteLatest(Base):
    __tablename__ = "quotes_latest"
    __table_args__ = {"schema": "marketdata"}

    instrument_id = Column(UUID(as_uuid=True), ForeignKey("refdata.instruments.id"), primary_key=True)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("refdata.venues.id"), nullable=True)
    price = Column(Numeric(18, 8), nullable=False)
    ts = Column(DateTime(timezone=True), nullable=False)
