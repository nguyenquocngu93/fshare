(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_stable_plugin';
  const TORRSERVER = 'http://gren439.tsarea.tv:8880';

  function start() {
    if (window[PLUGIN_KEY]) return;
    window[PLUGIN_KEY] = true;

    let current = null;

    console.log('[Lampa] Torrentio STABLE started');

    // ===== FIX TMDB =====
    function getTmdbId(data) {
      if (!data) return null;

      // ưu tiên id chuẩn
      if (data.id && typeof data.id === 'number') {
        return data.id;
      }

      // parse từ url
      if (data.url) {
        const match = data.url.match(/(movie|tv)\/(\d+)/);
        if (match) return parseInt(match[2]);
      }

      // fallback
      return (
        data.tmdb_id ||
        data.movie?.id ||
        data.card?.id ||
        data.data?.id ||
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

      if (!tmdb || isNaN(tmdb)) {
        console.log('BAD TMDB:', current);
        Lampa.Noty.show('TMDB ID lỗi');
        return;
      }

      const isTV = current.seasons && current.seasons.length;

      if (isTV) {
        chooseSeason(tmdb);
      } else {
        loadStreams('movie', tmdb);
      }
    }

    // ===== TV =====
    function chooseSeason(tmdb) {
      if (!current.seasons || !current.seasons.length) {
        Lampa.Noty.show('Không có season');
        return;
      }

      Lampa.Select.show({
        title: 'Season',
        items: current.seasons.map(s => ({
          title: 'Season ' + s.season_number,
          season: s.season_number
        })),
        onSelect: (item) => chooseEpisode(tmdb, item.season)
      });
    }

    function chooseEpisode(tmdb, season) {
      const seasonData = current.seasons.find(s => s.season_number === season);

      if (!seasonData || !seasonData.episodes) {
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
        onSelect: (item) => loadStreams('series', tmdb, item.season, item.episode)
      });
    }

    // ===== LOAD =====
    function loadStreams(type, tmdb, season, episode) {
      let url = '';

      if (type === 'movie') {
        url = `https://torrentio.strem.fun/sort=qualitysize/stream/movie/tmdb:${tmdb}.json`;
      } else {
        url = `https://torrentio.strem.fun/sort=qualitysize/stream/series/tmdb:${tmdb}:${season}:${episode}.json`;
      }

      console.log('TORRENT URL:', url);
      Lampa.Noty.show('Đang tải torrent...');

      $.get(url, function (res) {
        console.log('TORRENT RES:', res);

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
      if (!magnet) {
        Lampa.Noty.show('Link lỗi');
        return;
      }

      const url = `${TORRSERVER}/stream?link=${encodeURIComponent(magnet)}`;

      console.log('PLAY:', url);

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