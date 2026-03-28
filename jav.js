(function () {
    'use strict';

    if (!window.Lampa) return;

    var plugin_title = 'KKPhim';
    var API = 'https://phimapi.com';
    var IMG = 'https://phimimg.com/';
    var req = new Lampa.Reguest();

    function strip(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    }

    function img(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        return IMG + url;
    }

    function mapItem(item) {
        return {
            id: item.slug || item._id || item.id,
            slug: item.slug || item._id || item.id,
            title: item.name || 'Không tên',
            original_title: item.origin_name || '',
            thumb: img(item.thumb_url || item.poster_url || ''),
            poster: img(item.poster_url || item.thumb_url || ''),
            background: img(item.poster_url || item.thumb_url || ''),
            year: item.year || '',
            type: item.type || 'single',
            quality: item.quality || '',
            lang: item.lang || '',
            episode_current: item.episode_current || '',
            episode_total: item.episode_total || '',
            content: strip(item.content || '')
        };
    }

    function requestJSON(url, ok, fail) {
        req.timeout(15000);
        req.silent(url, function (json) {
            ok && ok(json);
        }, function (a, c) {
            console.error('KKPhim request error:', url, a, c);
            fail && fail(a, c);
        }, false, {
            dataType: 'json'
        });
    }

    function createCard(item, onEnter) {
        var card = $(`
            <div class="kkp-card selector">
                <div class="kkp-card__poster">
                    <img src="${item.thumb}" />
                    <div class="kkp-card__badge">${item.quality || ''}</div>
                </div>
                <div class="kkp-card__name">${item.title}</div>
                <div class="kkp-card__meta">${item.year || ''} ${item.lang ? '• ' + item.lang : ''}</div>
            </div>
        `);

        card.on('hover:focus', function () {
            if (item.background) Lampa.Background.change(item.background);
        });

        card.on('hover:enter', function () {
            onEnter && onEnter(item);
        });

        return card;
    }

    function createRow(title, items, onMore, onEnter) {
        var row = $(`
            <div class="kkp-row">
                <div class="kkp-row__head">
                    <div class="kkp-row__title">${title}</div>
                    <div class="kkp-row__more selector">Xem thêm</div>
                </div>
                <div class="kkp-row__body"></div>
            </div>
        `);

        var body = row.find('.kkp-row__body');
        items.forEach(function (item) {
            body.append(createCard(item, onEnter));
        });

        row.find('.kkp-row__more').on('hover:enter', function () {
            onMore && onMore();
        });

        return row;
    }

    function parseList(json) {
        var arr = [];
        if (json && json.data && json.data.items) arr = json.data.items;
        else if (json && json.items) arr = json.items;
        return arr.map(mapItem);
    }

    function getTotalPages(json) {
        if (json && json.data && json.data.params && json.data.params.pagination) {
            return json.data.params.pagination.totalPages || 1;
        }
        if (json && json.pagination) {
            return json.pagination.totalPages || 1;
        }
        return 1;
    }

    function parseDetail(json) {
        var m = json.movie || {};
        return {
            id: m.slug || '',
            slug: m.slug || '',
            title: m.name || 'Không tên',
            original_title: m.origin_name || '',
            poster: img(m.poster_url || m.thumb_url || ''),
            thumb: img(m.thumb_url || m.poster_url || ''),
            background: img(m.poster_url || m.thumb_url || ''),
            year: m.year || '',
            time: m.time || '',
            quality: m.quality || '',
            lang: m.lang || '',
            category: m.category || [],
            country: m.country || [],
            director: m.director || [],
            actor: m.actor || [],
            content: strip(m.content || ''),
            episode_current: m.episode_current || '',
            episode_total: m.episode_total || '',
            episodes: json.episodes || []
        };
    }

    function flattenEpisodes(episodes) {
        var list = [];
        (episodes || []).forEach(function (server, sIndex) {
            (server.server_data || []).forEach(function (ep, i) {
                list.push({
                    server: server.server_name || ('Server ' + (sIndex + 1)),
                    name: ep.name || String(i + 1),
                    slug: ep.slug || ('tap-' + (i + 1)),
                    url: ep.link_m3u8 || ep.link_embed || '',
                    link_m3u8: ep.link_m3u8 || '',
                    link_embed: ep.link_embed || ''
                });
            });
        });
        return list;
    }

    function playMovie(movie, episode, allEpisodes) {
        if (!episode || !episode.url) {
            Lampa.Noty.show('Không có link phát');
            return;
        }

        var playlist = (allEpisodes || []).map(function (ep) {
            return {
                title: movie.title + ' - Tập ' + ep.name,
                url: ep.url
            };
        });

        Lampa.Player.play({
            title: movie.title + ' - Tập ' + episode.name,
            url: episode.url,
            movie: {
                id: movie.slug,
                title: movie.title,
                img: movie.thumb,
                background: movie.background
            }
        });

        if (Lampa.Player.playlist) {
            Lampa.Player.playlist(playlist);
        }
    }

    function showEpisodeDialog(movie) {
        var eps = flattenEpisodes(movie.episodes);

        if (!eps.length) {
            Lampa.Noty.show('Chưa có tập phim');
            return;
        }

        var items = eps.map(function (ep) {
            return {
                title: ep.server + ' - Tập ' + ep.name,
                episode: ep
            };
        });

        Lampa.Select.show({
            title: 'Chọn tập phim',
            items: items,
            onSelect: function (a) {
                playMovie(movie, a.episode, eps);
            },
            onBack: function () {}
        });
    }

    function MainComponent() {
        var html = $('<div class="kkp-page"></div>');
        var scroll = new Lampa.Scroll({mask: true, over: true});

        var catalogs = [
            { title: 'Mới cập nhật', url: '/danh-sach/phim-moi-cap-nhat' },
            { title: 'Phim lẻ', url: '/v1/api/danh-sach/phim-le' },
            { title: 'Phim bộ', url: '/v1/api/danh-sach/phim-bo' },
            { title: 'Hoạt hình', url: '/v1/api/danh-sach/hoat-hinh' },
            { title: 'TV Shows', url: '/v1/api/danh-sach/tv-shows' }
        ];

        this.create = function () {
            var _this = this;
            _this.activity.loader(true);
            scroll.append(html);
            _this.activity.render().append(scroll.render());

            var done = 0;

            catalogs.forEach(function (cat) {
                requestJSON(API + cat.url + '?page=1', function (json) {
                    var items = parseList(json);

                    if (items.length) {
                        var row = createRow(
                            cat.title,
                            items,
                            function () {
                                Lampa.Activity.push({
                                    component: 'kkp_category',
                                    title: cat.title,
                                    url: cat.url
                                });
                            },
                            function (item) {
                                Lampa.Activity.push({
                                    component: 'kkp_detail',
                                    title: item.title,
                                    slug: item.slug
                                });
                            }
                        );

                        html.append(row);
                    }

                    done++;
                    if (done >= catalogs.length) {
                        _this.activity.loader(false);
                        _this.start();
                    }
                }, function () {
                    done++;
                    if (done >= catalogs.length) {
                        _this.activity.loader(false);
                        _this.start();
                    }
                });
            });
        };

        this.start = function () {
            Lampa.Controller.add('kkp_main', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(scroll.render().find('.selector').eq(0), scroll.render());
                },
                up: function () { navigate('up'); },
                down: function () { navigate('down'); },
                left: function () { navigate('left'); },
                right: function () { navigate('right'); },
                back: function () { Lampa.Activity.backward(); }
            });

            Lampa.Controller.toggle('kkp_main');
        };

        this.render = function () {
            return scroll.render();
        };

        this.destroy = function () {
            scroll.destroy();
            html.remove();
        };
    }

    function CategoryComponent(object) {
        var html = $('<div class="kkp-category"></div>');
        var grid = $('<div class="kkp-grid"></div>');
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var page = 1;
        var total = 1;
        var loading = false;
        var ended = false;
        var path = object.url || '/danh-sach/phim-moi-cap-nhat';

        this.create = function () {
            var _this = this;
            _this.activity.loader(true);
            scroll.append(html);
            html.append(grid);
            _this.activity.render().append(scroll.render());

            loadPage(page);

            scroll.render().on('scroll', function () {
                var el = scroll.render()[0];
                if (!el || loading || ended) return;

                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
                    loadPage(page + 1);
                }
            });
        };

        function loadPage(p) {
            loading = true;
            requestJSON(API + path + '?page=' + p, function (json) {
                var items = parseList(json);
                total = getTotalPages(json);

                items.forEach(function (item) {
                    grid.append(createCard(item, function (it) {
                        Lampa.Activity.push({
                            component: 'kkp_detail',
                            title: it.title,
                            slug: it.slug
                        });
                    }));
                });

                page = p;
                loading = false;
                if (page >= total) ended = true;
            }, function () {
                loading = false;
            });
        }

        this.start = function () {
            Lampa.Controller.add('kkp_category', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(scroll.render().find('.selector').eq(0), scroll.render());
                },
                up: function () { navigate('up'); },
                down: function () { navigate('down'); },
                left: function () { navigate('left'); },
                right: function () { navigate('right'); },
                back: function () { Lampa.Activity.backward(); }
            });

            Lampa.Controller.toggle('kkp_category');
        };

        this.render = function () {
            return scroll.render();
        };

        this.destroy = function () {
            scroll.destroy();
            html.remove();
        };
    }

    function DetailComponent(object) {
        var html = $('<div class="kkp-detail"></div>');
        var scroll = new Lampa.Scroll({mask: true, over: true});

        this.create = function () {
            var _this = this;
            _this.activity.loader(true);
            scroll.append(html);
            _this.activity.render().append(scroll.render());

            requestJSON(API + '/phim/' + object.slug, function (json) {
                var movie = parseDetail(json);
                var eps = flattenEpisodes(movie.episodes);

                if (movie.background) Lampa.Background.change(movie.background);

                var genres = (movie.category || []).map(function (g) { return g.name; }).join(', ');
                var countries = (movie.country || []).map(function (g) { return g.name; }).join(', ');
                var actors = (movie.actor || []).join(', ');
                var directors = (movie.director || []).join(', ');

                var hero = $(`
                    <div class="kkp-detail__hero">
                        <div class="kkp-detail__backdrop" style="background-image:url('${movie.background}')"></div>
                        <div class="kkp-detail__overlay"></div>
                        <div class="kkp-detail__content">
                            <div class="kkp-detail__poster">
                                <img src="${movie.poster}">
                            </div>
                            <div class="kkp-detail__info">
                                <div class="kkp-detail__title">${movie.title}</div>
                                <div class="kkp-detail__origin">${movie.original_title || ''}</div>

                                <div class="kkp-detail__tags">
                                    <span>${movie.year || 'N/A'}</span>
                                    <span>${movie.quality || 'HD'}</span>
                                    <span>${movie.lang || 'Vietsub'}</span>
                                    <span>${movie.episode_current || ''}</span>
                                </div>

                                <div class="kkp-detail__buttons">
                                    <div class="kkp-btn kkp-btn--play selector">▶ Phát ngay</div>
                                    <div class="kkp-btn selector">☰ Tập phim</div>
                                </div>

                                <div class="kkp-detail__meta">
                                    <p><b>Thể loại:</b> ${genres || 'Đang cập nhật'}</p>
                                    <p><b>Quốc gia:</b> ${countries || 'Đang cập nhật'}</p>
                                    <p><b>Đạo diễn:</b> ${directors || 'Đang cập nhật'}</p>
                                    <p><b>Diễn viên:</b> ${actors || 'Đang cập nhật'}</p>
                                    <p><b>Thời lượng:</b> ${movie.time || 'Đang cập nhật'}</p>
                                </div>

                                <div class="kkp-detail__desc">
                                    ${movie.content || 'Chưa có mô tả'}
                                </div>
                            </div>
                        </div>
                    </div>
                `);

                var episodeBox = $('<div class="kkp-episodes"><div class="kkp-episodes__title">Danh sách tập</div><div class="kkp-episodes__list"></div></div>');
                var epList = episodeBox.find('.kkp-episodes__list');

                eps.forEach(function (ep, i) {
                    var epBtn = $('<div class="kkp-ep selector">Tập ' + ep.name + '</div>');

                    epBtn.on('hover:enter', function () {
                        playMovie(movie, ep, eps);
                    });

                    epList.append(epBtn);
                });

                hero.find('.kkp-btn--play').on('hover:enter', function () {
                    if (eps.length) playMovie(movie, eps[0], eps);
                    else Lampa.Noty.show('Chưa có link phát');
                });

                hero.find('.kkp-btn').eq(1).on('hover:enter', function () {
                    showEpisodeDialog(movie);
                });

                html.append(hero);
                if (eps.length) html.append(episodeBox);

                _this.activity.loader(false);
                _this.start();
            }, function () {
                _this.activity.loader(false);
                html.html('<div style="padding:2em;font-size:1.5em">Không tải được chi tiết phim</div>');
                _this.start();
            });
        };

        this.start = function () {
            Lampa.Controller.add('kkp_detail', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(scroll.render().find('.selector').eq(0), scroll.render());
                },
                up: function () { navigate('up'); },
                down: function () { navigate('down'); },
                left: function () { navigate('left'); },
                right: function () { navigate('right'); },
                back: function () { Lampa.Activity.backward(); }
            });

            Lampa.Controller.toggle('kkp_detail');
        };

        this.render = function () {
            return scroll.render();
        };

        this.destroy = function () {
            scroll.destroy();
            html.remove();
        };
    }

    function injectStyle() {
        var style = $(`
            <style>
                .kkp-page,.kkp-category,.kkp-detail{padding:1.2em 0 2em 0}
                .kkp-row{margin-bottom:2em}
                .kkp-row__head{
                    display:flex;align-items:center;justify-content:space-between;
                    padding:0 1.2em 1em 1.2em;
                }
                .kkp-row__title{font-size:1.6em;font-weight:700}
                .kkp-row__more{
                    background:rgba(255,255,255,.12);
                    padding:.5em 1em;border-radius:1em;font-size:1em;
                }
                .kkp-row__body{
                    display:flex;gap:1em;overflow-x:auto;padding:0 1.2em .5em 1.2em;
                }
                .kkp-card{width:170px;flex:0 0 170px}
                .kkp-card__poster{
                    width:100%;aspect-ratio:2/3;border-radius:1em;overflow:hidden;
                    position:relative;background:#222;
                }
                .kkp-card__poster img{width:100%;height:100%;object-fit:cover;display:block}
                .kkp-card__badge{
                    position:absolute;top:.6em;right:.6em;background:#ff5722;color:#fff;
                    padding:.25em .5em;border-radius:.5em;font-size:.75em;font-weight:700;
                }
                .kkp-card__name{
                    margin-top:.7em;font-size:1em;font-weight:600;line-height:1.35;
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
                }
                .kkp-card__meta{opacity:.7;font-size:.85em;margin-top:.2em}
                .kkp-grid{
                    display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
                    gap:1.2em;padding:1.2em;
                }
                .kkp-detail__hero{
                    position:relative;min-height:70vh;border-radius:1.4em;overflow:hidden;margin:0 1.2em;
                    background:#111;
                }
                .kkp-detail__backdrop{
                    position:absolute;inset:0;background-size:cover;background-position:center;
                    transform:scale(1.08);filter:blur(8px);opacity:.4;
                }
                .kkp-detail__overlay{
                    position:absolute;inset:0;
                    background:linear-gradient(90deg,rgba(10,10,10,.96) 0%,rgba(10,10,10,.86) 45%,rgba(10,10,10,.55) 100%);
                }
                .kkp-detail__content{
                    position:relative;z-index:2;display:flex;gap:2em;padding:2em;
                }
                .kkp-detail__poster{
                    width:260px;min-width:260px;border-radius:1.2em;overflow:hidden;background:#222;
                    box-shadow:0 10px 35px rgba(0,0,0,.45);
                }
                .kkp-detail__poster img{width:100%;display:block}
                .kkp-detail__info{flex:1;padding-top:.2em}
                .kkp-detail__title{font-size:2.4em;font-weight:800;line-height:1.2}
                .kkp-detail__origin{opacity:.75;font-size:1.1em;margin-top:.4em}
                .kkp-detail__tags{display:flex;gap:.7em;flex-wrap:wrap;margin-top:1em}
                .kkp-detail__tags span{
                    background:rgba(255,255,255,.12);padding:.45em .8em;border-radius:.8em;font-size:.95em
                }
                .kkp-detail__buttons{display:flex;gap:1em;margin-top:1.4em}
                .kkp-btn{
                    padding:.9em 1.4em;border-radius:1em;background:rgba(255,255,255,.12);
                    font-size:1.05em;font-weight:700;
                }
                .kkp-btn--play{background:#ff5722;color:#fff}
                .kkp-detail__meta{margin-top:1.4em;font-size:1em;line-height:1.7}
                .kkp-detail__desc{
                    margin-top:1.2em;font-size:1em;line-height:1.7;opacity:.95;
                    max-width:900px;
                }
                .kkp-episodes{padding:1.5em 1.2em}
                .kkp-episodes__title{font-size:1.5em;font-weight:800;margin-bottom:1em}
                .kkp-episodes__list{display:flex;flex-wrap:wrap;gap:.8em}
                .kkp-ep{
                    padding:.8em 1.1em;background:rgba(255,255,255,.1);
                    border-radius:.8em;font-size:1em;min-width:90px;text-align:center;
                }
            </style>
        `);

        $('head').append(style);
    }

    function addMenu() {
        var tryAdd = function () {
            var menu = $('.menu .menu__list').eq(0);
            if (!menu.length) return setTimeout(tryAdd, 1000);
            if (menu.find('[data-action="kkphim_custom"]').length) return;

            var item = $(`
                <li class="menu__item selector" data-action="kkphim_custom">
                    <div class="menu__ico">🎬</div>
                    <div class="menu__text">KKPhim</div>
                </li>
            `);

            item.on('hover:enter', function () {
                Lampa.Activity.push({
                    component: 'kkp_main',
                    title: 'KKPhim'
                });
            });

            menu.append(item);
        };

        tryAdd();
    }

    Lampa.Component.add('kkp_main', MainComponent);
    Lampa.Component.add('kkp_category', CategoryComponent);
    Lampa.Component.add('kkp_detail', DetailComponent);

    function start() {
        injectStyle();
        addMenu();
        console.log('KKPhim custom plugin ready');
    }

    if (Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    } else {
        start();
    }
})();