from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROTOTYPE_DIR = ROOT / "prototype"
SITE_ROOT = ROOT / "github_pages_site"
DOCS_DIR = SITE_ROOT / "docs"
FILES_TO_COPY = ("index.html", "styles.css", "app.js", "data.js")


def build_site_bundle() -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    for existing in DOCS_DIR.iterdir():
        if existing.is_dir():
            shutil.rmtree(existing)
        else:
            existing.unlink()

    for name in FILES_TO_COPY:
        source = PROTOTYPE_DIR / name
        if not source.exists():
            raise FileNotFoundError(f"Missing prototype asset: {source}")
        shutil.copy2(source, DOCS_DIR / name)

    (DOCS_DIR / ".nojekyll").write_text("", encoding="utf-8")


if __name__ == "__main__":
    build_site_bundle()
    print(f"GitHub Pages bundle ready in {DOCS_DIR}")
