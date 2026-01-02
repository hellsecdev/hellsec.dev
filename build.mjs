// Build script for Puma Labs static site
// - копирует проект в dist/
// - минифицирует CSS/JS/HTML
// - обновляет <lastmod> в sitemap
// - локализует Google Fonts и добавляет preload
// - генерирует service worker с версиированным кешем

import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { minify as minifyHtml } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const IGNORES = new Set(['node_modules', 'dist', '.git', '.idea']);

async function rimraf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyRecursive(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORES.has(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function findFilesRecursive(dir, filter = () => true) {
  const result = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && filter(full)) {
        result.push(full);
      }
    }
  }
  return result;
}

async function minifyAssets() {
  const jsEntry = path.join(ROOT, 'scripts.js');
  if (fssync.existsSync(jsEntry)) {
    await esbuild({
      entryPoints: [jsEntry],
      outfile: path.join(DIST, 'scripts.js'),
      minify: true,
      bundle: false,
      sourcemap: false,
      target: ['es2018'],
      logLevel: 'warning'
    });
  }

  const cssEntry = path.join(ROOT, 'style.css');
  if (fssync.existsSync(cssEntry)) {
    await esbuild({
      entryPoints: [cssEntry],
      outfile: path.join(DIST, 'style.css'),
      minify: true,
      bundle: false,
      sourcemap: false,
      logLevel: 'warning'
    });
  }
}

async function minifyHtmlFiles() {
  const htmlFiles = await findFilesRecursive(DIST, (file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const source = await fs.readFile(file, 'utf8');
    const out = await minifyHtml(source, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: false,
      keepClosingSlash: true,
      minifyCSS: true,
      minifyJS: false,
      sortAttributes: true,
      sortClassName: true
    });
    await fs.writeFile(file, out, 'utf8');
  }
}

function todayISO() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function updateSitemap() {
  const sitemapPath = path.join(DIST, 'sitemap.xml');
  if (!fssync.existsSync(sitemapPath)) return;
  const src = await fs.readFile(sitemapPath, 'utf8');
  const out = src.replace(/<lastmod>.*?<\/lastmod>/g, `<lastmod>${todayISO()}</lastmod>`);
  await fs.writeFile(sitemapPath, out, 'utf8');
}

function posixify(p) {
  return p.split(path.sep).join('/');
}

const LINK_TAG_REGEX = /<link\b[^>]*>/gi;
const GOOGLE_FONTS_PRECONNECT_REGEX = /<link\b[^>]*?(?:rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["']|href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["'][^>]*rel=["']preconnect["'])[^>]*>\s*/gi;
const FONT_URL_REGEX = /url\((https:[^)]+\.(?:woff2|woff|ttf|otf))[^)]*\)/g;
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function findGoogleFontsStylesheetTag(html) {
  const matches = html.matchAll(LINK_TAG_REGEX);
  for (const match of matches) {
    const tag = match[0];
    if (!/https:\/\/fonts\.googleapis\.com\//i.test(tag)) continue;
    if (!/rel=["']stylesheet["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/href=["'](https:\/\/fonts\.googleapis\.com\/[^"']+)["']/i);
    if (hrefMatch) {
      return { tag, href: hrefMatch[1] };
    }
  }
  return null;
}

async function extractFontsUrl(html) {
  const found = findGoogleFontsStylesheetTag(html);
  return found ? found.href : null;
}

function mapRemoteFonts(css, mapping) {
  let result = css.replace(/url\((https:\/\/[^)]+)\)/g, (_, url) => {
    const local = mapping[url];
    return local ? `url(${local})` : `url(${url})`;
  });
  result = result.replace(/(@font-face\s*\{)([^}]+)\}/g, (all, start, body) => {
    if (/font-display\s*:/i.test(body)) return all;
    return `${start}${body}font-display: swap;}`;
  });
  return result;
}

async function localizeGoogleFonts() {
  const indexPath = path.join(DIST, 'index.html');
  if (!fssync.existsSync(indexPath)) return;
  const html = await fs.readFile(indexPath, 'utf8');
  const fontsTag = findGoogleFontsStylesheetTag(html);
  if (!fontsTag) return;

  const fontsUrl = await extractFontsUrl(html);
  if (!fontsUrl) return;

  const response = await fetch(fontsUrl, { headers: { 'User-Agent': BROWSER_USER_AGENT } });
  if (!response.ok) return;
  const css = await response.text();

  const fontUrls = Array.from(css.matchAll(FONT_URL_REGEX)).map((match) => match[1]);
  if (!fontUrls.length) return;

  const fontsDir = path.join(DIST, 'assets', 'fonts');
  await ensureDir(fontsDir);

  const mapping = {};
  const preloadHrefs = [];

  for (const url of fontUrls) {
    const filename = new URL(url).pathname.split('/').pop();
    if (!filename) continue;
    const fsPath = path.join(fontsDir, filename);
    const href = `/assets/fonts/${filename}`;
    if (!fssync.existsSync(fsPath)) {
      const fontRes = await fetch(url, { headers: { 'User-Agent': BROWSER_USER_AGENT } });
      if (fontRes.ok) {
        const buffer = Buffer.from(await fontRes.arrayBuffer());
        await fs.writeFile(fsPath, buffer);
      }
    }
    mapping[url] = href;
    preloadHrefs.push(href);
  }

  const localCss = mapRemoteFonts(css, mapping);
  await fs.writeFile(path.join(fontsDir, 'fonts.css'), localCss, 'utf8');

  const htmlFiles = await findFilesRecursive(DIST, (file) => file.endsWith('.html'));
  const preloadTags = Array.from(new Set(preloadHrefs))
    .map((href) => `<link rel="preload" as="font" href="${href}" type="font/woff2" crossorigin>`)
    .join('\n    ');
  const replacement = `${preloadTags}\n    <link href="/assets/fonts/fonts.css" rel="stylesheet">`;

  for (const file of htmlFiles) {
    const content = await fs.readFile(file, 'utf8');
    const targetTag = findGoogleFontsStylesheetTag(content);
    if (!targetTag) continue;
    let updated = content.replace(targetTag.tag, replacement);
    updated = updated.replace(GOOGLE_FONTS_PRECONNECT_REGEX, '');
    await fs.writeFile(file, updated, 'utf8');
  }
}

async function main() {
  console.log('➡️  Cleaning dist...');
  await rimraf(DIST);

  console.log('➡️  Copying project to dist...');
  await copyRecursive(ROOT, DIST);

  console.log('➡️  Minifying CSS/JS...');
  await minifyAssets();

  console.log('➡️  Localizing Google Fonts...');
  await localizeGoogleFonts();

  console.log('➡️  Minifying HTML...');
  await minifyHtmlFiles();

  console.log('➡️  Updating sitemap lastmod...');
  await updateSitemap();

  console.log('➡️  Generating KILLER service worker...');
  
  // Self-destructing Service Worker to clean up old caches and fix white screen loops
  const swSource = `
self.addEventListener('install', () => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Unregister immediately
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      // Force reload all open tabs to get fresh content
      clients.forEach(client => client.navigate(client.url));
    })
  );
});
`.trimStart();

  await fs.writeFile(path.join(DIST, 'sw.js'), swSource, 'utf8');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
