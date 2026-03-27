(function () {
    'use strict';

    var api_url = 'https://kkphimapi.com/';
    var img_url = 'https://phimimg.com/';

    // Danh sách các thể loại muốn hiển thị ở trang chủ
    var categories = [
        { title: 'Phim Mới Cập Nhật', url: 'danh-sach/phim-moi-cap-nhat', type: 'new' },
        { title: 'Phim Lẻ', url: 'v1/api/danh-sach/phim-le', type: 'list' },
        { title: 'Phim Bộ', url: 'v1/api/danh-sach/phim-bo', type: 'list' },
        { title: 'Hoạt Hình', url: 'v1/api/danh-sach/hoat-hinh', type: 'list' }
    ];

    function KKPhim(object) {
        var network = new Lampa.RegExpHTTP();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var page = object.page || 1;
        var wait_load = false;

        this.create = function () {
            var _this = this;

            // Nếu là trang danh mục cụ thể (khi bấm "Xem thêm")
            if (object.url) {
                this.loadCategoryFull();
            } else {
                // Nếu là trang chủ plugin (hiển thị các hàng ngang)
                this.loadHome();
            }

            return this.render();
        };

        // 1. GIAO DIỆN TRANG CHỦ (NHIỀU HÀNG)
        this.loadHome = function () {
            var _this = this;
            this.activity.loader(true);

            var requests = categories.map(function (cat) {
                return new Promise(function (resolve) {
                    network.silent(api_url + cat.url + '?page=1', function (data) {
                        _this.buildRow(cat, data);
                        resolve();
                    }, resolve);
                });
            });

            Promise.all(requests).then(function () {
                _this.activity.loader(false);
                _this.activity.toggle();
            });
        };

        this.buildRow = function (cat, data) {
            if (!data || !data.data || !data.data.items) return;

            var row = $('<div class="category-images"></div>');
            var title = $('<div class="category-images__title">' + cat.title + '</div>');
            var body_row = $('<div class="category-images__body"></div>');
            var more = $('<div class="category-images__item"><div class="category-images__more"><span>Xem thêm</span></div></div>');

            data.data.items.slice(0, 10).forEach(function (item) {
                var card = Lampa.Template.get('card', { title: item.name });
                card.find('img').attr('src', img_url + item.thumb_url);
                card.on('hover:enter', function () {
                    Lampa.Activity.push({ url: api_url + 'phim/' + item.slug, component: 'full_id', method: 'kkphim' });
                });
                body_row.append(card);
            });

            // Sự kiện nút Xem thêm
            more.on('hover:enter', function () {
                Lampa.Activity.push({
                    title: cat.title,
                    url: cat.url,
                    page: 1,
                    component: 'kkphim'
                });
            });

            body_row.append(more);
            row.append(title).append(body_row);
            body.append(row);
        };

        // 2. GIAO DIỆN XEM TOÀN BỘ (INFINITE SCROLL)
        this.loadCategoryFull = function () {
            var _this = this;
            this.activity.loader(true);

            network.silent(api_url + object.url + '?page=' + page, function (data) {
                if (data && data.data && data.data.items.length > 0) {
                    data.data.items.forEach(function (item) {
                        var card = Lampa.Template.get('card', { title: item.name });
                        card.find('img').attr('src', img_url + item.thumb_url);
                        card.on('hover:enter', function () {
                            Lampa.Activity.push({ url: api_url + 'phim/' + item.slug, component: 'full_id', method: 'kkphim' });
                        });
                        body.append(card);
                        items.push(card);
                    });

                    _this.activity.loader(false);
                    _this.activity.toggle();
                    wait_load = false;
                }
            });

            // Lắng nghe cuộn để load thêm
            scroll.onScroll = function () {
                if (!wait_load && scroll.isIntersected(body.find('.card').last()[0])) {
                    wait_load = true;
                    page++;
                    _this.loadCategoryFull();
                }
            };
        };

        this.render = function () {
            return html.append(scroll.render().append(body));
        };
    }

    function startPlugin() {
        if (window.app_ready) {
            Lampa.Component.add('kkphim', KKPhim);
            Lampa.Menu.add({
                id: 'kkphim',
                title: 'KKPhim',
                icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M10 18l6-6-6-6v12z" fill="#fff"/></svg>',
                component: 'kkphim',
                page: true
            });
        } else {
            setTimeout(startPlugin, 100);
        }
    }

    startPlugin();
})();
