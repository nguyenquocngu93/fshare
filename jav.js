(function () {
    'use strict';

    if (window.kkkphim_plugin_ready) return;
    window.kkkphim_plugin_ready = true;

    var API_BASE = 'https://phimapi.com';

    var categories = [
        { title: 'Phim Mới Cập Nhật', url: 'phim-moi-cap-nhat' },
        { title: 'Phim Lẻ', url: 'phim-le' },
        { title: 'Phim Bộ', url: 'phim-bo' },
        { title: 'Hoạt Hình', url: 'hoat-hinh' },
        { title: 'TV Shows', url: 'tv-shows' }
    ];

    var quickFilters = [
        { title: 'Tất cả', url: 'phim-moi-cap-nhat' },
        { title: 'Phim lẻ', url: 'phim-le' },
        { title: 'Phim bộ', url: 'phim-bo' },
        { title: 'Hoạt hình', url: 'hoat-hinh' },
        { title: 'TV Shows', url: 'tv-shows' }
    ];

    var Img = {
        fix: function (url) {
            if (!url) return '';
            if (url.indexOf('http') === 0) return url;
            return 'https://phimimg.com/' + url.replace(/^\/+/, '');
        }
    };

    function getCategoryUrl(type, page) {
        return API_BASE + '/v1/api/danh-sach/' + type + '?page=' + page + '&limit=36';
    }

    function getSearchUrl(keyword, page) {
        return API_BASE + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + page + '&limit=36';
    }

    function getDetailUrl(slug) {
        return API_BASE + '/phim/' + slug;
    }

    function parseItems(data) {
        if (data && data.items) return data.items;
        if (data && data.data && data.data.items) return data.data.items;
        if (Array.isArray(data)) return data;
        return [];
    }

    function parseTotalPages(data) {
        if (data && data.pagination && data.pagination.totalPages) return data.pagination.totalPages;
        if (data && data.data && data.data.params && data.data.params.pagination) {
            return data.data.params.pagination.totalPages || 1;
        }
        return 1;
    }

    function mapNames(arr) {
        if (!arr || !arr.length) return '';
        return arr.map(function (c) {
            return c.name;
        }).join(', ');
    }

    function stripHtml(str) {
        return (str || '').replace(/<[^>]*>/g, '').trim();
    }

    function addCSS() {
        if (document.getElementById('kkk-css-v2')) return;

        var s = document.createElement('style');
        s.id = 'kkk-css-v2';
        s.textContent = [
            'body { background: #141414; }',
            '.kkk-root, .kkk-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }',

            '.kkk-hero { padding: 1.2em 2em 0.5em; }',
            '.kkk-hero__title { color: #fff; font-size: 2em; font-weight: 800; margin-bottom: 0.2em; }',
            '.kkk-hero__desc { color: rgba(255,255,255,0.68); font-size: 0.98em; }',

            '.kkk-filterbar { display: flex; gap: 0.6em; padding: 1em 2em 1.4em; overflow-x: auto; }',
            '.kkk-filterbar::-webkit-scrollbar { height: 0; }',
            '.kkk-filter { padding: 0.65em 1em; border-radius: 999px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.12); cursor: pointer; white-space: nowrap; transition: 0.2s; }',
            '.kkk-filter.focus, .kkk-filter:hover, .kkk-filter--active { background: #fff; color: #000; border-color: #fff; }',

            '.kkk-card { width: 180px; flex-shrink: 0; cursor: pointer; }',
            '.kkk-card .card__img-wrap { border-radius: 12px; overflow: hidden; position: relative; isolation: isolate; -webkit-mask-image: -webkit-radial-gradient(white, black); background: linear-gradient(180deg, #2a2a2a, #1d1d1d); }',
            '.kkk-card .card__img { aspect-ratio: 2/3; background-size: cover; background-position: center; position: relative; transform: scale(1); transition: transform 0.25s ease; }',
            '.kkk-card .card__img::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.1) 50%, transparent); opacity: 0; transition: opacity 0.25s ease; }',
            '.kkk-card.focus .card__img { transform: scale(1.04); }',
            '.kkk-card.focus .card__img::after { opacity: 1; }',
            '.kkk-card .card__info { margin-top: 0.75em; min-height: 60px; }',
            '.kkk-card .card__title { font-size: 1em; font-weight: 700; color: #fff; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; word-break: break-word; }',
            '.kkk-card .card__meta { font-size: 0.83em; color: #aaa; margin-top: 0.35em; display: flex; gap: 0.45em; align-items: center; flex-wrap: wrap; }',
            '.kkk-card .card__badge { background: #ffcc00; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 0.72em; }',

            '.kkk-line { margin-bottom: 2.1em; }',
            '.kkk-line__head { display: flex; justify-content: space-between; align-items: center; padding: 0 2em 0.9em; gap: 1em; }',
            '.kkk-line__title { font-size: 1.35em; font-weight: 800; color: #fff; }',
            '.kkk-line__more { font-size: 0.92em; color: #fff; background: rgba(255,255,255,0.08); padding: 0.45em 1em; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); cursor: pointer; transition: 0.2s; }',
            '.kkk-line__more:hover, .kkk-line__more.focus { background: #fff; color: #000; }',
            '.kkk-line__body { display: flex; gap: 1.1em; overflow-x: auto; padding: 0.2em 2em 1em; scroll-behavior: smooth; }',
            '.kkk-line__body::-webkit-scrollbar { height: 0; }',

            '.kkk-catalog-head { padding: 1.3em 2em 0.5em; display: flex; justify-content: space-between; align-items: center; gap: 1em; flex-wrap: wrap; }',
            '.kkk-catalog-title { color: #fff; font-size: 1.6em; font-weight: 800; }',
            '.kkk-catalog-sub { color: rgba(255,255,255,0.6); font-size: 0.92em; }',
            '.kkk-catalog-grid { display: flex; flex-wrap: wrap; gap: 1.35em; padding: 1.5em 2em 2em; align-items: flex-start; }',
            '.kkk-catalog-grid .kkk-card { width: calc(20% - 1.08em); }',
            '.kkk-loadmore-wrap { padding: 0 2em 2em; display: flex; justify-content: center; }',
            '.kkk-loadmore { min-width: 220px; padding: 0.9em 1.3em; border-radius: 10px; color: #fff; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); text-align: center; cursor: pointer; }',
            '.kkk-loadmore:hover, .kkk-loadmore.focus { background: #fff; color: #000; }',

            '.kkk-detail { position: relative; background: #141414; min-height: 100vh; }',
            '.kkk-detail__backdrop { position: absolute; inset: 0 0 auto 0; height: 76vh; z-index: 0; overflow: hidden; }',
            '.kkk-detail__backdrop img { width: 100%; height: 100%; object-fit: cover; display: block; }',
            '.kkk-detail__overlay { position: absolute; inset: 0 0 auto 0; height: 76vh; background: linear-gradient(180deg, rgba(20,20,20,0.02) 0%, rgba(20,20,20,0.5) 52%, #141414 100%); z-index: 1; }',
            '.kkk-detail__content { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 22vh 2em 2em; display: flex; gap: 2em; align-items: flex-start; }',
            '.kkk-detail__poster { width: 250px; border-radius: 14px; overflow: hidden; flex-shrink: 0; background: #222; box-shadow: 0 14px 34px rgba(0,0,0,0.42); }',
            '.kkk-detail__poster img { display: block; width: 100%; aspect-ratio: 2/3; object-fit: cover; }',
            '.kkk-detail__info { flex: 1; min-width: 0; color: #fff; padding-top: 0.8em; }',
            '.kkk-detail__title { font-size: 2.55em; line-height: 1.08; font-weight: 900; margin-bottom: 0.2em; }',
            '.kkk-detail__origin { color: rgba(255,255,255,0.62); font-size: 1.08em; margin-bottom: 1em; }',
            '.kkk-detail__tags { display: flex; flex-wrap: wrap; gap: 0.55em; margin-bottom: 1.1em; }',
            '.kkk-detail__tag { background: rgba(255,255,255,0.13); color: #fff; padding: 0.38em 0.82em; border-radius: 8px; font-size: 0.9em; }',
            '.kkk-detail__tag--hd { background: #ffcc00; color: #000; font-weight: 800; }',
            '.kkk-detail__meta { display: grid; gap: 0.45em; margin-bottom: 1em; }',
            '.kkk-detail__meta-row { color: rgba(255,255,255,0.84); line-height: 1.5; }',
            '.kkk-detail__meta-label { color: rgba(255,255,255,0.45); margin-right: 0.45em; }',
            '.kkk-detail__desc { color: rgba(255,255,255,0.92); line-height: 1.68; font-size: 1em; max-height: 7.3em; overflow: hidden; }',
            '.kkk-detail__desc--full { max-height: none !important; overflow: visible !important; }',
            '.kkk-detail__buttons { display: flex; gap: 0.9em; flex-wrap: wrap; margin-top: 1.4em; }',
            '.kkk-btn { padding: 0.85em 1.5em; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.2s; }',
            '.kkk-btn--primary { background: #fff; color: #000; }',
            '.kkk-btn--primary:hover, .kkk-btn--primary.focus { background: #ddd; }',
            '.kkk-btn--secondary { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.08); }',
            '.kkk-btn--secondary:hover, .kkk-btn--secondary.focus { background: rgba(255,255,255,0.24); }',

            '.kkk-episodes { position: relative; z-index: 2; padding: 0 2em 2em; }',
            '.kkk-episodes__box { background: #191919; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 1.2em; }',
            '.kkk-episodes__title { color: #fff; font-size: 1.35em; font-weight: 800; margin-bottom: 0.9em; }',
            '.kkk-episodes__server { color: #aaa; margin: 0.9em 0 0.5em; font-weight: 700; }',
            '.kkk-episodes__grid { display: flex; flex-wrap: wrap; gap: 0.55em; }',
            '.kkk-episodes__ep { background: #2e2e2e; color: #fff; padding: 0.78em 1.05em; border-radius: 8px; min-width: 60px; text-align: center; cursor: pointer; transition: 0.2s; }',
            '.kkk-episodes__ep:hover, .kkk-episodes__ep.focus { background: #fff; color: #000; }',
            '.kkk-episodes__ep--active { background: #ffcc00 !important; color: #000 !important; font-weight: 800; }',

            '.kkk-empty { color: #fff; padding: 2em; text-align: center; }',

            '@media (max-width: 1100px) { .kkk-catalog-grid .kkk-card { width: calc(25% - 1.05em); } }',
            '@media (max-width: 900px) { .kkk-catalog-grid .kkk-card { width: calc(33.333% - 0.95em); } }',
            '@media (max-width: 768px) {\
                .kkk-hero { padding: 1em 1em 0.35em; }\
                .kkk-hero__title { font-size: 1.6em; }\
                .kkk-hero__desc { font-size: 0.92em; }\
                .kkk-filterbar { padding: 0.9em 1em 1em; gap: 0.5em; }\
                .kkk-filter { padding: 0.58em 0.9em; font-size: 0.92em; }\
                .kkk-line__head { padding: 0 1em 0.8em; }\
                .kkk-line__body { padding: 0.2em 1em 1em; gap: 0.9em; }\
                .kkk-card { width: 148px; }\
                .kkk-catalog-head { padding: 1em 1em 0.3em; }\
                .kkk-catalog-grid { padding: 1em; gap: 1em; }\
                .kkk-catalog-grid .kkk-card { width: calc(50% - 0.5em); }\
                .kkk-loadmore-wrap { padding: 0 1em 1.5em; }\
                .kkk-detail__backdrop, .kkk-detail__overlay { height: 42vh; }\
                .kkk-detail__content { padding: 18vh 1em 1em; display: block; }\
                .kkk-detail__poster { width: 150px; margin: 0 auto 1em; }\
                .kkk-detail__info { padding-top: 0; }\
                .kkk-detail__title { font-size: 1.7em; line-height: 1.16; }\
                .kkk-detail__origin { font-size: 0.95em; margin-bottom: 0.8em; }\
                .kkk-detail__tag { font-size: 0.82em; padding: 0.3em 0.65em; }\
                .kkk-detail__desc { font-size: 0.95em; max-height: 8.4em; }\
                .kkk-detail__buttons { gap: 0.65em; }\
                .kkk-btn { flex: 1; min-width: 0; text-align: center; }\
                .kkk-episodes { padding: 0 1em 1.2em; }\
                .kkk-episodes__box { padding: 1em; }\
            }'
        ].join('\n');

        document.head.appendChild(s);
    }

    function applyLazyImage(el, url) {
        var node = el && el[0] ? el[0] : el;
        if (!node) return;

        node.style.backgroundImage = '';
        node.setAttribute('data-loaded', '0');

        var img = new Image();
        img.onload = function () {
            node.style.backgroundImage = 'url("' + url + '")';
            node.setAttribute('data-loaded', '1');
        };
        img.onerror = function () {
            node.setAttribute('data-loaded', '0');
        };
        img.src = url;
    }

    function createCard(item, onEnter) {
        var imgUrl = Img.fix(item.poster_url || item.thumb_url || '');
        var title = item.name || item.origin_name || '';
        var quality = item.quality || '';
        var year = item.year || '';
        var vote = item.tmdb && item.tmdb.vote_average ? Number(item.tmdb.vote_average).toFixed(1) : '';

        var html = '<div class="kkk-card selector">' +
            '<div class="card__img-wrap">' +
                '<div class="card__img"></div>' +
            '</div>' +
            '<div class="card__info">' +
                '<div class="card__title">' + title + '</div>' +
                '<div class="card__meta">' +
                    (quality ? '<span class="card__badge">' + quality + '</span>' : '') +
                    (year ? '<span>' + year + '</span>' : '') +
                    (vote ? '<span>★ ' + vote + '</span>' : '') +
                '</div>' +
            '</div>' +
        '</div>';

        var el = $(html);
        applyLazyImage(el.find('.card__img'), imgUrl);

        el.on('hover:enter', function () {
            if (onEnter) onEnter(item);
        });

        return el;
    }

    function KKKMainComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var created = false;
        var loaded = 0;
        var lineMap = {};

        this.createHeader = function () {
            var root = $('<div class="kkk-root"></div>');
            var hero = $('<div class="kkk-hero">' +
                '<div class="kkk-hero__title">KKKPhim</div>' +
                '<div class="kkk-hero__desc">Kho phim online tối ưu cho TV và điện thoại</div>' +
            '</div>');

            var filterbar = $('<div class="kkk-filterbar"></div>');

            quickFilters.forEach(function (f, i) {
                var btn = $('<div class="kkk-filter selector ' + (i === 0 ? 'kkk-filter--active' : '') + '">' + f.title + '</div>');
                btn.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: f.url,
                        title: f.title,
                        component: 'kkkphim_catalog',
                        page: 1
                    });
                });
                filterbar.append(btn);
            });

            root.append(hero).append(filterbar);
            scroll.append(root);
        };

        this.create = function () {
            var _this = this;

            loaded = 0;
            lineMap = {};
            scroll.render().empty();

            this.activity.loader(true);
            scroll.minus();

            this.createHeader();

            categories.forEach(function (cat) {
                _this.loadCategory(cat);
            });
        };

        this.loadCategory = function (cat) {
            var _this = this;

            network.silent(getCategoryUrl(cat.url, 1), function (data) {
                var items = parseItems(data);
                if (items.length) _this.buildLine(cat, items);

                loaded++;
                if (loaded >= categories.length) {
                    _this.activity.loader(false);
                    _this.activity.toggle();
                }
            }, function () {
                loaded++;
                if (loaded >= categories.length) {
                    _this.activity.loader(false);
                    _this.activity.toggle();
                }
            });
        };

        this.buildLine = function (cat, items) {
            if (lineMap[cat.url]) return;
            lineMap[cat.url] = true;

            var localMap = {};
            var line = $('<div class="kkk-line"></div>');
            var head = $('<div class="kkk-line__head">' +
                '<div class="kkk-line__title">' + cat.title + '</div>' +
                '<div class="kkk-line__more selector">Xem thêm</div>' +
            '</div>');
            var body = $('<div class="kkk-line__body"></div>');

            head.find('.kkk-line__more').on('hover:enter', function () {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkkphim_catalog',
                    page: 1
                });
            });

            items.slice(0, 18).forEach(function (item) {
                var key = item.slug || item._id || item.name;
                if (localMap[key]) return;
                localMap[key] = true;

                var card = createCard(item, function (it) {
                    Lampa.Activity.push({
                        url: it.slug,
                        title: it.name,
                        component: 'kkkphim_detail',
                        page: 1
                    });
                });

                body.append(card);
            });

            line.append(head).append(body);
            scroll.append(line);
        };

        this.start = function () {
            if (created) return;
            created = true;

            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });

            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.resume = function () { this.activity.toggle(); };
        this.render = function () { return scroll.render(true); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            lineMap = {};
        };
    }

    function KKKCatalogComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body;
        var page = 0;
        var totalPages = 999;
        var loading = false;
        var categorySlug = object.url || 'phim-moi-cap-nhat';
        var items = [];
        var created = false;
        var itemKeys = {};
        var loadMoreBtn = null;

        this.renderHead = function () {
            var title = object.title || 'Danh sách';
            var head = $('<div class="kkk-root">' +
                '<div class="kkk-catalog-head">' +
                    '<div>' +
                        '<div class="kkk-catalog-title">' + title + '</div>' +
                        '<div class="kkk-catalog-sub">Cuộn xuống hoặc chọn tải thêm để lấy thêm phim</div>' +
                    '</div>' +
                '</div>' +
            '</div>');

            scroll.append(head);
        };

        this.renderLoadMore = function () {
            if (loadMoreBtn) loadMoreBtn.remove();

            loadMoreBtn = $('<div class="kkk-loadmore-wrap"><div class="kkk-loadmore selector">Tải thêm</div></div>');
            loadMoreBtn.find('.kkk-loadmore').on('hover:enter', this.loadPage.bind(this));
            scroll.append(loadMoreBtn);
            items.push(loadMoreBtn.find('.kkk-loadmore')[0]);
        };

        this.create = function () {
            page = 0;
            totalPages = 999;
            loading = false;
            items = [];
            itemKeys = {};
            loadMoreBtn = null;

            scroll.minus();
            scroll.render().empty();

            this.renderHead();

            body = $('<div class="kkk-catalog-grid kkk-root"></div>');
            scroll.append(body);
            this.renderLoadMore();
            this.loadPage();
        };

        this.loadPage = function () {
            var _this = this;
            if (loading || page >= totalPages) return;

            loading = true;
            page++;

            network.silent(getCategoryUrl(categorySlug, page), function (data) {
                loading = false;
                totalPages = parseTotalPages(data);

                var list = parseItems(data);
                if (list.length) {
                    list.forEach(function (item) {
                        var key = item.slug || item._id || item.name;
                        if (itemKeys[key]) return;
                        itemKeys[key] = true;

                        var card = createCard(item, function (it) {
                            Lampa.Activity.push({
                                url: it.slug,
                                title: it.name,
                                component: 'kkkphim_detail',
                                page: 1
                            });
                        });

                        body.append(card);
                        items.unshift(card[0]);
                    });
                    _this.activity.toggle();
                }

                if (page >= totalPages && loadMoreBtn) {
                    loadMoreBtn.find('.kkk-loadmore').text('Đã tải hết');
                }
            }, function () {
                loading = false;
            });
        };

        this.start = function () {
            var _this = this;
            if (created) return;
            created = true;

            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render());
                },
                down: function () {
                    var scrollObj = scroll.render();
                    var scrollTop = scrollObj.scrollTop();
                    var scrollHeight = scrollObj.prop('scrollHeight');
                    var clientHeight = scrollObj.height();

                    if (scrollTop + clientHeight >= scrollHeight - 600) {
                        _this.loadPage();
                    }
                    Navigator.move('down');
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                back: function () { Lampa.Activity.backward(); }
            });

            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.resume = function () { this.activity.toggle(); };
        this.render = function () { return scroll.render(true); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items = [];
            itemKeys = {};
        };
    }

    function KKKDetailComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var slug = object.url || '';
        var created = false;
        var items = [];
        var _this = this;

        this.create = function () {
            items = [];
            scroll.render().empty();

            this.activity.loader(true);
            scroll.minus();

            network.silent(getDetailUrl(slug), function (data) {
                _this.activity.loader(false);

                if (data && data.movie) {
                    _this.build(data.movie, data.episodes || []);
                } else {
                    _this.showEmpty();
                }

                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                _this.showEmpty();
                _this.activity.toggle();
            });
        };

        this.build = function (movie, episodes) {
            var backdrop = Img.fix(movie.backdrop_url || movie.thumb_url || '');
            var poster = Img.fix(movie.poster_url || movie.thumb_url || '');
            var desc = stripHtml(movie.content || '');

            var html = '<div class="kkk-detail kkk-root">' +
                '<div class="kkk-detail__backdrop"><img src="' + backdrop + '" onerror="this.style.display=\'none\'"></div>' +
                '<div class="kkk-detail__overlay"></div>' +
                '<div class="kkk-detail__content">' +
                    '<div class="kkk-detail__poster"><img src="' + poster + '" onerror="this.style.display=\'none\'"></div>' +
                    '<div class="kkk-detail__info">' +
                        '<div class="kkk-detail__title">' + (movie.name || '') + '</div>' +
                        '<div class="kkk-detail__origin">' + (movie.origin_name || '') + '</div>' +
                        '<div class="kkk-detail__tags">' +
                            (movie.quality ? '<span class="kkk-detail__tag kkk-detail__tag--hd">' + movie.quality + '</span>' : '') +
                            (movie.year ? '<span class="kkk-detail__tag">' + movie.year + '</span>' : '') +
                            (movie.time ? '<span class="kkk-detail__tag">' + movie.time + '</span>' : '') +
                            '<span class="kkk-detail__tag">' + (movie.type === 'series' ? 'Phim bộ' : 'Phim lẻ') + '</span>' +
                        '</div>' +
                        '<div class="kkk-detail__meta">' +
                            '<div class="kkk-detail__meta-row"><span class="kkk-detail__meta-label">Thể loại:</span>' + mapNames(movie.category) + '</div>' +
                            '<div class="kkk-detail__meta-row"><span class="kkk-detail__meta-label">Quốc gia:</span>' + mapNames(movie.country) + '</div>' +
                            (movie.episode_current ? '<div class="kkk-detail__meta-row"><span class="kkk-detail__meta-label">Tiến độ:</span>' + movie.episode_current + '</div>' : '') +
                            (movie.lang ? '<div class="kkk-detail__meta-row"><span class="kkk-detail__meta-label">Ngôn ngữ:</span>' + movie.lang + '</div>' : '') +
                        '</div>' +
                        '<div class="kkk-detail__desc kkk-desc">' + desc + '</div>' +
                        '<div class="kkk-detail__buttons">' +
                            '<div class="kkk-btn kkk-btn--primary selector kkk-play">▶ Xem ngay</div>' +
                            '<div class="kkk-btn kkk-btn--secondary selector kkk-desc-btn">Mô tả đầy đủ</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

            var container = $(html);
            scroll.append(container);

            var playBtn = container.find('.kkk-play');
            var descBtn = container.find('.kkk-desc-btn');

            if (playBtn.length) items.push(playBtn[0]);
            if (descBtn.length) items.push(descBtn[0]);

            playBtn.on('hover:enter', function () {
                var firstServer = episodes.length ? episodes[0] : null;
                if (firstServer && firstServer.server_data && firstServer.server_data.length) {
                    _this.playEp(firstServer.server_data[0], movie, firstServer.server_data);
                } else {
                    Lampa.Noty.show('Chưa có link phát');
                }
            });

            descBtn.on('hover:enter', function () {
                var descEl = container.find('.kkk-desc');
                var isFull = descEl.hasClass('kkk-detail__desc--full');

                if (isFull) {
                    descEl.removeClass('kkk-detail__desc--full');
                    this.textContent = 'Mô tả đầy đủ';
                } else {
                    descEl.addClass('kkk-detail__desc--full');
                    this.textContent = 'Thu gọn';
                }
            });

            if (episodes.length) {
                var epWrap = $('<div class="kkk-episodes kkk-root"><div class="kkk-episodes__box"><div class="kkk-episodes__title">Danh sách tập</div></div></div>');
                var epBox = epWrap.find('.kkk-episodes__box');

                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;

                    if (episodes.length > 1) {
                        epBox.append('<div class="kkk-episodes__server">' + (server.server_name || 'Server') + '</div>');
                    }

                    var grid = $('<div class="kkk-episodes__grid"></div>');

                    server.server_data.forEach(function (ep, i) {
                        var epBtn = $('<div class="kkk-episodes__ep selector">' + (ep.name || ('Tập ' + (i + 1))) + '</div>');

                        epBtn.on('hover:enter', function () {
                            epWrap.find('.kkk-episodes__ep--active').removeClass('kkk-episodes__ep--active');
                            epBtn.addClass('kkk-episodes__ep--active');
                            _this.playEp(ep, movie, server.server_data);
                        });

                        grid.append(epBtn);
                        items.push(epBtn[0]);
                    });

                    epBox.append(grid);
                });

                scroll.append(epWrap);
            }
        };

        this.playEp = function (ep, movie, allEps) {
            var url = ep.link_m3u8 || ep.link_embed || '';

            if (!url) {
                Lampa.Noty.show('Không tìm thấy link');
                return;
            }

            var makeHash = function (e, i) {
                return Lampa.Utils.hash((movie.slug || movie.name || 'movie') + '_' + (e.slug || e.name || i));
            };

            if (url.indexOf('.m3u8') !== -1) {
                var playlist = allEps.map(function (e, i) {
                    var playUrl = e.link_m3u8 || e.link_embed;
                    if (!playUrl) return null;

                    return {
                        title: (movie.name || '') + ' - ' + (e.name || ('Tập ' + (i + 1))),
                        url: playUrl,
                        quality: {},
                        timeline: Lampa.Timeline.view(makeHash(e, i))
                    };
                }).filter(function (p) {
                    return !!p;
                });

                var currentIdx = 0;
                for (var i = 0; i < playlist.length; i++) {
                    if (playlist[i].url === url) {
                        currentIdx = i;
                        break;
                    }
                }

                Lampa.Player.play(playlist[currentIdx]);
                Lampa.Player.playlist(playlist);
            } else {
                Lampa.Player.play({
                    title: (movie.name || '') + ' - ' + (ep.name || ''),
                    url: url,
                    quality: {},
                    timeline: Lampa.Timeline.view(makeHash(ep, 0))
                });
            }
        };

        this.showEmpty = function () {
            scroll.append('<div class="kkk-empty">Không tìm thấy phim</div>');
        };

        this.start = function () {
            if (created) return;
            created = true;

            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });

            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.resume = function () { this.activity.toggle(); };
        this.render = function () { return scroll.render(true); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items = [];
        };
    }

    function KKKSearchComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body;
        var page = 0;
        var totalPages = 999;
        var loading = false;
        var query = object.search || object.url || '';
        var items = [];
        var created = false;
        var itemKeys = {};
        var loadMoreBtn = null;

        this.renderHead = function () {
            var head = $('<div class="kkk-root">' +
                '<div class="kkk-catalog-head">' +
                    '<div>' +
                        '<div class="kkk-catalog-title">Tìm kiếm: ' + query + '</div>' +
                        '<div class="kkk-catalog-sub">Kết quả từ KKKPhim</div>' +
                    '</div>' +
                '</div>' +
            '</div>');
            scroll.append(head);
        };

        this.renderLoadMore = function () {
            if (loadMoreBtn) loadMoreBtn.remove();

            loadMoreBtn = $('<div class="kkk-loadmore-wrap"><div class="kkk-loadmore selector">Tải thêm</div></div>');
            loadMoreBtn.find('.kkk-loadmore').on('hover:enter', this.loadPage.bind(this));
            scroll.append(loadMoreBtn);
            items.push(loadMoreBtn.find('.kkk-loadmore')[0]);
        };

        this.create = function () {
            page = 0;
            totalPages = 999;
            loading = false;
            items = [];
            itemKeys = {};
            loadMoreBtn = null;

            scroll.minus();
            scroll.render().empty();

            this.renderHead();

            body = $('<div class="kkk-catalog-grid kkk-root"></div>');
            scroll.append(body);
            this.renderLoadMore();
            this.loadPage();
        };

        this.loadPage = function () {
            var _this = this;
            if (loading || page >= totalPages || !query) return;

            loading = true;
            page++;

            network.silent(getSearchUrl(query, page), function (data) {
                loading = false;
                totalPages = parseTotalPages(data);

                var list = parseItems(data);
                if (list.length) {
                    list.forEach(function (item) {
                        var key = item.slug || item._id || item.name;
                        if (itemKeys[key]) return;
                        itemKeys[key] = true;

                        var card = createCard(item, function (it) {
                            Lampa.Activity.push({
                                url: it.slug,
                                title: it.name,
                                component: 'kkkphim_detail',
                                page: 1
                            });
                        });

                        body.append(card);
                        items.unshift(card[0]);
                    });

                    _this.activity.toggle();
                }

                if (page >= totalPages && loadMoreBtn) {
                    loadMoreBtn.find('.kkk-loadmore').text('Đã tải hết');
                }
            }, function () {
                loading = false;
            });
        };

        this.start = function () {
            var _this = this;
            if (created) return;
            created = true;

            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render());
                },
                down: function () {
                    var scrollObj = scroll.render();
                    if (scrollObj.scrollTop() + scrollObj.height() >= scrollObj.prop('scrollHeight') - 600) {
                        _this.loadPage();
                    }
                    Navigator.move('down');
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                back: function () { Lampa.Activity.backward(); }
            });

            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.resume = function () { this.activity.toggle(); };
        this.render = function () { return scroll.render(true); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items = [];
            itemKeys = {};
        };
    }

    function initPlugin() {
        addCSS();

        Lampa.Component.add('kkkphim_main', KKKMainComponent);
        Lampa.Component.add('kkkphim_catalog', KKKCatalogComponent);
        Lampa.Component.add('kkkphim_detail', KKKDetailComponent);
        Lampa.Component.add('kkkphim_search', KKKSearchComponent);

        var ico = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="3"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>';

        if (!$('.menu__item[data-action="kkkphim"]').length) {
            var menu = $('<li class="menu__item selector" data-action="kkkphim"><div class="menu__ico">' + ico + '</div><div class="menu__text">KKKPhim</div></li>');

            menu.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKKPhim',
                    component: 'kkkphim_main',
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(menu);
        }

        Lampa.Listener.follow('search', function (e) {
            if (e.type === 'start' && e.query && e.body) {
                if (e.body.find('[data-kkk-search="true"]').length) return;

                var card = $('<div class="selector search-source" data-kkk-search="true"><div class="search-source__title">KKKPhim</div><div class="search-source__descr">Tìm "' + e.query + '"</div></div>');

                card.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: e.query,
                        title: 'KKKPhim: ' + e.query,
                        component: 'kkkphim_search',
                        search: e.query,
                        page: 1
                    });
                });

                e.body.append(card);
            }
        });
    }

    if (window.appready) initPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initPlugin();
        });
    }
})();