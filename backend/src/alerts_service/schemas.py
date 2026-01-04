from __future__ import annotations

from datetime import datetime
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field

class AlertCondition(str, Enum):
    ABOVE = "ABOVE"
    BELOW = "BELOW"

class AlertCreate(BaseModel):
    listing_id: UUID
    condition: AlertCondition
    target_price: float = Field(..., gt=0)
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$", description="ISO Currency code")


class AlertRead(BaseModel):
    id: UUID
    user_id: UUID
    listing_id: UUID
    condition: AlertCondition
    target_price: float
    currency: str
    is_active: bool
    last_triggered_at: datetime | None
    created_at: datetime
    updated_at: datetime
    ticker: str | None = None
    name: str | None = None
    venue_code: str | None = None

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    is_active: bool
