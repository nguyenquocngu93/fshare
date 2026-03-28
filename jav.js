(function () {
    'use strict';

    if (!window.Lampa) return;

    var API = 'https://phimapi.com';
    var IMG = 'https://phimimg.com/';
    var TMDB = 'https://api.themoviedb.org/3';
    var TMDB_KEY = '6979c8ec101ed849f44d197c86582644'; // thay key tmdb của bạn vào đây
    var req = new Lampa.Reguest();

    function strip(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }

    function toImg(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        return IMG + url;
    }

    function q(s) {
        return encodeURIComponent(s || '');
    }

    function mapItem(item) {
        return {
            id: item.slug || item._id || item.id || '',
            slug: item.slug || item._id || item.id || '',
            title: item.name || 'Không tên',
            origin_title: item.origin_name || '',
            thumb: toImg(item.thumb_url || item.poster_url || ''),
            poster: toImg(item.poster_url || item.thumb_url || ''),
            background: toImg(item.poster_url || item.thumb_url || ''),
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

    function requestJSON(url, ok, fail) {
        req.timeout(20000);
        req.silent(url, function (json) {
            ok && ok(json);
        }, function (a, c) {
            console.log('KKP request fail:', url, a, c);
            fail && fail(a, c);
        }, false, {
            dataType: 'json'
        });
    }

    function parseList(json) {
        var arr = [];
        if (json && json.data && json.data.items) arr = json.data.items;
        else if (json && json.items) arr = json.items;
        return arr.map(mapItem);
    }

    function totalPages(json) {
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
            origin_title: m.origin_name || '',
            poster: toImg(m.poster_url || m.thumb_url || ''),
            thumb: toImg(m.thumb_url || m.poster_url || ''),
            background: toImg(m.poster_url || m.thumb_url || ''),
            year: m.year || '',
            quality: m.quality || '',
            lang: m.lang || '',
            time: m.time || '',
            content: strip(m.content || ''),
            episode_current: m.episode_current || '',
            episode_total: m.episode_total || '',
            category: m.category || [],
            country: m.country || [],
            actor: m.actor || [],
            director: m.director || [],
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

    function playEpisode(movie, ep, all) {
        if (!ep || !ep.url) {
            Lampa.Noty.show('Không có link phát');
            return;
        }

        var playlist = (all || []).map(function (item) {
            return {
                title: movie.title + ' - Tập ' + item.name,
                url: item.url
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

        if (Lampa.Player.playlist) {
            try { Lampa.Player.playlist(playlist); } catch (e) {}
        }
    }

    function showEpSelect(movie) {
        var eps = flatEpisodes(movie.episodes);
        if (!eps.length) {
            Lampa.Noty.show('Chưa có tập');
            return;
        }

        var items = eps.map(function (ep) {
            return {
                title: ep.server + ' - Tập ' + ep.name,
                ep: ep
            };
        });

        if (Lampa.Select && Lampa.Select.show) {
            Lampa.Select.show({
                title: 'Danh sách tập',
                items: items,
                onSelect: function (a) {
                    playEpisode(movie, a.ep, eps);
                },
                onBack: function () {}
            });
        } else {
            playEpisode(movie, eps[0], eps);
        }
    }

    function getTmdbBackdrop(title, year, callback) {
        if (!TMDB_KEY || TMDB_KEY === 'YOUR_TMDB_API_KEY') {
            callback('');
            return;
        }

        var url = TMDB + '/search/multi?api_key=' + TMDB_KEY + '&query=' + q(title);
        requestJSON(url, function (json) {
            var results = (json && json.results) ? json.results : [];
            if (!results.length) {
                callback('');
                return;
            }

            var pick = null;

            if (year) {
                pick = results.find(function (r) {
                    var d = r.release_date || r.first_air_date || '';
                    return d.indexOf(String(year)) === 0;
                });
            }

            if (!pick) pick = results[0];

            if (pick && pick.backdrop_path) {
                callback('https://image.tmdb.org/t/p/w1280' + pick.backdrop_path);
            } else {
                callback('');
            }
        }, function () {
            callback('');
        });
    }

    function card(item, onEnter) {
        var el = $(`
            <div class="kkpm-card selector">
                <div class="kkpm-card__img">
                    <img src="${item.thumb}" alt="${item.title}">
                    ${item.quality ? '<div class="kkpm-card__badge">' + item.quality + '</div>' : ''}
                </div>
                <div class="kkpm-card__title">${item.title}</div>
                <div class="kkpm-card__meta">${item.year || ''}${item.lang ? ' • ' + item.lang : ''}</div>
            </div>
        `);

        el.on('hover:enter click', function () {
            onEnter && onEnter(item);
        });

        el.on('hover:focus', function () {
            if (item.background) {
                try { Lampa.Background.change(item.background); } catch (e) {}
            }
        });

        return el;
    }

    function rowBlock(title, items, onMore, onEnter) {
        var row = $(`
            <div class="kkpm-row">
                <div class="kkpm-row__head">
                    <div class="kkpm-row__title">${title}</div>
                    <div class="kkpm-row__more selector">Xem thêm</div>
                </div>
                <div class="kkpm-row__list"></div>
            </div>
        `);

        var list = row.find('.kkpm-row__list');
        items.forEach(function (item) {
            list.append(card(item, onEnter));
        });

        row.find('.kkpm-row__more').on('hover:enter click', function () {
            onMore && onMore();
        });

        return row;
    }

    function MainPage() {
        var root = $('<div class="kkpm-page kkpm-main"></div>');
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
            self.activity.render().append(root);

            var count = 0;

            catalogs.forEach(function (cat) {
                requestJSON(API + cat.url + '?page=1', function (json) {
                    var items = parseList(json);

                    if (items.length) {
                        root.append(rowBlock(
                            cat.title,
                            items,
                            function () {
                                Lampa.Activity.push({
                                    component: 'kkpm_category',
                                    title: cat.title,
                                    url: cat.url
                                });
                            },
                            function (item) {
                                Lampa.Activity.push({
                                    component: 'kkpm_detail',
                                    title: item.title,
                                    slug: item.slug
                                });
                            }
                        ));
                    }

                    count++;
                    if (count === catalogs.length) done();
                }, function () {
                    count++;
                    if (count === catalogs.length) done();
                });
            });

            function done() {
                self.activity.loader(false);
                self.start();
            }
        };

        this.start = function () {
            setTimeout(function () {
                var first = root.find('.selector').first();
                if (first.length) {
                    try {
                        Lampa.Controller.collectionSet(root);
                        Lampa.Controller.collectionFocus(first, root);
                    } catch (e) {}
                }
            }, 100);
        };

        this.render = function () {
            return root;
        };

        this.destroy = function () {
            root.remove();
        };
    }

    function CategoryPage(object) {
        var root = $('<div class="kkpm-page kkpm-category"></div>');
        var grid = $('<div class="kkpm-grid"></div>');
        var load = $('<div class="kkpm-load">Đang tải...</div>');
        var empty = $('<div class="kkpm-empty" style="display:none">Không có dữ liệu</div>');

        var page = 1;
        var pages = 1;
        var loading = false;
        var finished = false;
        var path = object.url || '/danh-sach/phim-moi-cap-nhat';
        var self = this;

        function appendItems(items) {
            items.forEach(function (item) {
                grid.append(card(item, function (it) {
                    Lampa.Activity.push({
                        component: 'kkpm_detail',
                        title: it.title,
                        slug: it.slug
                    });
                }));
            });
        }

        function nextLoad() {
            if (loading || finished) return;
            loading = true;
            load.show();

            requestJSON(API + path + '?page=' + page, function (json) {
                var items = parseList(json);
                pages = totalPages(json);

                if (page === 1 && !items.length) {
                    empty.show();
                } else {
                    appendItems(items);
                }

                if (page >= pages) {
                    finished = true;
                    load.text('Đã tải hết');
                } else {
                    page++;
                    load.hide();
                }

                loading = false;
                self.activity.loader(false);

                try {
                    var first = root.find('.selector').first();
                    if (first.length) {
                        Lampa.Controller.collectionSet(root);
                        Lampa.Controller.collectionFocus(first, root);
                    }
                } catch (e) {}
            }, function () {
                loading = false;
                load.text('Tải lỗi');
                self.activity.loader(false);
            });
        }

        function bindInfinite() {
            $(window).off('scroll.kkpm_category').on('scroll.kkpm_category', function () {
                if (loading || finished) return;

                var scrollTop = $(window).scrollTop();
                var winH = $(window).height();
                var docH = $(document).height();

                if (scrollTop + winH >= docH - 300) {
                    nextLoad();
                }
            });
        }

        this.create = function () {
            self.activity.loader(true);
            root.append(grid);
            root.append(empty);
            root.append(load.hide());
            self.activity.render().append(root);

            bindInfinite();
            nextLoad();
        };

        this.start = function () {
            setTimeout(function () {
                var first = root.find('.selector').first();
                if (first.length) {
                    try {
                        Lampa.Controller.collectionSet(root);
                        Lampa.Controller.collectionFocus(first, root);
                    } catch (e) {}
                }
            }, 100);
        };

        this.render = function () {
            return root;
        };

        this.destroy = function () {
            $(window).off('scroll.kkpm_category');
            root.remove();
        };
    }

    function DetailPage(object) {
        var root = $('<div class="kkpm-page kkpm-detail"></div>');
        var self = this;

        this.create = function () {
            self.activity.loader(true);
            self.activity.render().append(root);

            requestJSON(API + '/phim/' + object.slug, function (json) {
                var movie = parseDetail(json);
                var eps = flatEpisodes(movie.episodes);

                getTmdbBackdrop(movie.origin_title || movie.title, movie.year, function (tmdbBackdrop) {
                    movie.backdrop = tmdbBackdrop || movie.background || movie.poster;

                    if (movie.backdrop) {
                        try { Lampa.Background.change(movie.backdrop); } catch (e) {}
                    }

                    renderDetail(movie, eps);
                    self.activity.loader(false);
                    self.start();
                });
            }, function () {
                root.html('<div class="kkpm-empty">Không tải được thông tin phim</div>');
                self.activity.loader(false);
                self.start();
            });
        };

        function renderDetail(movie, eps) {
            var genres = (movie.category || []).map(function (x) { return x.name; }).join(', ');
            var countries = (movie.country || []).map(function (x) { return x.name; }).join(', ');
            var actors = (movie.actor || []).join(', ');
            var directors = (movie.director || []).join(', ');

            var top = $(`
                <div class="kkpm-hero">
                    <div class="kkpm-hero__bg" style="background-image:url('${movie.backdrop || movie.background || movie.poster}')"></div>
                    <div class="kkpm-hero__overlay"></div>
                    <div class="kkpm-hero__inner">
                        <div class="kkpm-hero__poster">
                            <img src="${movie.poster}" alt="${movie.title}">
                        </div>
                        <div class="kkpm-hero__info">
                            <div class="kkpm-hero__title">${movie.title}</div>
                            <div class="kkpm-hero__sub">${movie.origin_title || ''}</div>

                            <div class="kkpm-tags">
                                ${movie.year ? '<span>' + movie.year + '</span>' : ''}
                                ${movie.quality ? '<span>' + movie.quality + '</span>' : ''}
                                ${movie.lang ? '<span>' + movie.lang + '</span>' : ''}
                                ${movie.episode_current ? '<span>' + movie.episode_current + '</span>' : ''}
                            </div>

                            <div class="kkpm-actions">
                                <div class="kkpm-btn kkpm-btn--play selector">Phát ngay</div>
                                <div class="kkpm-btn selector">Chọn tập</div>
                            </div>

                            <div class="kkpm-info">
                                <div><b>Thể loại:</b> ${genres || 'Đang cập nhật'}</div>
                                <div><b>Quốc gia:</b> ${countries || 'Đang cập nhật'}</div>
                                <div><b>Thời lượng:</b> ${movie.time || 'Đang cập nhật'}</div>
                                <div><b>Đạo diễn:</b> ${directors || 'Đang cập nhật'}</div>
                                <div><b>Diễn viên:</b> ${actors || 'Đang cập nhật'}</div>
                            </div>

                            <div class="kkpm-desc">${movie.content || 'Chưa có mô tả'}</div>
                        </div>
                    </div>
                </div>
            `);

            root.append(top);

            top.find('.kkpm-btn--play').on('hover:enter click', function () {
                if (!eps.length) return Lampa.Noty.show('Chưa có tập phim');
                playEpisode(movie, eps[0], eps);
            });

            top.find('.kkpm-btn').eq(1).on('hover:enter click', function () {
                showEpSelect(movie);
            });

            if (eps.length) {
                var epWrap = $('<div class="kkpm-episodes"><div class="kkpm-episodes__title">Danh sách tập</div><div class="kkpm-episodes__list"></div></div>');
                var list = epWrap.find('.kkpm-episodes__list');

                eps.forEach(function (ep) {
                    var btn = $('<div class="kkpm-ep selector">Tập ' + ep.name + '</div>');
                    btn.on('hover:enter click', function () {
                        playEpisode(movie, ep, eps);
                    });
                    list.append(btn);
                });

                root.append(epWrap);
            }
        }

        this.start = function () {
            setTimeout(function () {
                var first = root.find('.selector').first();
                if (first.length) {
                    try {
                        Lampa.Controller.collectionSet(root);
                        Lampa.Controller.collectionFocus(first, root);
                    } catch (e) {}
                }
            }, 100);
        };

        this.render = function () {
            return root;
        };

        this.destroy = function () {
            root.remove();
        };
    }

    function injectCSS() {
        if ($('#kkpm-style').length) return;

        $('head').append(`
            <style id="kkpm-style">
                .kkpm-page{
                    padding:12px 0 24px 0;
                }

                .kkpm-row{
                    margin-bottom:22px;
                }

                .kkpm-row__head{
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:0 14px 10px 14px;
                    gap:10px;
                }

                .kkpm-row__title{
                    font-size:20px;
                    font-weight:700;
                }

                .kkpm-row__more{
                    padding:8px 12px;
                    border-radius:12px;
                    background:rgba(255,255,255,.12);
                    font-size:13px;
                    white-space:nowrap;
                }

                .kkpm-row__list{
                    display:flex;
                    gap:12px;
                    overflow-x:auto;
                    overflow-y:hidden;
                    padding:0 14px 6px 14px;
                    -webkit-overflow-scrolling:touch;
                }

                .kkpm-row__list::-webkit-scrollbar{
                    display:none;
                }

                .kkpm-card{
                    width:132px;
                    min-width:132px;
                    flex:0 0 132px;
                }

                .kkpm-card__img{
                    width:100%;
                    aspect-ratio:2/3;
                    border-radius:14px;
                    overflow:hidden;
                    background:#202020;
                    position:relative;
                }

                .kkpm-card__img img{
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    display:block;
                }

                .kkpm-card__badge{
                    position:absolute;
                    top:8px;
                    right:8px;
                    padding:4px 7px;
                    border-radius:8px;
                    background:#ff5b2e;
                    color:#fff;
                    font-size:11px;
                    font-weight:700;
                }

                .kkpm-card__title{
                    margin-top:8px;
                    font-size:14px;
                    font-weight:600;
                    line-height:1.35;
                    display:-webkit-box;
                    -webkit-line-clamp:2;
                    -webkit-box-orient:vertical;
                    overflow:hidden;
                }

                .kkpm-card__meta{
                    margin-top:3px;
                    font-size:12px;
                    opacity:.7;
                }

                .kkpm-grid{
                    display:grid;
                    grid-template-columns:repeat(3,minmax(0,1fr));
                    gap:12px;
                    padding:0 14px;
                }

                .kkpm-load,
                .kkpm-empty{
                    text-align:center;
                    padding:20px 14px;
                    opacity:.8;
                    font-size:14px;
                }

                .kkpm-hero{
                    position:relative;
                    overflow:hidden;
                    border-radius:0 0 22px 22px;
                    min-height:420px;
                    background:#101010;
                }

                .kkpm-hero__bg{
                    position:absolute;
                    inset:0;
                    background-size:cover;
                    background-position:center;
                    transform:scale(1.06);
                    filter:blur(10px);
                    opacity:.35;
                }

                .kkpm-hero__overlay{
                    position:absolute;
                    inset:0;
                    background:linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,.8) 55%,rgba(0,0,0,.96) 100%);
                }

                .kkpm-hero__inner{
                    position:relative;
                    z-index:2;
                    padding:18px 14px 22px 14px;
                    display:flex;
                    flex-direction:column;
                    gap:16px;
                }

                .kkpm-hero__poster{
                    width:150px;
                    max-width:42vw;
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:0 10px 30px rgba(0,0,0,.35);
                }

                .kkpm-hero__poster img{
                    width:100%;
                    display:block;
                }

                .kkpm-hero__title{
                    font-size:24px;
                    line-height:1.25;
                    font-weight:800;
                }

                .kkpm-hero__sub{
                    margin-top:4px;
                    font-size:14px;
                    opacity:.72;
                }

                .kkpm-tags{
                    margin-top:12px;
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                }

                .kkpm-tags span{
                    padding:7px 10px;
                    border-radius:999px;
                    background:rgba(255,255,255,.12);
                    font-size:12px;
                }

                .kkpm-actions{
                    display:flex;
                    gap:10px;
                    margin-top:14px;
                    flex-wrap:wrap;
                }

                .kkpm-btn{
                    padding:11px 14px;
                    border-radius:14px;
                    background:rgba(255,255,255,.12);
                    font-size:14px;
                    font-weight:700;
                    text-align:center;
                    min-width:120px;
                }

                .kkpm-btn--play{
                    background:#ff5b2e;
                    color:#fff;
                }

                .kkpm-info{
                    margin-top:14px;
                    font-size:14px;
                    line-height:1.7;
                }

                .kkpm-desc{
                    margin-top:14px;
                    font-size:14px;
                    line-height:1.7;
                    opacity:.94;
                }

                .kkpm-episodes{
                    padding:18px 14px 24px 14px;
                }

                .kkpm-episodes__title{
                    font-size:18px;
                    font-weight:800;
                    margin-bottom:12px;
                }

                .kkpm-episodes__list{
                    display:flex;
                    flex-wrap:wrap;
                    gap:10px;
                }

                .kkpm-ep{
                    padding:10px 14px;
                    border-radius:12px;
                    background:rgba(255,255,255,.1);
                    font-size:14px;
                    min-width:76px;
                    text-align:center;
                }

                @media (min-width: 768px){
                    .kkpm-grid{
                        grid-template-columns:repeat(5,minmax(0,1fr));
                    }

                    .kkpm-hero{
                        border-radius:0 0 28px 28px;
                    }

                    .kkpm-hero__inner{
                        padding:24px;
                        display:grid;
                        grid-template-columns:220px 1fr;
                        gap:22px;
                        align-items:start;
                    }

                    .kkpm-hero__poster{
                        width:220px;
                        max-width:none;
                    }

                    .kkpm-hero__title{
                        font-size:34px;
                    }

                    .kkpm-desc,.kkpm-info{
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
            if (menu.find('[data-action="kkpm"]').length) return;

            var item = $(`
                <li class="menu__item selector" data-action="kkpm">
                    <div class="menu__ico">🎬</div>
                    <div class="menu__text">KKPhim</div>
                </li>
            `);

            item.on('hover:enter click', function () {
                Lampa.Activity.push({
                    component: 'kkpm_main',
                    title: 'KKPhim'
                });
            });

            menu.append(item);
        }

        run();
    }

    Lampa.Component.add('kkpm_main', MainPage);
    Lampa.Component.add('kkpm_category', CategoryPage);
    Lampa.Component.add('kkpm_detail', DetailPage);

    function start() {
        injectCSS();
        addMenu();
        console.log('KKPhim mobile plugin ready');
    }

    if (Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    } else {
        start();
    }
})();