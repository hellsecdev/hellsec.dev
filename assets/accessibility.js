// Accessibility toolbar (open-nagish, vendored in /assets/vendor/open-nagish/).
// This file must load before the library: it sets the config the library reads on start-up
// and restyles the widget's Shadow DOM in the HellSec palette.
(function () {
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  if (['en', 'ru', 'he'].indexOf(lang) === -1) lang = 'en';
  var prefix = lang === 'en' ? '/' : '/' + lang + '/';

  window.OpenNagishConfig = {
    position: 'bottom-left',
    lang: lang,
    bottomOffset: 0,
    mobileBottomOffset: 0,
    statementUrl: prefix + 'accessibility/'
  };

  var HOST_ID = 'opennagish-widget';
  var STYLE_ID = 'hellsec-open-nagish-theme';
  var font = lang === 'he'
    ? '"Heebo", "Inter", system-ui, sans-serif'
    : '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

  var theme = [
    ':host, .anid-trigger, .anid-panel, .anid-panel * { font-family: ' + font + ' !important; }',
    '.anid-trigger {',
    '  background: rgba(14, 15, 28, 0.88) !important;',
    '  color: #c4b5fd !important;',
    '  border: 1px solid rgba(167, 139, 250, 0.42) !important;',
    '  backdrop-filter: blur(16px) !important;',
    '  -webkit-backdrop-filter: blur(16px) !important;',
    '  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 28px rgba(0, 0, 0, 0.55), 0 0 18px rgba(124, 92, 255, 0.22) !important;',
    '  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease !important;',
    '}',
    '.anid-trigger svg { fill: currentColor !important; color: #c4b5fd !important; }',
    '.anid-trigger:hover, .anid-trigger:focus-visible {',
    '  background: rgba(24, 22, 48, 0.96) !important;',
    '  border-color: rgba(196, 181, 253, 0.72) !important;',
    '  color: #ffffff !important;',
    '  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 12px 32px rgba(0, 0, 0, 0.65), 0 0 26px rgba(124, 92, 255, 0.45) !important;',
    '}',
    '.anid-trigger:hover svg, .anid-trigger:focus-visible svg { color: #ffffff !important; }',
    '.anid-trigger:focus-visible { outline: 2px solid #8a6eff !important; outline-offset: 2px !important; }',
    '.anid-panel {',
    '  background: #0b0c18 !important;',
    '  color: #e2e8f0 !important;',
    '  border: 1px solid rgba(167, 139, 250, 0.28) !important;',
    '  border-radius: 22px !important;',
    '  box-shadow: 0 32px 84px rgba(0, 0, 0, 0.75), 0 0 40px rgba(109, 74, 255, 0.18) !important;',
    '}',
    '.anid-panel-body, .anid-panel-footer, .anid-category, .anid-category-body { background: #0b0c18 !important; color: #e2e8f0 !important; }',
    '.anid-panel-footer { border-top: 1px solid rgba(255, 255, 255, 0.08) !important; }',
    '.anid-panel-header {',
    '  background: radial-gradient(120% 140% at 100% 0%, rgba(124, 92, 255, 0.35), transparent 60%), #0f1022 !important;',
    '  border-bottom: 1px solid rgba(167, 139, 250, 0.22) !important;',
    '}',
    '.anid-panel-title, .anid-lang-select { color: #f8f9fc !important; }',
    '.anid-lang-select { background: rgba(255, 255, 255, 0.06) !important; border-color: rgba(255, 255, 255, 0.18) !important; }',
    '.anid-lang-select option { background: #0f1022 !important; color: #f8f9fc !important; }',
    '.anid-close-btn {',
    '  background: rgba(167, 139, 250, 0.14) !important;',
    '  color: #e2e8f0 !important;',
    '  border: 1px solid rgba(167, 139, 250, 0.35) !important;',
    '}',
    '.anid-close-btn:hover, .anid-close-btn:focus-visible {',
    '  background: rgba(167, 139, 250, 0.28) !important;',
    '  color: #ffffff !important;',
    '}',
    '.anid-panel-footer .anid-reset-btn {',
    '  background: linear-gradient(180deg, #7c5cff 0%, #5d36f6 100%) !important; border: 1px solid rgba(196, 181, 253, 0.4) !important; color: #ffffff !important; border-radius: 999px !important;',
    '}',
    '.anid-panel-footer .anid-reset-btn:hover, .anid-panel-footer .anid-reset-btn:focus-visible { background: #8a6eff !important; }',
    '.anid-category-header { color: #f8f9fc !important; background: rgba(255, 255, 255, 0.03) !important; border-color: rgba(255, 255, 255, 0.07) !important; }',
    '.anid-row, .anid-control, .anid-label { color: #cbd5e1 !important; border-color: rgba(255, 255, 255, 0.06) !important; }',
    '.anid-btn { border-radius: 999px !important; background: rgba(255, 255, 255, 0.05) !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; color: #e2e8f0 !important; }',
    '.anid-btn.anid-active, .anid-btn:hover, .anid-btn:focus-visible {',
    '  background: #7c5cff !important; border-color: #a78bfa !important; color: #ffffff !important;',
    '}',
    '.anid-toggle-slider { background: rgba(255, 255, 255, 0.16) !important; }',
    '.anid-toggle input:checked + .anid-toggle-slider { background: #7c5cff !important; }',
    '.anid-slider { background: rgba(255, 255, 255, 0.16) !important; }',
    '.anid-slider::-webkit-slider-thumb { background: #a78bfa !important; box-shadow: 0 0 0 4px rgba(124, 92, 255, 0.25) !important; }',
    '.anid-slider::-moz-range-thumb { background: #a78bfa !important; box-shadow: 0 0 0 4px rgba(124, 92, 255, 0.25) !important; }',
    '.anid-slider:focus-visible { outline: 2px solid #8a6eff !important; }',
    '.anid-panel a { color: #c4b5fd !important; }',
    '.anid-category-header:focus-visible, .anid-btn:focus-visible, .anid-lang-select:focus-visible,',
    '.anid-toggle input:focus-visible + .anid-toggle-slider { outline: 2px solid #8a6eff !important; outline-offset: 2px !important; }',
    '@media (max-width: 768px) {',
    '  .anid-trigger {',
    '    width: 44px !important; height: 44px !important;',
    '    bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;',
    '    left: calc(20px + env(safe-area-inset-left, 0px)) !important;',
    '    right: auto !important; top: auto !important;',
    '    border-width: 1px !important; border-radius: 50% !important;',
    '    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5), 0 0 14px rgba(124, 92, 255, 0.25) !important;',
    '  }',
    '  .anid-trigger:hover, .anid-trigger:focus-visible { transform: none !important; }',
    '  .anid-trigger svg { width: 20px !important; height: 20px !important; }',
    '  .anid-trigger[aria-expanded="true"]::after { font-size: 18px !important; }',
    '  .anid-panel { border-radius: 0 !important; height: 100dvh !important; max-height: 100dvh !important; }',
    '  .anid-panel-footer { padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important; }',
    '}'
  ].join('\n');

  function applyTheme() {
    var host = document.getElementById(HOST_ID);
    var root = host && host.shadowRoot;
    if (!root) return false;
    var style = root.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      root.appendChild(style);
    }
    style.textContent = theme;
    return true;
  }

  // The library creates its host element on DOMContentLoaded; style it as soon as it appears.
  function watch() {
    if (applyTheme()) return;
    var observer = new MutationObserver(function () {
      if (applyTheme()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();
