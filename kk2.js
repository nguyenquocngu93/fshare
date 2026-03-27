(function () {
    'use strict';

    var api_url = 'https://kkphimapi.com/';
    var img_url = 'https://phimimg.com/';

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
            this.activity.loader(true);

            if (object.url) this.loadMore();
            else this.loadHome();

            return this.render();
        };

        this.loadHome = function () {
            var _this = this;
            var categories = [
                { title: 'Phim Mới', url: 'danh-sach/phim-moi-cap-nhat' },
                { title: 'Phim Lẻ', url: 'v1/api/danh-sach/phim-le' },
                { title: 'Phim Bộ', url: 'v1/api/danh-sach/phim-bo' }
            ];

            var promises = categories.map(function (cat) {
                return new Promise(function (resolve) {
                    network.silent(api_url + cat.url + '?page=1', function (res) {
                        _this.buildRow(cat, res);
                        resolve();
                    }, resolve);
                });
            });

            Promise.all(promises).then(function () {
                _this.activity.loader(false);
                _this.activity.toggle();
            });
        };

        this.buildRow = function (cat, res) {
            var data = res.data ? res.data.items : (res.items || []);
            if (!data.length) return;

            var row = $('<div class="category-images"><div class="category-images__title">' + cat.title + '</div><div class="category-images__body"></div></div>');
            
            data.slice(0, 12).forEach(function (item) {
                var card = Lampa.Template.get('card', { title: item.name, original_title: item.origin_name });
                card.find('img').attr('src', (item.thumb_url.indexOf('http') > -1 ? '' : img_url) + item.thumb_url);
                card.on('hover:enter', function () {
                    Lampa.Activity.push({ url: api_url + 'phim/' + item.slug, component: 'full_id', method: 'kkphim' });
                });
                row.find('.category-images__body').append(card);
            });

            var more = $('<div class="category-images__item"><div class="category-images__more"><span>Xem thêm</span></div></div>');
            more.on('hover:enter', function () {
                Lampa.Activity.push({ title: cat.title, url: cat.url, component: 'kkphim', page: 1 });
            });
            row.find('.category-images__body').append(more);
            body.append(row);
        };

        this.loadMore = function () {
            var _this = this;
            network.silent(api_url + object.url + (object.url.indexOf('?') > -1 ? '&' : '?') + 'page=' + page, function (res) {
                var data = res.data ? res.data.items : (res.items || []);
                data.forEach(function (item) {
                    var card = Lampa.Template.get('card', { title: item.name });
                    card.find('img').attr('src', (item.thumb_url.indexOf('http') > -1 ? '' : img_url) + item.thumb_url);
                    card.on('hover:enter', function () {
                        Lampa.Activity.push({ url: api_url + 'phim/' + item.slug, component: 'full_id', method: 'kkphim' });
                    });
                    body.append(card);
                    items.push(card);
                });
                _this.activity.loader(false);
                _this.activity.toggle();
                wait_load = false;
            });

            scroll.onScroll = function () {
                if (!wait_load && items.length > 0) {
                    if (scroll.isIntersected(items[items.length - 1][0])) {
                        wait_load = true;
                        page++;
                        _this.loadMore();
                    }
                }
            };
        };

        this.render = function () { return html.append(scroll.render().append(body)); };
    }

    // --- CÁCH KHỞI TẠO AN TOÀN NHẤT ---
    function start() {
        Lampa.Component.add('kkphim', KKPhim);

        var menu_item = {
            id: 'kkphim',
            title: 'KKPhim',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="white" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
            component: 'kkphim',
            page: true
        };

        // Thêm vào menu
        Lampa.Menu.add(menu_item);
    }

    // Đợi Lampa sẵn sàng theo cách của các plugin chính thống
    if (window.app_ready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') start();
        });
    }

})();
