#!/usr/bin/env python3
"""Copy the nav menu and footer from each locale's home page to every other page of that locale.

Run after editing the nav or footer in index.html, ru/index.html or he/index.html.
"""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOME = {'': 'index.html', 'ru/': 'ru/index.html', 'he/': 'he/index.html'}
NAV = re.compile(r'<div class="nav-menu" id="nav-menu">.*?</div>', re.S)
FOOTER = re.compile(r'<footer.*?</footer>', re.S)


def locale(path):
    return 'ru/' if path.startswith('ru/') else 'he/' if path.startswith('he/') else ''


def main():
    files = subprocess.check_output(['git', '-C', str(ROOT), 'ls-files', '*.html'], text=True).split()
    chrome = {}
    for prefix, home in HOME.items():
        html = (ROOT / home).read_text(encoding='utf-8')
        # Same-page anchors on home must point back to home from other pages.
        absolute = lambda block: re.sub(r'href="#', f'href="/{prefix}#', block)
        chrome[prefix] = (absolute(NAV.search(html).group(0)), absolute(FOOTER.search(html).group(0)))
    changed = 0
    for path in files:
        if path in HOME.values():
            continue
        target = ROOT / path
        html = target.read_text(encoding='utf-8')
        nav, footer = chrome[locale(path)]
        new = NAV.sub(lambda m: nav, html, count=1)
        new = FOOTER.sub(lambda m: footer, new, count=1)
        if new != html:
            target.write_text(new, encoding='utf-8')
            changed += 1
    print(f'synced {changed} pages')


if __name__ == '__main__':
    main()
