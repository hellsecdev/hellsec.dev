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
    '  background: linear-gradient(145deg, #8a6eff 0%, #6d4aff 52%, #5b3fd4 100%) !important;',
    '  border: 3px solid rgba(255, 255, 255, 0.94) !important;',
    '  box-shadow: 0 6px 22px rgba(20, 9, 69, 0.35), 0 0 26px rgba(109, 74, 255, 0.45) !important;',
    '}',
    '.anid-trigger:hover, .anid-trigger:focus-visible {',
    '  box-shadow: 0 8px 28px rgba(20, 9, 69, 0.4), 0 0 34px rgba(109, 74, 255, 0.6) !important;',
    '}',
    '.anid-trigger:focus-visible { outline-color: #6d4aff !important; }',
    '.anid-panel { border-radius: 22px !important; box-shadow: 0 30px 80px rgba(20, 9, 69, 0.28) !important; }',
    '.anid-panel-header {',
    '  background: radial-gradient(120% 140% at 100% 0%, rgba(109, 74, 255, 0.55), transparent 60%), #140945 !important;',
    '  border-bottom: 1px solid rgba(185, 166, 255, 0.25) !important;',
    '}',
    '.anid-panel-title, .anid-lang-select { color: #faf8ff !important; }',
    '.anid-lang-select { background: rgba(250, 248, 255, 0.08) !important; border-color: rgba(250, 248, 255, 0.3) !important; }',
    '.anid-lang-select option { color: #140945 !important; }',
    '.anid-close-btn {',
    '  background: rgba(185, 166, 255, 0.16) !important;',
    '  color: #d6cbff !important;',
    '  border: 1px solid rgba(185, 166, 255, 0.4) !important;',
    '}',
    '.anid-close-btn:hover, .anid-close-btn:focus-visible {',
    '  background: rgba(185, 166, 255, 0.28) !important;',
    '}',
    '.anid-panel-footer .anid-reset-btn {',
    '  background: #6d4aff !important; border-color: #6d4aff !important; color: #ffffff !important; border-radius: 999px !important;',
    '}',
    '.anid-panel-footer .anid-reset-btn:hover, .anid-panel-footer .anid-reset-btn:focus-visible { background: #5b3fd4 !important; border-color: #5b3fd4 !important; }',
    '.anid-category-header { color: #140945 !important; }',
    '.anid-btn { border-radius: 999px !important; }',
    '.anid-btn.anid-active, .anid-btn:hover, .anid-btn:focus-visible {',
    '  background: #6d4aff !important; border-color: #6d4aff !important; color: #ffffff !important;',
    '}',
    '.anid-toggle input:checked + .anid-toggle-slider { background: #6d4aff !important; }',
    '.anid-slider { background: rgba(20, 9, 69, 0.14) !important; }',
    '.anid-slider::-webkit-slider-thumb { background: #6d4aff !important; box-shadow: 0 0 0 4px rgba(109, 74, 255, 0.18) !important; }',
    '.anid-slider::-moz-range-thumb { background: #6d4aff !important; box-shadow: 0 0 0 4px rgba(109, 74, 255, 0.18) !important; }',
    '.anid-slider:focus-visible { outline: 2px solid #6d4aff !important; }',
    '.anid-category-header:focus-visible, .anid-btn:focus-visible, .anid-lang-select:focus-visible,',
    '.anid-toggle input:focus-visible + .anid-toggle-slider { outline: 2px solid #6d4aff !important; outline-offset: 2px !important; }',
    '@media (max-width: 768px) {',
    '  .anid-trigger {',
    '    width: 44px !important; height: 44px !important;',
    '    bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;',
    '    left: calc(20px + env(safe-area-inset-left, 0px)) !important;',
    '    right: auto !important; top: auto !important;',
    '    border-width: 2px !important; border-radius: 50% !important;',
    '    box-shadow: 0 2px 10px rgba(20, 9, 69, 0.35), 0 0 14px rgba(109, 74, 255, 0.35) !important;',
    '  }',
    '  .anid-trigger:hover, .anid-trigger:focus-visible { transform: none !important; }',
    '  .anid-trigger svg { width: 20px !important; height: 20px !important; }',
    '  .anid-trigger[aria-expanded="true"]::after { font-size: 18px !important; }',
    // The panel is full screen on phones: square corners, real viewport height,
    // and room under "Reset all" so the floating close button does not cover it.
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
