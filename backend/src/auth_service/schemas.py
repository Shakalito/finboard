from datetime import date
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: EmailStr


class UserRegister(UserBase):
    password: str = Field(min_length=8, max_length=72)
    birth_date: date | None = None
    gender: str | None = None


class UserRead(UserBase):
    id: UUID
    is_active: bool
    is_verified: bool
    timezone: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
