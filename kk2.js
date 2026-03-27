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
        var info;
        var last;
        var wait_load = false;
        var page = object.page || 1;

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            // Nếu có URL tức là đang ở trang "Xem thêm" hoặc Search
            if (object.url) {
                this.loadMore();
            } else {
                this.loadHome();
            }

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
                    var u = api_url + cat.url + (cat.url.indexOf('?') > -1 ? '&' : '?') + 'page=1';
                    network.silent(u, function (res) {
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
            var data = res.data ? res.data.items : res.items;
            if (!data || data.length === 0) return;

            var row = $('<div class="category-images"><div class="category-images__title">' + cat.title + '</div><div class="category-images__body"></div></div>');
            
            data.slice(0, 12).forEach(function (item) {
                var card = Lampa.Template.get('card', { title: item.name, original_title: item.origin_name });
                card.find('img').attr('src', (item.thumb_url.indexOf('http') > -1 ? '' : img_url) + item.thumb_url);
                
                card.on('hover:enter', function () {
                    Lampa.Activity.push({ url: api_url + 'phim/' + item.slug, component: 'full_id', method: 'kkphim' });
                });
                row.find('.category-images__body').append(card);
            });

            // Nút Xem Thêm
            var more = $('<div class="category-images__item"><div class="category-images__more"><span>Xem thêm</span></div></div>');
            more.on('hover:enter', function () {
                Lampa.Activity.push({ title: cat.title, url: cat.url, component: 'kkphim', page: 1 });
            });
            row.find('.category-images__body').append(more);
            body.append(row);
        };

        this.loadMore = function () {
            var _this = this;
            var u = api_url + object.url + (object.url.indexOf('?') > -1 ? '&' : '?') + 'page=' + page;
            
            network.silent(u, function (res) {
                var data = res.data ? res.data.items : res.items;
                if (data && data.length > 0) {
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
                }
            });

            // Infinite Scroll logic
            scroll.onScroll = function () {
                if (!wait_load && items.length > 0) {
                    var last_card = items[items.length - 1][0];
                    if (scroll.isIntersected(last_card)) {
                        wait_load = true;
                        page++;
                        _this.loadMore();
                    }
                }
            };
        };

        this.render = function () { return html.append(scroll.render().append(body)); };
    }

    // --- CÁCH HIỆN MENU CHUẨN CỘNG ĐỒNG ---
    function init() {
        // Đăng ký component
        Lampa.Component.add('kkphim', KKPhim);

        // Thêm vào menu qua Listener để chắc chắn nó hiện
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready' || e.type == 'menu') {
                var menu_item = {
                    id: 'kkphim',
                    title: 'KKPhim',
                    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12L7 20V4L21 12Z" fill="currentColor"/></svg>',
                    component: 'kkphim',
                    page: true
                };

                // Kiểm tra xem đã có menu này chưa để tránh bị lặp
                if ($('.menu [data-id="kkphim"]').length == 0) {
                    Lampa.Menu.add(menu_item);
                }
            }
        });
    }

    // Chạy init ngay lập tức
    if (window.Lampa) init();
    else {
        // Dự phòng nếu script load trước cả core Lampa
        var timer = setInterval(function(){
            if(window.Lampa){
                clearInterval(timer);
                init();
            }
        }, 10);
    }

})();
