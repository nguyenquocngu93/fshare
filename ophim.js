(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_stable_plugin';
  const TORRSERVER = 'http://gren439.tsarea.tv:8880';

  function start() {
    if (window[PLUGIN_KEY]) return;
    window[PLUGIN_KEY] = true;

    let current = null;

    console.log('[Lampa] Torrentio STABLE started');

    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        current = e.data || {};

        waitForContainer(addButton);
      }
    });

    // 🧠 đợi UI render xong
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

    // 🔧 thêm nút (luôn reset)
    function addButton(container) {
      $('.torrentio-stable').remove();

      const btn = $('<div class="full-start__button selector torrentio-stable">')
        .text('🔎 Torrentio')
        .on('hover:enter', open);

      container.append(btn);
    }

    function open() {
      if (!current || !current.id) {
        Lampa.Noty.show('Không có TMDB ID');
        return;
      }

      const isTV = !!current.name;

      if (isTV) {
        chooseSeason();
      } else {
        loadStreams('movie');
      }
    }

    // ===== TV =====
    function chooseSeason() {
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
        onSelect: (item) => chooseEpisode(item.season)
      });
    }

    function chooseEpisode(season) {
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
        onSelect: (item) => loadStreams('series', item.season, item.episode)
      });
    }

    // ===== LOAD =====
    function loadStreams(type, season, episode) {
      let url = '';

      if (type === 'movie') {
        url = `https://torrentio.strem.fun/sort=qualitysize/stream/movie/tmdb:${current.id}.json`;
      } else {
        url = `https://torrentio.strem.fun/sort=qualitysize/stream/series/tmdb:${current.id}:${season}:${episode}.json`;
      }

      Lampa.Noty.show('Đang tải...');

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
        title: 'Streams',
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