(function () {
    'use strict';

    // ========== POLYFILLS (giữ lại) ==========
    if (!Object.keys) { Object.keys = function (o) { var r = [], k; for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) r.push(k); } return r; }; }
    if (!Array.prototype.forEach) { Array.prototype.forEach = function (c, t) { var s = Object(this), l = s.length >>> 0; for (var i = 0; i < l; i++) { if (i in s) c.call(t, s[i], i, s); } }; }

    // ========== CẤU HÌNH ==========
    var SOURCE_NAME = 'KKPHIM';
    var CACHE_SIZE = 100;
    var CACHE_TIME = 1000 * 60 * 60 * 3; // 3 giờ
    var cache = {};

    var CAT_NAME = Lampa.Storage.get('kkphim_settings_cat_name', SOURCE_NAME);

    // Icon SVG (giữ nguyên)
    var ICON = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/></svg>';

    // ========== API SERVICE ==========
    function KKPhimApiService() {
        var self = this;
        self.network = new Lampa.Reguest();
        self.discovery = false; // để Lampa biết đây không phải discovery source

        // --- Cache helper (dùng đúng cơ chế của lnum.js) ---
        function getCache(key) {
            var res = cache[key];
            if (res) {
                var cache_timestamp = Date.now() - CACHE_TIME;
                if (res.timestamp > cache_timestamp) return res.value;
                // Xóa cache cũ
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

            // Xóa nếu vượt quá kích thước
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

        // --- Chuẩn hóa dữ liệu từ API KKPhim ---
        function normalizeData(json) {
            var items = json.items || (json.data ? json.data.items : []);
            var results = items.map(function (item) {
                var img = item.poster_url;
                if (img && !img.includes('http')) img = 'https://phimimg.com/uploads/vod/' + img;
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

        // --- GET với cache ---
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

        // --- Method bắt buộc: category (hiển thị danh sách dòng) ---
        self.category = function (params, onSuccess, onError) {
            // Các dòng hiển thị ở trang chủ
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
                            results: json.results,
                            source: SOURCE_NAME,
                            more: json.total_pages > json.page, // có thêm trang không
                            page: json.page,
                            total_pages: json.total_pages,
                            total_results: json.total_results
                        });
                    }, function (err) {
                        callback({ error: true });
                    });
                };
            });

            // Chạy lần lượt các dòng, tối đa 5 dòng cùng lúc (như lnum)
            Lampa.Api.partNext(partsData, 5, onSuccess, onError);
        };

        // --- Method bắt buộc: list (gọi khi nhấn "xem thêm" hoặc phân trang) ---
        self.list = function (params, onComplete, onError) {
            // params.url có dạng: "base__phim-moi-cap-nhat?page=1"
            // Ta cần parse để lấy url và page
            var url = params.url;
            var page = params.page || 1;
            // Nếu url chưa có page thì thêm vào
            if (url.indexOf('?') === -1) {
                url += '?page=' + page;
            } else {
                url = url.replace(/page=\d+/, 'page=' + page);
                if (url.indexOf('page=') === -1) url += '&page=' + page;
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

        // --- Method bắt buộc: full (thông tin chi tiết phim) ---
        self.full = function (params, onSuccess, onError) {
            // Gọi TMDB làm fallback (vì KKPhim không có chi tiết đầy đủ)
            Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
        };

        // --- Các method khác (cần có để tránh lỗi) ---
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

    // ========== KHỞI TẠO PLUGIN ==========
    function startPlugin() {
        if (window.kkphim_plugin_active) return;
        window.kkphim_plugin_active = true;

        // Đăng ký source
        var kkApi = new KKPhimApiService();
        Lampa.Api.sources[SOURCE_NAME] = kkApi;

        // Thêm nhãn episode current lên card (tương tự lnum có thể có cardClass riêng)
        Lampa.Listener.follow('card', function (e) {
            if (e.type == 'build' && e.object.data.source == SOURCE_NAME) {
                if (e.object.data.episode_current) {
                    var lbl = $('<div style="position:absolute;top:0.5em;left:0.5em;background:#e74c3c;color:#fff;padding:0.2em 0.5em;border-radius:0.3em;font-size:0.75em;z-index:10;" class="card__type">' + e.object.data.episode_current + '</div>');
                    $(e.object.card).find('.card__view').append(lbl);
                }
            }
        });

        // --- Thêm menu ---
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

        // --- Thêm settings (giống lnum) ---
        Lampa.SettingsApi.addComponent({
            component: 'kkphim_settings',
            name: CAT_NAME,
            icon: ICON
        });

        // Cho phép đổi tên hiển thị trên menu
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

    // Chạy khi app sẵn sàng
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();