(function () {
    'use strict';

    // --- 1. GIỮ 90% LOGIC CỦA LNUM (Polyfills & Cache) ---
    if (!Object.keys) { Object.keys = function (o) { var r = [], k; for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) r.push(k); } return r; }; }
    if (!Array.prototype.forEach) { Array.prototype.forEach = function (c, t) { var s = Object(this), l = s.length >>> 0; for (var i = 0; i < l; i++) { if (i in s) c.call(t, s[i], i, s); } }; }

    var SOURCE_NAME = 'KKPHIM';
    var cache = {};
    var CACHE_TIME = 1000 * 60 * 60 * 3; // 3h như gốc

    function KKPhimApiService() {
        var self = this;
        self.network = new Lampa.Reguest();

        function normalizeData(json) {
            var items = json.items || (json.data ? json.data.items : []);
            return {
                results: items.map(function (item) {
                    var img = item.poster_url;
                    if (img && !img.includes('http')) img = 'https://phimimg.com/uploads/vod/' + img;
                    return {
                        id: item._id || item.slug,
                        title: item.name,
                        name: item.name,
                        poster_path: img,
                        img: img,
                        release_date: item.year || '',
                        episode_current: item.episode_current || '',
                        source: SOURCE_NAME
                    };
                }),
                page: json.pagination ? json.pagination.currentPage : 1,
                total_pages: json.pagination ? Math.ceil(json.pagination.totalItems / 10) : 1
            };
        }

        function getCache(key) {
            var res = cache[key];
            if (res && (Date.now() - res.timestamp < CACHE_TIME)) return res.value;
            return null;
        }

        self.get = function (url, onComplete, onError) {
            var cached = getCache(url);
            if (cached) return onComplete(cached);
            self.network.silent(url, function (json) {
                var normalized = normalizeData(json);
                cache[url] = { timestamp: Date.now(), value: normalized };
                onComplete(normalized);
            }, onError);
        };

        self.category = function (params, onSuccess, onError) {
            var partsData = [
                { title: 'Phim Mới', url: 'https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1' },
                { title: 'Phim Bộ', url: 'https://phimapi.com/v1/api/danh-sach/phim-bo?page=1' },
                { title: 'Phim Lẻ', url: 'https://phimapi.com/v1/api/danh-sach/phim-le?page=1' },
                { title: 'Hoạt Hình', url: 'https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1' }
            ].map(function (cat) {
                return function (callback) {
                    self.get(cat.url, function (json) {
                        callback({ title: cat.title, results: json.results, source: SOURCE_NAME });
                    }, function () { callback({ error: true }); });
                };
            });
            Lampa.Api.partNext(partsData, 5, onSuccess, onError);
        };

        self.full = function (params, onSuccess, onError) {
            Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
        };
    }

    // --- 2. KHỞI CHẠY VÀ DÙNG ĐÚNG DÒNG GHIM CỦA BẠN ---
    function startPlugin() {
        if (window.kk_plugin_active) return;
        window.kk_plugin_active = true;

        Lampa.Api.sources[SOURCE_NAME] = new KKPhimApiService();

        // Thêm cái nhãn Episode cho xịn (đúng kiểu lnum)
        Lampa.Listener.follow('card', function (e) {
            if (e.type == 'build' && e.object.data.source == SOURCE_NAME) {
                if (e.object.data.episode_current) {
                    var lbl = $('<div style="position:absolute;top:0.5em;left:0.5em;background:#e74c3c;color:#fff;padding:0.2em 0.5em;border-radius:0.3em;font-size:0.75em;z-index:10;" class="card__type">' + e.object.data.episode_current + '</div>');
                    $(e.object.card).find('.card__view').append(lbl);
                }
            }
        });

        // ĐÚNG DÒNG GHIM MENU BẠN YÊU CẦU:
        function addMenuItem() {
            if ($('.menu .menu__list [data-action="kkphim"]').length > 0) return;

            var menu_item = $(`
                <div class="menu__item selector" data-action="kkphim">
                    <div class="menu__ico">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/>
                        </svg>
                    </div>
                    <div class="menu__text">KKPhim</div>
                </div>
            `);

            menu_item.on('click', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'category',
                    source: SOURCE_NAME,
                    page: 1
                });
                Lampa.Menu.hide();
            });

            $('.menu .menu__list').append(menu_item);
        }

        if (window.appready) addMenuItem();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenuItem(); });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });

})();
