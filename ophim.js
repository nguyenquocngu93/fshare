(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_fix_play_season';
  const TORRSERVER = 'http://gren439e.tsarea.tv:8880';

  function start() {
    if (window[PLUGIN_KEY]) return;
    window[PLUGIN_KEY] = true;

    let current = null;

    console.log('[Lampa] FIX PLAY + SEASON started');

    // ===== GET ID =====
    function getTmdbId(d) {
      return d?.card?.id || d?.movie?.id || d?.id || null;
    }

    function getImdbId(d) {
      return d?.imdb_id || d?.movie?.imdb_id || d?.card?.imdb_id || null;
    }

    // ===== LISTENER =====
    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        current = e.data || {};
        waitForContainer(addButton);
      }
    });

    function waitForContainer(cb) {
      let t = 0;
      const i = setInterval(() => {
        const c = $('.full-start-new__buttons');
        if (c.length) {
          clearInterval(i);
          cb(c);
        }
        if (++t > 10) clearInterval(i);
      }, 100);
    }

    // ===== UI (KHÔNG ĐỤNG) =====
    function addButton(container) {
      $('.torrentio-stable').remove();

      const btn = $('<div class="full-start__button selector torrentio-stable">')
        .text('🔎 Torrentio')
        .on('hover:enter', open);

      container.append(btn);
    }

    // ===== CLICK =====
    function open() {
      const tmdb = getTmdbId(current);
      const imdb = getImdbId(current);

      const isTV = current.name; // detect đơn giản

      if (isTV) {
        manualSeasonEpisode(tmdb, imdb);
      } else {
        loadStreams('movie', tmdb, imdb);
      }
    }

    // ===== CHỌN SEASON / EP =====
    function manualSeasonEpisode(tmdb, imdb) {

      // menu chọn season 1→20
      let seasons = [];
      for (let i = 1; i <= 20; i++) {
        seasons.push({ title: 'Season ' + i, value: i });
      }

      Lampa.Select.show({
        title: 'Chọn Season',
        items: seasons,
        onSelect: function (s) {

          let episodes = [];
          for (let i = 1; i <= 50; i++) {
            episodes.push({ title: 'Episode ' + i, value: i });
          }

          Lampa.Select.show({
            title: 'Season ' + s.value,
            items: episodes,
            onSelect: function (e) {
              loadStreams('series', tmdb, imdb, s.value, e.value);
            }
          });
        }
      });
    }

    // ===== LOAD =====
    function loadStreams(type, tmdb, imdb, season, episode) {

      let url_tmdb = '';
      let url_imdb = '';

      if (type === 'movie') {
        if (tmdb)
          url_tmdb = `https://torrentio.strem.fun/sort=qualitysize/stream/movie/tmdb:${tmdb}.json`;
        if (imdb)
          url_imdb = `https://torrentio.strem.fun/sort=qualitysize/stream/movie/${imdb}.json`;
      } else {
        if (tmdb)
          url_tmdb = `https://torrentio.strem.fun/sort=qualitysize/stream/series/tmdb:${tmdb}:${season}:${episode}.json`;
        if (imdb)
          url_imdb = `https://torrentio.strem.fun/sort=qualitysize/stream/series/${imdb}:${season}:${episode}.json`;
      }

      Lampa.Noty.show('Đang tải torrent...');

      if (url_tmdb) {
        $.get(url_tmdb, function (res) {
          if (res?.streams?.length) {
            showStreams(res.streams);
          } else {
            tryImdb(url_imdb);
          }
        }).fail(() => tryImdb(url_imdb));
      } else {
        tryImdb(url_imdb);
      }
    }

    function tryImdb(url) {
      if (!url) {
        Lampa.Noty.show('Không có torrent');
        return;
      }

      $.get(url, function (res) {
        if (!res?.streams?.length) {
          Lampa.Noty.show('Không có torrent');
          return;
        }
        showStreams(res.streams);
      });
    }

    // ===== LIST =====
    function showStreams(streams) {

      streams.sort((a, b) => {
        const s = (x) => {
          const t = (x.title || '').toLowerCase();
          if (t.includes('rutor')) return 100;
          if (t.includes('rutracker')) return 90;
          return 0;
        };
        return s(b) - s(a);
      });

      const items = streams.map(s => {
        let title = s.title || '';

        let size = (title.match(/💾\s([^|]+)/) || [])[1] || '';
        let seed = (title.match(/👤\s(\d+)/) || [])[1] || '';

        return {
          title: s.name || 'Torrent',
          subtitle: `${size} | 👤 ${seed}`,
          infoHash: s.infoHash,
          fileIdx: s.fileIdx || 0
        };
      });

      Lampa.Select.show({
        title: 'Streams',
        items: items,
        onSelect: (item) => play(item)
      });
    }

    // ===== PLAY CHUẨN TORRSERVER =====
    function play(item) {
      if (!item?.infoHash) {
        Lampa.Noty.show('Không có hash');
        return;
      }

      const name = encodeURIComponent(current.title || current.name || 'video.mkv');

      const url = `${TORRSERVER}/stream/${name}?link=${item.infoHash}&index=${item.fileIdx}&play`;

      console.log('PLAY:', url);

      Lampa.Player.play({
        url: url,
        title: current.title || current.name
      });
    }
  }

  if (window.appready) start();
  else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') start();
    });
  }
})();