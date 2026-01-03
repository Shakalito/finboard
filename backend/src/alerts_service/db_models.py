from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func, text

from ..common.db import Base


class PriceAlert(Base):
    __tablename__ = "price_alerts"
    __table_args__ = {"schema": "alerts"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("refdata.listings.id"), nullable=False)

    condition = Column(String(8), nullable=False)
    target_price = Column(Numeric(18, 8), nullable=False)
    currency = Column(String(10), nullable=False, server_default=text("'USD'"))

    is_active = Column(Boolean, nullable=False, server_default=text("true"))
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
