(function () {
    'use strict';

    // ===== POLYFILLS =====
    if (!Object.keys) { Object.keys = function (o) { var r = [], k; for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) r.push(k); } return r; }; }
    if (!Array.prototype.forEach) { Array.prototype.forEach = function (c, t) { var s = Object(this), l = s.length >>> 0; for (var i = 0; i < l; i++) { if (i in s) c.call(t, s[i], i, s); } }; }

    // ===== CONFIG =====
    var SOURCE_NAME = 'KKPHIM';
    var API_URL = 'https://phimapi.com';
    var IMG_URL = 'https://phimimg.com/uploads/vod/';
    var CACHE_TIME = 1000 * 60 * 60 * 3;
    var cache = {};
    var TMDB_KEY = Lampa.TMDB.key();

    var ICON = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/></svg>';

    // ===== FIX ẢNH (Quan trọng) =====
    var originalImg = Lampa.Api.img;
    Lampa.Api.img = function(path, size, source) {
        if (source === SOURCE_NAME || (path && path.indexOf('phimimg.com') !== -1)) {
            if (!path) return '';
            if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) return path;
            if (path.indexOf('//') === 0) return 'https:' + path;
            return IMG_URL + path.replace(/^\//, '');
        }
        return originalImg.call(this, path, size, source);
    };

    // ===== CACHE =====
    function getCache(key) {
        var res = cache[key];
        if (res && (Date.now() - res.timestamp) < CACHE_TIME) return res.value;
        for (var id in cache) {
            if (Date.now() - cache[id].timestamp >= CACHE_TIME) delete cache[id];
        }
        return null;
    }

    function setCache(key, value) {
        var timestamp = Date.now();
        var size = Object.keys(cache).length;
        if (size >= 100) {
            var oldest = null;
            for (var id in cache) {
                if (!oldest || cache[id].timestamp < cache[oldest].timestamp) oldest = id;
            }
            if (oldest) delete cache[oldest];
        }
        cache[key] = { timestamp: timestamp, value: value };
    }

    // ===== NORMALIZE =====
    function normalizeData(json) {
        var items = json.items || (json.data ? json.data.items : []);
        return {
            results: items.map(function (item) {
                var poster = item.poster_url || item.thumb_url || '';
                return {
                    id: item._id || item.slug,
                    title: item.name,
                    name: item.name,
                    poster_path: poster,
                    img: poster,
                    overview: item.content || item.description || '',
                    release_date: item.year ? String(item.year) : '',
                    vote_average: item.vote_average || 0,
                    episode_current: item.episode_current || '',
                    type: item.type === 'single' ? 'movie' : 'tv',
                    source: SOURCE_NAME
                };
            }),
            page: json.pagination ? json.pagination.currentPage : 1,
            total_pages: json.pagination ? Math.ceil(json.pagination.totalItems / 10) : 1,
            total_results: json.pagination ? json.pagination.totalItems : items.length
        };
    }

    // ===== API SERVICE =====
    function KKPhimApiService() {
        var self = this;
        self.network = new Lampa.Reguest();
        self.discovery = false;

        self.get = function (url, onComplete, onError) {
            var cached = getCache(url);
            if (cached) {
                onComplete(cached);
                return;
            }
            self.network.silent(url, function (json) {
                var normalized = normalizeData(json);
                setCache(url, normalized);
                onComplete(normalized);
            }, onError);
        };

        self.category = function (params, onSuccess, onError) {
            var categories = [
                { title: 'Phim Mới Cập Nhật', url: API_URL + '/danh-sach/phim-moi-cap-nhat?page=1' },
                { title: 'Phim Bộ', url: API_URL + '/v1/api/danh-sach/phim-bo?page=1' },
                { title: 'Phim Lẻ', url: API_URL + '/v1/api/danh-sach/phim-le?page=1' },
                { title: 'Hoạt Hình', url: API_URL + '/v1/api/danh-sach/hoat-hinh?page=1' },
                { title: 'TV Shows', url: API_URL + '/v1/api/danh-sach/tv-shows?page=1' },
                { title: 'Phim Chiếu Rạp', url: API_URL + '/v1/api/danh-sach/phim-chieu-rap?page=1' }
            ];

            var partsData = categories.map(function (cat) {
                return function (callback) {
                    self.get(cat.url, function (json) {
                        callback({
                            title: cat.title,
                            url: cat.url,
                            results: json.results,
                            source: SOURCE_NAME,
                            more: json.page < json.total_pages,
                            page: json.page,
                            total_pages: json.total_pages,
                            total_results: json.total_results
                        });
                    }, function () {
                        callback({ error: true });
                    });
                };
            });
            Lampa.Api.partNext(partsData, 5, onSuccess, onError);
        };

        self.list = function (params, onComplete, onError) {
            var baseUrl = params.url;
            var page = params.page || 1;
            var url = baseUrl.replace(/page=\d+/, 'page=' + page);
            if (url.indexOf('page=') === -1) {
                url += (url.indexOf('?') === -1 ? '?' : '&') + 'page=' + page;
            }
            self.get(url, function (json) {
                onComplete({
                    results: json.results,
                    page: json.page,
                    total_pages: json.total_pages,
                    total_results: json.total_results,
                    source: SOURCE_NAME
                });
            }, onError);
        };

        self.full = function (params, onSuccess, onError) {
            var card = params.card;
            var title = card.title || card.name;
            var year = card.release_date ? String(card.release_date).slice(0, 4) : '';

            // Tìm kiếm TMDB
            var searchUrl = 'https://api.themoviedb.org/3/search/multi?api_key=' + TMDB_KEY + 
                           '&language=' + Lampa.Storage.get('tmdb_lang', 'vi-VN') + 
                           '&query=' + encodeURIComponent(title);
            
            var request = new Lampa.Reguest();
            request.silent(searchUrl, function (searchData) {
                if (!searchData.results || searchData.results.length === 0) {
                    onSuccess(card);
                    return;
                }

                // Tìm phim phù hợp nhất
                var match = null;
                for (var i = 0; i < searchData.results.length; i++) {
                    var r = searchData.results[i];
                    var n = (r.title || r.name || '').toLowerCase();
                    var y = (r.release_date || r.first_air_date || '').slice(0, 4);
                    if (n === title.toLowerCase() && (!year || y === year)) {
                        match = r;
                        break;
                    }
                }
                if (!match) match = searchData.results[0];

                var mediaType = match.media_type || (match.first_air_date ? 'tv' : 'movie');
                
                // Lấy chi tiết phim + credits + videos + recommendations
                var detailUrl = 'https://api.themoviedb.org/3/' + mediaType + '/' + match.id + 
                               '?api_key=' + TMDB_KEY + 
                               '&language=' + Lampa.Storage.get('tmdb_lang', 'vi-VN') + 
                               '&append_to_response=credits,videos,recommendations';
                
                request.silent(detailUrl, function (detailData) {
                    var tmdbCard = {
                        id: detailData.id,
                        title: detailData.title || detailData.name,
                        name: detailData.title || detailData.name,
                        original_title: detailData.original_title || detailData.original_name,
                        overview: detailData.overview,
                        poster_path: detailData.poster_path,
                        backdrop_path: detailData.backdrop_path,
                        release_date: detailData.release_date || detailData.first_air_date,
                        vote_average: detailData.vote_average,
                        vote_count: detailData.vote_count,
                        seasons: detailData.seasons,
                        number_of_seasons: detailData.number_of_seasons,
                        number_of_episodes: detailData.number_of_episodes,
                        credits: detailData.credits,
                        videos: detailData.videos,
                        recommendations: detailData.recommendations ? detailData.recommendations.results : [],
                        source: 'tmdb'
                    };
                    onSuccess(tmdbCard);
                }, function () {
                    onSuccess(card);
                });
            }, function () {
                onSuccess(card);
            });
        };

        self.seasons = function (params, onSuccess, onError) {
            Lampa.Api.sources.tmdb.seasons(params, onSuccess, onError);
        };
        
        self.person = function (params, onSuccess, onError) {
            Lampa.Api.sources.tmdb.person(params, onSuccess, onError);
        };
        
        self.clear = function () {
            self.network.clear();
            for (var k in cache) delete cache[k];
        };
    }

    // ===== START PLUGIN =====
    function startPlugin() {
        if (window.kkphim_plugin_active) return;
        window.kkphim_plugin_active = true;

        Lampa.Api.sources[SOURCE_NAME] = new KKPhimApiService();

        // Thêm nhãn episode current lên card
        Lampa.Listener.follow('card', function (e) {
            if (e.type == 'build' && e.object.data.source == SOURCE_NAME) {
                if (e.object.data.episode_current) {
                    var lbl = $('<div style="position:absolute;top:0.5em;left:0.5em;background:#e74c3c;color:#fff;padding:0.2em 0.5em;border-radius:0.3em;font-size:0.75em;z-index:10;" class="card__type">' + e.object.data.episode_current + '</div>');
                    $(e.object.card).find('.card__view').append(lbl);
                }
            }
        });

        // Thêm menu item
        function addMenuItem() {
            if ($('.menu .menu__list [data-action="kkphim"]').length > 0) return;
            
            var menu_item = $(`
                <li class="menu__item selector" data-action="kkphim">
                    <div class="menu__ico">${ICON}</div>
                    <div class="menu__text">KKPhim</div>
                </li>
            `);
            
            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    title: 'KKPhim',
                    component: 'category',
                    source: SOURCE_NAME,
                    page: 1
                });
            });
            
            $('.menu .menu__list').eq(0).append(menu_item);
        }

        if (window.appready) addMenuItem();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenuItem(); });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();