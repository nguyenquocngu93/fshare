(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_button_plugin';

  function start() {
    if (window[PLUGIN_KEY]) return;
    window[PLUGIN_KEY] = true;

    console.log('[Lampa] Torrentio plugin started');

    // Lắng nghe khi mở card phim
    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        try {
          const data = e.data || {};

          // Lấy ID phim
          const tmdb_id = data.id;
          const imdb_id = data.imdb_id;

          console.log('TMDB:', tmdb_id, 'IMDB:', imdb_id);

          // Tạo nút
          const button = $('<div class="full-start__button selector">')
            .text('🔎 Torrentio')
            .on('hover:enter', function () {
              // Ưu tiên imdb, nếu không có thì dùng tmdb
              let url = '';

              if (imdb_id) {
                url = `https://torrentio.strem.fun/sort=qualitysize/stream/movie/${imdb_id}.json`;
              } else if (tmdb_id) {
                url = `https://torrentio.strem.fun/sort=qualitysize/stream/movie/tmdb:${tmdb_id}.json`;
              }

              if (url) {
                window.open(url, '_blank');
              } else {
                Lampa.Noty.show('Không tìm thấy ID phim');
              }
            });

          // Gắn nút vào UI
          $('.full-start-new__buttons').append(button);
        } catch (err) {
          console.log('Torrentio error:', err);
        }
      }
    });
  }

  if (window.appready) {
    start();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') start();
    });
  }
})();