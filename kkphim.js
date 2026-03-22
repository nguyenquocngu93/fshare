(function () {
    'use strict';

    if (window.kkphim_plugin) return;
    window.kkphim_plugin = true;

    var BASE_URL = 'https://phimapi.com';
    var IMG_URL  = 'https://phimimg.com/';

    function getPoster(url) {
        if (!url) return '';
        return url.indexOf('http') === 0 ? url : IMG_URL + url;
    }

    // CSS cho plugin
    var style = $(
        '<style>' +
        '.kkp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;}' +
        '.kkp-card{cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;}' +
        '.kkp-card img{width:100%;aspect-ratio:2/3;object-fit:cover;display:block;}' +
        '.kkp-card .kkp-title{font-size:11px;padding:4px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
        '.kkp-card.focus{outline:3px solid #fff;}' +
        '.kkp-eps{display:flex;flex-wrap:wrap;gap:6px;padding:8px;}' +
        '.kkp-ep{padding:6px 12px;background:rgba(255,255,255,.1);border-radius:4px;cursor:pointer;font-size:13px;}' +
        '.kkp-ep.focus{background:rgba(255,255,255,.4);}' +
        '</style>'
    );
    $('head').append(style);

    // ==========================================
    // COMPONENT - DANH SÁCH PHIM
    // ==========================================
    Lampa.Component.add('kkphim_catalog', function () {
        var network = new Lampa.Reguest();
        var wrap    = $('<div style="height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;"></div>');
        var grid    = $('<div class="kkp-grid"></div>');

        this.create = function () {
            wrap.append(grid);
            return wrap;
        };

        this.start = function () {
            this.activity.loader(true);
            this.load(1);
        };

        this.load = function (p) {
            var self = this;
            network.silent(BASE_URL + '/danh-sach/phim-moi-cap-nhat?page=' + p, function (data) {
                self.activity.loader(false);
                self.build(data.items || []);
            }, function () {
                self.activity.loader(false);
            });
        };

        this.build = function (movies) {
            movies.forEach(function (item) {
                var card = $(
                    '<div class="kkp-card selector">' +
                        '<img src="' + getPoster(item.poster_url) + '" />' +
                        '<div class="kkp-title">' + item.name + '</div>' +
                    '</div>'
                );

                card.on('hover:enter click', function () {
                    Lampa.Activity.push({
                        url:       BASE_URL + '/phim/' + item.slug,
                        title:     item.name,
                        component: 'kkphim_detail',
                        slug:      item.slug,
                        poster:    getPoster(item.thumb_url || item.poster_url),
                    });
                });

                grid.append(card);
            });
        };

        this.render  = function () { return wrap; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () { network.clear(); };
        this.destroy = function () { network.clear(); wrap.remove(); };
    });

    // ==========================================
    // COMPONENT - CHI TIẾT PHIM
    // ==========================================
    Lampa.Component.add('kkphim_detail', function () {
        var network = new Lampa.Reguest();
        var wrap    = $('<div style="height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px;"></div>');

        this.create = function () { return wrap; };

        this.start = function () {
            var self = this;
            var slug = this.activity.slug;
            this.activity.loader(true);

            network.silent(BASE_URL + '/phim/' + slug, function (data) {
                self.activity.loader(false);
                self.build(data);
            }, function () {
                self.activity.loader(false);
            });
        };

        this.build = function (data) {
            var movie    = data.movie    || {};
            var episodes = data.episodes || [];
            var poster   = getPoster(movie.thumb_url || movie.poster_url);

            wrap.append($(
                '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
                    '<img src="' + poster + '" style="width:100px;border-radius:6px;object-fit:cover;" />' +
                    '<div>' +
                        '<div style="font-size:16px;font-weight:bold;margin-bottom:6px;">' + movie.name + '</div>' +
                        '<div style="font-size:12px;opacity:.7;">' + (movie.origin_name || '') + '</div>' +
                        '<div style="font-size:12px;margin-top:4px;opacity:.7;">' + (movie.year || '') + ' • ' + (movie.time || '') + '</div>' +
                    '</div>' +
                '</div>'
            ));

            episodes.forEach(function (server) {
                wrap.append($('<div style="margin:8px 0 4px;font-weight:bold;">' + server.server_name + '</div>'));
                var epsRow = $('<div class="kkp-eps"></div>');

                (server.server_data || []).forEach(function (ep) {
                    var btn = $('<div class="kkp-ep selector">' + (ep.name || ep.slug) + '</div>');

                    btn.on('hover:enter click', function () {
                        var link = ep.link_m3u8 || ep.link_embed || '';
                        if (link) {
                            Lampa.Player.play({ url: link, title: movie.name + ' - ' + ep.name });
                            Lampa.Player.playlist([{ url: link, title: ep.name }]);
                        }
                    });

                    epsRow.append(btn);
                });

                wrap.append(epsRow);
            });
        };

        this.render  = function () { return wrap; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () { network.clear(); };
        this.destroy = function () { network.clear(); wrap.remove(); };
    });

    // ==========================================
    // INJECT VÀO MENU
    // ==========================================
    function addMenuItem() {
        if ($('.menu__item[data-component="kkphim_catalog"]').length) return;

        var item = $(
            '<li class="menu__item selector" data-component="kkphim_catalog">' +
            '    <div class="menu__ico">' +
            '        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
            '        </svg>' +
            '    </div>' +
            '    <div class="menu__text">KKPhim</div>' +
            '</li>'
        );

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
