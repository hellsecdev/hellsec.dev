# Web fonts

Self-hosted so pages never depend on Google Fonts at build or run time, and the Content Security Policy can keep `font-src 'self'`.

- **Inter** (body), **Manrope** (headings), **Heebo** (Hebrew). All three are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/).
- Files are the WOFF2 subsets served by Google Fonts for
  `family=Inter:wght@400;500;600&family=Manrope:wght@700;800&family=Heebo:wght@400;500;600;700;800`.
- `fonts.css` declares them with `unicode-range`, so a browser only downloads the scripts a page uses.

To change weights or families, download the new CSS and WOFF2 files from Google Fonts (with a modern browser user agent), replace them here, and update the preload links in the page heads.
