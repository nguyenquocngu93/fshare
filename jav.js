(function() {
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

    function clearHtml(str) {
        return str ? String(str).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') : '';
    }

    // ===== Chuyển đổi sang format Lampa hiểu =====
    function convertToLampaCard(item) {
        return {
            id: item._id || item.slug || Lampa.Utils.uid(),
            title: item.name || '',
            name: item.name || '',
            original_title: item.origin_name || '',
            original_name: item.origin_name || '',
            overview: clearHtml(item.content || item.description || ''),
            poster_path: getImageUrl(item.poster_url || item.thumb_url),
            backdrop_path: getImageUrl(item.thumb_url || item.poster_url),
            vote_average: 0,
            release_date: item.year ? item.year + '-01-01' : '',
            first_air_date: item.year ? item.year + '-01-01' : '',
            slug: item.slug || '',
            quality: item.quality || 'HD',
            lang: item.lang || 'Vietsub',
            episode_current: item.episode_current || '',
            kkphim: true,  // đánh dấu là từ kkphim
            _source: item
        };
    }

    // ==============================================
    // COMPONENT: Category (danh sách phim)
    // ==============================================
    function KKCategory(object) {
        var comp = new Lampa.InteractionCategory(object);
        var scroll = comp.scroll;
        var body = comp.body;
        var page = 1;
        var total_pages = 1;
        var loading = false;
        var last;

        // Override load
        comp.create = function() {
            this.loadData();
        };

        comp.loadData = function() {
            if (loading) return;
            loading = true;
            comp.activity.loader(true);

            var url = getApiUrl(object.url || 'new', page);

            network.clear();
            network.timeout(15000);
            network.silent(url, function(response) {
                loading = false;
                comp.activity.loader(false);

                var data = response.data || response || {};
                var list = data.items || [];
                total_pages = data.params && data.params.pagination
                    ? data.params.pagination.totalPages : 1;

                if (!list.length && page === 1) {
                    comp.emptyForQuery('');
                    return;
                }

                list.forEach(function(item) {
                    var card_data = convertToLampaCard(item);

                    // ★ Dùng Lampa.Card - đây là chìa khoá ★
                    var card = new Lampa.Card(card_data, {
                        card_type: true // hiển thị card dọc
                    });

                    card.onEnter = function() {
                        // Mở trang detail
                        Lampa.Activity.push({
                            url: '',
                            title: card_data.title,
                            component: 'kkphim_full',
                            card: card_data,
                            page: 1
                        });
                    };

                    card.onFocus = function(target) {
                        last = target;
                        scroll.update(card.render(), true);
                    };

                    // ★ Dùng card.build() để render theo chuẩn Lampa ★
                    card.build();

                    // Set poster
                    card.image().attr('src', card_data.poster_path);

                    // Thêm vào scroll
                    scroll.append(card.render());
                    body.push(card);
                });

                // Load more khi scroll xuống cuối
                if (page < total_pages) {
                    comp.more = function() {
                        page++;
                        comp.loadData();
                    };
                }

                comp.activity.toggle();
            }, function() {
                loading = false;
                comp.activity.loader(false);
                comp.emptyForQuery('');
            });
        };

        // ★ Controller - điều khiển remote TV ★
        comp.start = function() {
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false);
                },
                left: function() {
                    if (Lampa.Navigator.canMove('left'))
                        Lampa.Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function() {
                    if (Lampa.Navigator.canMove('right'))
                        Lampa.Navigator.move('right');
                },
                up: function() {
                    if (Lampa.Navigator.canMove('up'))
                        Lampa.Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function() {
                    if (Lampa.Navigator.canMove('down'))
                        Lampa.Navigator.move('down');
                    else if (comp.more) comp.more();
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        comp.render = function() {
            return scroll.render();
        };

        comp.destroy = function() {
            network.clear();
            scroll.destroy();
        };

        return comp;
    }

    // ==============================================
    // COMPONENT: Main (trang chủ)
    // ==============================================
    function KKMain(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var items = [];
        var last;
        var categories = [
            { title: 'Phim Mới Cập Nhật', url: 'new' },
            { title: 'Phim Lẻ', url: 'phim-le' },
            { title: 'Phim Bộ', url: 'phim-bo' },
            { title: 'Hoạt Hình', url: 'hoat-hinh' },
            { title: 'TV Shows', url: 'tv-shows' }
        ];

        this.create = function() {
            var _this = this;
            if (this.activity) this.activity.loader(true);

            var loaded = 0;

            categories.forEach(function(cat) {
                network.silent(getApiUrl(cat.url, 1), function(response) {
                    var data = response.data || response || {};
                    var list = (data.items || []).slice(0, 12);

                    if (list.length) {
                        _this.appendLine(cat, list.map(convertToLampaCard));
                    }

                    loaded++;
                    if (loaded >= categories.length) {
                        if (_this.activity) _this.activity.loader(false);
                        if (_this.activity) _this.activity.toggle();
                    }
                }, function() {
                    loaded++;
                    if (loaded >= categories.length) {
                        if (_this.activity) _this.activity.loader(false);
                        if (_this.activity) _this.activity.toggle();
                    }
                });
            });
        };

        this.appendLine = function(cat, movies) {
            // ★ Dùng Lampa.Template.get('items_line') - layout dòng chuẩn Lampa ★
            var line = Lampa.Template.get('items_line', {
                title: cat.title
            });

            // Nút "Xem tất cả"
            line.find('.items-line__title').on('hover:enter', function() {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkphim_category',
                    page: 1
                });
            });

            var body_line = line.find('.items-line__body');

            movies.forEach(function(movie) {
                // ★ Dùng Lampa.Card ★
                var card = new Lampa.Card(movie, { card_type: true });

                card.onEnter = function() {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie,
                        page: 1
                    });
                };

                card.onFocus = function(target) {
                    last = target;
                    scroll.update(line, true);
                };

                card.build();
                card.image().attr('src', movie.poster_path);

                body_line.append(card.render());
                items.push(card);
            });

            scroll.append(line);
        };

        this.start = function() {
            var _this = this;

            if (Lampa.Activity.active().activity !== this.activity) return;

            // ★ Controller chuẩn Lampa ★
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false);
                },
                left: function() {
                    if (Lampa.Navigator.canMove('left'))
                        Lampa.Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function() {
                    Lampa.Navigator.move('right');
                },
                up: function() {
                    if (Lampa.Navigator.canMove('up'))
                        Lampa.Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function() {
                    Lampa.Navigator.move('down');
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');

            this.create();
        };

        this.pause = function() {};
        this.stop = function() {};

        this.render = function() {
            return scroll.render();
        };

        this.destroy = function() {
            network.clear();
            scroll.destroy();
        };
    }

    // ==============================================
    // COMPONENT: Full/Detail
    // ==============================================
    function KKFull(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var card = object.card;
        var last;
        var items = [];

        this.create = function() {
            var _this = this;
            if (this.activity) this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(CONFIG.base_url + '/phim/' + card.slug, function(response) {
                if (_this.activity) _this.activity.loader(false);

                if (!response || !response.movie) {
                    var empty = $('<div class="empty"><div class="empty__title">'
                        + 'Không tìm thấy thông tin phim</div></div>');
                    scroll.append(empty);
                    if (_this.activity) _this.activity.toggle();
                    return;
                }

                _this.build(response);
                if (_this.activity) _this.activity.toggle();
            }, function() {
                if (_this.activity) _this.activity.loader(false);
            });
        };

        this.build = function(data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];

            var poster = getImageUrl(movie.poster_url || movie.thumb_url);
            var backdrop = getImageUrl(movie.thumb_url || movie.poster_url);

            // ★ Dùng Lampa.Template.get('full_start') - layout detail chuẩn ★
            var info = Lampa.Template.get('full_start', {
                title: movie.name || '',
                original_title: movie.origin_name || '',
                descr: clearHtml(movie.content || ''),
                img: poster,
                background: backdrop,
                vote: '',
                vote_average: ''
            });

            // Thêm meta info
            var meta = $('<div class="full-start__meta"></div>');
            meta.append('<span>' + (movie.year || '') + '</span>');
            meta.append('<span>' + (movie.quality || 'HD') + '</span>');
            meta.append('<span>' + (movie.lang || 'Vietsub') + '</span>');
            if (movie.time) meta.append('<span>' + movie.time + '</span>');

            info.find('.full-start__body').prepend(meta);

            scroll.append(info);

            // Episodes
            if (episodes.length) {
                episodes.forEach(function(server, sIndex) {
                    var serverData = server.server_data || [];
                    if (!serverData.length) return;

                    var section = $('<div class="kkphim-episodes"></div>');
                    section.append('<div class="kkphim-episodes-title">'
                        + (server.server_name || 'Server ' + (sIndex + 1))
                        + ' (' + serverData.length + ' tập)</div>');

                    var list = $('<div class="kkphim-episodes-list"></div>');

                    serverData.forEach(function(ep, index) {
                        // ★ Dùng class selector để Lampa nhận focus ★
                        var btn = $('<div class="kkphim-ep selector">'
                            + (ep.name || 'Tập ' + (index + 1))
                            + '</div>');

                        btn.on('hover:enter', function() {
                            var stream = ep.link_m3u8 || ep.link_embed;
                            if (!stream) {
                                Lampa.Noty.show('Không có link phát');
                                return;
                            }

                            // ★ Playlist cho Player ★
                            var playlist = serverData.map(function(item, i) {
                                return {
                                    title: (movie.name || '') + ' - '
                                        + (item.name || 'Tập ' + (i + 1)),
                                    url: item.link_m3u8 || item.link_embed
                                };
                            });

                            Lampa.Player.play({
                                url: stream,
                                title: (movie.name || '') + ' - ' + (ep.name || ''),
                                poster: poster
                            });

                            if (Lampa.Player.playlist)
                                Lampa.Player.playlist(playlist);
                        });

                        btn.on('hover:focus', function(e) {
                            last = e.target;
                            scroll.update(btn, true);
                        });

                        list.append(btn);
                        items.push(btn);
                    });

                    section.append(list);
                    scroll.append(section);
                });
            }
        };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;

            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false);
                },
                left: function() {
                    if (Lampa.Navigator.canMove('left'))
                        Lampa.Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function() {
                    Lampa.Navigator.move('right');
                },
                up: function() {
                    if (Lampa.Navigator.canMove('up'))
                        Lampa.Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function() {
                    Lampa.Navigator.move('down');
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
            this.create();
        };

        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return scroll.render(); };
        this.destroy = function() {
            network.clear();
            scroll.destroy();
        };
    }

    // Helper
    function getApiUrl(type, page) {
        page = page || 1;
        switch (type) {
            case 'new':
                return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
            case 'phim-le':
                return CONFIG.api_url + '/danh-sach/phim-le?page=' + page;
            case 'phim-bo':
                return CONFIG.api_url + '/danh-sach/phim-bo?page=' + page;
            case 'hoat-hinh':
                return CONFIG.api_url + '/danh-sach/hoat-hinh?page=' + page;
            case 'tv-shows':
                return CONFIG.api_url + '/danh-sach/tv-shows?page=' + page;
            default:
                return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        }
    }

    // Register & Menu
    Lampa.Component.add('kkphim_main', KKMain);
    Lampa.Component.add('kkphim_category', KKCategory);
    Lampa.Component.add('kkphim_full', KKFull);

    // Add menu
    function addMenu() {
        var ico = '<svg>...</svg>';
        var menu_item = $('<li class="menu__item selector" data-action="kkphim">'
            + '<div class="menu__ico">' + ico + '</div>'
            + '<div class="menu__text">KKPhim</div></li>');

        menu_item.on('hover:enter', function() {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main',
                page: 1
            });
        });

        $('.menu__list').append(menu_item);
    }

    if (window.appready) addMenu();
    else Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') addMenu();
    });

})();