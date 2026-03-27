(function () {
    'use strict';

    // --- 1. POLYFILLS ---
    if (!Object.keys) { Object.keys = function (o) { var r = [], k; for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) r.push(k); } return r; }; }
    if (!Array.prototype.forEach) { Array.prototype.forEach = function (c, t) { var s = Object(this), l = s.length >>> 0; for (var i = 0; i < l; i++) { if (i in s) c.call(t, s[i], i, s); } }; }

    // --- 2. CẤU HÌNH ---
    var SOURCE_NAME = 'KKPHIM';
    var CACHE_SIZE = 100;
    var CACHE_TIME = 1000 * 60 * 60 * 3; // 3 giờ
    var cache = {};

    var CAT_NAME = Lampa.Storage.get('kkphim_settings_cat_name', SOURCE_NAME);

    var ICON = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/></svg>';

    // --- 3. API SERVICE ---
    function KKPhimApiService() {
        var self = this;
        self.network = new Lampa.Reguest();
        self.discovery = false;

        // Helper cache (giống lnum.js)
        function getCache(key) {
            var res = cache[key];
            if (res) {
                var cache_timestamp = Date.now() - CACHE_TIME;
                if (res.timestamp > cache_timestamp) return res.value;
                for (var id in cache) {
                    var node = cache[id];
                    if (!(node && node.timestamp > cache_timestamp)) delete cache[id];
                }
            }
            return null;
        }

        function setCache(key, value) {
            var timestamp = Date.now();
            var size = Object.keys(cache).length;

            if (size >= CACHE_SIZE) {
                var cache_timestamp = timestamp - CACHE_TIME;
                for (var id in cache) {
                    var node = cache[id];
                    if (!(node && node.timestamp > cache_timestamp)) delete cache[id];
                }
                size = Object.keys(cache).length;
                if (size >= CACHE_SIZE) {
                    var timestamps = [];
                    for (var id in cache) {
                        timestamps.push(cache[id].timestamp);
                    }
                    timestamps.sort(function (a, b) { return a - b; });
                    cache_timestamp = timestamps[Math.floor(timestamps.length / 2)];
                    for (var id in cache) {
                        if (cache[id].timestamp <= cache_timestamp) delete cache[id];
                    }
                }
            }

            cache[key] = {
                timestamp: timestamp,
                value: value
            };
        }

        // Chuẩn hóa dữ liệu từ API KKPhim (danh sách phim)
        function normalizeData(json) {
            var items = json.items || (json.data ? json.data.items : []);
            var results = items.map(function (item) {
                var img = item.poster_url;
                // Sửa lỗi ảnh: nếu không có http thì thêm domain
                if (img && !img.match(/^https?:\/\//)) {
                    img = 'https://phimimg.com/uploads/vod/' + img;
                }
                return {
                    id: item._id || item.slug,
                    title: item.name,
                    name: item.name,
                    poster_path: img,
                    img: img,
                    overview: item.description || '',
                    release_date: item.year || '',
                    vote_average: item.vote_average || 0,
                    episode_current: item.episode_current || '',
                    source: SOURCE_NAME
                };
            });
            return {
                results: results,
                page: json.pagination ? json.pagination.currentPage : 1,
                total_pages: json.pagination ? Math.ceil(json.pagination.totalItems / 10) : 1,
                total_results: json.pagination ? json.pagination.totalItems : results.length
            };
        }

        // GET có cache
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

        // Category: tạo các dòng
        self.category = function (params, onSuccess, onError) {
            var partsData = [
                { title: 'Phim Mới Cập Nhật', url: 'https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1' },
                { title: 'Phim Bộ', url: 'https://phimapi.com/v1/api/danh-sach/phim-bo?page=1' },
                { title: 'Phim Lẻ', url: 'https://phimapi.com/v1/api/danh-sach/phim-le?page=1' },
                { title: 'Hoạt Hình', url: 'https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1' }
            ].map(function (cat) {
                return function (callback) {
                    self.get(cat.url, function (json) {
                        callback({
                            title: cat.title,
                            url: cat.url,          // lưu url gốc để list dùng
                            results: json.results,
                            source: SOURCE_NAME,
                            more: json.total_pages > json.page,
                            page: json.page,
                            total_pages: json.total_pages,
                            total_results: json.total_results
                        });
                    }, function (err) {
                        callback({ error: true });
                    });
                };
            });
            Lampa.Api.partNext(partsData, 5, onSuccess, onError);
        };

        // List: xử lý phân trang (more & infinite scroll)
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

        // Full: lấy thông tin chi tiết phim (tự viết, không dùng TMDB)
        self.full = function (params, onSuccess, onError) {
            var card = params.card;
            var slug = card.id; // slug của phim (từ id)
            var url = 'https://phimapi.com/phim/' + slug;
            self.network.silent(url, function (json) {
                // Kiểm tra dữ liệu trả về
                if (!json || !json.data) {
                    // Fallback sang TMDB nếu lỗi
                    Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
                    return;
                }
                var data = json.data;
                // Xử lý seasons và episodes
                var seasons = [];
                if (data.episodes && data.episodes.length) {
                    // Nhóm episodes theo season
                    var seasonMap = {};
                    data.episodes.forEach(function(ep) {
                        var seasonNum = ep.season || 1;
                        if (!seasonMap[seasonNum]) seasonMap[seasonNum] = [];
                        seasonMap[seasonNum].push({
                            episode_number: ep.episode,
                            name: ep.name || 'Tập ' + ep.episode,
                            air_date: ep.release_date || '',
                            still_path: ep.thumbnail || '',
                            overview: ep.description || ''
                        });
                    });
                    for (var s in seasonMap) {
                        seasons.push({
                            season_number: parseInt(s),
                            name: 'Mùa ' + s,
                            episodes: seasonMap[s].sort(function(a,b){ return a.episode_number - b.episode_number; })
                        });
                    }
                } else if (data.episode_current) {
                    // Phim lẻ: tạo 1 season với 1 episode
                    seasons.push({
                        season_number: 1,
                        name: 'Full',
                        episodes: [{
                            episode_number: 1,
                            name: data.name,
                            air_date: data.year || '',
                            still_path: data.poster_url || '',
                            overview: data.description || ''
                        }]
                    });
                }
                // Tạo card chi tiết
                var poster = data.poster_url;
                if (poster && !poster.match(/^https?:\/\//)) {
                    poster = 'https://phimimg.com/uploads/vod/' + poster;
                }
                var backdrop = data.thumb_url || poster;
                if (backdrop && !backdrop.match(/^https?:\/\//)) {
                    backdrop = 'https://phimimg.com/uploads/vod/' + backdrop;
                }
                var detailCard = {
                    id: data._id || data.slug,
                    title: data.name,
                    name: data.name,
                    original_title: data.original_name || data.name,
                    overview: data.description || '',
                    poster_path: poster,
                    backdrop_path: backdrop,
                    release_date: data.year ? data.year + '-01-01' : '',
                    vote_average: data.vote_average || 0,
                    seasons: seasons,
                    source: SOURCE_NAME
                };
                onSuccess(detailCard);
            }, function (err) {
                // Fallback TMDB nếu API lỗi
                Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
            });
        };

        // Các method fallback khác
        self.seasons = function (params, onSuccess, onError) {
            Lampa.Api.sources.tmdb.seasons(params, onSuccess, onError);
        };
        self.person = function (params, onSuccess, onError) {
            Lampa.Api.sources.tmdb.person(params, onSuccess, onError);
        };
        self.clear = function () {
            self.network.clear();
        };
    }

    // --- 4. KHỞI CHẠY PLUGIN ---
    function startPlugin() {
        if (window.kkphim_plugin_active) return;
        window.kkphim_plugin_active = true;

        // Đăng ký source
        var kkApi = new KKPhimApiService();
        Lampa.Api.sources[SOURCE_NAME] = kkApi;

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
        var menuItem = $('<li data-action="kkphim" class="menu__item selector"><div class="menu__ico">' + ICON + '</div><div class="menu__text kkphim_cat_text">' + CAT_NAME + '</div></li>');
        $('.menu .menu__list').eq(0).append(menuItem);

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                title: CAT_NAME,
                component: 'category',
                source: SOURCE_NAME,
                page: 1
            });
        });

        // Thêm settings để đổi tên hiển thị
        Lampa.SettingsApi.addComponent({
            component: 'kkphim_settings',
            name: CAT_NAME,
            icon: ICON
        });

        Lampa.SettingsApi.addParam({
            component: 'kkphim_settings',
            param: {
                name: 'kkphim_settings_cat_name',
                type: 'input',
                placeholder: '',
                values: '',
                default: CAT_NAME
            },
            field: {
                name: 'Tên hiển thị',
                description: 'Nhập tên muốn hiển thị trên menu'
            },
            onChange: function (value) {
                CAT_NAME = value;
                $('.kkphim_cat_text').text(value);
                Lampa.Settings.update();
            }
        });
    }

    // Chạy khi app ready
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();