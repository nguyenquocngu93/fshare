(function () {
    'use strict';

    function log(msg) {
        console.log('KKPhim: ' + msg);
    }

    var network = new Lampa.Reguest();

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
            vote_average: item.tmdb?.vote_average || 7.5,
            release_date: item.year ? item.year + '-01-01' : '',
            year: item.year || '',
            slug: item.slug || '',
            quality: item.quality || 'HD',
            lang: item.lang || 'Vietsub',
            episode_current: item.episode_current || '',
            episode_total: item.episode_total || '',
            time: item.time || '',
            country: item.country || [],
            category: item.category || [],
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
            case 'tv-shows': return CONFIG.api_url + '/danh-sach/tv-shows?page=' + page;
            case 'phim-vietsub': return CONFIG.api_url + '/danh-sach/phim-vietsub?page=' + page;
            case 'phim-thuyet-minh': return CONFIG.api_url + '/danh-sach/phim-thuyet-minh?page=' + page;
            case 'phim-long-tieng': return CONFIG.api_url + '/danh-sach/phim-long-tieng?page=' + page;
            default: return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        }
    }

    // ==================== COMPONENT CATEGORY ====================
    function KKCategory(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var page = 1;
        var total_pages = 100;
        var loading = false;
        var items = [];

        this.create = function() {
            this.activity.loader(true);
            this.loadData();
        };

        this.loadData = function() {
            var _this = this;
            if (loading) return;
            loading = true;

            var url = getApiUrl(object.url || 'new', page);

            network.clear();
            network.timeout(15000);
            network.silent(url, function(response) {
                _this.activity.loader(false);
                loading = false;
                
                var movies = [];
                var data = response.data || response;
                var list = data.items || [];

                total_pages = data.params?.pagination?.totalPages || 
                              data.pagination?.totalPages || 100;

                list.forEach(function(item) {
                    movies.push(convertToLampaFormat(item));
                });

                if (movies.length) {
                    _this.build(movies);
                } else if (page === 1) {
                    _this.empty();
                }

                _this.activity.toggle();
            }, function(err) {
                _this.activity.loader(false);
                loading = false;
                if (page === 1) _this.empty();
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
                if (img) {
                    img.src = movie.poster_path || './img/img_broken.svg';
                    img.onerror = function() { this.src = './img/img_broken.svg'; };
                }

                // Thêm badge
                var view = card.find('.card__view');
                if (view.length) {
                    if (movie.quality) {
                        view.append('<div class="kk-badge kk-quality">' + movie.quality + '</div>');
                    }
                    if (movie.episode_current) {
                        view.append('<div class="kk-badge kk-episode">' + movie.episode_current + '</div>');
                    }
                    if (movie.lang) {
                        view.append('<div class="kk-badge kk-lang">' + movie.lang + '</div>');
                    }
                }

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
                items.push(card);
            });

            // Nút tải thêm
            if (page < total_pages) {
                var load = $('<div class="category-full__load more selector"><div class="category-full__load-text">Tải thêm</div></div>');
                body.append(load);

                load.on('hover:enter', function() {
                    page++;
                    load.remove();
                    _this.activity.loader(true);
                    _this.loadData();
                });

                load.on('hover:focus', function(e) {
                    scroll.update($(e.target), true);
                });
            }
        };

        this.empty = function() {
            body.append('<div class="category-full__empty"><div class="category-full__empty-text">Không có dữ liệu</div></div>');
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
            items.forEach(function(i) { i.remove(); });
            html.remove();
        };
    }

    // ==================== COMPONENT FULL (CHI TIẾT) ====================
    function KKFull(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        var html = $('<div></div>');
        var body = $('<div class="kkphim-full"></div>');
        var card = object.card;

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            var url = CONFIG.base_url + '/phim/' + card.slug;

            network.clear();
            network.timeout(15000);
            network.silent(url, function(response) {
                _this.activity.loader(false);

                if (response.movie) {
                    _this.build(response);
                } else {
                    _this.empty();
                }

                _this.activity.toggle();
            }, function() {
                _this.activity.loader(false);
                _this.empty();
                _this.activity.toggle();
            });
        };

        this.build = function(data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];

            // Header
            var header = $('<div class="kk-detail">\
                <div class="kk-detail__poster">\
                    <img src="' + getImageUrl(movie.poster_url || movie.thumb_url) + '" />\
                </div>\
                <div class="kk-detail__info">\
                    <div class="kk-detail__title">' + movie.name + '</div>\
                    <div class="kk-detail__original">' + (movie.origin_name || '') + '</div>\
                    <div class="kk-detail__meta">\
                        <span class="kk-tag kk-tag--primary">' + (movie.year || 'N/A') + '</span>\
                        <span class="kk-tag kk-tag--success">' + (movie.quality || 'HD') + '</span>\
                        <span class="kk-tag">' + (movie.lang || 'Vietsub') + '</span>\
                        <span class="kk-tag">' + (movie.time || '') + '</span>\
                    </div>\
                    <div class="kk-detail__extra">\
                        <div><b>Trạng thái:</b> ' + (movie.episode_current || 'Full') + '</div>\
                        <div><b>Quốc gia:</b> ' + (movie.country?.map(function(c){return c.name}).join(', ') || 'N/A') + '</div>\
                        <div><b>Thể loại:</b> ' + (movie.category?.map(function(c){return c.name}).join(', ') || 'N/A') + '</div>\
                        <div><b>Đạo diễn:</b> ' + (movie.director?.join(', ') || 'N/A') + '</div>\
                        <div><b>Diễn viên:</b> ' + (movie.actor?.slice(0,5).join(', ') || 'N/A') + '</div>\
                    </div>\
                    <div class="kk-detail__desc">' + (movie.content || 'Không có mô tả') + '</div>\
                </div>\
            </div>');
            body.append(header);

            // Episodes
            if (episodes.length) {
                episodes.forEach(function(server, sIdx) {
                    var serverData = server.server_data || [];
                    if (!serverData.length) return;

                    var section = $('<div class="kk-episodes">\
                        <div class="kk-episodes__title">' + (server.server_name || 'Server ' + (sIdx + 1)) + ' (' + serverData.length + ' tập)</div>\
                        <div class="kk-episodes__list"></div>\
                    </div>');

                    var list = section.find('.kk-episodes__list');

                    serverData.forEach(function(ep, epIdx) {
                        var epBtn = $('<div class="kk-ep selector">' + (ep.name || 'Tập ' + (epIdx + 1)) + '</div>');
                        
                        epBtn.on('hover:enter', function() {
                            _this.play(ep, movie, serverData, epIdx);
                        });

                        list.append(epBtn);
                    });

                    body.append(section);
                });
            } else {
                body.append('<div class="kk-no-episodes">Phim chưa có tập nào</div>');
            }
        };

        this.play = function(episode, movie, allEps, index) {
            var streamUrl = episode.link_m3u8 || episode.link_embed;
            
            if (!streamUrl) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            // Tạo playlist
            var playlist = allEps.map(function(ep, i) {
                return {
                    title: movie.name + ' - ' + (ep.name || 'Tập ' + (i + 1)),
                    url: ep.link_m3u8 || ep.link_embed,
                    index: i
                };
            });

            // Lưu lịch sử xem
            Lampa.Favorite.add('history', {
                id: movie.slug,
                title: movie.name,
                original_title: movie.origin_name,
                poster_path: getImageUrl(movie.poster_url),
                year: movie.year
            });

            Lampa.Player.play({
                url: streamUrl,
                title: movie.name + ' - ' + (episode.name || ''),
                poster: getImageUrl(movie.poster_url)
            });

            Lampa.Player.playlist(playlist);
        };

        this.empty = function() {
            body.append('<div class="kk-empty">Không tìm thấy thông tin phim</div>');
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

    // ==================== COMPONENT MAIN ====================
    function KKMain(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        var html = $('<div></div>');
        var body = $('<div class="kkphim-main"></div>');

        var categories = [
            {title: '🎬 Phim Mới Cập Nhật', url: 'new'},
            {title: '🎥 Phim Lẻ', url: 'phim-le'},
            {title: '📺 Phim Bộ', url: 'phim-bo'},
            {title: '🎨 Hoạt Hình', url: 'hoat-hinh'},
            {title: '📡 TV Shows', url: 'tv-shows'}
        ];

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            // Header với search
            var header = $('<div class="kk-header">\
                <div class="kk-header__title">KKPhim</div>\
                <div class="kk-header__search selector">🔍 Tìm kiếm</div>\
            </div>');

            header.find('.kk-header__search').on('hover:enter', function() {
                Lampa.Input.edit({
                    title: 'Tìm kiếm phim',
                    value: '',
                    free: true
                }, function(text) {
                    if (text) {
                        Lampa.Activity.push({
                            url: text,
                            title: 'Tìm: ' + text,
                            component: 'kkphim_search',
                            search: text
                        });
                    }
                });
            });

            body.append(header);

            // Load categories
            var loaded = 0;
            categories.forEach(function(cat) {
                _this.loadCat(cat, function() {
                    loaded++;
                    if (loaded >= categories.length) {
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
                var list = (data.items || []).slice(0, 12);

                if (list.length) {
                    _this.buildLine(cat, list.map(convertToLampaFormat));
                }
                callback();
            }, callback);
        };

        this.buildLine = function(cat, movies) {
            var line = $('<div class="kk-line">\
                <div class="kk-line__head">\
                    <div class="kk-line__title">' + cat.title + '</div>\
                    <div class="kk-line__more selector">Xem tất cả ➜</div>\
                </div>\
                <div class="kk-line__body"></div>\
            </div>');

            line.find('.kk-line__more').on('hover:enter', function() {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title.replace(/[🎬🎥📺🎨📡]\s?/g, ''),
                    component: 'kkphim_category'
                });
            });

            var row = line.find('.kk-line__body');
            movies.forEach(function(movie) {
                var card = $('<div class="kk-card selector">\
                    <div class="kk-card__img">\
                        <img src="' + (movie.poster_path || './img/img_broken.svg') + '" />\
                        <div class="kk-card__quality">' + (movie.quality || 'HD') + '</div>\
                        <div class="kk-card__ep">' + (movie.episode_current || '') + '</div>\
                    </div>\
                    <div class="kk-card__title">' + movie.title + '</div>\
                    <div class="kk-card__year">' + (movie.year || '') + '</div>\
                </div>');

                card.find('img').on('error', function() {
                    this.src = './img/img_broken.svg';
                });

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

    // ==================== COMPONENT SEARCH ====================
    function KKSearch(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var keyword = object.search || '';

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            var url = CONFIG.api_url + '/tim-kiem?keyword=' + encodeURIComponent(keyword);

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

                if (movies.length) {
                    _this.build(movies);
                } else {
                    _this.empty();
                }

                _this.activity.toggle();
            }, function() {
                _this.activity.loader(false);
                _this.empty();
                _this.activity.toggle();
            });
        };

        this.build = function(data) {
            data.forEach(function(movie) {
                var card = Lampa.Template.get('card', {
                    title: movie.title,
                    release_year: movie.year
                });

                var img = card.find('.card__img')[0] || card.find('img')[0];
                if (img) {
                    img.src = movie.poster_path || './img/img_broken.svg';
                }

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

        this.empty = function() {
            body.append('<div class="category-full__empty"><div class="category-full__empty-text">Không tìm thấy phim "' + keyword + '"</div></div>');
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

    // ==================== CSS ====================
    function addCSS() {
        if (document.getElementById('kkphim-css')) return;
        var style = document.createElement('style');
        style.id = 'kkphim-css';
        style.textContent = '\
            .kk-badge { position: absolute; padding: 3px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; z-index: 2; }\
            .kk-quality { top: 5px; left: 5px; background: #e50914; }\
            .kk-episode { bottom: 5px; right: 5px; background: rgba(0,0,0,0.85); }\
            .kk-lang { top: 5px; right: 5px; background: #1a73e8; }\
            \
            .kk-header { display: flex; justify-content: space-between; align-items: center; padding: 1em 1.5em; border-bottom: 1px solid rgba(255,255,255,0.1); }\
            .kk-header__title { font-size: 1.8em; font-weight: bold; color: #e50914; }\
            .kk-header__search { padding: 0.6em 1.2em; background: rgba(255,255,255,0.1); border-radius: 2em; }\
            .kk-header__search.focus { background: #e50914; }\
            \
            .kk-line { margin: 1.2em 0; }\
            .kk-line__head { display: flex; justify-content: space-between; align-items: center; padding: 0.5em 1.5em; }\
            .kk-line__title { font-size: 1.25em; color: #fff; }\
            .kk-line__more { padding: 0.5em 1em; color: rgba(255,255,255,0.6); font-size: 0.9em; border-radius: 0.3em; }\
            .kk-line__more.focus { background: rgba(255,255,255,0.15); color: #fff; }\
            .kk-line__body { display: flex; overflow-x: auto; gap: 1em; padding: 0.8em 1.5em; }\
            \
            .kk-card { width: 10em; flex-shrink: 0; }\
            .kk-card.focus .kk-card__img { transform: scale(1.08); box-shadow: 0 8px 25px rgba(0,0,0,0.5); border-color: #fff; }\
            .kk-card__img { position: relative; border-radius: 0.5em; overflow: hidden; aspect-ratio: 2/3; transition: all 0.2s ease; border: 2px solid transparent; }\
            .kk-card__img img { width: 100%; height: 100%; object-fit: cover; }\
            .kk-card__quality { position: absolute; top: 0.4em; left: 0.4em; background: #e50914; padding: 0.15em 0.4em; border-radius: 0.2em; font-size: 0.7em; font-weight: bold; }\
            .kk-card__ep { position: absolute; bottom: 0.4em; right: 0.4em; background: rgba(0,0,0,0.85); padding: 0.15em 0.4em; border-radius: 0.2em; font-size: 0.65em; }\
            .kk-card__title { margin-top: 0.5em; font-size: 0.9em; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
            .kk-card__year { font-size: 0.8em; color: rgba(255,255,255,0.5); }\
            \
            .kk-detail { display: flex; gap: 2em; padding: 1.5em; }\
            .kk-detail__poster { width: 200px; flex-shrink: 0; }\
            .kk-detail__poster img { width: 100%; border-radius: 0.5em; }\
            .kk-detail__info { flex: 1; }\
            .kk-detail__title { font-size: 1.8em; color: #fff; margin-bottom: 0.2em; }\
            .kk-detail__original { font-size: 1.1em; color: rgba(255,255,255,0.5); margin-bottom: 1em; }\
            .kk-detail__meta { display: flex; flex-wrap: wrap; gap: 0.5em; margin-bottom: 1em; }\
            .kk-tag { padding: 0.3em 0.7em; background: rgba(255,255,255,0.15); border-radius: 0.3em; font-size: 0.9em; }\
            .kk-tag--primary { background: #e50914; }\
            .kk-tag--success { background: #2ecc71; }\
            .kk-detail__extra { margin-bottom: 1em; line-height: 1.8; font-size: 0.95em; color: rgba(255,255,255,0.8); }\
            .kk-detail__desc { color: rgba(255,255,255,0.7); line-height: 1.6; max-height: 120px; overflow-y: auto; }\
            \
            .kk-episodes { padding: 1em 1.5em; }\
            .kk-episodes__title { font-size: 1.2em; color: #fff; margin-bottom: 1em; padding-bottom: 0.5em; border-bottom: 1px solid rgba(255,255,255,0.1); }\
            .kk-episodes__list { display: flex; flex-wrap: wrap; gap: 0.5em; }\
            .kk-ep { padding: 0.6em 1.1em; background: rgba(255,255,255,0.1); border-radius: 0.4em; font-size: 0.95em; transition: all 0.15s; }\
            .kk-ep.focus { background: #e50914; transform: scale(1.1); }\
            \
            .kk-empty, .kk-no-episodes { text-align: center; padding: 3em; color: rgba(255,255,255,0.4); font-size: 1.1em; }\
            .kkphim-main { min-height: 100%; }\
            .kkphim-full { min-height: 100%; }\
        ';
        document.head.appendChild(style);
    }

    // ==================== MENU ====================
    function addMenu() {
        var icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>';

        function tryAdd() {
            var menu = $('.menu__list').first();
            if (!menu.length) {
                setTimeout(tryAdd, 500);
                return;
            }

            if ($('[data-action="kkphim"]').length) return;

            var item = $('<li class="menu__item selector" data-action="kkphim">\
                <div class="menu__ico">' + icon + '</div>\
                <div class="menu__text">KKPhim</div>\
            </li>');

            item.on('hover:enter', function() {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_main'
                });
            });

            menu.append(item);
            log('Menu added');
        }

        tryAdd();
    }

    // ==================== INIT ====================
    function init() {
        if (!window.Lampa || !Lampa.Component) {
            setTimeout(init, 300);
            return;
        }

        addCSS();

        Lampa.Component.add('kkphim_main', KKMain);
        Lampa.Component.add('kkphim_category', KKCategory);
        Lampa.Component.add('kkphim_full', KKFull);
        Lampa.Component.add('kkphim_search', KKSearch);

        if (window.appready) {
            addMenu();
        } else {
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') {
                    setTimeout(addMenu, 500);
                }
            });
            setTimeout(addMenu, 3000);
        }

        log('Plugin initialized');
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }

})();