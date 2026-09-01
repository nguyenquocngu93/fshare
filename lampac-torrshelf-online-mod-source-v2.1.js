/**
 * TorrShelf HTTP Source for Online Mod v2.1.
 * Injects an item into the exact Online Mod "Sort / Source" selector
 * (Filmix, ZetflixDB, VideoHUB, ...), then plays via Lampa.Player with a
 * native timeline object so Lampa's watch-time tracking is retained.
 */
(function () {
  'use strict';
  if (window.__torrshelf_online_mod_source_v2_1) return;
  window.__torrshelf_online_mod_source_v2_1 = true;

  var API = 'http://127.0.0.1:8787';
  var SOURCE_ID = 'torrshelf_http';
  var lastMovie = null;

  function notify(message) {
    try { Lampa.Noty.show(message); } catch (error) { console.log('[TorrShelf Online Mod]', message); }
  }

  function extractMovie(value, depth) {
    if (!value || depth > 4) return null;
    if (value.movie && (value.movie.title || value.movie.name || value.movie.original_title || value.movie.original_name)) return value.movie;
    if (value.card && (value.card.title || value.card.name || value.card.original_title || value.card.original_name)) return value.card;
    if (value.title || value.name || value.original_title || value.original_name) return value;
    return extractMovie(value.object, depth + 1) || extractMovie(value.activity, depth + 1) || null;
  }

  function captureMovie(value) {
    var movie = extractMovie(value, 0);
    if (movie) lastMovie = movie;
    return movie;
  }

  function currentMovie() {
    var movie = null;
    try { movie = captureMovie(Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active()); } catch (error) {}
    return movie || lastMovie;
  }

  function requestParams(movie) {
    movie = movie || {};
    var date = movie.release_date || movie.first_air_date || movie.date || '';
    var year = String(movie.year || date).match(/\b(?:19|20)\d{2}\b/);
    var isTv = movie.type === 'tv' || movie.media_type === 'tv' || Boolean(movie.name || movie.original_name || movie.first_air_date);
    return {
      title: movie.original_title || movie.title || movie.original_name || movie.name || '',
      year: year ? year[0] : '',
      type: isTv ? 'tv' : 'movie',
      season: Number(movie.season || movie.season_number || 0),
      episode: Number(movie.episode || movie.episode_number || 0),
      imdb: movie.imdb_id || movie.imdb || '',
      max: 12
    };
  }

  function streamApiUrl(movie) {
    var params = requestParams(movie);
    return API + '/api/lampa/streams?' + Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
  }

  function streamQuality(stream) {
    var match = String(stream.title || stream.name || '').match(/\b(2160|1440|1080|720|576|480|360)p\b/i);
    return match ? match[1] + 'p' : 'Auto';
  }

  function isOnlineModSourceMenu(config) {
    if (!config || !Array.isArray(config.items)) return false;
    var names = config.items.map(function (item) { return String(item && item.source || '').toLowerCase(); });
    return names.indexOf('filmix') >= 0 || names.indexOf('cdnvideohub') >= 0 || names.indexOf('collaps') >= 0 || names.indexOf('zetflix') >= 0;
  }

  function timelineFor(movie, stream) {
    var identity = [
      movie && (movie.id || movie.tmdb_id || movie.imdb_id || movie.original_title || movie.original_name || movie.title || movie.name),
      movie && (movie.season || movie.season_number || 0),
      movie && (movie.episode || movie.episode_number || 0),
      SOURCE_ID,
      stream.provider || stream.name || ''
    ].join('|');
    return Lampa.Timeline.view(Lampa.Utils.hash(identity));
  }

  function play(movie, stream) {
    if (!stream || !stream.url) return notify('TorrShelf: nguồn không có URL phát');
    var quality = streamQuality(stream);
    var qualityMap = {};
    qualityMap[quality] = stream.url;
    var item = {
      url: stream.url,
      headers: stream.headers || {},
      quality: qualityMap,
      timeline: timelineFor(movie, stream),
      title: (movie.title || movie.name || movie.original_title || 'Video') + ' · ' + (stream.provider || stream.name || 'TorrShelf HTTP'),
      season: Number(movie.season || movie.season_number || 0),
      episode: Number(movie.episode || movie.episode_number || 0),
      isonline: true,
      movie: movie
    };
    try {
      if (movie.id) Lampa.Favorite.add('history', movie, 100);
      Lampa.Player.play(item);
      Lampa.Player.playlist([item]);
    } catch (error) {
      window.open(stream.url, '_blank');
    }
  }

  function chooseStream(movie, streams) {
    var unique = {};
    var items = (streams || []).filter(function (stream) {
      if (!stream || !stream.url || unique[stream.url]) return false;
      unique[stream.url] = true;
      return true;
    }).map(function (stream) {
      var detail = String(stream.title || stream.name || stream.provider || 'Stream').replace(/\n+/g, ' · ');
      return {
        title: (stream.provider || stream.name || 'TorrShelf HTTP') + ' · ' + streamQuality(stream) + '\n' + detail,
        value: stream
      };
    });
    if (!items.length) return notify('TorrShelf chưa tìm được link HTTP phù hợp');
    Lampa.Select.show({
      title: 'TorrShelf HTTP · ' + (movie.title || movie.name || movie.original_title || ''),
      items: items,
      onSelect: function (selected) { play(movie, selected.value || selected); },
      onBack: function () { try { Lampa.Controller.toggle('content'); } catch (error) {} }
    });
  }

  function openTorrShelfSource() {
    var movie = currentMovie();
    var params = requestParams(movie);
    if (!params.title) return notify('TorrShelf: không xác định được phim hiện tại');
    try { Lampa.Select.close(); } catch (error) {}
    try { Lampa.Loading.start(); } catch (error) {}
    var network = new Lampa.Reguest();
    network.timeout(90000);
    network.silent(streamApiUrl(movie), function (data) {
      try { Lampa.Loading.stop(); } catch (error) {}
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (error) { data = {}; }
      }
      if (data && data.error) return notify('TorrShelf: ' + data.error);
      chooseStream(movie, data && data.streams);
    }, function (first, second) {
      try { Lampa.Loading.stop(); } catch (error) {}
      notify('TorrShelf: ' + (first || second || 'không kết nối được API'));
    });
  }

  function patchActivity() {
    if (!Lampa.Activity || Lampa.Activity.__torrshelfOnlineModCapture) return;
    ['push', 'replace'].forEach(function (method) {
      var original = Lampa.Activity[method];
      if (typeof original !== 'function') return;
      Lampa.Activity[method] = function () {
        captureMovie(arguments[0]);
        return original.apply(this, arguments);
      };
    });
    Lampa.Activity.__torrshelfOnlineModCapture = true;
  }

  function patchSelect() {
    if (!Lampa.Select || Lampa.Select.__torrshelfOnlineModPatched || typeof Lampa.Select.show !== 'function') return;
    var originalShow = Lampa.Select.show;
    Lampa.Select.show = function (config) {
      if (!isOnlineModSourceMenu(config)) return originalShow.apply(this, arguments);
      var originalSelect = config.onSelect;
      var items = config.items.slice();
      if (!items.some(function (item) { return item && item.source === SOURCE_ID; })) {
        items.push({ title: 'TorrShelf HTTP', source: SOURCE_ID, selected: false });
      }
      var patched = {};
      Object.keys(config).forEach(function (key) { patched[key] = config[key]; });
      patched.items = items;
      patched.onSelect = function (selected) {
        if (selected && selected.source === SOURCE_ID) return openTorrShelfSource();
        return originalSelect && originalSelect.apply(this, arguments);
      };
      return originalShow.call(this, patched);
    };
    Lampa.Select.__torrshelfOnlineModPatched = true;
    console.log('[TorrShelf Online Mod Source v2.1] attached to Online Mod Sort menu');
  }

  function start() {
    if (!window.Lampa) return false;
    patchActivity();
    patchSelect();
    return Boolean(Lampa.Select && Lampa.Select.__torrshelfOnlineModPatched);
  }

  function boot(attempt) {
    if (start()) return;
    if (attempt < 120) setTimeout(function () { boot(attempt + 1); }, 500);
  }

  function ready() {
    if (!window.Lampa || !Lampa.Listener) return setTimeout(ready, 250);
    if (window.appready) return boot(0);
    Lampa.Listener.follow('app', function (event) {
      if (event && event.type === 'ready') boot(0);
    });
  }

  ready();
})();
