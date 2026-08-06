(function () {
    'use strict';

    if (window.lampa_vn_phim_plugin_loaded) return;
    window.lampa_vn_phim_plugin_loaded = true;

    var CONFIG = {
        kkphim: {
            name: 'KKPhim',
            api: 'https://phimapi.com/',
            img: 'https://phimimg.com/'
        },
        ophim: {
            name: 'OPhim',
            api: 'https://ophim1.com/',
            img: 'https://img.ophim.live/uploads/movies/'
        }
    };

    function getSource() {
        return Lampa.Storage.get('vn_phim_source', 'kkphim');
    }

    function setSource(key) {
        Lampa.Storage.set('vn_phim_source', key);
    }

    function fixImgUrl(url, domainImg) {
        if (!url) return '';
        if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) return url;
        var base = domainImg || CONFIG[getSource()].img;
        return base + url.replace(/^\//, '');
    }

    function fetchJson(url, callback, errorCallback) {
        var network = new Lampa.Reguest();
        network.timeout(15000);
        network.silent(url, function (data) {
            try {
                var json = typeof data === 'string' ? JSON.parse(data) : data;
                callback(json);
            } catch (e) {
                if (errorCallback) errorCallback('Lỗi phân giải JSON');
            }
        }, function (a, b) {
            if (errorCallback) errorCallback(a || b || 'Lỗi kết nối');
        });
    }

    function cleanTitle(title) {
        if (!title) return '';
        return title
            .replace(/[\(\)\[\]]/g, ' ')
            .replace(/season\s+\d+/gi, '')
            .replace(/tập\s+\d+/gi, '')
            .trim();
    }

    function injectStyles() {
        if ($('#vn-phim-styles').length > 0) return;
        var css = 
            '<style id="vn-phim-styles">' +
            '.vn-overlay { position: fixed; inset: 0; background: #0f0f12; z-index: 1000; display: flex; flex-direction: column; color: #fff; font-family: sans-serif; }' +
            '.vn-header { display: flex; align-items: center; padding: 20px 40px; gap: 20px; background: rgba(255,255,255,0.03); }' +
            '.vn-header-title { font-size: 1.8em; font-weight: 800; flex: 1; }' +
            '.vn-content { flex: 1; overflow-y: auto; padding: 20px 40px; }' +
            '.vn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 25px; }' +
            '.vn-card { display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.05); cursor: pointer; transition: transform 0.2s, border-color 0.2s; border: 2px solid transparent; position: relative; }' +
            '.vn-card.focus { transform: scale(1.05); border-color: #e50914; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 10; }' +
            '.vn-card-img { width: 100%; aspect-ratio: 2/3; object-fit: cover; background: #1a1a2e; }' +
            '.vn-card-body { padding: 12px; }' +
            '.vn-card-title { font-size: 0.95em; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
            '.vn-card-year { font-size: 0.8em; color: #aaa; margin-top: 4px; }' +
            '.vn-detail { position: fixed; inset: 0; background: #0a0a0c; z-index: 1001; display: flex; flex-direction: column; }' +
            '.vn-detail-hero { position: relative; width: 100%; height: 60vh; overflow: hidden; }' +
            '.vn-detail-backdrop { width: 100%; height: 100%; object-fit: cover; opacity: 0.4; }' +
            '.vn-detail-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, #0a0a0c, transparent); }' +
            '.vn-detail-info { position: absolute; bottom: 40px; left: 40px; right: 40px; display: flex; gap: 30px; align-items: flex-end; }' +
            '.vn-detail-poster { width: 200px; aspect-ratio: 2/3; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); }' +
            '.vn-detail-text { flex: 1; padding-bottom: 10px; }' +
            '.vn-detail-title { font-size: 3em; font-weight: 900; margin-bottom: 10px; line-height: 1.1; }' +
            '.vn-detail-meta { display: flex; gap: 15px; color: #ccc; font-size: 1.1em; margin-bottom: 15px; }' +
            '.vn-detail-desc { font-size: 1.1em; color: #aaa; line-height: 1.6; max-width: 800px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }' +
            '.vn-detail-body { flex: 1; padding: 40px; overflow-y: auto; }' +
            '.vn-server-row { margin-bottom: 30px; }' +
            '.vn-server-name { font-size: 1.2em; font-weight: 700; color: #e50914; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }' +
            '.vn-episodes { display: flex; flex-wrap: wrap; gap: 10px; }' +
            '.vn-episode { padding: 12px 20px; background: rgba(255,255,255,0.08); border-radius: 8px; cursor: pointer; font-weight: 600; min-width: 60px; text-align: center; border: 1px solid transparent; }' +
            '.vn-episode.focus { background: #e50914; border-color: #fff; transform: scale(1.05); }' +
            '</style>';
        $('head').append(css);
    }

    function VNPhimCatalogComponent(object) {
        var comp = this;
        var page = object.page || 1;
        var overlay = $('<div class="vn-overlay"></div>');
        var grid = $('<div class="vn-grid"></div>');
        var lastFocus = null;

        this.create = function () {
            injectStyles();
            var header = $(
                '<div class="vn-header">' +
                    '<div class="vn-header-title">' + object.title + '</div>' +
                    '<div class="vn-header-source">Nguồn: ' + CONFIG[getSource()].name + '</div>' +
                '</div>'
            );
            var content = $('<div class="vn-content"></div>').append(grid);
            overlay.append(header).append(content);
            $('body').append(overlay);
            this.loadData();
        };

        this.loadData = function () {
            var srcKey = getSource();
            var cfg = CONFIG[srcKey];
            var url = object.isSearch 
                ? cfg.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(object.keyword || '') + '&page=' + page
                : cfg.api + 'v1/api/danh-sach/' + (object.cat || 'phim-moi-cap-nhat') + '?page=' + page;

            Lampa.Loading.start();
            fetchJson(url, function (res) {
                Lampa.Loading.stop();
                var rawItems = (res && res.data && res.data.items) ? res.data.items : [];
                var domainImg = (res && res.data && res.data.params && res.data.params.items_update_iv) ? res.data.params.items_update_iv : (res && res.pathImage ? res.pathImage : '');
                
                rawItems.forEach(function (it) {
                    var poster = fixImgUrl(it.poster_url || it.thumb_url, domainImg);
                    var card = $(
                        '<div class="vn-card selector">' +
                            '<img class="vn-card-img" src="' + poster + '" />' +
                            '<div class="vn-card-body">' +
                                '<div class="vn-card-title">' + it.name + '</div>' +
                                '<div class="vn-card-year">' + (it.year || '') + '</div>' +
                            '</div>' +
                        '</div>'
                    );

                    card.on('hover:focus focus', function () {
                        $(this).addClass('focus');
                        lastFocus = this;
                    }).on('hover:blur blur', function () {
                        $(this).removeClass('focus');
                    }).on('hover:enter click', function () {
                        comp.openMovieDetail(it.slug);
                    });

                    grid.append(card);
                });

                comp.start();
            }, function (err) {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi: ' + err);
            });
        };

        this.openMovieDetail = function (slug) {
            var srcKey = getSource();
            var detailUrl = CONFIG[srcKey].api + 'phim/' + slug;
            Lampa.Loading.start();
            fetchJson(detailUrl, function (res) {
                Lampa.Loading.stop();
                var movie = res.movie || (res.data && res.data.item);
                var episodes = res.episodes || (res.data && res.data.episodes) || [];

                if (!movie) return Lampa.Noty.show('Không tìm thấy phim');

                var detail = $('<div class="vn-detail"></div>');
                var backdrop = movie.thumb_url || movie.poster_url;
                var poster = movie.poster_url || movie.thumb_url;

                var hero = $(
                    '<div class="vn-detail-hero">' +
                        '<img class="vn-detail-backdrop" src="' + backdrop + '" />' +
                        '<div class="vn-detail-info">' +
                            '<img class="vn-detail-poster" src="' + poster + '" />' +
                            '<div class="vn-detail-text">' +
                                '<div class="vn-detail-title">' + movie.name + '</div>' +
                                '<div class="vn-detail-meta">' +
                                    '<span>' + movie.year + '</span> • ' +
                                    '<span>' + (movie.time || '') + '</span> • ' +
                                    '<span>' + (movie.quality || 'HD') + '</span>' +
                                '</div>' +
                                '<div class="vn-detail-desc">' + (movie.content || '') + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );

                var body = $('<div class="vn-detail-body"></div>');
                episodes.forEach(function(srv) {
                    var srvRow = $('<div class="vn-server-row"><div class="vn-server-name">' + srv.server_name + '</div></div>');
                    var epGrid = $('<div class="vn-episodes"></div>');
                    (srv.server_data || []).forEach(function(ep, idx) {
                        var epBtn = $('<div class="vn-episode selector">' + ep.name + '</div>');
                        epBtn.on('hover:enter click', function() {
                            var playlist = srv.server_data.map(function(e) {
                                return { title: movie.name + ' - ' + e.name, url: e.link_m3u8 };
                            });
                            Lampa.Player.play(playlist[idx]);
                            Lampa.Player.playlist(playlist);
                        });
                        epGrid.append(epBtn);
                    });
                    srvRow.append(epGrid);
                    body.append(srvRow);
                });

                detail.append(hero).append(body);
                $('body').append(detail);

                Lampa.Controller.add('vn_detail', {
                    toggle: function () {
                        var selectors = detail.find('.selector');
                        Lampa.Controller.collectionSet(selectors);
                        Lampa.Controller.collectionFocus(selectors.eq(0)[0], detail);
                    },
                    back: function () {
                        detail.remove();
                        comp.start();
                    }
                });
                Lampa.Controller.toggle('vn_detail');

            }, function (err) {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi: ' + err);
            });
        };

        this.start = function () {
            Lampa.Controller.add('vn_catalog', {
                toggle: function () {
                    var selectors = overlay.find('.selector');
                    Lampa.Controller.collectionSet(selectors);
                    Lampa.Controller.collectionFocus(lastFocus || selectors.eq(0)[0], overlay);
                },
                back: function () {
                    overlay.remove();
                    Lampa.Controller.toggle('menu');
                }
            });
            Lampa.Controller.toggle('vn_catalog');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return $(''); };
        this.destroy = function () { overlay.remove(); };
    }

    Lampa.Component.add('vn_phim_catalog', VNPhimCatalogComponent);

    function VNPhimPlugin() {
        this.init = function () {
            this.injectSidebarMenu();
        };

        this.injectSidebarMenu = function () {
            var self = this;
            var addMenuItem = function () {
                var $menuList = $('.menu .menu__list, .menu__items').first();
                if (!$menuList.length || $menuList.find('.menu__item--vn-phim').length > 0) return;

                var $item = $('<li class="menu__item selector menu__item--vn-phim"><div class="menu__ico"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg></div><div class="menu__text">Phim Việt Nam</div></li>');
                $menuList.append($item);
                $item.on('hover:enter click', function () { self.showMainSelect(); });
            };
            Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') setTimeout(addMenuItem, 500); });
            setTimeout(addMenuItem, 1000);
        };

        this.showMainSelect = function() {
            var self = this;
            Lampa.Select.show({
                title: 'Phim Việt Nam',
                items: [
                    { title: '🔥 Phim Mới Cập Nhật', cat: 'phim-moi-cap-nhat' },
                    { title: '🎬 Phim Bộ', cat: 'phim-bo' },
                    { title: '🎥 Phim Lẻ', cat: 'phim-le' },
                    { title: '🧸 Hoạt Hình', cat: 'hoat-hinh' },
                    { title: '🔍 Tìm Kiếm', isSearch: true },
                    { title: '⚙️ Đổi Nguồn (KK/OPhim)', action: 'source' }
                ],
                onSelect: function (item) {
                    if (item.action === 'source') {
                        setSource(getSource() === 'kkphim' ? 'ophim' : 'kkphim');
                        Lampa.Noty.show('Đã đổi nguồn sang ' + CONFIG[getSource()].name);
                    } else {
                        new VNPhimCatalogComponent(item).create();
                    }
                },
                onBack: function () { Lampa.Controller.toggle('menu'); }
            });
        };
    }

    if (window.appready) new VNPhimPlugin().init();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') new VNPhimPlugin().init(); });
})();
