(function () {
    'use strict';

    // Tránh load plugin 2 lần
    if (window.kkphim_plugin) return;
    window.kkphim_plugin = true;

    var BASE_URL = 'https://phimapi.com';
    var IMG_URL  = 'https://phimimg.com/';

    // ==========================================
    // BALANCER: interface nguồn phim cho Lampa
    // ==========================================
    function KKPhimBalancer() {
        var self   = this;
        this.name  = 'KKPhim';
        this.title = 'KKPhim';

        // Tìm kiếm phim theo tên/năm
        this.search = function (movie, callback) {
            var query = movie.title || movie.original_title || '';
            var url   = BASE_URL + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query);

            Lampa.Network.silent(url, function (data) {
                var results = [];
                if (data && data.data && data.data.items) {
                    data.data.items.forEach(function (item) {
                        results.push({
                            title:    item.name,
                            slug:     item.slug,
                            year:     item.year,
                            poster:   IMG_URL + item.poster_url,
                            type:     item.type,
                        });
                    });
                }
                callback(results);
            }, function () {
                callback([]);
            });
        };

        // Lấy danh sách tập/link xem
        this.get = function (item, callback) {
            var url = BASE_URL + '/phim/' + item.slug;

            Lampa.Network.silent(url, function (data) {
                var videos = [];
                var episodes = data.episodes || [];

                episodes.forEach(function (server) {
                    (server.server_data || []).forEach(function (ep) {
                        videos.push({
                            title: ep.name || 'Tập ' + ep.slug,
                            url:   ep.link_m3u8 || ep.link_embed,
                        });
                    });
                });

                callback(videos);
            }, function () {
                callback([]);
            });
        };
    }

    // ==========================================
    // COMPONENT: màn hình hiển thị trong Lampa
    // ==========================================
    Lampa.Component.add('kkphim_catalog', function () {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var items   = new Lampa.Explorer(this);
        var filter  = new Lampa.Filter(this);
        var page    = 1;

        this.create = function () {
            this.activity.loader(true);
            this.load(page);
        };

        this.load = function (p) {
            var self = this;
            var url  = BASE_URL + '/danh-sach/phim-moi-cap-nhat?page=' + p;

            network.silent(url, function (data) {
                self.activity.loader(false);
                self.build(data.items || []);
            }, function () {
                self.activity.loader(false);
                self.empty();
            });
        };

        this.build = function (movies) {
            movies.forEach(function (item) {
                var card = Lampa.InteractionMain.card({
                    title:       item.name,
                    poster:      IMG_URL + item.poster_url,
                    year:        item.year,
                    kkphim_slug: item.slug,
                });
                items.append(card);
            });
            scroll.append(items.render());
            this.render().append(scroll.render());
        };

        this.empty = function () {
            var empty = Lampa.Template.get('empty');
            this.render().append(empty);
        };

        this.render = function () {
            return $('<div class="kkphim-wrap"></div>');
        };

        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () { network.clear(); };
        this.destroy = function () { network.clear(); scroll.destroy(); };
    });

    // ==========================================
    // ĐĂNG KÝ VÀO LAMPA KHI APP READY
    // ==========================================
    function init() {
        // Thêm KKPhim vào menu chính
        Lampa.Menu.add({
            title:     'KKPhim',
            component: 'kkphim_catalog',
            icon:      '<svg>...</svg>',
        });

        // Đăng ký balancer để tìm link xem phim
        if (Lampa.Balancer) {
            Lampa.Balancer.add('kkphim', new KKPhimBalancer());
        }
    }

    // Kiểm tra app đã ready chưa
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();
