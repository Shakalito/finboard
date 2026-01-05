from __future__ import annotations

import sys
from pathlib import Path
import time
import argparse

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from src.common.db import engine
from src.alerts_service.evaluator import run_alert_evaluator
from sqlalchemy.orm import Session

def main():
    parser = argparse.ArgumentParser(description="Run alert evaluator")
    parser.add_argument("--loop", action="store_true", help="Run continuously in a loop")
    parser.add_argument("--interval", type=int, default=10, help="Interval between runs in seconds (default: 10)")
    args = parser.parse_args()

    if args.loop:
        print(f"Starting alert evaluator in loop mode (interval={args.interval}s). Press Ctrl+C to stop.")
        try:
            while True:
                with Session(engine) as db:
                    res = run_alert_evaluator(db)
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {res}")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStopped by user.")
    else:
        with Session(engine) as db:
            res = run_alert_evaluator(db)
            print("OK")
            print(res)


if __name__ == "__main__":
    main()
