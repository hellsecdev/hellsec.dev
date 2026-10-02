// Google Analytics loads only after the visitor accepts analytics cookies.
// The choice is stored locally; the banner itself lives in scripts.js.
(function () {
  var ID = 'G-1RGPGXH5DK';
  var KEY = 'hellsec-consent';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  var loaded = false;
  window.hellsecLoadAnalytics = function () {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', ID, { anonymize_ip: true });
  };
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) { /* storage blocked: treat as no consent */ }
  if (choice === 'granted') window.hellsecLoadAnalytics();
})();
