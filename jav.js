(function () {
    'use strict';

    var CONFIG = {
        api_base: 'https://phimapi.com',
        img_base: 'https://phimimg.com/',
        tmdb_key: '4ef0d7355d9ffb5151e987764708ce96', // TMDB API key public
        tmdb_img: 'https://image.tmdb.org/t/p/',
        name: 'KKPhim',
        cache_time: 1000 * 60 * 15
    };

    // ============================================================
    // STYLES
    // ============================================================
    function addStyles() {
        if (document.getElementById('kkphim-css')) return;
        var css = `
            /* ─── Root scroll container ─── */
            .kk-scroll {
                position: absolute;
                inset: 0;
                overflow-y: auto;
                overflow-x: hidden;
                -webkit-overflow-scrolling: touch;
                overscroll-behavior-y: contain;
                /* đẩy nội dung lên khỏi navbar Lampa */
                padding-bottom: env(safe-area-inset-bottom, 0px);
            }
            .kk-root {
                min-height: 100%;
                /* navbar bottom Lampa ~60-70px + system bar */
                padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
                box-sizing: border-box;
            }

            /* ─── Sticky Nav ─── */
            .kk-nav {
                position: sticky;
                top: 0;
                z-index: 100;
                display: flex;
                gap: .45em;
                padding: .65em .9em;
                overflow-x: auto;
                scrollbar-width: none;
                background: rgba(10,10,20,.92);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                border-bottom: 1px solid rgba(255,255,255,.06);
            }
            .kk-nav::-webkit-scrollbar{display:none}
            .kk-nav__btn {
                flex-shrink: 0;
                padding: .5em 1em;
                border-radius: 2em;
                background: rgba(255,255,255,.07);
                color: rgba(255,255,255,.72);
                font-size: .8em;
                font-weight: 600;
                border: 1px solid rgba(255,255,255,.08);
                white-space: nowrap;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                transition: background .15s, transform .12s;
            }
            .kk-nav__btn:active{transform:scale(.94);background:rgba(229,57,53,.75);color:#fff;border-color:transparent}

            /* ─── Section header ─── */
            .kk-sec {
                padding: .9em .9em .3em;
            }
            .kk-sec__head {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .kk-sec__title {
                font-size: 1.05em;
                font-weight: 700;
                color: #fff;
                display: flex;
                align-items: center;
                gap: .45em;
            }
            .kk-sec__title::before {
                content:'';
                width: 3px; height: 1em;
                background: linear-gradient(#e53935,#ff5252);
                border-radius: 3px;
                flex-shrink: 0;
            }
            .kk-sec__more {
                font-size: .75em;
                color: rgba(255,255,255,.38);
                cursor: pointer;
                padding: .3em .7em;
                border-radius: 1em;
                border: 1px solid rgba(255,255,255,.08);
                -webkit-tap-highlight-color: transparent;
            }
            .kk-sec__more:active{background:rgba(255,255,255,.08)}

            /* ─── Horizontal scroll row ─── */
            .kk-row {
                display: flex;
                gap: .65em;
                overflow-x: auto;
                padding: .4em .9em .9em;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
                scroll-snap-type: x proximity;
            }
            .kk-row::-webkit-scrollbar{display:none}
            .kk-row .kk-card{ flex-shrink:0; width:230px; scroll-snap-align:start; }

            /* ─── Grid ─── */
            .kk-grid {
                display: grid;
                grid-template-columns: repeat(2,1fr);
                gap: .65em;
                padding: .3em .9em .5em;
            }
            @media(min-width:480px){.kk-grid{grid-template-columns:repeat(3,1fr)}}
            @media(min-width:700px){.kk-grid{grid-template-columns:repeat(4,1fr)}}

            /* ════════════════════════════════════════════
               CARD  –  bắt chước Lampa backdrop style
               ════════════════════════════════════════════ */
            .kk-card {
                position: relative;
                border-radius: .75em;
                overflow: hidden;
                background: #12121f;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                display: block;
                transition: transform .18s;
            }
            .kk-card:active{transform:scale(.96)}

            /* backdrop 16:9 cho row, poster 2:3 cho grid */
            .kk-row .kk-card .kk-card__img { aspect-ratio: 16/9; }
            .kk-grid .kk-card .kk-card__img { aspect-ratio: 2/3; }

            .kk-card__img {
                width: 100%;
                object-fit: cover;
                display: block;
                background: #1a1a2e;
            }

            /* gradient overlay – đậm hơn ở dưới như Lampa */
            .kk-card__grad {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    0deg,
                    rgba(5,5,15,.97)  0%,
                    rgba(5,5,15,.55) 45%,
                    rgba(5,5,15,.0)  75%
                );
                pointer-events: none;
            }

            /* logo TMDB nằm giữa-trên */
            .kk-card__logo {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%,-60%);
                max-width: 70%;
                max-height: 38%;
                object-fit: contain;
                filter: drop-shadow(0 2px 8px rgba(0,0,0,.8));
                pointer-events: none;
                opacity: 0;
                transition: opacity .3s;
            }
            .kk-card__logo.loaded{opacity:1}

            /* badges góc trên */
            .kk-card__badges {
                position: absolute;
                top: .4em; left: .4em; right: .4em;
                display: flex;
                justify-content: space-between;
                pointer-events: none;
                z-index: 3;
            }
            .kk-bg{display:flex;gap:.2em}
            .kk-badge {
                padding: .12em .38em;
                border-radius: .28em;
                font-size: .6em;
                font-weight: 700;
                text-transform: uppercase;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
            }
            .kk-badge--q{background:rgba(229,57,53,.88);color:#fff}
            .kk-badge--l{background:rgba(33,150,243,.88);color:#fff}
            .kk-badge--y{background:rgba(255,193,7,.88);color:#111}
            .kk-badge--e{background:rgba(76,175,80,.88);color:#fff}

            /* tên phim + phụ đề */
            .kk-card__info {
                position: absolute;
                bottom: 0; left: 0; right: 0;
                padding: .55em .65em .6em;
                z-index: 3;
            }
            .kk-card__name {
                font-size: .82em;
                font-weight: 700;
                color: #fff;
                line-height: 1.25;
                margin: 0;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-shadow: 0 1px 8px rgba(0,0,0,1);
            }
            .kk-card__sub {
                font-size: .67em;
                color: rgba(255,255,255,.48);
                margin: .12em 0 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* ─── Back button – to hơn ─── */
            .kk-back {
                display: flex;
                align-items: center;
                gap: .6em;
                padding: .9em 1em;
                min-height: 56px;
                color: rgba(255,255,255,.85);
                font-size: .95em;
                font-weight: 600;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                border-bottom: 1px solid rgba(255,255,255,.05);
            }
            .kk-back:active{background:rgba(255,255,255,.07)}
            .kk-back__circle {
                width: 38px; height: 38px;
                border-radius: 50%;
                background: rgba(255,255,255,.1);
                display: flex; align-items: center; justify-content: center;
                font-size: 1.2em;
                flex-shrink: 0;
            }

            /* ─── Detail ─── */
            .kk-detail__hero {
                position: relative;
                width: 100%;
                height: 52vw;
                max-height: 270px;
                overflow: hidden;
            }
            .kk-detail__hero img {
                width:100%; height:100%; object-fit:cover;
            }
            .kk-detail__hero-grad {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    180deg, rgba(10,10,20,.25) 0%,
                    rgba(10,10,20,.0) 40%,
                    rgba(10,10,20,1) 100%
                );
            }

            /* Logo TMDB trên hero */
            .kk-detail__logo {
                position: absolute;
                bottom: 5.5em; left: 50%;
                transform: translateX(-50%);
                max-width: 55%;
                max-height: 70px;
                object-fit: contain;
                filter: drop-shadow(0 2px 12px rgba(0,0,0,.9));
                display: none;
            }
            .kk-detail__logo.loaded{display:block}

            .kk-detail__body { padding: 0 .9em; margin-top: -1.8em; position:relative; z-index:2; }
            .kk-detail__row  { display:flex; gap:.9em; align-items:flex-end; }
            .kk-detail__poster {
                flex-shrink: 0;
                width: 95px;
                border-radius: .6em;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,.65);
            }
            .kk-detail__poster img{width:100%;display:block}
            .kk-detail__meta { flex:1; min-width:0; padding-bottom:.2em; }
            .kk-detail__title {
                font-size: 1.2em;
                font-weight: 800;
                color: #fff;
                margin: 0 0 .1em;
                line-height: 1.2;
            }
            .kk-detail__orig {
                font-size: .78em;
                color: rgba(255,255,255,.38);
                margin: 0 0 .45em;
                font-style: italic;
                white-space: nowrap; overflow:hidden; text-overflow:ellipsis;
            }
            .kk-detail__tags { display:flex; flex-wrap:wrap; gap:.28em; }
            .kk-tag {
                padding: .15em .5em;
                border-radius: 1.5em;
                font-size: .65em;
                font-weight: 600;
                background: rgba(255,255,255,.08);
                color: rgba(255,255,255,.7);
                border: 1px solid rgba(255,255,255,.1);
            }
            .kk-tag--red  { background:rgba(229,57,53,.2);  border-color:rgba(229,57,53,.45); }
            .kk-tag--blue { background:rgba(33,150,243,.2); border-color:rgba(33,150,243,.45); }
            .kk-tag--green{ background:rgba(76,175,80,.2);  border-color:rgba(76,175,80,.45); }

            /* Action buttons */
            .kk-actions { display:flex; gap:.55em; margin: .9em 0 .7em; }
            .kk-btn {
                display:inline-flex; align-items:center; justify-content:center;
                gap:.4em;
                padding: .72em 1.2em;
                border-radius: 2em;
                font-size: .9em; font-weight:700;
                border:none; cursor:pointer;
                -webkit-tap-highlight-color:transparent;
                transition:transform .14s, opacity .14s;
                user-select:none;
            }
            .kk-btn:active{transform:scale(.93);opacity:.85}
            .kk-btn--play {
                background: linear-gradient(135deg,#e53935,#ff5252);
                color:#fff;
                box-shadow: 0 4px 18px rgba(229,57,53,.38);
                flex:1; min-height:48px;
            }
            .kk-btn--fav {
                width:48px; height:48px;
                border-radius:50%; padding:0;
                background:rgba(255,255,255,.09);
                color:#fff; font-size:1.2em;
                border:1px solid rgba(255,255,255,.14);
                flex-shrink:0;
            }

            /* Info table */
            .kk-info {
                margin: .2em 0 .6em;
                border: 1px solid rgba(255,255,255,.06);
                border-radius: .7em;
                overflow:hidden;
            }
            .kk-info__row {
                display:flex;
                padding: .52em .8em;
                font-size:.81em;
                border-bottom:1px solid rgba(255,255,255,.05);
            }
            .kk-info__row:last-child{border-bottom:none}
            .kk-info__label{color:rgba(255,255,255,.34);min-width:78px;flex-shrink:0}
            .kk-info__val  {color:rgba(255,255,255,.82)}

            /* Description */
            .kk-desc {
                font-size:.82em; color:rgba(255,255,255,.58);
                line-height:1.7; margin:.4em 0;
                position:relative;
            }
            .kk-desc.collapsed{max-height:4em;overflow:hidden}
            .kk-desc.collapsed::after{
                content:'';
                position:absolute; bottom:0;left:0;right:0;
                height:2em;
                background:linear-gradient(transparent,var(--lampa-background,#0d0d1a));
            }
            .kk-desc-toggle {
                font-size:.76em; color:#e53935;
                cursor:pointer; padding:.25em 0;
                display:inline-block;
                -webkit-tap-highlight-color:transparent;
            }

            /* Episodes */
            .kk-eps__sname {
                font-size:.73em; color:rgba(255,255,255,.32);
                margin-bottom:.4em; padding-bottom:.28em;
                border-bottom:1px solid rgba(255,255,255,.06);
            }
            .kk-eps__list { display:flex; flex-wrap:wrap; gap:.38em; margin-bottom:1em; }
            .kk-ep {
                padding:.42em .82em;
                border-radius:.5em;
                background:rgba(255,255,255,.07);
                color:rgba(255,255,255,.8);
                font-size:.76em; font-weight:600;
                cursor:pointer;
                border:1px solid rgba(255,255,255,.08);
                -webkit-tap-highlight-color:transparent;
                min-width:2.6em; min-height:34px;
                display:flex; align-items:center; justify-content:center;
                user-select:none; transition:all .14s;
            }
            .kk-ep:active,.kk-ep.playing{background:rgba(229,57,53,.8);color:#fff;border-color:#e53935}

            /* Infinite scroll */
            .kk-inf-load{display:flex;justify-content:center;padding:1.2em;display:none}
            .kk-inf-load.show{display:flex}
            .kk-inf-end{text-align:center;padding:1.2em;font-size:.76em;color:rgba(255,255,255,.18);display:none}
            .kk-spin{
                width:30px;height:30px;
                border:3px solid rgba(255,255,255,.08);
                border-top-color:#e53935;
                border-radius:50%;
                animation:kkspin .7s linear infinite;
            }
            @keyframes kkspin{to{transform:rotate(360deg)}}

            /* Loading / empty */
            .kk-loading{display:flex;justify-content:center;padding:4em 2em}
            .kk-empty{text-align:center;padding:4em 1em;color:rgba(255,255,255,.28)}
            .kk-empty__ico{font-size:2.4em;margin-bottom:.3em}

            /* Chips */
            .kk-chips{display:flex;flex-wrap:wrap;gap:.45em;padding:.4em .9em 1em}
            .kk-chip{
                padding:.58em 1.05em;
                border-radius:2em;
                background:rgba(255,255,255,.06);
                color:rgba(255,255,255,.74);
                font-size:.83em; cursor:pointer;
                border:1px solid rgba(255,255,255,.08);
                -webkit-tap-highlight-color:transparent;
                min-height:40px; display:flex; align-items:center;
                user-select:none;
            }
            .kk-chip:active{background:rgba(229,57,53,.7);color:#fff;transform:scale(.96)}

            /* Search */
            .kk-sbar{display:flex;gap:.5em;padding:.75em .9em}
            .kk-sbar input{
                flex:1; padding:.72em 1em;
                border-radius:2em;
                border:1px solid rgba(255,255,255,.14);
                background:rgba(255,255,255,.08);
                color:#fff; font-size:.88em;
                outline:none; -webkit-appearance:none;
                min-height:46px;
            }
            .kk-sbar input::placeholder{color:rgba(255,255,255,.28)}
            .kk-sbar input:focus{border-color:#e53935;background:rgba(255,255,255,.11)}
            .kk-sbar button{
                padding:0 1.15em; border-radius:2em;
                background:#e53935; color:#fff;
                font-weight:700; border:none;
                cursor:pointer; font-size:.88em;
                min-height:46px; min-width:58px;
                -webkit-tap-highlight-color:transparent;
            }
            .kk-sbar button:active{opacity:.8}
        `;
        var el = document.createElement('style');
        el.id = 'kkphim-css';
        el.textContent = css;
        document.head.appendChild(el);
    }

    // ============================================================
    // CACHE + API helpers
    // ============================================================
    var _cache = {};
    function apiFetch(url, cb) {
        if (_cache[url] && Date.now() - _cache[url].t < CONFIG.cache_time) return cb(_cache[url].d);
        $.ajax({
            url: url, timeout: 12000, dataType: 'json',
            success: function (d) { _cache[url] = { d: d, t: Date.now() }; cb(d); },
            error:   function ()  { cb(null); }
        });
    }

    function imgSrc(path) {
        if (!path) return '';
        return path.startsWith('http') ? path : CONFIG.img_base + path;
    }

    // ── TMDB: tìm logo + backdrop theo tên phim (tiếng Anh) ──
    function tmdbSearch(name, year, cb) {
        var url = 'https://api.themoviedb.org/3/search/movie' +
            '?api_key=' + CONFIG.tmdb_key +
            '&query=' + encodeURIComponent(name) +
            (year ? '&year=' + year : '') +
            '&language=vi-VN&page=1';
        apiFetch(url, function (d) {
            if (!d || !d.results || !d.results.length) {
                // thử TV
                var url2 = 'https://api.themoviedb.org/3/search/tv' +
                    '?api_key=' + CONFIG.tmdb_key +
                    '&query=' + encodeURIComponent(name) +
                    '&language=vi-VN&page=1';
                apiFetch(url2, function (d2) {
                    if (!d2 || !d2.results || !d2.results.length) return cb(null);
                    cb({ id: d2.results[0].id, type: 'tv' });
                });
                return;
            }
            cb({ id: d.results[0].id, type: 'movie' });
        });
    }

    function tmdbImages(id, type, cb) {
        var url = 'https://api.themoviedb.org/3/' + type + '/' + id +
            '/images?api_key=' + CONFIG.tmdb_key + '&include_image_language=en,vi,null';
        apiFetch(url, function (d) {
            if (!d) return cb(null, null);
            var logo = null;
            if (d.logos && d.logos.length) {
                // ưu tiên PNG có nền trong
                var pngs = d.logos.filter(function(l){ return l.file_path && l.file_path.endsWith('.png'); });
                logo = (pngs.length ? pngs[0] : d.logos[0]).file_path;
            }
            cb(logo ? CONFIG.tmdb_img + 'w300' + logo : null);
        });
    }

    // Lấy logo TMDB cho 1 item (name + year + originName)
    function getLogoUrl(item, cb) {
        var name = item.origin_name || item.name || '';
        var year = item.year || '';
        tmdbSearch(name, year, function (res) {
            if (!res) return cb(null);
            tmdbImages(res.id, res.type, cb);
        });
    }

    // ============================================================
    // HTML HELPERS
    // ============================================================
    function spinnerHtml() { return '<div class="kk-loading"><div class="kk-spin"></div></div>'; }
    function emptyHtml(m) {
        return '<div class="kk-empty"><div class="kk-empty__ico">📭</div><div>' + (m || 'Không có dữ liệu') + '</div></div>';
    }
    function backHtml(label) {
        return '<div class="kk-back" data-back="1"><div class="kk-back__circle">‹</div>' + (label || 'Quay lại') + '</div>';
    }
    function infoRow(label, val) {
        return '<div class="kk-info__row"><span class="kk-info__label">' + label + '</span><span class="kk-info__val">' + val + '</span></div>';
    }

    // ── Card HTML (backdrop Lampa-style) ──
    function cardHtml(item) {
        var name    = item.name || '';
        var orig    = item.origin_name || '';
        var slug    = item.slug || '';
        var quality = item.quality || '';
        var lang    = item.lang || '';
        var year    = item.year || '';
        var epCur   = item.episode_current || '';
        // poster_url thường 16:9 cho row, thumb_url cho grid
        var backdrop = imgSrc(item.poster_url || item.thumb_url);
        var thumb    = imgSrc(item.thumb_url  || item.poster_url);

        return [
            '<div class="kk-card" data-slug="' + slug + '">',
              /* badges */
              '<div class="kk-card__badges">',
                '<div class="kk-bg">',
                  quality ? '<span class="kk-badge kk-badge--q">' + quality + '</span>' : '',
                  lang    ? '<span class="kk-badge kk-badge--l">' + lang    + '</span>' : '',
                '</div>',
                '<div class="kk-bg">',
                  year  ? '<span class="kk-badge kk-badge--y">' + year  + '</span>' : '',
                  epCur ? '<span class="kk-badge kk-badge--e">' + epCur + '</span>' : '',
                '</div>',
              '</div>',
              /* backdrop img */
              '<img class="kk-card__img" src="' + backdrop + '" loading="lazy"',
                ' onerror="this.src=\'' + thumb + '\';this.onerror=null">',
              /* logo placeholder – sẽ load async */
              '<img class="kk-card__logo" data-slug="' + slug + '"',
                ' data-name="' + encodeURIComponent(orig || name) + '"',
                ' data-year="' + year + '">',
              /* gradient */
              '<div class="kk-card__grad"></div>',
              /* info */
              '<div class="kk-card__info">',
                '<p class="kk-card__name">' + name + '</p>',
                orig ? '<p class="kk-card__sub">' + orig + '</p>' : '',
              '</div>',
            '</div>'
        ].join('');
    }

    // Lazy-load logos cho một container
    function loadLogos(container) {
        var logos = container.querySelectorAll('.kk-card__logo[data-name]');
        // chỉ load 6 cái đầu trên màn hình
        var batch = Array.prototype.slice.call(logos, 0, 6);
        batch.forEach(function (img) {
            var name = decodeURIComponent(img.dataset.name || '');
            var year = img.dataset.year || '';
            if (!name) return;
            getLogoUrl({ origin_name: name, year: year }, function (logoUrl) {
                if (logoUrl && img.parentElement) {
                    img.src = logoUrl;
                    img.onload = function () { img.classList.add('loaded'); };
                }
            });
            // xóa data-name để tránh load lại
            img.removeAttribute('data-name');
        });
    }

    // ============================================================
    // FETCH functions
    // ============================================================
    function fetchNew(page, cb) {
        apiFetch(CONFIG.api_base + '/danh-sach/phim-moi-cap-nhat?page=' + page, function (d) {
            if (!d || !d.items) return cb([], 1);
            cb(d.items, d.pagination ? (d.pagination.totalPages || 1) : 1);
        });
    }
    function fetchList(type, page, cb) {
        apiFetch(CONFIG.api_base + '/v1/api/danh-sach/' + type + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pag = (d.data.params && d.data.params.pagination) || {};
            cb(d.data.items, Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1);
        });
    }
    function fetchCat(slug, page, cb) {
        apiFetch(CONFIG.api_base + '/v1/api/the-loai/' + slug + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pag = (d.data.params && d.data.params.pagination) || {};
            cb(d.data.items, Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1);
        });
    }
    function fetchCountry(slug, page, cb) {
        apiFetch(CONFIG.api_base + '/v1/api/quoc-gia/' + slug + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pag = (d.data.params && d.data.params.pagination) || {};
            cb(d.data.items, Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1);
        });
    }
    function fetchSearch(kw, page, cb) {
        apiFetch(CONFIG.api_base + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pag = (d.data.params && d.data.params.pagination) || {};
            cb(d.data.items, Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1);
        });
    }

    // ============================================================
    // INFINITE SCROLL ENGINE
    // ============================================================
    var _infDestroy = null;

    function startInfinite(opts) {
        // opts: { grid, scrollEl, fetchFn, onEmpty }
        if (_infDestroy) { _infDestroy(); _infDestroy = null; }

        var grid     = opts.grid;
        var scrollEl = opts.scrollEl;
        var fetchFn  = opts.fetchFn;
        var page     = 0;
        var total    = 1;
        var busy     = false;
        var ended    = false;

        // loader + end
        var loaderEl = document.createElement('div');
        loaderEl.className = 'kk-inf-load';
        loaderEl.innerHTML = '<div class="kk-spin"></div>';

        var endEl = document.createElement('div');
        endEl.className = 'kk-inf-end';
        endEl.textContent = '— Đã hết —';

        grid.parentElement.appendChild(loaderEl);
        grid.parentElement.appendChild(endEl);

        function loadMore() {
            if (busy || ended) return;
            busy = true;
            loaderEl.classList.add('show');

            fetchFn(page + 1, function (items, totalPages) {
                busy = false;
                loaderEl.classList.remove('show');
                total = totalPages || 1;
                page++;

                if (!items || !items.length) {
                    if (page === 1 && opts.onEmpty) opts.onEmpty();
                    finish(); return;
                }

                // append cards
                var frag = document.createDocumentFragment();
                items.forEach(function (item) {
                    var tmp = document.createElement('div');
                    tmp.innerHTML = cardHtml(item);
                    var card = tmp.firstElementChild;
                    card.addEventListener('click', function () {
                        openDetail(this.dataset.slug);
                    });
                    frag.appendChild(card);
                });
                grid.appendChild(frag);

                // load logos for newly added cards
                loadLogos(grid);

                if (page >= total) finish();
            });
        }

        function finish() {
            ended = true;
            loaderEl.classList.remove('show');
            endEl.style.display = 'block';
            scrollEl.removeEventListener('scroll', onScroll);
        }

        function onScroll() {
            if (ended || busy) return;
            var rem = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
            if (rem < 350) loadMore();
        }

        scrollEl.addEventListener('scroll', onScroll, { passive: true });
        loadMore(); // first page

        _infDestroy = function () {
            ended = true;
            scrollEl.removeEventListener('scroll', onScroll);
        };
    }

    // ============================================================
    // OPEN DETAIL (new Lampa Activity)
    // ============================================================
    function openDetail(slug) {
        if (typeof Lampa !== 'undefined' && Lampa.Activity) {
            Lampa.Activity.push({ component: 'kkphim_detail', slug: slug, title: 'KKPhim' });
        }
    }

    // ============================================================
    // NAVIGATE (in-page)
    // ============================================================
    var _scrollEl = null;
    var _rootEl   = null;

    function navigate(view, params) {
        params = params || {};
        if (!_rootEl || !_scrollEl) return;

        if (_infDestroy) { _infDestroy(); _infDestroy = null; }
        _rootEl.innerHTML   = spinnerHtml();
        _scrollEl.scrollTop = 0;

        var titleMap = {
            'new'      : '🆕 Phim Mới',
            'phim-le'  : '🎬 Phim Lẻ',
            'phim-bo'  : '📺 Phim Bộ',
            'hoat-hinh': '🎭 Hoạt Hình',
            'tv-shows' : '📡 TV Shows'
        };

        switch (view) {
            case 'home':       renderHome(); break;
            case 'new':        renderInfPage('🆕 Phim Mới', function(p,cb){ fetchNew(p,cb); }); break;
            case 'list':       renderInfPage(titleMap[params.slug]||params.slug, function(p,cb){ fetchList(params.slug,p,cb); }); break;
            case 'category':   renderInfPage(params.slug, function(p,cb){ fetchCat(params.slug,p,cb); }); break;
            case 'country':    renderInfPage(params.slug, function(p,cb){ fetchCountry(params.slug,p,cb); }); break;
            case 'categories': renderCategories(); break;
            case 'countries':  renderCountries(); break;
            case 'search':     renderSearch(params.keyword||null); break;
        }
    }

    // ============================================================
    // VIEWS
    // ============================================================

    /* ── Home ── */
    function renderHome() {
        var navItems = [
            { icon:'🆕', text:'Phim Mới',  view:'new' },
            { icon:'🎬', text:'Phim Lẻ',   view:'list', slug:'phim-le' },
            { icon:'📺', text:'Phim Bộ',   view:'list', slug:'phim-bo' },
            { icon:'🎭', text:'Hoạt Hình', view:'list', slug:'hoat-hinh' },
            { icon:'📡', text:'TV Shows',  view:'list', slug:'tv-shows' },
            { icon:'🏷️', text:'Thể Loại',  view:'categories' },
            { icon:'🌍', text:'Quốc Gia',  view:'countries' },
            { icon:'🔍', text:'Tìm Kiếm',  view:'search' }
        ];

        var rows = [
            { key:'new',   title:'Phim Mới',   view:'new',  slug:'',         fetchFn: function(cb){ fetchNew(1,cb); } },
            { key:'le',    title:'Phim Lẻ',    view:'list', slug:'phim-le',  fetchFn: function(cb){ fetchList('phim-le',1,cb); } },
            { key:'bo',    title:'Phim Bộ',    view:'list', slug:'phim-bo',  fetchFn: function(cb){ fetchList('phim-bo',1,cb); } },
            { key:'anime', title:'Hoạt Hình',  view:'list', slug:'hoat-hinh',fetchFn: function(cb){ fetchList('hoat-hinh',1,cb); } }
        ];

        var navHtml = '<div class="kk-nav">' +
            navItems.map(function(n){
                return '<div class="kk-nav__btn" data-view="'+n.view+'"'+(n.slug?' data-slug="'+n.slug+'"':'')+'>'+n.icon+' '+n.text+'</div>';
            }).join('') + '</div>';

        var rowsHtml = rows.map(function(r){
            return '<div class="kk-sec"><div class="kk-sec__head">' +
                '<div class="kk-sec__title">'+r.title+'</div>' +
                '<div class="kk-sec__more" data-view="'+r.view+'"'+(r.slug?' data-slug="'+r.slug+'"':'')+'>Xem thêm ›</div>' +
                '</div></div>' +
                '<div class="kk-row" id="kk-row-'+r.key+'"><div class="kk-spin" style="margin:.8em auto;display:block"></div></div>';
        }).join('');

        _rootEl.innerHTML = navHtml + rowsHtml;

        // bind nav
        _rootEl.querySelectorAll('.kk-nav__btn').forEach(function(b){
            b.addEventListener('click', function(){ navigate(this.dataset.view, { slug: this.dataset.slug }); });
        });
        _rootEl.querySelectorAll('.kk-sec__more').forEach(function(b){
            b.addEventListener('click', function(){ navigate(this.dataset.view, { slug: this.dataset.slug }); });
        });

        // fetch rows
        rows.forEach(function(r){
            r.fetchFn(function(items){
                var rowEl = document.getElementById('kk-row-' + r.key);
                if (!rowEl) return;
                if (!items || !items.length){ rowEl.innerHTML=''; return; }
                rowEl.innerHTML = items.slice(0,12).map(cardHtml).join('');
                rowEl.querySelectorAll('.kk-card').forEach(function(c){
                    c.addEventListener('click', function(){ openDetail(this.dataset.slug); });
                });
                loadLogos(rowEl);
            });
        });
    }

    /* ── Infinite list page ── */
    function renderInfPage(title, fetchFn) {
        _rootEl.innerHTML =
            backHtml() +
            '<div class="kk-sec"><div class="kk-sec__title">' + title + '</div></div>' +
            '<div class="kk-grid" id="kk-inf-grid"></div>';

        bindBack(_rootEl);

        var grid = _rootEl.querySelector('#kk-inf-grid');
        startInfinite({
            grid: grid,
            scrollEl: _scrollEl,
            fetchFn: fetchFn,
            onEmpty: function(){ grid.innerHTML = emptyHtml(); }
        });
    }

    /* ── Search ── */
    function renderSearch(keyword) {
        if (_infDestroy) { _infDestroy(); _infDestroy = null; }

        _rootEl.innerHTML =
            backHtml() +
            '<div class="kk-sbar"><input id="kk-si" type="text" placeholder="Nhập tên phim..." value="'+(keyword?keyword.replace(/"/g,'&quot;'):'')+'">' +
            '<button id="kk-sg">🔍</button></div>' +
            '<div id="kk-sarea"></div>';

        bindBack(_rootEl);

        var input = _rootEl.querySelector('#kk-si');
        var goBtn = _rootEl.querySelector('#kk-sg');
        var sArea = _rootEl.querySelector('#kk-sarea');

        function doSearch() {
            var kw = input.value.trim();
            if (!kw) return;
            if (_infDestroy) { _infDestroy(); _infDestroy = null; }
            sArea.innerHTML = '<div class="kk-grid" id="kk-inf-grid"></div>';
            var grid = sArea.querySelector('#kk-inf-grid');
            startInfinite({
                grid: grid,
                scrollEl: _scrollEl,
                fetchFn: function(p,cb){ fetchSearch(kw,p,cb); },
                onEmpty: function(){ grid.innerHTML = emptyHtml('Không tìm thấy "'+kw+'"'); }
            });
        }

        goBtn.addEventListener('click', doSearch);
        input.addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });
        if (keyword) doSearch();
        else setTimeout(function(){ input.focus(); }, 300);
    }

    /* ── Categories ── */
    function renderCategories() {
        var cats = [
            {slug:'hanh-dong',name:'💥 Hành Động'},{slug:'tinh-cam',name:'💕 Tình Cảm'},
            {slug:'hai-huoc',name:'😂 Hài Hước'},{slug:'co-trang',name:'🏯 Cổ Trang'},
            {slug:'tam-ly',name:'🧠 Tâm Lý'},{slug:'hinh-su',name:'🔍 Hình Sự'},
            {slug:'chien-tranh',name:'⚔️ Chiến Tranh'},{slug:'the-thao',name:'⚽ Thể Thao'},
            {slug:'vo-thuat',name:'🥋 Võ Thuật'},{slug:'vien-tuong',name:'🚀 Viễn Tưởng'},
            {slug:'phieu-luu',name:'🗺️ Phiêu Lưu'},{slug:'khoa-hoc',name:'🔬 Khoa Học'},
            {slug:'kinh-di',name:'👻 Kinh Dị'},{slug:'am-nhac',name:'🎵 Âm Nhạc'},
            {slug:'than-thoai',name:'🐉 Thần Thoại'},{slug:'tai-lieu',name:'📄 Tài Liệu'},
            {slug:'gia-dinh',name:'👨‍👩‍👧 Gia Đình'},{slug:'chinh-kich',name:'🎭 Chính Kịch'},
            {slug:'bi-an',name:'🔮 Bí Ẩn'},{slug:'hoc-duong',name:'🎒 Học Đường'}
        ];
        _rootEl.innerHTML = backHtml() +
            '<div class="kk-sec"><div class="kk-sec__title">Thể Loại Phim</div></div>' +
            '<div class="kk-chips">' +
            cats.map(function(c){ return '<div class="kk-chip" data-slug="'+c.slug+'">'+c.name+'</div>'; }).join('') +
            '</div>';
        bindBack(_rootEl);
        _rootEl.querySelectorAll('.kk-chip').forEach(function(ch){
            ch.addEventListener('click', function(){ navigate('category',{slug:this.dataset.slug}); });
        });
    }

    /* ── Countries ── */
    function renderCountries() {
        var list = [
            {slug:'viet-nam',name:'🇻🇳 Việt Nam'},{slug:'han-quoc',name:'🇰🇷 Hàn Quốc'},
            {slug:'trung-quoc',name:'🇨🇳 Trung Quốc'},{slug:'nhat-ban',name:'🇯🇵 Nhật Bản'},
            {slug:'thai-lan',name:'🇹🇭 Thái Lan'},{slug:'au-my',name:'🇺🇸 Âu Mỹ'},
            {slug:'dai-loan',name:'🇹🇼 Đài Loan'},{slug:'hong-kong',name:'🇭🇰 Hồng Kông'},
            {slug:'an-do',name:'🇮🇳 Ấn Độ'},{slug:'anh',name:'🇬🇧 Anh'},
            {slug:'phap',name:'🇫🇷 Pháp'},{slug:'duc',name:'🇩🇪 Đức'},
            {slug:'tay-ban-nha',name:'🇪🇸 Tây Ban Nha'},{slug:'philippines',name:'🇵🇭 Philippines'},
            {slug:'canada',name:'🇨🇦 Canada'}
        ];
        _rootEl.innerHTML = backHtml() +
            '<div class="kk-sec"><div class="kk-sec__title">Quốc Gia</div></div>' +
            '<div class="kk-chips">' +
            list.map(function(c){ return '<div class="kk-chip" data-slug="'+c.slug+'">'+c.name+'</div>'; }).join('') +
            '</div>';
        bindBack(_rootEl);
        _rootEl.querySelectorAll('.kk-chip').forEach(function(ch){
            ch.addEventListener('click', function(){ navigate('country',{slug:this.dataset.slug}); });
        });
    }

    /* ── Detail (separate Activity) ── */
    function renderDetail(rootEl, scrollEl, slug) {
        rootEl.innerHTML = spinnerHtml();
        scrollEl.scrollTop = 0;

        apiFetch(CONFIG.api_base + '/phim/' + slug, function (data) {
            if (!data || !data.movie) {
                rootEl.innerHTML = backHtml() + emptyHtml('Không tìm thấy phim');
                bindBack(rootEl); return;
            }

            var m   = data.movie;
            var eps = data.episodes || [];
            var backdrop = imgSrc(m.poster_url || m.thumb_url);
            var thumb    = imgSrc(m.thumb_url  || m.poster_url);
            var originName = m.origin_name || m.name || '';

            var h = backHtml();

            // Hero
            h += '<div class="kk-detail__hero">';
            h += '<img src="' + backdrop + '" id="kk-hero-img" onerror="this.style.opacity=0">';
            h += '<img class="kk-detail__logo" id="kk-hero-logo">';
            h += '<div class="kk-detail__hero-grad"></div>';
            h += '</div>';

            // Body
            h += '<div class="kk-detail__body">';
            h += '<div class="kk-detail__row">';
            h += '<div class="kk-detail__poster"><img src="' + thumb + '"></div>';
            h += '<div class="kk-detail__meta">';
            h += '<h1 class="kk-detail__title">' + (m.name || '') + '</h1>';
            if (m.origin_name) h += '<p class="kk-detail__orig">' + m.origin_name + '</p>';
            h += '<div class="kk-detail__tags">';
            if (m.quality) h += '<span class="kk-tag kk-tag--red">'   + m.quality + '</span>';
            if (m.lang)    h += '<span class="kk-tag kk-tag--blue">'  + m.lang    + '</span>';
            if (m.year)    h += '<span class="kk-tag">'               + m.year    + '</span>';
            if (m.episode_current) h += '<span class="kk-tag kk-tag--green">' + m.episode_current + '</span>';
            if (m.time)    h += '<span class="kk-tag">⏱ ' + m.time + '</span>';
            h += '</div></div></div>';

            // Buttons
            var firstLink = '';
            if (eps.length && eps[0].server_data && eps[0].server_data.length) {
                firstLink = eps[0].server_data[0].link_m3u8 || eps[0].server_data[0].link_embed || '';
            }
            h += '<div class="kk-actions">';
            h += '<div class="kk-btn kk-btn--play" id="kk-playfirst" data-link="'+firstLink+'" data-name="'+(m.name||'')+'">▶ Xem Phim</div>';
            h += '<div class="kk-btn kk-btn--fav" id="kk-fav">♡</div>';
            h += '</div>';

            // Info
            h += '<div class="kk-info">';
            if (m.status)        h += infoRow('Trạng thái', m.status);
            if (m.episode_total) h += infoRow('Tổng tập',   m.episode_total);
            if (m.country  && m.country.length)  h += infoRow('Quốc gia',  m.country.map(function(c){return c.name;}).join(', '));
            if (m.category && m.category.length) h += infoRow('Thể loại',  m.category.map(function(c){return c.name;}).join(', '));
            if (m.director && m.director.length && m.director[0]) h += infoRow('Đạo diễn', m.director.join(', '));
            if (m.actor    && m.actor.length    && m.actor[0])    h += infoRow('Diễn viên',m.actor.slice(0,5).join(', '));
            h += '</div>';

            // Desc
            if (m.content) {
                var desc = m.content.replace(/<[^>]*>/g, '');
                h += '<div class="kk-desc collapsed" id="kk-desc">' + desc + '</div>';
                h += '<div class="kk-desc-toggle" id="kk-dtog">Xem thêm ▾</div>';
            }

            h += '</div>'; // detail body

            // Episodes
            if (eps.length) {
                h += '<div class="kk-sec" style="margin-top:.4em"><div class="kk-sec__title">Danh Sách Tập</div></div>';
                h += '<div style="padding:0 .9em 1em">';
                eps.forEach(function(sv){
                    if (!sv.server_data||!sv.server_data.length) return;
                    h += '<div class="kk-eps__sname">' + (sv.server_name||'Server') + '</div>';
                    h += '<div class="kk-eps__list">';
                    sv.server_data.forEach(function(ep){
                        var n = ep.name||ep.slug||'';
                        var l = ep.link_m3u8||ep.link_embed||'';
                        h += '<div class="kk-ep" data-link="'+l+'" data-name="'+(m.name||'')+' – Tập '+n+'">'+n+'</div>';
                    });
                    h += '</div>';
                });
                h += '</div>';
            }

            rootEl.innerHTML = h;

            // ── bind events ──
            bindBack(rootEl);

            rootEl.querySelectorAll('.kk-btn--play,.kk-ep').forEach(function(btn){
                btn.addEventListener('click', function(){
                    playVideo(this.dataset.link, this.dataset.name);
                    rootEl.querySelectorAll('.kk-ep').forEach(function(e){e.classList.remove('playing');});
                    if (this.classList.contains('kk-ep')) this.classList.add('playing');
                });
            });

            var descEl = rootEl.querySelector('#kk-desc');
            var dtog   = rootEl.querySelector('#kk-dtog');
            if (descEl && dtog) {
                dtog.addEventListener('click', function(){
                    var c = descEl.classList.toggle('collapsed');
                    dtog.textContent = c ? 'Xem thêm ▾' : 'Thu gọn ▴';
                });
            }

            // ── load TMDB logo async ──
            var heroLogo = rootEl.querySelector('#kk-hero-logo');
            if (heroLogo && originName) {
                getLogoUrl({ origin_name: originName, year: m.year }, function(logoUrl){
                    if (logoUrl && heroLogo.parentElement) {
                        heroLogo.src = logoUrl;
                        heroLogo.onload = function(){ heroLogo.classList.add('loaded'); };
                    }
                });
            }
        });
    }

    // ============================================================
    // HELPERS
    // ============================================================
    function bindBack(container) {
        container.querySelectorAll('[data-back]').forEach(function(btn){
            btn.addEventListener('click', function(){
                if (typeof Lampa !== 'undefined' && Lampa.Activity) Lampa.Activity.backward();
            });
        });
    }

    function playVideo(link, title) {
        if (!link) {
            if (typeof Lampa !== 'undefined' && Lampa.Noty) Lampa.Noty.show('⚠️ Không có link');
            return;
        }
        try {
            if (typeof Lampa !== 'undefined' && Lampa.Player) {
                var item = { title: title || 'KKPhim', url: link };
                Lampa.Player.play(item);
                Lampa.Player.playlist([item]);
            } else { window.open(link, '_blank'); }
        } catch(e) { window.open(link, '_blank'); }
    }

    // ============================================================
    // LAMPA INTEGRATION
    // ============================================================
    function initPlugin() {
        addStyles();
        if (typeof Lampa === 'undefined') return;

        /* ── Main component ── */
        Lampa.Component.add('kkphim', function () {
            // scrollEl: chứa toàn bộ, overflow-y scroll
            var scrollEl = document.createElement('div');
            scrollEl.className = 'kk-scroll';

            var rootEl = document.createElement('div');
            rootEl.className = 'kk-root';
            scrollEl.appendChild(rootEl);

            _scrollEl = scrollEl;
            _rootEl   = rootEl;

            this.create = function(){};
            this.start  = function(){
                if (Lampa.Controller) {
                    Lampa.Controller.add('content',{
                        toggle:function(){},
                        left:function(){ if(Lampa.Panel) Lampa.Panel.show(); },
                        right:function(){}, up:function(){}, down:function(){},
                        back:function(){ Lampa.Activity.backward(); }
                    });
                    Lampa.Controller.toggle('content');
                }
                navigate('home');
            };
            this.pause   = function(){};
            this.stop    = function(){ if(_infDestroy){_infDestroy();_infDestroy=null;} };
            this.render  = function(){ return scrollEl; };
            this.destroy = function(){
                if(_infDestroy){_infDestroy();_infDestroy=null;}
                scrollEl.innerHTML='';
            };
        });

        /* ── Detail component ── */
        Lampa.Component.add('kkphim_detail', function(object){
            var scrollEl = document.createElement('div');
            scrollEl.className = 'kk-scroll';

            var rootEl = document.createElement('div');
            rootEl.className = 'kk-root';
            scrollEl.appendChild(rootEl);

            this.create = function(){};
            this.start  = function(){
                if (Lampa.Controller) {
                    Lampa.Controller.add('content',{
                        toggle:function(){}, left:function(){},
                        right:function(){}, up:function(){}, down:function(){},
                        back:function(){ Lampa.Activity.backward(); }
                    });
                    Lampa.Controller.toggle('content');
                }
                renderDetail(rootEl, scrollEl, object.slug);
            };
            this.pause   = function(){};
            this.stop    = function(){};
            this.render  = function(){ return scrollEl; };
            this.destroy = function(){ scrollEl.innerHTML=''; };
        });

        /* ── Inject menu item ── */
        function injectMenu() {
            if (document.querySelector('[data-kkphim-menu]')) return;
            var menuList = document.querySelector('.menu .menu__list');
            if (!menuList) return;

            var li = document.createElement('li');
            li.className = 'menu__item selector';
            li.setAttribute('data-kkphim-menu', '1');
            li.innerHTML =
                '<div class="menu__ico">' +
                '<svg viewBox="0 0 24 24" fill="currentColor" style="width:1.4em;height:1.4em">' +
                '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                '</svg></div>' +
                '<div class="menu__text">KKPhim</div>';

            function goKK() {
                Lampa.Activity.push({ component:'kkphim', title:'KKPhim' });
            }
            li.addEventListener('click', goKK);
            $(li).on('hover:enter', goKK);

            menuList.appendChild(li);
        }

        injectMenu();
        setTimeout(injectMenu, 800);
        setTimeout(injectMenu, 2500);

        if (Lampa.Noty) Lampa.Noty.show('🎬 KKPhim sẵn sàng!', { time: 2000 });
    }

    /* ── Boot ── */
    function boot() {
        var t = 0;
        var iv = setInterval(function(){
            t += 400;
            if (typeof Lampa !== 'undefined' && Lampa.Component && Lampa.Activity) {
                clearInterval(iv); initPlugin();
            } else if (t > 15000) clearInterval(iv);
        }, 400);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

})();