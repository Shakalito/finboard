from sqlalchemy import (
    Column,
    String,
    Boolean,
    Date,
    Time,
    DateTime,
    Numeric,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func, text

from ..common.db import Base


class Instrument(Base):
    __tablename__ = "instruments"
    __table_args__ = {"schema": "refdata"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    type = Column(String, nullable=False)  # in db as an enum, in our case as a string
    name = Column(String(255), nullable=False)
    base_currency = Column(String(10), nullable=False)
    tick_size = Column(Numeric(18, 8), nullable=True)
    lot_size = Column(Numeric(18, 8), nullable=True)
    leverage_max = Column(Numeric(18, 6), nullable=True)
    contract_multiplier = Column(Numeric(18, 6), nullable=True)
    underlying_id = Column(UUID(as_uuid=True), ForeignKey("refdata.instruments.id"), nullable=True)
    active = Column(Boolean, nullable=False, server_default=text("true"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Venue(Base):
    __tablename__ = "venues"
    __table_args__ = {"schema": "refdata"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    timezone = Column(String(50), nullable=False)
    country = Column(String(50), nullable=True)
    mic = Column(String(10), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = {"schema": "refdata"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    instrument_id = Column(UUID(as_uuid=True), ForeignKey("refdata.instruments.id"), nullable=False)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("refdata.venues.id"), nullable=False)
    ticker = Column(String(50), nullable=True)
    isin = Column(String(20), nullable=True)
    currency = Column(String(10), nullable=True)
    quote_currency = Column(String(10), nullable=True)
    market_code = Column(String(50), nullable=True)
    active = Column(Boolean, nullable=False, server_default=text("true"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
