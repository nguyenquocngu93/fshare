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

    function injectStyle() {
        if ($('#kkphim-style').length) return;

        var css = `
        <style id="kkphim-style">
            .kkphim-native {
                color: #fff;
                padding: 1.2em 0 2em;
            }

            .kkphim-native__section {
                margin-bottom: 2.1em;
            }

            .kkphim-native__head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1em;
                padding: 0 1.2em;
                margin-bottom: 0.9em;
            }

            .kkphim-native__title {
                font-size: 1.55em;
                line-height: 1.2;
                font-weight: 900;
                color: #fff;
            }

            .kkphim-native__more {
                flex-shrink: 0;
                padding: 0.5em 0.95em;
                border-radius: 999px;
                background: rgba(255,255,255,0.08);
                color: #fff;
                font-size: 0.96em;
                font-weight: 800;
                cursor: pointer;
            }

            .kkphim-native__more.focus {
                background: #fff;
                color: #000;
            }

            .kkphim-native__row {
                display: flex;
                gap: 1em;
                overflow-x: auto;
                overflow-y: hidden;
                padding: 0 1.2em 0.2em;
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
            }

            .kkphim-native__row::-webkit-scrollbar,
            .kkphim-cast-row::-webkit-scrollbar {
                display: none;
            }

            .kkphim-card {
                flex: 0 0 auto;
                width: 9.6em;
                cursor: pointer;
            }

            .kkphim-card--grid {
                width: 100%;
            }

            .kkphim-card__poster {
                position: relative;
                width: 100%;
                aspect-ratio: 2/3;
                border-radius: 1em;
                overflow: hidden;
                background: #242424;
                box-shadow: 0 0.35em 1.25em rgba(0,0,0,0.18);
            }

            .kkphim-card__poster img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .kkphim-card__quality {
                position: absolute;
                left: 0.55em;
                top: 0.55em;
                padding: 0.25em 0.5em;
                border-radius: 0.45em;
                font-size: 0.72em;
                font-weight: 800;
                background: #f6c344;
                color: #000;
            }

            .kkphim-card__episode {
                position: absolute;
                right: 0.55em;
                top: 0.55em;
                padding: 0.25em 0.5em;
                border-radius: 0.45em;
                font-size: 0.72em;
                font-weight: 800;
                background: #e53935;
                color: #fff;
            }

            .kkphim-card__name {
                margin-top: 0.7em;
                font-size: 1em;
                line-height: 1.35;
                font-weight: 700;
                color: #fff;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                min-height: 2.7em;
            }

            .kkphim-card__year {
                margin-top: 0.2em;
                font-size: 0.9em;
                color: rgba(255,255,255,0.58);
            }

            .kkphim-grid-wrap {
                padding: 0 1.2em;
            }

            .kkphim-grid-title {
                font-size: 1.9em;
                line-height: 1.15;
                font-weight: 900;
                color: #fff;
                margin-bottom: 0.8em;
            }

            .kkphim-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1em;
            }

            .kkphim-loadmore {
                margin-top: 1.2em;
                text-align: center;
                padding: 1em;
                border-radius: 0.9em;
                background: rgba(255,255,255,0.08);
                color: #fff;
                font-size: 1em;
                font-weight: 800;
                cursor: pointer;
            }

            .kkphim-loadmore.focus {
                background: #ff2332;
            }

            .kkphim-detail {
                padding-bottom: 2em;
            }

            .kkphim-hero {
                position: relative;
                margin: 0 0 1.4em;
                border-radius: 0 0 1.4em 1.4em;
                overflow: hidden;
                background: #1c1c1c;
            }

            .kkphim-hero__backdrop {
                position: relative;
                height: 24em;
            }

            .kkphim-hero__backdrop img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                filter: blur(1px);
                transform: scale(1.04);
            }

            .kkphim-hero__overlay {
                position: absolute;
                inset: 0;
                background:
                    linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.14) 24%, rgba(0,0,0,0.42) 58%, rgba(20,20,20,0.92) 86%, rgba(20,20,20,1) 100%);
            }

            .kkphim-hero__inner {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 2;
                padding: 1.2em 1.2em 1.2em;
            }

            .kkphim-hero__landscape {
                display: flex;
                align-items: flex-end;
                gap: 1.25em;
            }

            .kkphim-hero__poster {
                width: 10.5em;
                min-width: 10.5em;
            }

            .kkphim-hero__poster img {
                width: 100%;
                aspect-ratio: 2/3;
                object-fit: cover;
                border-radius: 1em;
                display: block;
                box-shadow: 0 1em 2em rgba(0,0,0,0.35);
                background: #242424;
            }

            .kkphim-hero__info {
                flex: 1;
                min-width: 0;
            }

            .kkphim-logo {
                max-width: 18em;
                margin-bottom: 0.8em;
            }

            .kkphim-logo img {
                max-width: 100%;
                max-height: 5.8em;
                object-fit: contain;
                display: block;
                filter: drop-shadow(0 0.3em 1em rgba(0,0,0,0.35));
            }

            .kkphim-title {
                font-size: 2.2em;
                line-height: 1.08;
                font-weight: 900;
                color: #fff;
                margin-bottom: 0.15em;
            }

            .kkphim-origin {
                font-size: 1.08em;
                line-height: 1.35;
                color: rgba(255,255,255,0.72);
            }

            .kkphim-body {
                padding: 0 1.2em;
            }

            .kkphim-meta-row {
                display: flex;
                flex-wrap: wrap;
                gap: 0.55em;
                margin-bottom: 1em;
            }

            .kkphim-meta {
                display: inline-flex;
                align-items: center;
                padding: 0.5em 0.8em;
                border-radius: 999px;
                background: rgba(255,255,255,0.1);
                color: #fff;
                font-size: 0.98em;
                font-weight: 800;
            }

            .kkphim-genre-row {
                display: flex;
                flex-wrap: wrap;
                gap: 0.55em;
                margin-bottom: 1em;
            }

            .kkphim-genre {
                display: inline-flex;
                align-items: center;
                padding: 0.42em 0.9em;
                border-radius: 999px;
                background: rgba(56,142,60,0.24);
                border: 1px solid rgba(76,175,80,0.45);
                color: #a5d6a7;
                font-size: 0.95em;
                font-weight: 700;
                cursor: pointer;
            }

            .kkphim-genre.focus {
                background: rgba(76,175,80,0.45);
                color: #fff;
            }

            .kkphim-credit {
                margin-bottom: 1em;
            }

            .kkphim-credit__label {
                font-size: 1em;
                line-height: 1.3;
                font-weight: 900;
                color: #fff;
                margin-bottom: 0.2em;
            }

            .kkphim-credit__value {
                font-size: 1.02em;
                line-height: 1.55;
                color: rgba(255,255,255,0.82);
            }

            .kkphim-desc {
                font-size: 1.08em;
                line-height: 1.68;
                color: rgba(255,255,255,0.92);
                margin-bottom: 1.2em;
            }

            .kkphim-watch {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 10em;
                padding: 0.95em 1.5em;
                border-radius: 0.9em;
                background: #ff1424;
                color: #fff;
                font-size: 1.12em;
                font-weight: 900;
                box-shadow: 0 0.6em 1.5em rgba(255,20,36,0.25);
                cursor: pointer;
            }

            .kkphim-watch.focus {
                background: #ff3140;
            }

            .kkphim-block {
                padding: 0 1.2em;
                margin-top: 1.7em;
            }

            .kkphim-block__title {
                font-size: 1.6em;
                line-height: 1.2;
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
                touch-action: pan-x;
                padding-bottom: 0.2em;
            }

            .kkphim-cast-card {
                flex: 0 0 auto;
                width: 8.2em;
            }

            .kkphim-cast-avatar {
                width: 100%;
                aspect-ratio: 2/3;
                border-radius: 0.9em;
                overflow: hidden;
                background: #2b2b2b;
                margin-bottom: 0.55em;
            }

            .kkphim-cast-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .kkphim-cast-avatar-empty {
                width: 100%;
                height: 100%;
                background: #313131;
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
                color: rgba(255,255,255,0.62);
                margin-top: 0.2em;
            }

            .kkphim-server-name {
                font-size: 1.05em;
                line-height: 1.3;
                font-weight: 800;
                color: #63d471;
                margin: 1em 0 0.7em;
            }

            .kkphim-episodes-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 0.7em;
            }

            .kkphim-episode {
                min-width: 4.1em;
                text-align: center;
                padding: 0.78em 1.02em;
                border-radius: 0.75em;
                background: rgba(255,255,255,0.09);
                color: #fff;
                font-size: 0.98em;
                font-weight: 800;
                cursor: pointer;
            }

            .kkphim-episode.focus {
                background: #ff2233;
            }

            @media (orientation: portrait) {
                .kkphim-hero__backdrop {
                    height: 22em;
                }

                .kkphim-hero__landscape {
                    display: block;
                }

                .kkphim-hero__poster {
                    display: none;
                }

                .kkphim-logo {
                    max-width: 21em;
                    margin-bottom: 0.55em;
                }

                .kkphim-logo img {
                    max-height: 7em;
                }

                .kkphim-title {
                    font-size: 1.9em;
                    line-height: 1.1;
                }

                .kkphim-origin {
                    font-size: 0.98em;
                }

                .kkphim-watch {
                    width: 100%;
                }
            }

            @media (orientation: landscape) {
                .kkphim-hero__poster {
                    display: block;
                }
            }

            @media (max-width: 768px) {
                .kkphim-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.85em;
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

    function buildCard(item) {
        var poster = fullImg(item.poster_url || item.thumb_url);

        var card = $(
            '<div class="kkphim-card selector">' +
                '<div class="kkphim-card__poster">' +
                    '<img src="' + poster + '" alt="' + (item.name || '') + '">' +
                    (item.quality ? '<div class="kkphim-card__quality">' + item.quality + '</div>' : '') +
                    (item.episode_current ? '<div class="kkphim-card__episode">' + item.episode_current + '</div>' : '') +
                '</div>' +
                '<div class="kkphim-card__name">' + (item.name || '') + '</div>' +
                '<div class="kkphim-card__year">' + (item.year || '') + '</div>' +
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

    function startPlugin() {
        injectStyle();
        addMenu();

        Lampa.Component.add('kkphim_main', function () {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var html = $('<div class="kkphim-native"></div>');
            var comp = this;

            var categories = [
                { name: 'Phim Mới Cập Nhật', api: 'danh-sach/phim-moi-cap-nhat', slug: 'phim-moi-cap-nhat' },
                { name: 'Phim Bộ', api: 'v1/api/danh-sach/phim-bo', slug: 'phim-bo' },
                { name: 'Phim Lẻ', api: 'v1/api/danh-sach/phim-le', slug: 'phim-le' },
                { name: 'Hoạt Hình', api: 'v1/api/danh-sach/hoat-hinh', slug: 'hoat-hinh' }
            ];

            this.create = function () {
                this.activity.loader(true);
                html.append(scroll.render());

                var loaded = 0;

                categories.forEach(function (cat) {
                    network.silent(API + cat.api + '?page=1', function (res) {
                        var items = [];
                        if (res && res.items) items = res.items;
                        else if (res && res.data && res.data.items) items = res.data.items;

                        if (items.length) {
                            var section = $('<div class="kkphim-native__section"></div>');
                            var head = $('<div class="kkphim-native__head"></div>');
                            var title = $('<div class="kkphim-native__title">' + cat.name + '</div>');
                            var more = $('<div class="kkphim-native__more selector">Xem thêm</div>');
                            var row = $('<div class="kkphim-native__row"></div>');

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

                            items.slice(0, 12).forEach(function (item) {
                                row.append(buildCard(item));
                            });

                            head.append(title).append(more);
                            section.append(head).append(row);
                            scroll.append(section);
                        }

                        loaded++;
                        if (loaded >= categories.length) {
                            comp.activity.loader(false);
                            setTimeout(function () {
                                scroll.update();
                            }, 60);
                        }
                    }, function () {
                        loaded++;
                        if (loaded >= categories.length) {
                            comp.activity.loader(false);
                            setTimeout(function () {
                                scroll.update();
                            }, 60);
                        }
                    });
                });

                return html;
            };

            this.start = function () {};
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
                html.remove();
            };
        });

        Lampa.Component.add('kkphim_category', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var html = $('<div class="kkphim-native"></div>');
            var comp = this;

            var page = object.page_num || 1;
            var title = object.title || (object.cat && object.cat.name) || 'Danh mục';
            var mode = object.mode || 'api';
            var apiPath = object.cat ? object.cat.api : null;
            var categorySlug = object.category_slug || '';
            var wrap = $('<div class="kkphim-grid-wrap"></div>');
            var grid = $('<div class="kkphim-grid"></div>');
            var loadMore = $('<div class="kkphim-loadmore selector">Tải thêm</div>');
            var loading = false;
            var hasMore = true;

            this.create = function () {
                this.activity.loader(true);
                html.append(scroll.render());

                wrap.append('<div class="kkphim-grid-title">' + title + '</div>');
                wrap.append(grid);
                wrap.append(loadMore);

                scroll.append(wrap);

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
                    setTimeout(function () { scroll.update(); }, 60);
                    return;
                }

                items.forEach(function (item) {
                    grid.append(buildCard(item).addClass('kkphim-card--grid'));
                });

                page++;
                loading = false;
                loadMore.text('Tải thêm');
                comp.activity.loader(false);

                setTimeout(function () { scroll.update(); }, 60);
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

            this.start = function () {};
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
                html.remove();
            };
        });

        Lampa.Component.add('kkphim_detail', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var html = $('<div class="kkphim-detail"></div>');
            var movie = object.movie;
            var comp = this;

            this.create = function () {
                this.activity.loader(true);
                html.append(scroll.render());

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
                setTimeout(function () { scroll.update(); }, 80);
            }

            function renderDetail(data, episodes, tmdb, logos, tmdbType) {
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
                var creditHtml = '';
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
                        logoHtml = '<div class="kkphim-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '" alt="logo"></div>';
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
                    creditHtml =
                        '<div class="kkphim-credit">' +
                            '<div class="kkphim-credit__label">Đạo diễn</div>' +
                            '<div class="kkphim-credit__value">' + directorText + '</div>' +
                        '</div>';
                }

                var hero = $(
                    '<div class="kkphim-hero ' + (hasLogo ? 'kkphim-hero--logo' : 'kkphim-hero--text') + '">' +
                        '<div class="kkphim-hero__backdrop">' +
                            '<img src="' + backdrop + '" alt="backdrop">' +
                            '<div class="kkphim-hero__overlay"></div>' +
                        '</div>' +
                        '<div class="kkphim-hero__inner">' +
                            '<div class="kkphim-hero__landscape">' +
                                '<div class="kkphim-hero__poster">' +
                                    '<img src="' + poster + '" alt="poster">' +
                                '</div>' +
                                '<div class="kkphim-hero__info">' +
                                    logoHtml +
                                    '<div class="kkphim-title">' + title + '</div>' +
                                    '<div class="kkphim-origin">' + origin + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );

                var body = $(
                    '<div class="kkphim-body">' +
                        '<div class="kkphim-meta-row">' +
                            '<span class="kkphim-meta">⭐ ' + vote + '</span>' +
                            (year ? '<span class="kkphim-meta">📅 ' + year + '</span>' : '') +
                            (runtime ? '<span class="kkphim-meta">⏱ ' + runtime + '</span>' : '') +
                            (currentEp ? '<span class="kkphim-meta">🎬 ' + currentEp + '</span>' : '') +
                        '</div>' +
                        '<div class="kkphim-genre-row">' + genresHtml + '</div>' +
                        creditHtml +
                        '<div class="kkphim-desc">' + desc + '</div>' +
                        '<div><div class="kkphim-watch selector">▶ Xem phim</div></div>' +
                    '</div>'
                );

                body.find('.kkphim-watch').on('click hover:enter', function () {
                    try {
                        playEpisode(episodes[0].server_data[0]);
                    } catch (e) {
                        Lampa.Noty.show('Không tìm thấy tập phim');
                    }
                });

                body.find('.kkphim-genre[data-slug]').on('click hover:enter', function () {
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

                scroll.append(hero);
                scroll.append(body);

                if (castHtml) {
                    scroll.append(
                        '<div class="kkphim-block">' +
                            '<div class="kkphim-block__title">Diễn viên</div>' +
                            '<div class="kkphim-cast-row">' + castHtml + '</div>' +
                        '</div>'
                    );
                }

                if (episodes && episodes.length) {
                    var epWrap = $('<div class="kkphim-block"></div>');
                    epWrap.append('<div class="kkphim-block__title">Danh sách tập</div>');

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

                    scroll.append(epWrap);
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

            this.start = function () {};
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
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