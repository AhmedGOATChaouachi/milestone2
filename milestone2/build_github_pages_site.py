from __future__ import annotations

from pathlib import Path


# The live site lives in /docs at the repo root.
# GitHub Pages is configured to deploy from main:/docs directly.
# This script is no longer needed for the build pipeline, but is kept
# here as documentation of the earlier multi-step build process.

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "docs"


def main() -> None:
    print(f"The live site is at: {DOCS_DIR}")
    print("Edit docs/index.html, docs/styles.css, docs/app.js, docs/data.js directly.")
    print("GitHub Pages deploys from main:/docs automatically — no build step needed.")


if __name__ == "__main__":
    main()
