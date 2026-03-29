(function () {
    'use strict';

    var API = 'https://phimapi.com/';
    var IMG = 'https://phimimg.com/';
    var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_IMG = 'https://image.tmdb.org/t/p/original';
    var TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';

    function fullImg(url) {
        if (!url) return '';
        return url.indexOf('http') === 0 ? url : IMG + url;
    }

    async function tmdbFetch(path) {
        var res = await fetch('https://api.themoviedb.org/3' + path, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + TMDB_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error('TMDB error');
        return await res.json();
    }

    function detectTMDBType(data) {
        if (data && data.tmdb && data.tmdb.type) {
            if (data.tmdb.type === 'tv') return 'tv';
            if (data.tmdb.type === 'movie') return 'movie';
        }

        if (data && (data.type === 'series' || data.type === 'tvshows' || data.type === 'hoathinh')) return 'tv';
        if (data && data.episode_total && data.episode_total !== '1') return 'tv';

        return 'movie';
    }

    function getTMDBId(data) {
        if (data && data.tmdb && data.tmdb.id) return data.tmdb.id;
        return null;
    }

    function pickLogo(images) {
        if (!images || !images.logos || !images.logos.length) return null;

        var vi = images.logos.find(function (l) { return l.iso_639_1 === 'vi'; });
        var en = images.logos.find(function (l) { return l.iso_639_1 === 'en'; });

        return vi || en || images.logos[0] || null;
    }

    function enableGlobalMobileTouch() {
        $('body, .activity, .activity__body, .activity__content, .scroll, .scroll__body').css({
            '-webkit-overflow-scrolling': 'touch',
            'touch-action': 'auto'
        });
    }

    function addTouchScroll(el) {
        el.css({
            'overflow-y': 'scroll',
            'overflow-x': 'hidden',
            '-webkit-overflow-scrolling': 'touch',
            'touch-action': 'manipulation',
            'padding-bottom': '14em',
            'box-sizing': 'border-box'
        });

        if (el[0]) {
            el[0].style.setProperty('overflow-y', 'scroll', 'important');
            el[0].style.setProperty('overflow-x', 'hidden', 'important');
            el[0].style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
            el[0].style.setProperty('touch-action', 'manipulation', 'important');
            el[0].style.setProperty('padding-bottom', '14em', 'important');
        }

        $('.activity__body, .activity__content').css({
            'overflow': 'hidden'
        });
    }

    function unlockDetailScroll(el) {
        setTimeout(function () {
            if (!el || !el[0]) return;

            var node = el[0];
            node.scrollTop = 1;

            $('.activity__body, .activity__content, .scroll, .scroll__body').css({
                'touch-action': 'auto',
                '-webkit-overflow-scrolling': 'touch'
            });

            node.addEventListener('touchmove', function(){}, { passive: true });
        }, 100);
    }

    function injectStyle() {
        if ($('#kkphim-style').length) return;

        var css = `
        <style id="kkphim-style">
            .kkphim-page,
            .kkphim-detail-page {
                min-height: 100%;
                background: #141414;
                color: #fff;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                -webkit-overflow-scrolling: touch !important;
                touch-action: auto !important;
                padding-bottom: 14em;
                box-sizing: border-box;
            }

            .kkphim-page-scroll {
                padding: 1.15em 0 2em;
            }

            .kkphim-row {
                margin-bottom: 2em;
            }

            .kkphim-row-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1em;
                padding: 0 1.2em;
                margin-bottom: 0.9em;
            }

            .kkphim-row-title {
                font-size: 1.65em;
                font-weight: 900;
                line-height: 1.2;
                color: #fff;
            }

            .kkphim-row-more {
                flex-shrink: 0;
                font-size: 1em;
                font-weight: 800;
                padding: 0.55em 1em;
                border-radius: 999px;
                background: rgba(255,255,255,0.12);
                color: #fff;
                cursor: pointer;
            }

            .kkphim-row-more.focus {
                background: #fff;
                color: #000;
            }

            .kkphim-row-list {
                display: flex;
                gap: 1em;
                overflow-x: auto;
                overflow-y: hidden;
                padding: 0 1.2em 0.4em;
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
            }

            .kkphim-row-list::-webkit-scrollbar,
            .kkphim-cast-row::-webkit-scrollbar {
                display: none;
            }

            .kkphim-card {
                flex: 0 0 auto;
                width: 9.8em;
                cursor: pointer;
            }

            .kkphim-card-grid {
                width: 100%;
            }

            .kkphim-card-poster {
                position: relative;
                width: 100%;
                aspect-ratio: 2 / 3;
                border-radius: 0.9em;
                overflow: hidden;
                background: #232323;
                box-shadow: 0 0.4em 1.4em rgba(0,0,0,0.22);
            }

            .kkphim-card-poster img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .kkphim-card-quality {
                position: absolute;
                top: 0.65em;
                left: 0.65em;
                padding: 0.28em 0.55em;
                border-radius: 0.45em;
                background: #f6c344;
                color: #000;
                font-size: 0.72em;
                font-weight: 800;
            }

            .kkphim-card-episode {
                position: absolute;
                top: 0.65em;
                right: 0.65em;
                padding: 0.28em 0.55em;
                border-radius: 0.45em;
                background: #e53935;
                color: #fff;
                font-size: 0.72em;
                font-weight: 800;
            }

            .kkphim-card-name {
                margin-top: 0.7em;
                font-size: 1.02em;
                line-height: 1.35;
                font-weight: 700;
                color: #fff;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                min-height: 2.7em;
            }

            .kkphim-card-year {
                margin-top: 0.25em;
                font-size: 0.92em;
                color: rgba(255,255,255,0.62);
            }

            .kkphim-category-title {
                padding: 0 0.75em 0.7em;
                font-size: 2em;
                font-weight: 900;
                color: #fff;
            }

            .kkphim-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1em;
                padding: 0 1.2em 2em;
            }

            .kkphim-loadmore {
                margin: 1.4em 1.2em 0;
                text-align: center;
                padding: 1em;
                border-radius: 0.9em;
                background: rgba(255,255,255,0.1);
                font-size: 1.05em;
                font-weight: 800;
                color: #fff;
                cursor: pointer;
            }

            .kkphim-loadmore.focus {
                background: #ff2432;
            }

            .kkphim-detail-top {
                position: relative;
                min-height: 42em;
            }

            .kkphim-detail-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 38em;
                overflow: hidden;
            }

            .kkphim-detail-backdrop img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transform: scale(1.05);
                filter: blur(2px);
            }

            .kkphim-detail-backdrop-mask {
                position: absolute;
                inset: 0;
                background:
                    linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0.82) 100%),
                    linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(20,20,20,0.82) 72%, rgba(20,20,20,1) 100%);
            }

            .kkphim-detail-inner {
                position: relative;
                z-index: 2;
                display: flex;
                gap: 1.6em;
                padding: 6em 1.2em 2em;
                align-items: flex-start;
            }

            .kkphim-detail-poster {
                width: 11em;
                min-width: 11em;
            }

            .kkphim-detail-poster img {
                width: 100%;
                aspect-ratio: 2/3;
                object-fit: cover;
                border-radius: 1em;
                box-shadow: 0 1em 2.2em rgba(0,0,0,0.4);
                background: #222;
            }

            .kkphim-detail-info {
                flex: 1;
                min-width: 0;
            }

            .kkphim-detail-logo {
                max-width: 20em;
                margin-bottom: 1em;
            }

            .kkphim-detail-logo img {
                max-width: 100%;
                max-height: 6.2em;
                object-fit: contain;
                display: block;
                filter: drop-shadow(0 0.3em 1em rgba(0,0,0,0.4));
            }

            .kkphim-detail-title {
                font-size: 2.35em;
                line-height: 1.08;
                font-weight: 900;
                margin-bottom: 0.15em;
                color: #fff;
            }

            .kkphim-detail-origin {
                font-size: 1.18em;
                line-height: 1.35;
                color: rgba(255,255,255,0.72);
                margin-bottom: 0.9em;
            }

            .kkphim-detail-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 0.55em;
                margin-bottom: 0.9em;
            }

            .kkphim-meta {
                padding: 0.5em 0.85em;
                border-radius: 999px;
                background: rgba(255,255,255,0.14);
                color: #fff;
                font-size: 1em;
                font-weight: 800;
            }

            .kkphim-detail-genres {
                display: flex;
                flex-wrap: wrap;
                gap: 0.55em;
                margin-bottom: 1em;
            }

            .kkphim-genre {
                padding: 0.42em 0.9em;
                border-radius: 999px;
                background: rgba(56,142,60,0.25);
                border: 1px solid rgba(76,175,80,0.45);
                color: #a5d6a7;
                font-size: 0.96em;
                font-weight: 700;
                cursor: pointer;
            }

            .kkphim-genre.focus {
                background: rgba(76,175,80,0.45);
                color: #fff;
            }

            .kkphim-crew-block {
                margin-bottom: 1em;
            }

            .kkphim-crew-title {
                font-size: 1em;
                font-weight: 900;
                color: #fff;
                margin-bottom: 0.25em;
            }

            .kkphim-crew-text {
                font-size: 1.02em;
                line-height: 1.6;
                color: rgba(255,255,255,0.82);
            }

            .kkphim-detail-desc {
                font-size: 1.14em;
                line-height: 1.72;
                color: rgba(255,255,255,0.92);
                max-width: 44em;
                margin-bottom: 1.3em;
            }

            .kkphim-detail-actions {
                margin-top: 0.8em;
            }

            .kkphim-watch {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 10em;
                padding: 0.95em 1.6em;
                border-radius: 0.85em;
                background: #ff1324;
                color: #fff;
                font-size: 1.18em;
                font-weight: 900;
                box-shadow: 0 0.6em 1.6em rgba(255,19,36,0.24);
                cursor: pointer;
            }

            .kkphim-section {
                padding: 0 1.2em 1.8em;
            }

            .kkphim-section-title {
                font-size: 1.7em;
                font-weight: 900;
                color: #fff;
                margin-bottom: 0.8em;
            }

            .kkphim-cast-row {
                display: flex;
                gap: 0.9em;
                overflow-x: auto;
                overflow-y: hidden;
                -webkit-overflow-scrolling: touch;
                padding-bottom: 0.4em;
                touch-action: pan-x;
            }

            .kkphim-cast-card {
                flex: 0 0 auto;
                width: 8.5em;
            }

            .kkphim-cast-avatar {
                width: 100%;
                aspect-ratio: 2/3;
                border-radius: 0.9em;
                overflow: hidden;
                background: #2a2a2a;
                margin-bottom: 0.55em;
            }

            .kkphim-cast-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .kkphim-cast-avatar-empty {
                width: 100%;
                height: 100%;
                background: #2f2f2f;
            }

            .kkphim-cast-name {
                font-size: 0.95em;
                line-height: 1.35;
                font-weight: 800;
                color: #fff;
            }

            .kkphim-cast-role {
                font-size: 0.84em;
                line-height: 1.35;
                color: rgba(255,255,255,0.65);
                margin-top: 0.2em;
            }

            .kkphim-server-name {
                font-size: 1.1em;
                font-weight: 800;
                color: #63d471;
                margin: 1em 0 0.7em;
            }

            .kkphim-episodes-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75em;
            }

            .kkphim-episode {
                min-width: 4.2em;
                text-align: center;
                padding: 0.8em 1.05em;
                border-radius: 0.75em;
                background: rgba(255,255,255,0.1);
                color: #fff;
                font-size: 1em;
                font-weight: 800;
                cursor: pointer;
            }

            .kkphim-episode.focus,
            .kkphim-watch.focus {
                background: #ff2a38;
            }

            @media (orientation: portrait) {
                .kkphim-detail-top {
                    min-height: 36em;
                }

                .kkphim-detail-backdrop {
                    height: 31em;
                }

                .kkphim-detail-backdrop img {
                    transform: scale(1.1);
                    filter: blur(1px);
                }

                .kkphim-detail-backdrop-mask {
                    background:
                        linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 26%, rgba(0,0,0,0.46) 58%, rgba(20,20,20,0.92) 84%, rgba(20,20,20,1) 100%);
                }

                .kkphim-detail-inner {
                    display: block;
                    padding: 18.5em 1.1em 1.5em;
                }

                .kkphim-detail-poster {
                    display: none;
                }

                .kkphim-detail-info {
                    position: relative;
                }

                .kkphim-detail-logo {
                    max-width: 22em;
                    margin-bottom: 0.75em;
                }

                .kkphim-detail-logo img {
                    max-width: 100%;
                    max-height: 8em;
                    object-fit: contain;
                }

                .kkphim-detail-title {
                    font-size: 1.9em;
                    line-height: 1.1;
                    margin-bottom: 0.2em;
                }

                .kkphim-detail-origin {
                    font-size: 1em;
                    line-height: 1.35;
                    opacity: 0.9;
                }

                .kkphim-detail-meta {
                    gap: 0.5em;
                    margin-top: 0.9em;
                }

                .kkphim-meta {
                    font-size: 0.96em;
                }

                .kkphim-detail-desc {
                    font-size: 1.08em;
                    line-height: 1.65;
                    max-width: none;
                }

                .kkphim-watch {
                    width: 100%;
                    font-size: 1.12em;
                }
            }

            @media (orientation: landscape) {
                .kkphim-detail-poster {
                    display: block;
                }
            }

            @media (max-width: 768px) {
                .kkphim-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.85em;
                }

                .kkphim-section-title {
                    font-size: 1.5em;
                }
            }
        </style>`;

        $('head').append(css);
    }

    function addMenu() {
        function insert() {
            if ($('.menu__item[data-action="kkphim"]').length) return;

            var item = $(
                '<li class="menu__item selector" data-action="kkphim">' +
                    '<div class="menu__ico">' +
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">' +
                            '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"></path>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="menu__text">KKPhim</div>' +
                '</li>'
            );

            item.on('click hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_main',
                    page: 1
                });
            });

            $('.menu .menu__list').first().append(item);
        }

        setTimeout(insert, 500);

        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') setTimeout(insert, 500);
        });

        Lampa.Listener.follow('full', function () {
            setTimeout(insert, 500);
        });
    }

    function startPlugin() {
        injectStyle();
        enableGlobalMobileTouch();
        addMenu();

        Lampa.Component.add('kkphim_main', function () {
            var network = new Lampa.Reguest();
            var html = $('<div class="kkphim-page"><div class="kkphim-page-scroll"></div></div>');
            var body = html.find('.kkphim-page-scroll');
            var comp = this;

            var categories = [
                { name: 'Phim Mới Cập Nhật', api: 'danh-sach/phim-moi-cap-nhat', slug: 'phim-moi-cap-nhat' },
                { name: 'Phim Bộ', api: 'v1/api/danh-sach/phim-bo', slug: 'phim-bo' },
                { name: 'Phim Lẻ', api: 'v1/api/danh-sach/phim-le', slug: 'phim-le' },
                { name: 'Hoạt Hình', api: 'v1/api/danh-sach/hoat-hinh', slug: 'hoat-hinh' }
            ];

            this.create = function () {
                this.activity.loader(true);
                addTouchScroll(html);

                var loaded = 0;

                categories.forEach(function (cat) {
                    network.silent(API + cat.api + '?page=1', function (res) {
                        var items = [];
                        if (res && res.items) items = res.items;
                        else if (res && res.data && res.data.items) items = res.data.items;

                        if (items.length) createRow(cat, items.slice(0, 12));

                        loaded++;
                        if (loaded >= categories.length) comp.activity.loader(false);
                    }, function () {
                        loaded++;
                        if (loaded >= categories.length) comp.activity.loader(false);
                    });
                });

                return html;
            };

            function createRow(cat, items) {
                var row = $('<div class="kkphim-row"></div>');
                var head = $('<div class="kkphim-row-head"></div>');
                var title = $('<div class="kkphim-row-title">' + cat.name + '</div>');
                var more = $('<div class="kkphim-row-more selector">Xem thêm</div>');
                var list = $('<div class="kkphim-row-list"></div>');

                more.on('click hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: cat.name,
                        component: 'kkphim_category',
                        cat: cat,
                        page_num: 1,
                        mode: 'api'
                    });
                });

                items.forEach(function (item) {
                    list.append(createCard(item));
                });

                head.append(title);
                head.append(more);
                row.append(head);
                row.append(list);
                body.append(row);
            }

            function createCard(item) {
                var poster = fullImg(item.poster_url || item.thumb_url);

                var card = $(
                    '<div class="kkphim-card selector">' +
                        '<div class="kkphim-card-poster">' +
                            '<img src="' + poster + '" alt="' + (item.name || '') + '">' +
                            (item.quality ? '<div class="kkphim-card-quality">' + item.quality + '</div>' : '') +
                            (item.episode_current ? '<div class="kkphim-card-episode">' + item.episode_current + '</div>' : '') +
                        '</div>' +
                        '<div class="kkphim-card-name">' + (item.name || '') + '</div>' +
                        '<div class="kkphim-card-year">' + (item.year || '') + '</div>' +
                    '</div>'
                );

                card.on('click hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: item.name || 'KKPhim',
                        component: 'kkphim_detail',
                        movie: item,
                        page: 1
                    });
                });

                return card;
            }

            this.start = function () {
                setTimeout(function () {
                    addTouchScroll(html);
                }, 50);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                html.remove();
            };
        });

        Lampa.Component.add('kkphim_category', function (object) {
            var network = new Lampa.Reguest();
            var html = $('<div class="kkphim-page"><div class="kkphim-page-scroll"></div></div>');
            var body = html.find('.kkphim-page-scroll');
            var comp = this;

            var page = object.page_num || 1;
            var title = object.title || (object.cat && object.cat.name) || 'Danh mục';
            var mode = object.mode || 'api';
            var apiPath = object.cat ? object.cat.api : null;
            var categorySlug = object.category_slug || '';
            var grid = $('<div class="kkphim-grid"></div>');
            var loadMore = $('<div class="kkphim-loadmore selector">Tải thêm</div>');
            var loading = false;
            var hasMore = true;

            this.create = function () {
                this.activity.loader(true);
                addTouchScroll(html);

                body.append('<div class="kkphim-category-title">' + title + '</div>');
                body.append(grid);
                body.append(loadMore);

                loadMore.on('click hover:enter', function () {
                    if (!loading && hasMore) loadPage();
                });

                loadPage();

                return html;
            };

            function handleCategoryResponse(res) {
                var items = [];
                if (res && res.items) items = res.items;
                else if (res && res.data && res.data.items) items = res.data.items;

                if (!items.length) {
                    hasMore = false;
                    loadMore.text('Hết dữ liệu');
                    comp.activity.loader(false);
                    loading = false;
                    return;
                }

                items.forEach(function (item) {
                    grid.append(createCard(item));
                });

                page++;
                loading = false;
                loadMore.text('Tải thêm');
                comp.activity.loader(false);
            }

            function loadPage() {
                loading = true;
                loadMore.text('Đang tải...');

                var url = '';
                if (mode === 'category' && categorySlug) {
                    url = API + 'v1/api/the-loai/' + categorySlug + '?page=' + page;
                } else {
                    url = API + apiPath + '?page=' + page;
                }

                network.silent(url, function (res) {
                    handleCategoryResponse(res);
                }, function () {
                    if (mode === 'category' && categorySlug) {
                        var url2 = API + 'the-loai/' + categorySlug + '?page=' + page;

                        network.silent(url2, function (res2) {
                            handleCategoryResponse(res2);
                        }, function () {
                            loading = false;
                            loadMore.text('Tải lại');
                            comp.activity.loader(false);
                            Lampa.Noty.show('Lỗi tải danh mục');
                        });
                    } else {
                        loading = false;
                        loadMore.text('Tải lại');
                        comp.activity.loader(false);
                        Lampa.Noty.show('Lỗi tải danh mục');
                    }
                });
            }

            function createCard(item) {
                var poster = fullImg(item.poster_url || item.thumb_url);

                var card = $(
                    '<div class="kkphim-card kkphim-card-grid selector">' +
                        '<div class="kkphim-card-poster">' +
                            '<img src="' + poster + '" alt="' + (item.name || '') + '">' +
                            (item.quality ? '<div class="kkphim-card-quality">' + item.quality + '</div>' : '') +
                            (item.episode_current ? '<div class="kkphim-card-episode">' + item.episode_current + '</div>' : '') +
                        '</div>' +
                        '<div class="kkphim-card-name">' + (item.name || '') + '</div>' +
                        '<div class="kkphim-card-year">' + (item.year || '') + '</div>' +
                    '</div>'
                );

                card.on('click hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: item.name || 'KKPhim',
                        component: 'kkphim_detail',
                        movie: item,
                        page: 1
                    });
                });

                return card;
            }

            this.start = function () {
                setTimeout(function () {
                    addTouchScroll(html);
                }, 50);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                html.remove();
            };
        });

        Lampa.Component.add('kkphim_detail', function (object) {
            var network = new Lampa.Reguest();
            var html = $('<div class="kkphim-detail-page"></div>');
            var movie = object.movie;
            var comp = this;

            this.create = function () {
                this.activity.loader(true);
                addTouchScroll(html);

                network.silent(API + 'phim/' + movie.slug, function (res) {
                    var data = res.movie || res || {};
                    var episodes = res.episodes || [];
                    loadAll(data, episodes);
                }, function () {
                    comp.activity.loader(false);
                    Lampa.Noty.show('Lỗi tải thông tin phim');
                });

                return html;
            };

            async function loadAll(data, episodes) {
                try {
                    var tmdbId = getTMDBId(data);
                    var tmdbType = detectTMDBType(data);
                    var tmdb = null;
                    var logos = null;

                    if (tmdbId) {
                        try {
                            tmdb = await tmdbFetch('/' + tmdbType + '/' + tmdbId + '?language=vi-VN&append_to_response=credits,images');
                        } catch (e) {
                            try {
                                tmdb = await tmdbFetch('/' + tmdbType + '/' + tmdbId + '?language=en-US&append_to_response=credits,images');
                            } catch (e2) {}
                        }

                        try {
                            logos = await tmdbFetch('/' + tmdbType + '/' + tmdbId + '/images');
                        } catch (e3) {}
                    }

                    renderDetail(data, episodes, tmdb, logos, tmdbType);
                } catch (e) {
                    renderDetail(data, episodes, null, null, 'movie');
                }

                comp.activity.loader(false);

                setTimeout(function () {
                    addTouchScroll(html);
                    enableGlobalMobileTouch();
                    unlockDetailScroll(html);
                }, 100);
            }

            function renderDetail(data, episodes, tmdb, logos, tmdbType) {
                html.empty();

                var backdrop = fullImg(data.thumb_url || data.poster_url);
                var poster = fullImg(data.poster_url || data.thumb_url);
                var title = data.name || '';
                var origin = data.origin_name || '';
                var desc = data.content || 'Không có mô tả';
                var vote = (data.tmdb && data.tmdb.vote_average) ? data.tmdb.vote_average : 'N/A';
                var year = data.year || '';
                var runtime = data.time || '';
                var currentEp = data.episode_current || '';
                var genresHtml = '';
                var castHtml = '';
                var crewHtml = '';
                var logoHtml = '';
                var directorText = '';
                var hasLogo = false;
                var phimApiGenres = data.category || [];

                if (tmdb) {
                    if (tmdb.backdrop_path) backdrop = TMDB_IMG + tmdb.backdrop_path;
                    if (tmdb.poster_path) poster = TMDB_IMG + tmdb.poster_path;
                    if (tmdb.title || tmdb.name) title = tmdb.title || tmdb.name;
                    if (tmdb.original_title || tmdb.original_name) origin = tmdb.original_title || tmdb.original_name;
                    if (tmdb.overview) desc = tmdb.overview;
                    if (tmdb.vote_average) vote = Number(tmdb.vote_average).toFixed(1);

                    if (tmdb.release_date) year = tmdb.release_date.slice(0, 4);
                    if (!year && tmdb.first_air_date) year = tmdb.first_air_date.slice(0, 4);

                    if (tmdb.runtime) runtime = tmdb.runtime + ' phút';
                    if ((!runtime || runtime === '') && tmdb.episode_run_time && tmdb.episode_run_time.length) {
                        runtime = tmdb.episode_run_time[0] + ' phút';
                    }

                    var logo = pickLogo(logos || tmdb.images);
                    if (logo && logo.file_path) {
                        hasLogo = true;
                        logoHtml = '<div class="kkphim-detail-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '" alt="logo"></div>';
                    }

                    if (tmdb.credits) {
                        var cast = (tmdb.credits.cast || []).slice(0, 10);

                        castHtml = cast.map(function (c) {
                            var avatar = c.profile_path
                                ? '<img src="' + TMDB_IMG_W500 + c.profile_path + '">'
                                : '<div class="kkphim-cast-avatar-empty"></div>';

                            return '' +
                                '<div class="kkphim-cast-card">' +
                                    '<div class="kkphim-cast-avatar">' + avatar + '</div>' +
                                    '<div class="kkphim-cast-name">' + (c.name || '') + '</div>' +
                                    '<div class="kkphim-cast-role">' + (c.character || '') + '</div>' +
                                '</div>';
                        }).join('');

                        var crew = tmdb.credits.crew || [];
                        var directors = [];

                        if (tmdbType === 'movie') {
                            directors = crew.filter(function (c) { return c.job === 'Director'; }).map(function (c) { return c.name; });
                        } else {
                            directors = crew.filter(function (c) {
                                return c.job === 'Creator' || c.job === 'Director' || c.job === 'Series Director';
                            }).map(function (c) { return c.name; });
                        }

                        directors = directors.filter(function (v, i, a) { return a.indexOf(v) === i; });

                        if (directors.length) {
                            directorText = directors.slice(0, 5).join(', ');
                        }
                    }
                }

                if (phimApiGenres.length) {
                    genresHtml = phimApiGenres.map(function (g) {
                        return '<span class="kkphim-genre selector" data-slug="' + (g.slug || '') + '" data-title="' + (g.name || '').replace(/"/g, '&quot;') + '">' + g.name + '</span>';
                    }).join('');
                } else if (tmdb && tmdb.genres && tmdb.genres.length) {
                    genresHtml = tmdb.genres.map(function (g) {
                        return '<span class="kkphim-genre">' + g.name + '</span>';
                    }).join('');
                }

                if (data.director && !directorText) {
                    if (Array.isArray(data.director)) directorText = data.director.join(', ');
                    else directorText = data.director;
                }

                if (directorText) {
                    crewHtml =
                        '<div class="kkphim-crew-block">' +
                            '<div class="kkphim-crew-title">Đạo diễn</div>' +
                            '<div class="kkphim-crew-text">' + directorText + '</div>' +
                        '</div>';
                }

                var top = $(
                    '<div class="kkphim-detail-top ' + (hasLogo ? 'kkphim-has-logo' : 'kkphim-no-logo') + '">' +
                        '<div class="kkphim-detail-backdrop">' +
                            '<img src="' + backdrop + '" alt="backdrop">' +
                            '<div class="kkphim-detail-backdrop-mask"></div>' +
                        '</div>' +
                        '<div class="kkphim-detail-inner">' +
                            '<div class="kkphim-detail-poster">' +
                                '<img src="' + poster + '" alt="poster">' +
                            '</div>' +
                            '<div class="kkphim-detail-info">' +
                                logoHtml +
                                '<div class="kkphim-detail-title">' + title + '</div>' +
                                '<div class="kkphim-detail-origin">' + origin + '</div>' +
                                '<div class="kkphim-detail-meta">' +
                                    '<span class="kkphim-meta">⭐ ' + vote + '</span>' +
                                    (year ? '<span class="kkphim-meta">📅 ' + year + '</span>' : '') +
                                    (runtime ? '<span class="kkphim-meta">⏱ ' + runtime + '</span>' : '') +
                                    (currentEp ? '<span class="kkphim-meta">🎬 ' + currentEp + '</span>' : '') +
                                '</div>' +
                                '<div class="kkphim-detail-genres">' + genresHtml + '</div>' +
                                crewHtml +
                                '<div class="kkphim-detail-desc">' + desc + '</div>' +
                                '<div class="kkphim-detail-actions">' +
                                    '<div class="kkphim-watch selector">▶ Xem phim</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );

                top.find('.kkphim-watch').on('click hover:enter', function () {
                    try {
                        playEpisode(episodes[0].server_data[0]);
                    } catch (e) {
                        Lampa.Noty.show('Không tìm thấy tập phim');
                    }
                });

                top.find('.kkphim-genre[data-slug]').on('click hover:enter', function () {
                    var slug = $(this).attr('data-slug');
                    var titleGenre = $(this).attr('data-title') || 'Thể loại';

                    if (!slug) {
                        Lampa.Noty.show('Không tìm thấy slug thể loại');
                        return;
                    }

                    Lampa.Activity.push({
                        url: '',
                        title: titleGenre,
                        component: 'kkphim_category',
                        mode: 'category',
                        category_slug: slug,
                        page_num: 1
                    });
                });

                html.append(top);

                if (castHtml) {
                    html.append(
                        '<div class="kkphim-section">' +
                            '<div class="kkphim-section-title">Diễn viên</div>' +
                            '<div class="kkphim-cast-row">' + castHtml + '</div>' +
                        '</div>'
                    );
                }

                if (episodes && episodes.length) {
                    var epWrap = $('<div class="kkphim-section kkphim-episodes"></div>');
                    epWrap.append('<div class="kkphim-section-title">Danh sách tập</div>');

                    episodes.forEach(function (server) {
                        epWrap.append('<div class="kkphim-server-name">' + server.server_name + '</div>');

                        var grid = $('<div class="kkphim-episodes-grid"></div>');

                        (server.server_data || []).forEach(function (ep) {
                            var btn = $('<div class="kkphim-episode selector">' + ep.name + '</div>');
                            btn.on('click hover:enter', function () {
                                playEpisode(ep);
                            });
                            grid.append(btn);
                        });

                        epWrap.append(grid);
                    });

                    html.append(epWrap);
                }
            }

            function playEpisode(ep) {
                var link = ep.link_m3u8 || ep.link_embed || '';

                if (!link) {
                    Lampa.Noty.show('Không có link phát');
                    return;
                }

                Lampa.Player.play({
                    title: (movie.name || '') + ' - ' + (ep.name || ''),
                    url: link
                });
            }

            this.start = function () {
                setTimeout(function () {
                    addTouchScroll(html);
                    enableGlobalMobileTouch();
                    unlockDetailScroll(html);
                }, 50);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                html.remove();
            };
        });
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();