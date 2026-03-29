(function () {
    'use strict';

    // Debug function
    function log(msg) {
        console.log('KKPhim: ' + msg);
    }

    var network = new Lampa.Reguest();

    // Cấu hình API
    var CONFIG = {
        base_url: 'https://phimapi.com',
        api_url: 'https://phimapi.com/v1/api',
        img_url: 'https://phimimg.com'
    };

    function getImageUrl(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return CONFIG.img_url + '/' + path;
    }

    function convertToLampaFormat(item) {
        return {
            id: item._id || item.slug,
            title: item.name || '',
            name: item.name || '',
            original_title: item.origin_name || '',
            overview: item.content || item.description || '',
            poster_path: getImageUrl(item.poster_url || item.thumb_url),
            backdrop_path: getImageUrl(item.thumb_url || item.poster_url),
            vote_average: 7.5,
            release_date: item.year ? item.year + '-01-01' : '',
            year: item.year || '',
            slug: item.slug || '',
            quality: item.quality || 'HD',
            lang: item.lang || 'Vietsub',
            episode_current: item.episode_current || '',
            kkphim_data: item
        };
    }

    function getApiUrl(type, page) {
        page = page || 1;
        switch(type) {
            case 'new': return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
            case 'phim-le': return CONFIG.api_url + '/danh-sach/phim-le?page=' + page;
            case 'phim-bo': return CONFIG.api_url + '/danh-sach/phim-bo?page=' + page;
            case 'hoat-hinh': return CONFIG.api_url + '/danh-sach/hoat-hinh?page=' + page;
            default: return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        }
    }

    // Component Category
    function KKCategory(object) {
        var comp = this;
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var page = 1;
        var loading = false;

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            var url = getApiUrl(object.url || 'new', page);
            log('Loading: ' + url);

            network.clear();
            network.timeout(15000);
            network.silent(url, function(response) {
                _this.activity.loader(false);
                
                var movies = [];
                var data = response.data || response;
                var list = data.items || [];

                list.forEach(function(item) {
                    movies.push(convertToLampaFormat(item));
                });

                log('Found ' + movies.length + ' movies');

                if (movies.length) {
                    _this.build(movies);
                }

                _this.activity.toggle();
            }, function(err) {
                log('Error: ' + JSON.stringify(err));
                _this.activity.loader(false);
                _this.activity.toggle();
            });
        };

        this.build = function(data) {
            var _this = this;
            
            data.forEach(function(movie) {
                var card = Lampa.Template.get('card', {
                    title: movie.title,
                    release_year: movie.year
                });

                var img = card.find('.card__img')[0] || card.find('img')[0];
                if (img) img.src = movie.poster_path || './img/img_broken.svg';

                card.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie
                    });
                });

                card.on('hover:focus', function(e) {
                    scroll.update($(e.target), true);
                });

                body.append(card);
            });
        };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;
            scroll.append(body);
            html.append(scroll.render());
            this.activity.mountCancel();
            this.create();
        };

        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return html; };
        this.destroy = function() {
            network.clear();
            scroll.destroy();
            html.remove();
        };
    }

    // Component Full (Chi tiết phim)
    function KKFull(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        var html = $('<div></div>');
        var body = $('<div class="kkphim-full-body"></div>');
        var card = object.card;

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            var url = CONFIG.base_url + '/phim/' + card.slug;
            log('Detail: ' + url);

            network.clear();
            network.timeout(15000);
            network.silent(url, function(response) {
                _this.activity.loader(false);

                if (response.movie) {
                    _this.build(response);
                } else {
                    body.append('<div style="padding:2em;text-align:center;">Không tìm thấy phim</div>');
                }

                _this.activity.toggle();
            }, function() {
                _this.activity.loader(false);
                body.append('<div style="padding:2em;text-align:center;">Lỗi kết nối</div>');
                _this.activity.toggle();
            });
        };

        this.build = function(data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];

            // Info section
            var info = $('<div style="padding:1.5em;">\
                <h1 style="font-size:1.8em;margin-bottom:0.3em;">' + movie.name + '</h1>\
                <p style="opacity:0.7;margin-bottom:1em;">' + (movie.origin_name || '') + '</p>\
                <p style="margin-bottom:1em;">' + (movie.year || '') + ' | ' + (movie.quality || 'HD') + ' | ' + (movie.lang || 'Vietsub') + '</p>\
                <p style="opacity:0.9;line-height:1.5;">' + (movie.content || '').substring(0, 300) + '</p>\
            </div>');
            body.append(info);

            // Episodes
            episodes.forEach(function(server) {
                var serverData = server.server_data || [];
                if (!serverData.length) return;

                var section = $('<div style="padding:1em 1.5em;">\
                    <h3 style="margin-bottom:1em;">' + (server.server_name || 'Server') + '</h3>\
                    <div class="kkphim-eps"></div>\
                </div>');

                var epsList = section.find('.kkphim-eps');

                serverData.forEach(function(ep, idx) {
                    var epBtn = $('<div class="kkphim-ep selector" style="display:inline-block;padding:0.6em 1em;margin:0.3em;background:rgba(255,255,255,0.1);border-radius:0.3em;">' + (ep.name || 'Tập ' + (idx+1)) + '</div>');
                    
                    epBtn.on('hover:enter', function() {
                        var streamUrl = ep.link_m3u8 || ep.link_embed;
                        if (streamUrl) {
                            Lampa.Player.play({
                                url: streamUrl,
                                title: movie.name + ' - ' + (ep.name || '')
                            });
                        } else {
                            Lampa.Noty.show('Không có link phát');
                        }
                    });

                    epsList.append(epBtn);
                });

                body.append(section);
            });
        };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;
            scroll.append(body);
            html.append(scroll.render());
            this.activity.mountCancel();
            this.create();
        };

        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return html; };
        this.destroy = function() {
            network.clear();
            scroll.destroy();
            html.remove();
        };
    }

    // Component Main
    function KKMain(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        var html = $('<div></div>');
        var body = $('<div style="padding:1em;"></div>');

        var cats = [
            {title: 'Phim Mới', url: 'new'},
            {title: 'Phim Lẻ', url: 'phim-le'},
            {title: 'Phim Bộ', url: 'phim-bo'},
            {title: 'Hoạt Hình', url: 'hoat-hinh'}
        ];

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            var loaded = 0;
            cats.forEach(function(cat) {
                _this.loadCat(cat, function() {
                    loaded++;
                    if (loaded >= cats.length) {
                        _this.activity.loader(false);
                        _this.activity.toggle();
                    }
                });
            });
        };

        this.loadCat = function(cat, callback) {
            var _this = this;
            var url = getApiUrl(cat.url, 1);

            network.silent(url, function(response) {
                var data = response.data || response;
                var list = (data.items || []).slice(0, 10);

                if (list.length) {
                    _this.buildLine(cat, list.map(convertToLampaFormat));
                }
                callback();
            }, callback);
        };

        this.buildLine = function(cat, movies) {
            var line = $('<div style="margin-bottom:1.5em;">\
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5em;">\
                    <span style="font-size:1.3em;">' + cat.title + '</span>\
                    <span class="kkphim-more selector" style="padding:0.5em 1em;opacity:0.7;">Xem thêm</span>\
                </div>\
                <div class="kkphim-row" style="display:flex;overflow-x:auto;gap:0.8em;padding:0.5em;"></div>\
            </div>');

            line.find('.kkphim-more').on('hover:enter', function() {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkphim_category'
                });
            });

            var row = line.find('.kkphim-row');
            movies.forEach(function(movie) {
                var card = $('<div class="kkphim-card selector" style="width:9em;flex-shrink:0;">\
                    <div style="position:relative;border-radius:0.4em;overflow:hidden;aspect-ratio:2/3;">\
                        <img src="' + (movie.poster_path || './img/img_broken.svg') + '" style="width:100%;height:100%;object-fit:cover;" />\
                    </div>\
                    <div style="margin-top:0.4em;font-size:0.85em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + movie.title + '</div>\
                </div>');

                card.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie
                    });
                });

                row.append(card);
            });

            body.append(line);
        };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;
            scroll.append(body);
            html.append(scroll.render());
            this.activity.mountCancel();
            this.create();
        };

        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return html; };
        this.destroy = function() {
            network.clear();
            scroll.destroy();
            html.remove();
        };
    }

    // CSS
    function addCSS() {
        if (document.getElementById('kkphim-css')) return;
        var style = document.createElement('style');
        style.id = 'kkphim-css';
        style.textContent = '\
            .kkphim-card.focus > div:first-child { border: 2px solid #fff; }\
            .kkphim-more.focus { opacity: 1 !important; background: rgba(255,255,255,0.1); border-radius: 0.3em; }\
            .kkphim-ep.focus { background: #e50914 !important; }\
        ';
        document.head.appendChild(style);
    }

    // MENU - Nhiều cách thử
    function addMenu() {
        log('Bắt đầu thêm menu...');

        // Icon
        var icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>';

        // Cách 1: Sử dụng Lampa.Menu.add (nếu có)
        if (Lampa.Menu && Lampa.Menu.add) {
            log('Thử Lampa.Menu.add');
            try {
                Lampa.Menu.add({
                    title: 'KKPhim',
                    icon: icon,
                    action: function() {
                        Lampa.Activity.push({
                            url: '',
                            title: 'KKPhim',
                            component: 'kkphim_main'
                        });
                    }
                });
                log('Menu.add thành công');
                return;
            } catch(e) {
                log('Menu.add lỗi: ' + e);
            }
        }

        // Cách 2: Tìm và thêm vào menu list
        function tryAddToMenu() {
            // Thử nhiều selector
            var selectors = [
                '.menu .menu__list',
                '.menu__list',
                '.menu ul',
                'nav .menu__list',
                '.sidebar .menu__list'
            ];

            var menu = null;
            for (var i = 0; i < selectors.length; i++) {
                menu = $(selectors[i]).first();
                if (menu.length) {
                    log('Tìm thấy menu với selector: ' + selectors[i]);
                    break;
                }
            }

            if (!menu || !menu.length) {
                log('Không tìm thấy menu, thử lại sau 1s...');
                setTimeout(tryAddToMenu, 1000);
                return;
            }

            // Kiểm tra đã thêm chưa
            if ($('[data-action="kkphim"]').length) {
                log('Menu đã tồn tại');
                return;
            }

            var item = $('<li class="menu__item selector" data-action="kkphim">\
                <div class="menu__ico">' + icon + '</div>\
                <div class="menu__text">KKPhim</div>\
            </li>');

            item.on('hover:enter', function() {
                log('Menu clicked');
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_main'
                });
            });

            // Thêm vào menu
            menu.append(item);
            log('Đã thêm menu thành công!');

            // Log cấu trúc menu để debug
            log('Menu items: ' + menu.children().length);
        }

        tryAddToMenu();
    }

    // Thêm vào Settings nếu menu không hoạt động
    function addToSettings() {
        if (Lampa.SettingsApi) {
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: 'kkphim_open',
                    type: 'button',
                    default: ''
                },
                field: {
                    name: 'Mở KKPhim'
                },
                onChange: function() {
                    Lampa.Activity.push({
                        url: '',
                        title: 'KKPhim',
                        component: 'kkphim_main'
                    });
                }
            });
            log('Đã thêm vào Settings');
        }
    }

    // Init
    function init() {
        log('Checking Lampa...');

        if (!window.Lampa) {
            setTimeout(init, 300);
            return;
        }

        if (!Lampa.Component) {
            setTimeout(init, 300);
            return;
        }

        log('Lampa found, registering components...');

        // Thêm CSS
        addCSS();

        // Đăng ký components
        Lampa.Component.add('kkphim_main', KKMain);
        Lampa.Component.add('kkphim_category', KKCategory);
        Lampa.Component.add('kkphim_full', KKFull);

        log('Components registered');

        // Thêm menu sau khi Lampa ready hoàn toàn
        if (window.appready) {
            addMenu();
            addToSettings();
        } else {
            Lampa.Listener.follow('app', function(event) {
                if (event.type === 'ready') {
                    log('App ready event');
                    setTimeout(addMenu, 500);
                    setTimeout(addToSettings, 600);
                }
            });

            // Backup: thử sau 3 giây
            setTimeout(function() {
                if (!$('[data-action="kkphim"]').length) {
                    log('Backup: thử thêm menu sau 3s');
                    addMenu();
                    addToSettings();
                }
            }, 3000);
        }

        log('Init complete');
    }

    // Start
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }

})();