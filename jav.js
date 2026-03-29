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

    function convertToLampaCard(item) {
        return {
            id: item._id || item.slug || Lampa.Utils.uid(),
            title: item.name || '',
            name: item.name || '',
            original_title: item.origin_name || '',
            original_name: item.origin_name || '',
            overview: clearHtml(item.content || item.description || ''),
            img: getImageUrl(item.poster_url || item.thumb_url),
            poster_path: getImageUrl(item.poster_url || item.thumb_url),
            backdrop_path: getImageUrl(item.thumb_url || item.poster_url),
            release_date: item.year ? item.year + '-01-01' : '',
            vote_average: 0,
            year: item.year || '',
            slug: item.slug || '',
            quality: item.quality || 'HD',
            lang: item.lang || 'Vietsub',
            episode_current: item.episode_current || '',
            episode_total: item.episode_total || '',
            time: item.time || '',
            country: item.country || [],
            category: item.category || [],
            media_type: 'movie',
            kkphim: true
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

    // Tạo card element giống Lampa mặc định
    function createCardElement(movie, onEnter, onFocus) {
        var card = $('<div class="card selector card--small"><div class="card__view"><img class="card__img" /><div class="card__prg"></div></div><div class="card__title">' + (movie.title || '') + '</div><div class="card__age">' + (movie.year || '') + '</div></div>');

        var img = card.find('.card__img');

        img.on('error', function () {
            img.attr('src', './img/img_broken.svg');
        });

        // Load ảnh
        if (movie.img || movie.poster_path) {
            img.attr('src', movie.img || movie.poster_path);
        } else {
            img.attr('src', './img/img_broken.svg');
        }

        // Thêm badge quality
        card.find('.card__view').append('<div class="card__quality" style="position:absolute;top:5px;left:5px;background:#e50914;color:#fff;font-size:0.7em;padding:2px 6px;border-radius:4px;font-weight:700;z-index:2;">' + (movie.quality || 'HD') + '</div>');

        if (movie.episode_current) {
            card.find('.card__view').append('<div style="position:absolute;bottom:5px;right:5px;background:rgba(0,0,0,0.75);color:#fff;font-size:0.65em;padding:2px 6px;border-radius:4px;z-index:2;">' + movie.episode_current + '</div>');
        }

        card.on('hover:enter', function () {
            if (onEnter) onEnter();
        });

        card.on('hover:focus', function () {
            if (onFocus) onFocus(card[0]);
        });

        return card;
    }

    // ========================
    //  MAIN - Trang chủ
    // ========================
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

            // Header tìm kiếm
            var header = $('<div class="selector" style="padding:15px 20px;margin-bottom:5px;font-size:1.1em;color:rgba(255,255,255,0.7);">🔍 Tìm kiếm phim KKPhim...</div>');
            header.on('hover:enter', function () {
                Lampa.Input.edit({ title: 'Tìm kiếm phim', value: '', free: true }, function (val) {
                    if (!val) return;
                    Lampa.Activity.push({
                        url: val,
                        title: 'Tìm: ' + val,
                        component: 'kkphim_search',
                        search: val,
                        page: 1
                    });
                });
            });
            header.on('hover:focus', function () {
                last = header[0];
                scroll.update(header, true);
            });
            scroll.append(header);

            _this.activity.loader(true);

            var loaded = 0;

            cats.forEach(function (cat) {
                network.silent(getApiUrl(cat.url, 1), function (response) {
                    var data = response.data || response || {};
                    var list = (data.items || []).slice(0, 12);

                    if (list.length) {
                        _this.buildLine(cat, list.map(convertToLampaCard));
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
            more.on('hover:focus', function () {
                last = more[0];
                scroll.update(more, true);
            });

            head.append(title);
            head.append(more);
            line.append(head);
            line.append(body);

            movies.forEach(function (movie) {
                var card = createCardElement(movie, function () {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie,
                        page: 1
                    });
                }, function (target) {
                    last = target;
                    scroll.update(line, true);
                });

                body.append(card);
            });

            scroll.append(line);
        };

        this.start = function () {
            var _this = this;
            if (Lampa.Activity.active().activity !== this.activity) return;

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

        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // ========================
    //  CATEGORY
    // ========================
    function KKCategory(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div class="category-full"><div class="category-full__body"></div></div>');
        var container = body.find('.category-full__body');
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

                if (!list.length && page === 1) {
                    scroll.append($('<div class="empty"><div class="empty__title">Không có dữ liệu</div></div>'));
                    _this.activity.toggle();
                    return;
                }

                list.forEach(function (item) {
                    var movie = convertToLampaCard(item);
                    var card = createCardElement(movie, function () {
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

                    container.append(card);
                });

                if (page < total_pages) {
                    var more = $('<div class="selector" style="width:100%;text-align:center;padding:20px;color:rgba(255,255,255,0.6);">Tải thêm trang ' + (page + 1) + '</div>');
                    more.on('hover:enter', function () {
                        more.remove();
                        page++;
                        _this.load();
                    });
                    more.on('hover:focus', function () {
                        last = more[0];
                        scroll.update(more, true);
                    });
                    container.append(more);
                }

                _this.activity.toggle();
            }, function () {
                loading = false;
                _this.activity.loader(false);
                _this.activity.toggle();
            });
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;

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

        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // ========================
    //  SEARCH
    // ========================
    function KKSearch(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div class="category-full"><div class="category-full__body"></div></div>');
        var container = body.find('.category-full__body');
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
                    scroll.append($('<div class="empty"><div class="empty__title">Không tìm thấy: ' + keyword + '</div></div>'));
                    _this.activity.toggle();
                    return;
                }

                list.forEach(function (item) {
                    var movie = convertToLampaCard(item);
                    var card = createCardElement(movie, function () {
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

                    container.append(card);
                });

                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                scroll.append($('<div class="empty"><div class="empty__title">Lỗi tìm kiếm</div></div>'));
                _this.activity.toggle();
            });
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;

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

        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // ========================
    //  FULL / DETAIL
    // ========================
    function KKFull(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
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
                    scroll.append($('<div class="empty"><div class="empty__title">Không tìm thấy phim</div></div>'));
                    _this.activity.toggle();
                    return;
                }

                _this.build(response);
                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                scroll.append($('<div class="empty"><div class="empty__title">Lỗi tải phim</div></div>'));
                _this.activity.toggle();
            });
        };

        this.build = function (data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];

            var poster = getImageUrl(movie.poster_url || movie.thumb_url);
            var backdrop = getImageUrl(movie.thumb_url || movie.poster_url);

            // Info section
            var info = $('<div style="padding:20px;"></div>');

            // Backdrop
            info.append('<div style="width:100%;height:200px;border-radius:12px;overflow:hidden;margin-bottom:15px;background:#222;"><img src="' + backdrop + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'"/></div>');

            // Title
            info.append('<div style="font-size:1.6em;font-weight:700;color:#fff;margin-bottom:5px;">' + (movie.name || '') + '</div>');
            info.append('<div style="font-size:1em;color:rgba(255,255,255,0.6);margin-bottom:12px;">' + (movie.origin_name || '') + '</div>');

            // Meta tags
            var meta = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
            meta += '<span style="padding:4px 10px;border-radius:20px;background:rgba(255,255,255,0.12);font-size:0.85em;">' + (movie.year || 'N/A') + '</span>';
            meta += '<span style="padding:4px 10px;border-radius:20px;background:#e50914;font-size:0.85em;font-weight:700;">' + (movie.quality || 'HD') + '</span>';
            meta += '<span style="padding:4px 10px;border-radius:20px;background:rgba(255,255,255,0.12);font-size:0.85em;">' + (movie.lang || 'Vietsub') + '</span>';
            if (movie.time) meta += '<span style="padding:4px 10px;border-radius:20px;background:rgba(255,255,255,0.12);font-size:0.85em;">' + movie.time + '</span>';
            meta += '</div>';
            info.append(meta);

            // Extra info
            var extra = '<div style="font-size:0.9em;line-height:1.7;color:rgba(255,255,255,0.8);margin-bottom:12px;">';
            extra += '<div><b>Trạng thái:</b> ' + (movie.episode_current || 'Full') + '</div>';
            extra += '<div><b>Tổng tập:</b> ' + (movie.episode_total || 'N/A') + '</div>';
            extra += '<div><b>Quốc gia:</b> ' + ((movie.country || []).map(function (c) { return c.name; }).join(', ') || 'N/A') + '</div>';
            extra += '<div><b>Thể loại:</b> ' + ((movie.category || []).map(function (c) { return c.name; }).join(', ') || 'N/A') + '</div>';
            extra += '</div>';
            info.append(extra);

            // Description
            info.append('<div style="font-size:0.9em;line-height:1.6;color:rgba(255,255,255,0.65);margin-bottom:15px;">' + clearHtml(movie.content || 'Không có mô tả') + '</div>');

            scroll.append(info);

            // Episodes
            if (episodes.length) {
                episodes.forEach(function (server, sIdx) {
                    var serverData = server.server_data || [];
                    if (!serverData.length) return;

                    var section = $('<div style="padding:0 20px 20px;"></div>');
                    section.append('<div style="font-size:1.1em;font-weight:600;color:#fff;margin-bottom:10px;">' + (server.server_name || ('Server ' + (sIdx + 1))) + ' (' + serverData.length + ' tập)</div>');

                    var list = $('<div style="display:flex;flex-wrap:wrap;gap:8px;"></div>');

                    serverData.forEach(function (ep, i) {
                        var btn = $('<div class="selector" style="padding:8px 16px;border-radius:8px;background:rgba(255,255,255,0.1);color:#fff;font-size:0.9em;">' + (ep.name || ('Tập ' + (i + 1))) + '</div>');

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

                            if (Lampa.Player.playlist) Lampa.Player.playlist(playlist);
                        });

                        btn.on('hover:focus', function () {
                            last = btn[0];
                            scroll.update(btn, true);
                        });

                        list.append(btn);
                    });

                    section.append(list);
                    scroll.append(section);
                });
            } else {
                scroll.append($('<div class="empty"><div class="empty__title">Phim chưa có tập</div></div>'));
            }
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;

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

        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // ========================
    //  REGISTER
    // ========================
    function addMenu() {
        var wait = function () {
            if (!$('.menu__list').length) return setTimeout(wait, 500);
            if ($('[data-action="kkphim"]').length) return;

            var item = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm1 2v10h14V7H5zm2 2h3v3H7V9zm4 0h6v1h-6V9zm0 2h6v1h-6v-1zm-4 3h10v1H7v-1z"/></svg></div><div class="menu__text">KKPhim</div></li>');

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

        console.log('KKPhim: Plugin initialized');
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();