(function () {
  var API_BASE = 'https://phimapi.com';

  function api(url) {
    return fetch(url).then(function (r) { return r.json(); });
  }

  function injectCss() {
    if (document.getElementById('kkphim-lampa-css')) return;
    var css = `
      .kk-wrap{display:flex;height:100%;background:#0f1115;color:#fff;font-family:Arial,sans-serif}
      .kk-side{width:240px;min-width:240px;background:#141923;border-right:1px solid #232938;overflow:auto;padding:12px}
      .kk-title{font-size:16px;font-weight:700;margin-bottom:12px}
      .kk-cat{padding:10px 12px;border-radius:10px;margin-bottom:8px;background:#1c2230;cursor:pointer;transition:.2s}
      .kk-cat:hover{background:#2a3448}
      .kk-cat.active{background:#e91e63}
      .kk-main{flex:1;overflow:auto;padding:12px}
      .kk-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
      .kk-head h2{margin:0;font-size:18px}
      .kk-badge{padding:6px 10px;border-radius:999px;background:#1c2230;color:#b9c2d6;font-size:12px}
      .kk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
      .kk-card{background:#171b24;border-radius:14px;overflow:hidden;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:.2s}
      .kk-card:hover{transform:translateY(-2px)}
      .kk-poster{width:100%;aspect-ratio:2/3;object-fit:cover;background:#0b0d12;display:block}
      .kk-info{padding:10px}
      .kk-name{font-size:14px;font-weight:700;line-height:1.3;min-height:36px}
      .kk-year{font-size:12px;color:#a8b0c2;margin-top:6px}
      .kk-more{margin:14px auto 0;display:block;border:0;border-radius:12px;padding:12px 16px;background:#2c3344;color:#fff;cursor:pointer}
      .kk-more:hover{background:#3a435a}
      .kk-loading,.kk-empty{padding:18px;color:#cbd3e1}
      .kk-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:99999;padding:20px}
      .kk-modal{width:min(920px,100%);max-height:90vh;overflow:auto;background:#11151d;border:1px solid #2a3142;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
      .kk-modal-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid #232938}
      .kk-modal-title{font-size:18px;font-weight:700;margin:0}
      .kk-close{border:0;background:#2c3344;color:#fff;border-radius:10px;padding:8px 12px;cursor:pointer}
      .kk-modal-body{display:grid;grid-template-columns:220px 1fr;gap:18px;padding:18px}
      .kk-modal-poster{width:100%;border-radius:14px;aspect-ratio:2/3;object-fit:cover;background:#0b0d12}
      .kk-meta{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}
      .kk-chip{padding:6px 10px;border-radius:999px;background:#1c2230;color:#cbd3e1;font-size:12px}
      .kk-desc{line-height:1.6;color:#d5dbea}
      .kk-episodes{margin-top:18px}
      .kk-episodes h3{margin:0 0 10px;font-size:16px}
      .kk-ep-list{display:flex;flex-wrap:wrap;gap:8px}
      .kk-ep{padding:8px 10px;border-radius:10px;background:#1c2230;color:#fff;font-size:13px;cursor:pointer}
      .kk-ep:hover{background:#2a3448}
      @media (max-width:800px){
        .kk-wrap{flex-direction:column}
        .kk-side{width:auto;min-width:0;border-right:0;border-bottom:1px solid #232938}
        .kk-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}
        .kk-modal-body{grid-template-columns:1fr}
      }
    `;
    var style = document.createElement('style');
    style.id = 'kkphim-lampa-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function normalizeCats(res) {
    return res.items || res.data || res.categories || [];
  }

  function normalizeMovies(res) {
    if (res.data && res.data.items) return res.data.items;
    return res.items || res.data || res.movies || [];
  }

  function posterUrl(movie) {
    var p = movie.poster || movie.thumb || movie.image || movie.poster_url || '';
    return p ? (p.indexOf('http') === 0 ? p : API_BASE + '/image.php?url=' + encodeURIComponent(p)) : '';
  }

  function movieName(movie) {
    return movie.name || movie.title || movie.origin_name || 'Không tên';
  }

  function movieYear(movie) {
    return movie.year || movie.release_year || '';
  }

  function movieSlug(movie) {
    return movie.slug || movie.id || '';
  }

  function getFilmDetailUrl(slug) {
    return API_BASE + '/phim/' + encodeURIComponent(slug);
  }

  Lampa.Component.add('kkphim_browser', function () {
    var state = {
      categories: [],
      current: null,
      page: 1,
      limit: 10,
      loading: false,
      hasMore: true
    };

    var root, side, main, grid, moreBtn, headTitle, badge, loadingBox;
    var modalBackdrop, modalContent;

    function create(tag, cls, html) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html !== undefined) e.innerHTML = html;
      return e;
    }

    function openModal(movie) {
      var slug = movieSlug(movie);
      if (!slug) return;

      modalContent.innerHTML = '<div class="kk-loading">Đang tải chi tiết...</div>';
      modalBackdrop.style.display = 'flex';

      api(getFilmDetailUrl(slug))
        .then(function (res) {
          var data = res.movie || res.data || res.item || res;
          var poster = posterUrl(data || movie) || 'https://via.placeholder.com/400x600?text=No+Poster';
          var name = movieName(data || movie);
          var desc = data.description || data.content || data.plot || 'Đang cập nhật.';
          var year = data.year || movieYear(data || movie);
          var status = data.status || '';
          var lang = data.lang || data.langs || data.language || '';
          var quality = data.quality || '';
          var country = data.country || '';
          var director = data.director || '';
          var categories = data.category || data.categories || '';
          var episodes = data.episodes || data.episode || data.server_data || [];

          var html = `
            <div class="kk-modal-head">
              <h3 class="kk-modal-title">${name}</h3>
              <button class="kk-close">Đóng</button>
            </div>
            <div class="kk-modal-body">
              <div>
                <img class="kk-modal-poster" src="${poster}" alt="poster">
              </div>
              <div>
                <div class="kk-meta">
                  ${year ? `<span class="kk-chip">Năm: ${year}</span>` : ''}
                  ${status ? `<span class="kk-chip">Tình trạng: ${status}</span>` : ''}
                  ${quality ? `<span class="kk-chip">Chất lượng: ${quality}</span>` : ''}
                  ${lang ? `<span class="kk-chip">Ngôn ngữ: ${lang}</span>` : ''}
                  ${country ? `<span class="kk-chip">Quốc gia: ${country}</span>` : ''}
                  ${director ? `<span class="kk-chip">Đạo diễn: ${director}</span>` : ''}
                  ${categories ? `<span class="kk-chip">Thể loại: ${categories}</span>` : ''}
                </div>
                <div class="kk-desc">${desc}</div>
                <div class="kk-episodes">
                  <h3>Danh sách tập</h3>
                  <div class="kk-ep-list"></div>
                </div>
              </div>
            </div>
          `;

          modalContent.innerHTML = html;

          var epBox = modalContent.querySelector('.kk-ep-list');
          var epData = [];

          if (Array.isArray(episodes)) {
            episodes.forEach(function (server) {
              if (server && Array.isArray(server.server_data)) {
                server.server_data.forEach(function (ep) { epData.push(ep); });
              } else if (server && Array.isArray(server.episodes)) {
                server.episodes.forEach(function (ep) { epData.push(ep); });
              }
            });
          }

          if (!epData.length && data && data.episode_current) {
            epData.push({ name: data.episode_current, link_m3u8: data.link_m3u8 || '' });
          }

          if (!epData.length) {
            epBox.innerHTML = '<div class="kk-empty">Không có tập hoặc phim lẻ.</div>';
          } else {
            epData.forEach(function (ep) {
              var btn = create('div', 'kk-ep', ep.name || ep.label || 'Tập');
              btn.addEventListener('click', function () {
                if (ep.link_m3u8) window.open(ep.link_m3u8, '_blank');
              });
              epBox.appendChild(btn);
            });
          }

          modalContent.querySelector('.kk-close').addEventListener('click', closeModal);
        })
        .catch(function () {
          modalContent.innerHTML = '<div class="kk-empty">Lỗi tải chi tiết phim.</div>';
        });
    }

    function closeModal() {
      modalBackdrop.style.display = 'none';
    }

    function loadCategories() {
      loadingBox.style.display = 'block';
      api(API_BASE + '/the-loai')
        .then(function (res) {
          state.categories = normalizeCats(res);
          state.current = state.categories[0] || null;
          renderCategories();
          if (state.current) loadMovies(true);
          else {
            loadingBox.style.display = 'none';
            grid.innerHTML = '<div class="kk-empty">Không có thể loại.</div>';
          }
        })
        .catch(function () {
          loadingBox.style.display = 'none';
          side.innerHTML = '<div class="kk-empty">Lỗi tải thể loại.</div>';
        });
    }

    function renderCategories() {
      side.innerHTML = '<div class="kk-title">Thể loại</div>';
      state.categories.forEach(function (cat) {
        var name = cat.name || cat.title || cat.slug || 'Thể loại';
        var slug = cat.slug || cat.id || '';
        var item = create('div', 'kk-cat' + (state.current && (state.current.slug === slug) ? ' active' : ''), name);
        item.addEventListener('click', function () {
          if (state.loading) return;
          state.current = cat;
          state.page = 1;
          state.hasMore = true;
          grid.innerHTML = '';
          renderCategories();
          loadMovies(true);
        });
        side.appendChild(item);
      });
    }

    function renderHeader() {
      headTitle.textContent = state.current ? (state.current.name || state.current.title || 'Phim') : 'Phim';
      badge.textContent = state.current ? ('Trang ' + state.page) : '';
    }

    function renderMovies(items, reset) {
      if (reset) grid.innerHTML = '';
      if (!items.length && reset) {
        grid.innerHTML = '<div class="kk-empty">Không có phim trong thể loại này.</div>';
      } else {
        items.forEach(function (movie) {
          var card = create('div', 'kk-card');
          var poster = posterUrl(movie) || 'https://via.placeholder.com/400x600?text=No+Poster';
          card.innerHTML =
            '<img class="kk-poster" src="' + poster + '" alt="poster">' +
            '<div class="kk-info">' +
              '<div class="kk-name">' + movieName(movie) + '</div>' +
              '<div class="kk-year">' + movieYear(movie) + '</div>' +
            '</div>';
          card.addEventListener('click', function () { openModal(movie); });
          grid.appendChild(card);
        });
      }
      moreBtn.style.display = state.hasMore ? 'block' : 'none';
      loadingBox.style.display = 'none';
      renderHeader();
    }

    function loadMovies(reset) {
      if (!state.current || state.loading) return;
      state.loading = true;
      loadingBox.style.display = 'block';
      renderHeader();

      var slug = state.current.slug || state.current.id;
      var url = API_BASE + '/v1/api/the-loai/' + encodeURIComponent(slug) +
        '?page=' + state.page +
        '&sort_field=_id&sort_type=asc&limit=' + state.limit;

      api(url)
        .then(function (res) {
          var items = normalizeMovies(res);
          if (items.length < state.limit) state.hasMore = false;
          renderMovies(items, reset);
        })
        .catch(function () {
          grid.innerHTML = '<div class="kk-empty">Lỗi tải phim.</div>';
          moreBtn.style.display = 'none';
        })
        .finally(function () {
          state.loading = false;
          loadingBox.style.display = 'none';
        });
    }

    function loadMore() {
      if (state.loading || !state.hasMore) return;
      state.page += 1;
      loadMovies(false);
    }

    function buildUI() {
      root = create('div', 'kk-wrap');

      side = create('div', 'kk-side');
      main = create('div', 'kk-main');

      var head = create('div', 'kk-head');
      var left = create('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '10px';

      headTitle = create('h2', '', 'Phim');
      badge = create('div', 'kk-badge', '');
      left.appendChild(headTitle);
      left.appendChild(badge);
      head.appendChild(left);

      loadingBox = create('div', 'kk-loading', 'Đang tải...');
      grid = create('div', 'kk-grid');

      moreBtn = create('button', 'kk-more', 'Xem thêm');
      moreBtn.addEventListener('click', loadMore);

      main.appendChild(head);
      main.appendChild(loadingBox);
      main.appendChild(grid);
      main.appendChild(moreBtn);

      root.appendChild(side);
      root.appendChild(main);

      modalBackdrop = create('div', 'kk-modal-backdrop');
      modalContent = create('div', 'kk-modal');
      modalBackdrop.appendChild(modalContent);
      modalBackdrop.addEventListener('click', function (e) {
        if (e.target === modalBackdrop) closeModal();
      });
      document.body.appendChild(modalBackdrop);

      return root;
    }

    function init() {
      injectCss();

      var host = document.querySelector('.my-plugin-host');
      if (!host) {
        host = document.createElement('div');
        host.className = 'my-plugin-host';
        document.body.appendChild(host);
      }

      host.innerHTML = '';
      host.appendChild(buildUI());
      loadCategories();
    }

    return {
      create: function () { return this; },
      search: function () {},
      init: init
    };
  });
})();