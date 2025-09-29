// Build script for Puma Labs static site
// - Copies project to ./dist
// - Minifies CSS/JS/HTML
// - Updates sitemap <lastmod> to today's date
// - Generates sw.js in dist with a fresh cache name and full precache list

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
