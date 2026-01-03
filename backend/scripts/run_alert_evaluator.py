from __future__ import annotations

from sqlalchemy.orm import Session

from src.common.db import engine
from src.alerts_service.evaluator import run_alert_evaluator


def main():
    with Session(engine) as db:
        res = run_alert_evaluator(db)
        print("OK")
        print(res)


if __name__ == "__main__":
    main()
