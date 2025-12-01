from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func, text

from ..common.db import Base


class WatchlistItem(Base):
    __tablename__ = "watchlists"
    __table_args__ = {"schema": "watchlist"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)
    instrument_id = Column(UUID(as_uuid=True), ForeignKey("refdata.instruments.id"), nullable=False)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("refdata.venues.id"), nullable=True)
    label = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
