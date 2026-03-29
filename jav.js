(function () {
    'use strict';

    var API_URL = 'https://phimapi.com/';

    function startPlugin() {
        // CSS
        Lampa.Template.add('kkphim_style', `
            <style>
                .kkphim-row {
                    padding: 1.5em 1.5em 0;
                }
                .kkphim-row-title {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 0.8em;
                }
                .kkphim-row-title-text {
                    font-size: 1.3em;
                    font-weight: bold;
                    color: #fff;
                }
                .kkphim-row-more {
                    font-size: 0.9em;
                    color: rgba(255,255,255,0.5);
                    cursor: pointer;
                    padding: 0.5em 1em;
                    border-radius: 0.3em;
                }
                .kkphim-row-more.focus {
                    background: #fff;
                    color: #000;
                }
                .kkphim-row-items {
                    display: flex;
                    flex-wrap: nowrap;
                    gap: 1em;
                    overflow-x: auto;
                    padding-bottom: 0.5em;
                }
                .kkphim-row-items::-webkit-scrollbar {
                    display: none;
                }
                .kkphim-card {
                    flex-shrink: 0;
                    width: 12em;
                    cursor: pointer;
                    transition: transform 0.2s;
                    border-radius: 0.5em;
                    overflow: hidden;
                    position: relative;
                }
                .kkphim-card.focus {
                    transform: scale(1.08);
                }
                .kkphim-card-img {
                    width: 100%;
                    height: 17em;
                    position: relative;
                    overflow: hidden;
                    background: #222;
                }
                .kkphim-card-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .kkphim-card-quality {
                    position: absolute;
                    top: 0.5em;
                    left: 0.5em;
                    background: #f9a825;
                    color: #000;
                    padding: 0.1em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.75em;
                    font-weight: bold;
                }
                .kkphim-card-ep {
                    position: absolute;
                    top: 0.5em;
                    right: 0.5em;
                    background: #e53935;
                    color: #fff;
                    padding: 0.1em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.75em;
                }
                .kkphim-card-name {
                    padding: 0.5em;
                    font-size: 0.85em;
                    color: #fff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    background: rgba(0,0,0,0.6);
                }
                .kkphim-card-year {
                    padding: 0 0.5em 0.5em;
                    font-size: 0.7em;
                    color: rgba(255,255,255,0.5);
                    background: rgba(0,0,0,0.6);
                }

                /* Detail */
                .kkphim-info {
                    position: relative;
                }
                .kkphim-info-backdrop {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%;
                    height: 25em;
                    overflow: hidden;
                }
                .kkphim-info-backdrop img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .kkphim-info-backdrop-gradient {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to bottom, 
                        rgba(0,0,0,0.2) 0%, 
                        rgba(0,0,0,0.8) 70%, 
                        rgba(0,0,0,1) 100%);
                }
                .kkphim-info-body {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    gap: 2em;
                    padding: 5em 2em 2em;
                }
                .kkphim-info-poster img {
                    width: 14em;
                    border-radius: 0.8em;
                    box-shadow: 0 0.5em 2em rgba(0,0,0,0.5);
                }
                .kkphim-info-text {
                    flex: 1;
                    color: #fff;
                }
                .kkphim-info-title {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 0.2em;
                }
                .kkphim-info-orig {
                    font-size: 1em;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 1em;
                }
                .kkphim-info-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5em;
                    margin-bottom: 1em;
                }
                .kkphim-tag {
                    background: rgba(255,255,255,0.15);
                    padding: 0.3em 0.8em;
                    border-radius: 1em;
                    font-size: 0.8em;
                }
                .kkphim-info-genres {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5em;
                    margin-bottom: 1em;
                }
                .kkphim-genre {
                    background: rgba(76,175,80,0.25);
                    border: 1px solid rgba(76,175,80,0.5);
                    padding: 0.2em 0.8em;
                    border-radius: 1em;
                    font-size: 0.8em;
                    color: #81c784;
                }
                .kkphim-info-desc {
                    font-size: 0.9em;
                    line-height: 1.6;
                    color: rgba(255,255,255,0.8);
                    margin-bottom: 1.5em;
                    max-height: 8em;
                    overflow: hidden;
                }
                .kkphim-info-btns {
                    display: flex;
                    gap: 1em;
                    margin-bottom: 2em;
                }
                .kkphim-play-btn {
                    background: #e50914;
                    color: #fff;
                    padding: 0.8em 2em;
                    border-radius: 0.5em;
                    font-size: 1em;
                    font-weight: bold;
                    cursor: pointer;
                }
                .kkphim-play-btn.focus {
                    background: #ff1744;
                    transform: scale(1.05);
                }
                .kkphim-eps-title {
                    font-size: 1.2em;
                    font-weight: bold;
                    color: #fff;
                    padding: 1em 2em 0.5em;
                }
                .kkphim-eps-server {
                    color: #4CAF50;
                    font-size: 0.9em;
                    padding: 0.5em 2em;
                    font-weight: bold;
                }
                .kkphim-eps-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5em;
                    padding: 0 2em 2em;
                }
                .kkphim-ep-btn {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    padding: 0.6em 1.2em;
                    border-radius: 0.4em;
                    font-size: 0.85em;
                    cursor: pointer;
                    min-width: 4em;
                    text-align: center;
                }
                .kkphim-ep-btn.focus {
                    background: #e50914;
                }

                /* Category page */
                .kkphim-cat-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1em;
                    padding: 1.5em;
                }
                .kkphim-cat-grid .kkphim-card {
                    width: 10em;
                }
                .kkphim-cat-grid .kkphim-card-img {
                    height: 14em;
                }
                .kkphim-load-more {
                    text-align: center;
                    padding: 1em;
                    color: #fff;
                    font-size: 1em;
                    cursor: pointer;
                    background: rgba(255,255,255,0.1);
                    margin: 1em 1.5em;
                    border-radius: 0.5em;
                }
                .kkphim-load-more.focus {
                    background: #e50914;
                }
            </style>
        `);
        $('body').append(Lampa.Template.get('kkphim_style', {}, true));

        // ====== MAIN COMPONENT ======
        Lampa.Component.add('kkphim_main', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var html = $('<div></div>');
            var loaded = 0;
            var total = 4;
            var comp = this;

            var categories = [
                { name: 'Phim Mới Cập Nhật', slug: 'phim-moi-cap-nhat', api: 'danh-sach/phim-moi-cap-nhat' },
                { name: 'Phim Bộ', slug: 'phim-bo', api: 'v1/api/danh-sach/phim-bo' },
                { name: 'Phim Lẻ', slug: 'phim-le', api: 'v1/api/danh-sach/phim-le' },
                { name: 'Hoạt Hình', slug: 'hoat-hinh', api: 'v1/api/danh-sach/hoat-hinh' }
            ];

            this.create = function () {
                this.activity.loader(true);
                html.append(scroll.render());

                categories.forEach(function (cat) {
                    loadRow(cat);
                });
            };

            function loadRow(cat) {
                var url = API_URL + cat.api + '?page=1';

                network.silent(url, function (result) {
                    var movieList = [];

                    // Xử lý 2 kiểu API response
                    if (result.items) {
                        movieList = result.items;
                    } else if (result.data && result.data.items) {
                        movieList = result.data.items;
                    }

                    if (movieList.length) {
                        buildRow(cat.name, movieList.slice(0, 12), cat);
                    }

                    loaded++;
                    if (loaded >= total) {
                        comp.activity.loader(false);
                        comp.start();
                    }
                }, function () {
                    loaded++;
                    if (loaded >= total) {
                        comp.activity.loader(false);
                        comp.start();
                    }
                });
            }

            function buildRow(title, movies, cat) {
                var row = $('<div class="kkphim-row"></div>');

                // Title + View more
                var header = $('<div class="kkphim-row-title"></div>');
                header.append('<div class="kkphim-row-title-text">' + title + '</div>');

                var more = $('<div class="kkphim-row-more selector">Xem thêm ▸</div>');
                more.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: cat.name,
                        component: 'kkphim_category',
                        cat: cat,
                        page: 1
                    });
                });
                header.append(more);
                row.append(header);

                // Cards
                var items = $('<div class="kkphim-row-items"></div>');
                movies.forEach(function (m) {
                    var poster = '';
                    if (m.poster_url) {
                        poster = m.poster_url.indexOf('http') === 0 ? m.poster_url : 'https://phimimg.com/' + m.poster_url;
                    } else if (m.thumb_url) {
                        poster = m.thumb_url.indexOf('http') === 0 ? m.thumb_url : 'https://phimimg.com/' + m.thumb_url;
                    }

                    var card = $(
                        '<div class="kkphim-card selector">' +
                            '<div class="kkphim-card-img">' +
                                '<img src="' + poster + '" />' +
                                (m.quality ? '<div class="kkphim-card-quality">' + m.quality + '</div>' : '') +
                                (m.episode_current ? '<div class="kkphim-card-ep">' + m.episode_current + '</div>' : '') +
                            '</div>' +
                            '<div class="kkphim-card-name">' + (m.name || '') + '</div>' +
                            '<div class="kkphim-card-year">' + (m.year || '') + '</div>' +
                        '</div>'
                    );

                    card.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: '',
                            title: m.name,
                            component: 'kkphim_detail',
                            movie: m,
                            page: 1
                        });
                    });

                    card.on('hover:focus', function () {
                        scroll.update(card, true);
                    });

                    items.append(card);
                });

                row.append(items);
                scroll.append(row);
            }

            this.start = function () {
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(scroll.render());
                        Lampa.Controller.collectionFocus(false, scroll.render());
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function () { Navigator.move('right'); },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
                        else Lampa.Controller.toggle('head');
                    },
                    down: function () { Navigator.move('down'); },
                    back: function () { Lampa.Activity.backward(); }
                });

                Lampa.Controller.toggle('content');
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
                html.remove();
            };
        });

        // ====== DETAIL COMPONENT ======
        Lampa.Component.add('kkphim_detail', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var html = $('<div></div>');
            var movie = object.movie;
            var comp = this;

            this.create = function () {
                this.activity.loader(true);
                html.append(scroll.render());

                var url = API_URL + 'phim/' + movie.slug;

                network.silent(url, function (result) {
                    var data = result.movie || result;
                    var episodes = result.episodes || [];
                    buildDetail(data, episodes);
                    comp.activity.loader(false);
                    comp.start();
                }, function () {
                    comp.activity.loader(false);
                    Lampa.Noty.show('Lỗi tải phim');
                });
            };

            function buildDetail(data, episodes) {
                var backdrop = '';
                if (data.poster_url) {
                    backdrop = data.poster_url.indexOf('http') === 0 ? data.poster_url : 'https://phimimg.com/' + data.poster_url;
                }
                var thumb = '';
                if (data.thumb_url) {
                    thumb = data.thumb_url.indexOf('http') === 0 ? data.thumb_url : 'https://phimimg.com/' + data.thumb_url;
                }

                var vote = 'N/A';
                try { vote = data.tmdb.vote_average; } catch(e) {}

                var cats = '';
                try {
                    cats = (data.category || []).map(function(c) {
                        return '<span class="kkphim-genre">' + c.name + '</span>';
                    }).join('');
                } catch(e) {}

                var detail = $(
                    '<div class="kkphim-info">' +
                        '<div class="kkphim-info-backdrop">' +
                            '<img src="' + backdrop + '" />' +
                            '<div class="kkphim-info-backdrop-gradient"></div>' +
                        '</div>' +
                        '<div class="kkphim-info-body">' +
                            '<div class="kkphim-info-poster"><img src="' + thumb + '" /></div>' +
                            '<div class="kkphim-info-text">' +
                                '<div class="kkphim-info-title">' + (data.name || '') + '</div>' +
                                '<div class="kkphim-info-orig">' + (data.origin_name || '') + '</div>' +
                                '<div class="kkphim-info-tags">' +
                                    '<span class="kkphim-tag">⭐ ' + vote + '</span>' +
                                    '<span class="kkphim-tag">📅 ' + (data.year || '') + '</span>' +
                                    '<span class="kkphim-tag">⏱ ' + (data.time || '') + '</span>' +
                                    '<span class="kkphim-tag">🎬 ' + (data.episode_current || '') + '</span>' +
                                '</div>' +
                                '<div class="kkphim-info-genres">' + cats + '</div>' +
                                '<div class="kkphim-info-desc">' + (data.content || '') + '</div>' +
                                '<div class="kkphim-info-btns">' +
                                    '<div class="kkphim-play-btn selector">▶ Xem phim</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );

                // Nút phát
                detail.find('.kkphim-play-btn').on('hover:enter', function () {
                    try {
                        playEp(episodes[0].server_data[0]);
                    } catch(e) {
                        Lampa.Noty.show('Không tìm thấy link phát');
                    }
                });

                scroll.append(detail);

                // Episodes
                if (episodes && episodes.length) {
                    scroll.append($('<div class="kkphim-eps-title">Danh sách tập</div>'));

                    episodes.forEach(function (sv) {
                        scroll.append($('<div class="kkphim-eps-server">' + sv.server_name + '</div>'));

                        var grid = $('<div class="kkphim-eps-grid"></div>');

                        sv.server_data.forEach(function (ep) {
                            var btn = $('<div class="kkphim-ep-btn selector">' + ep.name + '</div>');
                            btn.on('hover:enter', function () {
                                playEp(ep);
                            });
                            btn.on('hover:focus', function () {
                                scroll.update(btn, true);
                            });
                            grid.append(btn);
                        });

                        scroll.append(grid);
                    });
                }
            }

            function playEp(ep) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                if (!link) {
                    Lampa.Noty.show('Không có link');
                    return;
                }

                Lampa.Player.play({
                    title: movie.name + ' - ' + ep.name,
                    url: link
                });
            }

            this.start = function () {
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(scroll.render());
                        Lampa.Controller.collectionFocus(false, scroll.render());
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function () { Navigator.move('right'); },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
                        else Lampa.Controller.toggle('head');
                    },
                    down: function () { Navigator.move('down'); },
                    back: function () { Lampa.Activity.backward(); }
                });

                Lampa.Controller.toggle('content');
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
                html.remove();
            };
        });

        // ====== CATEGORY COMPONENT ======
        Lampa.Component.add('kkphim_category', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var html = $('<div></div>');
            var cat = object.cat;
            var page = 1;
            var grid;
            var comp = this;

            this.create = function () {
                this.activity.loader(true);
                html.append(scroll.render());
                grid = $('<div class="kkphim-cat-grid"></div>');
                scroll.append(grid);
                loadPage();
            };

            function loadPage() {
                var url = API_URL + cat.api + '?page=' + page;

                network.silent(url, function (result) {
                    var movieList = [];
                    if (result.items) movieList = result.items;
                    else if (result.data && result.data.items) movieList = result.data.items;

                    movieList.forEach(function (m) {
                        var poster = '';
                        if (m.poster_url) {
                            poster = m.poster_url.indexOf('http') === 0 ? m.poster_url : 'https://phimimg.com/' + m.poster_url;
                        }

                        var card = $(
                            '<div class="kkphim-card selector">' +
                                '<div class="kkphim-card-img">' +
                                    '<img src="' + poster + '" />' +
                                    (m.quality ? '<div class="kkphim-card-quality">' + m.quality + '</div>' : '') +
                                    (m.episode_current ? '<div class="kkphim-card-ep">' + m.episode_current + '</div>' : '') +
                                '</div>' +
                                '<div class="kkphim-card-name">' + (m.name || '') + '</div>' +
                                '<div class="kkphim-card-year">' + (m.year || '') + '</div>' +
                            '</div>'
                        );

                        card.on('hover:enter', function () {
                            Lampa.Activity.push({
                                url: '',
                                title: m.name,
                                component: 'kkphim_detail',
                                movie: m,
                                page: 1
                            });
                        });

                        card.on('hover:focus', function () {
                            scroll.update(card, true);
                        });

                        grid.append(card);
                    });

                    // Load more button
                    var moreBtn = $('<div class="kkphim-load-more selector">Tải thêm ▾</div>');
                    moreBtn.on('hover:enter', function () {
                        moreBtn.remove();
                        page++;
                        loadPage();
                    });
                    scroll.append(moreBtn);

                    comp.activity.loader(false);
                    comp.start();
                }, function () {
                    comp.activity.loader(false);
                    Lampa.Noty.show('Lỗi tải danh mục');
                });
            }

            this.start = function () {
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(scroll.render());
                        Lampa.Controller.collectionFocus(false, scroll.render());
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function () { Navigator.move('right'); },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
                        else Lampa.Controller.toggle('head');
                    },
                    down: function () { Navigator.move('down'); },
                    back: function () { Lampa.Activity.backward(); }
                });

                Lampa.Controller.toggle('content');
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return html; };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
                html.remove();
            };
        });

        // ====== MENU ======
        var item = $('<li class="menu__item selector" data-action="kkphim">' +
            '<div class="menu__ico">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">' +
                    '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                '</svg>' +
            '</div>' +
            '<div class="menu__text">KKPhim</div>' +
        '</li>');

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main',
                page: 1
            });
        });

        // Chèn vào menu
        $('.menu .menu__list').first().append(item);
    }

    // Khởi động
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                startPlugin();
            }
        });
    }

})();