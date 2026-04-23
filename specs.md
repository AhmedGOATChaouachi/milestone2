# Project Specs — Second-Degree Connection Explorer

## Course
COM-480 Data Visualization, EPFL
Team: Ahmed Chaouachi (346447), Shin Urech (327245), Joyti Goel (325374)

## Deadlines
- Milestone 3: Friday 29 May 2026, 17:00 — 80% of grade

## Grading (M3)
| Component | Weight |
|---|---|
| Visualization | 35% |
| Technical Implementation | 15% |
| Screencast (2 min) | 25% |
| Process book (max 8 pages) | 25% |

## Live site
- **URL**: GitHub Pages served from `/docs` on `main` branch
- **Open locally**: `open docs/index.html` from repo root
- **Stack**: Pure HTML/CSS + D3.js v7 (CDN), no build step

## Repo layout
```
docs/               ← LIVE SITE — the only files that matter for deployment
  index.html        ← page structure + nav
  styles.css        ← dark navy theme, CSS variables, fonts (DM Serif / DM Sans)
  app.js            ← D3 force graph, all rendering logic
  data.js           ← window.MILESTONE_DATA bundle

data/               ← raw datasets (never edit)
  network           ← friendship edge list
  UsersData_anonymized
  ArtistsMap
  Tags
  ArtistTags        ← 246 MB, gitignored — download from Zenodo

src/                ← Python processing utilities
  music_data_utils.py
  second_degree_utils.py

milestone1/         ← M1 submission + EDA notebooks
milestone2/         ← M2 deliverables, build scripts, design history, sketches
  build_milestone2_assets.py  ← regenerates milestone2/data/analysis_summary.json
  build_github_pages_site.py  ← legacy helper
  data/analysis_summary.json
  design_history/   ← prototype screenshots (keep for process book)
  sketches/         ← SVG wireframes (keep for process book)

specs/              ← assignment PDFs (Milestone_2.pdf, Milestone_3.pdf)
```

## Design system
Dark navy theme. CSS variables:
- `--bg` `#091321` page background
- `--teal` `#1aa89d` primary accent
- `--sky` `#6b8ec6` first-degree nodes
- `--coral` `#ef8c59` second-degree nodes
- `--amber` `#d9a64f` highlights
- `--violet` `#7a70d8` bridge-active / path

Typography: `DM Serif Display` (headings), `DM Sans` (body) via Google Fonts.
Palette object at top of `app.js` must stay in sync with CSS variables.

## .gitignore rules
```
.DS_Store / **/.DS_Store
__pycache__/ *.pyc
.ipynb_checkpoints/
graphify-out/
data/ArtistTags        ← 246 MB
```

## Workflow: update the site
1. Edit `docs/app.js`, `docs/styles.css`, `docs/index.html` directly
2. Bump cache-bust version in `index.html` (`?v=v2` → `?v=v3`, etc.)
3. `git add docs/ && git commit && git push` — GitHub Pages auto-deploys

## Workflow: regenerate data
```bash
python3 milestone2/build_milestone2_assets.py   # → milestone2/data/analysis_summary.json
# then manually sync into docs/data.js
```
Requires Python 3.10+, pandas, networkx.

## M3 remaining work
1. Music-taste filter (ArtistTags join → tag-overlap score)
2. Animated storytelling / guided tour mode
3. Force-layout improvements (Louvain community coloring, collision padding)
4. Atlas charts (connected dot plot, density curve)
5. Mobile touch support (<600px)
6. Process book (8 pages max, reference M1 sketches)
7. Screencast (2 min demo)
