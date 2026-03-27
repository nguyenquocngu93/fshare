(function () {
    'use strict';

    // 1. POLYFILLS & ICON (Chôm từ lnum.js để chạy mượt trên mọi thiết bị)
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(c, t) {
            for (var i = 0, l = this.length; i < l; i++) if (i in this) c.call(t, this[i], i, this);
        };
    }

    var ICON = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 16.5V7.5L16 12L10 16.5Z" fill="white"/></svg>';
    var cache = {};
    var CACHE_TIME = 1000 * 60 * 60; // Cache 1 tiếng

    // 2. KKPHIM API SERVICE (Cấu trúc 1:1 với LNum)
    function KKPhimApiService() {
        var self = this;
        self.network = new Lampa.Reguest();

        // Hàm normalize để ép dữ liệu KKPhim về chuẩn Lampa (Chôm logic lnum)
        function normalizeData(json) {
            return {
                results: (json.items || []).map(function (item) {
                    var img = item.poster_url;
                    if(img && !img.includes('http')) img = 'https://phimimg.com/uploads/vod/' + img;
                    
                    return {
                        id: item._id,
                        name: item.name,
                        title: item.name,
                        img: img,
                        poster_path: img,
                        release_date: item.year,
                        episode_current: item.episode_current, // Giữ nhãn tập phim
                        source: 'kkphim'
                    };
                }),
                page: json.pagination ? json.pagination.currentPage : 1,
                total_pages: json.pagination ? Math.ceil(json.pagination.totalItems / json.pagination.totalItemsPerPage) : 1
            };
        }

        self.get = function (url, onComplete, onError) {
            if (cache[url] && (Date.now() - cache[url].timestamp < CACHE_TIME)) {
                return onComplete(cache[url].value);
            }
            self.network.silent(url, function (json) {
                var data = normalizeData(json);
                cache[url] = { timestamp: Date.now(), value: data };
                onComplete(data);
            }, onError);
        };

        // Render toàn bộ danh mục (Phim mới, Phim bộ, Phim lẻ, Hoạt hình)
        self.category = function (params, onSuccess, onError) {
            var categories = [
                { title: 'Phim Mới Cập Nhật', url: 'https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1' },
                { title: 'Phim Bộ', url: 'https://phimapi.com/v1/api/danh-sach/phim-bo?page=1' },
                { title: 'Phim Lẻ', url: 'https://phimapi.com/v1/api/danh-sach/phim-le?page=1' },
                { title: 'Hoạt Hình', url: 'https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1' }
            ];

            var partsLimit = 5;
            var partsData = categories.map(function(cat) {
                return function (callback) {
                    self.get(cat.url, function(json) {
                        callback({
                            title: cat.title,
                            results: json.results,
                            source: 'kkphim'
                        });
                    }, function() { callback({ error: true }); });
                };
            });

            Lampa.Api.partNext(partsData, partsLimit, onSuccess, onError);
        };

        self.full = function (params, onSuccess, onError) {
            var url = 'https://phimapi.com/phim/' + params.card.id; // API KKPhim dùng slug/id
            // Chuyển tiếp sang xử lý của Lampa Player
            Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
        };
    }

    // 3. KHỞI CHẠY PLUGIN & GHIM MENU
    function startPlugin() {
        if (window.kkphim_initialized) return;
        window.kkphim_initialized = true;

        var kkApi = new KKPhimApiService();
        Lampa.Api.sources.kkphim = kkApi;

        // Thêm CSS nhãn (Chôm từ lnum)
        Lampa.Template.add('kk_style', '<style>.card__kk-label{position:absolute;top:0.5em;left:0.5em;background:#e74c3c;color:#fff;padding:0.1em 0.5em;border-radius:0.2em;font-size:0.75em;z-index:5;}</style>');

        // Lắng nghe sự kiện vẽ card để dán nhãn tập phim
        Lampa.Listener.follow('card', function (e) {
            if (e.type == 'build' && e.object.data.source == 'kkphim') {
                if (e.object.data.episode_current) {
                    var label = $('<div class="card__kk-label">' + e.object.data.episode_current + '</div>');
                    $(e.object.card).find('.card__view').append(label);
                }
            }
        });

        // Ghim vào Sidebar
        var menuItem = $('<li class="menu__item selector"><div class="menu__ico">' + ICON + '</div><div class="menu__text">KKPhim</div></li>');
        menuItem.on('click', function () {
            Lampa.Activity.push({
                title: 'KKPhim',
                component: 'category', // Dùng component category mặc định của Lampa cho chuẩn
                source: 'kkphim',
                page: 1
            });
            Lampa.Menu.hide();
        });
        $('.menu .menu__list').eq(0).append(menuItem);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });

})();
