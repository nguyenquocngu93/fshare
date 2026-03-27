/* KKPhim Plugin for Lampa - LNUM STYLE CARD

Menu → Category rows (Netflix style)

Card layout giống lnum

Dùng ảnh từ phimapi (img.phimapi.com)

Không dùng torrent */


(function () { 'use strict';

if (window.plugin_kkphim_lnum) return; window.plugin_kkphim_lnum = true;

const API = 'https://phimapi.com';

function startPlugin() {

Lampa.Component.add('kkphim_home', {
  name: 'KKPhim',

  component: function () {

    this.create = function () {};

    this.build = function () {
      this.activity.loader(true);

      let rows = [
        { title: 'Mới cập nhật', type: 'phim-moi-cap-nhat' },
        { title: 'Phim lẻ', type: 'phim-le' },
        { title: 'Phim bộ', type: 'phim-bo' },
        { title: 'Hoạt hình', type: 'hoat-hinh' }
      ];

      let result = [];
      let loaded = 0;

      rows.forEach(row => {
        loadCategory(row.type, (items) => {

          result.push({
            title: row.title,
            items: items
          });

          loaded++;

          if (loaded === rows.length) {
            this.activity.loader(false);

            this.activity.render({
              title: 'KKPhim',
              results: result
            });
          }

        });
      });
    };

    this.open = function (item) {
      this.activity.loader(true);

      fetch(`${API}/phim/${item.url}`)
        .then(r => r.json())
        .then(json => {
          this.activity.loader(false);

          let movie = json.movie;
          let episodes = json.episodes;

          let playList = [];

          episodes.forEach(sv => {
            sv.server_data.forEach(ep => {
              playList.push({
                title: ep.name,
                url: ep.link_m3u8 || ep.link_embed
              });
            });
          });

          // CARD INFO + BUTTONS
          this.activity.render({
            title: movie.name,
            info: {
              title: movie.name,
              poster: movie.poster_url,
              background_image: movie.poster_url,
              description: movie.content
            },

            buttons: [
              {
                title: 'Phát',
                action: function () {
                  let first = playList[0];
                  if (!first) return;

                  Lampa.Player.play({
                    url: first.url,
                    title: movie.name
                  });
                }
              },
              {
                title: 'Chọn tập',
                action: () => {
                  this.activity.render({
                    title: movie.name + ' - Tập',
                    items: playList,
                    onEnter: function (ep) {
                      Lampa.Player.play({
                        url: ep.url,
                        title: movie.name + ' - ' + ep.title
                      });
                    }
                  });
                }
              }
            ]
          });

        });
    };

  }
});

// MENU (anime.js style register)
Lampa.Listener.follow('menu', function (e) {
  if (e.type === 'add') {
    e.menu.push({
      title: 'KKPhim',
      icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>',
      component: 'kkphim_home',
      action: function () {
        Lampa.Activity.push({
          url: 'kkphim_home',
          title: 'KKPhim',
          component: 'kkphim_home'
        });
      }
    });
  }
});
      }
    });
  }
});

function loadCategory(type, callback) {
  let url = '';

  if (type === 'phim-moi-cap-nhat') {
    url = `${API}/danh-sach/phim-moi-cap-nhat?page=1`;
  } else {
    url = `${API}/v1/api/danh-sach/${type}?page=1`;
  }

  fetch(url)
    .then(r => r.json())
    .then(json => {
      let items = (json.data?.items || json.items || []).map(mapItem);
      callback(items);
    });
}

function mapItem(item) {
  return {
    title: item.name,
    poster: item.poster_url || item.thumb_url,
    background_image: item.poster_url,
    url: item.slug,
    type: 'movie'
  };
}

}

if (window.appready) startPlugin(); else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

})();