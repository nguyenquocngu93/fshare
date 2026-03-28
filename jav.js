(function () {
    'use strict';

    var API_BASE = 'https://phimapi.com';

    var categories = [
        { title: 'Phim Mới Cập Nhật', url: 'phim-moi-cap-nhat' },
        { title: 'Phim Lẻ', url: 'phim-le' },
        { title: 'Phim Bộ', url: 'phim-bo' },
        { title: 'Hoạt Hình', url: 'hoat-hinh' },
        { title: 'TV Shows', url: 'tv-shows' }
    ];

    var Img = {
        fix: function (url) {
            if (!url) return '';
            if (url.indexOf('http') === 0) return url;
            return 'https://phimimg.com/' + url;
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

    function addCSS() {
        if (document.getElementById('kkk-css')) return;

        var s = document.createElement('style');
        s.id = 'kkk-css';
        s.textContent = [
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',

            '.kkk-card { width: 180px; flex-shrink: 0; cursor: pointer; }',
            '.kkk-card .card__img { aspect-ratio: 2/3; background-size: cover; background-position: center; border-radius: 8px; overflow: hidden; position: relative; }',
            '.kkk-card .card__img::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); opacity: 0; transition: 0.3s; }',
            '.kkk-card.focus .card__img::after { opacity: 1; }',
            '.kkk-card .card__info { margin-top: 0.8em; }',
            '.kkk-card .card__title { font-size: 1em; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }',
            '.kkk-card .card__meta { font-size: 0.85em; color: #aaa; margin-top: 0.3em; display: flex; gap: 0.5em; align-items: center; }',
            '.kkk-card .card__badge { background: #ffcc00; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.7em; }',

            '.kkk-line { margin-bottom: 2.5em; }',
            '.kkk-line__head { display: flex; justify-content: space-between; align-items: center; padding: 0 2em 0.8em; }',
            '.kkk-line__title { font-size: 1.4em; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }',
            '.kkk-line__more { font-size: 0.9em; color: #fff; background: rgba(255,255,255,0.1); padding: 0.4em 1em; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; transition: 0.2s; }',
            '.kkk-line__more:hover, .kkk-line__more.focus { background: #fff; color: #000; border-color: #fff; }',
            '.kkk-line__body { display: flex; gap: 1.2em; overflow-x: auto; padding: 0.5em 2em 1em; scroll-behavior: smooth; }',
            '.kkk-line__body::-webkit-scrollbar { height: 0; }',

            '.kkk-detail { position: relative; background: #141414; min-height: 100vh; }',
            '.kkk-detail__backdrop { position: absolute; top: 0; left: 0; width: 100%; height: 80vh; z-index: 0; }',
            '.kkk-detail__backdrop img { width: 100%; height: 100%; object-fit: cover; }',
            '.kkk-detail__overlay { position: absolute; top: 0; left: 0; width: 100%; height: 80vh; background: linear-gradient(180deg, rgba(20,20,20,0) 0%, rgba(20,20,20,0.6) 50%, #141414 100%); z-index: 1; }',
            '.kkk-detail__content { position: relative; z-index: 2; padding: 25vh 2em 2em; display: flex; gap: 2em; max-width: 1200px; margin: 0 auto; }',
            '.kkk-detail__poster { width: 240px; flex-shrink: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }',
            '.kkk-detail__poster img { width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; }',
            '.kkk-detail__info { flex: 1; color: #fff; padding-top: 1em; }',
            '.kkk-detail__title { font-size: 2.5em; font-weight: 800; margin-bottom: 0.2em; line-height: 1.1; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }',
            '.kkk-detail__origin { font-size: 1.1em; color: rgba(255,255,255,0.6); margin-bottom: 1em; }',
            '.kkk-detail__tags { display: flex; flex-wrap: wrap; gap: 0.6em; margin-bottom: 1.2em; }',
            '.kkk-detail__tag { background: rgba(255,255,255,0.15); padding: 0.3em 0.8em; border-radius: 4px; font-size: 0.9em; font-weight: 500; backdrop-filter: blur(5px); }',
            '.kkk-detail__tag--hd { background: #ffcc00; color: #000; font-weight: 700; }',
            '.kkk-detail__meta-row { margin-bottom: 0.5em; font-size: 0.95em; color: rgba(255,255,255,0.8); line-height: 1.5; }',
            '.kkk-detail__meta-label { color: rgba(255,255,255,0.4); margin-right: 0.5em; }',
            '.kkk-detail__desc { font-size: 1em; line-height: 1.6; color: rgba(255,255,255,0.9); margin-top: 1em; max-width: 800px; max-height: 7.2em; overflow: hidden; }',
            '.kkk-detail__desc--full { max-height: none !important; overflow: visible !important; }',
            '.kkk-detail__buttons { margin-top: 1.5em; display: flex; gap: 1em; flex-wrap: wrap; }',
            '.kkk-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.8em 2em; border-radius: 6px; font-size: 1em; font-weight: 600; cursor: pointer; transition: 0.2s; }',
            '.kkk-btn--primary { background: #fff; color: #000; }',
            '.kkk-btn--primary:hover, .kkk-btn--primary.focus { background: #ddd; }',
            '.kkk-btn--secondary { background: rgba(255,255,255,0.2); color: #fff; backdrop-filter: blur(5px); }',
            '.kkk-btn--secondary:hover, .kkk-btn--secondary.focus { background: rgba(255,255,255,0.3); }',

            '.kkk-episodes { padding: 2em; background: #141414; position: relative; z-index: 2; }',
            '.kkk-episodes__title { font-size: 1.5em; font-weight: 700; color: #fff; margin-bottom: 1em; }',
            '.kkk-episodes__grid { display: flex; flex-wrap: wrap; gap: 0.5em; }',
            '.kkk-episodes__ep { background: #2f2f2f; color: #fff; padding: 0.8em 1.2em; border-radius: 4px; font-size: 0.95em; cursor: pointer; min-width: 60px; text-align: center; transition: 0.2s; }',
            '.kkk-episodes__ep:hover, .kkk-episodes__ep.focus { background: #fff; color: #000; transform: scale(1.05); }',
            '.kkk-episodes__ep--active { background: #ffcc00; color: #000; font-weight: 700; }',

            '.kkk-catalog-grid { display: flex; flex-wrap: wrap; gap: 1.5em; padding: 2em; }',
            '.kkk-catalog-grid .kkk-card { width: calc(20% - 1.2em); }',
            '@media (max-width: 1000px) { .kkk-catalog-grid .kkk-card { width: calc(33.333% - 1em); } }',
            '@media (max-width: 600px) { .kkk-catalog-grid .kkk-card { width: calc(50% - 0.75em); } }'
        ].join('\n');

        document.head.appendChild(s);
    }

    function createCard(item, onEnter) {
        var imgUrl = Img.fix(item.poster_url || item.thumb_url || '');
        var title = item.name || item.origin_name || '';
        var quality = item.quality || '';
        var year = item.year || '';
        var vote = item.tmdb && item.tmdb.vote_average ? Number(item.tmdb.vote_average).toFixed(1) : '';

        var html = '<div class="kkk-card selector">' +
            '<div class="card__img" style="background-image:url(\'' + imgUrl + '\')"></div>' +
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
        el.on('hover:enter', function () {
            if (onEnter) onEnter(item);
        });
        return el;
    }

    function KKKMainComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var created = false;
        var lines = [];
        var loaded = 0;

        this.create = function () {
            var _this = this;
            this.activity.loader(true);
            scroll.minus();

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

            items.slice(0, 15).forEach(function (item) {
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
            lines.push(line);
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
            lines = [];
        };
    }

    function KKKCatalogComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div class="kkk-catalog-grid"></div>');
        var page = 0;
        var totalPages = 999;
        var loading = false;
        var categorySlug = object.url || 'phim-moi-cap-nhat';
        var items = [];
        var created = false;

        this.create = function () {
            scroll.minus();
            scroll.append(body);
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
                        var card = createCard(item, function (it) {
                            Lampa.Activity.push({
                                url: it.slug,
                                title: it.name,
                                component: 'kkkphim_detail',
                                page: 1
                            });
                        });
                        body.append(card);
                        items.push(card[0]);
                    });
                    _this.activity.toggle();
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

                    if (scrollTop + clientHeight >= scrollHeight - 500) {
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

            var html = '<div class="kkk-detail">' +
                '<div class="kkk-detail__backdrop"><img src="' + backdrop + '" onerror="this.style.display=\'none\'"></div>' +
                '<div class="kkk-detail__overlay"></div>' +
                '<div class="kkk-detail__content">' +
                    '<div class="kkk-detail__poster"><img src="' + poster + '"></div>' +
                    '<div class="kkk-detail__info">' +
                        '<div class="kkk-detail__title">' + (movie.name || '') + '</div>' +
                        '<div class="kkk-detail__origin">' + (movie.origin_name || '') + '</div>' +
                        '<div class="kkk-detail__tags">' +
                            (movie.quality ? '<span class="kkk-detail__tag kkk-detail__tag--hd">' + movie.quality + '</span>' : '') +
                            (movie.year ? '<span class="kkk-detail__tag">' + movie.year + '</span>' : '') +
                            (movie.time ? '<span class="kkk-detail__tag">' + movie.time + '</span>' : '') +
                            '<span class="kkk-detail__tag">' + (movie.type === 'series' ? 'Phim bộ' : 'Phim lẻ') + '</span>' +
                        '</div>' +
                        '<div class="kkk-detail__meta-row"><span class="kkk-detail__meta-label">Thể loại:</span>' + mapNames(movie.category) + '</div>' +
                        '<div class="kkk-detail__meta-row"><span class="kkk-detail__meta-label">Quốc gia:</span>' + mapNames(movie.country) + '</div>' +
                        '<div class="kkk-detail__desc" id="kkk-desc">' + (movie.content || '').replace(/<[^>]*>/g, '') + '</div>' +
                        '<div class="kkk-detail__buttons">' +
                            '<div class="kkk-btn kkk-btn--primary selector" id="kkk-play">▶ Xem phim</div>' +
                            '<div class="kkk-btn kkk-btn--secondary selector" id="kkk-desc-btn">Mô tả đầy đủ</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

            var container = $(html);
            scroll.append(container);

            items.push(container.find('#kkk-play')[0]);
            items.push(container.find('#kkk-desc-btn')[0]);

            container.find('#kkk-play').on('hover:enter', function () {
                var firstServer = episodes.length ? episodes[0] : null;
                if (firstServer && firstServer.server_data && firstServer.server_data.length) {
                    _this.playEp(firstServer.server_data[0], movie, firstServer.server_data);
                }
            });

            container.find('#kkk-desc-btn').on('hover:enter', function () {
                var descEl = container.find('#kkk-desc');
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
                var epWrap = $('<div class="kkk-episodes"><div class="kkk-episodes__title">Danh sách tập</div></div>');

                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;

                    if (episodes.length > 1) {
                        epWrap.append('<div style="color:#aaa; margin:1em 0 0.5em; font-weight:600">' + server.server_name + '</div>');
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

                    epWrap.append(grid);
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

            if (url.indexOf('.m3u8') !== -1) {
                var playlist = allEps.map(function (e, i) {
                    var playUrl = e.link_m3u8 || e.link_embed;
                    if (!playUrl) return null;

                    return {
                        title: movie.name + ' - ' + (e.name || ('Tập ' + (i + 1))),
                        url: playUrl,
                        quality: {},
                        timeline: Lampa.Timeline.view(Lampa.Utils.hash((movie.slug || movie.name) + '_' + (e.slug || i)))
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
                    title: movie.name + ' - ' + (ep.name || ''),
                    url: url,
                    quality: {},
                    timeline: Lampa.Timeline.view(Lampa.Utils.hash((movie.slug || movie.name) + '_' + (ep.slug || ep.name || '0')))
                });
            }
        };

        this.showEmpty = function () {
            scroll.append('<div class="empty"><div class="empty__title">Không tìm thấy phim</div></div>');
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
        var body = $('<div class="kkk-catalog-grid"></div>');
        var page = 0;
        var totalPages = 999;
        var loading = false;
        var query = object.search || object.url || '';
        var items = [];
        var created = false;

        this.create = function () {
            scroll.minus();
            scroll.append(body);
            this.loadPage();
        };

        this.loadPage = function () {
            var _this = this;
            if (loading || page >= totalPages) return;

            loading = true;
            page++;

            network.silent(getSearchUrl(query, page), function (data) {
                loading = false;
                totalPages = parseTotalPages(data);

                var list = parseItems(data);
                if (list.length) {
                    list.forEach(function (item) {
                        var card = createCard(item, function (it) {
                            Lampa.Activity.push({
                                url: it.slug,
                                title: it.name,
                                component: 'kkkphim_detail',
                                page: 1
                            });
                        });
                        body.append(card);
                        items.push(card[0]);
                    });
                    _this.activity.toggle();
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
                    if (scrollObj.scrollTop() + scrollObj.height() >= scrollObj.prop('scrollHeight') - 500) {
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
        };
    }

    function initPlugin() {
        addCSS();

        Lampa.Component.add('kkkphim_main', KKKMainComponent);
        Lampa.Component.add('kkkphim_catalog', KKKCatalogComponent);
        Lampa.Component.add('kkkphim_detail', KKKDetailComponent);
        Lampa.Component.add('kkkphim_search', KKKSearchComponent);

        var ico = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="3"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>';
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

        Lampa.Listener.follow('search', function (e) {
            if (e.type === 'start' && e.query && e.body) {
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