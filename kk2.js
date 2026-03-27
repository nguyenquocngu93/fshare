/*
KKPHIM FULL PLUGIN FOR LAMPA
- Fix menu
- Home row ngang
- Xem thêm → infinite scroll
- Chọn tập ngay UI
*/

(function () {
'use strict';

console.log('✅ KKPHIM FULL LOADED');

var API = 'https://phimapi.com';
var IMG = 'https://phimimg.com/';

function fixImg(url){
    if(!url) return '';
    return url.startsWith('http') ? url : IMG + url;
}

function startPlugin() {

    console.log('🚀 START KKPHIM');

    try {

        /**
         * =========================
         * HOME (ROW NGANG)
         * =========================
         */
        Lampa.Component.add('kkphim_home', {
            render: function () {
                console.log('📺 HOME RENDER');

                this.create();
                this.load();
            },

            create: function () {
                this.html = $('<div class="kk-home"></div>');
                this.activity.append(this.html);
                this.activity.loader(true);
            },

            load: function () {
                var _this = this;

                var categories = [
                    {title: 'Phim mới', type: 'phim-moi-cap-nhat'},
                    {title: 'Phim bộ', type: 'phim-bo'},
                    {title: 'Phim lẻ', type: 'phim-le'},
                    {title: 'Hoạt hình', type: 'hoat-hinh'}
                ];

                this.activity.loader(false);

                categories.forEach(function (cat) {
                    _this.renderRow(cat);
                });
            },

            renderRow: function (cat) {
                var _this = this;

                var row = $(`
                    <div class="kk-row">
                        <div class="kk-head">
                            <div class="kk-title">${cat.title}</div>
                            <div class="kk-more">Xem thêm</div>
                        </div>
                        <div class="kk-list"></div>
                    </div>
                `);

                this.html.append(row);

                row.find('.kk-more').on('hover:enter', function () {
                    Lampa.Activity.push({
                        component: 'kkphim_list',
                        params: { type: cat.type, title: cat.title }
                    });
                });

                Lampa.Reguest.get({
                    url: API + '/danh-sach/' + cat.type + '?page=1',
                    success: function (res) {

                        var list = row.find('.kk-list');

                        res.items.slice(0,10).forEach(function (item) {

                            var card = Lampa.Template.get('card', {
                                title: item.name,
                                img: fixImg(item.poster_url || item.thumb_url),
                                subtitle: item.episode_current
                            });

                            $(card).on('hover:enter', function () {
                                _this.open(item);
                            });

                            list.append(card);
                        });
                    }
                });
            },

            open: function (item) {
                var _this = this;

                console.log('🎬 OPEN:', item.name);

                Lampa.Reguest.get({
                    url: API + '/phim/' + item.slug,
                    success: function (res) {
                        _this.showEpisodes(item, res.episodes);
                    }
                });
            },

            showEpisodes: function (item, episodes) {
                var _this = this;

                this.html.empty();

                episodes.forEach(function (server) {

                    var title = $('<div class="kk-server">' + server.server_name + '</div>');
                    var wrap = $('<div class="kk-episodes"></div>');

                    server.server_data.forEach(function (ep) {

                        var btn = $('<div class="kk-ep">' + ep.name + '</div>');

                        btn.on('hover:enter', function () {
                            console.log('▶ PLAY:', ep.name);

                            Lampa.Player.play({
                                url: ep.link_m3u8 || ep.link_embed,
                                title: item.name + ' - ' + ep.name
                            });
                        });

                        wrap.append(btn);
                    });

                    _this.html.append(title);
                    _this.html.append(wrap);
                });
            }
        });


        /**
         * =========================
         * LIST (INFINITE SCROLL)
         * =========================
         */
        Lampa.Component.add('kkphim_list', {
            render: function () {
                console.log('📃 LIST RENDER');

                this.create();
                this.load();
            },

            create: function () {
                var _this = this;

                this.page = 1;
                this.loading = false;

                this.html = $('<div class="kk-list-page"></div>');
                this.activity.append(this.html);

                this.scroll = new Lampa.Scroll({
                    mask: true,
                    over: true
                });

                this.scroll.render().append(this.html);

                this.scroll.on('end', function () {
                    _this.load();
                });
            },

            load: function () {
                var _this = this;

                if (this.loading) return;
                this.loading = true;

                console.log('📥 LOAD PAGE:', this.page);

                Lampa.Reguest.get({
                    url: API + '/danh-sach/' + this.params.type + '?page=' + this.page,
                    success: function (res) {

                        _this.build(res.items);

                        _this.page++;
                        _this.loading = false;
                    }
                });
            },

            build: function (items) {
                var _this = this;

                items.forEach(function (item) {

                    var card = Lampa.Template.get('card', {
                        title: item.name,
                        img: fixImg(item.poster_url || item.thumb_url),
                        subtitle: item.episode_current
                    });

                    $(card).on('hover:enter', function () {
                        _this.open(item);
                    });

                    _this.html.append(card);
                });
            },

            open: function (item) {
                var _this = this;

                Lampa.Reguest.get({
                    url: API + '/phim/' + item.slug,
                    success: function (res) {
                        _this.showEpisodes(item, res.episodes);
                    }
                });
            },

            showEpisodes: function (item, episodes) {
                var _this = this;

                this.html.empty();

                episodes.forEach(function (server) {

                    var title = $('<div class="kk-server">' + server.server_name + '</div>');
                    var wrap = $('<div class="kk-episodes"></div>');

                    server.server_data.forEach(function (ep) {

                        var btn = $('<div class="kk-ep">' + ep.name + '</div>');

                        btn.on('hover:enter', function () {
                            Lampa.Player.play({
                                url: ep.link_m3u8 || ep.link_embed,
                                title: item.name + ' - ' + ep.name
                            });
                        });

                        wrap.append(btn);
                    });

                    _this.html.append(title);
                    _this.html.append(wrap);
                });
            }
        });


        /**
         * =========================
         * MENU (FIX CHẮC CHẮN HIỆN)
         * =========================
         */
        Lampa.Menu.add({
            title: 'KKPhim',
            component: 'kkphim_home',
            icon: 'movie',
            id: 'kkphim_menu'
        });

        console.log('✅ MENU ADDED OK');

    } catch (e) {
        console.error('❌ KKPHIM ERROR:', e);
    }
}

/**
 * =========================
 * APP READY FIX
 * =========================
 */
if (window.appready) {
    console.log('⚡ APP READY TRUE');
    startPlugin();
} else {
    console.log('⏳ WAIT APP READY...');
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {
            console.log('⚡ APP READY EVENT');
            startPlugin();
        }
    });
}

})();