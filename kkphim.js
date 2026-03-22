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
        var page    = 1;
        var html    = $('<div class="kkphim-wrap"></div>');

        this.create = function () {
            this.activity.loader(true);
            this.load(page);
            return html;
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
    // THÊM VÀO MENU - CÁCH ĐÚNG
    // ==========================================
    function addMenu() {
        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'start') {
                e.items.push({
                    title:     'KKPhim',
                    component: 'kkphim_catalog',
                    icon:      Lampa.SVG ? Lampa.SVG.icon('cinema') : '',
                });
            }
        });
    }

    if (window.appready) {
        addMenu();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') addMenu();
        });
    }

})();

