from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from .common.db import SessionLocal
from .auth_service.router import router as auth_router

app = FastAPI(title="Finboard API")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar_one()
    return {"status": "ok", "db": result}

app.include_router(auth_router, prefix="/auth", tags=["auth"])