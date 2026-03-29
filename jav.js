(function () {
    'use strict';

    if (!window.Lampa) return;

    var network = new Lampa.Reguest();
    var CONFIG = {
        base_url: 'https://phimapi.com',
        api_url: 'https://phimapi.com/v1/api',
        img_url: 'https://phimimg.com'
    };

    function getImageUrl(path) {
        if (!path) return '';
        if (path.indexOf('http') === 0) return path;
        return CONFIG.img_url + '/' + String(path).replace(/^\/+/, '');
    }

    function toLampaCard(item) {
        return {
            id: item._id || item.slug || Lampa.Utils.uid(),
            title: item.name || '',
            name: item.name || '',
            original_title: item.origin_name || '',
            original_name: item.origin_name || '',
            overview: (item.content || item.description || '')
                       .replace(/<[^>]*>/g, ''),
            poster_path: getImageUrl(item.poster_url || item.thumb_url),
            backdrop_path: getImageUrl(item.thumb_url || item.poster_url),
            release_date: item.year ? item.year + '-01-01' : '',
            vote_average: 0,
            slug: item.slug,
            quality: item.quality || 'HD',
            lang: item.lang || 'Vietsub',
            episode_current: item.episode_current || '',
            media_type: 'movie',
            kkphim: true  // đánh dấu đây là data KKPhim
        };
    }

    // ==========================================
    //  COMPONENT: Main (Trang chủ)
    // ==========================================
    function KKMain(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items = [];
        var last;
        var active = 0;

        var cats = [
            { title: 'Phim Mới Cập Nhật', url: 'new',
              api: CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=1' },
            { title: 'Phim Lẻ', url: 'phim-le',
              api: CONFIG.api_url + '/danh-sach/phim-le?page=1' },
            { title: 'Phim Bộ', url: 'phim-bo',
              api: CONFIG.api_url + '/danh-sach/phim-bo?page=1' },
            { title: 'Hoạt Hình', url: 'hoat-hinh',
              api: CONFIG.api_url + '/danh-sach/hoat-hinh?page=1' },
            { title: 'TV Shows', url: 'tv-shows',
              api: CONFIG.api_url + '/danh-sach/tv-shows?page=1' }
        ];

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            var loaded = 0;

            cats.forEach(function (cat) {
                network.silent(cat.api, function (response) {
                    var data = response.data || response || {};
                    var list = (data.items || []).slice(0, 12);

                    if (list.length) {
                        _this.buildLine(cat, list.map(toLampaCard));
                    }

                    loaded++;
                    if (loaded >= cats.length) {
                        _this.activity.loader(false);
                        _this.activity.toggle();
                    }
                }, function () {
                    loaded++;
                    if (loaded >= cats.length) {
                        _this.activity.loader(false);
                        _this.activity.toggle();
                    }
                });
            });
        };

        this.buildLine = function (cat, movies) {
            var _this = this;
            // Tạo container cho line
            var line = $('<div class="items-line"></div>');
            var head = $('<div class="items-line__head"></div>');
            var title = $('<div class="items-line__title">' + cat.title + '</div>');
            var more = $('<div class="items-line__more selector">Tất cả</div>');
            var body = $('<div class="items-line__body"></div>');

            more.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkphim_category',
                    page: 1
                });
            });

            head.append(title);
            head.append(more);
            line.append(head);
            line.append(body);

            movies.forEach(function (movie) {
                var card = new Lampa.Card(movie, { 
                    card_small: true 
                });

                card.create();

                card.onFocus = function (target, card_data) {
                    last = target;
                    scroll.update($(target), true);
                };

                card.onEnter = function (target, card_data) {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie,
                        page: 1
                    });
                };

                // Thêm badge chất lượng
                card.render().find('.card__img').prepend(
                    '<div style="position:absolute;top:5px;left:5px;'
                    + 'background:#e50914;color:#fff;font-size:0.7em;'
                    + 'padding:2px 6px;border-radius:4px;z-index:5;'
                    + 'font-weight:700;">'
                    + (movie.quality || 'HD')
                    + '</div>'
                );

                body.append(card.render());
                items.push(card);
            });

            scroll.append(line);
        };

        this.start = function () {
            var _this = this;

            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last, scroll.render());
                },
                left: function () {
                    if (Navigator.canMove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canMove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};

        this.render = function () {
            return scroll.render();
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items.forEach(function (card) {
                if (card.destroy) card.destroy();
            });
            items = [];
        };
    }

    // ==========================================
    //  COMPONENT: Category
    // ==========================================
    function KKCategory(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var body = $('<div class="category-full"></div>');
        var items = [];
        var page = 1;
        var total_pages = 1;
        var loading = false;
        var last;

        function getUrl(type, p) {
            switch (type) {
                case 'new':
                    return CONFIG.base_url
                        + '/danh-sach/phim-moi-cap-nhat?page=' + p;
                case 'phim-le':
                    return CONFIG.api_url
                        + '/danh-sach/phim-le?page=' + p;
                case 'phim-bo':
                    return CONFIG.api_url
                        + '/danh-sach/phim-bo?page=' + p;
                case 'hoat-hinh':
                    return CONFIG.api_url
                        + '/danh-sach/hoat-hinh?page=' + p;
                case 'tv-shows':
                    return CONFIG.api_url
                        + '/danh-sach/tv-shows?page=' + p;
                default:
                    return CONFIG.base_url
                        + '/danh-sach/phim-moi-cap-nhat?page=' + p;
            }
        }

        scroll.append(body);

        this.create = function () {
            this.load();
        };

        this.load = function () {
            var _this = this;
            if (loading) return;
            loading = true;

            _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(
                getUrl(object.url || 'new', page),
                function (response) {
                    loading = false;
                    _this.activity.loader(false);

                    var data = response.data || response || {};
                    var list = data.items || [];
                    total_pages = (data.params
                        && data.params.pagination
                        && data.params.pagination.totalPages) || 1;

                    list.forEach(function (item) {
                        var movie = toLampaCard(item);

                        var card = new Lampa.Card(movie, {
                            card_small: true
                        });

                        card.create();

                        card.onFocus = function (target) {
                            last = target;
                            scroll.update($(target), true);
                        };

                        card.onEnter = function () {
                            Lampa.Activity.push({
                                url: '',
                                title: movie.title,
                                component: 'kkphim_full',
                                card: movie,
                                page: 1
                            });
                        };

                        body.append(card.render());
                        items.push(card);
                    });

                    // Nút tải thêm
                    if (page < total_pages) {
                        var more = $(
                            '<div class="selector card-more">'
                            + '<div class="card-more__box">'
                            + '<div class="card-more__title">Tải thêm</div>'
                            + '</div></div>'
                        );

                        more.on('hover:enter', function () {
                            more.remove();
                            page++;
                            _this.load();
                        });

                        body.append(more);
                    }

                    _this.activity.toggle();
                },
                function () {
                    loading = false;
                    _this.activity.loader(false);
                    _this.activity.toggle();
                }
            );
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last, scroll.render());
                },
                left: function () {
                    if (Navigator.canMove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canMove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items.forEach(function (c) { if (c.destroy) c.destroy(); });
            items = [];
        };
    }

    // ==========================================
    //  COMPONENT: Full / Detail
    // ==========================================
    function KKFull(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var card = object.card;
        var items = [];
        var last;

        this.create = function () {
            var _this = this;
            _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(
                CONFIG.base_url + '/phim/' + card.slug,
                function (response) {
                    _this.activity.loader(false);

                    if (!response || !response.movie) {
                        scroll.append($(
                            '<div class="empty">'
                            + '<div class="empty__title">'
                            + 'Không tìm thấy phim</div></div>'
                        ));
                        _this.activity.toggle();
                        return;
                    }

                    _this.build(response);
                    _this.activity.toggle();
                },
                function () {
                    _this.activity.loader(false);
                    scroll.append($(
                        '<div class="empty">'
                        + '<div class="empty__title">'
                        + 'Lỗi tải dữ liệu</div></div>'
                    ));
                    _this.activity.toggle();
                }
            );
        };

        this.build = function (data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];

            var poster = getImageUrl(movie.poster_url || movie.thumb_url);
            var backdrop = getImageUrl(movie.thumb_url || movie.poster_url);

            // --- Info section ---
            var info = $('<div class="full-start"></div>');

            var background = $(
                '<div class="full-start__background">'
                + '<img src="' + backdrop + '" />'
                + '</div>'
            );

            var left = $(
                '<div class="full-start__poster">'
                + '<img src="' + poster + '" />'
                + '</div>'
            );

            var right = $('<div class="full-start__right"></div>');

            right.append(
                '<div class="full-start__title">'
                + (movie.name || '') + '</div>'
            );
            right.append(
                '<div class="full-start__tagline">'
                + (movie.origin_name || '') + '</div>'
            );

            var tags = $('<div class="full-start__tags"></div>');
            tags.append('<div class="full-start__tag">'
                + (movie.year || '') + '</div>');
            tags.append('<div class="full-start__tag">'
                + (movie.quality || 'HD') + '</div>');
            tags.append('<div class="full-start__tag">'
                + (movie.lang || 'Vietsub') + '</div>');
            if (movie.time) {
                tags.append('<div class="full-start__tag">'
                    + movie.time + '</div>');
            }
            right.append(tags);

            var desc = (movie.content || 'Không có mô tả')
                        .replace(/<[^>]*>/g, '');
            right.append(
                '<div class="full-start__desc">' + desc + '</div>'
            );

            info.append(background);
            info.append(left);
            info.append(right);
            scroll.append(info);

            // --- Episodes ---
            if (episodes.length) {
                episodes.forEach(function (server, sIdx) {
                    var serverData = server.server_data || [];
                    if (!serverData.length) return;

                    var section = $('<div class="items-line"></div>');
                    section.append(
                        '<div class="items-line__head">'
                        + '<div class="items-line__title">'
                        + (server.server_name
                           || ('Server ' + (sIdx + 1)))
                        + ' (' + serverData.length + ' tập)'
                        + '</div></div>'
                    );

                    var epBody = $(
                        '<div class="items-line__body"></div>'
                    );

                    serverData.forEach(function (ep, i) {
                        var btn = $(
                            '<div class="selector card-episode"'
                            + ' style="padding:10px 18px;'
                            + 'margin:4px;border-radius:8px;'
                            + 'background:rgba(255,255,255,0.08);'
                            + 'display:inline-block;">'
                            + (ep.name || ('Tập ' + (i + 1)))
                            + '</div>'
                        );

                        btn.on('hover:enter', function () {
                            var url = ep.link_m3u8 || ep.link_embed;
                            if (!url) {
                                Lampa.Noty.show('Không có link');
                                return;
                            }

                            // Tạo playlist
                            var playlist = serverData.map(
                                function (item, idx) {
                                    return {
                                        title: (movie.name || '')
                                            + ' - '
                                            + (item.name
                                               || ('Tập ' + (idx+1))),
                                        url: item.link_m3u8
                                             || item.link_embed
                                    };
                                }
                            );

                            Lampa.Player.play({
                                url: url,
                                title: (movie.name || '')
                                    + ' - ' + (ep.name || ''),
                                poster: poster
                            });

                            if (Lampa.Player.playlist) {
                                Lampa.Player.playlist(playlist);
                            }
                        });

                        btn.on('hover:focus', function () {
                            last = btn[0];
                            scroll.update(btn, true);
                        });

                        epBody.append(btn);
                    });

                    section.append(epBody);
                    scroll.append(section);
                });
            }
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last, scroll.render());
                },
                left: function () {
                    if (Navigator.canMove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canMove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // ==========================================
    //  COMPONENT: Search
    // ==========================================
    function KKSearch(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var body = $('<div class="category-full"></div>');
        var items = [];
        var keyword = object.search || '';
        var last;

        scroll.append(body);

        this.create = function () {
            var _this = this;
            _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(
                CONFIG.api_url
                    + '/tim-kiem?keyword='
                    + encodeURIComponent(keyword),
                function (response) {
                    _this.activity.loader(false);
                    var data = response.data || response || {};
                    var list = data.items || [];

                    if (!list.length) {
                        body.append(
                            '<div class="empty">'
                            + '<div class="empty__title">'
                            + 'Không tìm thấy: '
                            + keyword + '</div></div>'
                        );
                        _this.activity.toggle();
                        return;
                    }

                    list.forEach(function (item) {
                        var movie = toLampaCard(item);
                        var card = new Lampa.Card(movie, {
                            card_small: true
                        });

                        card.create();

                        card.onFocus = function (target) {
                            last = target;
                            scroll.update($(target), true);
                        };

                        card.onEnter = function () {
                            Lampa.Activity.push({
                                url: '',
                                title: movie.title,
                                component: 'kkphim_full',
                                card: movie,
                                page: 1
                            });
                        };

                        body.append(card.render());
                        items.push(card);
                    });

                    _this.activity.toggle();
                },
                function () {
                    _this.activity.loader(false);
                    body.append(
                        '<div class="empty">'
                        + '<div class="empty__title">'
                        + 'Lỗi tìm kiếm</div></div>'
                    );
                    _this.activity.toggle();
                }
            );
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last, scroll.render());
                },
                left: function () {
                    if (Navigator.canMove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canMove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items.forEach(function (c) { if (c.destroy) c.destroy(); });
            items = [];
        };
    }

    // ==========================================
    //  REGISTER + MENU
    // ==========================================
    function addMenu() {
        var wait = function () {
            if (!$('.menu__list').length) {
                return setTimeout(wait, 500);
            }
            if ($('[data-action="kkphim"]').length) return;

            var ico = '<svg viewBox="0 0 24 24" fill="currentColor">'
                + '<path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 '
                + '1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/></svg>';

            var item = $(
                '<li class="menu__item selector" data-action="kkphim">'
                + '<div class="menu__ico">' + ico + '</div>'
                + '<div class="menu__text">KKPhim</div>'
                + '</li>'
            );

            item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_main',
                    page: 1
                });
            });

            $('.menu__list').first().append(item);
        };

        wait();
    }

    function init() {
        if (!window.Lampa || !Lampa.Component) {
            return setTimeout(init, 300);
        }

        Lampa.Component.add('kkphim_main', KKMain);
        Lampa.Component.add('kkphim_category', KKCategory);
        Lampa.Component.add('kkphim_full', KKFull);
        Lampa.Component.add('kkphim_search', KKSearch);

        if (window.appready) addMenu();
        else {
            if (Lampa.Listener && Lampa.Listener.follow) {
                Lampa.Listener.follow('app', function (e) {
                    if (e.type === 'ready') setTimeout(addMenu, 500);
                });
            }
            setTimeout(addMenu, 2500);
        }
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();