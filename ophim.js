(function() {
  if (window.__kkplugin_loader__) return;
  window.__kkplugin_loader__ = true;

  function loadText(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          callback(null, xhr.responseText);
        } else {
          callback(new Error('Không tải được: ' + url));
        }
      }
    };
    xhr.send();
  }

  loadText('https://nguyenquocngu93.github.io/fshare/kkcore.js', function(err, core) {
    if (err) return console.error(err);

    loadText('https://nguyenquocngu93.github.io/fshare/kkui.js', function(err2, ui) {
      if (err2) return console.error(err2);

      try {
        eval(core + '\n//# sourceURL=kkcore.js');
        eval(ui + '\n//# sourceURL=kkui.js');
        console.log('KK Plugin: load xong toàn bộ');
      } catch (e) {
        console.error('KK Plugin: lỗi khi thực thi', e);
      }
    });
  });
})();