/**
 * No APK Force v3 for Lampac/Lampa web mode.
 * Prevents Lampa's Android-in-a-browser APK prompt without faking a browser
 * platform. The old browser override made the torrent click guard fire.
 */
(function () {
  'use strict';
  if (window.__lampac_no_apk_force_v3) return;
  window.__lampac_no_apk_force_v3 = true;

  var markers = [
    'how to install lampa on android',
    'mediastationx to run lampa',
    'installing lampa as an apk',
    'go to the @lampa_group',
    'установить lampa на android',
    'установить приложение'
  ];

  function textOf(node) {
    return String(node && (node.innerText || node.textContent) || '').toLowerCase();
  }

  function isApkPrompt(node) {
    var text = textOf(node);
    return text.length > 20 && markers.some(function (marker) { return text.indexOf(marker) !== -1; });
  }

  function modalRoot(node) {
    var current = node;
    while (current && current !== document.body) {
      var className = String(current.className || '');
      if (/(modal|dialog|overlay|popup|account-modal)/i.test(className)) return current;
      current = current.parentElement;
    }
    return node;
  }

  function dismiss(node) {
    var target = modalRoot(node);
    if (!target || !target.parentNode) return;
    target.style.setProperty('display', 'none', 'important');
    target.remove();
    if (document.body) document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    console.log('[NoAPKForce v3] blocked Android APK prompt');
  }

  function sweep(root) {
    var candidates = [];
    if (root && root.nodeType === 1) candidates.push(root);
    if (document.querySelectorAll) {
      candidates = candidates.concat(Array.prototype.slice.call(document.querySelectorAll('.modal,.dialog,[class*="modal"],[class*="dialog"],[class*="overlay"],[class*="popup"],[class*="account"]')));
    }
    candidates.sort(function (a, b) { return textOf(a).length - textOf(b).length; });
    candidates.some(function (node) {
      if (!isApkPrompt(node)) return false;
      dismiss(node);
      return true;
    });
  }

  function bypassAndroidInstallGuard() {
    if (!window.Lampa || !Lampa.Platform || Lampa.Platform.__noApkForceV3) return;
    var originalIs = Lampa.Platform.is;
    if (typeof originalIs !== 'function') return;
    Lampa.Platform.is = function (need) {
      // Lampa blocks a torrent click only when Android UA is present but this
      // platform check is false. Return true only for that exact compatibility
      // check; all other platform checks retain the native result.
      if (need === 'android') return true;
      if (Array.isArray(need) && need.indexOf('android') !== -1) return true;
      return originalIs.call(this, need);
    };
    Lampa.Platform.__noApkForceV3 = true;
  }

  function start() {
    bypassAndroidInstallGuard();
    sweep(document.documentElement);
    if (window.MutationObserver && document.documentElement) {
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          Array.prototype.forEach.call(record.addedNodes, function (node) {
            if (node.nodeType === 1) sweep(node);
          });
        });
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
    var attempts = 0;
    var timer = setInterval(function () {
      bypassAndroidInstallGuard();
      sweep(document.documentElement);
      if (++attempts >= 90) clearInterval(timer);
    }, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
