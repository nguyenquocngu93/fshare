(function () {
    'use strict';

    if (window.plugin_kkphim_ready) return;
    window.plugin_kkphim_ready = true;

    Lampa.Platform.tv();

    // ===== CONFIG =====
    var SOURCE_NAME = 'KKPHIM';
    var API = 'https://phimapi.com';
    var IMG_BASE = 'https://phimimg.com/uploads/vod/';
    var CACHE_TIME = 1000 * 60 * 60 * 3; // 3 giờ
    var cache = {};
    var TMDB_KEY = Lampa.TMDB.key();

    var ICON = '<svg width="36" height="36" viewBox="0 0 24 24"><path fill="white" d="M12 2C6 2 2 6 2 12s4 10 10 10 10-4 10-10S18 2 12 2zm-2 14V8l6 4-6 4z"/></svg>';

    // ===== FIX ẢNH (hoàn toàn độc lập) =====
    var originalImg = Lampa.Api.img;
    Lampa.Api.img = function (path, size, source) {
        // Nếu là source của KKPHIM hoặc đường dẫn chứa phimimg.com
        if (source === SOURCE_NAME || (path && path.indexOf('phimimg.com') !== -1)) {
            if (!path) return '';
            // Nếu đã là URL đầy đủ
            if (path.startsWith('http://') || path.startsWith('https://')) return path;
            // Nếu bắt đầu bằng //
            if (path.startsWith('//')) return 'https:' + path;
            // Nếu là đường dẫn tương đối
            return IMG_BASE + path.replace(/^\//, '');
        }
        return originalImg.call(this, path, size, source);
    };

    // ===== CACHE (giống lnum.js) =====
    function getCache(key) {
        var c = cache[key];
        if (c && (Date.now() - c.time) < CACHE_TIME) return c.data;
        // Xóa cache cũ
        for (var k in cache) {
            if (Date.now() - cache[k].time >= CACHE_TIME) delete cache[k];
        }
        return null;
    }

    function setCache(key, data) {
        // Giới hạn cache 100 items
        var keys = Object.keys(cache);
        if (keys.length >= 100) {
            var oldest = keys.reduce(function(a, b) {
                return cache[a].time < cache[b].time ? a : b;
            });
            delete cache[oldest];
        }
        cache[key] = { time: Date.now(), data: data };
    }

    // ===== NORMALIZE (xử lý dữ liệu từ API) =====
    function normalize(json) {
        var items = json.items || (json.data ? json.data.items : []);
        
        return {
            results: items.map(function (i) {
                // Xử lý ảnh đúng cách
                var poster = i.poster_url || i.thumb_url || '';
                if (poster && !poster.match(/^https?:\/\//)) {
                    poster = IMG_BASE + poster.replace(/^\//, '');
                }
                
                return {
                    id: i._id || i.slug,
                    title: i.name,
                    name: i.name,
                    poster_path: poster,
                    backdrop_path: poster,
                    img: poster,
                    overview: i.content || i.description || '',
                    release_date: i.year ? String(i.year) : '',
                    vote_average: i.vote_average || 0,
                    type: i.type === 'single' ? 'movie' : 'tv',
                    source: SOURCE_NAME,
                    slug: i.slug,
                    episode_current: i.episode_current || ''
                };
            }),
            page: json.pagination ? json.pagination.currentPage : 1,
            total_pages: json.pagination ? Math.ceil(json.pagination.totalItems / 10) : 1,
            total_results: json.pagination ? json.pagination.totalItems : items.length
        };
    }

    // ===== TMDB MATCH =====
    function findMatch(list, title, year) {
        // Tìm chính xác theo tên và năm
        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            var n = (r.title || r.name || '').toLowerCase();
            var y = (r.release_date || r.first_air_date || '').slice(0, 4);
            if (n === title.toLowerCase() && (!year || y === year)) {
                return r;
            }
        }
        return list[0]; // fallback
    }

    // ===== API SERVICE (cấu trúc chuẩn Lampa) =====
    function KKPhimService() {
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
                if (!json) {
                    onError && onError('Empty response');
                    return;
                }
                var normalized = normalize(json);
                setCache(url, normalized);
                onComplete(normalized);
            }, function (err) {
                console.error('API error:', err);
                onError && onError(err);
            });
        };

        self.category = function (params, onSuccess, onError) {
            // Danh sách category từ KKPHIM
            var categories = [
                { title: 'Phim mới cập nhật', url: API + '/danh-sach/phim-moi-cap-nhat?page=1' },
                { title: 'Phim bộ', url: API + '/v1/api/danh-sach/phim-bo?page=1' },
                { title: 'Phim lẻ', url: API + '/v1/api/danh-sach/phim-le?page=1' },
                { title: 'Hoạt hình', url: API + '/v1/api/danh-sach/hoat-hinh?page=1' },
                { title: 'Phim chiếu rạp', url: API + '/v1/api/danh-sach/phim-chieu-rap?page=1' },
                { title: 'TV Shows', url: API + '/v1/api/danh-sach/tv-shows?page=1' }
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
            
            // Thay đổi page trong URL
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
            
            // Tìm kiếm trên TMDB
            var searchUrl = 'https://api.themoviedb.org/3/search/multi?api_key=' + TMDB_KEY + 
                           '&language=' + Lampa.Storage.get('tmdb_lang', 'vi-VN') + 
                           '&query=' + encodeURIComponent(title);
            
            var request = new Lampa.Reguest();
            request.silent(searchUrl, function (searchData) {
                if (!searchData.results || searchData.results.length === 0) {
                    onSuccess(card);
                    return;
                }
                
                var match = findMatch(searchData.results, title, year);
                var mediaType = match.media_type || (match.first_air_date ? 'tv' : 'movie');
                var detailUrl = 'https://api.themoviedb.org/3/' + mediaType + '/' + match.id + 
                               '?api_key=' + TMDB_KEY + 
                               '&language=' + Lampa.Storage.get('tmdb_lang', 'vi-VN') + 
                               '&append_to_response=credits,videos';
                
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

    // ===== KHỞI ĐỘNG PLUGIN =====
    function start() {
        if (Lampa.Api.sources[SOURCE_NAME]) return;
        
        // Đăng ký service
        Lampa.Api.sources[SOURCE_NAME] = new KKPhimService();

        // Thêm nhãn tập phim lên card
        Lampa.Listener.follow('card', function (e) {
            if (e.type === 'build' && e.object.data.source === SOURCE_NAME) {
                if (e.object.data.episode_current) {
                    var label = $('<div class="card__type" style="position:absolute;top:0.5em;left:0.5em;background:#e74c3c;z-index:10;">' + e.object.data.episode_current + '</div>');
                    $(e.object.card).find('.card__view').append(label);
                }
            }
        });

        // Thêm menu item
        var menuItem = $(
            '<li class="menu__item selector" data-action="kkphim">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">KKPhim</div>' +
            '</li>'
        );

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                title: 'KKPhim',
                component: 'category',
                source: SOURCE_NAME,
                page: 1
            });
        });

        // Đợi menu load xong mới thêm
        var checkMenu = setInterval(function() {
            if ($('.menu .menu__list').length) {
                clearInterval(checkMenu);
                $('.menu .menu__list').eq(0).append(menuItem);
            }
        }, 100);
    }

    // Chạy khi app sẵn sàng
    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();