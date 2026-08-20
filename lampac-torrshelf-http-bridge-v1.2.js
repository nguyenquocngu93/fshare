/**
 * TorrShelf HTTP Bridge v1.2 for Lampa Online.
 * Direct HTTP sources only: UHDMovies, 4KHDHub, MoviesDrive, HDHub4u.
 * No Stremio addon, magnet, Jackett, or TorrServer is used here.
 */
(function () {
  'use strict';
  if (window.__torrshelf_http_bridge_v1_2) return;
  window.__torrshelf_http_bridge_v1_2 = true;

  var DEFAULT_API = 'http://127.0.0.1:8787';
  var BUTTON_CLASS = 'torrshelf-http-bridge-btn';
  var started = false;

  function notify(message) {
    try { Lampa.Noty.show(message); } catch (error) { console.log('[TorrShelf HTTP]', message); }
  }

  function readConfig() {
    try { return JSON.parse(localStorage.getItem('torrshelf_lampa_http') || '{}'); }
    catch (error) { return {}; }
  }

  function apiUrl() {
    return String(readConfig().api_url || DEFAULT_API).trim().replace(/\/$/, '');
  }

  function saveApiUrl(value) {
    try {
      var config = readConfig();
      config.api_url = String(value || '').trim().replace(/\/$/, '');
      localStorage.setItem('torrshelf_lampa_http', JSON.stringify(config));
    } catch (error) {}
  }

  function cardFromEvent(event) {
    var data = event && event.data;
    if (!data) return null;
    return data.card || data.movie || data;
  }

  function cardParams(card) {
    var date = card.release_date || card.first_air_date || card.date || '';
    var yearMatch = String(card.year || date || '').match(/\b(?:19|20)\d{2}\b/);
    var isTv = card.type === 'tv' || card.media_type === 'tv' || Boolean(card.original_name || card.first_air_date);
    return {
      title: card.original_title || card.title || card.original_name || card.name || '',
      year: yearMatch ? yearMatch[0] : '',
      type: isTv ? 'tv' : 'movie',
      season: Number(card.season || card.season_number || 0),
      episode: Number(card.episode || card.episode_number || 0),
      imdb: card.imdb_id || card.imdb || '',
      max: 12
    };
  }

  function fetchStreams(card, callback) {
    var params = cardParams(card);
    if (!params.title) return callback('Không xác định được tên phim');
    var query = Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    var network = new Lampa.Reguest();
    network.timeout(90000);
    network.silent(apiUrl() + '/api/lampa/streams?' + query, function (data) {
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (error) { data = {}; }
      }
      if (data && data.error) return callback(data.error);
      callback(null, (data && data.streams) || []);
    }, function (first, second) {
      callback(first || second || 'Không kết nối được TorrShelf');
    });
  }

  function play(card, stream) {
    if (!stream || !stream.url) return notify('Nguồn không có URL phát');
    var label = card.title || card.name || card.original_title || 'Video';
    var item = {
      title: label + ' · ' + (stream.provider || stream.name || 'TorrShelf'),
      url: stream.url,
      headers: stream.headers || {}
    };
    try {
      Lampa.Player.play(item);
      Lampa.Player.playlist([item]);
    } catch (error) {
      window.open(stream.url, '_blank');
    }
  }

  function chooseStream(card, streams) {
    var items = streams.map(function (stream) {
      var detail = String(stream.title || stream.name || stream.provider || 'Stream').replace(/\n+/g, ' · ');
      return {
        title: (stream.provider || stream.name || 'TorrShelf') + '\n' + detail,
        value: stream
      };
    });
    Lampa.Select.show({
      title: 'TorrShelf HTTP · ' + (card.title || card.name || card.original_title || ''),
      items: items,
      onSelect: function (selected) { play(card, selected.value || selected); },
      onBack: function () { try { Lampa.Controller.toggle('content'); } catch (error) {} }
    });
  }

  function search(card) {
    try { Lampa.Loading.start(); } catch (error) {}
    fetchStreams(card, function (error, streams) {
      try { Lampa.Loading.stop(); } catch (stopError) {}
      if (error) return notify('TorrShelf: ' + error);
      if (!streams.length) return notify('TorrShelf chưa tìm được link HTTP phù hợp');
      chooseStream(card, streams);
    });
  }

  function addButton(card) {
    if (!card || !cardParams(card).title) return;
    var actions = $('.full-start__actions, .full-start__buttons, .detail__actions, [class*="full-start"] [class*="actions"]').first();
    if (!actions.length) actions = $('.full-start').first();
    if (!actions.length || actions.find('.' + BUTTON_CLASS).length) return;
    var button = $('<div class="' + BUTTON_CLASS + ' selector">TorrShelf HTTP</div>');
    button.css({
      padding: '10px 16px', margin: '5px', display: 'inline-block', cursor: 'pointer',
      color: '#fff', background: 'rgba(6,182,212,.16)', border: '1px solid rgba(34,211,238,.45)', borderRadius: '8px', fontWeight: '600'
    });
    button.on('hover:enter click', function () { search(card); });
    actions.append(button);
  }

  function activeCard() {
    try {
      var activity = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
      if (!activity) return null;
      return activity.card || activity.movie || (activity.activity && (activity.activity.card || activity.activity.movie)) || null;
    } catch (error) {
      return null;
    }
  }

  function addCurrentCard(attempt) {
    var card = activeCard();
    if (card) addButton(card);
    if ((!card || !$('.' + BUTTON_CLASS).length) && attempt < 16) {
      setTimeout(function () { addCurrentCard(attempt + 1); }, 500);
    }
  }

  function addSettings() {
    if (!Lampa.SettingsApi || Lampa.SettingsApi._torrshelfHttpBridgeAdded) return;
    Lampa.SettingsApi._torrshelfHttpBridgeAdded = true;
    Lampa.SettingsApi.addParam({
      component: 'torrshelf_http',
      param: { name: 'torrshelf_http_api_url', type: 'input', default: apiUrl() },
      field: { name: 'TorrShelf HTTP API URL' },
      onChange: saveApiUrl
    });
  }

  function start() {
    if (started || !window.Lampa || !Lampa.Listener) return;
    started = true;
    Lampa.Listener.follow('full', function (event) {
      if (!event || (event.type !== 'complite' && event.type !== 'complete')) return;
      var card = cardFromEvent(event);
      setTimeout(function () { addButton(card); }, 350);
    });
    addSettings();
    addCurrentCard(0);
    console.log('[TorrShelf HTTP Bridge v1.2] ready');
  }

  function boot() {
    if (!window.Lampa || !Lampa.Listener) return setTimeout(boot, 250);
    if (window.appready) return setTimeout(start, 150);
    Lampa.Listener.follow('app', function (event) {
      if (event && event.type === 'ready') setTimeout(start, 150);
    });
  }

  boot();
})();
