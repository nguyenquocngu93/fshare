(function () {
    'use strict';

    // --- POLYFILLS (Giống lnum.js) ---
    if (!Object.keys) { Object.keys = function (o) { var r = [], k; for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) r.push(k); } return r; }; }
    if (!Array.prototype.forEach) { Array.prototype.forEach = function (c, t) { var s = Object(this), l = s.length >>> 0; for (var i = 0; i < l; i++) { if (i in s) c.call(t, s[i], i, s); } }; }

    // --- CẤU HÌNH ---
    var SOURCE_NAME = 'KKPHIM';
    var KKPHIM_API_URL = 'https://kkphim.vip/api';
    var IMG_BASE_URL = 'https://phimimg.com';
    var CACHE_SIZE = 100;
    var CACHE_TIME = 1000 * 60 * 60 * 3; // 3h
    var cache = {};
    
    var CAT_NAME = Lampa.Storage.get('kkphim_settings_cat_name', SOURCE_NAME);
    var TMDB_KEY = Lampa.TMDB.key(); // Sử dụng key có sẵn của Lampa
    
    var ICON = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/></svg>';

    // --- FIX ẢNH: Ghi đè hàm Lampa.Api.img ---
    var originalImgFunc = Lampa.Api.img;
    Lampa.Api.img = function(path, size, source) {
        if (source === SOURCE_NAME || (path && (path.indexOf('phimimg.com') > -1 || path.indexOf(IMG_BASE_URL) > -1))) {
            return path;
        }
        return originalImgFunc.call(this, path, size, source);
    };

    // --- LẤY DANH SÁCH CATEGORY TỪ KKPHIM.VIP ---
    var CATEGORIES = [];

    function loadCategories() {
        var network = new Lampa.Reguest();
        network.silent(KKPHIM_API_URL + '/the-loai', function(json) {
            if (json && json.items) {
                CATEGORIES = json.items.map(function(cat) {
                    return {
                        title: cat.name,
                        slug: cat.slug,
                        url: KKPHIM_API_URL + '/the-loai/' + cat.slug + '?page=1'
                    };
                });
            }
        }, function(err) {
            console.error('Không thể tải categories:', err);
            // Fallback categories nếu không tải được
            CATEGORIES = [
                { title: 'Phim Mới', slug: 'phim-moi', url: KKPHIM_API_URL + '/phim-moi?page=1' },
                { title: 'Phim Bộ', slug: 'phim-bo', url: KKPHIM_API_URL + '/phim-bo?page=1' },
                { title: 'Phim Lẻ', slug: 'phim-le', url: KKPHIM_API_URL + '/phim-le?page=1' },
                { title: 'Hoạt Hình', slug: 'hoat-hinh', url: KKPHIM_API_URL + '/hoat-hinh?page=1' }
            ];
        });
    }

    // --- API SERVICE ---
    function KKPhimApiService() {
        var self = this;
        self.network = new Lampa.Reguest();
        self.discovery = false;

        // Cache helper giống lnum
        function getCache(key) {
            var res = cache[key];
            if (res) {
                var cache_timestamp = Date.now() - CACHE_TIME;
                if (res.timestamp > cache_timestamp) return res.value;
                
                for (var ID in cache) {
                    var node = cache[ID];
                    if (!(node && node.timestamp > cache_timestamp)) delete cache[ID];
                }
            }
            return null;
        }

        function setCache(key, value) {
            var timestamp = Date.now();
            var size = Object.keys(cache).length;

            if (size >= CACHE_SIZE) {
                var cache_timestamp = timestamp - CACHE_TIME;
                for (var ID in cache) {
                    var node = cache[ID];
                    if (!(node && node.timestamp > cache_timestamp)) delete cache[ID];
                }
                size = Object.keys(cache).length;
                if (size >= CACHE_SIZE) {
                    var timestamps = [];
                    for (var ID in cache) {
                        var node = cache[ID];
                        timestamps.push(node && node.timestamp || 0);
                    }
                    timestamps.sort(function (a, b) { return a - b });
                    cache_timestamp = timestamps[Math.floor(timestamps.length / 2)];
                    for (var ID in cache) {
                        var node = cache[ID];
                        if (!(node && node.timestamp > cache_timestamp)) delete cache[ID];
                    }
                }
            }

            cache[key] = {
                timestamp: timestamp,
                value: value
            };
        }

        // Chuẩn hóa URL ảnh
        function fixImageUrl(img) {
            if (!img) return '';
            if (img.match(/^https?:\/\//)) return img;
            if (img.match(/^\/\//)) return 'https:' + img;
            if (img.indexOf('/uploads/') === 0) return IMG_BASE_URL + img;
            return IMG_BASE_URL + '/uploads/vod/' + img;
        }

        // Chuẩn hóa dữ liệu từ API
        function normalizeData(json) {
            var items = json.items || (json.data ? json.data.items : []);
            var results = items.map(function (item) {
                return {
                    id: item._id || item.slug || item.id,
                    title: item.name,
                    name: item.name,
                    poster_path: fixImageUrl(item.poster_url || item.thumb_url),
                    img: fixImageUrl(item.poster_url || item.thumb_url),
                    overview: item.description || item.content || '',
                    release_date: item.year ? String(item.year) : '',
                    vote_average: item.vote_average || 0,
                    episode_current: item.episode_current || '',
                    type: item.type === 'single' ? 'movie' : 'tv',
                    source: SOURCE_NAME
                };
            });
            return {
                results: results,
                page: json.pagination ? json.pagination.currentPage : (json.current_page || 1),
                total_pages: json.pagination ? Math.ceil(json.pagination.totalItems / (json.pagination.totalItemsPerPage || 10)) : (json.total_pages || 1),
                total_results: json.pagination ? json.pagination.totalItems : (json.total || results.length)
            };
        }

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

        // Category: Tạo danh sách tất cả các dòng từ categories
        self.category = function (params, onSuccess, onError) {
            // Nếu categories chưa load xong, chờ và retry
            if (CATEGORIES.length === 0) {
                setTimeout(function() {
                    self.category(params, onSuccess, onError);
                }, 500);
                return;
            }
            
            var partsData = CATEGORIES.map(function (cat) {
                return function (callback) {
                    self.get(cat.url, function (json) {
                        callback({
                            title: cat.title,
                            url: cat.url,
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

        // List: Xử lý phân trang (More)
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

        // Full: Thông tin chi tiết (dùng TMDB nếu có key)
        self.full = function (params, onSuccess, onError) {
            var card = params.card;
            var searchTitle = card.title || card.name;
            var searchYear = card.release_date ? String(card.release_date).substring(0, 4) : '';
            
            // Tìm kiếm trên TMDB
            var searchUrl = 'https://api.themoviedb.org/3/search/multi?api_key=' + TMDB_KEY + '&language=' + Lampa.Storage.get('tmdb_lang', 'vi-VN') + '&query=' + encodeURIComponent(searchTitle);
            
            if (searchYear) {
                searchUrl += '&year=' + searchYear;
            }
            
            self.network.silent(searchUrl, function (searchData) {
                if (searchData.results && searchData.results.length > 0) {
                    var bestMatch = searchData.results[0];
                    var mediaType = bestMatch.media_type || (bestMatch.first_air_date ? 'tv' : 'movie');
                    var tmdbId = bestMatch.id;
                    
                    var detailUrl = 'https://api.themoviedb.org/3/' + mediaType + '/' + tmdbId + '?api_key=' + TMDB_KEY + '&language=' + Lampa.Storage.get('tmdb_lang', 'vi-VN') + '&append_to_response=credits,videos';
                    
                    self.network.silent(detailUrl, function (detailData) {
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
                } else {
                    onSuccess(card);
                }
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
        };
    }

    // --- KHỞI CHẠY PLUGIN ---
    function startPlugin() {
        if (window.kkphim_plugin_active) return;
        window.kkphim_plugin_active = true;

        // Load categories từ API
        loadCategories();

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
        function addMenuItem() {
            if ($('.menu .menu__list [data-action="kkphim"]').length > 0) return;
            
            var menu_item = $(`
                <li class="menu__item selector" data-action="kkphim">
                    <div class="menu__ico">${ICON}</div>
                    <div class="menu__text kkphim_cat_text">${CAT_NAME}</div>
                </li>
            `);
            
            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    title: CAT_NAME,
                    component: 'category',
                    source: SOURCE_NAME,
                    page: 1
                });
            });
            
            $('.menu .menu__list').eq(0).append(menu_item);
        }

        // Thêm settings
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

        if (window.appready) addMenuItem();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenuItem(); });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();