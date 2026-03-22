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

    // Chuyển dữ liệu KKPhim -> định dạng TMDB mà Lampa hiểu
    function normalizeItem(item) {
        return {
            id:              item.slug,
            title:           item.name,
            name:            item.name,
            original_title:  item.origin_name || item.name,
            original_name:   item.origin_name || item.name,
            poster_path:     getPoster(item.poster_url),
            poster:          getPoster(item.poster_url),
            backdrop_path:   getPoster(item.thumb_url || item.poster_url),
            release_date:    item.year ? item.year + '-01-01' : '',
            first_air_date:  item.year ? item.year + '-01-01' : '',
            vote_average:    0,
            overview:        '',
            source:          SOURCE_NAME,
            kkphim_slug:     item.slug,
            kkphim_type:     item.type,
        };
    }

    // ==========================================
    // API SERVICE
    // ==========================================
    function KKPhimApi() {
        var self     = this;
        self.network = new Lampa.Reguest();

        // Gọi khi load danh sách / phân trang
        self.list = function (params, onComplete, onError) {
            var page = params.page || 1;
            var url  = BASE_URL + '/danh-sach/phim-moi-cap-nhat?page=' + page;

            self.network.silent(url, function (data) {
                var items = (data.items || []).map(normalizeItem);
                onComplete({
                    results:       items,
                    page:          page,
                    total_pages:   data.pagination ? data.pagination.totalPages : 1,
                    total_results: data.pagination ? data.pagination.totalItems : items.length,
                });
            }, onError);
        };

        // Gọi khi vào trang chủ category
        self.category = function (params, onComplete, onError) {
            var categories = [
                { url: '/danh-sach/phim-moi-cap-nhat', title: 'Phim mới cập nhật' },
                { url: '/v1/api/danh-sach/phim-le',    title: 'Phim lẻ' },
                { url: '/v1/api/danh-sach/phim-bo',    title: 'Phim bộ' },
                { url: '/v1/api/danh-sach/hoat-hinh',  title: 'Hoạt hình' },
                { url: '/v1/api/danh-sach/tv-shows',   title: 'TV Shows' },
            ];

            var parts = categories.map(function (cat) {
                return function (callback) {
                    self.network.silent(BASE_URL + cat.url + '?page=1', function (data) {
                        var items = [];
                        if (data.items) {
                            items = data.items.map(normalizeItem);
                        } else if (data.data && data.data.items) {
                            items = data.data.items.map(normalizeItem);
                        }
                        callback({
                            title:         cat.title,
                            results:       items,
                            url:           cat.url,
                            page:          1,
                            total_pages:   1,
                            total_results: items.length,
                            source:        SOURCE_NAME,
                        });
                    }, function () {
                        callback({ title: cat.title, results: [], url: cat.url });
                    });
                };
            });

            Lampa.Api.partNext(parts, 2, onComplete, onError);
        };

        // Gọi khi mở chi tiết phim
        self.full = function (params, onComplete, onError) {
            var slug = (params.card && params.card.kkphim_slug) || params.card.id;

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

                var result = normalizeItem(movie);
                result.overview          = movie.content || '';
                result.number_of_seasons = seasons.length;
                result.seasons           = seasons;
                result.kkphim_episodes   = episodes;

                onComplete({ movie: result });
            }, onError);
        };

        // Tìm kiếm phim
        self.search = function (params, onComplete, onError) {
            var query = params.query || '';
            self.network.silent(BASE_URL + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query), function (data) {
                var items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : [];
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
        };

        self.person  = function (p, ok, err) { err('not supported'); };
        self.seasons = function (params, onComplete, onError) {
            var card = params.card;
            if (card && card.seasons) onComplete({ seasons: card.seasons });
            else onError('no seasons');
        };
        self.clear = function () { self.network.clear(); };
    }

    // ==========================================
    // KHỞI ĐỘNG
    // ==========================================
    function startPlugin() {
        if (window.kkphim_plugin) return;
        window.kkphim_plugin = true;

        Lampa.Api.sources[SOURCE_NAME] = new KKPhimApi();

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
