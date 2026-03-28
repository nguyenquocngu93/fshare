(function () {
    'use strict';

    if (!window.Lampa) return;

    var API = 'https://phimapi.com';
    var IMG = 'https://phimimg.com/';
    var TMDB = 'https://api.themoviedb.org/3';
    var TMDB_KEY = 'YOUR_TMDB_API_KEY';

    var req = new Lampa.Reguest();

    function strip(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }

    function img(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        return IMG + url;
    }

    function enc(v) {
        return encodeURIComponent(v || '');
    }

    function getJSON(url, ok, fail) {
        req.timeout(20000);
        req.silent(url, function (json) {
            ok && ok(json);
        }, function (a, c) {
            console.log('KKPhim error:', url, a, c);
            fail && fail(a, c);
        }, false, {
            dataType: 'json'
        });
    }

    function mapItem(item) {
        return {
            id: item.slug || item._id || item.id || '',
            slug: item.slug || item._id || item.id || '',
            title: item.name || 'Không tên',
            origin_title: item.origin_name || '',
            thumb: img(item.thumb_url || item.poster_url || ''),
            poster: img(item.poster_url || item.thumb_url || ''),
            background: img(item.poster_url || item.thumb_url || ''),
            year: item.year || '',
            quality: item.quality || '',
            lang: item.lang || '',
            time: item.time || '',
            episode_current: item.episode_current || '',
            episode_total: item.episode_total || '',
            type: item.type || '',
            content: strip(item.content || '')
        };
    }

    function parseList(json) {
        var arr = [];
        if (json && json.data && json.data.items) arr = json.data.items;
        else if (json && json.items) arr = json.items;
        return arr.map(mapItem);
    }

    function getPages(json) {
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
            slug: m.slug || '',
            title: m.name || 'Không tên',
            origin_title: m.origin_name || '',
            poster: img(m.poster_url || m.thumb_url || ''),
            thumb: img(m.thumb_url || m.poster_url || ''),
            background: img(m.poster_url || m.thumb_url || ''),
            year: m.year || '',
            quality: m.quality || '',
            lang: m.lang || '',
            time: m.time || '',
            category: m.category || [],
            country: m.country || [],
            actor: m.actor || [],
            director: m.director || [],
            content: strip(m.content || ''),
            episode_current: m.episode_current || '',
            episode_total: m.episode_total || '',
            episodes: json.episodes || []
        };
    }

    function flatEpisodes(episodes) {
        var out = [];
        (episodes || []).forEach(function (server, si) {
            (server.server_data || []).forEach(function (ep, i) {
                out.push({
                    server: server.server_name || ('Server ' + (si + 1)),
                    name: ep.name || String(i + 1),
                    slug: ep.slug || ('tap-' + (i + 1)),
                    url: ep.link_m3u8 || ep.link_embed || '',
                    link_m3u8: ep.link_m3u8 || '',
                    link_embed: ep.link_embed || ''
                });
            });
        });
        return out;
    }

    function play(movie, ep, all) {
        if (!ep || !ep.url) {
            Lampa.Noty.show('Không có link phát');
            return;
        }

        var playlist = (all || []).map(function (x) {
            return {
                title: movie.title + ' - Tập ' + x.name,
                url: x.url
            };
        });

        Lampa.Player.play({
            title: movie.title + ' - Tập ' + ep.name,
            url: ep.url,
            movie: {
                id: movie.slug,
                title: movie.title,
                img: movie.thumb,
                background: movie.backdrop || movie.background || movie.poster
            }
        });

        try {
            if (Lampa.Player.playlist) Lampa.Player.playlist(playlist);
        } catch (e) {}
    }

    function showEpisodes(movie) {
        var eps = flatEpisodes(movie.episodes);
        if (!eps.length) {
            Lampa.Noty.show('Chưa có tập phim');
            return;
        }

        if (Lampa.Select && Lampa.Select.show) {
            Lampa.Select.show({
                title: 'Danh sách tập',
                items: eps.map(function (ep) {
                    return {
                        title: ep.server + ' - Tập ' + ep.name,
                        ep: ep
                    };
                }),
                onSelect: function (a) {
                    play(movie, a.ep, eps);
                },
                onBack: function () {}
            });
        } else {
            play(movie, eps[0], eps);
        }
    }

    function getTMDBBackdrop(title, year, done) {
        if (!TMDB_KEY || TMDB_KEY === 'YOUR_TMDB_API_KEY') {
            done('');
            return;
        }

        var url = TMDB + '/search/multi?api_key=' + TMDB_KEY + '&query=' + enc(title);
        getJSON(url, function (json) {
            var rs = (json && json.results) || [];
            var pick = null;

            if (year) {
                pick = rs.find(function (r) {
                    var d = r.release_date || r.first_air_date || '';
                    return d.indexOf(String(year)) === 0;
                });
            }

            if (!pick && rs.length) pick = rs[0];

            if (pick && pick.backdrop_path) done('https://image.tmdb.org/t/p/w1280' + pick.backdrop_path);
            else done('');
        }, function () {
            done('');
        });
    }

    function createScroller() {
        return $('<div class="kkpf-scroll"></div>');
    }

    function createCard(item, onClick) {
        var el = $(`
            <div class="kkpf-card selector">
                <div class="kkpf-card__img">
                    <img src="${item.thumb}" alt="${item.title}">
                    ${item.quality ? `<div class="kkpf-card__badge">${item.quality}</div>` : ''}
                </div>
                <div class="kkpf-card__title">${item.title}</div>
                <div class="kkpf-card__meta">${item.year || ''}${item.lang ? ' • ' + item.lang : ''}</div>
            </div>
        `);

        el.on('click hover:enter', function () {
            onClick && onClick(item);
        });

        el.on('hover:focus', function () {
            try {
                if (item.background) Lampa.Background.change(item.background);
            } catch (e) {}
        });

        return el;
    }

    function createRow(title, items, onMore, onClick) {
        var row = $(`
            <div class="kkpf-row">
                <div class="kkpf-row__head">
                    <div class="kkpf-row__title">${title}</div>
                    <div class="kkpf-row__more selector">Xem thêm</div>
                </div>
                <div class="kkpf-row__list"></div>
            </div>
        `);

        var list = row.find('.kkpf-row__list');
        items.forEach(function (item) {
            list.append(createCard(item, onClick));
        });

        row.find('.kkpf-row__more').on('click hover:enter', function () {
            onMore && onMore();
        });

        return row;
    }

    function MainPage() {
        var root = $('<div class="kkpf-page"></div>');
        var scroller = createScroller();
        var body = $('<div class="kkpf-main"></div>');
        var self = this;

        var catalogs = [
            { title: 'Mới cập nhật', url: '/danh-sach/phim-moi-cap-nhat' },
            { title: 'Phim lẻ', url: '/v1/api/danh-sach/phim-le' },
            { title: 'Phim bộ', url: '/v1/api/danh-sach/phim-bo' },
            { title: 'Hoạt hình', url: '/v1/api/danh-sach/hoat-hinh' },
            { title: 'TV Shows', url: '/v1/api/danh-sach/tv-shows' }
        ];

        this.create = function () {
            self.activity.loader(true);
            scroller.append(body);
            root.append(scroller);
            self.activity.render().append(root);

            var done = 0;

            catalogs.forEach(function (cat) {
                getJSON(API + cat.url + '?page=1', function (json) {
                    var items = parseList(json);
                    if (items.length) {
                        body.append(createRow(
                            cat.title,
                            items,
                            function () {
                                Lampa.Activity.push({
                                    component: 'kkpf_category',
                                    title: cat.title,
                                    url: cat.url
                                });
                            },
                            function (item) {
                                Lampa.Activity.push({
                                    component: 'kkpf_detail',
                                    title: item.title,
                                    slug: item.slug
                                });
                            }
                        ));
                    }

                    done++;
                    if (done === catalogs.length) finish();
                }, function () {
                    done++;
                    if (done === catalogs.length) finish();
                });
            });

            function finish() {
                self.activity.loader(false);
                self.start();
            }
        };

        this.start = function () {
            try {
                Lampa.Controller.collectionSet(root);
                Lampa.Controller.collectionFocus(root.find('.selector').first(), root);
            } catch (e) {}
        };

        this.render = function () {
            return root;
        };

        this.destroy = function () {
            root.remove();
        };
    }

    function CategoryPage(object) {
        var root = $('<div class="kkpf-page"></div>');
        var scroller = createScroller();
        var body = $('<div class="kkpf-category"></div>');
        var grid = $('<div class="kkpf-grid"></div>');
        var load = $('<div class="kkpf-load">Đang tải...</div>');
        var empty = $('<div class="kkpf-empty" style="display:none">Không có dữ liệu</div>');

        var self = this;
        var path = object.url || '/danh-sach/phim-moi-cap-nhat';
        var page = 1;
        var pages = 1;
        var loading = false;
        var ended = false;

        function loadPage() {
            if (loading || ended) return;
            loading = true;
            load.show();

            getJSON(API + path + '?page=' + page, function (json) {
                var items = parseList(json);
                pages = getPages(json);

                if (page === 1 && !items.length) empty.show();

                items.forEach(function (item) {
                    grid.append(createCard(item, function (it) {
                        Lampa.Activity.push({
                            component: 'kkpf_detail',
                            title: it.title,
                            slug: it.slug
                        });
                    }));
                });

                if (page >= pages) {
                    ended = true;
                    load.text('Đã tải hết');
                } else {
                    page++;
                    load.hide();
                }

                loading = false;
                self.activity.loader(false);
                self.start();
            }, function () {
                loading = false;
                load.text('Tải lỗi');
                self.activity.loader(false);
            });
        }

        this.create = function () {
            self.activity.loader(true);

            body.append(grid);
            body.append(empty);
            body.append(load.hide());
            scroller.append(body);
            root.append(scroller);
            self.activity.render().append(root);

            scroller.on('scroll', function () {
                var el = scroller[0];
                if (!el || loading || ended) return;

                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 250) {
                    loadPage();
                }
            });

            loadPage();
        };

        this.start = function () {
            try {
                Lampa.Controller.collectionSet(root);
                Lampa.Controller.collectionFocus(root.find('.selector').first(), root);
            } catch (e) {}
        };

        this.render = function () {
            return root;
        };

        this.destroy = function () {
            root.remove();
        };
    }

    function DetailPage(object) {
        var root = $('<div class="kkpf-page"></div>');
        var scroller = createScroller();
        var body = $('<div class="kkpf-detail"></div>');
        var self = this;

        this.create = function () {
            self.activity.loader(true);
            scroller.append(body);
            root.append(scroller);
            self.activity.render().append(root);

            getJSON(API + '/phim/' + object.slug, function (json) {
                var movie = parseDetail(json);
                var eps = flatEpisodes(movie.episodes);

                getTMDBBackdrop(movie.origin_title || movie.title, movie.year, function (backdrop) {
                    movie.backdrop = backdrop || movie.background || movie.poster;

                    try {
                        if (movie.backdrop) Lampa.Background.change(movie.backdrop);
                    } catch (e) {}

                    render(movie, eps);
                    self.activity.loader(false);
                    self.start();
                });
            }, function () {
                body.html('<div class="kkpf-empty">Không tải được chi tiết phim</div>');
                self.activity.loader(false);
                self.start();
            });
        };

        function render(movie, eps) {
            var genres = (movie.category || []).map(function (i) { return i.name; }).join(', ');
            var countries = (movie.country || []).map(function (i) { return i.name; }).join(', ');
            var actors = (movie.actor || []).join(', ');
            var directors = (movie.director || []).join(', ');

            var hero = $(`
                <div class="kkpf-hero">
                    <div class="kkpf-hero__bg" style="background-image:url('${movie.backdrop || movie.poster}')"></div>
                    <div class="kkpf-hero__overlay"></div>
                    <div class="kkpf-hero__inner">
                        <div class="kkpf-hero__poster">
                            <img src="${movie.poster}" alt="${movie.title}">
                        </div>
                        <div class="kkpf-hero__info">
                            <div class="kkpf-hero__title">${movie.title}</div>
                            <div class="kkpf-hero__sub">${movie.origin_title || ''}</div>

                            <div class="kkpf-tags">
                                ${movie.year ? '<span>' + movie.year + '</span>' : ''}
                                ${movie.quality ? '<span>' + movie.quality + '</span>' : ''}
                                ${movie.lang ? '<span>' + movie.lang + '</span>' : ''}
                                ${movie.episode_current ? '<span>' + movie.episode_current + '</span>' : ''}
                            </div>

                            <div class="kkpf-actions">
                                <div class="kkpf-btn kkpf-btn--play selector">Phát ngay</div>
                                <div class="kkpf-btn selector">Chọn tập</div>
                            </div>

                            <div class="kkpf-info">
                                <div><b>Thể loại:</b> ${genres || 'Đang cập nhật'}</div>
                                <div><b>Quốc gia:</b> ${countries || 'Đang cập nhật'}</div>
                                <div><b>Thời lượng:</b> ${movie.time || 'Đang cập nhật'}</div>
                                <div><b>Đạo diễn:</b> ${directors || 'Đang cập nhật'}</div>
                                <div><b>Diễn viên:</b> ${actors || 'Đang cập nhật'}</div>
                            </div>

                            <div class="kkpf-desc">${movie.content || 'Chưa có mô tả'}</div>
                        </div>
                    </div>
                </div>
            `);

            body.append(hero);

            hero.find('.kkpf-btn--play').on('click hover:enter', function () {
                if (!eps.length) return Lampa.Noty.show('Chưa có tập phim');
                play(movie, eps[0], eps);
            });

            hero.find('.kkpf-btn').eq(1).on('click hover:enter', function () {
                showEpisodes(movie);
            });

            if (eps.length) {
                var box = $('<div class="kkpf-episodes"><div class="kkpf-episodes__title">Danh sách tập</div><div class="kkpf-episodes__list"></div></div>');
                var list = box.find('.kkpf-episodes__list');

                eps.forEach(function (ep) {
                    var btn = $('<div class="kkpf-ep selector">Tập ' + ep.name + '</div>');
                    btn.on('click hover:enter', function () {
                        play(movie, ep, eps);
                    });
                    list.append(btn);
                });

                body.append(box);
            }
        }

        this.start = function () {
            try {
                Lampa.Controller.collectionSet(root);
                Lampa.Controller.collectionFocus(root.find('.selector').first(), root);
            } catch (e) {}
        };

        this.render = function () {
            return root;
        };

        this.destroy = function () {
            root.remove();
        };
    }

    function addStyle() {
        if ($('#kkpf-style').length) return;

        $('head').append(`
            <style id="kkpf-style">
                .kkpf-page{
                    position:absolute;
                    top:0;
                    left:0;
                    right:0;
                    bottom:0;
                    overflow:hidden;
                }

                .kkpf-scroll{
                    position:absolute;
                    top:0;
                    left:0;
                    right:0;
                    bottom:0;
                    overflow-y:auto;
                    overflow-x:hidden;
                    -webkit-overflow-scrolling:touch;
                    padding-bottom:40px;
                }

                .kkpf-main,
                .kkpf-category,
                .kkpf-detail{
                    min-height:100%;
                    padding:12px 0 24px 0;
                }

                .kkpf-row{
                    margin-bottom:22px;
                }

                .kkpf-row__head{
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:0 14px 10px;
                    gap:10px;
                }

                .kkpf-row__title{
                    font-size:20px;
                    font-weight:700;
                }

                .kkpf-row__more{
                    padding:8px 12px;
                    border-radius:12px;
                    background:rgba(255,255,255,.12);
                    font-size:13px;
                    white-space:nowrap;
                }

                .kkpf-row__list{
                    display:flex;
                    gap:12px;
                    overflow-x:auto;
                    overflow-y:hidden;
                    padding:0 14px 4px;
                    -webkit-overflow-scrolling:touch;
                }

                .kkpf-row__list::-webkit-scrollbar{
                    display:none;
                }

                .kkpf-card{
                    width:132px;
                    min-width:132px;
                    flex:0 0 132px;
                }

                .kkpf-card__img{
                    position:relative;
                    width:100%;
                    aspect-ratio:2/3;
                    overflow:hidden;
                    border-radius:14px;
                    background:#222;
                }

                .kkpf-card__img img{
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    display:block;
                }

                .kkpf-card__badge{
                    position:absolute;
                    top:8px;
                    right:8px;
                    background:#ff5a2f;
                    color:#fff;
                    padding:4px 7px;
                    border-radius:8px;
                    font-size:11px;
                    font-weight:700;
                }

                .kkpf-card__title{
                    margin-top:8px;
                    font-size:14px;
                    font-weight:600;
                    line-height:1.35;
                    display:-webkit-box;
                    -webkit-line-clamp:2;
                    -webkit-box-orient:vertical;
                    overflow:hidden;
                }

                .kkpf-card__meta{
                    margin-top:3px;
                    font-size:12px;
                    opacity:.7;
                }

                .kkpf-grid{
                    display:grid;
                    grid-template-columns:repeat(3,minmax(0,1fr));
                    gap:12px;
                    padding:0 14px;
                }

                .kkpf-load,.kkpf-empty{
                    text-align:center;
                    padding:18px 14px;
                    font-size:14px;
                    opacity:.8;
                }

                .kkpf-hero{
                    position:relative;
                    overflow:hidden;
                    background:#111;
                    border-radius:0 0 20px 20px;
                }

                .kkpf-hero__bg{
                    position:absolute;
                    inset:0;
                    background-size:cover;
                    background-position:center;
                    filter:blur(10px);
                    transform:scale(1.06);
                    opacity:.35;
                }

                .kkpf-hero__overlay{
                    position:absolute;
                    inset:0;
                    background:linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.82) 60%, rgba(0,0,0,.96) 100%);
                }

                .kkpf-hero__inner{
                    position:relative;
                    z-index:2;
                    display:flex;
                    flex-direction:column;
                    gap:16px;
                    padding:16px 14px 20px;
                }

                .kkpf-hero__poster{
                    width:150px;
                    max-width:42vw;
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:0 12px 30px rgba(0,0,0,.35);
                }

                .kkpf-hero__poster img{
                    width:100%;
                    display:block;
                }

                .kkpf-hero__title{
                    font-size:24px;
                    line-height:1.25;
                    font-weight:800;
                }

                .kkpf-hero__sub{
                    margin-top:4px;
                    font-size:14px;
                    opacity:.72;
                }

                .kkpf-tags{
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                    margin-top:12px;
                }

                .kkpf-tags span{
                    padding:7px 10px;
                    border-radius:999px;
                    background:rgba(255,255,255,.12);
                    font-size:12px;
                }

                .kkpf-actions{
                    display:flex;
                    flex-wrap:wrap;
                    gap:10px;
                    margin-top:14px;
                }

                .kkpf-btn{
                    min-width:120px;
                    text-align:center;
                    padding:11px 14px;
                    border-radius:14px;
                    background:rgba(255,255,255,.12);
                    font-size:14px;
                    font-weight:700;
                }

                .kkpf-btn--play{
                    background:#ff5a2f;
                    color:#fff;
                }

                .kkpf-info{
                    margin-top:14px;
                    font-size:14px;
                    line-height:1.7;
                }

                .kkpf-desc{
                    margin-top:14px;
                    font-size:14px;
                    line-height:1.7;
                    opacity:.94;
                }

                .kkpf-episodes{
                    padding:18px 14px 24px;
                }

                .kkpf-episodes__title{
                    font-size:18px;
                    font-weight:800;
                    margin-bottom:12px;
                }

                .kkpf-episodes__list{
                    display:flex;
                    flex-wrap:wrap;
                    gap:10px;
                }

                .kkpf-ep{
                    min-width:76px;
                    text-align:center;
                    padding:10px 14px;
                    border-radius:12px;
                    background:rgba(255,255,255,.1);
                    font-size:14px;
                }

                @media (min-width:768px){
                    .kkpf-grid{
                        grid-template-columns:repeat(5,minmax(0,1fr));
                    }

                    .kkpf-hero__inner{
                        display:grid;
                        grid-template-columns:220px 1fr;
                        gap:24px;
                        align-items:start;
                        padding:24px;
                    }

                    .kkpf-hero__poster{
                        width:220px;
                        max-width:none;
                    }

                    .kkpf-hero__title{
                        font-size:34px;
                    }

                    .kkpf-desc,.kkpf-info{
                        max-width:900px;
                    }
                }
            </style>
        `);
    }

    function addMenu() {
        function run() {
            var menu = $('.menu .menu__list').eq(0);
            if (!menu.length) return setTimeout(run, 1000);
            if (menu.find('[data-action="kkpf"]').length) return;

            var item = $(`
                <li class="menu__item selector" data-action="kkpf">
                    <div class="menu__ico">🎬</div>
                    <div class="menu__text">KKPhim</div>
                </li>
            `);

            item.on('click hover:enter', function () {
                Lampa.Activity.push({
                    component: 'kkpf_main',
                    title: 'KKPhim'
                });
            });

            menu.append(item);
        }

        run();
    }

    Lampa.Component.add('kkpf_main', MainPage);
    Lampa.Component.add('kkpf_category', CategoryPage);
    Lampa.Component.add('kkpf_detail', DetailPage);

    function start() {
        addStyle();
        addMenu();
        console.log('KKPhim fixed scroll plugin ready');
    }

    if (Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    } else {
        start();
    }
})();