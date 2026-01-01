from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from .common.db import SessionLocal
from .auth_service.router import router as auth_router
from .refdata_service.router import router as refdata_router
from .watchlist_service.router import router as watchlist_router
from .marketdata_service.router import router as marketdata_router
from .portfolio_service.router import router as portfolio_router

from fastapi.middleware.cors import CORSMiddleware

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
app.include_router(refdata_router, prefix="/refdata", tags=["refdata"])
app.include_router(watchlist_router, prefix="/watchlist", tags=["watchlist"])
app.include_router(marketdata_router, prefix="/marketdata", tags=["marketdata"])
app.include_router(portfolio_router, prefix="/portfolio", tags=["portfolio"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)