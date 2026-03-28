(function () {
    'use strict';

    var API_HOST = 'https://phimapi.com';

    // =============================================
    // UTILS
    // =============================================
    function fixImg(url, cdn) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return (cdn || API_HOST) + '/' + url;
    }

    function stripTags(s) {
        if (!s) return '';
        return $('<div>').html(s).text();
    }

    // Tạo card element theo chuẩn Lampa
    function createCard(item, cdn) {
        var poster = fixImg(item.poster_url || item.thumb_url, cdn);

        // Dùng card template chuẩn Lampa
        var card = Lampa.Template.get('card', {
            title: item.name || '',
            release_year: item.year || ''
        });

        // Set poster
        card.find('.card__img').css('background-image', 'url(' + poster + ')');

        // Thêm vote/quality badge
        if (item.quality) {
            card.find('.card__view').append('<div class="card__quality" style="position:absolute;top:0.5em;left:0.5em;background:rgba(118,75,162,0.9);color:#fff;font-size:0.7em;font-weight:700;padding:0.2em 0.5em;border-radius:0.3em;z-index:5;">' + item.quality + '</div>');
        }

        // Episode tag
        if (item.episode_current) {
            card.find('.card__view').append('<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.85));color:#fff;font-size:0.7em;font-weight:600;text-align:center;padding:1.2em 0.4em 0.3em;z-index:5;">' + item.episode_current + '</div>');
        }

        // Hiện tên gốc bên dưới
        if (item.origin_name) {
            card.find('.card__title').after('<div class="card__orig-title" style="font-size:0.8em;color:rgba(255,255,255,0.35);padding:0 0.3em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + item.origin_name + '</div>');
        }

        // Click event
        card.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: item.name || '',
                component: 'kkphim_info',
                slug: item.slug
            });
        });

        return card;
    }

    // =============================================
    // COMPONENT: HOME (kkphim_main)
    // =============================================
    Lampa.Component.add('kkphim_main', function (object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div class="category-full"></div>');
        var loaded = 0;

        var cats = [
            { title: 'Phim Mới Cập Nhật', path: '/danh-sach/phim-moi-cap-nhat', v1: false },
            { title: 'Phim Bộ', path: '/v1/api/danh-sach/phim-bo', v1: true },
            { title: 'Phim Lẻ', path: '/v1/api/danh-sach/phim-le', v1: true },
            { title: 'Hoạt Hình', path: '/v1/api/danh-sach/hoat-hinh', v1: true },
            { title: 'TV Shows', path: '/v1/api/danh-sach/tv-shows', v1: true },
            { title: 'Phim Vietsub', path: '/v1/api/danh-sach/phim-vietsub', v1: true },
            { title: 'Phim Thuyết Minh', path: '/v1/api/danh-sach/phim-thuyet-minh', v1: true },
            { title: 'Phim Lồng Tiếng', path: '/v1/api/danh-sach/phim-long-tieng', v1: true }
        ];

        function loadCat(cat) {
            // Tạo section theo chuẩn Lampa
            var section = $('<div class="items-line"></div>');
            var head = $('<div class="items-line__head"></div>');
            var title = $('<div class="items-line__title">' + cat.title + '</div>');
            var more = $('<div class="items-line__more selector">Xem thêm ›</div>');

            more.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: cat.title,
                    component: 'kkphim_category',
                    page: 1,
                    cat_path: cat.path,
                    cat_v1: cat.v1
                });
            });

            head.append(title);
            head.append(more);
            section.append(head);

            var body_line = $('<div class="items-line__body"></div>');
            section.append(body_line);
            body.append(section);

            // Load API
            var params = cat.v1 ? { page: 1, limit: 12 } : { page: 1 };
            var url = API_HOST + cat.path;
            var q = [];
            for (var k in params) q.push(k + '=' + params[k]);
            url += '?' + q.join('&');

            $.ajax({
                url: url,
                dataType: 'json',
                timeout: 15000,
                success: function (res) {
                    var items = [], cdn = '';

                    if (cat.v1 && res && res.data) {
                        items = res.data.items || [];
                        cdn = res.data.APP_DOMAIN_CDN_IMAGE || '';
                    } else if (res) {
                        items = res.items || [];
                    }

                    items.forEach(function (item) {
                        body_line.append(createCard(item, cdn));
                    });

                    done();
                },
                error: function () {
                    done();
                }
            });
        }

        function done() {
            loaded++;
            if (loaded >= cats.length) {
                object.activity.loader(false);
                object.activity.toggle();
            }
        }

        this.create = function () {
            object.activity.loader(true);
            scroll.minus();
            scroll.append(body);
            cats.forEach(loadCat);
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
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
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () { scroll.destroy(); };
    });

    // =============================================
    // COMPONENT: INFO (kkphim_info)
    // Dùng layout giống Lampa full info
    // =============================================
    Lampa.Component.add('kkphim_info', function (object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var html = $('<div></div>');

        this.create = function () {
            var _this = this;
            object.activity.loader(true);
            scroll.minus();
            scroll.append(html);

            $.ajax({
                url: API_HOST + '/phim/' + object.slug,
                dataType: 'json',
                timeout: 15000,
                success: function (res) {
                    object.activity.loader(false);
                    if (res && res.movie) {
                        _this.build(res.movie, res.episodes || []);
                        object.activity.toggle();
                    } else {
                        _this.empty();
                    }
                },
                error: function () {
                    object.activity.loader(false);
                    _this.empty();
                }
            });
        };

        this.empty = function () {
            var emp = new Lampa.Empty();
            html.append(emp.render());
            object.activity.toggle();
        };

        this.build = function (m, episodes) {
            var poster = m.poster_url || m.thumb_url || '';
            var thumb = m.thumb_url || m.poster_url || '';
            var desc = stripTags(m.content || '');

            // ===== FULL INFO LAYOUT (Lampa style) =====
            var info = $('<div class="full-start"></div>');

            // Background
            var background = $('<div class="full-start__background"></div>');
            background.css('background-image', 'url(' + thumb + ')');
            info.append(background);

            var body = $('<div class="full-start__body"></div>');

            // Poster
            var left = $('<div class="full-start__left"></div>');
            var img = $('<div class="full-start__img selector"></div>');
            img.css('background-image', 'url(' + poster + ')');
            left.append(img);
            body.append(left);

            // Right side info
            var right = $('<div class="full-start__right"></div>');

            // Title
            right.append('<div class="full-start__title">' + (m.name || '') + '</div>');
            if (m.origin_name) {
                right.append('<div class="full-start__tagline">' + m.origin_name + '</div>');
            }

            // Tags
            var tags = $('<div class="full-start__tags"></div>');
            if (m.year) tags.append('<div class="full-start__tag"><img src="./img/icon_star.svg" /> ' + m.year + '</div>');
            if (m.quality) tags.append('<div class="full-start__tag"><span style="color:#7b68ee;font-weight:700;">' + m.quality + '</span></div>');
            if (m.time) tags.append('<div class="full-start__tag">' + m.time + '</div>');
            if (m.lang) tags.append('<div class="full-start__tag">' + m.lang + '</div>');
            if (m.episode_current) tags.append('<div class="full-start__tag">' + m.episode_current + '</div>');
            right.append(tags);

            // Genres
            if (m.category && m.category.length) {
                var genreText = m.category.map(function (g) { return g.name; }).join(', ');
                right.append('<div class="full-start__genre">' + genreText + '</div>');
            }

            // Country
            if (m.country && m.country.length) {
                var countryText = m.country.map(function (c) { return c.name; }).join(', ');
                right.append('<div class="full-start__country" style="font-size:1.1em;color:rgba(255,255,255,0.5);margin-bottom:0.5em;">🌍 ' + countryText + '</div>');
            }

            // Director
            if (m.director && m.director.length && m.director[0]) {
                right.append('<div style="font-size:1.1em;color:rgba(255,255,255,0.5);margin-bottom:0.3em;">🎬 Đạo diễn: ' + m.director.join(', ') + '</div>');
            }

            // Actor
            if (m.actor && m.actor.length && m.actor[0]) {
                right.append('<div style="font-size:1.05em;color:rgba(255,255,255,0.45);margin-bottom:0.5em;">🎭 ' + m.actor.slice(0, 8).join(', ') + (m.actor.length > 8 ? '...' : '') + '</div>');
            }

            // View count
            if (m.view) {
                right.append('<div style="font-size:1em;color:rgba(255,255,255,0.4);margin-bottom:0.5em;">👁 ' + Number(m.view).toLocaleString() + ' lượt xem</div>');
            }

            // Description
            if (desc) {
                right.append('<div class="full-start__descr">' + desc + '</div>');
            }

            body.append(right);
            info.append(body);
            html.append(info);

            // ===== BUTTONS =====
            var btns = $('<div class="full-start__buttons" style="display:flex;gap:0.7em;flex-wrap:wrap;padding:1em 1.5em;"></div>');

            // Play
            var playBtn = Lampa.Template.get('full_start_button', {
                title: 'Phát Phim',
                stype: ''
            });
            playBtn.find('.full-start__button-img').html('<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>');
            playBtn.addClass('selector');
            playBtn.on('hover:enter', function () {
                if (episodes.length && episodes[0].server_data && episodes[0].server_data.length) {
                    doPlay(m, episodes[0].server_data[0]);
                } else {
                    Lampa.Noty.show('Chưa có tập phim');
                }
            });
            btns.append(playBtn);

            // Trailer
            if (m.trailer_url) {
                var trailerBtn = Lampa.Template.get('full_start_button', {
                    title: 'Trailer',
                    stype: ''
                });
                trailerBtn.find('.full-start__button-img').html('<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.5 7.5v9l7-4.5z"/></svg>');
                trailerBtn.addClass('selector');
                trailerBtn.on('hover:enter', function () {
                    var u = m.trailer_url;
                    if (u.indexOf('youtube.com/watch') > -1) {
                        var v = u.split('v=')[1];
                        if (v) u = 'https://www.youtube.com/embed/' + v.split('&')[0];
                    }
                    window.open(u);
                });
                btns.append(trailerBtn);
            }

            // Bookmark
            var favBtn = Lampa.Template.get('full_start_button', {
                title: 'Yêu thích',
                stype: ''
            });
            favBtn.find('.full-start__button-img').html('<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg>');
            favBtn.addClass('selector');
            favBtn.on('hover:enter', function () {
                Lampa.Noty.show('Đã thêm vào yêu thích!');
            });
            btns.append(favBtn);

            html.append(btns);

            // ===== EPISODES =====
            if (episodes.length) {
                var totalEps = 0;
                episodes.forEach(function (s) { totalEps += (s.server_data || []).length; });

                // Episode section header
                html.append('<div class="items-line__head" style="padding:0 1.5em;"><div class="items-line__title">Danh sách tập (' + totalEps + ' tập)</div></div>');

                // Server tabs
                if (episodes.length > 1) {
                    var srvLine = $('<div style="display:flex;flex-wrap:wrap;gap:0.5em;padding:0 1.5em;margin-bottom:1em;"></div>');
                    episodes.forEach(function (srv, si) {
                        var tab = $('<div class="selector" style="padding:0.5em 1.2em;border-radius:0.5em;font-size:1.1em;background:' + (si === 0 ? 'rgba(118,75,162,0.85)' : 'rgba(255,255,255,0.06)') + ';color:' + (si === 0 ? '#fff' : 'rgba(255,255,255,0.5)') + ';border:1px solid rgba(255,255,255,0.08);">' + (srv.server_name || 'Server ' + (si + 1)) + '</div>');
                        tab.on('hover:enter', function () {
                            srvLine.find('.selector').css({ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' });
                            $(this).css({ background: 'rgba(118,75,162,0.85)', color: '#fff' });
                            html.find('.kkep-grid').hide();
                            html.find('.kkep-grid[data-srv="' + si + '"]').css('display', 'flex');
                        });
                        srvLine.append(tab);
                    });
                    html.append(srvLine);
                }

                // Episode grids
                episodes.forEach(function (srv, si) {
                    var grid = $('<div class="kkep-grid" data-srv="' + si + '" style="display:' + (si === 0 ? 'flex' : 'none') + ';flex-wrap:wrap;gap:0.5em;padding:0 1.5em 1em;"></div>');

                    (srv.server_data || []).forEach(function (ep) {
                        var btn = $('<div class="selector" style="min-width:3.5em;padding:0.6em 0.9em;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);text-align:center;border-radius:0.5em;font-size:1.05em;font-weight:600;">' + (ep.name || '?') + '</div>');

                        btn.on('hover:enter', function () {
                            btn.css('opacity', '0.4');
                            doPlay(m, ep);
                        });
                        grid.append(btn);
                    });
                    html.append(grid);
                });
            }

            // ===== RELATED - Phim cùng thể loại =====
            if (m.category && m.category.length) {
                var firstGenre = m.category[0];
                var relSection = $('<div class="items-line"></div>');
                relSection.append('<div class="items-line__head"><div class="items-line__title">Phim cùng thể loại: ' + firstGenre.name + '</div></div>');
                var relBody = $('<div class="items-line__body"></div>');
                relSection.append(relBody);
                html.append(relSection);

                $.ajax({
                    url: API_HOST + '/v1/api/the-loai/' + firstGenre.slug + '?page=1&limit=12',
                    dataType: 'json',
                    timeout: 12000,
                    success: function (res) {
                        var items = [], cdn = '';
                        if (res && res.data) {
                            items = res.data.items || [];
                            cdn = res.data.APP_DOMAIN_CDN_IMAGE || '';
                        }
                        items.forEach(function (item) {
                            if (item.slug !== m.slug) {
                                relBody.append(createCard(item, cdn));
                            }
                        });
                    }
                });
            }
        };

        function doPlay(movie, ep) {
            var link = ep.link_m3u8 || ep.link_embed || '';
            if (!link) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }
            var t = (movie.name || '') + (ep.name ? ' - Tập ' + ep.name : '');

            // Tạo playlist tất cả tập
            var playlist = [];
            // Tìm trong episodes hiện tại (nếu có)

            Lampa.Player.play({
                title: t,
                url: link,
                quality: false,
                subtitles: false
            });

            Lampa.Player.playlist([{
                title: t,
                url: link
            }]);
        }

        this.start = function () {
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
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () { scroll.destroy(); };
    });

    // =============================================
    // COMPONENT: CATEGORY + INFINITE SCROLL
    // =============================================
    Lampa.Component.add('kkphim_category', function (object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div class="category-full"></div>');
        var grid = $('<div class="items-cards" style="display:flex;flex-wrap:wrap;padding:0 1.5em;"></div>');
        var loading = $('<div style="text-align:center;padding:2em;color:rgba(255,255,255,0.3);font-size:1.2em;display:none;">Đang tải...</div>');

        var curPage = 1;
        var isLoading = false;
        var allDone = false;
        var timer = null;

        // Title
        body.append('<div class="items-line__head" style="padding:0 1.5em;"><div class="items-line__title">' + (object.title || 'Danh mục') + '</div></div>');
        body.append(grid);
        body.append(loading);

        this.create = function () {
            object.activity.loader(true);
            scroll.minus();
            scroll.append(body);
            this.load(1);
            this.monitor();
        };

        this.load = function (page) {
            var _this = this;
            if (isLoading || allDone) return;
            isLoading = true;
            loading.show();

            var params = { page: page };
            if (object.cat_v1) params.limit = 24;

            var url = API_HOST + object.cat_path;
            var q = [];
            for (var k in params) q.push(k + '=' + params[k]);
            url += '?' + q.join('&');

            $.ajax({
                url: url,
                dataType: 'json',
                timeout: 15000,
                success: function (res) {
                    isLoading = false;
                    loading.hide();
                    object.activity.loader(false);

                    var items = [], cdn = '', totalPages = 1;

                    if (object.cat_v1 && res && res.data) {
                        items = res.data.items || [];
                        cdn = res.data.APP_DOMAIN_CDN_IMAGE || '';
                        if (res.data.params && res.data.params.pagination) {
                            totalPages = res.data.params.pagination.totalPages || 1;
                        }
                    } else if (res) {
                        items = res.items || [];
                        if (res.pagination) totalPages = res.pagination.totalPages || 1;
                    }

                    if (!items.length) {
                        allDone = true;
                        if (curPage <= 1) _this.showEmpty();
                        return;
                    }

                    items.forEach(function (item) {
                        grid.append(createCard(item, cdn));
                    });

                    curPage = page;
                    if (curPage >= totalPages) allDone = true;

                    object.activity.toggle();
                },
                error: function () {
                    isLoading = false;
                    loading.hide();
                    object.activity.loader(false);
                    if (curPage <= 1) _this.showEmpty();
                }
            });
        };

        this.showEmpty = function () {
            var emp = new Lampa.Empty();
            body.append(emp.render());
            object.activity.toggle();
        };

        this.monitor = function () {
            var _this = this;
            timer = setInterval(function () {
                if (allDone || isLoading) return;

                var sBody = scroll.render().find('.scroll__body');
                if (!sBody.length) return;
                var el = sBody[0];
                var t = el.style.transform || '';
                var match = t.match(/translateY\(([^)]+)\)/);
                var y = match ? Math.abs(parseFloat(match[1])) : 0;
                var h = el.scrollHeight || el.offsetHeight;
                var vh = scroll.render()[0].clientHeight || scroll.render()[0].offsetHeight;

                if (h > 0 && y + vh + 600 >= h) {
                    _this.load(curPage + 1);
                }
            }, 300);
        };

        this.start = function () {
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
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {
            if (timer) clearInterval(timer);
        };
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            if (timer) clearInterval(timer);
            scroll.destroy();
        };
    });

    // =============================================
    // MENU
    // =============================================
    function addMenu() {
        var ico = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 8H2v12c0 1.1.9 2 2 2h12v-2H4V8z"/><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 12.5v-9l6 4.5-6 4.5z"/></svg>';

        var item = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico">' + ico + '</div><div class="menu__text">KKPhim</div></li>');

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(item);
    }

    // =============================================
    // INIT
    // =============================================
    function init() {
        addMenu();
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();