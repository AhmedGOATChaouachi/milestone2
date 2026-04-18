from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from milestone2.build_milestone2_assets import OUTPUT_PATH as MILESTONE2_OUTPUT_PATH, build_payload


OUTPUT_DIR = Path(__file__).resolve().parent / "data"
OUTPUT_PATH = OUTPUT_DIR / "milestone1_summary.json"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if MILESTONE2_OUTPUT_PATH.exists():
        OUTPUT_PATH.write_text(MILESTONE2_OUTPUT_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    else:
        payload = build_payload()
        OUTPUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
