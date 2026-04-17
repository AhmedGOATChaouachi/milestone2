# Milestone 2

This folder contains the corrected Milestone 2 deliverables for the second-degree connection explorer project.

## Main files

- `project_brief.html`: printable two-page project description aligned with the second-degree connection vision.
- `deep_analysis.ipynb`: executed notebook with deeper analysis focused on first-degree vs second-degree opportunity.
- `prototype/index.html`: functional second-degree explorer prototype with real graph cases and filters.

## Supporting assets

- `data/analysis_summary.json`: processed summary exported from the raw dataset and second-degree analysis pipeline.
- `prototype/data.js`: browser-friendly version of the same processed data.
- `sketches/*.svg`: wireframes for the planned network interaction.

## Build scripts

- `build_milestone2_assets.py`: regenerates the processed milestone data and prototype cases.
- `build_deep_analysis_notebook.py`: regenerates the milestone analysis notebook structure.
- `build_github_pages_site.py`: rebuilds a clean GitHub Pages bundle in `github_pages_site/docs`.

## Share online

If you want a public link for the prototype:

1. Run `python3 milestone2/build_github_pages_site.py` from the project root.
2. Take the folder `milestone2/github_pages_site`.
3. Upload that folder as its own GitHub repository.
4. In GitHub, enable Pages from `main` and `/docs`.

The publish-ready files are here:

- `github_pages_site/docs/index.html`
- `github_pages_site/docs/styles.css`
- `github_pages_site/docs/app.js`
- `github_pages_site/docs/data.js`

## Suggested order

1. Open `project_brief.html` for the milestone write-up.
2. Open `prototype/index.html` for the functional project prototype.
3. Open `deep_analysis.ipynb` for the supporting analysis.
