(function () {
    'use strict';

    if (window.kkphim_plugin) return;
    window.kkphim_plugin = true;

    var BASE_URL = 'https://phimapi.com';
    var IMG_URL  = 'https://phimimg.com/';

    // ==========================================
    // COMPONENT
    // ==========================================
    Lampa.Component.add('kkphim_catalog', function () {
        var network = new Lampa.Reguest();
        var html    = $('<div class="kkphim-wrap" style="padding:1em;display:flex;flex-wrap:wrap;gap:10px;overflow-y:auto;height:100%;"></div>');

        // Lampa gọi create để lấy DOM
        this.create = function () {
            return html;
        };

        // Lampa gọi start để bắt đầu load dữ liệu
        this.start = function () {
            this.activity.loader(true);
            this.load(1);
        };

        this.load = function (p) {
            var self = this;
            var url  = BASE_URL + '/danh-sach/phim-moi-cap-nhat?page=' + p;

            network.silent(url, function (data) {
                self.activity.loader(false);
                self.build(data.items || []);
            }, function () {
                self.activity.loader(false);
                html.append('<div style="color:red;padding:20px">Không tải được dữ liệu!</div>');
            });
        };

        this.build = function (movies) {
            movies.forEach(function (item) {
                var poster = item.poster_url
                    ? (item.poster_url.indexOf('http') === 0 ? item.poster_url : IMG_URL + item.poster_url)
                    : '';

                var card = $(
                    '<div class="card selector" style="width:120px;cursor:pointer;">' +
                        '<div class="card__img" style="width:120px;height:180px;overflow:hidden;border-radius:6px;">' +
                            '<img src="' + poster + '" style="width:100%;height:100%;object-fit:cover;" />' +
                        '</div>' +
                        '<div class="card__title" style="font-size:12px;margin-top:5px;text-align:center;">' + item.name + '</div>' +
                    '</div>'
                );

                html.append(card);
            });
        };

        this.render  = function () { return html; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () { network.clear(); };
        this.destroy = function () { network.clear(); html.empty(); };
    });

    // ==========================================
    // INJECT VÀO MENU
    // ==========================================
    function addMenuItem() {
        // Tránh thêm 2 lần
        if ($('.menu__item[data-component="kkphim_catalog"]').length) return;

        var item = $([
            '<li class="menu__item selector" data-component="kkphim_catalog">',
            '    <div class="menu__ico">',
            '        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
            '            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
            '        </svg>',
            '    </div>',
            '    <div class="menu__text">KKPhim</div>',
            '</li>'
        ].join(''));

        item.on('hover:enter click', function () {
            Lampa.Activity.push({
                url:       '',
                title:     'KKPhim',
                component: 'kkphim_catalog',
                page:      1,
            });
        });

        var menuList = $('.menu .menu__list').first();
        if (menuList.length) {
            menuList.append(item);
        }
    }

    function init() {
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            var menuList = $('.menu .menu__list').first();
            if (menuList.length) {
                clearInterval(timer);
                addMenuItem();
            }
            if (tries > 20) clearInterval(timer);
        }, 500);
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();
