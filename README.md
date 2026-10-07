# hellsec.dev

Source of [hellsec.dev](https://hellsec.dev/), the website of HellSec, a secure software development and cybersecurity studio.
AI agents, automation, OSINT and the AI Center product are part of our services.

The site is static HTML, CSS and vanilla JavaScript in three languages: English (`/`), Russian (`/ru/`) and Hebrew (`/he/`, right to left).
It is built with a small Node script and deployed to GitHub Pages behind Cloudflare.

> This repository is public. Do not commit credentials, private contact details, client data or local editor settings.

## Structure

| Path | What it is |
| --- | --- |
| `index.html`, `ru/`, `he/` | Home page per language. Each locale mirrors the same pages. |
| `about/` | About page. |
| `services/<slug>/` | Service pages: `product-rd`, `cybersecurity`, `automation`, `osint`, `ai-business-control-center` (AI Center). |
| `cases/` | Illustrative scenarios. They are examples, not client projects, and must stay labelled that way. |
| `privacy.html`, `accessibility/`, `404.html` | Privacy policy, accessibility statement and error page. |
| `style.css` | All styles. Later layers in the file override earlier ones. |
| `scripts.js` | Navigation, forms, FAQ motion, cookie consent banner (reopened by "Cookie settings" in the footer). |
| `assets/analytics.js` | Loads Google Analytics only after the visitor accepts cookies. |
| `assets/accessibility.js` | Configures the accessibility toolbar and restyles it in the HellSec palette. |
| `assets/vendor/` | Third-party files served from this site (open-nagish toolbar, OpenDyslexic font). See `assets/vendor/README.md`. |
| `assets/fonts/` | Self-hosted Inter, Manrope and Heebo (WOFF2) and `fonts.css`. See `assets/fonts/README.md`. |
| `assets/` | Logo, icons, social preview images, team avatars. |
| `.well-known/security.txt` | Security contact ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)). Renew `Expires` before it passes. |
| `sitemap.xml`, `robots.txt`, `manifest.webmanifest` | SEO and app metadata. |
| `build.mjs` | Build script, see below. |
| `scripts/` | Tests and maintenance helpers (not published). |
| `.github/workflows/` | Deploy to GitHub Pages and quality checks. |
| `CHANGELOG.md` | Notable changes, newest first. |

## Working on the site

Requirements: Node 20+, Python 3 for the helper script.

```sh
npm install
npm run build              # writes the site to dist/
python3 -m http.server     # preview the sources at http://localhost:8000
```

The build copies the site into `dist/`, minifies HTML, CSS and JS, updates `<lastmod>` in the sitemap and writes a service worker that clears old caches. It fails if any page links to Google Fonts: fonts are self-hosted in `assets/fonts/` (see the README there).
Repository tooling (`README.md`, `package.json`, `build.mjs`, `scripts/` and similar) is excluded from `dist/` so it is never served on the site.

### Navigation and footer

The nav menu and footer are defined in each locale's home page (`index.html`, `ru/index.html`, `he/index.html`).
After changing them, copy them to every other page of that locale:

```sh
npm run sync:chrome
```

### Conventions

- Every change ships in all three languages. Hebrew pages use `dir="rtl"`; wrap Latin names and prices in `<bdi>` so they read in the right order.
- When adding a page, also add it to `sitemap.xml` with `hreflang` alternates, and give it one `<h1>`.
- When a shared file changes, bump its `?v=` query in every page so browsers fetch the new version: `style.css`, `scripts.js`, `assets/analytics.js`, `assets/accessibility.js`, `assets/fonts/fonts.css`, `assets/vendor/open-nagish/open-nagish.min.js`.
- No inline `<script>` code (JSON-LD data blocks are fine). The Content Security Policy only allows scripts from this site and Google Tag Manager.
- Do not use the em dash character in page copy; the copy test rejects it.
- Do not replace the HellSec logo or other brand assets without the owner's approval.
- Every page loads the accessibility toolbar (`assets/accessibility.js` then `assets/vendor/open-nagish/open-nagish.min.js`, both `defer`, in that order). Keep the accessibility statement (`accessibility/` in all three languages) true to what the site and toolbar do, and update its date after an accessibility review.

## Tests

```sh
npm test                   # copy rules: one H1, scenario disclaimers, AI Center prices, no em dash
npm run test:motion        # FAQ animation and mobile menus, see below
npm run validate:html      # W3C validation of dist/ (run npm run build first)
```

`test:motion` drives a real browser. Install Playwright without saving it, serve the repository and point the test at it:

```sh
npm i --no-save playwright
python3 -m http.server 8879 &
MOTION_URL=http://127.0.0.1:8879 CHROMIUM_PATH=/path/to/chrome npm run test:motion
```

GitHub Actions runs the build, a link check and HTML validation on every push (`.github/workflows/quality.yml`).
The online W3C validator sometimes answers `429 Too Many Requests`; re-run the job when that happens.

## Deployment

Every push to `main` builds the site and publishes `dist/` to GitHub Pages (`.github/workflows/deploy.yml`).

Cloudflare sits in front of GitHub Pages and adds the HTTP security headers, because GitHub Pages cannot set them:
`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS.
If a change needs a new external script, font, image or API host, update the CSP in the Cloudflare response header rule first, otherwise browsers will block it.

## Privacy

- The contact forms send name, contact details and message to the HellSec form endpoint.
- Google Analytics 4 loads only after the visitor accepts cookies; the choice is stored in `localStorage` (`hellsec-consent`) and can be changed with "Cookie settings" in the footer.
- Accessibility toolbar preferences stay in the visitor's browser (`localStorage`, `opennagish_prefs`).

Keep `privacy.html` (and its RU and HE versions) in sync with what the site actually collects.

## License

The website content, design and code are © HellSec, all rights reserved. Third-party files keep their own licenses: see `assets/vendor/README.md` and `assets/fonts/README.md`.

## Contact

- Website: [hellsec.dev](https://hellsec.dev/)
- LinkedIn: [linkedin.com/company/hellsec](https://www.linkedin.com/company/hellsec/)
- GitHub: [github.com/hellsecdev](https://github.com/hellsecdev)
- Security issues: see [security.txt](https://hellsec.dev/.well-known/security.txt)
