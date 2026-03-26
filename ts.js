(function () {
  'use strict';

  if (window.torrentio_patch_final) return;
  window.torrentio_patch_final = true;

  let current = null;

  // ===== PLAY (GIỮ NGUYÊN CỦA BẠN) =====
  function play(item) {
    const name = encodeURIComponent(current?.title || current?.name || 'video');

    const url = `${TORRSERVER}/stream/${name}?link=${item.infoHash}&index=${item.fileIdx}&play`;

    Lampa.Player.play({ url });
  }

  // ===== GET EP COUNT (FIX) =====
  function getEpisodeCount(card, season) {

    if (card.seasons) {
      const s = card.seasons.find(x => x.season_number === season);
      if (s && s.episode_count) return s.episode_count;
    }

    const totalSeasons = card.number_of_seasons || 1;
    const totalEpisodes = card.number_of_episodes || 0;

    if (totalEpisodes > 0) {
      let avg = Math.ceil(totalEpisodes / totalSeasons);

      if (avg < 6) avg = 6;
      if (avg > 30) avg = 30;

      return avg;
    }

    return 20;
  }

  // ===== MENU =====
  function askSeasonEpisode(card) {

    const totalSeasons = card.number_of_seasons || 1;

    function pickEpisode(season) {

      const total = getEpisodeCount(card, season);
      const list = [];

      for (let i = 1; i <= total; i++) {
        list.push({
          title: 'Tập ' + i,
          e: i
        });
      }

      Lampa.Select.show({
        title: 'Season ' + season,
        items: list,
        onSelect: function (item) {
          loadStreams(card, season, item.e); // 🔥 gọi lại hàm của bạn
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

    const list = [];

    for (let s = 1; s <= totalSeasons; s++) {
      const ep = getEpisodeCount(card, s);

      list.push({
        title: 'Season ' + s + ' (' + ep + ' tập)',
        s: s
      });
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

  // ===== OPEN =====
  function open() {
    if (!current) return;

    if (current.number_of_seasons) {
      askSeasonEpisode(current);
    } else {
      loadStreams(current); // 🔥 giữ nguyên logic phim lẻ
    }
  }

  // ===== BUTTON (GIỮ NGUYÊN CỦA BẠN) =====
  function addButton() {
    $('.torrentio-btn').remove();

    const btn = $('<div class="full-start__button selector torrentio-btn">')
      .text('🔎 Torrentio')
      .on('hover:enter', open);

    $('.full-start-new__buttons').append(btn);
  }

  // ===== INIT =====
  Lampa.Listener.follow('full', function (e) {
    if (e.type === 'complite') {
      current = e.data.movie || e.data.card || e.data;
      setTimeout(addButton, 300); // 🔥 giữ nguyên fix của bạn
    }
  });

})();