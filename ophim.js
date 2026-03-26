(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_pro_plugin';
  const TORRSERVER = 'http://gren439.tsarea.tv:8880';

  function start() {
    if (window[PLUGIN_KEY]) return;
    window[PLUGIN_KEY] = true;

    let current = null;

    console.log('[Lampa] Torrentio PRO started');

    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        current = e.data || {};
        setTimeout(addButton, 300);
      }
    });

    function addButton() {
      if (!$('.torrentio-pro').length) {
        const btn = $('<div class="full-start__button selector torrentio-pro">')
          .text('🔎 Torrentio')
          .on('hover:enter', handleClick);

        $('.full-start-new__buttons').append(btn);
      }
    }

    function handleClick() {
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

    // ===== TV FLOW =====
    function chooseSeason() {
      let seasons = current.seasons || [];

      if (!seasons.length) {
        Lampa.Noty.show('Không có season');
        return;
      }

      Lampa.Select.show({
        title: 'Chọn Season',
        items: seasons.map(s => ({
          title: 'Season ' + s.season_number,
          season: s.season_number
        })),
        onSelect: function (item) {
          chooseEpisode(item.season);
        }
      });
    }

    function chooseEpisode(season) {
      let seasonData = current.seasons.find(s => s.season_number === season);

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
        onSelect: function (item) {
          loadStreams('series', item.season, item.episode);
        }
      });
    }

    // ===== LOAD TORRENT =====
    function loadStreams(type, season, episode) {
      let url = '';

      if (type === 'movie') {
        url = `https://torrentio.strem.fun/sort=qualitysize/stream/movie/tmdb:${current.id}.json`;
      } else {
        url = `https://torrentio.strem.fun/sort=qualitysize/stream/series/tmdb:${current.id}:${season}:${episode}.json`;
      }

      Lampa.Noty.show('Đang tải torrent...');

      $.get(url, function (res) {
        if (!res || !res.streams || !res.streams.length) {
          Lampa.Noty.show('Không có torrent');
          return;
        }

        showStreams(res.streams);
      }).fail(function () {
        Lampa.Noty.show('Lỗi Torrentio');
      });
    }

    // ===== HIỂN THỊ LIST =====
    function showStreams(streams) {
      let items = streams.map(function (s) {
        let title = s.title || 'No name';

        // parse size + seed
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
        onSelect: function (item) {
          play(item.url);
        }
      });
    }

    // ===== PLAY =====
    function play(magnet) {
      if (!magnet) {
        Lampa.Noty.show('Link lỗi');
        return;
      }

      const url = `${TORRSERVER}/stream?link=${encodeURIComponent(magnet)}`;

      console.log('Play:', url);

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