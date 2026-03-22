(function () {
    'use strict';

    var SOURCE_NAME = 'kkphim';
    var CAT_NAME    = 'KKPhim';
    var BASE_URL    = 'https://phimapi.com';
    var IMG_URL     = 'https://phimimg.com/';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    // ==========================================
    // HELPERS
    // ==========================================
    function getPoster(url) {
        if (!url) return '';
        return url.indexOf('http') === 0 ? url : IMG_URL + url;
    }

    function toNameArray(arr) {
        if (!arr || !arr.length) return [];
        return arr.map(function (item) {
            if (typeof item === 'string') return { id: 0, name: item };
            return { id: item.id || 0, name: item.name || '' };
        });
    }

    function normalizeItem(item) {
        var poster = getPoster(item.poster_url);
        var thumb  = getPoster(item.thumb_url || item.poster_url);

        var kkType = item.type || '';

        return {
            id:               item.slug,
            title:            item.name,
            name:             item.name,
            original_title:   item.origin_name || item.name,
            original_name:    item.origin_name || item.name,
            img:              poster,
            poster:           poster,
            poster_path:      '',
            backdrop_path:    '',
            background_image: thumb,
            release_date:     item.year ? item.year + '-01-01' : '',
            first_air_date:   item.year ? item.year + '-01-01' : '',
            vote_average:     0,
            overview:         item.content || '',
            genres:           toNameArray(item.category || []),
            countries:        toNameArray(item.country  || []),
            production_companies: [],
            production_countries: [],
            spoken_languages: [],

            source:           SOURCE_NAME,
            kkphim_slug:      item.slug,
            kkphim_type:      kkType,
        };
    }

    // ==========================================
    // DANH SÁCH DANH MỤC (dùng cho category & xem thêm)
    // ==========================================
    var CATEGORIES = [
        { url: '/danh-sach/phim-moi-cap-nhat', title: 'Phim mới cập nhật', v1: false },
        { url: '/v1/api/danh-sach/phim-le',    title: 'Phim lẻ',           v1: true  },
        { url: '/v1/api/danh-sach/phim-bo',    title: 'Phim bộ',           v1: true  },
        { url: '/v1/api/danh-sach/hoat-hinh',  title: 'Hoạt hình',         v1: true  },
        { url: '/v1/api/danh-sach/tv-shows',   title: 'TV Shows',          v1: true  },
    ];

    // Hàm fetch 1 trang từ URL (tự nhận biết cấu trúc v1 hay legacy)
    function fetchPage(url, page, callback, onError) {
        var network = new Lampa.Reguest();
        network.silent(BASE_URL + url + '?page=' + page, function (data) {
            var items      = [];
            var totalPages = 1;
            var totalItems = 0;

            if (data.items) {
                // legacy format: /danh-sach/phim-moi-cap-nhat
                items      = data.items.map(normalizeItem);
                totalPages = data.pagination ? data.pagination.totalPages : 1;
                totalItems = data.pagination ? data.pagination.totalItems : items.length;
            } else if (data.data && data.data.items) {
                // v1 format
                items      = data.data.items.map(normalizeItem);
                totalPages = (data.data.params && data.data.params.pagination)
                             ? data.data.params.pagination.totalPages : 1;
                totalItems = (data.data.params && data.data.params.pagination)
                             ? data.data.params.pagination.totalItems : items.length;
            }

            callback({ items: items, page: page, totalPages: totalPages, totalItems: totalItems });
        }, onError || function () {});
    }

    // ==========================================
    // API SERVICE
    // ==========================================
    function KKPhimApi() {
        var self     = this;
        self.network = new Lampa.Reguest();

        // list: dùng cho component 'items' (có phân trang / infinite scroll)
        // params.cat_url: URL danh mục cụ thể (optional)
        self.list = function (params, onComplete, onError) {
            var page   = params.page || 1;
            var catUrl = params.cat_url || '/danh-sach/phim-moi-cap-nhat';

            fetchPage(catUrl, page, function (res) {
                onComplete({
                    results:       res.items,
                    page:          res.page,
                    total_pages:   res.totalPages,
                    total_results: res.totalItems,
                });
            }, onError);
        };

        self.category = function (params, onComplete, onError) {
            var parts = CATEGORIES.map(function (cat) {
                return function (callback) {
                    fetchPage(cat.url, 1, function (res) {
                        callback({
                            title:         cat.title,
                            results:       res.items,
                            url:           cat.url,
                            page:          1,
                            total_pages:   res.totalPages,
                            total_results: res.totalItems,
                            source:        SOURCE_NAME,
                            // ✅ Truyền thêm để "Xem thêm" biết URL nào cần load
                            cat_url:       cat.url,
                        });
                    }, function () {
                        callback({ title: cat.title, results: [], url: cat.url, cat_url: cat.url });
                    });
                };
            });

            Lampa.Api.partNext(parts, 2, onComplete, onError);
        };

        self.full = function (params, onComplete, onError) {
            var card = params.card || {};
            var slug = card.kkphim_slug || card.id;

            self.network.silent(BASE_URL + '/phim/' + slug, function (data) {
                var movie    = data.movie    || {};
                var episodes = data.episodes || [];

                var seasons = [];
                episodes.forEach(function (server, si) {
                    var eps = (server.server_data || []).map(function (ep, ei) {
                        return {
                            episode_number: ei + 1,
                            season_number:  si + 1,
                            name:           ep.name || ('Tập ' + (ei + 1)),
                            air_date:       '',
                            link_m3u8:      ep.link_m3u8  || '',
                            link_embed:     ep.link_embed || '',
                        };
                    });
                    seasons.push({
                        season_number: si + 1,
                        name:          server.server_name || ('Server ' + (si + 1)),
                        episodes:      eps,
                    });
                });

                var result               = normalizeItem(movie);
                result.overview          = movie.content || '';
                result.number_of_seasons = seasons.length || 1;
                result.seasons           = seasons;
                result.kkphim_episodes   = episodes;

                onComplete({ movie: result });
            }, onError);
        };

        self.search = function (params, onComplete, onError) {
            var query = params.query || '';
            self.network.silent(
                BASE_URL + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query),
                function (data) {
                    var items = (data.data && data.data.items)
                                ? data.data.items.map(normalizeItem) : [];
                    onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
                }, onError
            );
        };

        self.seasons = function (params, onComplete, onError) {
            var card = params.card || {};
            if (card.seasons && card.seasons.length) {
                onComplete({ seasons: card.seasons });
            } else {
                self.full({ card: card }, function (res) {
                    onComplete({ seasons: (res.movie && res.movie.seasons) || [] });
                }, onError);
            }
        };

        self.person = function (p, ok, err) { err('not supported'); };
        self.clear  = function () { self.network.clear(); };
    }

    // ==========================================
    // COMPONENT: KKPHIM DANH SÁCH (Infinite Scroll)
    // ==========================================
    function KKPhimListComponent(object) {
        var self       = this;
        var catUrl     = object.cat_url || '/danh-sach/phim-moi-cap-nhat';
        var catTitle   = object.title   || 'KKPhim';
        var curPage    = 1;
        var totalPages = 1;
        var loading    = false;
        var network    = new Lampa.Reguest();

        var $html = $(
            '<div class="kkp-list-wrap">' +
            '  <div class="kkp-grid" style="' +
            '    display:grid;' +
            '    grid-template-columns:repeat(auto-fill,minmax(150px,1fr));' +
            '    gap:14px;' +
            '    padding:1em 1.5em;' +
            '  "></div>' +
            '  <div class="kkp-loader" style="text-align:center;padding:1.5em;display:none;">' +
            '    <span style="opacity:0.5;font-size:0.9em;">Đang tải...</span>' +
            '  </div>' +
            '  <div class="kkp-end" style="text-align:center;padding:1em;display:none;">' +
            '    <span style="opacity:0.4;font-size:0.85em;">— Đã tải hết phim —</span>' +
            '  </div>' +
            '</div>'
        );

        var $grid   = $html.find('.kkp-grid');
        var $loader = $html.find('.kkp-loader');
        var $end    = $html.find('.kkp-end');

        function renderItems(items) {
            items.forEach(function (item) {
                var poster = item.img || item.poster || '';
                var year   = item.release_date ? item.release_date.slice(0, 4) : '';
                var $card = $(
                    '<div class="kkp-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;position:relative;">' +
                    '  <div style="position:relative;padding-top:150%;background:#111;">' +
                    '    <img src="' + poster + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />' +
                    '  </div>' +
                    '  <div style="padding:6px 8px;">' +
                    '    <div style="font-size:13px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (item.title || '') + '</div>' +
                    '    <div style="font-size:11px;opacity:0.5;margin-top:2px;">' + year + '</div>' +
                    '  </div>' +
                    '</div>'
                );

                $card.on('hover:enter click', function () {
                    Lampa.Activity.push({
                        component: 'full',
                        id:        item.id,
                        source:    SOURCE_NAME,
                        card:      item,
                    });
                });

                $grid.append($card);
            });
        }

        function loadPage(page) {
            if (loading) return;
            loading = true;
            $loader.show();

            fetchPage(catUrl, page, function (res) {
                totalPages = res.totalPages;
                renderItems(res.items);
                loading = false;
                $loader.hide();

                if (curPage >= totalPages) {
                    $end.show();
                }
            }, function () {
                loading = false;
                $loader.hide();
            });
        }

        // Infinite scroll: theo dõi cuộn
        function onScroll() {
            var $container = $html.closest('.activity__body, .layer__body, .app').first();
            if (!$container.length) $container = $(window);

            var scrollTop    = $container.scrollTop();
            var innerHeight  = $container.innerHeight() || window.innerHeight;
            var scrollHeight = $container[0].scrollHeight || document.body.scrollHeight;

            if (scrollTop + innerHeight >= scrollHeight - 300) {
                if (!loading && curPage < totalPages) {
                    curPage++;
                    loadPage(curPage);
                }
            }
        }

        this.create = function () {
            loadPage(1);

            // Gắn scroll sau 300ms để chờ DOM ổn định
            setTimeout(function () {
                var $scrollEl = $html.closest('.activity__body, .layer__body').first();
                if ($scrollEl.length) {
                    $scrollEl.on('scroll.kkp', onScroll);
                } else {
                    $(window).on('scroll.kkp', onScroll);
                }
            }, 300);

            return $html;
        };

        this.render = function () {
            return $html;
        };

        this.destroy = function () {
            network.clear();
            $(window).off('scroll.kkp');
            $html.find('[data-scroll]').off('scroll.kkp');
        };

        this.pause  = function () {};
        this.resume = function () {};
        this.header = function () { return catTitle; };
    }

    // ==========================================
    // INJECT NÚT "XEM THÊM" VÀO CATEGORY ROWS
    // ==========================================
    function injectViewMore() {
        // Lắng nghe khi category render xong
        Lampa.Listener.follow('activity', function (e) {
            if (e.type !== 'start') return;
            if (!e.object || e.object.source !== SOURCE_NAME) return;
            if (e.object.component !== 'category') return;

            setTimeout(function () {
                // Mỗi row category có class .category-full hoặc .items-scroll
                $('.category-full, .category__title').each(function () {
                    var $row = $(this).closest('.category-full, .category__wrap');
                    if ($row.find('.kkp-more-btn').length) return; // tránh inject 2 lần

                    var $title = $row.find('.category__title, .items__title').first();
                    var titleText = $title.text().trim();

                    // Tìm category config tương ứng
                    var catCfg = null;
                    CATEGORIES.forEach(function (c) {
                        if (c.title === titleText) catCfg = c;
                    });
                    if (!catCfg) return;

                    var $btn = $(
                        '<span class="kkp-more-btn selector" style="' +
                        'font-size:12px;opacity:0.7;cursor:pointer;' +
                        'margin-left:12px;padding:2px 10px;' +
                        'border:1px solid rgba(255,255,255,0.3);' +
                        'border-radius:20px;vertical-align:middle;' +
                        '">Xem thêm ›</span>'
                    );

                    $btn.on('hover:enter click', function () {
                        Lampa.Activity.push({
                            title:     catCfg.title,
                            component: 'kkphim_list',
                            cat_url:   catCfg.url,
                            source:    SOURCE_NAME,
                            page:      1,
                        });
                    });

                    $title.append($btn);
                });
            }, 800);
        });
    }

    // ==========================================
    // INJECT NÚT PHÁT VÀO TRANG CHI TIẾT
    // ==========================================
    function injectPlayButtons(object, data) {
        var card = (data && data.movie) ? data.movie : (object && object.card);
        if (!card || card.source !== SOURCE_NAME) return;

        var slug = card.kkphim_slug || card.id;
        if (!slug) return;

        setTimeout(function () {
            if ($('.kkp-play-wrap').length) return;

            var network = new Lampa.Reguest();
            network.silent(BASE_URL + '/phim/' + slug, function (res) {
                var episodes = res.episodes || [];
                if (!episodes.length) return;

                var $wrap = $('<div class="kkp-play-wrap" style="padding:0.5em 1.5em 1em;"></div>');

                episodes.forEach(function (server) {
                    var $serverLabel = $(
                        '<div style="font-size:0.8em;opacity:0.5;margin:0.6em 0 0.3em;">' +
                        (server.server_name || 'Server') +
                        '</div>'
                    );
                    $wrap.append($serverLabel);

                    var playlist = (server.server_data || []).map(function (ep) {
                        return {
                            url:   ep.link_m3u8 || ep.link_embed || '',
                            title: (card.title || '') + ' - ' + (ep.name || ep.slug),
                        };
                    });

                    var $row = $('<div style="display:flex;flex-wrap:wrap;gap:6px;"></div>');

                    (server.server_data || []).forEach(function (ep, idx) {
                        var link = ep.link_m3u8 || ep.link_embed || '';
                        if (!link) return;

                        var $btn = $(
                            '<div class="selector" style="padding:5px 14px;background:rgba(255,255,255,0.12);border-radius:4px;font-size:13px;cursor:pointer;">' +
                            (ep.name || ('Tập ' + (idx + 1))) +
                            '</div>'
                        );

                        $btn.on('hover:enter click', function () {
                            Lampa.Player.play({
                                url:    link,
                                title:  (card.title || '') + ' - ' + (ep.name || ep.slug),
                                poster: card.img || card.poster || '',
                            });
                            Lampa.Player.playlist(playlist, idx);
                        });

                        $row.append($btn);
                    });

                    $wrap.append($row);
                });

                var $target = $('.full-descr').first();
                if ($target.length) {
                    $target.after($wrap);
                } else {
                    $('.full-start').first().append($wrap);
                }
            });
        }, 500);
    }

    // ==========================================
    // KHỞI ĐỘNG
    // ==========================================
    function startPlugin() {
        if (window.kkphim_plugin) return;
        window.kkphim_plugin = true;

        // Đăng ký API source
        Lampa.Api.sources[SOURCE_NAME] = new KKPhimApi();

        // ✅ Đăng ký component danh sách infinite scroll
        Lampa.Component.add('kkphim_list', KKPhimListComponent);

        // Hook trang chi tiết phim
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                injectPlayButtons(e.object, e.data);
            }
        });

        // Inject nút "Xem thêm" vào các row category
        injectViewMore();

        // Thêm vào menu
        var menuItem = $(
            '<li data-action="' + SOURCE_NAME + '" class="menu__item selector">' +
            '  <div class="menu__ico">' + ICON + '</div>' +
            '  <div class="menu__text">' + CAT_NAME + '</div>' +
            '</li>'
        );

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                title:     CAT_NAME,
                component: 'category',
                source:    SOURCE_NAME,
                page:      1,
            });
        });

        $('.menu .menu__list').eq(0).append(menuItem);
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();
