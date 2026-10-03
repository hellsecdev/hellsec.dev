// Build script for HellSec static site
// - копирует проект в dist/
// - минифицирует CSS/JS/HTML
// - обновляет <lastmod> в sitemap
// - проверяет, что страницы используют локальные шрифты из assets/fonts
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
// Only the website is published. Repository tooling and docs stay out of dist/,
// otherwise GitHub Pages would serve them (e.g. /build.mjs, /README.md).
const IGNORES = new Set([
  'node_modules', 'dist', '.git', '.github', '.idea', '.vscode', '.claude',
  'scripts', 'README.md', 'CHANGELOG.md', 'lastupdate.md',
  'package.json', 'package-lock.json', 'build.mjs', '.gitignore'
]);

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

// Fonts live in assets/fonts/. The site CSP blocks Google Fonts, so a page that links
// to them would silently fall back to system fonts; fail the build instead.
async function assertNoRemoteFonts() {
  const htmlFiles = await findFilesRecursive(DIST, (file) => file.endsWith('.html'));
  const offenders = [];
  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf8');
    if (/fonts\.(googleapis|gstatic)\.com/.test(html)) offenders.push(posixify(path.relative(DIST, file)));
  }
  if (offenders.length) {
    throw new Error(`Remote Google Fonts referenced in: ${offenders.join(', ')}. Use /assets/fonts/fonts.css.`);
  }
}

async function main() {
  console.log('➡️  Cleaning dist...');
  await rimraf(DIST);

  console.log('➡️  Copying project to dist...');
  await copyRecursive(ROOT, DIST);

  console.log('➡️  Minifying CSS/JS...');
  await minifyAssets();

  console.log('➡️  Checking pages use self-hosted fonts...');
  await assertNoRemoteFonts();

  console.log('➡️  Minifying HTML...');
  await minifyHtmlFiles();

  console.log('➡️  Updating sitemap lastmod...');
  await updateSitemap();

  console.log('➡️  Generating cleanup service worker...');
  
  // Self-destructing Service Worker to clean up old caches and prevent caching issues
  const swSource = `
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
  // Don't cache anything
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete all caches aggressively
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => {
          return caches.delete(cacheName).catch(() => {});
        }));
      }),
      // Claim all clients immediately
      self.clients.claim(),
      // Unregister this service worker after cleanup
      self.registration.unregister().catch(() => {})
    ]).catch((err) => {
      console.error('Service worker cleanup error:', err);
    })
  );
});

// Don't intercept any fetch events - let browser handle all requests normally
self.addEventListener('fetch', () => {
  // Do nothing - let all requests go to network
});
`.trimStart();

  await fs.writeFile(path.join(DIST, 'sw.js'), swSource, 'utf8');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
