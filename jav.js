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

    function clearHtml(str) {
        if (!str) return '';
        return String(str).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    }

    function toLampaCard(item) {
        return {
            id: item._id || item.slug || Lampa.Utils.uid(),
            title: item.name || '',
            name: item.name || '',
            original_title: item.origin_name || '',
            original_name: item.origin_name || '',
            overview: clearHtml(item.content || item.description || ''),
            poster_path: getImageUrl(item.poster_url || item.thumb_url),
            backdrop_path: getImageUrl(item.thumb_url || item.poster_url),
            release_date: item.year ? item.year + '-01-01' : '',
            vote_average: 0,
            slug: item.slug || '',
            quality: item.quality || 'HD',
            lang: item.lang || 'Vietsub',
            episode_current: item.episode_current || '',
            episode_total: item.episode_total || '',
            time: item.time || '',
            country: item.country || [],
            category: item.category || [],
            media_type: 'movie',
            kkphim: true,
            kkphim_data: item
        };
    }

    function getApiUrl(type, page) {
        page = page || 1;
        switch (type) {
            case 'new': return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
            case 'phim-le': return CONFIG.api_url + '/danh-sach/phim-le?page=' + page;
            case 'phim-bo': return CONFIG.api_url + '/danh-sach/phim-bo?page=' + page;
            case 'hoat-hinh': return CONFIG.api_url + '/danh-sach/hoat-hinh?page=' + page;
            case 'tv-shows': return CONFIG.api_url + '/danh-sach/tv-shows?page=' + page;
            default: return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        }
    }

    // ========================================
    // Tạo card đúng chuẩn Lampa
    // ========================================
    function createCard(movie, onEnter, onFocus) {
        var card = Lampa.Template.get('card', {
            title: movie.title,
            release_year: movie.release_date ? movie.release_date.substring(0, 4) : ''
        });

        var img = card.find('.card__img')[0] || card.find('img')[0];

        if (card.find('.card__img').length) {
            card.find('.card__img').css({
                'background-image': 'url(' + movie.poster_path + ')',
                'background-size': 'cover',
                'background-position': 'center'
            });
        }

        // Fallback: nếu template dùng <img>
        var imgEl = card.find('.card__img img');
        if (imgEl.length) {
            imgEl.attr('src', movie.poster_path);
            imgEl.on('error', function () {
                $(this).attr('src', './img/img_broken.svg');
            });
        }

        card.addClass('selector');

        card.on('hover:focus', function () {
            if (onFocus) onFocus(card[0], movie);
        });

        card.on('hover:enter', function () {
            if (onEnter) onEnter(movie);
        });

        return card;
    }

    // ========================================
    // MAIN - Trang chủ
    // ========================================
    function KKMain(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var last;
        var cats = [
            { title: 'Phim Mới Cập Nhật', url: 'new' },
            { title: 'Phim Lẻ', url: 'phim-le' },
            { title: 'Phim Bộ', url: 'phim-bo' },
            { title: 'Hoạt Hình', url: 'hoat-hinh' },
            { title: 'TV Shows', url: 'tv-shows' }
        ];

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            var loaded = 0;

            cats.forEach(function (cat) {
                network.silent(getApiUrl(cat.url, 1), function (response) {
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
                var card = createCard(movie, function () {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie,
                        page: 1
                    });
                }, function (target) {
                    last = target;
                    scroll.update($(target), true);
                });

                body.append(card);
            });

            scroll.append(line);
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

    // ========================================
    // CATEGORY
    // ========================================
    function KKCategory(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var body = $('<div class="category-full"></div>');
        var page = 1;
        var total_pages = 1;
        var loading = false;
        var last;

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
            network.silent(getApiUrl(object.url || 'new', page), function (response) {
                loading = false;
                _this.activity.loader(false);

                var data = response.data || response || {};
                var list = data.items || [];
                total_pages = (data.params && data.params.pagination && data.params.pagination.totalPages) || 1;

                list.forEach(function (item) {
                    var movie = toLampaCard(item);

                    var card = createCard(movie, function () {
                        Lampa.Activity.push({
                            url: '',
                            title: movie.title,
                            component: 'kkphim_full',
                            card: movie,
                            page: 1
                        });
                    }, function (target) {
                        last = target;
                        scroll.update($(target), true);
                    });

                    body.append(card);
                });

                if (page < total_pages) {
                    var more = $('<div class="selector card-more"><div class="card-more__box"><div class="card-more__title">Tải thêm</div></div></div>');
                    more.on('hover:enter', function () {
                        more.remove();
                        page++;
                        _this.load();
                    });
                    body.append(more);
                }

                _this.activity.toggle();
            }, function () {
                loading = false;
                _this.activity.loader(false);
                _this.activity.toggle();
            });
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

    // ========================================
    // FULL - Chi tiết phim
    // ========================================
    function KKFull(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var card = object.card;
        var last;

        this.create = function () {
            var _this = this;
            _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(CONFIG.base_url + '/phim/' + card.slug, function (response) {
                _this.activity.loader(false);

                if (!response || !response.movie) {
                    var empty = $('<div class="torrent-empty"><div class="torrent-empty__title">Không tìm thấy phim</div></div>');
                    scroll.append(empty);
                    _this.activity.toggle();
                    return;
                }

                _this.build(response);
                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                var empty = $('<div class="torrent-empty"><div class="torrent-empty__title">Lỗi tải dữ liệu</div></div>');
                scroll.append(empty);
                _this.activity.toggle();
            });
        };

        this.build = function (data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];
            var poster = getImageUrl(movie.poster_url || movie.thumb_url);
            var backdrop = getImageUrl(movie.thumb_url || movie.poster_url);

            // === PHẦN INFO ===
            var info = $('<div></div>');

            // Poster + thông tin cơ bản
            var detailBox = $(
                '<div style="display:flex;gap:1.5em;padding:1em 0;">' +
                '  <div style="flex:0 0 150px;">' +
                '    <img src="' + poster + '" style="width:100%;border-radius:10px;display:block;" onerror="this.src=\'./img/img_broken.svg\'" />' +
                '  </div>' +
                '  <div style="flex:1;min-width:0;">' +
                '    <div style="font-size:1.6em;font-weight:700;color:#fff;margin-bottom:0.3em;">' + (movie.name || '') + '</div>' +
                '    <div style="font-size:0.95em;color:rgba(255,255,255,0.6);margin-bottom:0.8em;">' + (movie.origin_name || '') + '</div>' +
                '    <div style="display:flex;flex-wrap:wrap;gap:0.4em;margin-bottom:0.8em;">' +
                '      <span class="full-start__tag" style="background:rgba(255,255,255,0.12);padding:4px 10px;border-radius:6px;font-size:0.85em;">' + (movie.year || '') + '</span>' +
                '      <span class="full-start__tag" style="background:#e50914;padding:4px 10px;border-radius:6px;font-size:0.85em;font-weight:700;">' + (movie.quality || 'HD') + '</span>' +
                '      <span class="full-start__tag" style="background:rgba(255,255,255,0.12);padding:4px 10px;border-radius:6px;font-size:0.85em;">' + (movie.lang || 'Vietsub') + '</span>' +
                (movie.time ? '<span class="full-start__tag" style="background:rgba(255,255,255,0.12);padding:4px 10px;border-radius:6px;font-size:0.85em;">' + movie.time + '</span>' : '') +
                '    </div>' +
                '    <div style="font-size:0.9em;color:rgba(255,255,255,0.7);line-height:1.5;">' +
                '      <div><b>Trạng thái:</b> ' + (movie.episode_current || 'Full') + '</div>' +
                '      <div><b>Tổng tập:</b> ' + (movie.episode_total || 'N/A') + '</div>' +
                '      <div><b>Quốc gia:</b> ' + ((movie.country || []).map(function (c) { return c.name; }).join(', ') || 'N/A') + '</div>' +
                '      <div><b>Thể loại:</b> ' + ((movie.category || []).map(function (c) { return c.name; }).join(', ') || 'N/A') + '</div>' +
                '    </div>' +
                '  </div>' +
                '</div>'
            );

            info.append(detailBox);

            // Mô tả
            var desc = clearHtml(movie.content || '');
            if (desc) {
                var descBox = $('<div style="padding:0.5em 0 1em;font-size:0.92em;line-height:1.6;color:rgba(255,255,255,0.75);max-height:8em;overflow:hidden;">' + desc + '</div>');
                info.append(descBox);
            }

            scroll.append(info);

            // === PHẦN EPISODES ===
            if (episodes.length) {
                episodes.forEach(function (server, sIdx) {
                    var serverData = server.server_data || [];
                    if (!serverData.length) return;

                    var section = $('<div style="margin-top:1.2em;"></div>');
                    var sTitle = $('<div style="font-size:1.1em;font-weight:600;color:#fff;margin-bottom:0.6em;">' +
                        (server.server_name || ('Server ' + (sIdx + 1))) + ' (' + serverData.length + ' tập)' +
                        '</div>');
                    section.append(sTitle);

                    var epList = $('<div style="display:flex;flex-wrap:wrap;gap:0.5em;"></div>');

                    serverData.forEach(function (ep, i) {
                        var btn = $('<div class="selector" style="padding:0.6em 1.2em;border-radius:8px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;">' +
                            (ep.name || ('Tập ' + (i + 1))) +
                            '</div>');

                        btn.on('hover:focus', function () {
                            last = btn[0];
                            scroll.update(btn, true);
                            btn.css('background', 'rgba(255,255,255,0.25)');
                        });

                        btn.on('hover:blur', function () {
                            btn.css('background', 'rgba(255,255,255,0.1)');
                        });

                        btn.on('hover:enter', function () {
                            var url = ep.link_m3u8 || ep.link_embed;
                            if (!url) {
                                Lampa.Noty.show('Không có link phát');
                                return;
                            }

                            var playlist = serverData.map(function (item, idx) {
                                return {
                                    title: (movie.name || '') + ' - ' + (item.name || ('Tập ' + (idx + 1))),
                                    url: item.link_m3u8 || item.link_embed
                                };
                            });

                            Lampa.Player.play({
                                url: url,
                                title: (movie.name || '') + ' - ' + (ep.name || ''),
                                poster: poster
                            });

                            if (Lampa.Player.playlist) {
                                Lampa.Player.playlist(playlist);
                            }
                        });

                        epList.append(btn);
                    });

                    section.append(epList);
                    scroll.append(section);
                });
            } else {
                scroll.append($('<div class="torrent-empty"><div class="torrent-empty__title">Chưa có tập phim</div></div>'));
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

    // ========================================
    // SEARCH
    // ========================================
    function KKSearch(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var body = $('<div class="category-full"></div>');
        var keyword = object.search || '';
        var last;

        scroll.append(body);

        this.create = function () {
            var _this = this;
            _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(CONFIG.api_url + '/tim-kiem?keyword=' + encodeURIComponent(keyword), function (response) {
                _this.activity.loader(false);
                var data = response.data || response || {};
                var list = data.items || [];

                if (!list.length) {
                    body.append('<div class="torrent-empty"><div class="torrent-empty__title">Không tìm thấy: ' + keyword + '</div></div>');
                    _this.activity.toggle();
                    return;
                }

                list.forEach(function (item) {
                    var movie = toLampaCard(item);

                    var card = createCard(movie, function () {
                        Lampa.Activity.push({
                            url: '',
                            title: movie.title,
                            component: 'kkphim_full',
                            card: movie,
                            page: 1
                        });
                    }, function (target) {
                        last = target;
                        scroll.update($(target), true);
                    });

                    body.append(card);
                });

                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                body.append('<div class="torrent-empty"><div class="torrent-empty__title">Lỗi tìm kiếm</div></div>');
                _this.activity.toggle();
            });
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

    // ========================================
    // REGISTER
    // ========================================
    function addMenu() {
        var wait = function () {
            if (!$('.menu__list').length) return setTimeout(wait, 500);
            if ($('[data-action="kkphim"]').length) return;

            var item = $('<li class="menu__item selector" data-action="kkphim">' +
                '<div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v12h16V6H4zm2 2h3v3H6V8zm5 0h7v2h-7V8zm0 4h7v2h-7v-2zM6 12h3v3H6v-3z"/></svg></div>' +
                '<div class="menu__text">KKPhim</div>' +
                '</li>');

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
        if (!window.Lampa || !Lampa.Component) return setTimeout(init, 300);

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