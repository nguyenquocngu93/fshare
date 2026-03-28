(function () {
    'use strict';

    var CONFIG = {
        api_base: 'https://phimapi.com',
        img_base: 'https://phimimg.com/',
        name: 'KKPhim',
        cache_time: 1000 * 60 * 10
    };

    // ============== STYLES ==============
    function addStyles() {
        if (document.getElementById('kkphim-css')) return;
        var css = `
            .kkphim-plugin {
                padding-bottom: 2em;
                -webkit-overflow-scrolling: touch;
            }

            /* === NAV MENU === */
            .kk-nav {
                display: flex;
                gap: 0.5em;
                padding: 1em;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
            }
            .kk-nav::-webkit-scrollbar { display: none; }
            .kk-nav__btn {
                flex-shrink: 0;
                padding: 0.5em 1.2em;
                border-radius: 2em;
                background: rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.8);
                font-size: 0.85em;
                font-weight: 600;
                border: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
                white-space: nowrap;
                -webkit-tap-highlight-color: transparent;
                transition: background 0.2s, transform 0.15s;
                user-select: none;
            }
            .kk-nav__btn:active {
                transform: scale(0.95);
                background: rgba(229,57,53,0.8);
            }
            .kk-nav__btn.active {
                background: linear-gradient(135deg, #e53935, #ff5252);
                color: #fff;
                border-color: transparent;
            }

            /* === SECTION === */
            .kk-section {
                padding: 0 1em;
                margin-top: 0.5em;
            }
            .kk-section__head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.6em;
            }
            .kk-section__title {
                font-size: 1.15em;
                font-weight: 700;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 0.5em;
            }
            .kk-section__title::before {
                content: '';
                width: 3px;
                height: 1em;
                background: #e53935;
                border-radius: 2px;
                flex-shrink: 0;
            }
            .kk-section__more {
                font-size: 0.8em;
                color: rgba(255,255,255,0.4);
                cursor: pointer;
                padding: 0.3em 0.8em;
                border-radius: 1em;
                border: 1px solid rgba(255,255,255,0.1);
                -webkit-tap-highlight-color: transparent;
            }
            .kk-section__more:active {
                background: rgba(255,255,255,0.1);
            }

            /* === SCROLL ROW (horizontal) === */
            .kk-row {
                display: flex;
                gap: 0.8em;
                overflow-x: auto;
                padding: 0.3em 1em 1em;
                -webkit-overflow-scrolling: touch;
                scroll-snap-type: x proximity;
                scrollbar-width: none;
            }
            .kk-row::-webkit-scrollbar { display: none; }
            .kk-row .kk-card {
                flex-shrink: 0;
                width: 260px;
                scroll-snap-align: start;
            }

            /* === GRID (vertical list) === */
            .kk-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 0.8em;
                padding: 0.3em 1em 1em;
            }
            @media (min-width: 600px) {
                .kk-grid {
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                }
            }

            /* === CARD WITH BACKDROP === */
            .kk-card {
                position: relative;
                border-radius: 0.8em;
                overflow: hidden;
                background: #16162a;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: transform 0.2s;
            }
            .kk-card:active {
                transform: scale(0.97);
            }
            .kk-card__img {
                width: 100%;
                aspect-ratio: 16/9;
                object-fit: cover;
                display: block;
                background: #111;
            }
            .kk-card__overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    0deg,
                    rgba(8,8,24,0.95) 0%,
                    rgba(8,8,24,0.5) 50%,
                    transparent 100%
                );
                pointer-events: none;
            }
            .kk-card__badges {
                position: absolute;
                top: 0.4em;
                left: 0.4em;
                right: 0.4em;
                display: flex;
                justify-content: space-between;
                pointer-events: none;
                z-index: 2;
            }
            .kk-badge {
                padding: 0.15em 0.5em;
                border-radius: 0.3em;
                font-size: 0.65em;
                font-weight: 700;
                text-transform: uppercase;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            }
            .kk-badge--q { background: rgba(229,57,53,0.85); color: #fff; }
            .kk-badge--l { background: rgba(33,150,243,0.85); color: #fff; }
            .kk-badge--y { background: rgba(255,193,7,0.85); color: #111; }
            .kk-badge--e { background: rgba(76,175,80,0.85); color: #fff; }

            .kk-card__info {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 0.6em 0.7em;
                z-index: 2;
            }
            .kk-card__name {
                font-size: 0.85em;
                font-weight: 700;
                color: #fff;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-shadow: 0 1px 6px rgba(0,0,0,0.8);
                margin: 0;
            }
            .kk-card__sub {
                font-size: 0.7em;
                color: rgba(255,255,255,0.55);
                margin: 0.15em 0 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* Grid card - taller ratio */
            .kk-grid .kk-card__img {
                aspect-ratio: 2/3;
            }
            .kk-grid .kk-card__overlay {
                height: 60%;
                top: auto;
                background: linear-gradient(
                    0deg,
                    rgba(8,8,24,0.95) 0%,
                    rgba(8,8,24,0.4) 60%,
                    transparent 100%
                );
            }

            /* === DETAIL PAGE === */
            .kk-detail {
                padding-bottom: 2em;
            }
            .kk-detail__hero {
                position: relative;
                width: 100%;
                aspect-ratio: 16/9;
                overflow: hidden;
            }
            .kk-detail__hero img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .kk-detail__hero-grad {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 70%;
                background: linear-gradient(0deg, 
                    var(--lampa-background, #0d0d1a) 0%, 
                    transparent 100%);
            }
            .kk-detail__body {
                padding: 0 1em;
                margin-top: -3em;
                position: relative;
                z-index: 2;
            }
            .kk-detail__row {
                display: flex;
                gap: 1em;
            }
            .kk-detail__poster {
                flex-shrink: 0;
                width: 110px;
                border-radius: 0.6em;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            }
            .kk-detail__poster img {
                width: 100%;
                display: block;
            }
            .kk-detail__meta {
                flex: 1;
                min-width: 0;
                padding-top: 0.5em;
            }
            .kk-detail__title {
                font-size: 1.3em;
                font-weight: 800;
                color: #fff;
                margin: 0 0 0.1em;
                line-height: 1.2;
            }
            .kk-detail__orig {
                font-size: 0.85em;
                color: rgba(255,255,255,0.4);
                margin: 0 0 0.6em;
                font-style: italic;
            }
            .kk-detail__tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.35em;
                margin-bottom: 0.8em;
            }
            .kk-tag {
                padding: 0.2em 0.6em;
                border-radius: 1.5em;
                font-size: 0.7em;
                font-weight: 600;
                background: rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.7);
                border: 1px solid rgba(255,255,255,0.1);
            }
            .kk-tag--red { background: rgba(229,57,53,0.25); border-color: rgba(229,57,53,0.4); }
            .kk-tag--blue { background: rgba(33,150,243,0.25); border-color: rgba(33,150,243,0.4); }
            .kk-tag--green { background: rgba(76,175,80,0.25); border-color: rgba(76,175,80,0.4); }

            /* Action Buttons */
            .kk-actions {
                display: flex;
                gap: 0.6em;
                margin: 1em 0;
                padding: 0 1em;
            }
            .kk-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.4em;
                padding: 0.65em 1.5em;
                border-radius: 2em;
                font-size: 0.9em;
                font-weight: 700;
                border: none;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: transform 0.15s;
                user-select: none;
            }
            .kk-btn:active { transform: scale(0.95); }
            .kk-btn--play {
                background: linear-gradient(135deg, #e53935, #ff5252);
                color: #fff;
                box-shadow: 0 4px 16px rgba(229,57,53,0.4);
                flex: 1;
                justify-content: center;
            }
            .kk-btn--fav {
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.15);
            }

            /* Info items */
            .kk-info-list {
                padding: 0 1em;
                margin: 0.8em 0;
            }
            .kk-info-item {
                display: flex;
                padding: 0.5em 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-size: 0.85em;
            }
            .kk-info-item__label {
                color: rgba(255,255,255,0.4);
                min-width: 80px;
                flex-shrink: 0;
            }
            .kk-info-item__value {
                color: rgba(255,255,255,0.8);
            }

            /* Description */
            .kk-desc {
                padding: 0 1em;
                font-size: 0.85em;
                color: rgba(255,255,255,0.6);
                line-height: 1.7;
                margin: 0.5em 0;
            }
            .kk-desc.collapsed {
                max-height: 4.5em;
                overflow: hidden;
                position: relative;
            }
            .kk-desc.collapsed::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2em;
                background: linear-gradient(transparent, var(--lampa-background, #0d0d1a));
            }
            .kk-desc-toggle {
                padding: 0.3em 1em;
                font-size: 0.8em;
                color: #e53935;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }

            /* === EPISODES === */
            .kk-eps {
                padding: 0.5em 1em;
            }
            .kk-eps__server {
                margin-bottom: 1.2em;
            }
            .kk-eps__sname {
                font-size: 0.8em;
                color: rgba(255,255,255,0.4);
                margin-bottom: 0.5em;
                padding-bottom: 0.3em;
                border-bottom: 1px solid rgba(255,255,255,0.06);
            }
            .kk-eps__list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
            }
            .kk-ep {
                padding: 0.45em 0.9em;
                border-radius: 0.5em;
                background: rgba(255,255,255,0.07);
                color: rgba(255,255,255,0.8);
                font-size: 0.8em;
                font-weight: 600;
                cursor: pointer;
                border: 1px solid rgba(255,255,255,0.08);
                -webkit-tap-highlight-color: transparent;
                transition: background 0.15s, transform 0.15s;
                min-width: 2.5em;
                text-align: center;
                user-select: none;
            }
            .kk-ep:active {
                transform: scale(0.93);
                background: rgba(229,57,53,0.7);
                color: #fff;
            }

            /* === PAGINATION === */
            .kk-pages {
                display: flex;
                justify-content: center;
                gap: 0.4em;
                padding: 1.5em 1em;
                flex-wrap: wrap;
            }
            .kk-pg {
                padding: 0.45em 0.9em;
                border-radius: 0.5em;
                background: rgba(255,255,255,0.07);
                color: rgba(255,255,255,0.6);
                font-size: 0.85em;
                cursor: pointer;
                border: 1px solid rgba(255,255,255,0.08);
                -webkit-tap-highlight-color: transparent;
                user-select: none;
            }
            .kk-pg:active { background: rgba(255,255,255,0.15); }
            .kk-pg.now {
                background: #e53935;
                color: #fff;
                border-color: #e53935;
            }

            /* === LOADING / EMPTY === */
            .kk-loading {
                display: flex;
                justify-content: center;
                padding: 3em;
            }
            .kk-spin {
                width: 36px; height: 36px;
                border: 3px solid rgba(255,255,255,0.1);
                border-top-color: #e53935;
                border-radius: 50%;
                animation: kkspin 0.7s linear infinite;
            }
            @keyframes kkspin { to { transform: rotate(360deg); } }

            .kk-empty {
                text-align: center;
                padding: 3em 1em;
                color: rgba(255,255,255,0.3);
            }
            .kk-empty__ico { font-size: 2.5em; margin-bottom: 0.3em; }

            /* === BACK BUTTON === */
            .kk-back {
                position: sticky;
                top: 0;
                z-index: 10;
                display: flex;
                align-items: center;
                gap: 0.5em;
                padding: 0.8em 1em;
                background: linear-gradient(180deg, 
                    var(--lampa-background, #0d0d1a) 60%, 
                    transparent);
                color: rgba(255,255,255,0.7);
                font-size: 0.9em;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
            }
            .kk-back:active { color: #fff; }

            /* === CATEGORY CHIPS === */
            .kk-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                padding: 0.5em 1em 1em;
            }
            .kk-chip {
                padding: 0.55em 1.1em;
                border-radius: 2em;
                background: rgba(255,255,255,0.06);
                color: rgba(255,255,255,0.7);
                font-size: 0.85em;
                cursor: pointer;
                border: 1px solid rgba(255,255,255,0.08);
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                transition: background 0.2s;
            }
            .kk-chip:active {
                background: rgba(229,57,53,0.7);
                color: #fff;
            }

            /* Search input */
            .kk-search {
                padding: 0.8em 1em;
            }
            .kk-search__box {
                display: flex;
                gap: 0.5em;
            }
            .kk-search__input {
                flex: 1;
                padding: 0.7em 1em;
                border-radius: 2em;
                border: 1px solid rgba(255,255,255,0.15);
                background: rgba(255,255,255,0.08);
                color: #fff;
                font-size: 0.9em;
                outline: none;
                -webkit-appearance: none;
            }
            .kk-search__input::placeholder {
                color: rgba(255,255,255,0.3);
            }
            .kk-search__input:focus {
                border-color: #e53935;
                background: rgba(255,255,255,0.12);
            }
            .kk-search__go {
                padding: 0.7em 1.2em;
                border-radius: 2em;
                background: #e53935;
                color: #fff;
                font-weight: 700;
                border: none;
                cursor: pointer;
                font-size: 0.9em;
                -webkit-tap-highlight-color: transparent;
            }
            .kk-search__go:active { opacity: 0.8; }
        `;
        var el = document.createElement('style');
        el.id = 'kkphim-css';
        el.textContent = css;
        document.head.appendChild(el);
    }

    // ============== API ==============
    var cache = {};

    function api(url, cb) {
        if (cache[url] && Date.now() - cache[url].t < CONFIG.cache_time) {
            return cb(cache[url].d);
        }
        $.ajax({
            url: url, timeout: 12000, dataType: 'json',
            success: function (d) { cache[url] = { d: d, t: Date.now() }; cb(d); },
            error: function () { cb(null); }
        });
    }

    function img(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return CONFIG.img_base + path;
    }

    // ============== RENDER HELPERS ==============

    function loading() {
        return '<div class="kk-loading"><div class="kk-spin"></div></div>';
    }

    function empty(msg) {
        return '<div class="kk-empty"><div class="kk-empty__ico">📭</div><div>' + (msg || 'Không có dữ liệu') + '</div></div>';
    }

    function cardHtml(item, isV1) {
        var name = item.name || '';
        var orig = item.origin_name || '';
        var slug = item.slug || '';
        var year = item.year || '';
        var quality = item.quality || '';
        var lang = item.lang || '';
        var epCur = item.episode_current || '';
        var backdrop = img(item.poster_url) || img(item.thumb_url);
        var thumb = img(item.thumb_url) || img(item.poster_url);

        var fallback = "this.src='data:image/svg+xml;charset=utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 9\"><rect fill=\"%2316162a\" width=\"16\" height=\"9\"/></svg>'";

        var h = '<div class="kk-card" data-slug="' + slug + '">';

        // badges
        h += '<div class="kk-card__badges"><div style="display:flex;gap:0.25em">';
        if (quality) h += '<span class="kk-badge kk-badge--q">' + quality + '</span>';
        if (lang) h += '<span class="kk-badge kk-badge--l">' + lang + '</span>';
        h += '</div><div style="display:flex;gap:0.25em">';
        if (year) h += '<span class="kk-badge kk-badge--y">' + year + '</span>';
        if (epCur) h += '<span class="kk-badge kk-badge--e">' + epCur + '</span>';
        h += '</div></div>';

        h += '<img class="kk-card__img" src="' + backdrop + '" loading="lazy" onerror="' + fallback + '">';
        h += '<div class="kk-card__overlay"></div>';
        h += '<div class="kk-card__info">';
        h += '<p class="kk-card__name">' + name + '</p>';
        if (orig) h += '<p class="kk-card__sub">' + orig + '</p>';
        h += '</div></div>';
        return h;
    }

    function pagination(cur, total) {
        if (total <= 1) return '';
        var h = '<div class="kk-pages">';
        if (cur > 1) h += '<div class="kk-pg" data-p="' + (cur - 1) + '">◀</div>';

        var s = Math.max(1, cur - 2), e = Math.min(total, cur + 2);
        if (s > 1) {
            h += '<div class="kk-pg" data-p="1">1</div>';
            if (s > 2) h += '<span style="color:rgba(255,255,255,0.2);padding:0 0.3em">…</span>';
        }
        for (var i = s; i <= e; i++) {
            h += '<div class="kk-pg' + (i === cur ? ' now' : '') + '" data-p="' + i + '">' + i + '</div>';
        }
        if (e < total) {
            if (e < total - 1) h += '<span style="color:rgba(255,255,255,0.2);padding:0 0.3em">…</span>';
            h += '<div class="kk-pg" data-p="' + total + '">' + total + '</div>';
        }
        if (cur < total) h += '<div class="kk-pg" data-p="' + (cur + 1) + '">▶</div>';
        h += '</div>';
        return h;
    }

    // ============== ROUTER ==============
    var currentView = null;

    function navigate(view, params) {
        params = params || {};
        currentView = { view: view, params: params };

        var wrap = document.getElementById('kkphim-root');
        if (!wrap) return;

        wrap.innerHTML = loading();
        wrap.scrollTop = 0;

        switch (view) {
            case 'home': renderHome(wrap); break;
            case 'new': renderList(wrap, 'new', params.page || 1); break;
            case 'list': renderList(wrap, params.slug, params.page || 1); break;
            case 'category': renderCatList(wrap, params.slug, params.page || 1); break;
            case 'country': renderCountryList(wrap, params.slug, params.page || 1); break;
            case 'categories': renderCategories(wrap); break;
            case 'countries': renderCountries(wrap); break;
            case 'search': renderSearch(wrap, params.keyword, params.page || 1); break;
            case 'detail': renderDetail(wrap, params.slug); break;
        }
    }

    function goBack() {
        if (typeof Lampa !== 'undefined' && Lampa.Activity) {
            Lampa.Activity.backward();
        }
    }

    // ============== VIEWS ==============

    function renderHome(wrap) {
        var h = '';

        // Nav
        h += '<div class="kk-nav">';
        var navItems = [
            { icon: '🆕', text: 'Phim Mới', view: 'new' },
            { icon: '🎬', text: 'Phim Lẻ', view: 'list', slug: 'phim-le' },
            { icon: '📺', text: 'Phim Bộ', view: 'list', slug: 'phim-bo' },
            { icon: '🎭', text: 'Hoạt Hình', view: 'list', slug: 'hoat-hinh' },
            { icon: '📡', text: 'TV Shows', view: 'list', slug: 'tv-shows' },
            { icon: '🏷️', text: 'Thể Loại', view: 'categories' },
            { icon: '🌍', text: 'Quốc Gia', view: 'countries' },
            { icon: '🔍', text: 'Tìm Kiếm', view: 'search' }
        ];
        navItems.forEach(function (n) {
            h += '<div class="kk-nav__btn" data-view="' + n.view + '"' + (n.slug ? ' data-slug="' + n.slug + '"' : '') + '>' + n.icon + ' ' + n.text + '</div>';
        });
        h += '</div>';

        h += '<div id="kk-home-sections">' + loading() + '</div>';
        wrap.innerHTML = h;

        // Bind nav
        wrap.querySelectorAll('.kk-nav__btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var v = this.dataset.view;
                var s = this.dataset.slug;
                navigate(v, { slug: s });
            });
        });

        // Load sections
        var sections = document.getElementById('kk-home-sections');
        var loaded = 0;
        var parts = { a: '', b: '', c: '', d: '' };
        var keys = [
            { key: 'a', title: 'Phim Mới Cập Nhật', url: CONFIG.api_base + '/danh-sach/phim-moi-cap-nhat?page=1', isV1: false, moreView: 'new' },
            { key: 'b', title: 'Phim Lẻ', url: CONFIG.api_base + '/v1/api/danh-sach/phim-le?page=1', isV1: true, moreView: 'list', moreSlug: 'phim-le' },
            { key: 'c', title: 'Phim Bộ', url: CONFIG.api_base + '/v1/api/danh-sach/phim-bo?page=1', isV1: true, moreView: 'list', moreSlug: 'phim-bo' },
            { key: 'd', title: 'Hoạt Hình', url: CONFIG.api_base + '/v1/api/danh-sach/hoat-hinh?page=1', isV1: true, moreView: 'list', moreSlug: 'hoat-hinh' }
        ];

        function done() {
            loaded++;
            if (loaded < keys.length) return;

            var out = '';
            keys.forEach(function (sec) {
                if (!parts[sec.key]) return;
                out += '<div class="kk-section"><div class="kk-section__head">';
                out += '<div class="kk-section__title">' + sec.title + '</div>';
                out += '<div class="kk-section__more" data-view="' + sec.moreView + '"' + (sec.moreSlug ? ' data-slug="' + sec.moreSlug + '"' : '') + '>Xem thêm ›</div>';
                out += '</div></div>';
                out += '<div class="kk-row">' + parts[sec.key] + '</div>';
            });

            sections.innerHTML = out;
            bindCards(sections);

            sections.querySelectorAll('.kk-section__more').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    navigate(this.dataset.view, { slug: this.dataset.slug });
                });
            });
        }

        keys.forEach(function (sec) {
            api(sec.url, function (data) {
                var items;
                if (sec.isV1) {
                    items = data && data.data && data.data.items ? data.data.items : [];
                } else {
                    items = data && data.items ? data.items : [];
                }
                items.slice(0, 12).forEach(function (item) {
                    parts[sec.key] += cardHtml(item, sec.isV1);
                });
                done();
            });
        });
    }

    function renderList(wrap, type, page) {
        var titleMap = {
            'new': '🆕 Phim Mới Cập Nhật',
            'phim-le': '🎬 Phim Lẻ',
            'phim-bo': '📺 Phim Bộ',
            'hoat-hinh': '🎭 Hoạt Hình',
            'tv-shows': '📡 TV Shows'
        };

        if (type === 'new') {
            api(CONFIG.api_base + '/danh-sach/phim-moi-cap-nhat?page=' + page, function (data) {
                if (!data || !data.items || !data.items.length) {
                    wrap.innerHTML = backBtn() + empty();
                    return;
                }
                var totalPages = data.pagination ? data.pagination.totalPages : 1;
                var curPage = data.pagination ? data.pagination.currentPage : page;

                var h = backBtn() + '<div class="kk-section"><div class="kk-section__title">' + (titleMap[type] || type) + '</div></div>';
                h += '<div class="kk-grid">';
                data.items.forEach(function (item) { h += cardHtml(item, false); });
                h += '</div>';
                h += pagination(curPage, totalPages);

                wrap.innerHTML = h;
                bindCards(wrap);
                bindPages(wrap, function (p) { navigate('new', { page: p }); });
                bindBack(wrap);
            });
        } else {
            api(CONFIG.api_base + '/v1/api/danh-sach/' + type + '?page=' + page, function (data) {
                if (!data || !data.data || !data.data.items || !data.data.items.length) {
                    wrap.innerHTML = backBtn() + empty();
                    return;
                }
                var params = data.data.params || {};
                var pag = params.pagination || {};
                var totalPages = Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1;
                var curPage = parseInt(pag.currentPage) || page;

                var h = backBtn() + '<div class="kk-section"><div class="kk-section__title">' + (titleMap[type] || type) + '</div></div>';
                h += '<div class="kk-grid">';
                data.data.items.forEach(function (item) { h += cardHtml(item, true); });
                h += '</div>';
                h += pagination(curPage, totalPages);

                wrap.innerHTML = h;
                bindCards(wrap);
                bindPages(wrap, function (p) { navigate('list', { slug: type, page: p }); });
                bindBack(wrap);
            });
        }
    }

    function renderDetail(wrap, slug) {
        api(CONFIG.api_base + '/phim/' + slug, function (data) {
            if (!data || !data.movie) {
                wrap.innerHTML = backBtn() + empty('Không tìm thấy phim');
                bindBack(wrap);
                return;
            }

            var m = data.movie;
            var eps = data.episodes || [];
            var backdrop = img(m.poster_url || m.thumb_url);
            var thumb = img(m.thumb_url || m.poster_url);

            var h = '<div class="kk-detail">';

            // Hero
            h += '<div class="kk-detail__hero">';
            h += '<img src="' + backdrop + '" onerror="this.style.display=\'none\'">';
            h += '<div class="kk-detail__hero-grad"></div>';
            h += '</div>';

            // Back button overlay
            h += '<div class="kk-back" id="kk-back-btn">‹ Quay lại</div>';

            // Body
            h += '<div class="kk-detail__body">';
            h += '<div class="kk-detail__row">';
            h += '<div class="kk-detail__poster"><img src="' + thumb + '"></div>';
            h += '<div class="kk-detail__meta">';
            h += '<h1 class="kk-detail__title">' + (m.name || '') + '</h1>';
            if (m.origin_name) h += '<p class="kk-detail__orig">' + m.origin_name + '</p>';
            h += '<div class="kk-detail__tags">';
            if (m.quality) h += '<span class="kk-tag kk-tag--red">' + m.quality + '</span>';
            if (m.lang) h += '<span class="kk-tag kk-tag--blue">' + m.lang + '</span>';
            if (m.year) h += '<span class="kk-tag">' + m.year + '</span>';
            if (m.episode_current) h += '<span class="kk-tag kk-tag--green">' + m.episode_current + '</span>';
            if (m.time) h += '<span class="kk-tag">⏱ ' + m.time + '</span>';
            h += '</div>';
            h += '</div></div></div>';

            // Buttons
            h += '<div class="kk-actions">';
            if (eps.length && eps[0].server_data && eps[0].server_data.length) {
                var first = eps[0].server_data[0];
                h += '<div class="kk-btn kk-btn--play" data-link="' + (first.link_m3u8 || first.link_embed || '') + '" data-name="' + (m.name || '') + '">▶ Xem Phim</div>';
            }
            h += '<div class="kk-btn kk-btn--fav">♡</div>';
            h += '</div>';

            // Info
            h += '<div class="kk-info-list">';
            if (m.status) h += infoItem('Trạng thái', m.status);
            if (m.episode_total) h += infoItem('Tổng tập', m.episode_total);
            if (m.country && m.country.length) h += infoItem('Quốc gia', m.country.map(function (c) { return c.name; }).join(', '));
            if (m.category && m.category.length) h += infoItem('Thể loại', m.category.map(function (c) { return c.name; }).join(', '));
            if (m.director && m.director.length && m.director[0]) h += infoItem('Đạo diễn', m.director.join(', '));
            if (m.actor && m.actor.length && m.actor[0]) h += infoItem('Diễn viên', m.actor.slice(0, 6).join(', '));
            h += '</div>';

            // Description
            if (m.content) {
                var desc = m.content.replace(/<[^>]*>/g, '');
                h += '<div class="kk-desc collapsed" id="kk-desc">' + desc + '</div>';
                h += '<div class="kk-desc-toggle" id="kk-desc-toggle">Xem thêm ▾</div>';
            }

            // Episodes
            if (eps.length) {
                h += '<div class="kk-section" style="margin-top:1em"><div class="kk-section__title">Danh Sách Tập</div></div>';
                h += '<div class="kk-eps">';
                eps.forEach(function (sv) {
                    if (!sv.server_data || !sv.server_data.length) return;
                    h += '<div class="kk-eps__server">';
                    h += '<div class="kk-eps__sname">' + (sv.server_name || 'Server') + '</div>';
                    h += '<div class="kk-eps__list">';
                    sv.server_data.forEach(function (ep) {
                        var epName = ep.name || ep.slug || '';
                        var epLink = ep.link_m3u8 || ep.link_embed || '';
                        h += '<div class="kk-ep" data-link="' + epLink + '" data-name="' + (m.name || '') + ' - Tập ' + epName + '">' + epName + '</div>';
                    });
                    h += '</div></div>';
                });
                h += '</div>';
            }

            h += '</div>'; // kk-detail end

            wrap.innerHTML = h;

            // Bind events
            var backBtnEl = document.getElementById('kk-back-btn');
            if (backBtnEl) backBtnEl.addEventListener('click', goBack);

            // Play
            wrap.querySelectorAll('.kk-btn--play, .kk-ep').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    playVideo(this.dataset.link, this.dataset.name);
                });
            });

            // Desc toggle
            var descToggle = document.getElementById('kk-desc-toggle');
            var descEl = document.getElementById('kk-desc');
            if (descToggle && descEl) {
                descToggle.addEventListener('click', function () {
                    if (descEl.classList.contains('collapsed')) {
                        descEl.classList.remove('collapsed');
                        descToggle.textContent = 'Thu gọn ▴';
                    } else {
                        descEl.classList.add('collapsed');
                        descToggle.textContent = 'Xem thêm ▾';
                    }
                });
            }
        });
    }

    function renderSearch(wrap, keyword, page) {
        if (!keyword) {
            var h = backBtn();
            h += '<div class="kk-search"><div class="kk-search__box">';
            h += '<input class="kk-search__input" id="kk-sinput" type="text" placeholder="Nhập tên phim...">';
            h += '<div class="kk-search__go" id="kk-sgo">Tìm</div>';
            h += '</div></div>';
            h += '<div id="kk-sresult"></div>';
            wrap.innerHTML = h;
            bindBack(wrap);

            var input = document.getElementById('kk-sinput');
            var goBtn = document.getElementById('kk-sgo');

            function doSearch() {
                var kw = input.value.trim();
                if (kw) {
                    var resultWrap = document.getElementById('kk-sresult');
                    resultWrap.innerHTML = loading();
                    api(CONFIG.api_base + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=1', function (data) {
                        showSearchResults(resultWrap, data, kw, 1);
                    });
                }
            }

            goBtn.addEventListener('click', doSearch);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') doSearch();
            });

            // Auto focus
            setTimeout(function () { input.focus(); }, 300);
            return;
        }

        wrap.innerHTML = loading();
        api(CONFIG.api_base + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + page, function (data) {
            var h = backBtn();
            h += '<div class="kk-search"><div class="kk-search__box">';
            h += '<input class="kk-search__input" id="kk-sinput" type="text" value="' + keyword.replace(/"/g, '&quot;') + '" placeholder="Nhập tên phim...">';
            h += '<div class="kk-search__go" id="kk-sgo">Tìm</div>';
            h += '</div></div>';
            h += '<div id="kk-sresult"></div>';
            wrap.innerHTML = h;
            bindBack(wrap);

            var input = document.getElementById('kk-sinput');
            var goBtn = document.getElementById('kk-sgo');
            function doSearch() {
                var kw = input.value.trim();
                if (kw) navigate('search', { keyword: kw, page: 1 });
            }
            goBtn.addEventListener('click', doSearch);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') doSearch();
            });

            showSearchResults(document.getElementById('kk-sresult'), data, keyword, page);
        });
    }

    function showSearchResults(container, data, keyword, page) {
        if (!data || !data.data || !data.data.items || !data.data.items.length) {
            container.innerHTML = empty('Không tìm thấy "' + keyword + '"');
            return;
        }
        var params = data.data.params || {};
        var pag = params.pagination || {};
        var totalPages = Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1;
        var curPage = parseInt(pag.currentPage) || page;

        var h = '<div class="kk-section"><div class="kk-section__title">Kết quả: "' + keyword + '"</div></div>';
        h += '<div class="kk-grid">';
        data.data.items.forEach(function (item) { h += cardHtml(item, true); });
        h += '</div>';
        h += pagination(curPage, totalPages);

        container.innerHTML = h;
        bindCards(container);
        bindPages(container, function (p) {
            navigate('search', { keyword: keyword, page: p });
        });
    }

    function renderCategories(wrap) {
        var cats = [
            { slug: 'hanh-dong', name: '💥 Hành Động' },
            { slug: 'tinh-cam', name: '💕 Tình Cảm' },
            { slug: 'hai-huoc', name: '😂 Hài Hước' },
            { slug: 'co-trang', name: '🏯 Cổ Trang' },
            { slug: 'tam-ly', name: '🧠 Tâm Lý' },
            { slug: 'hinh-su', name: '🔍 Hình Sự' },
            { slug: 'chien-tranh', name: '⚔️ Chiến Tranh' },
            { slug: 'the-thao', name: '⚽ Thể Thao' },
            { slug: 'vo-thuat', name: '🥋 Võ Thuật' },
            { slug: 'vien-tuong', name: '🚀 Viễn Tưởng' },
            { slug: 'phieu-luu', name: '🗺️ Phiêu Lưu' },
            { slug: 'khoa-hoc', name: '🔬 Khoa Học' },
            { slug: 'kinh-di', name: '👻 Kinh Dị' },
            { slug: 'am-nhac', name: '🎵 Âm Nhạc' },
            { slug: 'than-thoai', name: '🐉 Thần Thoại' },
            { slug: 'tai-lieu', name: '📄 Tài Liệu' },
            { slug: 'gia-dinh', name: '👨‍👩‍👧 Gia Đình' },
            { slug: 'chinh-kich', name: '🎭 Chính Kịch' },
            { slug: 'bi-an', name: '🔮 Bí Ẩn' },
            { slug: 'hoc-duong', name: '🎒 Học Đường' },
            { slug: 'kinh-dien', name: '🏆 Kinh Điển' }
        ];

        var h = backBtn();
        h += '<div class="kk-section"><div class="kk-section__title">Thể Loại Phim</div></div>';
        h += '<div class="kk-chips">';
        cats.forEach(function (c) {
            h += '<div class="kk-chip" data-slug="' + c.slug + '">' + c.name + '</div>';
        });
        h += '</div>';

        wrap.innerHTML = h;
        bindBack(wrap);

        wrap.querySelectorAll('.kk-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                navigate('category', { slug: this.dataset.slug });
            });
        });
    }

    function renderCountries(wrap) {
        var countries = [
            { slug: 'viet-nam', name: '🇻🇳 Việt Nam' },
            { slug: 'han-quoc', name: '🇰🇷 Hàn Quốc' },
            { slug: 'trung-quoc', name: '🇨🇳 Trung Quốc' },
            { slug: 'nhat-ban', name: '🇯🇵 Nhật Bản' },
            { slug: 'thai-lan', name: '🇹🇭 Thái Lan' },
            { slug: 'au-my', name: '🇺🇸 Âu Mỹ' },
            { slug: 'dai-loan', name: '🇹🇼 Đài Loan' },
            { slug: 'hong-kong', name: '🇭🇰 Hồng Kông' },
            { slug: 'an-do', name: '🇮🇳 Ấn Độ' },
            { slug: 'anh', name: '🇬🇧 Anh' },
            { slug: 'phap', name: '🇫🇷 Pháp' },
            { slug: 'duc', name: '🇩🇪 Đức' },
            { slug: 'tay-ban-nha', name: '🇪🇸 Tây Ban Nha' },
            { slug: 'philippines', name: '🇵🇭 Philippines' },
            { slug: 'canada', name: '🇨🇦 Canada' }
        ];

        var h = backBtn();
        h += '<div class="kk-section"><div class="kk-section__title">Quốc Gia</div></div>';
        h += '<div class="kk-chips">';
        countries.forEach(function (c) {
            h += '<div class="kk-chip" data-slug="' + c.slug + '">' + c.name + '</div>';
        });
        h += '</div>';

        wrap.innerHTML = h;
        bindBack(wrap);

        wrap.querySelectorAll('.kk-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                navigate('country', { slug: this.dataset.slug });
            });
        });
    }

    function renderCatList(wrap, slug, page) {
        api(CONFIG.api_base + '/v1/api/the-loai/' + slug + '?page=' + page, function (data) {
            if (!data || !data.data || !data.data.items || !data.data.items.length) {
                wrap.innerHTML = backBtn() + empty();
                bindBack(wrap);
                return;
            }
            var params = data.data.params || {};
            var pag = params.pagination || {};
            var totalPages = Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1;
            var curPage = parseInt(pag.currentPage) || page;
            var title = data.data.titlePage || slug;

            var h = backBtn();
            h += '<div class="kk-section"><div class="kk-section__title">' + title + '</div></div>';
            h += '<div class="kk-grid">';
            data.data.items.forEach(function (item) { h += cardHtml(item, true); });
            h += '</div>';
            h += pagination(curPage, totalPages);

            wrap.innerHTML = h;
            bindCards(wrap);
            bindPages(wrap, function (p) { navigate('category', { slug: slug, page: p }); });
            bindBack(wrap);
        });
    }

    function renderCountryList(wrap, slug, page) {
        api(CONFIG.api_base + '/v1/api/quoc-gia/' + slug + '?page=' + page, function (data) {
            if (!data || !data.data || !data.data.items || !data.data.items.length) {
                wrap.innerHTML = backBtn() + empty();
                bindBack(wrap);
                return;
            }
            var params = data.data.params || {};
            var pag = params.pagination || {};
            var totalPages = Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1;
            var curPage = parseInt(pag.currentPage) || page;
            var title = data.data.titlePage || slug;

            var h = backBtn();
            h += '<div class="kk-section"><div class="kk-section__title">' + title + '</div></div>';
            h += '<div class="kk-grid">';
            data.data.items.forEach(function (item) { h += cardHtml(item, true); });
            h += '</div>';
            h += pagination(curPage, totalPages);

            wrap.innerHTML = h;
            bindCards(wrap);
            bindPages(wrap, function (p) { navigate('country', { slug: slug, page: p }); });
            bindBack(wrap);
        });
    }

    // ============== HELPERS ==============

    function backBtn() {
        return '<div class="kk-back" data-back="1">‹ Quay lại</div>';
    }

    function infoItem(label, value) {
        return '<div class="kk-info-item"><span class="kk-info-item__label">' + label + '</span><span class="kk-info-item__value">' + value + '</span></div>';
    }

    function bindCards(container) {
        container.querySelectorAll('.kk-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var slug = this.dataset.slug;
                if (slug) navigate('detail', { slug: slug });
            });
        });
    }

    function bindPages(container, callback) {
        container.querySelectorAll('.kk-pg').forEach(function (pg) {
            pg.addEventListener('click', function () {
                var p = parseInt(this.dataset.p);
                if (p && callback) callback(p);
            });
        });
    }

    function bindBack(container) {
        container.querySelectorAll('[data-back]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                goBack();
            });
        });
    }

    function playVideo(link, title) {
        if (!link) return;
        try {
            if (typeof Lampa !== 'undefined' && Lampa.Player) {
                var item = { title: title || CONFIG.name, url: link };
                if (link.indexOf('.m3u8') !== -1) {
                    Lampa.Player.play(item);
                    Lampa.Player.playlist([item]);
                } else {
                    // embed fallback
                    Lampa.Player.play(item);
                }
            } else {
                window.open(link, '_blank');
            }
        } catch (e) {
            console.error('KKPhim play error:', e);
            window.open(link, '_blank');
        }
    }

    // ============== LAMPA INTEGRATION ==============

    function initPlugin() {
        addStyles();

        if (typeof Lampa === 'undefined') return;

        // Register component
        Lampa.Component.add('kkphim', function (object) {
            var rootEl = document.createElement('div');
            rootEl.classList.add('kkphim-plugin');
            rootEl.id = 'kkphim-root';
            rootEl.style.cssText = 'height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;';

            this.create = function () {};

            this.start = function () {
                // Cho phép scroll tự do trên mobile
                if (Lampa.Controller) {
                    Lampa.Controller.add('content', {
                        toggle: function () {},
                        left: function () {
                            if (Lampa.Panel) Lampa.Panel.show();
                        },
                        right: function () {},
                        up: function () {},
                        down: function () {},
                        back: function () {
                            Lampa.Activity.backward();
                        }
                    });
                    Lampa.Controller.toggle('content');
                }
                navigate('home');
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return rootEl; };
            this.destroy = function () { rootEl.innerHTML = ''; };
        });

        // Detail component (khi navigate qua Activity.push)
        Lampa.Component.add('kkphim_detail', function (object) {
            var rootEl = document.createElement('div');
            rootEl.classList.add('kkphim-plugin');
            rootEl.id = 'kkphim-root';
            rootEl.style.cssText = 'height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;';

            this.create = function () {};
            this.start = function () {
                if (Lampa.Controller) {
                    Lampa.Controller.add('content', {
                        toggle: function () {},
                        left: function () {},
                        right: function () {},
                        up: function () {},
                        down: function () {},
                        back: function () { Lampa.Activity.backward(); }
                    });
                    Lampa.Controller.toggle('content');
                }
                renderDetail(rootEl, object.slug);
            };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return rootEl; };
            this.destroy = function () { rootEl.innerHTML = ''; };
        });

        // Thêm menu
        if (Lampa.Menu) {
            var btn = $('<li class="menu__item selector" data-action="kkphim">' +
                '<div class="menu__ico">' +
                '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                '</svg></div>' +
                '<div class="menu__text">KKPhim</div></li>');

            btn.on('hover:enter', function () {
                Lampa.Activity.push({
                    component: 'kkphim',
                    title: 'KKPhim'
                });
            });

            $('.menu .menu__list').first().append(btn);
        }

        // Override navigate to use Lampa Activity for detail
        var origNavigate = navigate;
        navigate = function (view, params) {
            params = params || {};
            if (view === 'detail') {
                Lampa.Activity.push({
                    component: 'kkphim_detail',
                    slug: params.slug
                });
            } else {
                var wrap = document.getElementById('kkphim-root');
                if (!wrap) return;
                wrap.scrollTop = 0;
                wrap.innerHTML = loading();
                currentView = { view: view, params: params };

                switch (view) {
                    case 'home': renderHome(wrap); break;
                    case 'new': renderList(wrap, 'new', params.page || 1); break;
                    case 'list': renderList(wrap, params.slug, params.page || 1); break;
                    case 'category': renderCatList(wrap, params.slug, params.page || 1); break;
                    case 'country': renderCountryList(wrap, params.slug, params.page || 1); break;
                    case 'categories': renderCategories(wrap); break;
                    case 'countries': renderCountries(wrap); break;
                    case 'search': renderSearch(wrap, params.keyword, params.page || 1); break;
                    case 'detail': renderDetail(wrap, params.slug); break;
                }
            }
        };

        console.log('✅ KKPhim Plugin loaded!');
        if (Lampa.Noty) Lampa.Noty.show('🎬 KKPhim đã sẵn sàng!', { time: 2000 });
    }

    // ============== START ==============
    function tryInit() {
        if (typeof Lampa !== 'undefined' && Lampa.Component) {
            initPlugin();
            return true;
        }
        return false;
    }

    if (!tryInit()) {
        var tries = 0;
        var wait = setInterval(function () {
            tries++;
            if (tryInit() || tries > 30) clearInterval(wait);
        }, 500);
    }

})();