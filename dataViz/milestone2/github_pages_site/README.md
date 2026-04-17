# GitHub Pages Site

This folder is a clean, standalone bundle for publishing the Milestone 2 prototype on GitHub Pages.

## What to upload

Upload this whole folder as its own GitHub repository.

Important:
- keep the `docs/` folder at the repository root
- GitHub Pages should be configured to deploy from `main` and `/docs`

## Refresh the published site after prototype changes

From the main project folder:

```bash
cd /Users/ahmedchaouachi2408icloud.com/Desktop/Ma2/dataViz
python3 milestone2/build_github_pages_site.py
```

That rebuilds `github_pages_site/docs` from the latest prototype files.

## Minimal publish flow

1. Create a new GitHub repository.
2. Upload the contents of this folder into that repository.
3. Open the repo on GitHub.
4. Go to `Settings -> Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select branch `main` and folder `/docs`.
7. Save, then wait for GitHub Pages to publish.

Your public link will look like:

`https://your-username.github.io/your-repo-name/`
