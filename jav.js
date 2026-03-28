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

    var Utils = {
        imgProxy: function (url) {
            if (!url) return '';
            if (url.indexOf('http') === 0) return url;
            return 'https://phimimg.com/' + url;
        },
        categoryUrl: function (type, page) {
            if (type === 'phim-moi-cap-nhat') {
                return API_BASE + '/danh-sach/phim-moi-cap-nhat?page=' + page;
            }
            return API_BASE + '/v1/api/danh-sach/' + type + '?page=' + page + '&limit=24';
        },
        detailUrl: function (slug) {
            return API_BASE + '/phim/' + slug;
        },
        searchUrl: function (query) {
            return API_BASE + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&limit=24';
        }
    };

    // =================== CSS ===================
    function addStyles() {
        if (document.getElementById('kkkphim-css')) return;
        var s = document.createElement('style');
        s.id = 'kkkphim-css';
        s.textContent = [
            '.kkkphim-grid { display:flex; flex-wrap:wrap; padding:1em; gap:1em; }',
            '.kkkphim-card { width:160px; cursor:pointer; }',
            '.kkkphim-card.focus .kkkphim-card__img-wrap { border:3px solid #fff; }',
            '.kkkphim-card__img-wrap { position:relative; border-radius:0.5em; overflow:hidden; border:3px solid transparent; }',
            '.kkkphim-card__img { width:100%; height:230px; object-fit:cover; display:block; }',
            '.kkkphim-card__quality { position:absolute; top:5px; right:5px; background:rgba(255,140,0,0.9); color:#fff; font-size:0.7em; padding:2px 6px; border-radius:3px; font-weight:bold; }',
            '.kkkphim-card__ep { position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.75); color:#fff; font-size:0.7em; padding:3px; text-align:center; }',
            '.kkkphim-card__title { color:#fff; font-size:0.85em; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
            '.kkkphim-card__year { color:#888; font-size:0.75em; }',
            '.kkkphim-menu-wrap { padding:1.5em; }',
            '.kkkphim-menu-title { font-size:2em; font-weight:bold; color:#fff; text-align:center; margin-bottom:0.3em; }',
            '.kkkphim-menu-sub { color:#999; text-align:center; margin-bottom:1.5em; }',
            '.kkkphim-menu-btn { padding:0.8em 1.2em; color:#fff; font-size:1.1em; border-radius:0.3em; margin-bottom:2px; }',
            '.kkkphim-menu-btn.focus { background:rgba(255,140,0,0.6); }',
            '.kkkphim-detail-wrap { display:flex; padding:1.5em; gap:1.5em; }',
            '.kkkphim-detail-poster { width:200px; flex-shrink:0; }',
            '.kkkphim-detail-poster img { width:100%; border-radius:0.5em; }',
            '.kkkphim-detail-info { flex:1; }',
            '.kkkphim-detail-name { font-size:1.8em; font-weight:bold; color:#fff; }',
            '.kkkphim-detail-orig { font-size:1.1em; color:#999; margin-bottom:0.5em; }',
            '.kkkphim-detail-meta { display:flex; gap:0.5em; flex-wrap:wrap; margin-bottom:0.8em; }',
            '.kkkphim-detail-meta span { background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:3px; color:#ccc; font-size:0.85em; }',
            '.kkkphim-detail-desc { color:#bbb; line-height:1.5; margin-bottom:0.8em; }',
            '.kkkphim-server-name { font-size:1.2em; font-weight:bold; color:#ffaa00; padding:0.8em 0 0.3em; }',
            '.kkkphim-ep-grid { display:flex; flex-wrap:wrap; gap:0.5em; margin-bottom:1em; }',
            '.kkkphim-ep-btn { background:rgba(255,255,255,0.12); color:#fff; padding:0.5em 1em; border-radius:0.4em; min-width:50px; text-align:center; cursor:pointer; }',
            '.kkkphim-ep-btn.focus { background:rgba(255,140,0,0.7); }'
        ].join('\n');
        document.head.appendChild(s);
    }

    // =================== MAIN MENU COMPONENT ===================
    function KKKMainComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var active = false;

        this.create = function () {
            var wrap = document.createElement('div');
            wrap.className = 'kkkphim-menu-wrap';

            var title = document.createElement('div');
            title.className = 'kkkphim-menu-title';
            title.textContent = '🎬 KKKPhim';
            wrap.appendChild(title);

            var sub = document.createElement('div');
            sub.className = 'kkkphim-menu-sub';
            sub.textContent = 'Xem phim miễn phí chất lượng cao';
            wrap.appendChild(sub);

            categories.forEach(function (cat) {
                var btn = document.createElement('div');
                btn.className = 'selector kkkphim-menu-btn';
                btn.textContent = cat.title;

                btn.addEventListener('hover:enter', function () {
                    Lampa.Activity.push({
                        url: cat.url,
                        title: cat.title,
                        component: 'kkkphim_catalog',
                        page: 1
                    });
                });

                wrap.appendChild(btn);
            });

            scroll.append($(wrap));

            this.activity.loader(false);
            this.activity.toggle();
        };

        this.start = function () {
            if (active) return;
            active = true;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            scroll.destroy();
        };
    }

    // =================== CATALOG COMPONENT ===================
    function KKKCatalogComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var network = new Lampa.Reguest();
        var active = false;
        var page = 0;
        var loading = false;
        var category_url = object.url || 'phim-moi-cap-nhat';

        this.create = function () {
            var _this = this;

            scroll.minus();
            scroll.onWheel = function (step) {
                if (!step) _this.nextPage();
            };
            scroll.onEnd = function () {
                _this.nextPage();
            };

            this.nextPage();
        };

        this.nextPage = function () {
            if (loading) return;
            loading = true;
            page++;

            var _this = this;

            if (page === 1) this.activity.loader(true);

            var url = Utils.categoryUrl(category_url, page);

            network.clear();
            network.timeout(15000);
            network.silent(url, function (data) {
                _this.activity.loader(false);
                loading = false;

                var items = [];
                if (data && data.items) {
                    items = data.items;
                } else if (data && data.data && data.data.items) {
                    items = data.data.items;
                }

                if (items.length) {
                    _this.buildCards(items);
                    _this.activity.toggle();
                } else if (page === 1) {
                    _this.showEmpty();
                    _this.activity.toggle();
                }
            }, function () {
                _this.activity.loader(false);
                loading = false;
                if (page === 1) {
                    _this.showEmpty();
                    _this.activity.toggle();
                }
            });
        };

        this.buildCards = function (items) {
            var _this = this;
            var grid = document.createElement('div');
            grid.className = 'kkkphim-grid';

            items.forEach(function (item) {
                var card = document.createElement('div');
                card.className = 'selector kkkphim-card';

                var imgUrl = Utils.imgProxy(item.poster_url || item.thumb_url || '');
                var quality = item.quality || '';
                var epCurrent = item.episode_current || '';

                card.innerHTML =
                    '<div class="kkkphim-card__img-wrap">' +
                        '<img class="kkkphim-card__img" src="' + imgUrl + '" onerror="this.src=\'https://via.placeholder.com/160x230?text=No+Image\'" />' +
                        (quality ? '<div class="kkkphim-card__quality">' + quality + '</div>' : '') +
                        (epCurrent ? '<div class="kkkphim-card__ep">' + epCurrent + '</div>' : '') +
                    '</div>' +
                    '<div class="kkkphim-card__title">' + (item.name || item.origin_name || '') + '</div>' +
                    '<div class="kkkphim-card__year">' + (item.year || '') + '</div>';

                card.addEventListener('hover:enter', function () {
                    Lampa.Activity.push({
                        url: item.slug,
                        title: item.name || item.origin_name || '',
                        component: 'kkkphim_detail',
                        page: 1
                    });
                });

                grid.appendChild(card);
            });

            scroll.append($(grid));
        };

        this.showEmpty = function () {
            var empty = document.createElement('div');
            empty.style.padding = '2em';
            empty.style.color = '#fff';
            empty.style.textAlign = 'center';
            empty.style.fontSize = '1.2em';
            empty.textContent = 'Không tìm thấy phim nào';
            scroll.append($(empty));
        };

        this.start = function () {
            if (active) return;
            active = true;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // =================== DETAIL COMPONENT ===================
    function KKKDetailComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var network = new Lampa.Reguest();
        var active = false;
        var slug = object.url || '';

        this.create = function () {
            var _this = this;

            this.activity.loader(true);

            var url = Utils.detailUrl(slug);

            network.clear();
            network.timeout(15000);
            network.silent(url, function (data) {
                _this.activity.loader(false);

                if (data && data.movie) {
                    _this.buildDetail(data.movie, data.episodes || []);
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

        this.buildDetail = function (movie, episodes) {
            var _this = this;

            // Detail info
            var wrap = document.createElement('div');
            wrap.className = 'kkkphim-detail-wrap';

            var posterUrl = Utils.imgProxy(movie.poster_url || movie.thumb_url || '');
            var metaArr = [];
            if (movie.year) metaArr.push(movie.year);
            if (movie.quality) metaArr.push(movie.quality);
            if (movie.lang) metaArr.push(movie.lang);
            if (movie.episode_current) metaArr.push(movie.episode_current);
            if (movie.time) metaArr.push(movie.time);

            var genresText = (movie.category || []).map(function (c) { return c.name; }).join(', ');
            var countriesText = (movie.country || []).map(function (c) { return c.name; }).join(', ');

            // Remove HTML tags from content
            var desc = (movie.content || '').replace(/<[^>]*>/g, '');

            wrap.innerHTML =
                '<div class="kkkphim-detail-poster">' +
                    '<img src="' + posterUrl + '" onerror="this.src=\'https://via.placeholder.com/200x300?text=No+Image\'" />' +
                '</div>' +
                '<div class="kkkphim-detail-info">' +
                    '<div class="kkkphim-detail-name">' + (movie.name || '') + '</div>' +
                    '<div class="kkkphim-detail-orig">' + (movie.origin_name || '') + '</div>' +
                    '<div class="kkkphim-detail-meta">' +
                        metaArr.map(function (m) { return '<span>' + m + '</span>'; }).join('') +
                    '</div>' +
                    '<div class="kkkphim-detail-desc">' + desc + '</div>' +
                    (genresText ? '<div style="color:#888;font-size:0.85em;margin-bottom:4px;">Thể loại: ' + genresText + '</div>' : '') +
                    (countriesText ? '<div style="color:#888;font-size:0.85em;">Quốc gia: ' + countriesText + '</div>' : '') +
                '</div>';

            scroll.append($(wrap));

            // Episodes
            if (episodes && episodes.length) {
                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;

                    var serverWrap = document.createElement('div');
                    serverWrap.style.padding = '0 1.5em';

                    var serverName = document.createElement('div');
                    serverName.className = 'kkkphim-server-name';
                    serverName.textContent = '▶ ' + (server.server_name || 'Server');
                    serverWrap.appendChild(serverName);

                    var epGrid = document.createElement('div');
                    epGrid.className = 'kkkphim-ep-grid';

                    server.server_data.forEach(function (ep) {
                        var btn = document.createElement('div');
                        btn.className = 'selector kkkphim-ep-btn';
                        btn.textContent = ep.name || ep.slug || 'Tập';

                        btn.addEventListener('hover:enter', function () {
                            _this.playEp(ep, movie);
                        });

                        epGrid.appendChild(btn);
                    });

                    serverWrap.appendChild(epGrid);
                    scroll.append($(serverWrap));
                });
            }
        };

        this.playEp = function (ep, movie) {
            var url = ep.link_m3u8 || ep.link_embed || '';

            if (!url) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            if (url.indexOf('.m3u8') !== -1) {
                var item = {
                    title: (movie.name || 'KKKPhim') + ' - ' + (ep.name || ''),
                    url: url,
                    quality: {},
                    timeline: Lampa.Timeline.view(object.hash || '')
                };

                item.quality['auto'] = url;

                Lampa.Player.play(item);
                Lampa.Player.playlist([item]);
            } else {
                // Embed
                Lampa.Noty.show('Embed link - không hỗ trợ phát trực tiếp');
            }
        };

        this.showEmpty = function () {
            var empty = document.createElement('div');
            empty.style.padding = '2em';
            empty.style.color = '#fff';
            empty.style.textAlign = 'center';
            empty.style.fontSize = '1.2em';
            empty.textContent = 'Không tải được thông tin phim';
            scroll.append($(empty));
        };

        this.start = function () {
            if (active) return;
            active = true;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // =================== INIT ===================
    function initPlugin() {
        addStyles();

        // Register components
        Lampa.Component.add('kkkphim_main', KKKMainComponent);
        Lampa.Component.add('kkkphim_catalog', KKKCatalogComponent);
        Lampa.Component.add('kkkphim_detail', KKKDetailComponent);

        // Add menu item
        var ico = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>';

        var menuItem = $('<li class="menu__item selector" data-action="kkkphim">' +
            '<div class="menu__ico">' + ico + '</div>' +
            '<div class="menu__text">KKKPhim</div>' +
        '</li>');

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKKPhim',
                component: 'kkkphim_main',
                page: 1
            });
        });

        // Insert to menu
        $('.menu .menu__list').eq(0).append(menuItem);

        Lampa.Noty.show('✅ Plugin KKKPhim đã sẵn sàng!');
    }

    // =================== BOOT ===================
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                initPlugin();
            }
        });
    }

})();