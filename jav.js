(function () {
  'use strict';

  if (window.plugin_knaben_ready) return;
  window.plugin_knaben_ready = true;

  const KNABEN = 'https://knaben.org/api/search';
  const TORRSERVER = 'http://gren439e.tsarea.tv:8880';

  /* ===== HELPERS ===== */

  function getMediaType(card) {
    if (card.number_of_seasons || card.first_air_date) return 'series';
    return 'movie';
  }

  function buildQuery(card, season, episode) {
    var title = card.title || card.name || '';
    var year  = (card.release_date || card.first_air_date || '').slice(0, 4);

    if (season && episode) {
      var s = String(season).padStart(2, '0');
      var e = String(episode).padStart(2, '0');
      return `${title} S${s}E${e}`;
    }

    return title + (year ? ' ' + year : '');
  }

  function play(item, title) {
    const name = encodeURIComponent(title || 'video');

    const url = `${TORRSERVER}/stream/${name}?link=${item.hash}&index=0&play`;

    Lampa.Player.play({ url });
  }

  /* ===== FETCH ===== */

  function searchKnaben(query, callback) {

    var url = KNABEN + '?q=' + encodeURIComponent(query);

    var net = new Lampa.Reguest();
    net.timeout(15000);

    net.silent(url,
      function (data) {
        var res = typeof data === 'string' ? JSON.parse(data) : data;

        var list = (res || []).map(function (r) {
          return {
            title: r.title,
            size: r.size || '',
            seed: r.seeders || 0,
            hash: r.infohash
          };
        });

        callback(list);
      },
      function () {
        Lampa.Noty.show('Knaben lỗi');
        callback([]);
      }
    );
  }

  /* ===== SHOW ===== */

  function show(list, title) {

    if (!list.length) {
      Lampa.Noty.show('Không có torrent');
      return;
    }

    Lampa.Select.show({
      title: '🧲 Knaben - ' + title,
      items: list.map(function (r) {
        return {
          title: r.title,
          subtitle: '👤 ' + r.seed + ' | 💾 ' + r.size,
          result: r
        };
      }),
      onSelect: function (item) {
        play(item.result, item.result.title);
      },
      onBack: function () {
        Lampa.Controller.toggle('full');
      }
    });
  }

  /* ===== EPISODE MENU ===== */

  function ask(card) {

    var totalSeasons = card.number_of_seasons || 1;

    function pickEpisode(season) {

      var total = 20; // đơn giản (knaben không cần chính xác)

      var list = [];
      for (var i = 1; i <= total; i++) {
        list.push({ title: 'Tập ' + i, e: i });
      }

      Lampa.Select.show({
        title: 'Season ' + season,
        items: list,
        onSelect: function (item) {
          var q = buildQuery(card, season, item.e);
          Lampa.Noty.show('Đang tìm...');
          searchKnaben(q, function (res) {
            show(res, q);
          });
        },
        onBack: function () {
          Lampa.Controller.toggle('full');
        }
      });
    }

    if (totalSeasons === 1) {
      pickEpisode(1);
      return;
    }

    var list = [];
    for (var s = 1; s <= totalSeasons; s++) {
      list.push({ title: 'Season ' + s, s: s });
    }

    Lampa.Select.show({
      title: 'Chọn Season',
      items: list,
      onSelect: function (item) {
        pickEpisode(item.s);
      },
      onBack: function () {
        Lampa.Controller.toggle('full');
      }
    });
  }

  /* ===== MAIN SEARCH ===== */

  function search(card) {
    var q = buildQuery(card);

    Lampa.Noty.show('Đang tìm...');
    searchKnaben(q, function (res) {
      show(res, q);
    });
  }

  /* ---- HOOK: NÚT KNABEN ---- */
  Lampa.Listener.follow('full', function (e) {
    if (e.type !== 'complite') return;

    var card = e.data && e.data.movie ? e.data.movie : (e.object && e.object.card);
    if (!card) return;

    var $ctx = e.object && e.object.activity ? e.object.activity.render()
             : (e.object && e.object.render ? e.object.render() : $('body'));

    if ($ctx.find('.view--knaben').length) return;

    var isSeries = getMediaType(card) === 'series';

    var $btn = $(
      '<div class="full-start__button selector view--knaben">' +
      '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
      ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<span>Knaben</span></div>'
    );

    $btn.on('hover:enter', function () {
      if (isSeries) ask(card);
      else search(card);
    });

    var $anchor = $ctx.find('.view--torrent');

    if ($anchor.length) {
      $anchor.after($btn);
    } else {
      $ctx.find('.full-start__buttons').append($btn);
    }
  });

  console.log('[Knaben Plugin] loaded');

})();