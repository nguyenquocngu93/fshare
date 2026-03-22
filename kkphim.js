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

    $('head').append($('<style>' +
        '.kkp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;width:100%;box-sizing:border-box;}' +
        '.kkp-card{cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;transition:transform .2s;}' +
        '.kkp-card.focus,.kkp-card:focus{transform:scale(1.05);outline:2px solid #fff;}' +
        '.kkp-card img{width:100%;aspect-ratio:2/3;object-fit:cover;display:block;}' +
        '.kkp-title{font-size:11px;padding:4px 6px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
        '.kkp-eps{display:flex;flex-wrap:wrap;gap:6px;padding:8px;}' +
        '.kkp-ep{padding:6px 14px;background:rgba(255,255,255,.1);border-radius:4px;cursor:pointer;font-size:13px;}' +
        '.kkp-ep.focus,.kkp-ep:focus{background:#fff;color:#000;}' +
    '</style>'));

    // ==========================================
    // COMPONENT - DANH SÁCH PHIM
    // ==========================================
    Lampa.Component.add('kkphim_catalog', function () {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var grid    = $('<div class="kkp-grid"></div>');

        this.create = function () {
            // Append grid vào bên trong scroll
            scroll.append(grid);
            return scroll.render();
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
                        '<img src="' + getPoster(item.poster_url) + '" loading="lazy"/>' +
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

            // Thông báo scroll biết có nội dung mới
            scroll.update();
        };

        this.render  = function () { return scroll.render(); };
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

        this.create = function () {
            return scroll.render();
        };

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

            // Header thông tin phim
            var header = $(
                '<div style="display:flex;gap:12px;padding:12px;">' +
                    '<img src="' + poster + '" style="width:90px;border-radius:6px;flex-shrink:0;" />' +
                    '<div style="overflow:hidden;">' +
                        '<div style="font-size:15px;font-weight:bold;margin-bottom:4px;">' + movie.name + '</div>' +
                        '<div style="font-size:12px;opacity:.6;">' + (movie.origin_name || '') + '</div>' +
                        '<div style="font-size:12px;opacity:.6;margin-top:4px;">' + (movie.year || '') + (movie.time ? ' • ' + movie.time : '') + '</div>' +
                        '<div style="font-size:11px;opacity:.5;margin-top:6px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">' + (movie.content || '') + '</div>' +
                    '</div>' +
                '</div>'
            );
            scroll.append(header);

            // Danh sách tập
            episodes.forEach(function (server) {
                var label = $('<div style="padding:4px 12px 2px;font-weight:bold;opacity:.8;">' + server.server_name + '</div>');
                scroll.append(label);

                var epsRow = $('<div class="kkp-eps"></div>');

                (server.server_data || []).forEach(function (ep) {
                    var link = ep.link_m3u8 || ep.link_embed || '';
                    var btn  = $('<div class="kkp-ep selector">' + (ep.name || ep.slug) + '</div>');

                    btn.on('hover:enter click', function () {
                        if (!link) return;

                        // API player đúng của Lampa
                        var playlist = (server.server_data || []).map(function (e) {
                            return {
                                url:   e.link_m3u8 || e.link_embed || '',
                                title: movie.name + ' - ' + (e.name || e.slug),
                            };
                        });

                        var startIndex = (server.server_data || []).indexOf(ep);

                        Lampa.Player.play({
                            url:    link,
                            title:  movie.name + ' - ' + (ep.name || ep.slug),
                            poster: poster,
                        });

                        Lampa.Player.playlist(playlist, startIndex);
                    });

                    epsRow.append(btn);
                });

                scroll.append(epsRow);
            });

            scroll.update();
        };

        this.render  = function () { return scroll.render(); };
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

        var item = $(
            '<li class="menu__item selector" data-component="kkphim_catalog">' +
            '<div class="menu__ico">' +
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
            '</svg></div>' +
            '<div class="menu__text">KKPhim</div>' +
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
