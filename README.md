# Puma Labs Website

Static, fast, and secure marketing site with light PWA features (offline cache), accessibility improvements, SEO metadata, and an optional build workflow.

## Features

- Modern static site: HTML + CSS + vanilla JS
- Performance:
  - Minified HTML/CSS/JS during build
  - Service Worker pre-caches core assets for fast repeat visits and basic offline support
- SEO:
  - Canonical and hreflang links
  - Robots directives and sitemap
  - Open Graph and Twitter meta tags
  - Structured data (JSON‑LD: WebSite, Organization, Nav, FAQ, Services)
- Accessibility:
  - Keyboard-friendly navigation, “Skip to content” link
  - Screen‑reader labels for form fields
  - Reduced‑motion support
- Contact form:
  - Submits JSON to an external endpoint
  - Honeypot anti‑bot field
- Optional CI/CD:
  - GitHub Actions builds and deploys to GitHub Pages

## Tech Stack

- Node.js (for the build step)
- html-minifier-terser (HTML minification)
- esbuild (CSS/JS minification)
- Service Worker + Web App Manifest for PWA flavor

## Prerequisites

- Node.js 18+ (recommended Node 20+)
- npm

## Getting Started (Local)

1) Install dependencies
