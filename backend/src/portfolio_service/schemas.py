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
