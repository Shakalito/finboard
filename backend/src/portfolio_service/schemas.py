from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class AccountRead(BaseModel):
    id: UUID
    user_id: UUID
    base_currency: str
    type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountCreate(BaseModel):
    base_currency: str = Field(default="USD", min_length=3, max_length=10)


class DepositRequest(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=10)


class BalanceResponse(BaseModel):
    account_id: UUID
    currency: str
    balance: float

class PlaceOrderRequest(BaseModel):
    account_id: UUID
    listing_id: UUID
    side: str = Field(..., pattern="^(BUY|SELL)$")
    qty: float = Field(..., gt=0)


class OrderRead(BaseModel):
    id: UUID
    account_id: UUID
    instrument_id: UUID
    side: str
    type: str
    qty: float
    limit_price: float | None
    state: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True