(function () {
    'use strict';

    var kkphim_network = new Lampa.Reguest();
    var kkphim_cache = {};
    var kkphim_total_pages = 0;

    // Cấu hình API
    var CONFIG = {
        base_url: 'https://phimapi.com',
        api_url: 'https://phimapi.com/v1/api',
        img_url: 'https://phimimg.com',
        source_name: 'kkphim',
        source_title: 'KKPhim'
    };

    // Hàm tạo URL ảnh
    function getImageUrl(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return CONFIG.img_url + '/' + path;
    }

    // Chuyển đổi dữ liệu phim sang định dạng Lampa
    function convertToLampaFormat(item) {
        return {
            id: item._id || item.slug,
            title: item.name || '',
            name: item.name || '',
            original_title: item.origin_name || '',
            original_name: item.origin_name || '',
            overview: item.content || item.description || '',
            poster_path: getImageUrl(item.poster_url || item.thumb_url),
            backdrop_path: getImageUrl(item.thumb_url || item.poster_url),
            vote_average: item.tmdb?.vote_average || 7.5,
            release_date: item.year ? item.year + '-01-01' : '',
            first_air_date: item.year ? item.year + '-01-01' : '',
            year: item.year || '',
            slug: item.slug || '',
            type: item.type === 'series' ? 'tv' : 'movie',
            quality: item.quality || 'HD',
            lang: item.lang || 'Vietsub',
            episode_current: item.episode_current || '',
            episode_total: item.episode_total || '',
            source: CONFIG.source_name,
            kkphim_data: item
        };
    }

    // Tạo URL API
    function getApiUrl(type, page) {
        page = page || 1;
        var url = '';

        switch(type) {
            case 'new':
            case 'kkphim_new':
                url = CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
                break;
            case 'phim-le':
            case 'kkphim_phimle':
                url = CONFIG.api_url + '/danh-sach/phim-le?page=' + page;
                break;
            case 'phim-bo':
            case 'kkphim_phimbo':
                url = CONFIG.api_url + '/danh-sach/phim-bo?page=' + page;
                break;
            case 'hoat-hinh':
            case 'kkphim_hoathinh':
                url = CONFIG.api_url + '/danh-sach/hoat-hinh?page=' + page;
                break;
            case 'tv-shows':
            case 'kkphim_tvshows':
                url = CONFIG.api_url + '/danh-sach/tv-shows?page=' + page;
                break;
            case 'phim-vietsub':
                url = CONFIG.api_url + '/danh-sach/phim-vietsub?page=' + page;
                break;
            case 'phim-thuyet-minh':
                url = CONFIG.api_url + '/danh-sach/phim-thuyet-minh?page=' + page;
                break;
            default:
                url = CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        }

        return url;
    }

    // Lấy chi tiết phim
    function getMovieDetail(slug, callback) {
        var url = CONFIG.base_url + '/phim/' + slug;

        kkphim_network.clear();
        kkphim_network.timeout(15000);
        kkphim_network.silent(url, function(response) {
            if (response.status === 'success' || response.status === true || response.movie) {
                var movie = response.movie || response.data?.movie;
                var episodes = response.episodes || response.data?.episodes || [];
                callback({ movie: movie, episodes: episodes });
            } else {
                callback(null);
            }
        }, function() {
            callback(null);
        });
    }

    // Component danh sách phim
    function kkphimComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var load = $('<div class="category-full__load more selector"><div class="category-full__load-text">Tải thêm</div></div>');
        var page = 1;
        var total_pages = 100;
        var loading = false;
        var category_type = object.url || 'new';

        this.create = function() {
            this.activity.loader(true);
            this.loadData();
        };

        this.loadData = function() {
            var _this = this;
            if (loading) return;
            loading = true;

            var url = getApiUrl(category_type, page);

            network.clear();
            network.timeout(15000);
            network.silent(url, function(response) {
                _this.activity.loader(false);
                loading = false;

                var movies = [];
                
                if (response.status === 'success' || response.status === true || response.items) {
                    var data = response.data || response;
                    var list = data.items || data.movies || [];
                    
                    total_pages = data.params?.pagination?.totalPages || 
                                  data.pagination?.totalPages || 100;
                    
                    list.forEach(function(item) {
                        movies.push(convertToLampaFormat(item));
                    });
                }

                if (movies.length) {
                    _this.build(movies);
                } else if (page === 1) {
                    _this.empty();
                }

                _this.activity.toggle();
            }, function(error) {
                _this.activity.loader(false);
                loading = false;
                
                if (page === 1) {
                    _this.empty('Lỗi kết nối đến KKPhim');
                }
            });
        };

        this.build = function(data) {
            var _this = this;

            data.forEach(function(element) {
                var card = Lampa.Template.get('card', {
                    title: element.title,
                    release_year: element.year || ''
                });

                var img = card.find('.card__img')[0] || card.find('img')[0];
                if (img) {
                    img.src = element.poster_path || './img/img_broken.svg';
                    img.onerror = function() {
                        this.src = './img/img_broken.svg';
                    };
                }

                // Thêm badge chất lượng và tập
                var view = card.find('.card__view');
                if (view.length) {
                    if (element.quality) {
                        view.append('<div class="card__quality">' + element.quality + '</div>');
                    }
                    if (element.episode_current) {
                        view.append('<div class="card__episode">' + element.episode_current + '</div>');
                    }
                }

                card.on('hover:enter', function() {
                    _this.openMovie(element);
                });

                card.on('hover:focus', function(e) {
                    scroll.update($(e.target), true);
                });

                body.append(card);
                items.push(card);
            });

            // Nút tải thêm
            if (page < total_pages) {
                body.append(load);
                
                load.off('hover:enter').on('hover:enter', function() {
                    page++;
                    load.detach();
                    _this.loadData();
                });
            }
        };

        this.openMovie = function(element) {
            // Hiển thị loading
            Lampa.Activity.push({
                url: '',
                title: element.title,
                component: 'kkphim_full',
                card: element,
                page: 1
            });
        };

        this.empty = function(msg) {
            var empty = $('<div class="category-full__empty">' + (msg || 'Không có dữ liệu') + '</div>');
            body.append(empty);
        };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;

            scroll.append(body);
            html.append(scroll.render());
            this.activity.mountCancel();
            scroll.resetStory();
            this.create();
        };

        this.pause = function() {};
        this.stop = function() {};
        
        this.render = function() {
            return html;
        };

        this.destroy = function() {
            network.clear();
            scroll.destroy();
            items.forEach(function(item) {
                item.remove();
            });
            items = [];
            html.remove();
            body.remove();
        };
    }

    // Component chi tiết phim
    function kkphimFullComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var html = $('<div></div>');
        var body = $('<div class="kkphim-full-body"></div>');
        var card = object.card;

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            getMovieDetail(card.slug, function(data) {
                _this.activity.loader(false);

                if (data) {
                    _this.build(data);
                } else {
                    _this.empty();
                }

                _this.activity.toggle();
            });
        };

        this.build = function(data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];

            // Header
            var header = $('<div class="kkphim-detail">\
                <div class="kkphim-detail__left">\
                    <img class="kkphim-detail__poster" src="' + getImageUrl(movie.poster_url || movie.thumb_url) + '" />\
                </div>\
                <div class="kkphim-detail__right">\
                    <div class="kkphim-detail__title">' + (movie.name || card.title) + '</div>\
                    <div class="kkphim-detail__original">' + (movie.origin_name || '') + '</div>\
                    <div class="kkphim-detail__info">\
                        <span>' + (movie.year || '') + '</span>\
                        <span>' + (movie.quality || 'HD') + '</span>\
                        <span>' + (movie.lang || 'Vietsub') + '</span>\
                        <span>' + (movie.time || '') + '</span>\
                    </div>\
                    <div class="kkphim-detail__desc">' + (movie.content || 'Không có mô tả') + '</div>\
                </div>\
            </div>');

            body.append(header);

            // Danh sách tập
            if (episodes.length) {
                episodes.forEach(function(server, serverIndex) {
                    var serverName = server.server_name || 'Server ' + (serverIndex + 1);
                    var serverData = server.server_data || [];

                    if (serverData.length) {
                        var section = $('<div class="kkphim-episodes">\
                            <div class="kkphim-episodes__title">' + serverName + '</div>\
                            <div class="kkphim-episodes__list"></div>\
                        </div>');
                        
                        var list = section.find('.kkphim-episodes__list');

                        serverData.forEach(function(ep, epIndex) {
                            var epItem = $('<div class="kkphim-episode selector">' + (ep.name || 'Tập ' + (epIndex + 1)) + '</div>');
                            
                            epItem.on('hover:enter', function() {
                                _this.playEpisode(ep, movie, serverData, epIndex);
                            });

                            list.append(epItem);
                        });

                        body.append(section);
                    }
                });
            }
        };

        this.playEpisode = function(episode, movie, allEpisodes, index) {
            var stream_url = episode.link_m3u8 || episode.link_embed;

            if (!stream_url) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            // Tạo playlist
            var playlist = allEpisodes.map(function(ep, i) {
                return {
                    title: (movie.name || card.title) + ' - ' + (ep.name || 'Tập ' + (i + 1)),
                    url: ep.link_m3u8 || ep.link_embed,
                    index: i
                };
            });

            Lampa.Player.play({
                url: stream_url,
                title: (movie.name || card.title) + ' - ' + (episode.name || ''),
                playlist: playlist,
                position: index
            });

            Lampa.Player.playlist(playlist);
        };

        this.empty = function() {
            body.append('<div class="kkphim-empty">Không tìm thấy thông tin phim</div>');
        };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;

            scroll.append(body);
            html.append(scroll.render());
            this.activity.mountCancel();
            scroll.resetStory();
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

    // Component trang chủ KKPhim
    function kkphimMainComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var html = $('<div></div>');
        var body = $('<div class="kkphim-main"></div>');

        var categories = [
            { title: 'Phim Mới Cập Nhật', url: 'new', key: 'kkphim_new' },
            { title: 'Phim Lẻ', url: 'phim-le', key: 'kkphim_phimle' },
            { title: 'Phim Bộ', url: 'phim-bo', key: 'kkphim_phimbo' },
            { title: 'Hoạt Hình', url: 'hoat-hinh', key: 'kkphim_hoathinh' }
        ];

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            var loaded = 0;

            categories.forEach(function(cat) {
                _this.loadCategory(cat, function() {
                    loaded++;
                    if (loaded >= categories.length) {
                        _this.activity.loader(false);
                        _this.activity.toggle();
                    }
                });
            });
        };

        this.loadCategory = function(category, callback) {
            var _this = this;
            var url = getApiUrl(category.url, 1);

            network.silent(url, function(response) {
                var movies = [];

                if (response.status === 'success' || response.status === true || response.items) {
                    var data = response.data || response;
                    var list = data.items || data.movies || [];

                    list.slice(0, 10).forEach(function(item) {
                        movies.push(convertToLampaFormat(item));
                    });
                }

                if (movies.length) {
                    _this.buildLine(category, movies);
                }

                callback();
            }, function() {
                callback();
            });
        };

        this.buildLine = function(category, movies) {
            var _this = this;

            var line = $('<div class="kkphim-line">\
                <div class="kkphim-line__head">\
                    <div class="kkphim-line__title">' + category.title + '</div>\
                    <div class="kkphim-line__more selector">Xem tất cả</div>\
                </div>\
                <div class="kkphim-line__body"></div>\
            </div>');

            var lineBody = line.find('.kkphim-line__body');

            line.find('.kkphim-line__more').on('hover:enter', function() {
                Lampa.Activity.push({
                    url: category.url,
                    title: category.title,
                    component: 'kkphim_category',
                    page: 1
                });
            });

            movies.forEach(function(movie) {
                var card = $('<div class="kkphim-card selector">\
                    <div class="kkphim-card__img-box">\
                        <img class="kkphim-card__img" src="' + (movie.poster_path || './img/img_broken.svg') + '" />\
                        <div class="kkphim-card__badge">' + (movie.quality || 'HD') + '</div>\
                    </div>\
                    <div class="kkphim-card__name">' + movie.title + '</div>\
                </div>');

                card.find('img').on('error', function() {
                    this.src = './img/img_broken.svg';
                });

                card.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie,
                        page: 1
                    });
                });

                lineBody.append(card);
            });

            body.append(line);
        };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;

            scroll.append(body);
            html.append(scroll.render());
            this.activity.mountCancel();
            scroll.resetStory();
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

    // Thêm CSS
    function addStyles() {
        var css = '\
            .card__quality { position: absolute; top: 5px; left: 5px; background: #e50914; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; z-index: 2; }\
            .card__episode { position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 3px; font-size: 0.75em; z-index: 2; }\
            \
            .kkphim-main { padding: 1.5em; }\
            .kkphim-line { margin-bottom: 1.5em; }\
            .kkphim-line__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em; padding: 0 0.5em; }\
            .kkphim-line__title { font-size: 1.4em; color: #fff; }\
            .kkphim-line__more { padding: 0.5em 1em; color: rgba(255,255,255,0.6); font-size: 0.9em; }\
            .kkphim-line__more.focus { background: rgba(255,255,255,0.1); border-radius: 0.3em; color: #fff; }\
            .kkphim-line__body { display: flex; overflow-x: auto; padding: 0.5em; gap: 1em; }\
            \
            .kkphim-card { width: 10em; flex-shrink: 0; cursor: pointer; }\
            .kkphim-card.focus .kkphim-card__img-box { transform: scale(1.05); border: 3px solid #fff; }\
            .kkphim-card__img-box { position: relative; border-radius: 0.5em; overflow: hidden; aspect-ratio: 2/3; transition: all 0.2s ease; border: 3px solid transparent; }\
            .kkphim-card__img { width: 100%; height: 100%; object-fit: cover; }\
            .kkphim-card__badge { position: absolute; top: 0.4em; left: 0.4em; background: #e50914; padding: 0.2em 0.5em; border-radius: 0.2em; font-size: 0.7em; font-weight: bold; }\
            .kkphim-card__name { margin-top: 0.5em; font-size: 0.9em; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }\
            \
            .kkphim-detail { display: flex; gap: 2em; padding: 1.5em; flex-wrap: wrap; }\
            .kkphim-detail__left { width: 200px; flex-shrink: 0; }\
            .kkphim-detail__poster { width: 100%; border-radius: 0.5em; }\
            .kkphim-detail__right { flex: 1; min-width: 250px; }\
            .kkphim-detail__title { font-size: 1.8em; color: #fff; margin-bottom: 0.3em; }\
            .kkphim-detail__original { font-size: 1.1em; color: rgba(255,255,255,0.6); margin-bottom: 1em; }\
            .kkphim-detail__info { display: flex; gap: 0.8em; flex-wrap: wrap; margin-bottom: 1em; }\
            .kkphim-detail__info span { background: rgba(255,255,255,0.15); padding: 0.4em 0.8em; border-radius: 0.3em; font-size: 0.9em; }\
            .kkphim-detail__info span:first-child { background: #e50914; }\
            .kkphim-detail__desc { color: rgba(255,255,255,0.8); line-height: 1.5; font-size: 0.95em; max-height: 150px; overflow-y: auto; }\
            \
            .kkphim-episodes { padding: 1em 1.5em; }\
            .kkphim-episodes__title { font-size: 1.3em; color: #fff; margin-bottom: 1em; }\
            .kkphim-episodes__list { display: flex; flex-wrap: wrap; gap: 0.5em; }\
            .kkphim-episode { padding: 0.7em 1.2em; background: rgba(255,255,255,0.1); border-radius: 0.4em; color: #fff; font-size: 0.95em; cursor: pointer; transition: all 0.2s; }\
            .kkphim-episode.focus { background: #e50914; transform: scale(1.05); }\
            \
            .kkphim-empty { text-align: center; padding: 3em; color: rgba(255,255,255,0.5); font-size: 1.2em; }\
            .kkphim-full-body { min-height: 100%; }\
            .category-full__empty { text-align: center; padding: 3em; color: rgba(255,255,255,0.5); }\
        ';

        var style = document.createElement('style');
        style.id = 'kkphim-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Thêm menu vào sidebar
    function addMenuButton() {
        var iconSvg = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 12V17C20 18.8856 20 19.8284 19.4142 20.4142C18.8284 21 17.8856 21 16 21H8C6.11438 21 5.17157 21 4.58579 20.4142C4 19.8284 4 18.8856 4 17V12" stroke="currentColor" stroke-width="2"/><path d="M12 12L12 3M12 3L8 7M12 3L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        
        // Tạo button menu
        var menuItem = $('<li class="menu__item selector" data-action="kkphim">\
            <div class="menu__ico">' + iconSvg + '</div>\
            <div class="menu__text">KKPhim</div>\
        </li>');

        // Xử lý click
        menuItem.on('hover:enter', function() {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main',
                page: 1
            });
        });

        // Chờ menu load xong rồi thêm vào
        function tryAddMenu() {
            var menu = $('.menu__list').first();
            if (menu.length) {
                // Thêm sau mục Bookmark hoặc vào cuối menu
                var bookmark = menu.find('[data-action="book"]');
                var history = menu.find('[data-action="history"]');
                var filter = menu.find('[data-action="filter"]');
                
                if (bookmark.length) {
                    bookmark.after(menuItem);
                } else if (history.length) {
                    history.after(menuItem);
                } else if (filter.length) {
                    filter.after(menuItem);
                } else {
                    menu.append(menuItem);
                }
                
                console.log('KKPhim: Menu đã được thêm');
            } else {
                setTimeout(tryAddMenu, 500);
            }
        }

        tryAddMenu();
    }

    // Đăng ký components
    function registerComponents() {
        Lampa.Component.add('kkphim_main', kkphimMainComponent);
        Lampa.Component.add('kkphim_category', kkphimComponent);
        Lampa.Component.add('kkphim_full', kkphimFullComponent);
    }

    // Khởi tạo plugin
    function initPlugin() {
        if (!window.Lampa) {
            setTimeout(initPlugin, 200);
            return;
        }

        // Chờ Lampa ready
        if (Lampa.Platform && !Lampa.Platform.ready) {
            setTimeout(initPlugin, 200);
            return;
        }

        console.log('KKPhim: Đang khởi tạo plugin...');

        // Thêm CSS
        if (!document.getElementById('kkphim-styles')) {
            addStyles();
        }

        // Đăng ký components
        registerComponents();

        // Thêm menu - đợi một chút để Lampa render xong
        setTimeout(addMenuButton, 1000);

        console.log('KKPhim: Plugin đã khởi tạo thành công!');
    }

    // Chạy plugin
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlugin);
    } else {
        setTimeout(initPlugin, 100);
    }

})();