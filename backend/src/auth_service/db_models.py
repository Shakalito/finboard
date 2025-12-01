from sqlalchemy import Column, String, Boolean, Date, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func, text

from ..common.db import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    birth_date = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    email = Column(String(255), nullable=False, unique=False) # secured by init.sql...
    password_hash = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default=text("false"))
    is_verified = Column(Boolean, nullable=False, server_default=text("true"))
    twofa_enabled = Column(Boolean, nullable=False, server_default=text("false"))
    twofa_secret = Column(String(64), nullable=True)
    timezone = Column(String(50), nullable=False, server_default=text("'Europe/Warsaw'"))
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class UserSession(Base):
    __tablename__ = "user_sessions"
    __table_args__ = {"schema": "auth"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), nullable=False)
    refresh_token_hash = Column(Text, nullable=False)
    user_agent = Column(Text, nullable=True)
    ip = Column(String(64), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
