(function () {
    'use strict';

    var KKPhim = {
        name: 'KKPhim',
        version: '1.0.0',
        baseUrl: 'https://phimapi.com',

        // Khởi tạo plugin
        init: function () {
            var self = this;

            // Thêm nguồn vào Lampa
            Lampa.Component.add('kkphim', this.component);

            // Thêm vào menu
            this.addButton();

            console.log('KKPhim Plugin đã kích hoạt!');
        },

        // Thêm nút vào menu
        addButton: function () {
            var button = $('<li class="menu__item selector" data-action="kkphim">\
                <div class="menu__ico">\
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
                        <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>\
                    </svg>\
                </div>\
                <div class="menu__text">KKPhim</div>\
            </li>');

            button.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim',
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(button);
        },

        // Component chính
        component: function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var items = [];
            var html = $('<div></div>');
            var body = $('<div class="category-full"></div>');
            var baseUrl = 'https://phimapi.com';

            // Thêm các danh mục
            this.create = function () {
                var _this = this;
                this.activity.loader(true);

                var menu = $('<div class="kkphim-menu selector"></div>');

                var categories = [
                    { title: '🎬 Phim Mới', url: '/danh-sach/phim-moi-cap-nhat' },
                    { title: '🎥 Phim Lẻ', url: '/v1/api/danh-sach/phim-le' },
                    { title: '📺 Phim Bộ', url: '/v1/api/danh-sach/phim-bo' },
                    { title: '🎨 Hoạt Hình', url: '/v1/api/danh-sach/hoat-hinh' },
                    { title: '📡 TV Shows', url: '/v1/api/danh-sach/tv-shows' }
                ];

                categories.forEach(function (cat) {
                    var item = $('<div class="kkphim-category selector">' + cat.title + '</div>');

                    item.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: cat.url,
                            title: cat.title,
                            component: 'kkphim_list',
                            page: 1
                        });
                    });

                    menu.append(item);
                });

                // Thêm ô tìm kiếm
                var searchBox = $('<div class="kkphim-search selector">🔍 Tìm Kiếm Phim</div>');
                searchBox.on('hover:enter', function () {
                    Lampa.Input.edit({
                        title: 'Tìm kiếm phim',
                        value: '',
                        free: true
                    }, function (text) {
                        if (text) {
                            Lampa.Activity.push({
                                url: '/v1/api/tim-kiem?keyword=' + encodeURIComponent(text),
                                title: 'Tìm: ' + text,
                                component: 'kkphim_list',
                                page: 1
                            });
                        }
                    });
                });

                menu.prepend(searchBox);
                scroll.append(menu);
                html.append(scroll.render());

                this.activity.loader(false);
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(scroll.render());
                        Lampa.Controller.collectionFocus(false, scroll.render());
                    },
                    left: function () {
                        Lampa.Controller.toggle('menu');
                    },
                    up: function () {
                        Lampa.Controller.toggle('head');
                    },
                    back: function () {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');
            };

            this.start = function () {
                this.create();
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
                html.remove();
            };
        }
    };

    // Component danh sách phim
    Lampa.Component.add('kkphim_list', function (object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var baseUrl = 'https://phimapi.com';

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            var url = baseUrl + object.url + '&page=' + object.page;
            if (object.url.indexOf('?') === -1) {
                url = baseUrl + object.url + '?page=' + object.page;
            }

            network.silent(url, function (data) {
                _this.activity.loader(false);

                var movies = [];
                if (data.items) {
                    movies = data.items;
                } else if (data.data && data.data.items) {
                    movies = data.data.items;
                }

                if (movies.length === 0) {
                    var empty = $('<div class="kkphim-empty">Không tìm thấy phim</div>');
                    scroll.append(empty);
                } else {
                    movies.forEach(function (movie) {
                        var card = Lampa.Template.get('card', {
                            title: movie.name,
                            release_year: movie.year || ''
                        });

                        var img = movie.poster_url || movie.thumb_url;
                        if (img && !img.startsWith('http')) {
                            img = 'https://phimimg.com/' + img;
                        }

                        card.find('.card__img').attr('src', img);

                        card.on('hover:enter', function () {
                            // Lấy chi tiết phim
                            Lampa.Activity.push({
                                url: movie.slug,
                                title: movie.name,
                                component: 'kkphim_detail'
                            });
                        });

                        body.append(card);
                        Lampa.Background.change(img);
                    });

                    scroll.append(body);
                }

                html.append(scroll.render());

                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(scroll.render());
                        Lampa.Controller.collectionFocus(false, scroll.render());
                    },
                    left: function () {
                        Lampa.Controller.toggle('menu');
                    },
                    up: function () {
                        Lampa.Controller.toggle('head');
                    },
                    back: function () {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');

            }, function (error) {
                _this.activity.loader(false);
                Lampa.Noty.show('Lỗi tải dữ liệu');
            });
        };

        this.start = function () { this.create(); };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
        };
    });

    // Component chi tiết phim
    Lampa.Component.add('kkphim_detail', function (object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div></div>');
        var baseUrl = 'https://phimapi.com';

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            network.silent(baseUrl + '/phim/' + object.url, function (data) {
                _this.activity.loader(false);

                if (!data.movie) {
                    Lampa.Noty.show('Không tìm thấy phim');
                    return;
                }

                var movie = data.movie;
                var episodes = data.episodes || [];

                // Hiển thị danh sách tập
                episodes.forEach(function (server) {
                    var serverTitle = $('<div class="kkphim-server">' + server.server_name + '</div>');
                    scroll.append(serverTitle);

                    server.server_data.forEach(function (ep) {
                        var epItem = $('<div class="kkphim-episode selector">' + ep.name + '</div>');

                        epItem.on('hover:enter', function () {
                            // Phát video
                            Lampa.Player.play({
                                title: movie.name + ' - ' + ep.name,
                                url: ep.link_m3u8,
                                quality: {}
                            });
                            Lampa.Player.playlist([{
                                title: movie.name + ' - ' + ep.name,
                                url: ep.link_m3u8
                            }]);
                        });

                        scroll.append(epItem);
                    });
                });

                html.append(scroll.render());

                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(scroll.render());
                        Lampa.Controller.collectionFocus(false, scroll.render());
                    },
                    left: function () {
                        Lampa.Controller.toggle('menu');
                    },
                    back: function () {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');

            }, function () {
                _this.activity.loader(false);
                Lampa.Noty.show('Lỗi tải chi tiết phim');
            });
        };

        this.start = function () { this.create(); };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
        };
    });

    // CSS cho plugin
    var style = $('<style>\
        .kkphim-menu { padding: 20px; }\
        .kkphim-category, .kkphim-search { \
            padding: 15px 20px; \
            margin: 10px 0; \
            background: rgba(255,255,255,0.1); \
            border-radius: 10px; \
            font-size: 1.2em; \
        }\
        .kkphim-category.focus, .kkphim-search.focus { \
            background: rgba(255,255,255,0.3); \
        }\
        .kkphim-server { \
            padding: 10px; \
            font-weight: bold; \
            color: #fff; \
            margin-top: 15px; \
        }\
        .kkphim-episode { \
            padding: 12px 20px; \
            margin: 5px 0; \
            background: rgba(255,255,255,0.1); \
            border-radius: 8px; \
        }\
        .kkphim-episode.focus { \
            background: #4285f4; \
        }\
        .kkphim-empty { \
            padding: 50px; \
            text-align: center; \
            color: #888; \
        }\
    </style>');
    $('head').append(style);

    // Khởi động plugin
    if (window.Lampa) {
        KKPhim.init();
    } else {
        window.addEventListener('lampa-ready', function () {
            KKPhim.init();
        });
    }

})();