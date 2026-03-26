(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_full_menu_pro';

  // ⚡ TORRSERVER
  const TORRSERVER = 'http://gren439e.tsarea.tv:8880';

  // 🔥 TORRENTIO CONFIG (ĐÃ FIX)
  const TORRENTIO = 'https://torrentio.strem.fun/sort=qualitysize|qualityfilter=|exclude=cam|limit=255';

  function start() {
    if (window[PLUGIN_KEY]) return;
    window[PLUGIN_KEY] = true;

    let current = null;

    function getTmdbId(d) {
      return d?.id || d?.card?.id || d?.movie?.id || null;
    }

    function getImdbId(d) {
      return d?.imdb_id || d?.movie?.imdb_id || d?.card?.imdb_id || d?.imdb || null;
    }

    function getCard() {
      return current?.movie || current?.card || current?.data?.movie || current || {};
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

    // ===== OPEN =====
    function open() {
      const card = getCard();
      const tmdb = getTmdbId(card);
      const imdb = getImdbId(card);

      const seasons = getSeasons(card);

      if (seasons.length) {
        Lampa.Select.show({
          title: 'Chọn Season',
          items: seasons,
          onSelect: (item) => {
            if (item.episodes.length) {
              selectEpisodeCard(tmdb, imdb, item);
            } else {
              fallbackEpisode(tmdb, imdb, item.season);
            }
          }
        });
      } else {
        loadStreams('movie', tmdb, imdb);
      }
    }

    // ===== SEASON FROM CARD =====
    function getSeasons(card) {

      if (Array.isArray(card?.seasons) && card.seasons.length) {
        return card.seasons
          .filter(s => s.season_number > 0)
          .map(s => ({
            title: `Season ${s.season_number}${s.episodes?.length ? ` (${s.episodes.length} tập)` : ''}`,
            season: s.season_number,
            episodes: s.episodes || []
          }));
      }

      const total = card?.number_of_seasons || card?.seasons_count;

      if (total) {
        const arr = [];
        for (let i = 1; i <= total; i++) {
          arr.push({
            title: `Season ${i}`,
            season: i,
            episodes: []
          });
        }
        return arr;
      }

      return [];
    }

    // ===== EPISODE FROM CARD =====
    function selectEpisodeCard(tmdb, imdb, seasonObj) {
      const eps = seasonObj.episodes.map(e => ({
        title: `E${e.episode_number} - ${e.name || ''}`,
        episode: e.episode_number
      }));

      Lampa.Select.show({
        title: 'Season ' + seasonObj.season,
        items: eps,
        onSelect: (item) =>
          loadStreams('series', tmdb, imdb, seasonObj.season, item.episode)
      });
    }

    // ===== FALLBACK =====
    function fallbackEpisode(tmdb, imdb, season) {
      const eps = [];

      for (let i = 1; i <= 20; i++) {
        eps.push({ title: 'Episode ' + i, episode: i });
      }

      Lampa.Select.show({
        title: 'Season ' + season,
        items: eps,
        onSelect: (item) =>
          loadStreams('series', tmdb, imdb, season, item.episode)
      });
    }

    // ===== LOAD STREAM (ĐÃ FIX TORRENTIO) =====
    function loadStreams(type, tmdb, imdb, s, e) {

      let url = '';

      if (type === 'movie') {
        if (tmdb) url = `${TORRENTIO}/stream/movie/tmdb:${tmdb}.json`;
        else if (imdb) url = `${TORRENTIO}/stream/movie/${imdb}.json`;
      } else {
        if (tmdb) url = `${TORRENTIO}/stream/series/tmdb:${tmdb}:${s}:${e}.json`;
        else if (imdb) url = `${TORRENTIO}/stream/series/${imdb}:${s}:${e}.json`;
      }

      if (!url) {
        Lampa.Noty.show('Không có ID hợp lệ');
        return;
      }

      $.get(url, function (res) {
        if (!res?.streams?.length) {
          Lampa.Noty.show('Không có torrent');
          return;
        }

        const items = res.streams.map(s => ({
          title: s.name,
          infoHash: s.infoHash,
          fileIdx: s.fileIdx || 0
        }));

        Lampa.Select.show({
          title: 'Streams',
          items: items,
          onSelect: (i) => play(i)
        });
      });
    }

    // ===== PLAY =====
    function play(item) {
      const name = encodeURIComponent(current?.title || current?.name || 'video');

      const url = `${TORRSERVER}/stream/${name}?link=${item.infoHash}&index=${item.fileIdx}&play`;

      Lampa.Player.play({ url });
    }
  }

  if (window.appready) start();
  else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') start();
    });
  }
})();