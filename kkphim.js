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
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var html    = $('<div class="kkphim-wrap"></div>');
        var page    = 1;

        // Lampa yêu cầu hàm start (không phải create)
        this.start = function () {
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
            });
        };

        this.build = function (movies) {
            movies.forEach(function (item) {
                var card = $('<div class="card selector">'
                    + '<div class="card__img"><img src="' + IMG_URL + item.poster_url + '"/></div>'
                    + '<div class="card__title">' + item.name + '</div>'
                    + '</div>');
                scroll.append(card);
            });
            html.append(scroll.render());
        };

        this.render  = function () { return html; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () { network.clear(); };
        this.destroy = function () { network.clear(); scroll.destroy(); };
    });

    // ==========================================
    // INJECT VÀO MENU
    // ==========================================
    function addMenuItem() {
        var item = $([
            '<li class="menu__item selector" data-action="kkphim_catalog">',
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
