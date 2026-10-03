# Vendored third-party files

Served from this site so the Content Security Policy can stay limited to our own origin.

| Path | Upstream | License | Local changes |
| --- | --- | --- | --- |
| `open-nagish/open-nagish.min.js` | [open-nagish](https://github.com/leon2589/open-nagish) 1.1.5, `dist/open-nagish.min.js` from npm | MIT, see `open-nagish/LICENSE` | The two OpenDyslexic font URLs point to `/assets/vendor/open-dyslexic/` instead of cdn.jsdelivr.net. |
| `open-dyslexic/*.woff` | [OpenDyslexic](https://github.com/antijingoist/open-dyslexic) via npm `open-dyslexic` 1.0.3 | Bitstream Vera license, see `open-dyslexic/LICENSE.txt` | None. |

To update open-nagish: download the new `dist/open-nagish.min.js` from npm, re-apply the font URL change, check the theme in `assets/accessibility.js` still matches its class names, and bump the `?v=` query in every page.
