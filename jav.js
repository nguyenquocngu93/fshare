(function () {
  'use strict';

  if (window.plugin_knaben_stable) return;
  window.plugin_knaben_stable = true;

  const API = 'https://knaben.org/api/v1/search';
  const TORRSERVER = 'http://gren439e.tsarea.tv:8880';

  let current = null;

  /* ===== GET TITLE SAFE ===== */
  function getTitle(card) {
    return (
      card.title ||
      card.name ||
      card.original_title ||
      card.original_name ||
      ''
    ).trim();
  }

  function getYear(card) {
    return (card.release_date || card.first_air_date || '').slice(0, 4);
  }

  function buildQuery(card, season, episode) {
    const title = getTitle(card);
    const year = getYear(card);

    if (!title) return '';

    if (season && episode) {
      const s = String(season).padStart(2, '0');
      const e = String(episode).padStart(2, '0');
      return `${title} S${s}E${e}`;
    }

    return title + (year ? ' ' + year : '');
  }

  /* ===== MAGNET ===== */
  function magnet(hash, name) {
    return 'magnet:?xt=urn:btih:' + hash +
           '&dn=' + encodeURIComponent(name || '');
  }

  /* ===== PLAY ===== */
  function play(item) {
    const name = encodeURIComponent(getTitle(current));

    const url = `${TORRSERVER}/stream/${name}?link=${magnet(item.hash, item.title)}&index=0&play`;

    Lampa.Player.play({ url });
  }

  /* ===== SEARCH ===== */
  function search(card, season, episode) {

    const q = buildQuery(card, season, episode);

    if (!q) {
      Lampa.Noty.show('❌ Không có tên phim');
      return;
    }

    Lampa.Noty.show('🔎 Knaben...');

    const url = API + '?q=' + encodeURIComponent(q) + '&cat=2000';

    const net = new Lampa.Reguest();
    net.timeout(10000);

    net.silent(url,
      function (data) {

        let res = typeof data === 'string' ? JSON.parse(data) : data;

        let list = ((res && res.results) || [])
          .map(r => ({
            title: r.title,
            hash: r.hash,
            seed: r.seeders || 0,
            size: r.size || ''
          }))
          .filter(x => x.hash && x.title);

        if (!list.length) {
          Lampa.Noty.show('❌ Không có torrent');
          return;
        }

        // sort seed cao trước
        list.sort((a, b) => b.seed - a.seed);

        Lampa.Select.show({
          title: '🧲 Knaben (' + list.length + ')',
          items: list.map(r => ({
            title: r.title,
            subtitle: '👤 ' + r.seed + ' | 💾 ' + r.size,
            result: r
          })),
          onSelect: i => play(i.result),
          onBack: () => Lampa.Controller.toggle('full')
        });
      },
      function () {
        Lampa.Noty.show('❌ API lỗi');
      }
    );
  }

  /* ===== SERIES MENU ===== */
  function ask(card) {

    const seasons = card.number_of_seasons || 1;

    function pickEpisode(s) {

      let list = [];
      for (let i = 1; i <= 20; i++) {
        list.push({ title: 'Tập ' + i, e: i });
      }

      Lampa.Select.show({
        title: 'Season ' + s,
        items: list,
        onSelect: it => search(card, s, it.e),
        onBack: () => Lampa.Controller.toggle('full')
      });
    }

    if (seasons === 1) {
      pickEpisode(1);
      return;
    }

    let list = [];
    for (let i = 1; i <= seasons; i++) {
      list.push({ title: 'Season ' + i, s: i });
    }

    Lampa.Select.show({
      title: 'Chọn Season',
      items: list,
      onSelect: it => pickEpisode(it.s),
      onBack: () => Lampa.Controller.toggle('full')
    });
  }

  /* ===== BUTTON ===== */
  Lampa.Listener.follow('full', function (e) {
    if (e.type !== 'complite') return;

    current = e.data.movie || (e.object && e.object.card);
    if (!current) return;

    let $ctx = e.object.activity.render();

    if ($ctx.find('.view--knaben-fix').length) return;

    let isSeries = current.number_of_seasons;

    let btn = $(`
      <div class="full-start__button selector view--knaben-fix">
        <span>Knaben</span>
      </div>
    `);

    btn.on('hover:enter', function () {
      if (isSeries) ask(current);
      else search(current);
    });

    $ctx.find('.full-start__buttons').append(btn);
  });

  console.log('[Knaben Stable] loaded');

})();