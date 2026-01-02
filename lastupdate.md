# Project Updates Log

This file tracks all changes, improvements, and bug fixes performed by the AI agent.

## [2026-01-03] - Initial Optimization & Stability Pass

### Added
- **Google Analytics (GA4):** Integrated tracking ID `G-N35F3SLLG6` across all pages (`index.html`, `ru/index.html`, `he/index.html`, `404.html`, `privacy.html`).
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
- **HTML Validation:** Cleaned up HTML syntax and structure across all files to pass `html-validator` checks.
