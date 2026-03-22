(function () {
    'use strict';

    if (window.kkphim_plugin) return;
    window.kkphim_plugin = true;

    var BASE_URL = 'https://phimapi.com';
    var IMG_URL  = 'https://phimimg.com/';

    // ==========================================
    // COMPONENT - DANH SÁCH PHIM
    // ==========================================
    Lampa.Component.add('kkphim_catalog', function () {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var cards   = new Lampa.Explorer(this);
        var html    = $('<div></div>');

        this.create = function () {
            html.append(scroll.render());
            return html;
        };

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
            });
        };

        this.build = function (movies) {
            var self = this;
            movies.forEach(function (item) {
                var poster = item.poster_url
                    ? (item.poster_url.indexOf('http') === 0 ? item.poster_url : IMG_URL + item.poster_url)
                    : '';

                // Dùng đúng card template của Lampa
                var card = Lampa.Template.js('card', {
                    title: item.name,
                    release_year: item.year || '',
                    vote_average: '',
                });

                card.find('img').attr('src', poster);

                // Bấm vào card mở chi tiết
                card.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url:       BASE_URL + '/phim/' + item.slug,
                        title:     item.name,
                        component: 'kkphim_detail',
                        item:      item,
                    });
                });

                scroll.append(card);
            });
        };

        this.render  = function () { return html; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () { network.clear(); };
        this.destroy = function () { network.clear(); scroll.destroy(); };
    });

    // ==========================================
    // COMPONENT - CHI TIẾT PHIM
    // ==========================================
    Lampa.Component.add('kkphim_detail', function () {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var html    = $('<div style="padding:1em;"></div>');

        this.create = function () {
            html.append(scroll.render());
            return html;
        };

        this.start = function () {
            var self     = this;
            var item     = this.activity.item;
            var slug     = item ? item.slug : '';
            this.activity.loader(true);

            network.silent(BASE_URL + '/phim/' + slug, function (data) {
                self.activity.loader(false);
                self.build(data);
            }, function () {
                self.activity.loader(false);
            });
        };

        this.build = function (data) {
            var movie    = data.movie || {};
            var episodes = data.episodes || [];

            // Thông tin phim
            var info = $(
                '<div style="margin-bottom:1em;">' +
                '<h2 style="margin:0 0 .5em">' + movie.name + '</h2>' +
                '<p style="opacity:.7">' + (movie.content || '') + '</p>' +
                '</div>'
            );
            scroll.append(info);

            // Danh sách tập
            episodes.forEach(function (server) {
                var serverTitle = $('<div style="margin:.5em 0;font-weight:bold;">' + server.server_name + '</div>');
                scroll.append(serverTitle);

                (server.server_data || []).forEach(function (ep) {
                    var btn = $('<div class="full-start__button selector" style="margin:.3em 0;padding:.5em 1em;background:rgba(255,255,255,.1);border-radius:4px;cursor:pointer;">' + (ep.name || ep.slug) + '</div>');

                    btn.on('hover:enter click', function () {
                        var link = ep.link_m3u8 || ep.link_embed || '';
                        if (link) {
                            Lampa.Player.play({ url: link, title: movie.name + ' - ' + ep.name });
                            Lampa.Player.playlist([{ url: link, title: ep.name }]);
                        }
                    });

                    scroll.append(btn);
                });
            });
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

        $('.menu .menu__list').first().append(item);
    }

    function init() {
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            if ($('.menu .menu__list').length) {
                clearInterval(timer);
                addMenuItem();
            }
            if (tries > 20) clearInterval(timer);
        }, 500);
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });

})();
