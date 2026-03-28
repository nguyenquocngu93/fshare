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
            /* Plugin container - KHÔNG chiếm full screen */
            .kkphim-plugin {
                width: 100%;
                min-height: 100%;
                padding-bottom: 4em;
                box-sizing: border-box;
                -webkit-overflow-scrolling: touch;
            }

            /* === NAV MENU === */
            .kk-nav {
                display: flex;
                gap: 0.5em;
                padding: 0.8em 1em;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
                position: sticky;
                top: 0;
                z-index: 50;
                background: rgba(13,13,26,0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255,255,255,0.06);
            }
            .kk-nav::-webkit-scrollbar { display: none; }

            .kk-nav__btn {
                flex-shrink: 0;
                padding: 0.55em 1.1em;
                border-radius: 2em;
                background: rgba(255,255,255,0.07);
                color: rgba(255,255,255,0.75);
                font-size: 0.82em;
                font-weight: 600;
                border: 1px solid rgba(255,255,255,0.08);
                cursor: pointer;
                white-space: nowrap;
                -webkit-tap-highlight-color: transparent;
                transition: all 0.18s;
                user-select: none;
            }
            .kk-nav__btn:active,
            .kk-nav__btn.active {
                background: linear-gradient(135deg, #e53935, #ff5252);
                color: #fff;
                border-color: transparent;
                transform: scale(0.97);
            }

            /* === BACK BUTTON - TO HƠN === */
            .kk-back {
                display: flex;
                align-items: center;
                gap: 0.6em;
                padding: 1em 1.2em;
                color: rgba(255,255,255,0.85);
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                min-height: 54px;
                background: rgba(255,255,255,0.04);
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .kk-back:active { 
                background: rgba(255,255,255,0.1); 
                color: #fff;
            }
            .kk-back__ico {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                font-size: 1.2em;
                flex-shrink: 0;
            }

            /* === SECTION === */
            .kk-section {
                padding: 1em 1em 0.4em;
            }
            .kk-section__head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5em;
            }
            .kk-section__title {
                font-size: 1.1em;
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
                background: linear-gradient(180deg, #e53935, #ff5252);
                border-radius: 2px;
                flex-shrink: 0;
            }

            /* === SCROLL ROW (horizontal) === */
            .kk-row {
                display: flex;
                gap: 0.7em;
                overflow-x: auto;
                padding: 0.3em 1em 0.8em;
                -webkit-overflow-scrolling: touch;
                scroll-snap-type: x proximity;
                scrollbar-width: none;
            }
            .kk-row::-webkit-scrollbar { display: none; }
            .kk-row .kk-card {
                flex-shrink: 0;
                width: 240px;
                scroll-snap-align: start;
            }

            /* === GRID (vertical) === */
            .kk-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.7em;
                padding: 0.3em 1em 0.5em;
            }
            @media (min-width: 480px) {
                .kk-grid { grid-template-columns: repeat(3, 1fr); }
            }
            @media (min-width: 700px) {
                .kk-grid { grid-template-columns: repeat(4, 1fr); }
            }

            /* === CARD WITH BACKDROP === */
            .kk-card {
                position: relative;
                border-radius: 0.7em;
                overflow: hidden;
                background: #16162a;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: transform 0.18s;
                display: block;
            }
            .kk-card:active { transform: scale(0.96); }

            /* Row card - 16:9 */
            .kk-row .kk-card .kk-card__img {
                aspect-ratio: 16/9;
            }

            /* Grid card - 2:3 poster */
            .kk-grid .kk-card .kk-card__img {
                aspect-ratio: 2/3;
            }

            .kk-card__img {
                width: 100%;
                object-fit: cover;
                display: block;
                background: #111;
            }
            .kk-card__overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 70%;
                background: linear-gradient(
                    0deg,
                    rgba(8,8,24,0.96) 0%,
                    rgba(8,8,24,0.5) 55%,
                    transparent 100%
                );
                pointer-events: none;
            }
            .kk-card__badges {
                position: absolute;
                top: 0.35em;
                left: 0.35em;
                right: 0.35em;
                display: flex;
                justify-content: space-between;
                pointer-events: none;
                z-index: 2;
                gap: 0.2em;
            }
            .kk-badge-group { display: flex; gap: 0.2em; }
            .kk-badge {
                padding: 0.12em 0.4em;
                border-radius: 0.25em;
                font-size: 0.6em;
                font-weight: 700;
                text-transform: uppercase;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                white-space: nowrap;
            }
            .kk-badge--q { background: rgba(229,57,53,0.88); color: #fff; }
            .kk-badge--l { background: rgba(33,150,243,0.88); color: #fff; }
            .kk-badge--y { background: rgba(255,193,7,0.88); color: #111; }
            .kk-badge--e { background: rgba(76,175,80,0.88); color: #fff; }

            .kk-card__info {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 0.5em 0.6em;
                z-index: 2;
            }
            .kk-card__name {
                font-size: 0.82em;
                font-weight: 700;
                color: #fff;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-shadow: 0 1px 6px rgba(0,0,0,0.9);
                margin: 0;
            }
            .kk-card__sub {
                font-size: 0.68em;
                color: rgba(255,255,255,0.5);
                margin: 0.1em 0 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* === DETAIL PAGE === */
            .kk-detail__hero {
                position: relative;
                width: 100%;
                aspect-ratio: 16/9;
                overflow: hidden;
                max-height: 260px;
            }
            .kk-detail__hero img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .kk-detail__hero-grad {
                position: absolute;
                bottom: 0; left: 0; right: 0;
                height: 75%;
                background: linear-gradient(0deg, 
                    var(--lampa-background, #0d0d1a) 0%, 
                    transparent 100%);
            }
            .kk-detail__body {
                padding: 0 1em;
                margin-top: -2em;
                position: relative;
                z-index: 2;
            }
            .kk-detail__row {
                display: flex;
                gap: 1em;
                align-items: flex-end;
            }
            .kk-detail__poster {
                flex-shrink: 0;
                width: 100px;
                border-radius: 0.6em;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            }
            .kk-detail__poster img { width: 100%; display: block; }
            .kk-detail__meta {
                flex: 1;
                min-width: 0;
                padding-bottom: 0.3em;
            }
            .kk-detail__title {
                font-size: 1.25em;
                font-weight: 800;
                color: #fff;
                margin: 0 0 0.15em;
                line-height: 1.2;
            }
            .kk-detail__orig {
                font-size: 0.8em;
                color: rgba(255,255,255,0.4);
                margin: 0 0 0.5em;
                font-style: italic;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .kk-detail__tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.3em;
            }
            .kk-tag {
                padding: 0.18em 0.55em;
                border-radius: 1.5em;
                font-size: 0.68em;
                font-weight: 600;
                background: rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.7);
                border: 1px solid rgba(255,255,255,0.1);
            }
            .kk-tag--red { background: rgba(229,57,53,0.2); border-color: rgba(229,57,53,0.4); }
            .kk-tag--blue { background: rgba(33,150,243,0.2); border-color: rgba(33,150,243,0.4); }
            .kk-tag--green { background: rgba(76,175,80,0.2); border-color: rgba(76,175,80,0.4); }

            /* Action Buttons */
            .kk-actions {
                display: flex;
                gap: 0.6em;
                margin: 1em 0 0.8em;
            }
            .kk-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.4em;
                padding: 0.7em 1.2em;
                border-radius: 2em;
                font-size: 0.9em;
                font-weight: 700;
                border: none;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: transform 0.15s, opacity 0.15s;
                user-select: none;
            }
            .kk-btn:active { transform: scale(0.94); opacity: 0.85; }
            .kk-btn--play {
                background: linear-gradient(135deg, #e53935, #ff5252);
                color: #fff;
                box-shadow: 0 4px 16px rgba(229,57,53,0.35);
                flex: 1;
                min-height: 46px;
            }
            .kk-btn--fav {
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.15);
                width: 46px;
                height: 46px;
                border-radius: 50%;
                padding: 0;
                font-size: 1.2em;
                flex-shrink: 0;
            }

            .kk-info-list {
                margin: 0.3em 0 0.5em;
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 0.7em;
                overflow: hidden;
            }
            .kk-info-item {
                display: flex;
                padding: 0.55em 0.8em;
                font-size: 0.82em;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .kk-info-item:last-child { border-bottom: none; }
            .kk-info-item__label {
                color: rgba(255,255,255,0.35);
                min-width: 75px;
                flex-shrink: 0;
            }
            .kk-info-item__value { color: rgba(255,255,255,0.8); }

            .kk-desc {
                font-size: 0.83em;
                color: rgba(255,255,255,0.6);
                line-height: 1.7;
                margin: 0.5em 0;
                position: relative;
            }
            .kk-desc.collapsed {
                max-height: 4.2em;
                overflow: hidden;
            }
            .kk-desc.collapsed::after {
                content: '';
                position: absolute;
                bottom: 0; left: 0; right: 0;
                height: 2em;
                background: linear-gradient(transparent, var(--lampa-background, #0d0d1a));
            }
            .kk-desc-toggle {
                font-size: 0.78em;
                color: #e53935;
                cursor: pointer;
                padding: 0.3em 0;
                -webkit-tap-highlight-color: transparent;
                display: inline-block;
            }
            .kk-desc-toggle:active { opacity: 0.7; }

            /* === EPISODES === */
            .kk-eps__server { margin-bottom: 1em; }
            .kk-eps__sname {
                font-size: 0.75em;
                color: rgba(255,255,255,0.35);
                margin-bottom: 0.4em;
                padding-bottom: 0.3em;
                border-bottom: 1px solid rgba(255,255,255,0.06);
            }
            .kk-eps__list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
            }
            .kk-ep {
                padding: 0.45em 0.85em;
                border-radius: 0.5em;
                background: rgba(255,255,255,0.07);
                color: rgba(255,255,255,0.8);
                font-size: 0.78em;
                font-weight: 600;
                cursor: pointer;
                border: 1px solid rgba(255,255,255,0.08);
                -webkit-tap-highlight-color: transparent;
                transition: all 0.15s;
                min-width: 2.8em;
                text-align: center;
                user-select: none;
                min-height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .kk-ep:active {
                background: rgba(229,57,53,0.75);
                color: #fff;
                transform: scale(0.93);
            }
            .kk-ep.playing {
                background: #e53935;
                color: #fff;
                border-color: #e53935;
            }

            /* === INFINITE SCROLL LOADER === */
            .kk-inf-loader {
                display: flex;
                justify-content: center;
                padding: 1.5em;
            }
            .kk-inf-loader.hidden { display: none; }
            .kk-spin {
                width: 32px; height: 32px;
                border: 3px solid rgba(255,255,255,0.08);
                border-top-color: #e53935;
                border-radius: 50%;
                animation: kkspin 0.7s linear infinite;
            }
            .kk-inf-end {
                text-align: center;
                padding: 1.5em;
                font-size: 0.8em;
                color: rgba(255,255,255,0.2);
                display: none;
            }
            @keyframes kkspin { to { transform: rotate(360deg); } }

            /* === LOADING / EMPTY === */
            .kk-loading {
                display: flex;
                justify-content: center;
                padding: 4em 2em;
            }
            .kk-empty {
                text-align: center;
                padding: 4em 1em;
                color: rgba(255,255,255,0.3);
            }
            .kk-empty__ico { font-size: 2.5em; margin-bottom: 0.3em; }

            /* === CATEGORY CHIPS === */
            .kk-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                padding: 0.5em 1em 1em;
            }
            .kk-chip {
                padding: 0.6em 1.1em;
                border-radius: 2em;
                background: rgba(255,255,255,0.06);
                color: rgba(255,255,255,0.75);
                font-size: 0.85em;
                cursor: pointer;
                border: 1px solid rgba(255,255,255,0.08);
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                min-height: 40px;
                display: flex;
                align-items: center;
            }
            .kk-chip:active {
                background: rgba(229,57,53,0.7);
                color: #fff;
                transform: scale(0.96);
            }

            /* Search */
            .kk-search-bar {
                padding: 0.8em 1em;
                display: flex;
                gap: 0.5em;
            }
            .kk-search-bar input {
                flex: 1;
                padding: 0.75em 1em;
                border-radius: 2em;
                border: 1px solid rgba(255,255,255,0.15);
                background: rgba(255,255,255,0.08);
                color: #fff;
                font-size: 0.9em;
                outline: none;
                -webkit-appearance: none;
                min-height: 46px;
            }
            .kk-search-bar input::placeholder { color: rgba(255,255,255,0.3); }
            .kk-search-bar input:focus {
                border-color: #e53935;
                background: rgba(255,255,255,0.11);
            }
            .kk-search-bar button {
                padding: 0 1.2em;
                border-radius: 2em;
                background: #e53935;
                color: #fff;
                font-weight: 700;
                border: none;
                cursor: pointer;
                font-size: 0.9em;
                -webkit-tap-highlight-color: transparent;
                min-height: 46px;
                min-width: 60px;
            }
            .kk-search-bar button:active { opacity: 0.8; }
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

    function imgUrl(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return CONFIG.img_base + path;
    }

    // ============== RENDER HELPERS ==============

    function spinnerHtml() {
        return '<div class="kk-loading"><div class="kk-spin"></div></div>';
    }

    function emptyHtml(msg) {
        return '<div class="kk-empty"><div class="kk-empty__ico">📭</div><div>' + (msg || 'Không có dữ liệu') + '</div></div>';
    }

    function cardHtml(item) {
        var name    = item.name || '';
        var orig    = item.origin_name || '';
        var slug    = item.slug || '';
        var year    = item.year || '';
        var quality = item.quality || '';
        var lang    = item.lang || '';
        var epCur   = item.episode_current || '';
        var backdrop = imgUrl(item.poster_url || item.thumb_url);
        var thumb    = imgUrl(item.thumb_url || item.poster_url);

        return [
            '<div class="kk-card" data-slug="' + slug + '">',
              '<div class="kk-card__badges">',
                '<div class="kk-badge-group">',
                  quality ? '<span class="kk-badge kk-badge--q">' + quality + '</span>' : '',
                  lang    ? '<span class="kk-badge kk-badge--l">' + lang + '</span>' : '',
                '</div>',
                '<div class="kk-badge-group">',
                  year  ? '<span class="kk-badge kk-badge--y">' + year + '</span>' : '',
                  epCur ? '<span class="kk-badge kk-badge--e">' + epCur + '</span>' : '',
                '</div>',
              '</div>',
              '<img class="kk-card__img" src="' + backdrop + '" loading="lazy"',
                ' onerror="this.src=\'' + thumb + '\'"',
              '>',
              '<div class="kk-card__overlay"></div>',
              '<div class="kk-card__info">',
                '<p class="kk-card__name">' + name + '</p>',
                orig ? '<p class="kk-card__sub">' + orig + '</p>' : '',
              '</div>',
            '</div>'
        ].join('');
    }

    function infoItemHtml(label, value) {
        return '<div class="kk-info-item"><span class="kk-info-item__label">' + label + '</span><span class="kk-info-item__value">' + value + '</span></div>';
    }

    function backBtnHtml(label) {
        return '<div class="kk-back" data-back="1"><div class="kk-back__ico">‹</div>' + (label || 'Quay lại') + '</div>';
    }

    // ============== INFINITE SCROLL ENGINE ==============
    function InfiniteList(opts) {
        // opts: { container, fetchFn, renderItem, onEmpty, scrollEl }
        this.page        = 0;
        this.totalPages  = 1;
        this.loading     = false;
        this.done        = false;
        this.container   = opts.container;   // grid/row element
        this.fetchFn     = opts.fetchFn;     // fn(page, callback(items, totalPages))
        this.renderItem  = opts.renderItem;  // fn(item) -> html string
        this.onEmpty     = opts.onEmpty;
        this.scrollEl    = opts.scrollEl;    // element to watch scroll on

        this.loaderEl = document.createElement('div');
        this.loaderEl.className = 'kk-inf-loader hidden';
        this.loaderEl.innerHTML = '<div class="kk-spin"></div>';

        this.endEl = document.createElement('div');
        this.endEl.className = 'kk-inf-end';
        this.endEl.textContent = '— Hết danh sách —';

        var self = this;
        this._scrollHandler = function () { self._onScroll(); };
        this.scrollEl.addEventListener('scroll', this._scrollHandler, { passive: true });

        this.loadNext();
    }

    InfiniteList.prototype.loadNext = function () {
        if (this.loading || this.done) return;
        this.loading = true;
        this.loaderEl.classList.remove('hidden');

        var self = this;
        var nextPage = this.page + 1;

        this.fetchFn(nextPage, function (items, totalPages) {
            self.loading = false;
            self.loaderEl.classList.add('hidden');
            self.totalPages = totalPages || 1;
            self.page = nextPage;

            if (!items || !items.length) {
                if (self.page === 1 && self.onEmpty) self.onEmpty();
                self._finish();
                return;
            }

            var frag = document.createDocumentFragment();
            items.forEach(function (item) {
                var div = document.createElement('div');
                div.innerHTML = self.renderItem(item);
                var card = div.firstElementChild;
                card.addEventListener('click', function () {
                    var slug = this.dataset.slug;
                    if (slug) openDetail(slug);
                });
                frag.appendChild(card);
            });
            self.container.appendChild(frag);

            // Append loader & end after grid
            if (!self.loaderEl.parentElement) {
                self.container.parentElement.appendChild(self.loaderEl);
                self.container.parentElement.appendChild(self.endEl);
            }

            if (self.page >= self.totalPages) {
                self._finish();
            }
        });
    };

    InfiniteList.prototype._onScroll = function () {
        if (this.done || this.loading) return;
        var el = this.scrollEl;
        var threshold = 300;
        var remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (remaining < threshold) {
            this.loadNext();
        }
    };

    InfiniteList.prototype._finish = function () {
        this.done = true;
        this.loaderEl.classList.add('hidden');
        this.endEl.style.display = 'block';
        this.scrollEl.removeEventListener('scroll', this._scrollHandler);
    };

    InfiniteList.prototype.destroy = function () {
        this.done = true;
        this.scrollEl.removeEventListener('scroll', this._scrollHandler);
    };

    // ============== CURRENT STATE ==============
    var currentInfList = null;

    function destroyInfList() {
        if (currentInfList) {
            currentInfList.destroy();
            currentInfList = null;
        }
    }

    // ============== DETAIL OPEN ==============
    function openDetail(slug) {
        if (typeof Lampa !== 'undefined' && Lampa.Activity) {
            Lampa.Activity.push({
                component: 'kkphim_detail',
                slug: slug,
                title: 'KKPhim'
            });
        }
    }

    // ============== FETCH FUNCTIONS ==============
    function fetchNew(page, cb) {
        api(CONFIG.api_base + '/danh-sach/phim-moi-cap-nhat?page=' + page, function (data) {
            if (!data || !data.items) return cb([], 1);
            var total = data.pagination ? (data.pagination.totalPages || 1) : 1;
            cb(data.items, total);
        });
    }

    function fetchList(type, page, cb) {
        api(CONFIG.api_base + '/v1/api/danh-sach/' + type + '?page=' + page, function (data) {
            if (!data || !data.data || !data.data.items) return cb([], 1);
            var pag = (data.data.params && data.data.params.pagination) || {};
            var total = Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1;
            cb(data.data.items, total);
        });
    }

    function fetchCategory(slug, page, cb) {
        api(CONFIG.api_base + '/v1/api/the-loai/' + slug + '?page=' + page, function (data) {
            if (!data || !data.data || !data.data.items) return cb([], 1);
            var pag = (data.data.params && data.data.params.pagination) || {};
            var total = Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1;
            cb(data.data.items, total);
        });
    }

    function fetchCountry(slug, page, cb) {
        api(CONFIG.api_base + '/v1/api/quoc-gia/' + slug + '?page=' + page, function (data) {
            if (!data || !data.data || !data.data.items) return cb([], 1);
            var pag = (data.data.params && data.data.params.pagination) || {};
            var total = Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1;
            cb(data.data.items, total);
        });
    }

    function fetchSearch(keyword, page, cb) {
        api(CONFIG.api_base + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + page, function (data) {
            if (!data || !data.data || !data.data.items) return cb([], 1);
            var pag = (data.data.params && data.data.params.pagination) || {};
            var total = Math.ceil((pag.totalItems || 0) / (pag.totalItemsPerPage || 24)) || 1;
            cb(data.data.items, total);
        });
    }

    // ============== VIEWS ==============

    function renderHome(rootEl) {
        destroyInfList();

        var navItems = [
            { icon: '🆕', text: 'Phim Mới',   view: 'new' },
            { icon: '🎬', text: 'Phim Lẻ',    view: 'list', slug: 'phim-le' },
            { icon: '📺', text: 'Phim Bộ',    view: 'list', slug: 'phim-bo' },
            { icon: '🎭', text: 'Hoạt Hình',  view: 'list', slug: 'hoat-hinh' },
            { icon: '📡', text: 'TV Shows',   view: 'list', slug: 'tv-shows' },
            { icon: '🏷️', text: 'Thể Loại',   view: 'categories' },
            { icon: '🌍', text: 'Quốc Gia',   view: 'countries' },
            { icon: '🔍', text: 'Tìm Kiếm',   view: 'search' }
        ];

        var navHtml = '<div class="kk-nav" id="kk-nav">';
        navItems.forEach(function (n) {
            navHtml += '<div class="kk-nav__btn" data-view="' + n.view + '"' +
                (n.slug ? ' data-slug="' + n.slug + '"' : '') + '>' +
                n.icon + ' ' + n.text + '</div>';
        });
        navHtml += '</div>';

        var sectionsHtml = [
            { key: 'new',   title: 'Phim Mới',     view: 'new',  slug: '' },
            { key: 'le',    title: 'Phim Lẻ',      view: 'list', slug: 'phim-le' },
            { key: 'bo',    title: 'Phim Bộ',      view: 'list', slug: 'phim-bo' },
            { key: 'anime', title: 'Hoạt Hình',    view: 'list', slug: 'hoat-hinh' }
        ].map(function (s) {
            return '<div class="kk-section"><div class="kk-section__head">' +
                '<div class="kk-section__title">' + s.title + '</div>' +
                '<div class="kk-section__more" data-view="' + s.view + '"' + (s.slug ? ' data-slug="' + s.slug + '"' : '') + '>Xem thêm ›</div>' +
                '</div></div>' +
                '<div class="kk-row" id="kk-row-' + s.key + '"><div class="kk-spin" style="margin:1em auto;display:block"></div></div>';
        }).join('');

        rootEl.innerHTML = navHtml + sectionsHtml;

        // Bind nav
        rootEl.querySelectorAll('.kk-nav__btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                navigate(this.dataset.view, { slug: this.dataset.slug });
            });
        });

        // Bind "Xem thêm"
        rootEl.querySelectorAll('.kk-section__more').forEach(function (btn) {
            btn.addEventListener('click', function () {
                navigate(this.dataset.view, { slug: this.dataset.slug });
            });
        });

        // Fetch each row
        var rows = [
            { key: 'new',   fn: function(cb){ fetchNew(1, cb); } },
            { key: 'le',    fn: function(cb){ fetchList('phim-le', 1, cb); } },
            { key: 'bo',    fn: function(cb){ fetchList('phim-bo', 1, cb); } },
            { key: 'anime', fn: function(cb){ fetchList('hoat-hinh', 1, cb); } }
        ];

        rows.forEach(function (r) {
            r.fn(function (items) {
                var rowEl = document.getElementById('kk-row-' + r.key);
                if (!rowEl) return;
                if (!items || !items.length) { rowEl.innerHTML = ''; return; }
                rowEl.innerHTML = items.slice(0, 12).map(cardHtml).join('');
                rowEl.querySelectorAll('.kk-card').forEach(function (card) {
                    card.addEventListener('click', function () {
                        openDetail(this.dataset.slug);
                    });
                });
            });
        });
    }

    // --- Infinite list page ---
    function renderInfiniteList(rootEl, scrollEl, title, fetchFn) {
        destroyInfList();

        rootEl.innerHTML =
            backBtnHtml() +
            '<div class="kk-section"><div class="kk-section__title">' + title + '</div></div>' +
            '<div class="kk-grid" id="kk-inf-grid"></div>';

        bindBack(rootEl);

        var gridEl = rootEl.querySelector('#kk-inf-grid');

        currentInfList = new InfiniteList({
            container:  gridEl,
            fetchFn:    fetchFn,
            renderItem: cardHtml,
            scrollEl:   scrollEl,
            onEmpty: function () {
                gridEl.innerHTML = emptyHtml();
            }
        });
    }

    // --- Search view ---
    function renderSearch(rootEl, scrollEl, keyword) {
        destroyInfList();

        rootEl.innerHTML =
            backBtnHtml() +
            '<div class="kk-search-bar">' +
              '<input id="kk-sinput" type="text" placeholder="Nhập tên phim..." value="' + (keyword ? keyword.replace(/"/g, '&quot;') : '') + '">' +
              '<button id="kk-sgo">🔍</button>' +
            '</div>' +
            '<div id="kk-sarea"></div>';

        bindBack(rootEl);

        var input  = rootEl.querySelector('#kk-sinput');
        var goBtn  = rootEl.querySelector('#kk-sgo');
        var sArea  = rootEl.querySelector('#kk-sarea');

        function doSearch() {
            var kw = input.value.trim();
            if (!kw) return;

            destroyInfList();
            sArea.innerHTML = '<div class="kk-grid" id="kk-inf-grid"></div>';
            var gridEl = sArea.querySelector('#kk-inf-grid');

            currentInfList = new InfiniteList({
                container:  gridEl,
                fetchFn:    function (p, cb) { fetchSearch(kw, p, cb); },
                renderItem: cardHtml,
                scrollEl:   scrollEl,
                onEmpty: function () {
                    gridEl.innerHTML = emptyHtml('Không tìm thấy "' + kw + '"');
                }
            });
        }

        goBtn.addEventListener('click', doSearch);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') doSearch();
        });

        if (keyword) doSearch();
        else setTimeout(function () { input.focus(); }, 300);
    }

    // --- Categories view ---
    function renderCategories(rootEl) {
        destroyInfList();
        var cats = [
            {slug:'hanh-dong',name:'💥 Hành Động'},
            {slug:'tinh-cam',name:'💕 Tình Cảm'},
            {slug:'hai-huoc',name:'😂 Hài Hước'},
            {slug:'co-trang',name:'🏯 Cổ Trang'},
            {slug:'tam-ly',name:'🧠 Tâm Lý'},
            {slug:'hinh-su',name:'🔍 Hình Sự'},
            {slug:'chien-tranh',name:'⚔️ Chiến Tranh'},
            {slug:'the-thao',name:'⚽ Thể Thao'},
            {slug:'vo-thuat',name:'🥋 Võ Thuật'},
            {slug:'vien-tuong',name:'🚀 Viễn Tưởng'},
            {slug:'phieu-luu',name:'🗺️ Phiêu Lưu'},
            {slug:'khoa-hoc',name:'🔬 Khoa Học'},
            {slug:'kinh-di',name:'👻 Kinh Dị'},
            {slug:'am-nhac',name:'🎵 Âm Nhạc'},
            {slug:'than-thoai',name:'🐉 Thần Thoại'},
            {slug:'tai-lieu',name:'📄 Tài Liệu'},
            {slug:'gia-dinh',name:'👨‍👩‍👧 Gia Đình'},
            {slug:'chinh-kich',name:'🎭 Chính Kịch'},
            {slug:'bi-an',name:'🔮 Bí Ẩn'},
            {slug:'hoc-duong',name:'🎒 Học Đường'}
        ];

        rootEl.innerHTML = backBtnHtml() +
            '<div class="kk-section"><div class="kk-section__title">Thể Loại Phim</div></div>' +
            '<div class="kk-chips">' +
            cats.map(function(c){
                return '<div class="kk-chip" data-slug="' + c.slug + '">' + c.name + '</div>';
            }).join('') + '</div>';

        bindBack(rootEl);
        rootEl.querySelectorAll('.kk-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                navigate('category', { slug: this.dataset.slug });
            });
        });
    }

    // --- Countries view ---
    function renderCountries(rootEl) {
        destroyInfList();
        var list = [
            {slug:'viet-nam',name:'🇻🇳 Việt Nam'},
            {slug:'han-quoc',name:'🇰🇷 Hàn Quốc'},
            {slug:'trung-quoc',name:'🇨🇳 Trung Quốc'},
            {slug:'nhat-ban',name:'🇯🇵 Nhật Bản'},
            {slug:'thai-lan',name:'🇹🇭 Thái Lan'},
            {slug:'au-my',name:'🇺🇸 Âu Mỹ'},
            {slug:'dai-loan',name:'🇹🇼 Đài Loan'},
            {slug:'hong-kong',name:'🇭🇰 Hồng Kông'},
            {slug:'an-do',name:'🇮🇳 Ấn Độ'},
            {slug:'anh',name:'🇬🇧 Anh'},
            {slug:'phap',name:'🇫🇷 Pháp'},
            {slug:'duc',name:'🇩🇪 Đức'},
            {slug:'tay-ban-nha',name:'🇪🇸 Tây Ban Nha'},
            {slug:'philippines',name:'🇵🇭 Philippines'},
            {slug:'canada',name:'🇨🇦 Canada'}
        ];

        rootEl.innerHTML = backBtnHtml() +
            '<div class="kk-section"><div class="kk-section__title">Quốc Gia</div></div>' +
            '<div class="kk-chips">' +
            list.map(function(c){
                return '<div class="kk-chip" data-slug="' + c.slug + '">' + c.name + '</div>';
            }).join('') + '</div>';

        bindBack(rootEl);
        rootEl.querySelectorAll('.kk-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                navigate('country', { slug: this.dataset.slug });
            });
        });
    }

    // --- Detail view (separate Activity) ---
    function renderDetail(rootEl, slug) {
        rootEl.innerHTML = spinnerHtml();

        api(CONFIG.api_base + '/phim/' + slug, function (data) {
            if (!data || !data.movie) {
                rootEl.innerHTML = backBtnHtml() + emptyHtml('Không tìm thấy phim');
                bindBack(rootEl);
                return;
            }

            var m   = data.movie;
            var eps = data.episodes || [];
            var backdrop = imgUrl(m.poster_url || m.thumb_url);
            var thumb    = imgUrl(m.thumb_url  || m.poster_url);

            var h = '';

            // Back
            h += backBtnHtml();

            // Hero
            h += '<div class="kk-detail__hero"><img src="' + backdrop + '" onerror="this.style.opacity=0">';
            h += '<div class="kk-detail__hero-grad"></div></div>';

            // Body
            h += '<div class="kk-detail__body">';
            h += '<div class="kk-detail__row">';
            h += '<div class="kk-detail__poster"><img src="' + thumb + '"></div>';
            h += '<div class="kk-detail__meta">';
            h += '<h1 class="kk-detail__title">' + (m.name || '') + '</h1>';
            if (m.origin_name) h += '<p class="kk-detail__orig">' + m.origin_name + '</p>';
            h += '<div class="kk-detail__tags">';
            if (m.quality) h += '<span class="kk-tag kk-tag--red">' + m.quality + '</span>';
            if (m.lang)    h += '<span class="kk-tag kk-tag--blue">' + m.lang + '</span>';
            if (m.year)    h += '<span class="kk-tag">' + m.year + '</span>';
            if (m.episode_current) h += '<span class="kk-tag kk-tag--green">' + m.episode_current + '</span>';
            if (m.time)    h += '<span class="kk-tag">⏱ ' + m.time + '</span>';
            h += '</div></div></div>';

            // Buttons
            h += '<div class="kk-actions">';
            var firstLink = '';
            var firstName = m.name || '';
            if (eps.length && eps[0].server_data && eps[0].server_data.length) {
                firstLink = eps[0].server_data[0].link_m3u8 || eps[0].server_data[0].link_embed || '';
            }
            h += '<div class="kk-btn kk-btn--play" id="kk-playfirst" data-link="' + firstLink + '" data-name="' + firstName + '">▶ Xem Phim</div>';
            h += '<div class="kk-btn kk-btn--fav" id="kk-fav">♡</div>';
            h += '</div>';

            // Info
            h += '<div class="kk-info-list">';
            if (m.status)   h += infoItemHtml('Trạng thái', m.status);
            if (m.episode_total) h += infoItemHtml('Tổng tập', m.episode_total);
            if (m.country && m.country.length) h += infoItemHtml('Quốc gia', m.country.map(function(c){ return c.name; }).join(', '));
            if (m.category && m.category.length) h += infoItemHtml('Thể loại', m.category.map(function(c){ return c.name; }).join(', '));
            if (m.director && m.director.length && m.director[0]) h += infoItemHtml('Đạo diễn', m.director.join(', '));
            if (m.actor && m.actor.length && m.actor[0]) h += infoItemHtml('Diễn viên', m.actor.slice(0, 5).join(', '));
            h += '</div>';

            // Desc
            if (m.content) {
                var desc = m.content.replace(/<[^>]*>/g, '');
                h += '<div class="kk-desc collapsed" id="kk-desc">' + desc + '</div>';
                h += '<div class="kk-desc-toggle" id="kk-dtoggle">Xem thêm ▾</div>';
            }

            h += '</div>'; // detail body

            // Episodes
            if (eps.length) {
                h += '<div class="kk-section" style="margin-top:0.5em"><div class="kk-section__title">Danh Sách Tập</div></div>';
                h += '<div style="padding:0 1em 1em">';
                eps.forEach(function (sv) {
                    if (!sv.server_data || !sv.server_data.length) return;
                    h += '<div class="kk-eps__server">';
                    h += '<div class="kk-eps__sname">' + (sv.server_name || 'Server') + '</div>';
                    h += '<div class="kk-eps__list">';
                    sv.server_data.forEach(function (ep) {
                        var n = ep.name || ep.slug || '';
                        var l = ep.link_m3u8 || ep.link_embed || '';
                        h += '<div class="kk-ep" data-link="' + l + '" data-name="' + (m.name || '') + ' - Tập ' + n + '">' + n + '</div>';
                    });
                    h += '</div></div>';
                });
                h += '</div>';
            }

            rootEl.innerHTML = h;
            rootEl.scrollTop = 0;

            // Bind back
            bindBack(rootEl);

            // Bind play buttons
            rootEl.querySelectorAll('.kk-btn--play, .kk-ep').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    playVideo(this.dataset.link, this.dataset.name);
                    // Mark playing ep
                    rootEl.querySelectorAll('.kk-ep').forEach(function(e){ e.classList.remove('playing'); });
                    if (this.classList.contains('kk-ep')) this.classList.add('playing');
                });
            });

            // Desc toggle
            var descEl    = rootEl.querySelector('#kk-desc');
            var descToggle = rootEl.querySelector('#kk-dtoggle');
            if (descEl && descToggle) {
                descToggle.addEventListener('click', function () {
                    var collapsed = descEl.classList.toggle('collapsed');
                    descToggle.textContent = collapsed ? 'Xem thêm ▾' : 'Thu gọn ▴';
                });
            }
        });
    }

    // ============== HELPERS ==============
    function bindBack(container) {
        container.querySelectorAll('[data-back]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (typeof Lampa !== 'undefined' && Lampa.Activity) {
                    Lampa.Activity.backward();
                }
            });
        });
    }

    function playVideo(link, title) {
        if (!link) {
            if (typeof Lampa !== 'undefined' && Lampa.Noty) {
                Lampa.Noty.show('⚠️ Không có link phát');
            }
            return;
        }
        try {
            if (typeof Lampa !== 'undefined' && Lampa.Player) {
                var item = { title: title || 'KKPhim', url: link };
                Lampa.Player.play(item);
                Lampa.Player.playlist([item]);
            } else {
                window.open(link, '_blank');
            }
        } catch(e) {
            window.open(link, '_blank');
        }
    }

    // ============== MAIN NAVIGATE (in-page) ==============
    function navigate(view, params) {
        params = params || {};
        var rootEl  = document.getElementById('kkphim-root');
        var scrollEl = document.getElementById('kkphim-scroll');
        if (!rootEl || !scrollEl) return;

        // Scroll về đầu
        scrollEl.scrollTop = 0;
        rootEl.innerHTML   = spinnerHtml();

        var titleMap = {
            'new'       : '🆕 Phim Mới Cập Nhật',
            'phim-le'   : '🎬 Phim Lẻ',
            'phim-bo'   : '📺 Phim Bộ',
            'hoat-hinh' : '🎭 Hoạt Hình',
            'tv-shows'  : '📡 TV Shows'
        };

        switch (view) {
            case 'home':
                renderHome(rootEl);
                break;

            case 'new':
                renderInfiniteList(rootEl, scrollEl,
                    titleMap['new'],
                    function (p, cb) { fetchNew(p, cb); });
                break;

            case 'list':
                renderInfiniteList(rootEl, scrollEl,
                    titleMap[params.slug] || params.slug,
                    function (p, cb) { fetchList(params.slug, p, cb); });
                break;

            case 'category':
                renderInfiniteList(rootEl, scrollEl,
                    params.slug,
                    function (p, cb) { fetchCategory(params.slug, p, cb); });
                break;

            case 'country':
                renderInfiniteList(rootEl, scrollEl,
                    params.slug,
                    function (p, cb) { fetchCountry(params.slug, p, cb); });
                break;

            case 'categories':
                renderCategories(rootEl);
                break;

            case 'countries':
                renderCountries(rootEl);
                break;

            case 'search':
                renderSearch(rootEl, scrollEl, params.keyword || null);
                break;

            case 'detail':
                // Dùng separate Activity để giữ menu Lampa
                openDetail(params.slug);
                break;
        }
    }

    // ============== LAMPA INTEGRATION ==============
    function initPlugin() {
        addStyles();
        if (typeof Lampa === 'undefined') return;

        // ---- Component chính (Home/List/Search/...) ----
        Lampa.Component.add('kkphim', function (object) {
            // scrollEl: wrapper có overflow-y: auto
            var scrollEl = document.createElement('div');
            scrollEl.id  = 'kkphim-scroll';
            scrollEl.style.cssText = [
                'height:100%',
                'overflow-y:auto',
                'overflow-x:hidden',
                '-webkit-overflow-scrolling:touch',
                'overscroll-behavior:contain'
            ].join(';');

            // rootEl: nội dung bên trong
            var rootEl = document.createElement('div');
            rootEl.className = 'kkphim-plugin';
            rootEl.id = 'kkphim-root';
            scrollEl.appendChild(rootEl);

            this.create = function () {};

            this.start = function () {
                // Controller tối giản - KHÔNG dùng collectionFocus
                // để tránh chặn touch scroll
                if (Lampa.Controller) {
                    Lampa.Controller.add('content', {
                        toggle : function () {},
                        left   : function () { if (Lampa.Panel) Lampa.Panel.show(); },
                        right  : function () {},
                        up     : function () {},
                        down   : function () {},
                        back   : function () { Lampa.Activity.backward(); }
                    });
                    Lampa.Controller.toggle('content');
                }
                navigate('home');
            };

            this.pause   = function () {};
            this.stop    = function () { destroyInfList(); };
            this.render  = function () { return scrollEl; };
            this.destroy = function () {
                destroyInfList();
                scrollEl.innerHTML = '';
            };
        });

        // ---- Component Detail (riêng để giữ back stack) ----
        Lampa.Component.add('kkphim_detail', function (object) {
            var scrollEl = document.createElement('div');
            scrollEl.style.cssText = [
                'height:100%',
                'overflow-y:auto',
                'overflow-x:hidden',
                '-webkit-overflow-scrolling:touch',
                'overscroll-behavior:contain'
            ].join(';');

            var rootEl = document.createElement('div');
            rootEl.className = 'kkphim-plugin';
            scrollEl.appendChild(rootEl);

            this.create = function () {};

            this.start = function () {
                if (Lampa.Controller) {
                    Lampa.Controller.add('content', {
                        toggle : function () {},
                        left   : function () {},
                        right  : function () {},
                        up     : function () {},
                        down   : function () {},
                        back   : function () { Lampa.Activity.backward(); }
                    });
                    Lampa.Controller.toggle('content');
                }
                renderDetail(rootEl, object.slug);
            };

            this.pause   = function () {};
            this.stop    = function () {};
            this.render  = function () { return scrollEl; };
            this.destroy = function () { scrollEl.innerHTML = ''; };
        });

        // ---- Thêm vào menu Lampa ----
        // Dùng Lampa.Menu.add nếu có, fallback DOM inject
        var menuAdded = false;

        if (Lampa.Menu && typeof Lampa.Menu.add === 'function') {
            try {
                Lampa.Menu.add({
                    title    : 'KKPhim',
                    component: 'kkphim',
                    icon     : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>'
                });
                menuAdded = true;
            } catch(e) {}
        }

        if (!menuAdded) {
            // Fallback: inject vào DOM menu
            function injectMenu() {
                if (document.querySelector('[data-action="kkphim"]')) return;
                var menuList = document.querySelector('.menu .menu__list');
                if (!menuList) return;

                var li = document.createElement('li');
                li.className = 'menu__item selector';
                li.setAttribute('data-action', 'kkphim');
                li.innerHTML =
                    '<div class="menu__ico">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor" style="width:1.4em;height:1.4em">' +
                    '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                    '</svg></div>' +
                    '<div class="menu__text">KKPhim</div>';

                li.addEventListener('click', function () {
                    Lampa.Activity.push({ component: 'kkphim', title: 'KKPhim' });
                });

                // Nếu Lampa dùng hover:enter (TV)
                $(li).on('hover:enter', function () {
                    Lampa.Activity.push({ component: 'kkphim', title: 'KKPhim' });
                });

                menuList.appendChild(li);
            }

            injectMenu();
            // Thử lại sau nếu DOM chưa sẵn
            setTimeout(injectMenu, 1000);
            setTimeout(injectMenu, 3000);
        }

        if (Lampa.Noty) Lampa.Noty.show('🎬 KKPhim sẵn sàng!', { time: 2000 });
        console.log('[KKPhim] Plugin loaded OK');
    }

    // ============== BOOT ==============
    function boot() {
        if (typeof Lampa !== 'undefined' && Lampa.Component && Lampa.Activity) {
            initPlugin();
        } else {
            var t = 0;
            var iv = setInterval(function () {
                t += 500;
                if ((typeof Lampa !== 'undefined' && Lampa.Component && Lampa.Activity) || t > 15000) {
                    clearInterval(iv);
                    if (typeof Lampa !== 'undefined') initPlugin();
                }
            }, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();