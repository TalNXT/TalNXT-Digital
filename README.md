# TalNXT Digital

Starter website and demo web app for TalNXT Digital, built from the `talnxt-design` skill (`skills/talnxt-design/` (copy to `.claude/skills/` to enable it in Claude Code)). Static HTML/CSS/JS, no build step.

## Run locally
`python -m http.server 8000` then open http://localhost:8000/ (site) and /app/ (console).

## Replace before launch
- Domain: `robots.txt`, `sitemap.xml`, add a `CNAME` file.
- `js/config.js`: email, phone, Google Analytics ID (banner stays off while empty), parent URL.
- Logo (`img/favicon.svg`), hero art (`img/hero.svg`) and all placeholder copy.
- Add a privacy policy page and link it from the footer and cookie banner.

## Notes
- Header and footer are duplicated on every page; edit all pages together.
- The contact form opens the visitor's email client (`mailto:`); wire to a form service for real submissions.
- `/app/` is a demo console: data lives only in the browser (localStorage), with JSON backup/import and CSV export. It has no login or server; do not store real client data in it. Add a backend before real use.
- Deploy: copy `deploy.yml.example` to `.github/workflows/deploy.yml`, push to `main`, and set Pages > Source: GitHub Actions.
