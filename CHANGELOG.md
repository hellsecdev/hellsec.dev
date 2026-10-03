# Changelog

Notable changes to hellsec.dev. Newest first. Commit history has the details.

## 2026-10-04 – Accessibility toolbar and statement

- Accessibility toolbar on every page: open-nagish 1.1.5 (MIT), the same toolbar as stageofstars.com, restyled in the HellSec palette and served from this site together with the OpenDyslexic font. All 32 controls checked under the site CSP.
- Accessibility statement in EN/RU/HE (`/accessibility/`): standard (SI 5568 AA, WCAG), what is implemented, toolbar guide, known limitations, how it was checked, coordinator contact. Linked from the footer and the toolbar.
- "Skip to content" and other in-page links now move keyboard focus, not only the scroll position.
- Privacy policy explains that toolbar preferences stay in the browser.
- Fonts are committed to `assets/fonts/` and linked directly. The build used to download them from Google Fonts; when that silently failed in CI, pages linked to Google Fonts, the CSP blocked them and the live site fell back to system fonts. The build now fails if a page references Google Fonts.

## 2026-10-03 – Cleanup and cookie settings

- About 37 KB of unreachable CSS removed from `style.css` (rules for retired sections and the dark theme); all pages verified pixel-identical before and after.
- Unused assets removed: old partner logos and full-size team avatar sources (schema now points to the 480 px versions).
- Footer "Cookie settings" reopens the consent banner on every page; declining removes Google Analytics cookies. Privacy policy updated in EN/RU/HE.
- Scenario pages: "what the owner could see" shown as numbered cards.
- AI Center demo "Ready" badge darkened to meet 4.5:1 contrast.

## 2026-10-03 – Repository hygiene and docs

- Build no longer publishes repository files: `README.md`, `package.json`, `build.mjs`, `scripts/` and similar are excluded from `dist/`.
- Editor settings (`.idea/`) removed from the repository and ignored.
- README rewritten: structure, workflow, conventions, tests, deployment and security headers.
- `npm test` runs the copy checks; `npm run sync:chrome` syncs nav and footer.
- This file renamed from `lastupdate.md`.

## 2026-10-02 – About page, privacy and hardening

- About page in EN/RU/HE with principles and team.
- Google Analytics loads only after cookie consent; privacy policy describes analytics and cookies.
- `security.txt` points to hellsec.dev with a one-year expiry.
- No inline scripts, so a strict Content Security Policy works; security headers and HSTS are set in Cloudflare, CAA records added.
- Dark theme removed. App icons generated from the original logo. AI Center and scenario pages aligned with the new design.

## 2026-10-01 – Positioning

- Home repositioned around secure development and cybersecurity; AI agents, automation, OSINT and AI Center are presented as services.
- AI Center block on home replaced by a short product teaser.
- New social preview images for every language.
- The original HellSec logo is kept everywhere.

## 2026-09-30 – Redesign

- New visual system: Manrope and Inter, brand purple `#6D4AFF`, light layout with dark service cards and closing band.
- Home and service pages rebuilt around concrete outputs, a five-step process, illustrative scenarios and an on-page lead form.
- Copy reviewed in all three languages for consistency and accuracy; navigation and footer unified across pages.

## [2026-01-03] - Initial Optimization & Stability Pass

### Added
- **Google Analytics (GA4):** Integrated tracking ID `G-1RGPGXH5DK` across all pages. Repositioned to be immediately after the opening `<head>` tag per Google recommendations.
- **SEO Meta Tags:** Added `keywords`, `twitter:site`, and `twitter:creator` tags to all language versions.
- **Structured Data (JSON-LD):** Added `Person` entities for team members within the `Organization` schema to improve search appearance.
- **Form Validation UX:** Added visual feedback for invalid form fields (red borders and a subtle shake animation).
- **404 Page Enhancement:** Added a language selector and unified the styling with the main site.

### Changed
- **Heading Hierarchy (SEO/A11y):** Fixed skipping heading levels (changed `h1` -> `h2` and `h3` -> `h2` where appropriate) to comply with accessibility standards and improve SEO.
- **Service Worker Strategy:** Replaced the caching Service Worker with a "Self-Destruct/Killer" script in `build.mjs` to resolve persistent white-screen and redirect loops caused by aggressive or corrupted caching.
- **Progressive Enhancement:** Modified `.fade-in` CSS to be visible by default. Elements are now hidden via JS only when the page is ready to animate, preventing invisible content if JavaScript fails to load.

### Fixed
- **White Screen Bug:** Addressed the issue where users saw a blank page on initial load by unregistering old Service Workers and implementing a force-reload mechanism in the new `sw.js`.
- **JS Stability:** Wrapped the Neural Network canvas initialization in a `try-catch` block to ensure that any potential graphics errors don't block the rest of the site's functionality.
- **HTML Validation:** Cleaned up HTML syntax and structure across all files to pass `html-validator` checks..
