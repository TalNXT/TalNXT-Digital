---
name: talnxt-design
description: Build web pages and apps in the TalNXT visual style (IBM Plex Sans + Newsreader serif, blue #1b5fc4 on cool-grey, mega-menu nav, cards, process steps, CTA bands). Use for any TalNXT or TalNXT Digital site, template, landing page or internal web app.
---

# TalNXT design system

Static, no-build HTML/CSS/JS. Calm, corporate, trustworthy: lots of white cards on a cool grey page, a serif headline, one blue accent, a teal "spark" for the Digital sub-brand.

## Stack and structure
- Plain HTML + CSS + classic scripts. No framework, no bundler. Deploys to GitHub Pages.
- CSS load order: `css/tokens.css` -> `css/base.css` -> `css/components.css` -> `css/site.css`. Reuse the copies in `assets/` of this skill instead of rewriting.
- Never hard-code colours, sizes or fonts; use the tokens below.
- JS: `js/config.js` (site name, email, phone, GA id, parent URL), `js/main.js` (nav drawer, dropdown, forms, year), `js/consent.js` (cookie banner; no-op without a GA id).
- Web app: `app/index.html` + `app/css/app.css` + `app/js/{store,ui,views,app}.js`, namespace `window.TND`, hash router, localStorage store with memory fallback.

## Tokens
Colour: `--bg #f4f6fa` page, `--surface #fff` cards, `--ink #14203a` headings, `--text #2b3446` body, `--muted #58657a`, `--line #dbe1ea` borders, `--navy #16223c` dark bands/footer, `--accent #1b5fc4` (primary, links, buttons), `--accent-dark #0e2e63`, `--accent-tint #e4eaf6`, `--accent-on-dark #7fb0f5`, `--spark #12a3b4` (Digital highlight), status `--success #3d7c63 --warning #b8862f --danger #b3574a`.
Capability tones (icon badges): build blue `#1b5fc4`, scale green `#2f8f5b`, transform purple `#7857b0`, advise gold `#b8862f`.
Fonts: body IBM Plex Sans, headings Newsreader (serif), accents Caveat (sparingly). Load from Google Fonts with `display=swap`.
Type: h1 `clamp(26px, 2.2vw + 16px, 34px)`, h3 17px, eyebrow 11px uppercase letter-spaced accent. Spacing scale `--sp-1..8` (4px base). Container 1200px, gutter 56px (shrinks at 1080/760). Nav height 68px. Button radius 4px; cards 8-12px with `--shadow-sm`.
Z-index: nav 100, drawer 150, dropdown 200, modal 300, toast 400, cookie 500.

## Components (class names)
- Layout: `.container`, `.sec`, `.row-flex` (wraps; stacks <=760), `.grid-2/3/4`, `.eyebrow`, `.lead`, `.copy`.
- Buttons: `.btn`, `.btn.accent` (primary), `.btn.ghost-light` (on dark), `.btn.danger`, `.btn.sm`. Text wraps on phones.
- Cards: `.card`, `.icon-badge` + tone, `.badge`, `.ph-img` (image placeholder).
- Header: sticky `.nav` with logo, links, mega-menu dropdown anchored to `.nav-inner`, one `.btn.accent` CTA; hamburger drawer at <=1180px, tap-to-open dropdown, Esc closes.
- Sections: `.hero`, `.page-hero`, `.band` (navy), `.cta-card`/`.cta-band`, `.stats`, `.process` (numbered steps; 2-col <=900, 1-col <=420), `.check-list`, `.group-strip` (parent-company link).
- Forms: `.field`, `.input`, `.field-error`, `.form-status`, `.filter-bar`; validate in JS, `aria-invalid`, errors linked via `aria-describedby`.
- Overlays: `.modal` (focus trap, Esc, restore focus), `.toast`.
- Table: `.table`; at <=760px rows become stacked cards using `data-label` on each `td`.
- Footer: navy, 4 columns collapsing to 1, year via JS, "Cookie settings" link `[data-cookie-settings]`.
- App shell: 240px sidebar (off-canvas drawer <=900px), topbar with menu button, KPI tiles, status bars, mini-lists, detail lists.

## Rules
1. One primary CTA per view; headings serif, everything else Plex.
2. Accessibility: skip link, visible `:focus-visible`, `prefers-reduced-motion`, 44px tap targets on mobile, labels on every input, alt text.
3. Static-site honesty: no features that need a server (search, subscribe, login) unless wired to a real service. Contact forms use `mailto:` or a named third-party endpoint.
4. Cookie consent: Google Consent Mode defaults to denied; load GA only after accept; store the choice in localStorage; always offer a way to reopen settings.
5. Always ship `404.html` (noindex, root-absolute paths, countdown redirect home), `robots.txt`, `sitemap.xml`, favicon.
6. Safe rendering in apps: escape every interpolated value (`esc()`), validate and whitelist imported data, guard CSV export against formula injection (prefix `= + - @` with `'`).
7. Keep header/footer markup identical across pages; change one, change all.

## Responsive lessons (learned the hard way)
- No fixed `min-width` without resetting it on mobile (dropdowns, inputs).
- Flex rows must `flex-wrap`; long button text must wrap.
- Breakpoints: 1180 (nav drawer), 1080, 900 (app sidebar, process), 760 (stack, tables to cards), 560, 420.
- Images need explicit sizes or aspect-ratio; placeholders must not collapse to 1px.
- Test at 360, 390, 768, 1024, 1440: no horizontal scroll, no console errors.

## QA checklist
Every link resolves; nav active state correct; menu opens on touch and keyboard; form errors and success states; modal focus trap; 404 redirect works from a sub-path; consent banner blocks GA until accepted; sitemap lists only real pages; address/phone/email identical everywhere.

## Digital variant
TalNXT Digital reuses this system with the teal `--spark` as secondary accent, logo "TalNXT / DIGITAL" (app: "CONSOLE"), a "Part of TalNXT" group strip linking to the parent, and its own services (Web & Product Engineering, Cloud & DevOps, Data & AI, Digital Experience & Growth).
