(function () {
    'use strict';

    var KKPhim = {
        name: 'KKPhim',
        version: '1.1.0',
        baseUrl: 'https://phimapi.com',

        init: function () {
            Lampa.Component.add('kkphim', this.component);
            Lampa.Component.add('kkphim_list', this.listComponent);
            Lampa.Component.add('kkphim_detail', this.detailComponent);
            this.addButton();
            this.addStyle();
            console.log('KKPhim Plugin v1.1.0 đã kích hoạt!');
        },

        addButton: function () {
            var button = $('<li class="menu__item selector" data-action="kkphim">\
                <div class="menu__ico">\
                    <svg viewBox="0 0 24 24" fill="none">\
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

        addStyle: function () {
            var style = $('<style>\
                .kkphim-menu { padding: 20px; display: flex; flex-direction: column; }\
                .kkphim-item { \
                    padding: 15px 20px; \
                    margin: 8px 0; \
                    background: rgba(255,255,255,0.08); \
                    border-radius: 10px; \
                    font-size: 1.2em; \
                    transition: all 0.2s; \
                }\
                .kkphim-item.focus { \
                    background: #4285f4; \
                    transform: scale(1.02); \
                }\
                .kkphim-server { \
                    padding: 15px; \
                    font-weight: bold; \
                    color: #4285f4; \
                    font-size: 1.1em; \
                    margin-top: 20px; \
                    border-bottom: 1px solid rgba(255,255,255,0.1); \
                }\
                .kkphim-episode { \
                    padding: 12px 20px; \
                    margin: 5px 0; \
                    background: rgba(255,255,255,0.08); \
                    border-radius: 8px; \
                }\
                .kkphim-episode.focus { \
                    background: #4285f4; \
                }\
                .kkphim-empty { \
                    padding: 50px; \
                    text-align: center; \
                    color: #888; \
                    font-size: 1.2em; \
                }\
                .kkphim-wrap { \
                    padding: 20px; \
                }\
            </style>');
            $('head').append(style);
        },

        // Component Menu chính
        component: function (object) {
            var scroll = new Lampa.Scroll({ mask: true, over: true, step: 200 });
            var html = $('<div></div>');
            var active = 0;

            this.create = function () {
                var menu = $('<div class="kkphim-menu"></div>');

                var categories = [
                    { title: '🔍 Tìm Kiếm Phim', action: 'search' },
                    { title: '🎬 Phim Mới Cập Nhật', url: '/danh-sach/phim-moi-cap-nhat' },
                    { title: '🎥 Phim Lẻ', url: '/v1/api/danh-sach/phim-le' },
                    { title: '📺 Phim Bộ', url: '/v1/api/danh-sach/phim-bo' },
                    { title: '🎨 Hoạt Hình', url: '/v1/api/danh-sach/hoat-hinh' },
                    { title: '📡 TV Shows', url: '/v1/api/danh-sach/tv-shows' }
                ];

                categories.forEach(function (cat, index) {
                    var item = $('<div class="kkphim-item selector" data-index="' + index + '">' + cat.title + '</div>');

                    item.on('hover:enter', function () {
                        if (cat.action === 'search') {
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
                        } else {
                            Lampa.Activity.push({
                                url: cat.url,
                                title: cat.title,
                                component: 'kkphim_list',
                                page: 1
                            });
                        }
                    });

                    item.on('hover:focus', function () {
                        active = index;
                        scroll.update(item, true);
                    });

                    menu.append(item);
                });

                scroll.append(menu);
                html.append(scroll.render(true));

                this.activity.loader(false);
                this.start = function () {
                    Lampa.Controller.add('content', {
                        toggle: function () {
                            Lampa.Controller.collectionSet(html);
                            Lampa.Controller.collectionFocus(false, html);
                        },
                        left: function () {
                            if (Navigator.canmove('left')) Navigator.move('left');
                            else Lampa.Controller.toggle('menu');
                        },
                        right: function () {
                            Navigator.move('right');
                        },
                        up: function () {
                            if (Navigator.canmove('up')) Navigator.move('up');
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
            };

            this.start = function () {
                this.create();
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                scroll.destroy();
                html.remove();
            };
        },

        // Component danh sách phim
        listComponent: function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
            var html = $('<div></div>');
            var body = $('<div class="cards-grid"></div>');
            var active = 0;
            var baseUrl = 'https://phimapi.com';
            var loading = false;
            var totalPages = 1;
            var currentPage = object.page || 1;

            this.create = function () {
                var _this = this;
                html.append(scroll.render(true));
                this.loadMovies();
            };

            this.loadMovies = function () {
                var _this = this;
                if (loading) return;
                loading = true;

                this.activity.loader(true);

                var url = baseUrl + object.url;
                if (url.indexOf('?') === -1) {
                    url += '?page=' + currentPage;
                } else {
                    url += '&page=' + currentPage;
                }

                network.silent(url, function (data) {
                    _this.activity.loader(false);
                    loading = false;

                    var movies = [];
                    if (data.items) {
                        movies = data.items;
                        totalPages = data.pagination ? data.pagination.totalPages : 1;
                    } else if (data.data && data.data.items) {
                        movies = data.data.items;
                        totalPages = data.data.params ? data.data.params.pagination.totalPages : 1;
                    }

                    if (movies.length === 0 && currentPage === 1) {
                        var empty = $('<div class="kkphim-empty">Không tìm thấy phim nào</div>');
                        scroll.append(empty);
                    } else {
                        _this.buildCards(movies);
                    }

                    _this.startController();

                }, function (error) {
                    _this.activity.loader(false);
                    loading = false;
                    Lampa.Noty.show('Lỗi tải dữ liệu');
                });
            };

            this.buildCards = function (movies) {
                var _this = this;

                movies.forEach(function (movie, index) {
                    var card = Lampa.Template.get('card', {
                        title: movie.name,
                        release_year: movie.year || ''
                    });

                    var img = movie.poster_url || movie.thumb_url;
                    if (img && !img.startsWith('http')) {
                        img = 'https://phimimg.com/' + img;
                    }

                    card.find('.card__img').attr('src', img).on('error', function () {
                        $(this).attr('src', './img/img_broken.svg');
                    });

                    card.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: movie.slug,
                            title: movie.name,
                            component: 'kkphim_detail',
                            movie: movie
                        });
                    });

                    card.on('hover:focus', function () {
                        active = index;
                        scroll.update(card, true);
                        Lampa.Background.change(img);

                        // Load thêm khi gần cuối
                        if (index >= movies.length - 4 && currentPage < totalPages) {
                            currentPage++;
                            _this.loadMovies();
                        }
                    });

                    body.append(card);
                });

                scroll.append(body);
            };

            this.startController = function () {
                var _this = this;

                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function () {
                        Navigator.move('right');
                    },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
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
        },

        // Component chi tiết phim
        detailComponent: function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true, step: 200 });
            var html = $('<div></div>');
            var baseUrl = 'https://phimapi.com';
            var active = 0;

            this.create = function () {
                var _this = this;
                this.activity.loader(true);

                network.silent(baseUrl + '/phim/' + object.url, function (data) {
                    _this.activity.loader(false);

                    if (!data.movie) {
                        Lampa.Noty.show('Không tìm thấy phim');
                        Lampa.Activity.backward();
                        return;
                    }

                    var movie = data.movie;
                    var episodes = data.episodes || [];

                    var wrap = $('<div class="kkphim-wrap"></div>');

                    // Hiển thị thông tin phim
                    var info = $('<div class="kkphim-info" style="margin-bottom: 20px; color: #aaa;">\
                        <div style="font-size: 1.3em; color: #fff; margin-bottom: 10px;">' + movie.name + '</div>\
                        <div>' + (movie.origin_name || '') + ' • ' + (movie.year || '') + '</div>\
                    </div>');
                    wrap.append(info);

                    var episodeIndex = 0;

                    // Hiển thị danh sách server và tập
                    episodes.forEach(function (server) {
                        var serverTitle = $('<div class="kkphim-server">' + server.server_name + '</div>');
                        wrap.append(serverTitle);

                        server.server_data.forEach(function (ep) {
                            var epItem = $('<div class="kkphim-episode selector" data-index="' + episodeIndex + '">▶ ' + ep.name + '</div>');

                            epItem.on('hover:enter', function () {
                                var playlist = server.server_data.map(function (e) {
                                    return {
                                        title: movie.name + ' - ' + e.name,
                                        url: e.link_m3u8
                                    };
                                });

                                Lampa.Player.play({
                                    title: movie.name + ' - ' + ep.name,
                                    url: ep.link_m3u8
                                });
                                Lampa.Player.playlist(playlist);
                            });

                            epItem.on('hover:focus', function () {
                                active = episodeIndex;
                                scroll.update(epItem, true);
                            });

                            wrap.append(epItem);
                            episodeIndex++;
                        });
                    });

                    scroll.append(wrap);
                    html.append(scroll.render(true));

                    _this.startController();

                }, function () {
                    _this.activity.loader(false);
                    Lampa.Noty.show('Lỗi tải chi tiết phim');
                    Lampa.Activity.backward();
                });
            };

            this.startController = function () {
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function () {
                        Navigator.move('right');
                    },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
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

    // Khởi động plugin
    if (window.Lampa) {
        KKPhim.init();
    } else {
        window.addEventListener('lampa-ready', function () {
            KKPhim.init();
        });
    }

})();