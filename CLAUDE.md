# CLAUDE.md — Second-Degree Connection Explorer

## Project overview

COM-480 Data Visualization (EPFL), Milestone 2.
Three-person team: Ahmed Chaouachi (346447), Shin Urech (327245), Joyti Goel (325374).

**Core idea**: pick a user, see their direct friends (bridges), then reveal friends-of-friends (candidates) ranked by shared traits (country, age group — and eventually music taste). Uses the Last.fm UK friendship graph dataset.

Deadline: **Milestone 2 — Friday 17 April 2026, 5 pm** (already past — submit late)
Next: **Milestone 3 — Friday 29 May 2026, 5 pm** (80% of grade)

## File map

```
docs/                        ← THE LIVE SITE — edit these four files
  index.html                 ← page structure only, no logic
  styles.css                 ← all visual design, dark navy theme + tooltip styles
  app.js                     ← D3.js force graph + all rendering logic
  data.js                    ← window.MILESTONE_DATA — the full dataset bundle

data/                        ← raw data files (used by Python build scripts)
  network, UsersData_anonymized, ArtistsMap, Tags
  (ArtistTags — 246 MB — excluded from git via .gitignore)

src/                         ← Python processing utilities
  music_data_utils.py
  second_degree_utils.py
  build_music_eda_notebook.py

milestone1/                  ← M1 submission + EDA notebooks
milestone2/                  ← M2 deliverables
  project_brief.html         ← printable two-page brief
  milestone2_answers.txt     ← written answers to all M2 questions
  analysis.ipynb
  sketches/*.svg
  build_milestone2_assets.py ← regenerates milestone2/data/analysis_summary.json
  build_github_pages_site.py ← copies data into docs/data.js

specs/                       ← assignment PDFs
  Milestone_2.pdf, Milestone_3.pdf
```

## Tech stack

- Pure HTML/CSS + **D3.js v7** (loaded via CDN) — no build step, no bundler, no framework
- All network graph: D3 force simulation (forceSimulation, forceRadial, forceManyBody, forceLink, drag)
- All charts: D3 join pattern with enter/update/exit transitions
- Data embedded as JS global (window.MILESTONE_DATA) in data.js
- Deployed as static site via GitHub Pages from `/docs`

## Design system

Dark navy theme. Key CSS variables:

| Variable | Value | Use |
|---|---|---|
| `--bg` | `#091321` | page background |
| `--teal` | `#1aa89d` | primary accent, eyebrows |
| `--sky` | `#6b8ec6` | first-degree nodes (bridges) |
| `--coral` | `#ef8c59` | second-degree nodes |
| `--amber` | `#d9a64f` | highlights |
| `--violet` | `#7a70d8` | bridge-active / path color |

Typography: headings use `"Iowan Old Style"` (serif), body uses `"Avenir Next"` (sans-serif).

Palette constants in app.js (palette object, top of file) must stay in sync with CSS variables.

## D3 graph architecture (docs/app.js)

### Key global state

```js
const gfx = {
  svg: null,           // persistent D3 SVG selection
  simulation: null,    // d3.forceSimulation
  linkSel: null,       // D3 selection of <line> elements
  nodeSel: null,       // D3 selection of <circle> elements
  rootLabelSel: null,  // D3 selection of ego label text
};
```

`gfx.svg` is set to `null` when the user changes the ego user, triggering a fresh reveal animation.

### Graph render flow

`renderGraph(selectedCase, visibleCandidates, selectedCandidate)`:
1. Builds node array: ego (group 0, fixed at center), bridges (group 1, radial force R1=170), candidates (group 2, radial force R2=325)
2. Builds link array from `selectedCase.edges`
3. Creates SVG once; subsequent calls update with D3 join transitions
4. Runs `d3.forceSimulation` with `forceRadial` forces to keep ring structure while adding physics
5. Staggered entrance: ego appears at delay 0, bridges at 220ms+, candidates at 500ms+
6. `applyHighlight(hover)` — called by hover/click events and graphController — updates colors, radii, opacity via D3 attr calls

### Interaction context

`buildInteractionContext(hover, candidateData, focusedBridgeId, selectedCandidate, rootId)` — returns:
- `{ mode: "none" | "bridge" | "candidate" | "selected", bridgeIds: Set, candidateIds: Set, ... }`

### Chart functions

`renderD3Bars(selector, items, color)` — animated bar chart with enter/update/exit transitions
`renderGroupedCaseChart(selector, items, activeUserId)` — grouped bars for case comparison

## Data shape (window.MILESTONE_DATA)

```js
{
  overview: { users, connected_users, unique_friendships, median_degree, median_second_degree },
  quality_checks: { missing_age, missing_country, missing_gender, users_with_degree_zero },
  summaries: { degree, second_degree, shared_both_second_degree, friend_country_match_rate_mean, friend_age_group_match_rate_mean },
  insights: [ string ],
  caveats: [ string ],
  charts: {
    degree_histogram, second_degree_histogram, shared_attribute_histogram,
    age_group_distribution, top_countries, prototype_case_sizes
  },
  prototype: {
    cases: [{
      user: { id, country, age_group, gender, degree, second_degree_count },
      summary: { direct_friends, second_degree_count, same_both_second_degree },
      direct_friends: [{ id, country, age_group, degree, bridge_count, label }],
      candidates: [{ id, country, age_group, degree, mutual_friends, mutual_friend_ids, shared_attribute_count, same_country, same_age_group, score, label }],
      edges: [{ source, target }]
    }],
    supported_filters: [{ id, label }],
    planned_filters: [{ id, label, note }]
  }
}
```

## Improvement goals (for Milestone 3)

1. **Music-taste filter** — once ArtistTags is joined to user listening data, add tag-overlap as a third filter dimension. The filter slot is already in the UI, labeled "coming soon".
2. **Animated progressive reveal mode** — self-running guided tour: A → B → C with annotation overlays. Useful for the M3 screencast.
3. **Force-layout improvements** — community-aware coloring (Louvain), better node label placement, collision padding.
4. **Atlas charts** — richer encodings: connected dot plot for case comparison, density curve for degree distribution.
5. **Mobile** — touch-friendly drag, smaller graph canvas at <600px.
6. **Process book** — max 8 pages, must reference M1 sketches and explain design changes. Due 29 May 2026.
7. **Screencast** — 2 min demo video. Due 29 May 2026.
8. **README** — already updated with setup + deploy instructions.

## Milestone 3 grading weights

Visualization 35% · Technical Implementation 15% · Screencast 25% · Process book 25%

## Rules for editing the site

- Always edit `docs/` — not `milestone2/prototype/` (those are design screenshots only)
- After significant changes, bump the cache-bust version in index.html (`?v=onehop11` → next)
- Keep the dark navy aesthetic and existing CSS variable system
- Do not restructure data.js — its shape is fixed by the Python build scripts
- Do not add a backend — the site must remain fully static
- D3.js is the required library for M3; it is already loaded via CDN in index.html
- No other external libraries without asking first
