from __future__ import annotations

from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func, text

from ..common.db import Base


class Account(Base):
    __tablename__ = "accounts"
    __table_args__ = {"schema": "portfolio"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)

    base_currency = Column(String(10), nullable=False, server_default=text("'USD'"))
    type = Column(String(20), nullable=False, server_default=text("'PAPER'"))

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class AccountEntry(Base):
    __tablename__ = "account_entries"
    __table_args__ = {"schema": "portfolio"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    account_id = Column(UUID(as_uuid=True), ForeignKey("portfolio.accounts.id"), nullable=False)

    ts = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    currency = Column(String(10), nullable=False)
    amount = Column(Numeric(18, 8), nullable=False)
    type = Column(String(30), nullable=False)
    ref_id = Column(UUID(as_uuid=True), nullable=True)


class Position(Base):
    __tablename__ = "positions"
    __table_args__ = {"schema": "portfolio"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    account_id = Column(UUID(as_uuid=True), ForeignKey("portfolio.accounts.id"), nullable=False)
    instrument_id = Column(UUID(as_uuid=True), ForeignKey("refdata.instruments.id"), nullable=False)

    quantity = Column(Numeric(28, 10), nullable=False, server_default=text("0"))
    avg_price = Column(Numeric(18, 8), nullable=False, server_default=text("0"))


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {"schema": "portfolio"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    account_id = Column(UUID(as_uuid=True), ForeignKey("portfolio.accounts.id"), nullable=False)
    instrument_id = Column(UUID(as_uuid=True), ForeignKey("refdata.instruments.id"), nullable=False)

    side = Column(String(4), nullable=False)
    type = Column(String(10), nullable=False, server_default=text("'MARKET'"))

    qty = Column(Numeric(28, 10), nullable=False)
    limit_price = Column(Numeric(18, 8), nullable=True)

    state = Column(String(12), nullable=False, server_default=text("'NEW'"))

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Execution(Base):
    __tablename__ = "executions"
    __table_args__ = {"schema": "portfolio"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    order_id = Column(UUID(as_uuid=True), ForeignKey("portfolio.orders.id"), nullable=False)

    price = Column(Numeric(18, 8), nullable=False)
    qty = Column(Numeric(28, 10), nullable=False)

    fee = Column(Numeric(18, 8), nullable=False, server_default=text("0"))
    fee_currency = Column(String(10), nullable=True)

    executed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
