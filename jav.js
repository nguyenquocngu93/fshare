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
        var poster = getImageUrl(item.poster_url || item.thumb_url);
        var backdrop = getImageUrl(item.thumb_url || item.poster_url);

        return {
            id: item._id || item.slug || Lampa.Utils.uid(),
            title: item.name || '',
            name: item.name || '',
            original_title: item.origin_name || '',
            original_name: item.origin_name || '',
            overview: clearHtml(item.content || item.description || ''),
            img: poster,
            poster_path: poster,
            poster: poster,
            backdrop_path: backdrop,
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

    // ==========================================
    //  MAIN
    // ==========================================
    function KKMain(object) {
        var comp = new Lampa.InteractionCategory(object);
        var scroll = comp.scroll;
        var last;

        var cats = [
            { title: 'Phim Mới Cập Nhật', url: 'new' },
            { title: 'Phim Lẻ', url: 'phim-le' },
            { title: 'Phim Bộ', url: 'phim-bo' },
            { title: 'Hoạt Hình', url: 'hoat-hinh' },
            { title: 'TV Shows', url: 'tv-shows' }
        ];

        comp.create = function () {
            var _this = this;
            this.activity.loader(true);

            var loaded = 0;
            var total = cats.length;

            cats.forEach(function (cat) {
                network.silent(getApiUrl(cat.url, 1), function (response) {
                    var data = response.data || response || {};
                    var list = (data.items || []).slice(0, 12);

                    if (list.length) {
                        buildLine(cat, list.map(toLampaCard));
                    }

                    loaded++;
                    if (loaded >= total) {
                        _this.activity.loader(false);
                        _this.activity.toggle();
                    }
                }, function () {
                    loaded++;
                    if (loaded >= total) {
                        _this.activity.loader(false);
                        _this.activity.toggle();
                    }
                });
            });
        };

        function buildLine(cat, movies) {
            var line_render = $('<div></div>');
            var line_head = $('<div class="items-line__head"><div class="items-line__title">' + cat.title + '</div></div>');
            var line_body = $('<div class="items-line__body"></div>');

            var more = $('<div class="items-line__more selector">Tất cả</div>');
            more.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkphim_category',
                    page: 1
                });
            });
            line_head.append(more);

            line_render.append(line_head);
            line_render.append(line_body);

            movies.forEach(function (movie) {
                var item = Lampa.Template.get('card', {
                    title: movie.title,
                    release_year: movie.release_date ? movie.release_date.substring(0, 4) : ''
                });

                var img = item.find('.card__img')[0] || item.find('img')[0];
                if (img) {
                    if (img.tagName === 'IMG') {
                        img.src = movie.poster_path || '';
                    } else {
                        $(img).css('background-image', 'url(' + (movie.poster_path || '') + ')');
                    }
                }

                item.addClass('selector');

                item.on('hover:focus', function () {
                    last = item[0];
                    scroll.update(item, true);
                });

                item.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie,
                        page: 1
                    });
                });

                line_body.append(item);
            });

            scroll.append(line_render);
        }

        comp.start = function () {
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

        return comp;
    }

    // ==========================================
    //  CATEGORY
    // ==========================================
    function KKCategory(object) {
        var comp = new Lampa.InteractionCategory(object);
        var scroll = comp.scroll;
        var body = $('<div class="category-full"></div>');
        var page = 1;
        var total_pages = 1;
        var loading = false;
        var last;

        scroll.append(body);

        comp.create = function () {
            loadPage();
        };

        function loadPage() {
            if (loading) return;
            loading = true;

            comp.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(getApiUrl(object.url || 'new', page), function (response) {
                loading = false;
                comp.activity.loader(false);

                var data = response.data || response || {};
                var list = data.items || [];
                total_pages = (data.params && data.params.pagination && data.params.pagination.totalPages) || 1;

                list.forEach(function (item) {
                    var movie = toLampaCard(item);

                    var card = Lampa.Template.get('card', {
                        title: movie.title,
                        release_year: movie.release_date ? movie.release_date.substring(0, 4) : ''
                    });

                    var img = card.find('.card__img')[0] || card.find('img')[0];
                    if (img) {
                        if (img.tagName === 'IMG') {
                            img.src = movie.poster_path || '';
                        } else {
                            $(img).css('background-image', 'url(' + (movie.poster_path || '') + ')');
                        }
                    }

                    card.addClass('selector');

                    card.on('hover:focus', function () {
                        last = card[0];
                        scroll.update(card, true);
                    });

                    card.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: '',
                            title: movie.title,
                            component: 'kkphim_full',
                            card: movie,
                            page: 1
                        });
                    });

                    body.append(card);
                });

                if (page < total_pages) {
                    var more = $('<div class="selector card-more"><div class="card-more__box"><div class="card-more__title">Tải thêm</div></div></div>');
                    more.on('hover:enter', function () {
                        more.remove();
                        page++;
                        loadPage();
                    });
                    body.append(more);
                }

                comp.activity.toggle();
            }, function () {
                loading = false;
                comp.activity.loader(false);
                comp.activity.toggle();
            });
        }

        comp.start = function () {
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

        return comp;
    }

    // ==========================================
    //  FULL / DETAIL
    // ==========================================
    function KKFull(object) {
        var comp = new Lampa.InteractionCategory(object);
        var scroll = comp.scroll;
        var card = object.card;
        var last;

        comp.create = function () {
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

                buildDetail(response);
                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                scroll.append($('<div class="empty"><div class="empty__title">Lỗi tải dữ liệu</div></div>'));
                _this.activity.toggle();
            });
        };

        function buildDetail(data) {
            var movie = data.movie;
            var episodes = data.episodes || [];

            var poster = getImageUrl(movie.poster_url || movie.thumb_url);
            var backdrop = getImageUrl(movie.thumb_url || movie.poster_url);

            // Info
            var info = $('<div class="full-start"></div>');

            info.append('<div class="full-start__background" style="background-image:url(' + backdrop + ')"></div>');

            var body_info = $('<div class="full-start__body"></div>');

            body_info.append('<div class="full-start__poster"><img src="' + poster + '" /></div>');

            var right = $('<div class="full-start__right"></div>');
            right.append('<div class="full-start__name">' + (movie.name || '') + '</div>');
            right.append('<div class="full-start__tagline">' + (movie.origin_name || '') + '</div>');

            var tags = $('<div class="full-start__tags"></div>');
            if (movie.year) tags.append('<div class="full-start__tag"><img src="./img/icon_star.svg" /><span>' + movie.year + '</span></div>');
            if (movie.quality) tags.append('<div class="full-start__tag"><span>' + movie.quality + '</span></div>');
            if (movie.lang) tags.append('<div class="full-start__tag"><span>' + movie.lang + '</span></div>');
            if (movie.time) tags.append('<div class="full-start__tag"><span>' + movie.time + '</span></div>');
            right.append(tags);

            var countries = (movie.country || []).map(function (c) { return c.name; }).join(', ');
            var genres = (movie.category || []).map(function (c) { return c.name; }).join(', ');

            if (countries) right.append('<div class="full-start__details"><span>Quốc gia: ' + countries + '</span></div>');
            if (genres) right.append('<div class="full-start__details"><span>Thể loại: ' + genres + '</span></div>');

            right.append('<div class="full-start__details"><span>Trạng thái: ' + (movie.episode_current || 'Full') + '</span></div>');

            var desc = clearHtml(movie.content || '');
            if (desc) right.append('<div class="full-start__text">' + desc + '</div>');

            body_info.append(right);
            info.append(body_info);
            scroll.append(info);

            // Episodes
            if (episodes.length) {
                episodes.forEach(function (server, sIdx) {
                    var serverData = server.server_data || [];
                    if (!serverData.length) return;

                    var section = $('<div></div>');
                    section.append('<div class="items-line__head"><div class="items-line__title">' + (server.server_name || ('Server ' + (sIdx + 1))) + ' (' + serverData.length + ' tập)</div></div>');

                    var epList = $('<div class="items-line__body" style="flex-wrap:wrap;"></div>');

                    serverData.forEach(function (ep, i) {
                        var btn = $('<div class="selector tag-item" style="padding:10px 18px;margin:4px;">' + (ep.name || ('Tập ' + (i + 1))) + '</div>');

                        btn.on('hover:focus', function () {
                            last = btn[0];
                            scroll.update(btn, true);
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

                            if (Lampa.Player.playlist) Lampa.Player.playlist(playlist);
                        });

                        epList.append(btn);
                    });

                    section.append(epList);
                    scroll.append(section);
                });
            }
        }

        comp.start = function () {
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

        return comp;
    }

    // ==========================================
    //  SEARCH
    // ==========================================
    function KKSearch(object) {
        var comp = new Lampa.InteractionCategory(object);
        var scroll = comp.scroll;
        var body = $('<div class="category-full"></div>');
        var keyword = object.search || '';
        var last;

        scroll.append(body);

        comp.create = function () {
            var _this = this;
            _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(CONFIG.api_url + '/tim-kiem?keyword=' + encodeURIComponent(keyword), function (response) {
                _this.activity.loader(false);

                var data = response.data || response || {};
                var list = data.items || [];

                if (!list.length) {
                    body.append('<div class="empty"><div class="empty__title">Không tìm thấy: ' + keyword + '</div></div>');
                    _this.activity.toggle();
                    return;
                }

                list.forEach(function (item) {
                    var movie = toLampaCard(item);

                    var card_el = Lampa.Template.get('card', {
                        title: movie.title,
                        release_year: movie.release_date ? movie.release_date.substring(0, 4) : ''
                    });

                    var img = card_el.find('.card__img')[0] || card_el.find('img')[0];
                    if (img) {
                        if (img.tagName === 'IMG') {
                            img.src = movie.poster_path || '';
                        } else {
                            $(img).css('background-image', 'url(' + (movie.poster_path || '') + ')');
                        }
                    }

                    card_el.addClass('selector');

                    card_el.on('hover:focus', function () {
                        last = card_el[0];
                        scroll.update(card_el, true);
                    });

                    card_el.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: '',
                            title: movie.title,
                            component: 'kkphim_full',
                            card: movie,
                            page: 1
                        });
                    });

                    body.append(card_el);
                });

                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                body.append('<div class="empty"><div class="empty__title">Lỗi tìm kiếm</div></div>');
                _this.activity.toggle();
            });
        };

        comp.start = function () {
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

        return comp;
    }

    // ==========================================
    //  MENU
    // ==========================================
    function addMenu() {
        var wait = function () {
            if (!$('.menu__list').length) return setTimeout(wait, 500);
            if ($('[data-action="kkphim"]').length) return;

            var item = $('<li class="menu__item selector" data-action="kkphim">'
                + '<div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm2 2v10h12V7H6z"/></svg></div>'
                + '<div class="menu__text">KKPhim</div>'
                + '</li>');

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

    // ==========================================
    //  INIT
    // ==========================================
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