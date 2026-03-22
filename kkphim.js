(function () {
    'use strict';

    var SOURCE_NAME = 'kkphim';
    var CAT_NAME    = 'KKPhim';
    var BASE_URL    = 'https://phimapi.com';
    var IMG_URL     = 'https://phimimg.com/';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    function getPoster(url) {
        if (!url) return '';
        return url.indexOf('http') === 0 ? url : IMG_URL + url;
    }

    function normalizeItem(item) {
        var poster = getPoster(item.poster_url);
        var thumb  = getPoster(item.thumb_url || item.poster_url);
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
            overview:         '',
            source:           SOURCE_NAME,
            kkphim_slug:      item.slug,
            kkphim_type:      item.type,
        };
    }

    // ==========================================
    // API SERVICE
    // ==========================================
    function KKPhimApi() {
        var self     = this;
        self.network = new Lampa.Reguest();

        self.list = function (params, onComplete, onError) {
            var page = params.page || 1;
            self.network.silent(BASE_URL + '/danh-sach/phim-moi-cap-nhat?page=' + page, function (data) {
                var items = (data.items || []).map(normalizeItem);
                onComplete({
                    results:       items,
                    page:          page,
                    total_pages:   data.pagination ? data.pagination.totalPages : 1,
                    total_results: data.pagination ? data.pagination.totalItems : items.length,
                });
            }, onError);
        };

        self.category = function (params, onComplete, onError) {
            var categories = [
                { url: '/danh-sach/phim-moi-cap-nhat', title: 'Phim mới cập nhật' },
                { url: '/v1/api/danh-sach/phim-le',    title: 'Phim lẻ'            },
                { url: '/v1/api/danh-sach/phim-bo',    title: 'Phim bộ'            },
                { url: '/v1/api/danh-sach/hoat-hinh',  title: 'Hoạt hình'          },
                { url: '/v1/api/danh-sach/tv-shows',   title: 'TV Shows'           },
            ];

            var parts = categories.map(function (cat) {
                return function (callback) {
                    self.network.silent(BASE_URL + cat.url + '?page=1', function (data) {
                        var items = [];
                        if (data.items) items = data.items.map(normalizeItem);
                        else if (data.data && data.data.items) items = data.data.items.map(normalizeItem);
                        callback({
                            title: cat.title, results: items,
                            url: cat.url, page: 1,
                            total_pages: 1, total_results: items.length,
                            source: SOURCE_NAME,
                        });
                    }, function () {
                        callback({ title: cat.title, results: [], url: cat.url });
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
            self.network.silent(BASE_URL + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query), function (data) {
                var items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : [];
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
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
    // INJECT NÚT PHÁT KHI MỞ CHI TIẾT PHIM
    // ==========================================
    function injectPlayButtons(object, data) {
        var card = data.movie || data;
        if (!card || card.source !== SOURCE_NAME) return;

        var slug = card.kkphim_slug || card.id;
        if (!slug) return;

        // Chờ DOM của trang full sẵn sàng
        setTimeout(function () {
            var network = new Lampa.Reguest();
            network.silent(BASE_URL + '/phim/' + slug, function (res) {
                var episodes = res.episodes || [];
                if (!episodes.length) return;

                // Tạo container chứa các nút tập phim
                var $wrap = $('<div class="kkp-play-wrap" style="padding:0.5em 1.5em;"></div>');

                episodes.forEach(function (server) {
                    var $serverTitle = $('<div style="font-size:0.85em;opacity:0.6;margin:0.5em 0 0.3em;">' + (server.server_name || 'Server') + '</div>');
                    $wrap.append($serverTitle);

                    var $row = $('<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:0.5em;"></div>');

                    var playlist = (server.server_data || []).map(function (ep) {
                        return {
                            url:   ep.link_m3u8 || ep.link_embed || '',
                            title: (card.title || card.name || '') + ' - ' + (ep.name || ep.slug),
                        };
                    });

                    (server.server_data || []).forEach(function (ep, idx) {
                        var link = ep.link_m3u8 || ep.link_embed || '';
                        if (!link) return;

                        var $btn = $('<div class="selector" style="padding:5px 12px;background:rgba(255,255,255,0.12);border-radius:4px;font-size:13px;cursor:pointer;">' + (ep.name || ('Tập ' + (idx + 1))) + '</div>');

                        $btn.on('hover:enter click', function () {
                            Lampa.Player.play({
                                url:    link,
                                title:  (card.title || card.name || '') + ' - ' + (ep.name || ep.slug),
                                poster: card.img || card.poster || '',
                            });
                            Lampa.Player.playlist(playlist, idx);
                        });

                        $row.append($btn);
                    });

                    $wrap.append($row);
                });

                // Inject vào trang full — thêm sau phần mô tả
                var $target = $('.full-descr,.full-start__buttons,.full-info').first();
                if ($target.length) {
                    $target.after($wrap);
                } else {
                    $('.full-start, .full-page').first().append($wrap);
                }
            });
        }, 300);
    }

    // ==========================================
    // KHỞI ĐỘNG
    // ==========================================
    function startPlugin() {
        if (window.kkphim_plugin) return;
        window.kkphim_plugin = true;

        Lampa.Api.sources[SOURCE_NAME] = new KKPhimApi();

        // Lắng nghe khi mở chi tiết phim
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                injectPlayButtons(e.object, e.data || {});
            }
        });

        // Thêm vào menu
        var menuItem = $('<li data-action="' + SOURCE_NAME + '" class="menu__item selector">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">' + CAT_NAME + '</div>' +
            '</li>');

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
