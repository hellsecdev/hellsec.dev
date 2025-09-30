// Build script for Puma Labs static site
// - Copies project to ./dist
// - Minifies CSS/JS/HTML
// - Updates sitemap <lastmod> to today's date
// - Generates sw.js in dist with a fresh cache name and full precache list
// - Localizes Google Fonts: downloads woff2, generates /assets/fonts/fonts.css, injects preload + local stylesheet

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
  for (const ent of entries) {
    if (IGNORES.has(ent.name)) continue;
    const srcPath = path.join(srcDir, ent.name);
    const destPath = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (ent.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function minifyAssets() {
  // Minify JS
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

  // Minify CSS
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

async function findFilesRecursive(dir, filterFn = () => true) {
  const result = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = await fs.readdir(cur, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
      } else if (ent.isFile()) {
        if (filterFn(full)) result.push(full);
      }
    }
  }
  return result;
}

async function minifyHtmlFiles() {
  const htmlFiles = await findFilesRecursive(DIST, (f) => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const src = await fs.readFile(file, 'utf8');
    const out = await minifyHtml(src, {
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

function todayISODate() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function updateSitemap() {
  const sitemapPath = path.join(DIST, 'sitemap.xml');
  if (!fssync.existsSync(sitemapPath)) return;
  const src = await fs.readFile(sitemapPath, 'utf8');
  const date = todayISODate();
  const out = src.replace(/<lastmod>.*?<\/lastmod>/g, `<lastmod>${date}</lastmod>`);
  await fs.writeFile(sitemapPath, out, 'utf8');
}

function posixify(p) {
  return p.split(path.sep).join('/');
}

// ---------- Local Google Fonts ----------
const GOOGLE_FONTS_LINK = /<link[^>]+href=["']https:\/\/fonts\.googleapis\.com\/[^"']+["'][^>]*>/i;

async function extractFontsUrl(html) {
  const m = html.match(/href=["'](https:\/\/fonts\.googleapis\.com\/[^"']+)["']/i);
  return m ? m[1] : null;
}

function mapRemoteToLocal(css, mapping) {
  let out = css.replace(/url\((https:\/\/[^)]+)\)/g, (_, url) => {
    const local = mapping[url];
    return local ? `url(${local})` : `url(${url})`;
  });
  out = out.replace(/(@font-face\s*\{)([^}]+)\}/g, (all, start, body) => {
    if (/font-display\s*:/i.test(body)) return all;
    return `${start}${body}font-display: swap;}`;
  });
  return out;
}

async function localizeGoogleFonts() {
  const entry = path.join(DIST, 'index.html');
  if (!fssync.existsSync(entry)) return;

  const html = await fs.readFile(entry, 'utf8');
  if (!GOOGLE_FONTS_LINK.test(html)) return;

  const url = await extractFontsUrl(html);
  if (!url) return;

  const res = await fetch(url);
  if (!res.ok) return;
  const css = await res.text();

  const fontUrls = Array.from(css.matchAll(/url\((https:[^)]+\.woff2)[^)"]*\)/g)).map(m => m[1]);
  if (!fontUrls.length) return;

  const fontsDir = path.join(DIST, 'assets', 'fonts');
  await ensureDir(fontsDir);

  const mapping = {};
  const preloads = [];

  for (const fUrl of fontUrls) {
    const u = new URL(fUrl);
    const name = u.pathname.split('/').pop();
    const dest = path.join(fontsDir, name);
    const href = `/assets/fonts/${name}`;
    if (!fssync.existsSync(dest)) {
      const f = await fetch(fUrl);
      if (f.ok) {
        const buf = Buffer.from(await f.arrayBuffer());
        await fs.writeFile(dest, buf);
      }
    }
    mapping[fUrl] = href;
    preloads.push(href);
  }

  const localCss = mapRemoteToLocal(css, mapping);
  await fs.writeFile(path.join(fontsDir, 'fonts.css'), localCss, 'utf8');
// Build script for Puma Labs static site
// - Copies project to ./dist
// - Minifies CSS/JS/HTML
// - Updates sitemap <lastmod> to today's date
// - Generates sw.js in dist with a fresh cache name and full precache list
// - Fetches Google Fonts, stores locally, injects local fonts.css and preload links

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
  for (const ent of entries) {
    if (IGNORES.has(ent.name)) continue;
    const srcPath = path.join(srcDir, ent.name);
    const destPath = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (ent.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function minifyAssets() {
  // Minify JS
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

  // Minify CSS
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

async function findFilesRecursive(dir, filterFn = () => true) {
  const result = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = await fs.readdir(cur, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
      } else if (ent.isFile()) {
        if (filterFn(full)) result.push(full);
      }
    }
  }
  return result;
}

async function minifyHtmlFiles() {
  const htmlFiles = await findFilesRecursive(DIST, (f) => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const src = await fs.readFile(file, 'utf8');
    const out = await minifyHtml(src, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: false,
      keepClosingSlash: true,
      minifyCSS: true,
      minifyJS: false, // keep JSON-LD safe
      sortAttributes: true,
      sortClassName: true
    });
    await fs.writeFile(file, out, 'utf8');
  }
}

// -------- Local Google Fonts to local assets --------
const GOOGLE_FONTS_REGEX = /<link[^>]+href=["']https:\/\/fonts\.googleapis\.com\/[^"']+["'][^>]*>/i;

async function extractGoogleFontsUrl(html) {
  const m = html.match(/href=["'](https:\/\/fonts\.googleapis\.com\/[^"']+)["']/i);
  return m ? m[1] : null;
}

function replaceFontUrlsToLocal(css, mapping) {
  // mapping: remoteUrl -> localPath (/assets/fonts/filename.woff2)
  let out = css.replace(/url\((https:\/\/[^)]+)\)/g, (_, url) => {
    const local = mapping[url];
    return local ? `url(${local})` : `url(${url})`;
  });
  // ensure font-display: swap inside each @font-face
  out = out.replace(/(@font-face\s*\{)([^}]+)\}/g, (all, start, body) => {
    if (/font-display\s*:/i.test(body)) return all;
    return `${start}${body}font-display: swap;}`;
  });
  return out;
}

async function setupLocalFonts() {
  const indexPath = path.join(DIST, 'index.html');
  if (!fssync.existsSync(indexPath)) return;

  const html = await fs.readFile(indexPath, 'utf8');
  if (!GOOGLE_FONTS_REGEX.test(html)) return;

  const fontsUrl = await extractGoogleFontsUrl(html);
  if (!fontsUrl) return;

  const res = await fetch(fontsUrl);
  if (!res.ok) return;
  const css = await res.text();

  // Find all remote font file URLs
  const fontUrls = Array.from(css.matchAll(/url\((https:[^)]+\.woff2)[^)"]*\)/g)).map(m => m[1]);
  if (!fontUrls.length) return;

  const fontsDir = path.join(DIST, 'assets', 'fonts');
  await ensureDir(fontsDir);

  const mapping = {};
  const preloadHrefs = [];

  for (const url of fontUrls) {
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split('/').pop();
    const localFsPath = path.join(fontsDir, filename);
    const localHref = `/assets/fonts/${filename}`;

    if (!fssync.existsSync(localFsPath)) {
      const f = await fetch(url);
      if (f.ok) {
        const buf = await f.arrayBuffer();
        await fs.writeFile(localFsPath, Buffer.from(buf));
      }
    }
    mapping[url] = localHref;
    preloadHrefs.push(localHref);
  }

  // Generate local fonts.css
  const localCss = replaceFontUrlsToLocal(css, mapping);
  await fs.writeFile(path.join(fontsDir, 'fonts.css'), localCss, 'utf8');

  // Replace fonts link in all html files in dist
  const htmlFiles = await findFilesRecursive(DIST, (f) => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const src = await fs.readFile(file, 'utf8');
    if (!GOOGLE_FONTS_REGEX.test(src)) continue;

    const preloads = Array.from(new Set(preloadHrefs))
      .map(h => `<link rel="preload" as="font" href="${h}" type="font/woff2" crossorigin>`)
      .join('\n    ');

    const replacement = `${preloads}
    <link href="/assets/fonts/fonts.css" rel="stylesheet">`;

    const updated = src.replace(GOOGLE_FONTS_REGEX, replacement);
    await fs.writeFile(file, updated, 'utf8');
  }
}

function todayISODate() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function updateSitemap() {
  const sitemapPath = path.join(DIST, 'sitemap.xml');
  if (!fssync.existsSync(sitemapPath)) return;
  const src = await fs.readFile(sitemapPath, 'utf8');
  const date = todayISODate();
  const out = src.replace(/<lastmod>.*?<\/lastmod>/g, `<lastmod>${date}</lastmod>`);
  await fs.writeFile(sitemapPath, out, 'utf8');
}

function posixify(p) {
  return p.split(path.sep).join('/');
}

async function generateServiceWorker(pkgVersion) {
  const allFiles = await findFilesRecursive(DIST, (f) => fssync.statSync(f).isFile());
  // Build a list of public urls (leading slash). Exclude sw.js itself.
  const assets = new Set(['/']);
  for (const abs of allFiles) {
    const rel = posixify(path.relative(DIST, abs));
    if (!rel || rel.startsWith('.')) continue;
    const url = '/' + rel;
    if (url === '/sw.js') continue;
    assets.add(url);
  }

  const timestamp = new Date();
  const ts =
    timestamp.getUTCFullYear().toString() +
    String(timestamp.getUTCMonth() + 1).padStart(2, '0') +
    String(timestamp.getUTCDate()).padStart(2, '0') +
    String(timestamp.getUTCHours()).padStart(2, '0') +
    String(timestamp.getUTCMinutes()).padStart(2, '0');

  const cacheName = `pumalabs-static-${pkgVersion}-${ts}`;

  const swContent = `
const CACHE_NAME = ${JSON.stringify(cacheName)};
const ASSETS = ${JSON.stringify(Array.from(assets).sort(), null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET and same-origin
  try {
    const url = new URL(req.url);
    if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  } catch (_) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const resClone = res.clone();
          if (res.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
`.trimStart();

  await fs.writeFile(path.join(DIST, 'sw.js'), swContent, 'utf8');
}

async function readPkgVersion() {
  const pkgPath = path.join(ROOT, 'package.json');
  const raw = await fs.readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  return pkg.version || '0.0.0';
}

async function main() {
  console.log('➡️  Cleaning dist...');
  await rimraf(DIST);

  console.log('➡️  Copying project to dist...');
  await copyRecursive(ROOT, DIST);

  console.log('➡️  Minifying CSS/JS...');
  await minifyAssets();

  console.log('➡️  Localizing Google Fonts...');
  await setupLocalFonts();

  console.log('➡️  Minifying HTML...');
  await minifyHtmlFiles();

  console.log('➡️  Updating sitemap lastmod...');
  await updateSitemap();

  console.log('➡️  Generating service worker...');
  const version = await readPkgVersion();
  await generateServiceWorker(version);

  console.log('✅ Build complete. Output: dist/');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
  const htmlFiles = await findFilesRecursive(DIST, (f) => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const src = await fs.readFile(file, 'utf8');
    if (!GOOGLE_FONTS_LINK.test(src)) continue;

    const preloadTags = Array.from(new Set(preloads))
      .map(h => `<link rel="preload" as="font" href="${h}" type="font/woff2" crossorigin>`)
      .join('\n    ');

    const replacement = `${preloadTags}
    <link href="/assets/fonts/fonts.css" rel="stylesheet">`;

    const updated = src.replace(GOOGLE_FONTS_LINK, replacement);
    await fs.writeFile(file, updated, 'utf8');
  }
}

// ---------- Service Worker ----------
async function generateServiceWorker(pkgVersion) {
  const allFiles = await findFilesRecursive(DIST, (f) => fssync.statSync(f).isFile());
  const assets = new Set(['/']);
  for (const abs of allFiles) {
    const rel = posixify(path.relative(DIST, abs));
    if (!rel || rel.startsWith('.')) continue;
    const url = '/' + rel;
    if (url === '/sw.js') continue;
    assets.add(url);
  }

  const d = new Date();
  const ts = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}`;
  const cacheName = `pumalabs-static-${pkgVersion}-${ts}`;

  const sw = `
const CACHE_NAME = ${JSON.stringify(cacheName)};
const ASSETS = ${JSON.stringify(Array.from(assets).sort(), null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  try {
    const u = new URL(req.url);
    if (req.method !== 'GET' || u.origin !== self.location.origin) return;
  } catch { return; }
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const clone = res.clone();
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(req, clone)).catch(()=>{});
        return res;
      }).catch(() => req.mode === 'navigate' ? caches.match('/index.html') : undefined);
    })
  );
});
`.trimStart();

  await fs.writeFile(path.join(DIST, 'sw.js'), sw, 'utf8');
}

async function readPkgVersion() {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
  return pkg.version || '0.0.0';
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

  console.log('➡️  Generating service worker...');
  const version = await readPkgVersion();
  await generateServiceWorker(version);

  console.log('✅ Build complete. Output: dist/');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
