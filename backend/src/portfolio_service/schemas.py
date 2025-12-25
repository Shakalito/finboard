from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class AccountRead(BaseModel):
    id: UUID
    user_id: UUID
    base_currency: str
    type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
