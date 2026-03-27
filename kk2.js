(function () {
    'use strict';

    // --- POLYFILLS (Giữ nguyên 90% lnum) ---
    if (!Object.keys) { Object.keys = function (o) { var r = [], k; for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) r.push(k); } return r; }; }
    if (!Array.prototype.forEach) { Array.prototype.forEach = function (c, t) { var s = Object(this), l = s.length >>> 0; for (var i = 0; i < l; i++) { if (i in s) c.call(t, s[i], i, s); } }; }

    var SOURCE_NAME = 'KKPHIM';
    var KKPHIM_API_URL = 'https://phimapi.com';
    var IMG_BASE_URL = 'https://phimimg.com/uploads/vod/';
    
    var cache = {};
    var CACHE_TIME = 1000 * 60 * 60 * 3;
    var ICON = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/></svg>';

    // Fix ảnh: Chặn Lampa can thiệp vào URL nếu source là KKPHIM
    Lampa.Storage.set('api_source', SOURCE_NAME); 
    var originalImg = Lampa.Api.img;
    Lampa.Api.img = function(path, size, source) {
        if (source === SOURCE_NAME || (path && path.indexOf('phimimg.com') > -1)) return path;
        return originalImg.apply(this, arguments);
    };

    function KKPhimApiService() {
        var self = this;
        self.network = new Lampa.Reguest();

        function normalizeData(json) {
            var items = json.items || (json.data ? json.data.items : []);
            return {
                results: items.map(function (item) {
                    var img = item.poster_url;
                    if (img && !img.includes('http')) img = IMG_BASE_URL + img;
                    return {
                        id: item._id || item.slug,
                        title: item.name,
                        name: item.name,
                        img: img,
                        poster_path: img,
                        release_date: item.year ? String(item.year) : '2026',
                        episode_current: item.episode_current || '',
                        type: item.type === 'single' ? 'movie' : 'tv', // Fix lỗi Card Info
                        source: SOURCE_NAME
                    };
                }),
                page: json.pagination ? json.pagination.currentPage : 1,
                total_pages: json.pagination ? Math.ceil(json.pagination.totalItems / json.pagination.totalItemsPerPage) : 1
            };
        }

        self.get = function (url, onComplete, onError) {
            if (cache[url] && (Date.now() - cache[url].timestamp < CACHE_TIME)) return onComplete(cache[url].value);
            self.network.silent(url, function (json) {
                var res = normalizeData(json);
                cache[url] = { timestamp: Date.now(), value: res };
                onComplete(res);
            }, onError);
        };

        // Fix lỗi MORE: Cần truyền đủ url và more flag
        self.category = function (params, onSuccess, onError) {
            var categories = [
                { title: 'Phim Mới', url: KKPHIM_API_URL + '/danh-sach/phim-moi-cap-nhat?page=1' },
                { title: 'Phim Bộ', url: KKPHIM_API_URL + '/v1/api/danh-sach/phim-bo?page=1' },
                { title: 'Phim Lẻ', url: KKPHIM_API_URL + '/v1/api/danh-sach/phim-le?page=1' }
            ];
            
            var partsData = categories.map(function (cat) {
                return function (callback) {
                    self.get(cat.url, function (json) {
                        callback({
                            title: cat.title,
                            results: json.results,
                            url: cat.url, // Bắt buộc để hiện "More"
                            source: SOURCE_NAME,
                            more: json.total_pages > json.page
                        });
                    }, function () { callback({ error: true }); });
                };
            });
            Lampa.Api.partNext(partsData, 5, onSuccess, onError);
        };

        self.list = function (params, onComplete, onError) {
            var page = params.page || 1;
            var url = params.url.replace(/page=\d+/, 'page=' + page);
            self.get(url, onComplete, onError);
        };

        self.full = function (params, onSuccess, onError) {
            // Dùng card gốc của KKPhim nếu TMDB không tìm thấy
            Lampa.Api.sources.tmdb.full(params, onSuccess, function() {
                onSuccess(params.card);
            });
        };

        self.clear = function () { self.network.clear(); };
    }

    function startPlugin() {
        if (window.kk_plugin_active) return;
        window.kk_plugin_active = true;

        Lampa.Api.sources[SOURCE_NAME] = new KKPhimApiService();

        // Ghim menu (Đúng dòng bạn yêu cầu)
        function addMenuItem() {
            if ($('.menu .menu__list [data-action="kkphim"]').length > 0) return;
            var menu_item = $(`
                <div class="menu__item selector" data-action="kkphim">
                    <div class="menu__ico">${ICON}</div>
                    <div class="menu__text">KKPhim</div>
                </div>
            `);
            menu_item.on('click', function () {
                Lampa.Activity.push({ title: 'KKPhim', component: 'category', source: SOURCE_NAME, page: 1 });
                Lampa.Menu.hide();
            });
            $('.menu .menu__list').append(menu_item);
        }

        Lampa.Listener.follow('card', function (e) {
            if (e.type == 'build' && e.object.data.source == SOURCE_NAME) {
                if (e.object.data.episode_current) {
                    var lbl = $('<div style="position:absolute;top:0.5em;left:0.5em;background:#e74c3c;color:#fff;padding:0.1em 0.5em;border-radius:0.3em;font-size:0.75em;z-index:10;" class="card__type">' + e.object.data.episode_current + '</div>');
                    $(e.object.card).find('.card__view').append(lbl);
                }
            }
        });

        if (window.appready) addMenuItem();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenuItem(); });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
