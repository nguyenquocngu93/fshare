(function () {
    'use strict';

    var CONFIG = {
        api_base: 'https://phimapi.com',
        img_base: 'https://phimimg.com/',
        tmdb_key: '4ef0d7355d9ffb5151e987764708ce96',
        tmdb_img: 'https://image.tmdb.org/t/p/',
        cache_time: 1000 * 60 * 15
    };

    // ============================================================
    // STYLES
    // ============================================================
    function addStyles() {
        if (document.getElementById('kkphim-css')) return;
        var css = `
            .kk-scroll {
                position: absolute;
                inset: 0;
                overflow-y: auto;
                overflow-x: hidden;
                -webkit-overflow-scrolling: touch;
                overscroll-behavior-y: contain;
            }
            .kk-root {
                min-height: 100%;
                padding-bottom: 120px;
                box-sizing: border-box;
                color: #fff;
            }

            /* ── Nav ── */
            .kk-nav {
                position: sticky;
                top: 0;
                z-index: 100;
                display: flex;
                gap: .4em;
                padding: .6em .8em;
                overflow-x: auto;
                scrollbar-width: none;
                background: rgba(10,10,18,.95);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255,255,255,.07);
            }
            .kk-nav::-webkit-scrollbar { display: none; }
            .kk-nav__btn {
                flex-shrink: 0;
                padding: .48em .95em;
                border-radius: 2em;
                background: rgba(255,255,255,.08);
                color: rgba(255,255,255,.72);
                font-size: .78em;
                font-weight: 600;
                border: 1px solid rgba(255,255,255,.09);
                white-space: nowrap;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
            }
            .kk-nav__btn:active {
                background: rgba(229,57,53,.8);
                color: #fff;
                border-color: transparent;
                transform: scale(.95);
            }

            /* ── Section ── */
            .kk-sec {
                padding: .85em .85em .25em;
            }
            .kk-sec__head {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .kk-sec__title {
                font-size: 1em;
                font-weight: 700;
                color: #fff;
                display: flex;
                align-items: center;
                gap: .4em;
            }
            .kk-sec__title::before {
                content: '';
                width: 3px;
                height: 1em;
                background: linear-gradient(#e53935, #ff5252);
                border-radius: 3px;
                flex-shrink: 0;
            }
            .kk-sec__more {
                font-size: .72em;
                color: rgba(255,255,255,.38);
                cursor: pointer;
                padding: .28em .65em;
                border-radius: 1em;
                border: 1px solid rgba(255,255,255,.09);
                -webkit-tap-highlight-color: transparent;
                flex-shrink: 0;
            }
            .kk-sec__more:active { background: rgba(255,255,255,.08); }

            /* ── Horizontal row ── */
            .kk-row {
                display: flex;
                gap: .6em;
                padding: .5em .85em .9em;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
                scroll-snap-type: x proximity;
            }
            .kk-row::-webkit-scrollbar { display: none; }

            /* ── Grid ── */
            .kk-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: .65em;
                padding: .4em .85em .5em;
            }
            @media (min-width: 540px) { .kk-grid { grid-template-columns: repeat(4, 1fr); } }
            @media (min-width: 720px) { .kk-grid { grid-template-columns: repeat(5, 1fr); } }

            /* ════════════════════════════════
               CARD  –  giống Lampa TMDB
               poster 2:3  +  tên bên dưới
               ════════════════════════════════ */
            .kk-card {
                position: relative;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                display: flex;
                flex-direction: column;
                transition: transform .18s;
            }
            .kk-card:active { transform: scale(.95); }

            /* poster wrapper */
            .kk-card__poster {
                position: relative;
                width: 100%;
                aspect-ratio: 2/3;
                border-radius: .6em;
                overflow: hidden;
                background: #1a1a2e;
                flex-shrink: 0;
            }

            /* trong row: dùng backdrop 16:9 thay poster */
            .kk-row .kk-card {
                flex-shrink: 0;
                width: 140px;
                scroll-snap-align: start;
            }
            /* row vẫn dùng poster 2:3 – giống Lampa */

            .kk-card__img {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            /* Gradient mờ nhẹ phía dưới poster */
            .kk-card__grad {
                position: absolute;
                bottom: 0; left: 0; right: 0;
                height: 45%;
                background: linear-gradient(
                    0deg,
                    rgba(5,5,15,.85) 0%,
                    rgba(5,5,15,.0)  100%
                );
                pointer-events: none;
            }

            /* Logo TMDB overlay giữa poster */
            .kk-card__logo {
                position: absolute;
                bottom: .4em;
                left: .3em; right: .3em;
                max-height: 30%;
                object-fit: contain;
                object-position: left bottom;
                filter: drop-shadow(0 1px 6px rgba(0,0,0,.9));
                pointer-events: none;
                opacity: 0;
                transition: opacity .3s;
            }
            .kk-card__logo.vis { opacity: 1; }

            /* Badges góc trên */
            .kk-card__badges {
                position: absolute;
                top: .3em; left: .3em; right: .3em;
                display: flex;
                justify-content: space-between;
                pointer-events: none;
                z-index: 2;
            }
            .kk-bg { display: flex; gap: .2em; flex-wrap: wrap; }
            .kk-badge {
                padding: .1em .35em;
                border-radius: .25em;
                font-size: .58em;
                font-weight: 700;
                text-transform: uppercase;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                line-height: 1.4;
            }
            .kk-badge--q { background: rgba(229,57,53,.88); color: #fff; }
            .kk-badge--l { background: rgba(33,150,243,.88); color: #fff; }
            .kk-badge--y { background: rgba(255,193,7,.88);  color: #111; }
            .kk-badge--e { background: rgba(76,175,80,.88);  color: #fff; }

            /* Tên phim bên dưới poster – giống Lampa */
            .kk-card__info {
                padding: .35em .1em .1em;
                flex: 1;
            }
            .kk-card__name {
                font-size: .78em;
                font-weight: 600;
                color: rgba(255,255,255,.9);
                line-height: 1.25;
                margin: 0;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .kk-card__sub {
                font-size: .65em;
                color: rgba(255,255,255,.38);
                margin: .1em 0 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* ── Back button ── */
            .kk-back {
                display: flex;
                align-items: center;
                gap: .6em;
                padding: .85em 1em;
                min-height: 52px;
                color: rgba(255,255,255,.82);
                font-size: .92em;
                font-weight: 600;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                border-bottom: 1px solid rgba(255,255,255,.05);
            }
            .kk-back:active { background: rgba(255,255,255,.06); }
            .kk-back__ico {
                width: 36px; height: 36px;
                border-radius: 50%;
                background: rgba(255,255,255,.1);
                display: flex; align-items: center; justify-content: center;
                font-size: 1.1em;
                flex-shrink: 0;
            }

            /* ── Detail ── */
            .kk-hero {
                position: relative;
                width: 100%;
                height: 52vw;
                max-height: 260px;
                overflow: hidden;
                background: #111;
            }
            .kk-hero img.bg {
                position: absolute;
                inset: 0;
                width: 100%; height: 100%;
                object-fit: cover;
            }
            .kk-hero__grad {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    180deg,
                    rgba(10,10,18,.2)  0%,
                    rgba(10,10,18,.0) 35%,
                    rgba(10,10,18,1)  100%
                );
            }
            .kk-hero__logo {
                position: absolute;
                bottom: 4.5em; left: 50%;
                transform: translateX(-50%);
                max-width: 52%; max-height: 65px;
                object-fit: contain;
                filter: drop-shadow(0 2px 10px rgba(0,0,0,.95));
                display: none;
            }
            .kk-hero__logo.vis { display: block; }

            .kk-dbody {
                padding: 0 .85em;
                margin-top: -2em;
                position: relative;
                z-index: 2;
            }
            .kk-drow {
                display: flex;
                gap: .85em;
                align-items: flex-end;
            }
            .kk-dposter {
                flex-shrink: 0;
                width: 88px;
                aspect-ratio: 2/3;
                border-radius: .55em;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,.7);
            }
            .kk-dposter img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .kk-dmeta { flex: 1; min-width: 0; padding-bottom: .15em; }
            .kk-dtitle {
                font-size: 1.15em;
                font-weight: 800;
                color: #fff;
                margin: 0 0 .1em;
                line-height: 1.2;
            }
            .kk-dorig {
                font-size: .75em;
                color: rgba(255,255,255,.38);
                margin: 0 0 .4em;
                font-style: italic;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .kk-dtags { display: flex; flex-wrap: wrap; gap: .25em; }
            .kk-tag {
                padding: .14em .48em;
                border-radius: 1.5em;
                font-size: .63em;
                font-weight: 600;
                background: rgba(255,255,255,.08);
                color: rgba(255,255,255,.72);
                border: 1px solid rgba(255,255,255,.1);
            }
            .kk-tag--r { background: rgba(229,57,53,.2);  border-color: rgba(229,57,53,.45); }
            .kk-tag--b { background: rgba(33,150,243,.2); border-color: rgba(33,150,243,.45); }
            .kk-tag--g { background: rgba(76,175,80,.2);  border-color: rgba(76,175,80,.45); }

            .kk-actions {
                display: flex;
                gap: .5em;
                margin: .85em 0 .65em;
            }
            .kk-btn {
                display: inline-flex; align-items: center; justify-content: center;
                gap: .4em;
                padding: .7em 1.1em;
                border-radius: 2em;
                font-size: .88em; font-weight: 700;
                border: none; cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: transform .13s, opacity .13s;
                user-select: none;
            }
            .kk-btn:active { transform: scale(.93); opacity: .85; }
            .kk-btn--play {
                background: linear-gradient(135deg, #e53935, #ff5252);
                color: #fff;
                box-shadow: 0 4px 16px rgba(229,57,53,.35);
                flex: 1; min-height: 46px;
            }
            .kk-btn--fav {
                width: 46px; height: 46px; border-radius: 50%; padding: 0;
                background: rgba(255,255,255,.09);
                color: #fff; font-size: 1.15em;
                border: 1px solid rgba(255,255,255,.13);
                flex-shrink: 0;
            }

            .kk-info {
                margin: .15em 0 .55em;
                border: 1px solid rgba(255,255,255,.07);
                border-radius: .65em;
                overflow: hidden;
            }
            .kk-info__row {
                display: flex;
                padding: .5em .75em;
                font-size: .79em;
                border-bottom: 1px solid rgba(255,255,255,.05);
            }
            .kk-info__row:last-child { border-bottom: none; }
            .kk-info__label { color: rgba(255,255,255,.34); min-width: 75px; flex-shrink: 0; }
            .kk-info__val   { color: rgba(255,255,255,.82); }

            .kk-desc {
                font-size: .8em; color: rgba(255,255,255,.58);
                line-height: 1.7; margin: .35em 0;
                position: relative;
            }
            .kk-desc.col { max-height: 3.8em; overflow: hidden; }
            .kk-desc.col::after {
                content: '';
                position: absolute; bottom: 0; left: 0; right: 0;
                height: 1.8em;
                background: linear-gradient(transparent, var(--lampa-background, #0d0d18));
            }
            .kk-dtog {
                font-size: .74em; color: #e53935;
                cursor: pointer; padding: .22em 0;
                display: inline-block;
                -webkit-tap-highlight-color: transparent;
            }

            .kk-eps__sname {
                font-size: .71em; color: rgba(255,255,255,.3);
                margin-bottom: .38em; padding-bottom: .25em;
                border-bottom: 1px solid rgba(255,255,255,.06);
            }
            .kk-eps__list { display: flex; flex-wrap: wrap; gap: .35em; margin-bottom: .9em; }
            .kk-ep {
                padding: .4em .78em;
                border-radius: .5em;
                background: rgba(255,255,255,.07);
                color: rgba(255,255,255,.82);
                font-size: .74em; font-weight: 600;
                cursor: pointer;
                border: 1px solid rgba(255,255,255,.09);
                -webkit-tap-highlight-color: transparent;
                min-width: 2.4em; min-height: 34px;
                display: flex; align-items: center; justify-content: center;
                user-select: none; transition: all .13s;
            }
            .kk-ep:active, .kk-ep.playing {
                background: rgba(229,57,53,.8); color: #fff; border-color: #e53935;
            }

            /* ── Infinite loader ── */
            .kk-iload { display: none; justify-content: center; padding: 1.2em; }
            .kk-iload.on { display: flex; }
            .kk-iend {
                text-align: center; padding: 1em;
                font-size: .72em; color: rgba(255,255,255,.18); display: none;
            }
            .kk-spin {
                width: 28px; height: 28px;
                border: 3px solid rgba(255,255,255,.08);
                border-top-color: #e53935;
                border-radius: 50%;
                animation: kkspin .7s linear infinite;
            }
            @keyframes kkspin { to { transform: rotate(360deg); } }

            /* ── Loading / empty ── */
            .kk-loading { display: flex; justify-content: center; padding: 5em 2em; }
            .kk-empty {
                text-align: center; padding: 4em 1em;
                color: rgba(255,255,255,.28);
            }
            .kk-empty__i { font-size: 2.2em; margin-bottom: .3em; }

            /* ── Chips ── */
            .kk-chips { display: flex; flex-wrap: wrap; gap: .42em; padding: .4em .85em 1em; }
            .kk-chip {
                padding: .55em 1em;
                border-radius: 2em;
                background: rgba(255,255,255,.07);
                color: rgba(255,255,255,.74);
                font-size: .82em; cursor: pointer;
                border: 1px solid rgba(255,255,255,.09);
                -webkit-tap-highlight-color: transparent;
                min-height: 38px; display: flex; align-items: center;
                user-select: none;
            }
            .kk-chip:active {
                background: rgba(229,57,53,.75); color: #fff; transform: scale(.96);
            }

            /* ── Search ── */
            .kk-sbar { display: flex; gap: .45em; padding: .72em .85em; }
            .kk-sbar input {
                flex: 1; padding: .7em .95em;
                border-radius: 2em;
                border: 1px solid rgba(255,255,255,.14);
                background: rgba(255,255,255,.08);
                color: #fff; font-size: .86em;
                outline: none; -webkit-appearance: none; min-height: 44px;
            }
            .kk-sbar input::placeholder { color: rgba(255,255,255,.28); }
            .kk-sbar input:focus { border-color: #e53935; }
            .kk-sbar button {
                padding: 0 1.1em; border-radius: 2em;
                background: #e53935; color: #fff;
                font-weight: 700; border: none; cursor: pointer;
                font-size: .86em; min-height: 44px; min-width: 55px;
                -webkit-tap-highlight-color: transparent;
            }
            .kk-sbar button:active { opacity: .8; }
        `;
        var s = document.createElement('style');
        s.id = 'kkphim-css';
        s.textContent = css;
        document.head.appendChild(s);
    }

    // ============================================================
    // CACHE + FETCH
    // ============================================================
    var _c = {};
    function get(url, cb) {
        if (_c[url] && Date.now() - _c[url].t < CONFIG.cache_time) return cb(_c[url].d);
        $.ajax({
            url: url, timeout: 12000, dataType: 'json',
            success: function (d) { _c[url] = { d: d, t: Date.now() }; cb(d); },
            error:   function ()  { cb(null); }
        });
    }

    function src(p) {
        if (!p) return '';
        return p.startsWith('http') ? p : CONFIG.img_base + p;
    }

    // TMDB
    function tmdbLogo(name, year, cb) {
        if (!name) return cb(null);
        var q = encodeURIComponent(name);
        var base = 'https://api.themoviedb.org/3/search/';
        var key  = '?api_key=' + CONFIG.tmdb_key + '&query=' + q + (year ? '&year=' + year : '') + '&language=en-US&page=1';

        function getLogo(id, type) {
            get('https://api.themoviedb.org/3/' + type + '/' + id +
                '/images?api_key=' + CONFIG.tmdb_key + '&include_image_language=en,null',
            function (d) {
                if (!d || !d.logos || !d.logos.length) return cb(null);
                var pngs = d.logos.filter(function(l){ return l.file_path && l.file_path.endsWith('.png'); });
                var logo = pngs.length ? pngs[0].file_path : d.logos[0].file_path;
                cb(CONFIG.tmdb_img + 'w300' + logo);
            });
        }

        get(base + 'movie' + key, function (d) {
            if (d && d.results && d.results.length) return getLogo(d.results[0].id, 'movie');
            get(base + 'tv' + key.replace('year','first_air_date_year'), function (d2) {
                if (d2 && d2.results && d2.results.length) return getLogo(d2.results[0].id, 'tv');
                cb(null);
            });
        });
    }

    // ============================================================
    // HTML HELPERS
    // ============================================================
    function spin()  { return '<div class="kk-loading"><div class="kk-spin"></div></div>'; }
    function empty(m){ return '<div class="kk-empty"><div class="kk-empty__i">📭</div><div>'+(m||'Không có dữ liệu')+'</div></div>'; }

    function backH() {
        return '<div class="kk-back" data-back="1"><div class="kk-back__ico">‹</div>Quay lại</div>';
    }
    function infoR(l, v) {
        return '<div class="kk-info__row"><span class="kk-info__label">'+l+'</span><span class="kk-info__val">'+v+'</span></div>';
    }

    /* Card – giống Lampa: poster 2:3 + tên bên dưới */
    function cardH(item) {
        var name  = item.name || '';
        var orig  = item.origin_name || '';
        var slug  = item.slug || '';
        var q     = item.quality || '';
        var lang  = item.lang   || '';
        var year  = item.year   || '';
        var ep    = item.episode_current || '';
        // dùng thumb_url (poster) làm ảnh chính
        var poster   = src(item.thumb_url  || item.poster_url);
        var fallback = src(item.poster_url || item.thumb_url);

        return [
            '<div class="kk-card" data-slug="'+slug+'">',
              '<div class="kk-card__poster">',
                /* badges */
                '<div class="kk-card__badges">',
                  '<div class="kk-bg">',
                    q    ? '<span class="kk-badge kk-badge--q">'+q+'</span>'    : '',
                    lang ? '<span class="kk-badge kk-badge--l">'+lang+'</span>' : '',
                  '</div>',
                  '<div class="kk-bg">',
                    year ? '<span class="kk-badge kk-badge--y">'+year+'</span>' : '',
                    ep   ? '<span class="kk-badge kk-badge--e">'+ep+'</span>'   : '',
                  '</div>',
                '</div>',
                /* ảnh poster */
                '<img class="kk-card__img"',
                  ' src="'+poster+'"',
                  ' loading="lazy"',
                  ' onerror="this.src=\''+fallback+'\';this.onerror=null"',
                '>',
                /* gradient nhẹ phía dưới */
                '<div class="kk-card__grad"></div>',
                /* logo TMDB – load async, key = origin_name|year */
                '<img class="kk-card__logo"',
                  ' data-n="'+encodeURIComponent(orig||name)+'"',
                  ' data-y="'+(year||'')+'">',
              '</div>',
              /* tên phim bên dưới poster */
              '<div class="kk-card__info">',
                '<p class="kk-card__name">'+name+'</p>',
                orig && orig !== name ? '<p class="kk-card__sub">'+orig+'</p>' : '',
              '</div>',
            '</div>'
        ].join('');
    }

    /* Load logo TMDB cho các card trong container (batch nhỏ) */
    function loadLogos(container) {
        var imgs = container.querySelectorAll('.kk-card__logo[data-n]');
        // chỉ load tối đa 8 cái để không spam API
        var batch = Array.prototype.slice.call(imgs, 0, 8);
        batch.forEach(function (img) {
            var name = decodeURIComponent(img.getAttribute('data-n') || '');
            var year = img.getAttribute('data-y') || '';
            img.removeAttribute('data-n'); // tránh load lại
            if (!name) return;
            tmdbLogo(name, year, function (logoUrl) {
                if (!logoUrl || !img.parentElement) return;
                img.src = logoUrl;
                img.onload = function () { img.classList.add('vis'); };
            });
        });
    }

    // ============================================================
    // API FETCH helpers
    // ============================================================
    function fNew(page, cb) {
        get(CONFIG.api_base + '/danh-sach/phim-moi-cap-nhat?page=' + page, function (d) {
            if (!d || !d.items) return cb([], 1);
            var tot = d.pagination ? (d.pagination.totalPages || 1) : 1;
            cb(d.items, tot);
        });
    }
    function fList(type, page, cb) {
        get(CONFIG.api_base + '/v1/api/danh-sach/' + type + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pg = (d.data.params && d.data.params.pagination) || {};
            cb(d.data.items, Math.ceil((pg.totalItems||0)/(pg.totalItemsPerPage||24))||1);
        });
    }
    function fCat(slug, page, cb) {
        get(CONFIG.api_base + '/v1/api/the-loai/' + slug + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pg = (d.data.params && d.data.params.pagination) || {};
            cb(d.data.items, Math.ceil((pg.totalItems||0)/(pg.totalItemsPerPage||24))||1);
        });
    }
    function fCountry(slug, page, cb) {
        get(CONFIG.api_base + '/v1/api/quoc-gia/' + slug + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pg = (d.data.params && d.data.params.pagination) || {};
            cb(d.data.items, Math.ceil((pg.totalItems||0)/(pg.totalItemsPerPage||24))||1);
        });
    }
    function fSearch(kw, page, cb) {
        get(CONFIG.api_base + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pg = (d.data.params && d.data.params.pagination) || {};
            cb(d.data.items, Math.ceil((pg.totalItems||0)/(pg.totalItemsPerPage||24))||1);
        });
    }

    // ============================================================
    // INFINITE SCROLL
    // ============================================================
    function InfScroll(grid, scrollEl, fetchFn, onEmpty) {
        var self  = this;
        this.page  = 0;
        this.total = 1;
        this.busy  = false;
        this.done  = false;

        this._loader = document.createElement('div');
        this._loader.className = 'kk-iload';
        this._loader.innerHTML = '<div class="kk-spin"></div>';

        this._end = document.createElement('div');
        this._end.className = 'kk-iend';
        this._end.textContent = '— Đã hết —';

        grid.parentElement.appendChild(this._loader);
        grid.parentElement.appendChild(this._end);

        this._onScroll = function () {
            if (self.done || self.busy) return;
            var rem = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
            if (rem < 380) self.load();
        };
        scrollEl.addEventListener('scroll', this._onScroll, { passive: true });

        this.load = function () {
            if (self.busy || self.done) return;
            self.busy = true;
            self._loader.classList.add('on');

            fetchFn(self.page + 1, function (items, total) {
                self.busy = false;
                self._loader.classList.remove('on');
                self.total = total || 1;
                self.page++;

                if (!items || !items.length) {
                    if (self.page === 1 && onEmpty) onEmpty();
                    self.finish(); return;
                }

                var frag = document.createDocumentFragment();
                items.forEach(function (item) {
                    var tmp = document.createElement('div');
                    tmp.innerHTML = cardH(item);
                    var card = tmp.firstElementChild;
                    card.addEventListener('click', function () {
                        openDetail(this.dataset.slug);
                    });
                    frag.appendChild(card);
                });
                grid.appendChild(frag);
                loadLogos(grid);

                if (self.page >= self.total) self.finish();
            });
        };

        this.finish = function () {
            self.done = true;
            self._loader.classList.remove('on');
            self._end.style.display = 'block';
            scrollEl.removeEventListener('scroll', self._onScroll);
        };

        this.destroy = function () {
            self.done = true;
            scrollEl.removeEventListener('scroll', self._onScroll);
        };

        this.load(); // start
    }

    // ============================================================
    // NAVIGATE + VIEWS  (per-component, không dùng global)
    // ============================================================
    function openDetail(slug) {
        if (typeof Lampa !== 'undefined' && Lampa.Activity) {
            Lampa.Activity.push({ component: 'kkphim_detail', slug: slug, title: 'KKPhim' });
        }
    }

    function bindBack(el) {
        el.querySelectorAll('[data-back]').forEach(function (b) {
            b.addEventListener('click', function () {
                if (typeof Lampa !== 'undefined' && Lampa.Activity) Lampa.Activity.backward();
            });
        });
    }

    function playVideo(link, title) {
        if (!link) return;
        try {
            if (typeof Lampa !== 'undefined' && Lampa.Player) {
                var it = { title: title || 'KKPhim', url: link };
                Lampa.Player.play(it);
                Lampa.Player.playlist([it]);
            } else { window.open(link, '_blank'); }
        } catch (e) { window.open(link, '_blank'); }
    }

    /* ── Tạo controller cho từng component ── */
    function makeController(scrollEl) {
        return {
            toggle : function () {},
            left   : function () { if (typeof Lampa !== 'undefined' && Lampa.Panel) Lampa.Panel.show(); },
            right  : function () {},
            up     : function () { scrollEl.scrollBy({ top: -120, behavior: 'smooth' }); },
            down   : function () { scrollEl.scrollBy({ top:  120, behavior: 'smooth' }); },
            back   : function () { if (typeof Lampa !== 'undefined' && Lampa.Activity) Lampa.Activity.backward(); }
        };
    }

    /* ── Home ── */
    function buildHome(rootEl, scrollEl) {
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

        var secDefs = [
            { key:'n', title:'Phim Mới',  view:'new',  slug:'',          fn: function(cb){ fNew(1,cb); } },
            { key:'l', title:'Phim Lẻ',   view:'list', slug:'phim-le',   fn: function(cb){ fList('phim-le',1,cb); } },
            { key:'b', title:'Phim Bộ',   view:'list', slug:'phim-bo',   fn: function(cb){ fList('phim-bo',1,cb); } },
            { key:'a', title:'Hoạt Hình', view:'list', slug:'hoat-hinh', fn: function(cb){ fList('hoat-hinh',1,cb); } }
        ];

        var html = '<div class="kk-nav">' +
            navItems.map(function(n){
                return '<div class="kk-nav__btn" data-v="'+n.view+'"'+(n.slug?' data-s="'+n.slug+'"':'')+'>'+n.icon+' '+n.text+'</div>';
            }).join('') + '</div>' +
            secDefs.map(function(s){
                return '<div class="kk-sec"><div class="kk-sec__head">' +
                    '<div class="kk-sec__title">'+s.title+'</div>' +
                    '<div class="kk-sec__more" data-v="'+s.view+'"'+(s.slug?' data-s="'+s.slug+'"':'')+'>Xem thêm ›</div>' +
                    '</div></div>' +
                    '<div class="kk-row" id="kkrow-'+s.key+'"><div class="kk-spin" style="display:block;margin:.9em auto"></div></div>';
            }).join('');

        rootEl.innerHTML = html;

        /* nav bind */
        rootEl.querySelectorAll('.kk-nav__btn,.kk-sec__more').forEach(function (b) {
            b.addEventListener('click', function () {
                navigate(rootEl, scrollEl, this.dataset.v, { slug: this.dataset.s });
            });
        });

        /* load rows */
        secDefs.forEach(function (s) {
            s.fn(function (items) {
                var row = document.getElementById('kkrow-' + s.key);
                if (!row) return;
                if (!items || !items.length) { row.innerHTML = ''; return; }
                row.innerHTML = items.slice(0, 14).map(cardH).join('');
                row.querySelectorAll('.kk-card').forEach(function (c) {
                    c.addEventListener('click', function () { openDetail(this.dataset.slug); });
                });
                loadLogos(row);
            });
        });
    }

    /* ── Infinite list ── */
    function buildInfList(rootEl, scrollEl, title, fetchFn) {
        rootEl.innerHTML =
            backH() +
            '<div class="kk-sec"><div class="kk-sec__title">'+title+'</div></div>' +
            '<div class="kk-grid" id="kk-ig"></div>';

        bindBack(rootEl);

        var grid = rootEl.querySelector('#kk-ig');
        return new InfScroll(grid, scrollEl, fetchFn, function () {
            grid.innerHTML = empty();
        });
    }

    /* ── Search ── */
    function buildSearch(rootEl, scrollEl, keyword) {
        rootEl.innerHTML =
            backH() +
            '<div class="kk-sbar">' +
            '<input id="kk-si" type="text" placeholder="Nhập tên phim..." value="'+(keyword ? keyword.replace(/"/g,'&quot;') : '')+'">' +
            '<button id="kk-sg">🔍</button></div>' +
            '<div id="kk-sa"></div>';

        bindBack(rootEl);
        var input  = rootEl.querySelector('#kk-si');
        var goBtn  = rootEl.querySelector('#kk-sg');
        var area   = rootEl.querySelector('#kk-sa');
        var inf    = null;

        function doSearch() {
            var kw = input.value.trim();
            if (!kw) return;
            if (inf) { inf.destroy(); inf = null; }
            area.innerHTML = '<div class="kk-grid" id="kk-ig"></div>';
            var grid = area.querySelector('#kk-ig');
            inf = new InfScroll(grid, scrollEl,
                function (p, cb) { fSearch(kw, p, cb); },
                function () { grid.innerHTML = empty('Không tìm thấy "'+kw+'"'); }
            );
        }

        goBtn.addEventListener('click', doSearch);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
        if (keyword) { doSearch(); }
        else { setTimeout(function () { input.focus(); }, 300); }

        return { destroy: function () { if (inf) inf.destroy(); } };
    }

    /* ── Categories ── */
    function buildCategories(rootEl, scrollEl) {
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
        rootEl.innerHTML = backH() +
            '<div class="kk-sec"><div class="kk-sec__title">Thể Loại Phim</div></div>' +
            '<div class="kk-chips">' +
            cats.map(function(c){ return '<div class="kk-chip" data-s="'+c.slug+'">'+c.name+'</div>'; }).join('') +
            '</div>';
        bindBack(rootEl);
        rootEl.querySelectorAll('.kk-chip').forEach(function (ch) {
            ch.addEventListener('click', function () {
                navigate(rootEl, scrollEl, 'category', { slug: this.dataset.s });
            });
        });
    }

    /* ── Countries ── */
    function buildCountries(rootEl, scrollEl) {
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
        rootEl.innerHTML = backH() +
            '<div class="kk-sec"><div class="kk-sec__title">Quốc Gia</div></div>' +
            '<div class="kk-chips">' +
            list.map(function(c){ return '<div class="kk-chip" data-s="'+c.slug+'">'+c.name+'</div>'; }).join('') +
            '</div>';
        bindBack(rootEl);
        rootEl.querySelectorAll('.kk-chip').forEach(function (ch) {
            ch.addEventListener('click', function () {
                navigate(rootEl, scrollEl, 'country', { slug: this.dataset.s });
            });
        });
    }

    /* ── Navigate (in-page, per component) ── */
    var _curInf = null;

    function navigate(rootEl, scrollEl, view, params) {
        params = params || {};
        if (_curInf) { _curInf.destroy(); _curInf = null; }
        rootEl.innerHTML = spin();
        scrollEl.scrollTop = 0;

        var tmap = {
            'new':'🆕 Phim Mới','phim-le':'🎬 Phim Lẻ',
            'phim-bo':'📺 Phim Bộ','hoat-hinh':'🎭 Hoạt Hình','tv-shows':'📡 TV Shows'
        };

        switch (view) {
            case 'home':
                buildHome(rootEl, scrollEl);
                break;
            case 'new':
                _curInf = buildInfList(rootEl, scrollEl, '🆕 Phim Mới', function(p,cb){ fNew(p,cb); });
                break;
            case 'list':
                _curInf = buildInfList(rootEl, scrollEl, tmap[params.slug]||params.slug, function(p,cb){ fList(params.slug,p,cb); });
                break;
            case 'category':
                _curInf = buildInfList(rootEl, scrollEl, params.slug, function(p,cb){ fCat(params.slug,p,cb); });
                break;
            case 'country':
                _curInf = buildInfList(rootEl, scrollEl, params.slug, function(p,cb){ fCountry(params.slug,p,cb); });
                break;
            case 'categories':
                buildCategories(rootEl, scrollEl);
                break;
            case 'countries':
                buildCountries(rootEl, scrollEl);
                break;
            case 'search':
                _curInf = buildSearch(rootEl, scrollEl, params.keyword || null);
                break;
        }
    }

    /* ── Detail ── */
    function buildDetail(rootEl, scrollEl, slug) {
        rootEl.innerHTML = spin();
        scrollEl.scrollTop = 0;

        get(CONFIG.api_base + '/phim/' + slug, function (data) {
            if (!data || !data.movie) {
                rootEl.innerHTML = backH() + empty('Không tìm thấy phim');
                bindBack(rootEl); return;
            }

            var m   = data.movie;
            var eps = data.episodes || [];
            var backdrop = src(m.poster_url || m.thumb_url);
            var thumb    = src(m.thumb_url  || m.poster_url);
            var origName = m.origin_name || m.name || '';

            var firstLink = '';
            if (eps.length && eps[0].server_data && eps[0].server_data.length) {
                firstLink = eps[0].server_data[0].link_m3u8 || eps[0].server_data[0].link_embed || '';
            }

            var h = backH();

            // Hero
            h += '<div class="kk-hero">';
            h += '<img class="bg" src="'+backdrop+'" onerror="this.style.opacity=0">';
            h += '<img class="kk-hero__logo" id="dlogo">';
            h += '<div class="kk-hero__grad"></div>';
            h += '</div>';

            // Body
            h += '<div class="kk-dbody">';
            h += '<div class="kk-drow">';
            h += '<div class="kk-dposter"><img src="'+thumb+'" onerror="this.style.opacity=0"></div>';
            h += '<div class="kk-dmeta">';
            h += '<h1 class="kk-dtitle">'+(m.name||'')+'</h1>';
            if (m.origin_name) h += '<p class="kk-dorig">'+m.origin_name+'</p>';
            h += '<div class="kk-dtags">';
            if (m.quality) h += '<span class="kk-tag kk-tag--r">'+m.quality+'</span>';
            if (m.lang)    h += '<span class="kk-tag kk-tag--b">'+m.lang+'</span>';
            if (m.year)    h += '<span class="kk-tag">'+m.year+'</span>';
            if (m.episode_current) h += '<span class="kk-tag kk-tag--g">'+m.episode_current+'</span>';
            if (m.time)    h += '<span class="kk-tag">⏱ '+m.time+'</span>';
            h += '</div></div></div>';

            // Buttons
            h += '<div class="kk-actions">';
            h += '<div class="kk-btn kk-btn--play" data-link="'+firstLink+'" data-name="'+(m.name||'')+'">▶ Xem Phim</div>';
            h += '<div class="kk-btn kk-btn--fav">♡</div>';
            h += '</div>';

            // Info table
            h += '<div class="kk-info">';
            if (m.status)        h += infoR('Trạng thái', m.status);
            if (m.episode_total) h += infoR('Tổng tập',   m.episode_total);
            if (m.country  && m.country.length)  h += infoR('Quốc gia',  m.country.map(function(c){return c.name;}).join(', '));
            if (m.category && m.category.length) h += infoR('Thể loại',  m.category.map(function(c){return c.name;}).join(', '));
            if (m.director && m.director.length && m.director[0]) h += infoR('Đạo diễn', m.director.join(', '));
            if (m.actor    && m.actor.length    && m.actor[0])    h += infoR('Diễn viên',m.actor.slice(0,5).join(', '));
            h += '</div>';

            // Desc
            if (m.content) {
                var desc = m.content.replace(/<[^>]*>/g, '');
                h += '<div class="kk-desc col" id="ddesc">'+desc+'</div>';
                h += '<div class="kk-dtog" id="dtog">Xem thêm ▾</div>';
            }
            h += '</div>'; // dbody

            // Episodes
            if (eps.length) {
                h += '<div class="kk-sec" style="margin-top:.3em"><div class="kk-sec__title">Danh Sách Tập</div></div>';
                h += '<div style="padding:0 .85em 1em">';
                eps.forEach(function (sv) {
                    if (!sv.server_data || !sv.server_data.length) return;
                    h += '<div class="kk-eps__sname">'+(sv.server_name||'Server')+'</div>';
                    h += '<div class="kk-eps__list">';
                    sv.server_data.forEach(function (ep) {
                        var n = ep.name || ep.slug || '';
                        var l = ep.link_m3u8 || ep.link_embed || '';
                        h += '<div class="kk-ep" data-link="'+l+'" data-name="'+(m.name||'')+' – Tập '+n+'">'+n+'</div>';
                    });
                    h += '</div>';
                });
                h += '</div>';
            }

            rootEl.innerHTML = h;
            bindBack(rootEl);

            // play
            rootEl.querySelectorAll('.kk-btn--play, .kk-ep').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    playVideo(this.dataset.link, this.dataset.name);
                    rootEl.querySelectorAll('.kk-ep').forEach(function (e) { e.classList.remove('playing'); });
                    if (this.classList.contains('kk-ep')) this.classList.add('playing');
                });
            });

            // desc toggle
            var descEl = rootEl.querySelector('#ddesc');
            var dtog   = rootEl.querySelector('#dtog');
            if (descEl && dtog) {
                dtog.addEventListener('click', function () {
                    var c = descEl.classList.toggle('col');
                    dtog.textContent = c ? 'Xem thêm ▾' : 'Thu gọn ▴';
                });
            }

            // TMDB logo
            var dlogo = rootEl.querySelector('#dlogo');
            if (dlogo && origName) {
                tmdbLogo(origName, m.year, function (url) {
                    if (!url || !dlogo.parentElement) return;
                    dlogo.src = url;
                    dlogo.onload = function () { dlogo.classList.add('vis'); };
                });
            }
        });
    }

    // ============================================================
    // LAMPA COMPONENTS
    // ============================================================
    function initPlugin() {
        addStyles();
        if (typeof Lampa === 'undefined') return;

        /* ── Main component ── */
        Lampa.Component.add('kkphim', function () {
            var self = this;

            var scrollEl = document.createElement('div');
            scrollEl.className = 'kk-scroll';

            var rootEl = document.createElement('div');
            rootEl.className = 'kk-root';
            scrollEl.appendChild(rootEl);

            self.create = function () {
                // build home ngay khi create để tránh màn trắng
                buildHome(rootEl, scrollEl);
            };

            self.start = function () {
                if (Lampa.Controller) {
                    Lampa.Controller.add('content', makeController(scrollEl));
                    Lampa.Controller.toggle('content');
                }
            };

            self.pause   = function () {};
            self.stop    = function () {
                if (_curInf) { _curInf.destroy(); _curInf = null; }
            };
            self.render  = function () { return scrollEl; };
            self.destroy = function () {
                if (_curInf) { _curInf.destroy(); _curInf = null; }
                scrollEl.innerHTML = '';
            };
        });

        /* ── Detail component ── */
        Lampa.Component.add('kkphim_detail', function (object) {
            var self = this;

            var scrollEl = document.createElement('div');
            scrollEl.className = 'kk-scroll';

            var rootEl = document.createElement('div');
            rootEl.className = 'kk-root';
            scrollEl.appendChild(rootEl);

            self.create = function () {
                buildDetail(rootEl, scrollEl, object.slug);
            };

            self.start = function () {
                if (Lampa.Controller) {
                    Lampa.Controller.add('content', makeController(scrollEl));
                    Lampa.Controller.toggle('content');
                }
            };

            self.pause   = function () {};
            self.stop    = function () {};
            self.render  = function () { return scrollEl; };
            self.destroy = function () { scrollEl.innerHTML = ''; };
        });

        /* ── Menu inject ── */
        function injectMenu() {
            if (document.querySelector('[data-kkm]')) return;
            var list = document.querySelector('.menu .menu__list');
            if (!list) return;

            var li = document.createElement('li');
            li.className = 'menu__item selector';
            li.setAttribute('data-kkm', '1');
            li.innerHTML =
                '<div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor" style="width:1.35em;height:1.35em">' +
                '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                '</svg></div><div class="menu__text">KKPhim</div>';

            function go() {
                Lampa.Activity.push({ component: 'kkphim', title: 'KKPhim' });
            }
            li.addEventListener('click', go);
            $(li).on('hover:enter', go);
            list.appendChild(li);
        }

        injectMenu();
        setTimeout(injectMenu, 1000);
        setTimeout(injectMenu, 3000);

        if (Lampa.Noty) Lampa.Noty.show('🎬 KKPhim sẵn sàng!', { time: 2000 });
        console.log('[KKPhim] OK');
    }

    /* ── Boot ── */
    function boot() {
        var t = 0, iv = setInterval(function () {
            t += 400;
            if (typeof Lampa !== 'undefined' && Lampa.Component && Lampa.Activity) {
                clearInterval(iv);
                initPlugin();
            } else if (t > 15000) clearInterval(iv);
        }, 400);
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', boot)
        : boot();

})();