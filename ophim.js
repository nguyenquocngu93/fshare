/*
@name KK Plugin
@version 1.0.0
@author NguyenQuocNgu
@description Loader for kkcore.js and kkui.js
*/

(function() {
  if (window.__kkplugin_loader__) return;
  window.__kkplugin_loader__ = true;

  var scripts = [
    'https://nguyenquocngu93.github.io/fshare/kkcore.js',
    'https://nguyenquocngu93.github.io/fshare/kkui.js'
  ];

  function loadScript(index) {
    if (index >= scripts.length) {
      console.log('KK Plugin: load xong toàn bộ');
      return;
    }

    var src = scripts[index];

    if (document.querySelector('script[src="' + src + '"]')) {
      loadScript(index + 1);
      return;
    }

    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = function() {
      loadScript(index + 1);
    };
    script.onerror = function() {
      console.error('KK Plugin: không load được ' + src);
    };

    document.head.appendChild(script);
  }

  loadScript(0);
})();