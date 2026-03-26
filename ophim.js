(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_tmdb_bearer';
  const TORRSERVER = 'http://gren439e.tsarea.tv:8880';

  // 🔥 TOKEN CỦA BẠN
  const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';

  function start() {
    if (window[PLUGIN_KEY]) return;
    window[PLUGIN_KEY] = true;

    let current = null;

    function getTmdbId(d) {
      return d?.card?.id || d?.movie?.id || d?.id || null;
    }

    function getImdbId(d) {
      return d?.imdb_id || d?.movie?.imdb_id || d?.card?.imdb_id || null;
    }

    // ===== FETCH TMDB =====
    function tmdbFetch(url, callback) {
      $.ajax({
        url: url,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + TMDB_TOKEN,
          'Content-Type': 'application/json'
        },
        success: callback,
        error: function () {
          Lampa.Noty.show('Lỗi TMDB');
        }
      });
    }

    // ===== LISTENER =====
    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        current = e.data || {};
        waitFor(addButton);
      }
    });

    function waitFor(cb) {
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

    function addButton(container) {
      $('.torrentio-stable').remove();

      const btn = $('<div class="full-start__button selector torrentio-stable">')
        .text('🔎 Torrentio')
        .on('hover:enter', open);

      container.append(btn);
    }

    function open() {
      const tmdb = getTmdbId(current);
      const imdb = getImdbId(current);

      const isTV = current.name;

      if (isTV) {
        selectSeason(tmdb, imdb);
      } else {
        loadStreams('movie', tmdb, imdb);
      }
    }

    // ===== SEASON =====
    function selectSeason(tmdb, imdb) {
      if (!tmdb) {
        Lampa.Noty.show('Không có TMDB');
        return;
      }

      const url = `https://api.themoviedb.org/3/tv/${tmdb}?language=vi-VN`;

      Lampa.Noty.show('Đang tải season...');

      tmdbFetch(url, function (res) {
        const seasons = res.seasons
          .filter(s => s.season_number > 0)
          .map(s => ({
            title: `Season ${s.season_number} (${s.episode_count} tập)`,
            season: s.season_number
          }));

        Lampa.Select.show({
          title: 'Chọn Season',
          items: seasons,
          onSelect: (item) => selectEpisode(tmdb, imdb, item.season)
        });
      });
    }

    // ===== EPISODE =====
    function selectEpisode(tmdb, imdb, season) {
      const url = `https://api.themoviedb.org/3/tv/${tmdb}/season/${season}?language=vi-VN`;

      Lampa.Noty.show('Đang tải tập...');

      tmdbFetch(url, function (res) {
        const episodes = res.episodes.map(e => ({
          title: `E${e.episode_number} - ${e.name}`,
          episode: e.episode_number
        }));

        Lampa.Select.show({
          title: 'Season ' + season,
          items: episodes,
          onSelect: (item) =>
            loadStreams('series', tmdb, imdb, season, item.episode)
        });
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
      if (!url) return;

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
        const score = (s) => {
          const t = (s.title || '').toLowerCase();
          if (t.includes('rutor')) return 100;
          if (t.includes('rutracker')) return 90;
          return 0;
        };
        return score(b) - score(a);
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

    // ===== PLAY =====
    function play(item) {
      const name = encodeURIComponent(current.title || current.name || 'video.mkv');

      const url = `${TORRSERVER}/stream/${name}?link=${item.infoHash}&index=${item.fileIdx}&play`;

      Lampa.Player.play({
        url: url
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