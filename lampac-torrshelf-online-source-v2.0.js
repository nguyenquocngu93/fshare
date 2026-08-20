/**
 * TorrShelf HTTP Online Source v2.0
 * Adds TorrShelf HTTP to Lampac Online's native source selector so its existing
 * timeline, watched state, and Lampa.Player lifecycle are used.
 * Direct HTTP only: UHDMovies, 4KHDHub, MoviesDrive, HDHub4u.
 */
(function () {
  'use strict';
  if (window.__torrshelf_online_source_v2) return;
  window.__torrshelf_online_source_v2 = true;

  var API = 'http://127.0.0.1:8787';
  var SOURCE_ID = 'torrshelf_http';
  var SOURCE_URL = 'torrshelf://streams';
  var installed = false;

  function notify(message) {
    try { Lampa.Noty.show(message); } catch (error) { console.log('[TorrShelf Online]', message); }
  }

  function sourceEntry() {
    return {
      balanser: SOURCE_ID,
      name: 'TorrShelf HTTP',
      url: SOURCE_URL,
      show: true
    };
  }

  function addSource(items) {
    var list = Array.isArray(items) ? items.slice() : [];
    if (!list.some(function (item) {
      return item && (String(item.balanser || '').toLowerCase() === SOURCE_ID || String(item.url || '') === SOURCE_URL);
    })) list.push(sourceEntry());
    return list;
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

  function apiUrl(movie) {
    var params = requestParams(movie);
    return API + '/api/lampa/streams?' + Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
  }

  function quality(stream) {
    var match = String(stream.title || stream.name || '').match(/\b(2160|1440|1080|720|576|480|360)p\b/i);
    return match ? match[1] + 'p' : 'Auto';
  }

  function streamRows(streams, movie) {
    var used = {};
    return (streams || []).filter(function (stream) {
      if (!stream || !stream.url || used[stream.url]) return false;
      used[stream.url] = true;
      return true;
    }).map(function (stream, index) {
      var label = stream.provider || stream.name || 'TorrShelf';
      var q = quality(stream);
      var title = String(stream.title || label).replace(/\n+/g, ' · ');
      return {
        method: 'play',
        url: stream.url,
        headers: stream.headers || {},
        title: label + ' · ' + q,
        text: title,
        quality: (function () { var values = {}; values[q] = stream.url; return values; })(),
        voice_name: label,
        season: Number(movie && (movie.season || movie.season_number) || 0),
        episode: Number(movie && (movie.episode || movie.episode_number) || 0),
        source_index: index
      };
    });
  }

  function loadStreams(component, movie) {
    var params = requestParams(movie);
    if (!params.title) return notify('TorrShelf: không xác định được tên phim');
    var network = new Lampa.Reguest();
    network.timeout(90000);
    try { component.activity.loader(true); } catch (error) {}
    network.silent(apiUrl(movie), function (data) {
      try { component.activity.loader(false); } catch (error) {}
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (error) { data = {}; }
      }
      if (data && data.error) return notify('TorrShelf: ' + data.error);
      var rows = streamRows(data && data.streams, movie);
      if (!rows.length) {
        notify('TorrShelf chưa tìm được link HTTP phù hợp');
        if (component.empty) component.empty();
        return;
      }
      // The native Lampac component supplies timeline hashes, watched tracking,
      // source persistence and Lampa.Player.play / playlist from this call.
      component.display(rows);
    }, function (first, second) {
      try { component.activity.loader(false); } catch (error) {}
      notify('TorrShelf: ' + (first || second || 'không kết nối được API'));
      if (component.empty) component.empty();
    });
  }

  function patchLampacComponent(OriginalComponent) {
    function TorrShelfLampacComponent(object) {
      var component = new OriginalComponent(object);
      if (!component || !object || !object.movie || component.__torrshelfOnlineSourcePatched) return component;
      component.__torrshelfOnlineSourcePatched = true;

      var oldStartSource = component.startSource;
      if (typeof oldStartSource === 'function') {
        component.startSource = function (items) {
          return oldStartSource.call(component, addSource(items));
        };
      }

      var oldLifeSource = component.lifeSource;
      if (typeof oldLifeSource === 'function') {
        component.lifeSource = function () {
          var result = oldLifeSource.call(component);
          return result && typeof result.then === 'function' ? result.then(addSource) : result;
        };
      }

      var oldRequest = component.request;
      if (typeof oldRequest === 'function') {
        component.request = function (url) {
          if (String(url || '').indexOf(SOURCE_URL) === 0) {
            loadStreams(component, object.movie);
            return;
          }
          return oldRequest.apply(component, arguments);
        };
      }
      return component;
    }
    TorrShelfLampacComponent.__torrshelfOnlineSourceWrapped = true;
    return TorrShelfLampacComponent;
  }

  function install() {
    if (installed || !window.Lampa || !Lampa.Component || !Lampa.Component.get || !Lampa.Component.add) return false;
    var OriginalComponent = Lampa.Component.get('lampac');
    if (!OriginalComponent) return false;
    if (OriginalComponent.__torrshelfOnlineSourceWrapped) {
      installed = true;
      return true;
    }
    Lampa.Component.add('lampac', patchLampacComponent(OriginalComponent));
    installed = true;
    console.log('[TorrShelf Online Source v2.0] attached to Lampac Online');
    return true;
  }

  function boot(attempt) {
    if (install()) return;
    if (attempt < 120) setTimeout(function () { boot(attempt + 1); }, 500);
    else console.warn('[TorrShelf Online Source] Lampac Online component was not found');
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
