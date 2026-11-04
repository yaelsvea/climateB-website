# climateB website

Source of the climateB project website, built with [Hugo](https://gohugo.io) and the
[Clean White](https://github.com/zhaohuabing/hugo-theme-cleanwhite) theme (Apache-2.0 licence,
copy kept in `themes/hugo-theme-cleanwhite/`).

## Where things are

| Folder / file | What it is |
|---|---|
| `config.toml` | Site title, slogan, top menu, header picture |
| `content/` | The pages: `_index.md` is the landing page; `research/`, `data-insights/`, `publications/`, `team/` are pages; `news-events/` holds news and event posts (one `.md` file each) |
| `static/` | Images and files used as they are: `static/img/logo.png` (logo), `static/img/header-placeholder.jpg` (picture behind page titles), `static/css/climateb.css` (own style changes), later the chart pages |
| `themes/hugo-theme-cleanwhite/` | The theme (design). Only touch it to change the look |
| `.github/workflows/hugo.yaml` | Builds the site and publishes it on GitHub Pages after every push to `main` |
| `.Rprofile` | Pins the Hugo version used by RStudio/blogdown |

## Daily workflow (in RStudio)

1. Open the project, run `blogdown::serve_site()` and edit files under `content/`.
2. Check the preview in the Viewer pane.
3. Git tab: tick the changed files, **Commit** (with a short message), then **Push**.
4. After about a minute the live site updates (progress under the **Actions** tab on GitHub).

## Data protection

This repository is public. Never commit the real climateB dataset here. Only the publishable
version of the data belongs in this repo (for example in `static/`).

## Known limits of this starter

- The search icon was removed from the menu; search needs extra setup.
- The picture behind the page titles (`static/img/header-placeholder.jpg`) is a placeholder. Put the
  real picture in `static/img/` and change `header_image` in `config.toml`.
- No social or email icons, sidebars or third-party scripts are loaded (visitor data protection).
- Theme update: the theme is copied into this repo (not linked), so it never changes unexpectedly.
  Two small fixes were made so that links work on `username.github.io/repo/`
  (`layouts/_partials/nav.html`). Further changes: logo in the top bar, sidebars and
  icons removed, full-width text, landing page and news list (`layouts/home.html`,
  `layouts/section.html`).
