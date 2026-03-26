(function () {
  'use strict';

  const PLUGIN_KEY = 'torrentio_full_menu_pro';
  const TORRSERVER = 'http://gren439e.tsarea.tv:8880';

  const TMDB_TOKEN = 'YOUR_TOKEN_HERE';

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

    function tmdbFetch(url, ok, fail) {
      $.ajax({
        url: url,
        headers: {
          Authorization: 'Bearer ' + TMDB_TOKEN
        },
        success: ok,
        error: fail || function () {
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

    // ===== 🧠 DATA RIÊNG CỦA BẠN =====
    function getCustomSeasons() {
      // 👉 BẠN TỰ GÁN DATA Ở ĐÂY
      return null;

      /*
      return [
        { season: 1, episodes: 10 },
        { season: 2, episodes: 8 }
      ];
      */
    }

    // ===== CLICK =====
    function open() {
      const tmdb = getTmdbId(current);
      const imdb = getImdbId(current);

      const isTV = current?.seasons || current?.name;

      if (isTV) {
        // ƯU TIÊN DATA CỦA BẠN
        const custom = getCustomSeasons();

        if (custom) {
          selectSeasonCustom(tmdb, imdb, custom);
        } else if (current?.seasons?.length) {
          selectSeasonFromLampa(tmdb, imdb);
        } else {
          selectSeasonTMDB(tmdb, imdb);
        }
      } else {
        loadStreams('movie', tmdb, imdb);
      }
    }

    // ===== 🟢 CUSTOM =====
    function selectSeasonCustom(tmdb, imdb, data) {
      const seasons = data.map(s => ({
        title: `Season ${s.season} (${s.episodes} tập)`,
        season: s.season,
        count: s.episodes
      }));

      Lampa.Select.show({
        title: 'Chọn Season',
        items: seasons,
        onSelect: (item) =>
          selectEpisodeCustom(tmdb, imdb, item.season, item.count)
      });
    }

    function selectEpisodeCustom(tmdb, imdb, season, count) {
      const eps = [];

      for (let i = 1; i <= count; i++) {
        eps.push({ title: 'Episode ' + i, episode: i });
      }

      Lampa.Select.show({
        title: 'Season ' + season,
        items: eps,
        onSelect: (item) =>
          loadStreams('series', tmdb, imdb, season, item.episode)
      });
    }

    // ===== 🟡 LAMPA =====
    function selectSeasonFromLampa(tmdb, imdb) {
      const seasons = current.seasons
        .filter(s => s.season_number > 0)
        .map(s => ({
          title: `Season ${s.season_number}`,
          season: s.season_number,
          episodes: s.episodes || []
        }));

      Lampa.Select.show({
        title: 'Chọn Season',
        items: seasons,
        onSelect: (item) => {
          if (item.episodes.length) {
            selectEpisodeFromLampa(tmdb, imdb, item);
          } else {
            selectSeasonTMDB(tmdb, imdb);
          }
        }
      });
    }

    function selectEpisodeFromLampa(tmdb, imdb, seasonObj) {
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

    // ===== 🔵 TMDB =====
    function selectSeasonTMDB(tmdb, imdb) {

      if (!tmdb) return fallbackSeason(tmdb, imdb);

      const url = `https://api.themoviedb.org/3/tv/${tmdb}`;

      tmdbFetch(url, function (res) {

        if (!res?.seasons) return fallbackSeason(tmdb, imdb);

        const seasons = res.seasons
          .filter(s => s.season_number > 0)
          .map(s => ({
            title: `Season ${s.season_number}`,
            season: s.season_number
          }));

        Lampa.Select.show({
          title: 'Chọn Season',
          items: seasons,
          onSelect: (item) =>
            selectEpisodeTMDB(tmdb, imdb, item.season)
        });

      }, () => fallbackSeason(tmdb, imdb));
    }

    function selectEpisodeTMDB(tmdb, imdb, season) {
      const url = `https://api.themoviedb.org/3/tv/${tmdb}/season/${season}`;

      tmdbFetch(url, function (res) {

        if (!res?.episodes) return fallbackEpisode(tmdb, imdb, season);

        const eps = res.episodes.map(e => ({
          title: `E${e.episode_number} - ${e.name}`,
          episode: e.episode_number
        }));

        Lampa.Select.show({
          title: 'Season ' + season,
          items: eps,
          onSelect: (item) =>
            loadStreams('series', tmdb, imdb, season, item.episode)
        });

      }, () => fallbackEpisode(tmdb, imdb, season));
    }

    // ===== 🔴 FALLBACK =====
    function fallbackSeason(tmdb, imdb) {
      const seasons = [];

      for (let i = 1; i <= 5; i++) {
        seasons.push({ title: 'Season ' + i, season: i });
      }

      Lampa.Select.show({
        title: 'Season (fallback)',
        items: seasons,
        onSelect: (item) =>
          fallbackEpisode(tmdb, imdb, item.season)
      });
    }

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

    // ===== LOAD =====
    function loadStreams(type, tmdb, imdb, s, e) {

      let url = '';

      if (type === 'movie') {
        url = tmdb
          ? `https://torrentio.strem.fun/stream/movie/tmdb:${tmdb}.json`
          : `https://torrentio.strem.fun/stream/movie/${imdb}.json`;
      } else {
        url = tmdb
          ? `https://torrentio.strem.fun/stream/series/tmdb:${tmdb}:${s}:${e}.json`
          : `https://torrentio.strem.fun/stream/series/${imdb}:${s}:${e}.json`;
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

    function play(item) {
      const name = encodeURIComponent(current.title || current.name || 'video');

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