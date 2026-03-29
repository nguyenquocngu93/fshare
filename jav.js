(function () {
    'use strict';

    var API = 'https://phimapi.com/';
    var IMG = 'https://phimimg.com/';

    function fullImg(url) {
        if (!url) return '';
        return url.indexOf('http') === 0 ? url : IMG + url;
    }

    function startPlugin() {
        injectStyle();

        // ===== MENU =====
        addMenu();

        // ===== MAIN =====
        Lampa.Component.add('kkphim_main', function (object) {
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

                var loaded = 0;

                categories.forEach(function (cat) {
                    network.silent(API + cat.api + '?page=1', function (res) {
                        var items = [];

                        if (res && res.items) items = res.items;
                        else if (res && res.data && res.data.items) items = res.data.items;

                        if (items.length) createRow(cat, items.slice(0, 12));

                        loaded++;
                        if (loaded >= categories.length) {
                            comp.activity.loader(false);
                        }
                    }, function () {
                        loaded++;
                        if (loaded >= categories.length) {
                            comp.activity.loader(false);
                        }
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
                        page: 1
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

            this.start = function () {};
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                html.remove();
            };
        });

        // ===== CATEGORY =====
        Lampa.Component.add('kkphim_category', function (object) {
            var network = new Lampa.Reguest();
            var html = $('<div class="kkphim-page"><div class="kkphim-page-scroll"></div></div>');
            var body = html.find('.kkphim-page-scroll');
            var comp = this;
            var cat = object.cat;
            var page = 1;
            var loading = false;
            var hasMore = true;
            var grid = $('<div class="kkphim-grid"></div>');
            var loadMore = $('<div class="kkphim-loadmore selector">Tải thêm</div>');

            this.create = function () {
                this.activity.loader(true);

                body.append('<div class="kkphim-category-title">' + cat.name + '</div>');
                body.append(grid);
                body.append(loadMore);

                loadMore.on('click hover:enter', function () {
                    if (!loading && hasMore) loadPage();
                });

                loadPage();

                return html;
            };

            function loadPage() {
                loading = true;
                loadMore.text('Đang tải...');

                network.silent(API + cat.api + '?page=' + page, function (res) {
                    var items = [];

                    if (res && res.items) items = res.items;
                    else if (res && res.data && res.data.items) items = res.data.items;

                    if (!items.length) {
                        hasMore = false;
                        loadMore.text('Hết dữ liệu');
                        comp.activity.loader(false);
                        return;
                    }

                    items.forEach(function (item) {
                        grid.append(createCard(item));
                    });

                    page++;
                    loading = false;
                    loadMore.text('Tải thêm');
                    comp.activity.loader(false);
                }, function () {
                    loading = false;
                    loadMore.text('Tải lại');
                    comp.activity.loader(false);
                    Lampa.Noty.show('Lỗi tải danh mục');
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

            this.start = function () {};
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                html.remove();
            };
        });

        // ===== DETAIL =====
        Lampa.Component.add('kkphim_detail', function (object) {
            var network = new Lampa.Reguest();
            var html = $('<div class="kkphim-detail-page"></div>');
            var movie = object.movie;
            var comp = this;

            this.create = function () {
                this.activity.loader(true);

                network.silent(API + 'phim/' + movie.slug, function (res) {
                    var data = res.movie || res || {};
                    var episodes = res.episodes || [];

                    renderDetail(data, episodes);
                    comp.activity.loader(false);
                }, function () {
                    comp.activity.loader(false);
                    Lampa.Noty.show('Lỗi tải thông tin phim');
                });

                return html;
            };

            function renderDetail(data, episodes) {
                var backdrop = fullImg(data.thumb_url || data.poster_url);
                var poster = fullImg(data.poster_url || data.thumb_url);
                var vote = (data.tmdb && data.tmdb.vote_average) ? data.tmdb.vote_average : 'N/A';
                var desc = data.content || 'Không có mô tả';

                var genres = '';
                if (data.category && data.category.length) {
                    genres = data.category.map(function (g) {
                        return '<span class="kkphim-genre">' + g.name + '</span>';
                    }).join('');
                }

                var info = $(
                    '<div class="kkphim-detail-wrap">' +
                        '<div class="kkphim-detail-backdrop">' +
                            '<img src="' + backdrop + '">' +
                            '<div class="kkphim-detail-backdrop-mask"></div>' +
                        '</div>' +

                        '<div class="kkphim-detail-container">' +
                            '<div class="kkphim-detail-poster">' +
                                '<img src="' + poster + '">' +
                            '</div>' +

                            '<div class="kkphim-detail-info">' +
                                '<div class="kkphim-detail-title">' + (data.name || '') + '</div>' +
                                '<div class="kkphim-detail-origin">' + (data.origin_name || '') + '</div>' +

                                '<div class="kkphim-detail-meta">' +
                                    '<span class="kkphim-meta">⭐ ' + vote + '</span>' +
                                    '<span class="kkphim-meta">📅 ' + (data.year || '') + '</span>' +
                                    '<span class="kkphim-meta">⏱ ' + (data.time || '') + '</span>' +
                                    '<span class="kkphim-meta">🎬 ' + (data.episode_current || '') + '</span>' +
                                '</div>' +

                                '<div class="kkphim-detail-genres">' + genres + '</div>' +
                                '<div class="kkphim-detail-desc">' + desc + '</div>' +

                                '<div class="kkphim-detail-actions">' +
                                    '<div class="kkphim-watch selector">▶ Xem phim</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );

                info.find('.kkphim-watch').on('click hover:enter', function () {
                    try {
                        playEpisode(episodes[0].server_data[0]);
                    } catch (e) {
                        Lampa.Noty.show('Không tìm thấy tập phim');
                    }
                });

                html.append(info);

                if (episodes && episodes.length) {
                    var epWrap = $('<div class="kkphim-episodes"></div>');
                    epWrap.append('<div class="kkphim-episodes-head">Danh sách tập</div>');

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

            this.start = function () {};
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                html.remove();
            };
        });
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

        if (window.appready) {
            setTimeout(insert, 500);
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') setTimeout(insert, 500);
            });
        }

        Lampa.Listener.follow('full', function (e) {
            setTimeout(insert, 500);
        });
    }

    function injectStyle() {
        if ($('#kkphim-style').length) return;

        var css = `
        <style id="kkphim-style">
            .kkphim-page,
            .kkphim-detail-page {
                min-height: 100vh;
                background: #141414;
                color: #fff;
                overflow-y: auto;
                overflow-x: hidden;
                -webkit-overflow-scrolling: touch;
            }

            .kkphim-page-scroll {
                padding: 1.2em 0 2em;
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
                font-weight: 800;
                color: #fff;
                line-height: 1.2;
            }

            .kkphim-row-more {
                flex-shrink: 0;
                font-size: 1em;
                font-weight: 700;
                color: #fff;
                padding: 0.55em 1em;
                border-radius: 999px;
                background: rgba(255,255,255,0.12);
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

            .kkphim-row-list::-webkit-scrollbar {
                height: 0;
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
                font-weight: 800;
                color: #fff;
            }

            .kkphim-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1em;
                padding: 0 1.2em;
            }

            .kkphim-loadmore {
                margin: 1.4em 1.2em 0;
                text-align: center;
                padding: 1em;
                border-radius: 0.9em;
                background: rgba(255,255,255,0.1);
                font-size: 1.05em;
                font-weight: 700;
                color: #fff;
                cursor: pointer;
            }

            .kkphim-loadmore.focus {
                background: #ff2432;
            }

            .kkphim-detail-wrap {
                position: relative;
                min-height: 34em;
            }

            .kkphim-detail-backdrop {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 31em;
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
                    linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.48) 42%, rgba(0,0,0,0.78) 100%),
                    linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(20,20,20,0.84) 72%, rgba(20,20,20,1) 100%);
            }

            .kkphim-detail-container {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: flex-start;
                gap: 1.5em;
                padding: 4.2em 1.2em 1.5em;
            }

            .kkphim-detail-poster {
                width: 10.5em;
                min-width: 10.5em;
            }

            .kkphim-detail-poster img {
                width: 100%;
                aspect-ratio: 2 / 3;
                object-fit: cover;
                border-radius: 1em;
                box-shadow: 0 1em 2.5em rgba(0,0,0,0.38);
                background: #222;
            }

            .kkphim-detail-info {
                flex: 1;
                min-width: 0;
            }

            .kkphim-detail-title {
                font-size: 2.25em;
                line-height: 1.08;
                font-weight: 900;
                color: #fff;
                margin-bottom: 0.18em;
            }

            .kkphim-detail-origin {
                font-size: 1.2em;
                line-height: 1.35;
                color: rgba(255,255,255,0.74);
                margin-bottom: 0.9em;
            }

            .kkphim-detail-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 0.55em;
                margin-bottom: 0.9em;
            }

            .kkphim-meta {
                display: inline-flex;
                align-items: center;
                padding: 0.5em 0.85em;
                border-radius: 999px;
                background: rgba(255,255,255,0.14);
                color: #fff;
                font-size: 1em;
                font-weight: 700;
            }

            .kkphim-detail-genres {
                display: flex;
                flex-wrap: wrap;
                gap: 0.55em;
                margin-bottom: 1em;
            }

            .kkphim-genre {
                display: inline-flex;
                align-items: center;
                padding: 0.45em 0.9em;
                border-radius: 999px;
                background: rgba(56,142,60,0.24);
                border: 1px solid rgba(76,175,80,0.48);
                color: #9be7a1;
                font-size: 0.98em;
                font-weight: 700;
            }

            .kkphim-detail-desc {
                font-size: 1.16em;
                line-height: 1.7;
                color: rgba(255,255,255,0.92);
                margin-bottom: 1.2em;
                max-width: 42em;
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
                background: #ff1220;
                color: #fff;
                font-size: 1.2em;
                font-weight: 900;
                cursor: pointer;
                box-shadow: 0 0.6em 1.6em rgba(255,18,32,0.24);
            }

            .kkphim-watch.focus {
                background: #ff3340;
            }

            .kkphim-episodes {
                padding: 0 1.2em 2.5em;
            }

            .kkphim-episodes-head {
                font-size: 1.8em;
                font-weight: 900;
                margin-bottom: 0.9em;
                color: #fff;
            }

            .kkphim-server-name {
                font-size: 1.15em;
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

            .kkphim-episode.focus {
                background: #ff1220;
            }

            @media (max-width: 768px) {
                .kkphim-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.85em;
                }

                .kkphim-detail-backdrop {
                    height: 24em;
                }

                .kkphim-detail-container {
                    gap: 1em;
                    padding: 3.4em 1em 1.2em;
                }

                .kkphim-detail-poster {
                    width: 8.8em;
                    min-width: 8.8em;
                }

                .kkphim-detail-title {
                    font-size: 1.95em;
                }

                .kkphim-detail-origin {
                    font-size: 1.05em;
                }

                .kkphim-detail-desc {
                    font-size: 1.06em;
                    line-height: 1.62;
                }

                .kkphim-watch {
                    width: 100%;
                    font-size: 1.1em;
                }

                .kkphim-episodes-head {
                    font-size: 1.55em;
                }
            }
        </style>
        `;

        $('head').append(css);
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();