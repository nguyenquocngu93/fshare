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
    // DEBUG HELPER
    // ============================================================
    function log() {
        var args = Array.prototype.slice.call(arguments);
        console.log.apply(console, ['[KKPhim]'].concat(args));
    }

    // ============================================================
    // CACHE + FETCH
    // ============================================================
    var _cache = {};

    function apiFetch(url, cb) {
        if (_cache[url] && Date.now() - _cache[url].t < CONFIG.cache_time) {
            return setTimeout(function () { cb(_cache[url].d); }, 0);
        }
        Lampa.Api.send({
            url: url,
            success: function (d) { _cache[url] = { d: d, t: Date.now() }; cb(d); },
            error:   function ()  { cb(null); }
        });
    }

    function imgSrc(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return CONFIG.img_base + path;
    }

    // ============================================================
    // CONVERT KKPhim item → Lampa card object
    // Lampa card cần: id, title, original_title, poster_path,
    //                 backdrop_path, release_date, vote_average,
    //                 overview, media_type
    // ============================================================
    function toCard(item) {
        var thumb    = imgSrc(item.thumb_url  || item.poster_url || '');
        var backdrop = imgSrc(item.poster_url || item.thumb_url  || '');
        var year     = item.year ? String(item.year) : '';

        return {
            // IDs
            id            : item.slug || item._id || Math.random(),
            kk_slug       : item.slug || '',

            // Text
            title         : item.name         || item.origin_name || '',
            original_title: item.origin_name  || item.name        || '',
            name          : item.name         || '',
            original_name : item.origin_name  || '',
            overview      : item.content      || '',

            // Images – dùng full URL vì không có TMDB id
            poster_path   : thumb,
            backdrop_path : backdrop,
            img           : thumb,

            // Meta
            release_date  : year ? year + '-01-01' : '',
            first_air_date: year ? year + '-01-01' : '',
            vote_average  : 0,
            vote_count    : 0,
            media_type    : item.type === 'series' ? 'tv' : 'movie',
            number_of_seasons: 1,

            // KKPhim extra
            quality       : item.quality       || '',
            lang          : item.lang          || '',
            episode_current: item.episode_current || '',
            kk_year       : year,

            // Flags cho Lampa biết đây là KKPhim item
            source        : 'kkphim',
            ready         : true
        };
    }

    // ============================================================
    // FETCH helpers
    // ============================================================
    function fNew(page, cb) {
        apiFetch(CONFIG.api_base + '/danh-sach/phim-moi-cap-nhat?page=' + page, function (d) {
            if (!d || !d.items) return cb([], 1);
            var tot = d.pagination ? (d.pagination.totalPages || 1) : 1;
            cb(d.items.map(toCard), tot);
        });
    }

    function fList(type, page, cb) {
        apiFetch(CONFIG.api_base + '/v1/api/danh-sach/' + type + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pg = (d.data.params && d.data.params.pagination) || {};
            var tot = Math.ceil((pg.totalItems || 0) / (pg.totalItemsPerPage || 24)) || 1;
            cb(d.data.items.map(toCard), tot);
        });
    }

    function fCat(slug, page, cb) {
        apiFetch(CONFIG.api_base + '/v1/api/the-loai/' + slug + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pg = (d.data.params && d.data.params.pagination) || {};
            var tot = Math.ceil((pg.totalItems || 0) / (pg.totalItemsPerPage || 24)) || 1;
            cb(d.data.items.map(toCard), tot);
        });
    }

    function fCountry(slug, page, cb) {
        apiFetch(CONFIG.api_base + '/v1/api/quoc-gia/' + slug + '?page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pg = (d.data.params && d.data.params.pagination) || {};
            var tot = Math.ceil((pg.totalItems || 0) / (pg.totalItemsPerPage || 24)) || 1;
            cb(d.data.items.map(toCard), tot);
        });
    }

    function fSearch(kw, page, cb) {
        apiFetch(CONFIG.api_base + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, function (d) {
            if (!d || !d.data || !d.data.items) return cb([], 1);
            var pg = (d.data.params && d.data.params.pagination) || {};
            var tot = Math.ceil((pg.totalItems || 0) / (pg.totalItemsPerPage || 24)) || 1;
            cb(d.data.items.map(toCard), tot);
        });
    }

    // ============================================================
    // LAMPA CARD RENDER
    // Dùng Lampa.Template để tạo card đúng chuẩn
    // ============================================================
    function createLampaCard(cardObj, onClick) {
        // Lampa.Card.build hoặc tạo thủ công theo structure Lampa
        var poster   = cardObj.poster_path   || '';
        var backdrop = cardObj.backdrop_path || poster;
        var title    = cardObj.title         || cardObj.name || '';
        var year     = cardObj.kk_year       || '';
        var quality  = cardObj.quality       || '';
        var lang     = cardObj.lang          || '';
        var ep       = cardObj.episode_current || '';

        // Tạo element theo đúng class Lampa dùng
        var el = document.createElement('div');
        el.className = 'card selector';
        el.style.cssText = 'flex-shrink:0;cursor:pointer;-webkit-tap-highlight-color:transparent;';

        var badgeHtml = '';
        if (quality) badgeHtml += '<span class="kk-b kk-b--q">'+quality+'</span>';
        if (lang)    badgeHtml += '<span class="kk-b kk-b--l">'+lang+'</span>';
        if (ep)      badgeHtml += '<span class="kk-b kk-b--e">'+ep+'</span>';
        if (year)    badgeHtml += '<span class="kk-b kk-b--y">'+year+'</span>';

        el.innerHTML = [
            '<div class="card__img--wrap">',
              '<img class="card__img" src="'+poster+'" loading="lazy"',
                ' onerror="this.src=\''+backdrop+'\';this.onerror=null">',
              badgeHtml ? '<div class="kk-badges">'+badgeHtml+'</div>' : '',
            '</div>',
            '<div class="card__title">'+title+'</div>'
        ].join('');

        el.addEventListener('click', function () { if (onClick) onClick(cardObj); });
        // Lampa TV hover
        el.addEventListener('hover:enter', function () { if (onClick) onClick(cardObj); });

        return el;
    }

    // ============================================================
    // STYLES (minimal – reuse Lampa classes)
    // ============================================================
    function addStyles() {
        if (document.getElementById('kk-style')) return;
        var css = `
            /* Badges trên card */
            .kk-badges {
                position: absolute;
                top: .3em; left: .3em; right: .3em;
                display: flex; gap: .2em; flex-wrap: wrap;
                pointer-events: none; z-index: 5;
            }
            .kk-b {
                padding: .1em .38em;
                border-radius: .25em;
                font-size: .58em; font-weight: 700;
                text-transform: uppercase;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                line-height: 1.4;
            }
            .kk-b--q { background: rgba(229,57,53,.9);  color: #fff; }
            .kk-b--l { background: rgba(33,150,243,.9); color: #fff; }
            .kk-b--e { background: rgba(76,175,80,.9);  color: #fff; }
            .kk-b--y { background: rgba(255,193,7,.9);  color: #111; }

            /* Card img wrapper cần position relative */
            .card__img--wrap { position: relative; }

            /* Nav pills */
            .kk-nav {
                display: flex; gap: .4em;
                padding: .65em .8em;
                overflow-x: auto; scrollbar-width: none;
                background: rgba(10,10,18,.93);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255,255,255,.07);
                position: sticky; top: 0; z-index: 100;
            }
            .kk-nav::-webkit-scrollbar { display: none; }
            .kk-nav__btn {
                flex-shrink: 0;
                padding: .46em .92em;
                border-radius: 2em;
                background: rgba(255,255,255,.08);
                color: rgba(255,255,255,.72);
                font-size: .78em; font-weight: 600;
                border: 1px solid rgba(255,255,255,.09);
                white-space: nowrap; cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
            }
            .kk-nav__btn:active {
                background: rgba(229,57,53,.8); color: #fff; border-color: transparent;
            }

            /* Section header */
            .kk-sh {
                display: flex; justify-content: space-between;
                align-items: center; padding: .8em .8em .2em;
            }
            .kk-sh__t {
                font-size: 1em; font-weight: 700; color: #fff;
                display: flex; align-items: center; gap: .4em;
            }
            .kk-sh__t::before {
                content: ''; width: 3px; height: 1em;
                background: linear-gradient(#e53935, #ff5252);
                border-radius: 3px; flex-shrink: 0;
            }
            .kk-sh__more {
                font-size: .72em; color: rgba(255,255,255,.4);
                cursor: pointer; padding: .28em .62em;
                border-radius: 1em; border: 1px solid rgba(255,255,255,.1);
                -webkit-tap-highlight-color: transparent;
            }
            .kk-sh__more:active { background: rgba(255,255,255,.08); }

            /* Infinite loader */
            .kk-iload {
                display: none; justify-content: center; padding: 1.2em;
            }
            .kk-iload.on { display: flex; }
            .kk-iend {
                text-align: center; padding: 1em;
                font-size: .72em; color: rgba(255,255,255,.18); display: none;
            }
            .kk-spin {
                width: 28px; height: 28px;
                border: 3px solid rgba(255,255,255,.08);
                border-top-color: #e53935; border-radius: 50%;
                animation: kkspin .7s linear infinite;
            }
            @keyframes kkspin { to { transform: rotate(360deg); } }

            /* Back button */
            .kk-back {
                display: flex; align-items: center; gap: .6em;
                padding: .85em 1em; min-height: 52px;
                color: rgba(255,255,255,.82); font-size: .92em; font-weight: 600;
                cursor: pointer; -webkit-tap-highlight-color: transparent;
                border-bottom: 1px solid rgba(255,255,255,.06); user-select: none;
            }
            .kk-back:active { background: rgba(255,255,255,.06); }
            .kk-back__i {
                width: 36px; height: 36px; border-radius: 50%;
                background: rgba(255,255,255,.1);
                display: flex; align-items: center; justify-content: center;
                font-size: 1.1em; flex-shrink: 0;
            }

            /* Chips */
            .kk-chips { display: flex; flex-wrap: wrap; gap: .42em; padding: .4em .8em 1em; }
            .kk-chip {
                padding: .55em 1em; border-radius: 2em;
                background: rgba(255,255,255,.07); color: rgba(255,255,255,.74);
                font-size: .82em; cursor: pointer;
                border: 1px solid rgba(255,255,255,.09);
                -webkit-tap-highlight-color: transparent;
                min-height: 38px; display: flex; align-items: center; user-select: none;
            }
            .kk-chip:active { background: rgba(229,57,53,.75); color: #fff; }

            /* Search */
            .kk-sbar { display: flex; gap: .45em; padding: .72em .8em; }
            .kk-sbar input {
                flex: 1; padding: .7em .95em; border-radius: 2em;
                border: 1px solid rgba(255,255,255,.14);
                background: rgba(255,255,255,.08); color: #fff;
                font-size: .86em; outline: none; -webkit-appearance: none; min-height: 44px;
            }
            .kk-sbar input::placeholder { color: rgba(255,255,255,.28); }
            .kk-sbar input:focus { border-color: #e53935; }
            .kk-sbar button {
                padding: 0 1.1em; border-radius: 2em;
                background: #e53935; color: #fff; font-weight: 700;
                border: none; cursor: pointer; font-size: .86em;
                min-height: 44px; min-width: 55px;
                -webkit-tap-highlight-color: transparent;
            }
            .kk-sbar button:active { opacity: .8; }

            /* Empty */
            .kk-empty {
                text-align: center; padding: 4em 1em; color: rgba(255,255,255,.28);
            }
            .kk-empty__i { font-size: 2.2em; margin-bottom: .3em; }

            /* Detail */
            .kk-hero {
                position: relative; width: 100%;
                height: 52vw; max-height: 260px; overflow: hidden; background: #111;
            }
            .kk-hero__bg {
                position: absolute; inset: 0;
                width: 100%; height: 100%; object-fit: cover;
            }
            .kk-hero__grad {
                position: absolute; inset: 0;
                background: linear-gradient(180deg,
                    rgba(10,10,18,.15) 0%, rgba(10,10,18,0) 35%,
                    rgba(10,10,18,1) 100%);
            }
            .kk-hero__logo {
                position: absolute; bottom: 4em; left: 50%;
                transform: translateX(-50%);
                max-width: 52%; max-height: 60px; object-fit: contain;
                filter: drop-shadow(0 2px 10px rgba(0,0,0,.95)); display: none;
            }
            .kk-hero__logo.vis { display: block; }

            .kk-dbody { padding: 0 .85em; margin-top: -1.8em; position: relative; z-index: 2; }
            .kk-drow  { display: flex; gap: .85em; align-items: flex-end; }
            .kk-dposter {
                flex-shrink: 0; width: 85px; aspect-ratio: 2/3;
                border-radius: .55em; overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,.7);
            }
            .kk-dposter img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .kk-dmeta { flex: 1; min-width: 0; padding-bottom: .15em; }
            .kk-dtitle { font-size: 1.15em; font-weight: 800; color: #fff; margin: 0 0 .1em; line-height: 1.2; }
            .kk-dorig  { font-size: .74em; color: rgba(255,255,255,.38); margin: 0 0 .4em; font-style: italic;
                         white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .kk-dtags  { display: flex; flex-wrap: wrap; gap: .25em; }
            .kk-tag {
                padding: .13em .46em; border-radius: 1.5em; font-size: .62em; font-weight: 600;
                background: rgba(255,255,255,.08); color: rgba(255,255,255,.72);
                border: 1px solid rgba(255,255,255,.1);
            }
            .kk-tag--r { background: rgba(229,57,53,.2);  border-color: rgba(229,57,53,.45); }
            .kk-tag--b { background: rgba(33,150,243,.2); border-color: rgba(33,150,243,.45); }
            .kk-tag--g { background: rgba(76,175,80,.2);  border-color: rgba(76,175,80,.45); }

            .kk-actions { display: flex; gap: .5em; margin: .85em 0 .65em; }
            .kk-btn {
                display: inline-flex; align-items: center; justify-content: center; gap: .4em;
                padding: .7em 1.1em; border-radius: 2em;
                font-size: .88em; font-weight: 700; border: none; cursor: pointer;
                -webkit-tap-highlight-color: transparent; user-select: none;
                transition: transform .13s, opacity .13s;
            }
            .kk-btn:active { transform: scale(.93); opacity: .85; }
            .kk-btn--play {
                background: linear-gradient(135deg, #e53935, #ff5252); color: #fff;
                box-shadow: 0 4px 16px rgba(229,57,53,.35); flex: 1; min-height: 46px;
            }
            .kk-btn--fav {
                width: 46px; height: 46px; border-radius: 50%; padding: 0;
                background: rgba(255,255,255,.09); color: #fff; font-size: 1.15em;
                border: 1px solid rgba(255,255,255,.13); flex-shrink: 0;
            }

            .kk-info { margin: .15em 0 .55em; border: 1px solid rgba(255,255,255,.07); border-radius: .65em; overflow: hidden; }
            .kk-info__row { display: flex; padding: .5em .75em; font-size: .79em; border-bottom: 1px solid rgba(255,255,255,.05); }
            .kk-info__row:last-child { border-bottom: none; }
            .kk-info__label { color: rgba(255,255,255,.34); min-width: 75px; flex-shrink: 0; }
            .kk-info__val   { color: rgba(255,255,255,.82); }

            .kk-desc { font-size: .8em; color: rgba(255,255,255,.58); line-height: 1.7; margin: .35em 0; position: relative; }
            .kk-desc.col { max-height: 3.8em; overflow: hidden; }
            .kk-desc.col::after {
                content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1.8em;
                background: linear-gradient(transparent, var(--lampa-background, #0d0d18));
            }
            .kk-dtog {
                font-size: .74em; color: #e53935; cursor: pointer; padding: .22em 0;
                display: inline-block; -webkit-tap-highlight-color: transparent;
            }

            .kk-eps__sname {
                font-size: .71em; color: rgba(255,255,255,.3);
                margin-bottom: .38em; padding-bottom: .25em;
                border-bottom: 1px solid rgba(255,255,255,.06);
            }
            .kk-eps__list { display: flex; flex-wrap: wrap; gap: .35em; margin-bottom: .9em; }
            .kk-ep {
                padding: .4em .78em; border-radius: .5em;
                background: rgba(255,255,255,.07); color: rgba(255,255,255,.82);
                font-size: .74em; font-weight: 600; cursor: pointer;
                border: 1px solid rgba(255,255,255,.09);
                -webkit-tap-highlight-color: transparent;
                min-width: 2.4em; min-height: 34px;
                display: flex; align-items: center; justify-content: center;
                user-select: none; transition: all .13s;
            }
            .kk-ep:active, .kk-ep.playing {
                background: rgba(229,57,53,.8); color: #fff; border-color: #e53935;
            }
        `;
        var s = document.createElement('style');
        s.id = 'kk-style';
        s.textContent = css;
        document.head.appendChild(s);
    }

    // ============================================================
    // INFINITE SCROLL ENGINE
    // ============================================================
    function InfScroll(opts) {
        // opts: { appendTo, scrollEl, fetchFn, onCard, onEmpty }
        var self   = this;
        self.page  = 0;
        self.total = 1;
        self.busy  = false;
        self.done  = false;

        self._loader = document.createElement('div');
        self._loader.className = 'kk-iload';
        self._loader.innerHTML = '<div class="kk-spin"></div>';

        self._end = document.createElement('div');
        self._end.className = 'kk-iend';
        self._end.textContent = '— Đã hết —';

        opts.appendTo.parentElement.appendChild(self._loader);
        opts.appendTo.parentElement.appendChild(self._end);

        self._scroll = function () {
            if (self.done || self.busy) return;
            var el  = opts.scrollEl;
            var rem = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (rem < 400) self.load();
        };
        opts.scrollEl.addEventListener('scroll', self._scroll, { passive: true });

        self.load = function () {
            if (self.busy || self.done) return;
            self.busy = true;
            self._loader.classList.add('on');

            opts.fetchFn(self.page + 1, function (items, total) {
                self.busy  = false;
                self.total = total || 1;
                self.page++;
                self._loader.classList.remove('on');

                if (!items || !items.length) {
                    if (self.page === 1 && opts.onEmpty) opts.onEmpty();
                    self.finish(); return;
                }

                items.forEach(function (item) {
                    var card = opts.onCard(item);
                    opts.appendTo.appendChild(card);
                });

                if (self.page >= self.total) self.finish();
            });
        };

        self.finish = function () {
            self.done = true;
            self._loader.classList.remove('on');
            self._end.style.display = 'block';
            opts.scrollEl.removeEventListener('scroll', self._scroll);
        };

        self.destroy = function () {
            self.done = true;
            opts.scrollEl.removeEventListener('scroll', self._scroll);
        };

        self.load();
    }

    // ============================================================
    // PLAY VIDEO
    // ============================================================
    function playVideo(link, title) {
        if (!link) {
            Lampa.Noty.show('Không có link phát');
            return;
        }
        try {
            var it = { title: title || 'KKPhim', url: link };
            Lampa.Player.play(it);
            Lampa.Player.playlist([it]);
        } catch (e) { window.open(link, '_blank'); }
    }

    // ============================================================
    // TMDB LOGO
    // ============================================================
    function tmdbLogo(name, year, cb) {
        if (!name) return cb(null);
        var q   = encodeURIComponent(name);
        var key = CONFIG.tmdb_key;
        var base = 'https://api.themoviedb.org/3/';

        function getLogo(id, type) {
            Lampa.Api.send({
                url: base + type + '/' + id + '/images?api_key=' + key + '&include_image_language=en,null',
                success: function (d) {
                    if (!d || !d.logos || !d.logos.length) return cb(null);
                    var pngs = d.logos.filter(function (l) { return l.file_path && l.file_path.endsWith('.png'); });
                    var logo = (pngs.length ? pngs[0] : d.logos[0]).file_path;
                    cb(CONFIG.tmdb_img + 'w300' + logo);
                },
                error: function () { cb(null); }
            });
        }

        Lampa.Api.send({
            url: base + 'search/movie?api_key=' + key + '&query=' + q + (year ? '&year=' + year : '') + '&language=en-US',
            success: function (d) {
                if (d && d.results && d.results.length) return getLogo(d.results[0].id, 'movie');
                Lampa.Api.send({
                    url: base + 'search/tv?api_key=' + key + '&query=' + q + '&language=en-US',
                    success: function (d2) {
                        if (d2 && d2.results && d2.results.length) return getLogo(d2.results[0].id, 'tv');
                        cb(null);
                    },
                    error: function () { cb(null); }
                });
            },
            error: function () { cb(null); }
        });
    }

    // ============================================================
    // DETAIL PAGE
    // ============================================================
    function buildDetail(rootEl, scrollEl, slug) {
        rootEl.innerHTML = '<div class="kk-iload on" style="padding:5em"><div class="kk-spin"></div></div>';
        scrollEl.scrollTop = 0;

        apiFetch(CONFIG.api_base + '/phim/' + slug, function (data) {
            if (!data || !data.movie) {
                rootEl.innerHTML = '<div class="kk-back" data-back="1"><div class="kk-back__i">‹</div>Quay lại</div>' +
                    '<div class="kk-empty"><div class="kk-empty__i">😕</div>Không tìm thấy phim</div>';
                bindBack(rootEl); return;
            }

            var m        = data.movie;
            var eps      = data.episodes || [];
            var backdrop = imgSrc(m.poster_url || m.thumb_url);
            var thumb    = imgSrc(m.thumb_url  || m.poster_url);
            var origName = m.origin_name || m.name || '';

            var firstLink = '';
            if (eps.length && eps[0].server_data && eps[0].server_data.length) {
                firstLink = eps[0].server_data[0].link_m3u8 || eps[0].server_data[0].link_embed || '';
            }

            var h = '<div class="kk-back" data-back="1"><div class="kk-back__i">‹</div>Quay lại</div>';

            h += '<div class="kk-hero">';
            h += '<img class="kk-hero__bg" src="' + backdrop + '" onerror="this.style.opacity=0">';
            h += '<img class="kk-hero__logo" id="dlogo">';
            h += '<div class="kk-hero__grad"></div>';
            h += '</div>';

            h += '<div class="kk-dbody">';
            h += '<div class="kk-drow">';
            h += '<div class="kk-dposter"><img src="' + thumb + '" onerror="this.style.opacity=0"></div>';
            h += '<div class="kk-dmeta">';
            h += '<h1 class="kk-dtitle">' + (m.name || '') + '</h1>';
            if (m.origin_name) h += '<p class="kk-dorig">' + m.origin_name + '</p>';
            h += '<div class="kk-dtags">';
            if (m.quality) h += '<span class="kk-tag kk-tag--r">' + m.quality + '</span>';
            if (m.lang)    h += '<span class="kk-tag kk-tag--b">' + m.lang    + '</span>';
            if (m.year)    h += '<span class="kk-tag">'           + m.year    + '</span>';
            if (m.episode_current) h += '<span class="kk-tag kk-tag--g">' + m.episode_current + '</span>';
            if (m.time)    h += '<span class="kk-tag">⏱ ' + m.time + '</span>';
            h += '</div></div></div>';

            h += '<div class="kk-actions">';
            h += '<div class="kk-btn kk-btn--play" data-link="' + firstLink + '" data-name="' + (m.name || '') + '">▶ Xem Phim</div>';
            h += '<div class="kk-btn kk-btn--fav">♡</div>';
            h += '</div>';

            h += '<div class="kk-info">';
            if (m.status)        h += '<div class="kk-info__row"><span class="kk-info__label">Trạng thái</span><span class="kk-info__val">' + m.status + '</span></div>';
            if (m.episode_total) h += '<div class="kk-info__row"><span class="kk-info__label">Tổng tập</span><span class="kk-info__val">'   + m.episode_total + '</span></div>';
            if (m.country  && m.country.length)  h += '<div class="kk-info__row"><span class="kk-info__label">Quốc gia</span><span class="kk-info__val">'  + m.country.map(function(c){return c.name;}).join(', ')  + '</span></div>';
            if (m.category && m.category.length) h += '<div class="kk-info__row"><span class="kk-info__label">Thể loại</span><span class="kk-info__val">'  + m.category.map(function(c){return c.name;}).join(', ') + '</span></div>';
            if (m.director && m.director.length && m.director[0]) h += '<div class="kk-info__row"><span class="kk-info__label">Đạo diễn</span><span class="kk-info__val">'  + m.director.join(', ') + '</span></div>';
            if (m.actor    && m.actor.length    && m.actor[0])    h += '<div class="kk-info__row"><span class="kk-info__label">Diễn viên</span><span class="kk-info__val">' + m.actor.slice(0,5).join(', ') + '</span></div>';
            h += '</div>';

            if (m.content) {
                var desc = m.content.replace(/<[^>]*>/g, '');
                h += '<div class="kk-desc col" id="ddesc">' + desc + '</div>';
                h += '<div class="kk-dtog" id="dtog">Xem thêm ▾</div>';
            }
            h += '</div>';

            if (eps.length) {
                h += '<div class="kk-sh" style="margin-top:.3em"><div class="kk-sh__t">Danh Sách Tập</div></div>';
                h += '<div style="padding:0 .85em 1em">';
                eps.forEach(function (sv) {
                    if (!sv.server_data || !sv.server_data.length) return;
                    h += '<div class="kk-eps__sname">' + (sv.server_name || 'Server') + '</div>';
                    h += '<div class="kk-eps__list">';
                    sv.server_data.forEach(function (ep) {
                        var n = ep.name || ep.slug || '';
                        var l = ep.link_m3u8 || ep.link_embed || '';
                        h += '<div class="kk-ep" data-link="' + l + '" data-name="' + (m.name||'') + ' – Tập ' + n + '">' + n + '</div>';
                    });
                    h += '</div>';
                });
                h += '</div>';
            }

            rootEl.innerHTML = h;
            bindBack(rootEl);

            rootEl.querySelectorAll('.kk-btn--play, .kk-ep').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    playVideo(this.dataset.link, this.dataset.name);
                    rootEl.querySelectorAll('.kk-ep').forEach(function (e) { e.classList.remove('playing'); });
                    if (this.classList.contains('kk-ep')) this.classList.add('playing');
                });
            });

            var descEl = rootEl.querySelector('#ddesc');
            var dtog   = rootEl.querySelector('#dtog');
            if (descEl && dtog) {
                dtog.addEventListener('click', function () {
                    descEl.classList.toggle('col');
                    dtog.textContent = descEl.classList.contains('col') ? 'Xem thêm ▾' : 'Thu gọn ▴';
                });
            }

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
    // BIND BACK
    // ============================================================
    function bindBack(el) {
        el.querySelectorAll('[data-back]').forEach(function (b) {
            b.addEventListener('click', function () {
                Lampa.Activity.backward();
            });
        });
    }

    // ============================================================
    // BUILD HOME
    // ============================================================
    function buildHome(rootEl, scrollEl, onNavigate) {
        log('buildHome called');

        var navItems = [
            { icon:'🆕', text:'Phim Mới',  v:'new' },
            { icon:'🎬', text:'Phim Lẻ',   v:'list', s:'phim-le' },
            { icon:'📺', text:'Phim Bộ',   v:'list', s:'phim-bo' },
            { icon:'🎭', text:'Hoạt Hình', v:'list', s:'hoat-hinh' },
            { icon:'📡', text:'TV Shows',  v:'list', s:'tv-shows' },
            { icon:'🏷️', text:'Thể Loại',  v:'categories' },
            { icon:'🌍', text:'Quốc Gia',  v:'countries' },
            { icon:'🔍', text:'Tìm Kiếm',  v:'search' }
        ];

        var rows = [
            { key:'n', title:'🆕 Phim Mới',  v:'new',  s:'',          fn:function(cb){fNew(1,cb);} },
            { key:'l', title:'🎬 Phim Lẻ',   v:'list', s:'phim-le',   fn:function(cb){fList('phim-le',1,cb);} },
            { key:'b', title:'📺 Phim Bộ',   v:'list', s:'phim-bo',   fn:function(cb){fList('phim-bo',1,cb);} },
            { key:'a', title:'🎭 Hoạt Hình', v:'list', s:'hoat-hinh', fn:function(cb){fList('hoat-hinh',1,cb);} }
        ];

        // Build nav HTML
        var navEl = document.createElement('div');
        navEl.className = 'kk-nav';
        navItems.forEach(function (n) {
            var btn = document.createElement('div');
            btn.className = 'kk-nav__btn';
            btn.textContent = n.icon + ' ' + n.text;
            btn.addEventListener('click', function () { onNavigate(n.v, { slug: n.s }); });
            navEl.appendChild(btn);
        });
        rootEl.appendChild(navEl);

        // Build rows
        rows.forEach(function (r) {
            // Section header
            var sh = document.createElement('div');
            sh.className = 'kk-sh';
            sh.innerHTML = '<div class="kk-sh__t">' + r.title + '</div>' +
                '<div class="kk-sh__more">Xem thêm ›</div>';
            sh.querySelector('.kk-sh__more').addEventListener('click', function () {
                onNavigate(r.v, { slug: r.s });
            });
            rootEl.appendChild(sh);

            // Horizontal scroll row – dùng Lampa class "cards" nếu có
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:.6em;padding:.4em .8em .9em;overflow-x:auto;' +
                '-webkit-overflow-scrolling:touch;scrollbar-width:none;scroll-snap-type:x proximity;';
            row.innerHTML = '<div class="kk-spin" style="display:block;margin:.8em auto;flex-shrink:0"></div>';
            rootEl.appendChild(row);

            r.fn(function (items) {
                row.innerHTML = '';
                if (!items || !items.length) return;
                items.slice(0, 14).forEach(function (item) {
                    var card = createLampaCard(item, function (obj) {
                        Lampa.Activity.push({
                            component: 'kkphim_detail',
                            slug: obj.kk_slug,
                            title: obj.title
                        });
                    });
                    card.style.flexShrink = '0';
                    card.style.scrollSnapAlign = 'start';
                    row.appendChild(card);
                });
            });
        });

        log('buildHome done, rootEl children:', rootEl.children.length);
    }

    // ============================================================
    // BUILD INF LIST
    // ============================================================
    function buildInfList(rootEl, scrollEl, title, fetchFn, onNavigate) {
        var backEl = document.createElement('div');
        backEl.className = 'kk-back';
        backEl.setAttribute('data-back', '1');
        backEl.innerHTML = '<div class="kk-back__i">‹</div>Quay lại';
        backEl.addEventListener('click', function () { Lampa.Activity.backward(); });
        rootEl.appendChild(backEl);

        var sh = document.createElement('div');
        sh.className = 'kk-sh';
        sh.innerHTML = '<div class="kk-sh__t">' + title + '</div>';
        rootEl.appendChild(sh);

        // Dùng Lampa class "cards" cho grid
        var grid = document.createElement('div');
        grid.className = 'items--scroll';
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:.6em;padding:.3em .8em .5em;';
        rootEl.appendChild(grid);

        return new InfScroll({
            appendTo: grid,
            scrollEl: scrollEl,
            fetchFn:  fetchFn,
            onCard: function (item) {
                return createLampaCard(item, function (obj) {
                    Lampa.Activity.push({
                        component: 'kkphim_detail',
                        slug: obj.kk_slug,
                        title: obj.title
                    });
                });
            },
            onEmpty: function () {
                grid.innerHTML = '<div class="kk-empty" style="grid-column:1/-1"><div class="kk-empty__i">📭</div>Không có dữ liệu</div>';
            }
        });
    }

    // ============================================================
    // BUILD SEARCH
    // ============================================================
    function buildSearch(rootEl, scrollEl, keyword) {
        var backEl = document.createElement('div');
        backEl.className = 'kk-back';
        backEl.setAttribute('data-back', '1');
        backEl.innerHTML = '<div class="kk-back__i">‹</div>Quay lại';
        backEl.addEventListener('click', function () { Lampa.Activity.backward(); });
        rootEl.appendChild(backEl);

        var sbar = document.createElement('div');
        sbar.className = 'kk-sbar';
        sbar.innerHTML = '<input id="kk-si" type="text" placeholder="Nhập tên phim..." value="' +
            (keyword ? keyword.replace(/"/g, '&quot;') : '') + '">' +
            '<button id="kk-sg">🔍</button>';
        rootEl.appendChild(sbar);

        var area = document.createElement('div');
        rootEl.appendChild(area);

        var inf = null;
        var input = sbar.querySelector('#kk-si');
        var goBtn = sbar.querySelector('#kk-sg');

        function doSearch() {
            var kw = input.value.trim();
            if (!kw) return;
            if (inf) { inf.destroy(); inf = null; }
            area.innerHTML = '';

            var grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:.6em;padding:.3em .8em .5em;';
            area.appendChild(grid);

            inf = new InfScroll({
                appendTo: grid,
                scrollEl: scrollEl,
                fetchFn:  function (p, cb) { fSearch(kw, p, cb); },
                onCard: function (item) {
                    return createLampaCard(item, function (obj) {
                        Lampa.Activity.push({ component: 'kkphim_detail', slug: obj.kk_slug, title: obj.title });
                    });
                },
                onEmpty: function () {
                    grid.innerHTML = '<div class="kk-empty" style="grid-column:1/-1"><div class="kk-empty__i">🔍</div>Không tìm thấy "' + kw + '"</div>';
                }
            });
        }

        goBtn.addEventListener('click', doSearch);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
        if (keyword) doSearch();
        else setTimeout(function () { try { input.focus(); } catch(e){} }, 400);

        return { destroy: function () { if (inf) inf.destroy(); } };
    }

    // ============================================================
    // BUILD CATEGORIES / COUNTRIES
    // ============================================================
    function buildChips(rootEl, title, items, onClick) {
        var backEl = document.createElement('div');
        backEl.className = 'kk-back';
        backEl.setAttribute('data-back', '1');
        backEl.innerHTML = '<div class="kk-back__i">‹</div>Quay lại';
        backEl.addEventListener('click', function () { Lampa.Activity.backward(); });
        rootEl.appendChild(backEl);

        var sh = document.createElement('div');
        sh.className = 'kk-sh';
        sh.innerHTML = '<div class="kk-sh__t">' + title + '</div>';
        rootEl.appendChild(sh);

        var chips = document.createElement('div');
        chips.className = 'kk-chips';
        items.forEach(function (item) {
            var ch = document.createElement('div');
            ch.className = 'kk-chip';
            ch.textContent = item.name;
            ch.addEventListener('click', function () { onClick(item.slug); });
            chips.appendChild(ch);
        });
        rootEl.appendChild(chips);
    }

    // ============================================================
    // NAVIGATE (in-component)
    // ============================================================
    function makeNavigator(rootEl, scrollEl) {
        var _inf = null;

        function nav(view, params) {
            params = params || {};
            if (_inf) { _inf.destroy(); _inf = null; }
            rootEl.innerHTML = '';
            scrollEl.scrollTop = 0;

            // show spinner
            var loader = document.createElement('div');
            loader.className = 'kk-iload on';
            loader.style.padding = '5em';
            loader.innerHTML = '<div class="kk-spin"></div>';
            rootEl.appendChild(loader);

            var tmap = {
                'phim-le':'🎬 Phim Lẻ','phim-bo':'📺 Phim Bộ',
                'hoat-hinh':'🎭 Hoạt Hình','tv-shows':'📡 TV Shows'
            };

            // Dùng setTimeout để đảm bảo DOM flush trước khi fetch
            setTimeout(function () {
                rootEl.removeChild(loader);

                switch (view) {
                    case 'home':
                        buildHome(rootEl, scrollEl, nav);
                        break;

                    case 'new':
                        _inf = buildInfList(rootEl, scrollEl, '🆕 Phim Mới',
                            function (p, cb) { fNew(p, cb); }, nav);
                        break;

                    case 'list':
                        _inf = buildInfList(rootEl, scrollEl, tmap[params.slug] || params.slug,
                            function (p, cb) { fList(params.slug, p, cb); }, nav);
                        break;

                    case 'category':
                        _inf = buildInfList(rootEl, scrollEl, params.slug,
                            function (p, cb) { fCat(params.slug, p, cb); }, nav);
                        break;

                    case 'country':
                        _inf = buildInfList(rootEl, scrollEl, params.slug,
                            function (p, cb) { fCountry(params.slug, p, cb); }, nav);
                        break;

                    case 'categories':
                        buildChips(rootEl, '🏷️ Thể Loại', [
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
                        ], function (slug) { nav('category', { slug: slug }); });
                        break;

                    case 'countries':
                        buildChips(rootEl, '🌍 Quốc Gia', [
                            {slug:'viet-nam',name:'🇻🇳 Việt Nam'},{slug:'han-quoc',name:'🇰🇷 Hàn Quốc'},
                            {slug:'trung-quoc',name:'🇨🇳 Trung Quốc'},{slug:'nhat-ban',name:'🇯🇵 Nhật Bản'},
                            {slug:'thai-lan',name:'🇹🇭 Thái Lan'},{slug:'au-my',name:'🇺🇸 Âu Mỹ'},
                            {slug:'dai-loan',name:'🇹🇼 Đài Loan'},{slug:'hong-kong',name:'🇭🇰 Hồng Kông'},
                            {slug:'an-do',name:'🇮🇳 Ấn Độ'},{slug:'anh',name:'🇬🇧 Anh'},
                            {slug:'phap',name:'🇫🇷 Pháp'},{slug:'duc',name:'🇩🇪 Đức'},
                            {slug:'tay-ban-nha',name:'🇪🇸 Tây Ban Nha'},{slug:'philippines',name:'🇵🇭 Philippines'},
                            {slug:'canada',name:'🇨🇦 Canada'}
                        ], function (slug) { nav('country', { slug: slug }); });
                        break;

                    case 'search':
                        _inf = buildSearch(rootEl, scrollEl, params.keyword || null);
                        break;
                }
            }, 0);

            return _inf;
        }

        return {
            go: nav,
            destroy: function () { if (_inf) _inf.destroy(); }
        };
    }

    // ============================================================
    // LAMPA COMPONENTS
    // ============================================================
    function initPlugin() {
        addStyles();

        /* ── Main ── */
        Lampa.Component.add('kkphim', function () {
            var self = this;
            var nav  = null;

            // Tạo DOM TRƯỚC – Lampa gọi render() ngay
            var scrollEl = document.createElement('div');
            scrollEl.style.cssText = [
                'position:absolute', 'inset:0',
                'overflow-y:auto', 'overflow-x:hidden',
                '-webkit-overflow-scrolling:touch',
                'overscroll-behavior-y:contain'
            ].join(';');

            var rootEl = document.createElement('div');
            rootEl.style.cssText = 'min-height:100%;padding-bottom:100px;box-sizing:border-box;color:#fff;';
            scrollEl.appendChild(rootEl);

            // render() phải trả về element ngay
            self.render = function () {
                log('render() called');
                return scrollEl;
            };

            // create() – Lampa gọi sau render(), đây là nơi build nội dung
            self.create = function () {
                log('create() called');
                nav = makeNavigator(rootEl, scrollEl);
                nav.go('home');
            };

            self.start = function () {
                log('start() called');
                if (Lampa.Controller) {
                    Lampa.Controller.add('content', {
                        toggle: function () {},
                        left  : function () { if (Lampa.Panel) Lampa.Panel.show(); },
                        right : function () {},
                        up    : function () { scrollEl.scrollBy({ top: -100, behavior: 'smooth' }); },
                        down  : function () { scrollEl.scrollBy({ top:  100, behavior: 'smooth' }); },
                        back  : function () { Lampa.Activity.backward(); }
                    });
                    Lampa.Controller.toggle('content');
                }
            };

            self.pause   = function () {};
            self.stop    = function () { if (nav) nav.destroy(); };
            self.destroy = function () { if (nav) nav.destroy(); scrollEl.innerHTML = ''; };
        });

        /* ── Detail ── */
        Lampa.Component.add('kkphim_detail', function (object) {
            var self = this;

            var scrollEl = document.createElement('div');
            scrollEl.style.cssText = [
                'position:absolute', 'inset:0',
                'overflow-y:auto', 'overflow-x:hidden',
                '-webkit-overflow-scrolling:touch',
                'overscroll-behavior-y:contain'
            ].join(';');

            var rootEl = document.createElement('div');
            rootEl.style.cssText = 'min-height:100%;padding-bottom:100px;box-sizing:border-box;color:#fff;';
            scrollEl.appendChild(rootEl);

            self.render = function () { return scrollEl; };

            self.create = function () {
                log('detail create(), slug:', object.slug);
                buildDetail(rootEl, scrollEl, object.slug);
            };

            self.start = function () {
                if (Lampa.Controller) {
                    Lampa.Controller.add('content', {
                        toggle: function () {},
                        left  : function () {},
                        right : function () {},
                        up    : function () { scrollEl.scrollBy({ top: -100, behavior: 'smooth' }); },
                        down  : function () { scrollEl.scrollBy({ top:  100, behavior: 'smooth' }); },
                        back  : function () { Lampa.Activity.backward(); }
                    });
                    Lampa.Controller.toggle('content');
                }
            };

            self.pause   = function () {};
            self.stop    = function () {};
            self.destroy = function () { scrollEl.innerHTML = ''; };
        });

        /* ── Menu ── */
        function injectMenu() {
            if (document.querySelector('[data-kkm]')) return;
            var list = document.querySelector('.menu .menu__list');
            if (!list) { log('menu list not found, retry...'); return false; }

            var li = document.createElement('li');
            li.className = 'menu__item selector';
            li.setAttribute('data-kkm', '1');
            li.innerHTML =
                '<div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor" style="width:1.4em;height:1.4em">' +
                '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                '</svg></div><div class="menu__text">KKPhim</div>';

            function go() {
                log('menu click → push kkphim');
                Lampa.Activity.push({ component: 'kkphim', title: 'KKPhim' });
            }
            li.addEventListener('click', go);
            if (typeof $ !== 'undefined') $(li).on('hover:enter', go);
            list.appendChild(li);
            log('menu injected OK');
            return true;
        }

        if (!injectMenu()) {
            var tries = 0;
            var iv = setInterval(function () {
                tries++;
                if (injectMenu() || tries > 20) clearInterval(iv);
            }, 500);
        }

        Lampa.Noty.show('🎬 KKPhim sẵn sàng!', { time: 2000 });
        log('Plugin init OK');
    }

    // ============================================================
    // BOOT
    // ============================================================
    function boot() {
        log('boot, Lampa ready?', typeof Lampa !== 'undefined');
        var t = 0;
        var iv = setInterval(function () {
            t += 300;
            if (typeof Lampa !== 'undefined' &&
                Lampa.Component && Lampa.Activity &&
                Lampa.Noty && Lampa.Api) {
                clearInterval(iv);
                log('Lampa ready, init plugin');
                initPlugin();
            } else if (t > 20000) {
                clearInterval(iv);
                log('Lampa timeout');
            }
        }, 300);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

})();