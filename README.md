# Puma Labs Website

Статичный маркетинговый сайт с лёгкими PWA-функциями (офлайн-кеш), упором на производительность, доступность и SEO.

## Возможности
- Чистый стек: HTML + CSS + vanilla JS
- Оптимизация производительности: минификация HTML/CSS/JS, сервис-воркер с pre-cache
- SEO и соцсети: канонические ссылки, Open Graph/Twitter карты, sitemap, robots
- Улучшенная доступность: «Skip to content», фокус-трапы, aria-метки, поддержка reduced motion
- Контактная форма: отправка JSON на внешний endpoint + honeypot-поле
- CI/CD (опционально): сборка и деплой через GitHub Actions на GitHub Pages

## Технологии
- Node.js (скрипт сборки)
- esbuild (минификация CSS/JS)
- html-minifier-terser (минификация HTML)
- Service Worker + Web App Manifest

## Требования
- Node.js 18+ (рекомендовано 20+)
- npm

## Быстрый старт
1. Установить зависимости: `npm install`
2. Запустить сборку статики: `npm run build`
3. Проверить итоговую директорию: `dist/`

## Полезные скрипты
- `npm run build` — выполнить сборку в `dist/`
- `npm run validate:html` — прогнать HTML-валидатор по содержимому `dist/`
- `npm test` — заглушка для статического проекта
