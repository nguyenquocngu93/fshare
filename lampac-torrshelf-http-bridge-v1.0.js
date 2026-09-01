/**
 * TorrShelf HTTP Bridge for Lampa Online
 *
 * Lampa UI -> TorrShelf /api/lampa/streams -> direct HTTP sources only.
 * This deliberately does not use TorrShelf Stremio add-ons, magnets or TorrServer.
 */
(function () {
  'use strict';
  if (window.__torrshelf_http_bridge_v1) return;
  window.__torrshelf_http_bridge_v1 = true;

  var DEFAULT_API = 'http://127.0.0.1:8787';
  var PLUGIN_CLASS = 'torrshelf-http-bridge-btn';

  function readConfig() {
    try { return JSON.parse(localStorage.getItem('torrshelf_lampa_http') || '{}'); }
    catch (e) { return {}; }
  }

  function apiUrl() {
    return String(readConfig().api_url || DEFAULT_API).replace(/\/$/, '');
  }

  function saveConfig(value) {
    try {
      var config = readConfig();
      config.api_url = String(value || '').replace(/\/$/, '');
      localStorage.setItem('torrshelf_lampa_http', JSON.stringify(config));
    } catch (e) {}
  }

  function cardParams(card) {
    var title = card.original_title || card.original_name || card.title || card.name || '';
    var date = card.release_date || card.first_air_date || '';
    var type = card.type === 'tv' || card.media_type === 'tv' || card.name ? 'tv' : 'movie';
    var yearMatch = String(card.year || date || '').match(/\b(19|20)\d{2}\b/);
    return {
      title: title,
      year: yearMatch ? yearMatch[0] : '',
      type: type,
      season: Number(card.season || card.season_number || 0),
      episode: Number(card.episode || card.episode_number || 0),
      imdb: card.imdb_id || card.imdb || '',
      max: 12
    };
  }

  function fetchStreams(card, callback) {
    var params = cardParams(card);
    if (!params.title) return callback('Không xác định được tên phim');
    var search = Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    var request = new Lampa.Reguest();
    request.timeout(90000);
    request.silent(apiUrl() + '/api/lampa/streams?' + search, function (data) {
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = {}; }
      }
      callback(null, (data && data.streams) || []);
    }, function (a, b) {
      callback(a || b || 'Không kết nối được TorrShelf');
    });
  }

  function play(card, stream) {
    if (!stream || !stream.url) return Lampa.Noty.show('Nguồn không có URL phát');
    var item = {
      title: (card.title || card.name || 'Video') + ' · ' + (stream.provider || stream.name || 'TorrShelf'),
      url: stream.url,
      headers: stream.headers || {}
    };
    try {
      Lampa.Player.play(item);
      Lampa.Player.playlist([item]);
    } catch (e) {
      window.open(stream.url, '_blank');
    }
  }

  function selectStream(card, streams) {
    var items = streams.map(function (stream) {
      var lines = String(stream.title || stream.name || stream.provider || 'Stream').split('\n');
      return {
        title: (stream.provider || stream.name || 'TorrShelf') + '\n' + lines.join(' · '),
        value: stream
      };
    });
    Lampa.Select.show({
      title: 'TorrShelf HTTP · ' + (card.title || card.name || ''),
      items: items,
      onSelect: function (selected) { play(card, selected.value || selected); },
      onBack: function () { Lampa.Controller.toggle('content'); }
    });
  }

  function search(card) {
    Lampa.Loading.start();
    fetchStreams(card, function (error, streams) {
      Lampa.Loading.stop();
      if (error) return Lampa.Noty.show('TorrShelf: ' + error);
      if (!streams.length) return Lampa.Noty.show('TorrShelf không tìm thấy link HTTP phù hợp');
      selectStream(card, streams);
    });
  }

  function addButton(card) {
    var actions = $('.full-start__actions, .full-start__buttons, .detail__actions, [class*="full-start"] [class*="actions"]').first();
    if (!actions.length || actions.find('.' + PLUGIN_CLASS).length) return;
    var button = $('<div class="' + PLUGIN_CLASS + ' selector">TorrShelf HTTP</div>');
    button.css({
      padding: '10px 16px', margin: '5px', display: 'inline-block', cursor: 'pointer',
      color: '#fff', background: 'rgba(6,182,212,.16)', border: '1px solid rgba(34,211,238,.45)', borderRadius: '8px', fontWeight: '600'
    });
    button.on('hover:enter click', function () { search(card); });
    actions.append(button);
  }

  function addSettings() {
    if (!Lampa.SettingsApi) return;
    Lampa.SettingsApi.addParam({
      component: 'torrshelf_http',
      param: { name: 'torrshelf_http_api_url', type: 'input', default: apiUrl() },
      field: { name: 'TorrShelf HTTP API URL' },
      onChange: saveConfig
    });
  }

  function init() {
    if (!window.Lampa || !Lampa.Listener) return;
    Lampa.Listener.follow('full', function (event) {
      if ((event.type === 'complite' || event.type === 'complete') && event.data) {
        setTimeout(function () { addButton(event.data); }, 400);
      }
    });
    addSettings();
    console.log('[TorrShelf HTTP Bridge] ready');
  }

  function waitForLampa() {
    if (window.Lampa && Lampa.Listener) return init();
    setTimeout(waitForLampa, 250);
  }

  waitForLampa();
})();
