from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.dialects.postgresql import ENUM

from .config import settings

DATABASE_URL = (
    f"postgresql+psycopg://{settings.db_user}:{settings.db_password}"
    f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
)

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()

TimeframeType = ENUM(
    'm1', 'm5', 'm15', 'h1', 'h4', 'd1', 'w1', 'mo1',
    name='timeframe',
    create_type=False,
)