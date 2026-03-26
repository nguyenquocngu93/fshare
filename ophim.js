(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_ultra_plugin';
  const TORRSERVER = 'http://gren439.tsarea.tv:8880';

  function start() {
    if (window[PLUGIN_KEY]) return;
    window[PLUGIN_KEY] = true;

    let current = null;

    console.log('[Lampa] Torrentio ULTRA started');

    // ===== GET TMDB =====
    function getTmdbId(data) {
      if (!data) return null;

      if (data.card?.id) return data.card.id;
      if (data.movie?.id) return data.movie.id;
      if (typeof data.id === 'number') return data.id;

      if (data.url) {
        const match = data.url.match(/(movie|tv)\/(\d+)/);
        if (match) return parseInt(match[2]);
      }

      return null;
    }

    // ===== GET IMDB =====
    function getImdbId(data) {
      return (
        data.imdb_id ||
        data.movie?.imdb_id ||
        data.card?.imdb_id ||
        null
      );
    }

    // ===== LISTENER =====
    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        current = e.data || {};
        waitForContainer(addButton);
      }
    });

    // ===== WAIT UI =====
    function waitForContainer(callback) {
      let tries = 0;

      const interval = setInterval(() => {
        const container = $('.full-start-new__buttons');

        if (container.length) {
          clearInterval(interval);
          callback(container);
        }

        if (++tries > 10) clearInterval(interval);
      }, 100);
    }

    // ===== ADD BUTTON (GIỮ NGUYÊN) =====
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

      const isTV = current.seasons && current.seasons.length;

      if (isTV) {
        if (tmdb) chooseSeason(tmdb, imdb);
        else if (imdb) chooseSeasonImdb(imdb);
        else Lampa.Noty.show('Không có ID');
      } else {
        loadStreamsWithFallback('movie', tmdb, imdb);
      }
    }

    // ===== TV =====
    function chooseSeason(tmdb, imdb) {
      if (!current.seasons?.length) {
        Lampa.Noty.show('Không có season');
        return;
      }

      Lampa.Select.show({
        title: 'Season',
        items: current.seasons.map(s => ({
          title: 'Season ' + s.season_number,
          season: s.season_number
        })),
        onSelect: (item) => chooseEpisode(tmdb, imdb, item.season)
      });
    }

    function chooseEpisode(tmdb, imdb, season) {
      const seasonData = current.seasons.find(s => s.season_number === season);

      if (!seasonData?.episodes) {
        Lampa.Noty.show('Không có episode');
        return;
      }

      Lampa.Select.show({
        title: 'Season ' + season,
        items: seasonData.episodes.map(e => ({
          title: 'E' + e.episode_number + ' - ' + e.name,
          episode: e.episode_number,
          season: season
        })),
        onSelect: (item) =>
          loadStreamsWithFallback('series', tmdb, imdb, item.season, item.episode)
      });
    }

    // ===== LOAD WITH FALLBACK =====
    function loadStreamsWithFallback(type, tmdb, imdb, season, episode) {
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

      // 👉 thử TMDB trước
      if (url_tmdb) {
        console.log('TRY TMDB:', url_tmdb);

        $.get(url_tmdb, function (res) {
          if (res?.streams?.length) {
            console.log('TMDB OK');
            showStreams(res.streams);
          } else {
            console.log('TMDB FAIL → fallback IMDB');
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

      console.log('TRY IMDB:', url);

      $.get(url, function (res) {
        if (!res?.streams?.length) {
          Lampa.Noty.show('Không có torrent');
          return;
        }

        showStreams(res.streams);
      }).fail(() => {
        Lampa.Noty.show('Lỗi Torrentio');
      });
    }

    // ===== LIST =====
    function showStreams(streams) {
      const items = streams.map(s => {
        let title = s.title || '';

        let size = (title.match(/💾\s([^|]+)/) || [])[1] || '';
        let seed = (title.match(/👤\s(\d+)/) || [])[1] || '';

        return {
          title: s.name || 'Torrent',
          subtitle: `${size} | 👤 ${seed}`,
          url: s.url
        };
      });

      Lampa.Select.show({
        title: 'Torrent Streams',
        items: items,
        onSelect: (item) => play(item.url)
      });
    }

    // ===== PLAY =====
    function play(magnet) {
      const url = `${TORRSERVER}/stream?link=${encodeURIComponent(magnet)}`;

      Lampa.Player.play({
        url: url,
        title: current.title || current.name
      });
    }
  }

  if (window.appready) {
    start();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') start();
    });
  }
})();