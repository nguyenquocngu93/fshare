(function () {
  'use strict';

  const TORRSERVER = 'http://gren439e.tsarea.tv:8880';

  let current = null;

  // ===== GET ID =====
  function getTmdbId(d) {
    return d?.card?.id || d?.movie?.id || d?.id || null;
  }

  function getImdbId(d) {
    return d?.imdb_id || d?.movie?.imdb_id || null;
  }

  // ===== LẤY SEASON =====
  function getSeasonCount() {
    return current?.card?.number_of_seasons || 1;
  }

  // ===== LẤY EPISODE / SEASON =====
  function getEpisodePerSeason() {
    const totalSeasons = current?.card?.number_of_seasons || 1;
    const totalEpisodes = current?.card?.number_of_episodes || 0;

    if (!totalEpisodes) return 20;

    let avg = Math.ceil(totalEpisodes / totalSeasons);

    // clamp cho hợp lý
    if (avg < 6) avg = 6;
    if (avg > 30) avg = 30;

    return avg;
  }

  // ===== MATCH EP =====
  function matchEpisode(stream, season, episode) {
    const name = (stream.name || '').toLowerCase();

    const s = season.toString().padStart(2, '0');
    const e = episode.toString().padStart(2, '0');

    const patterns = [
      `s${s}e${e}`,
      `s${season}e${episode}`,
      `${season}x${e}`,
      `${season}x${episode}`,
      `e${e}`,
      `episode ${episode}`
    ];

    return patterns.some(p => name.includes(p));
  }

  // ===== SORT =====
  function sortStreams(streams, season, episode) {
    return streams.sort((a, b) => {

      const aMatch = matchEpisode(a, season, episode);
      const bMatch = matchEpisode(b, season, episode);

      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;

      const good = ['rutor', 'rutracker'];

      const aGood = good.some(s => (a.name || '').toLowerCase().includes(s));
      const bGood = good.some(s => (b.name || '').toLowerCase().includes(s));

      if (aGood && !bGood) return -1;
      if (!aGood && bGood) return 1;

      return (b.seeders || 0) - (a.seeders || 0);
    });
  }

  // ===== MENU SEASON =====
  function selectSeason(tmdb, imdb) {
    const total = getSeasonCount();

    const list = [];

    for (let i = 1; i <= total; i++) {
      list.push({
        title: 'Season ' + i,
        season: i
      });
    }

    Lampa.Select.show({
      title: 'Chọn Season',
      items: list,
      onSelect: (item) => selectEpisode(tmdb, imdb, item.season)
    });
  }

  // ===== MENU EPISODE =====
  function selectEpisode(tmdb, imdb, season) {
    const max = getEpisodePerSeason();

    const list = [];

    for (let i = 1; i <= max; i++) {
      list.push({
        title: 'Episode ' + i,
        episode: i
      });
    }

    Lampa.Select.show({
      title: 'Season ' + season,
      items: list,
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

      let streams = res.streams;

      if (type === 'series') {
        streams = sortStreams(streams, s, e);
      }

      const items = streams.map(s => ({
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

  // ===== BUTTON =====
  function addButton() {
    $('.torrentio-btn').remove();

    const btn = $('<div class="full-start__button selector torrentio-btn">')
      .text('🔎 Torrentio')
      .on('hover:enter', open);

    $('.full-start-new__buttons').append(btn);
  }

  function open() {
    const tmdb = getTmdbId(current);
    const imdb = getImdbId(current);

    const seasons = current?.card?.number_of_seasons;

    if (seasons && seasons > 0) {
      selectSeason(tmdb, imdb);
    } else {
      loadStreams('movie', tmdb, imdb);
    }
  }

  // ===== INIT =====
  Lampa.Listener.follow('full', function (e) {
    if (e.type === 'complite') {
      current = e.data || {};
      setTimeout(addButton, 300);
    }
  });

})();