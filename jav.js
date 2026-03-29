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
            original_title: item.origin_name || '',
            overview: item.content || item.description || '',
            poster_path: getImageUrl(item.poster_url || item.thumb_url),
            backdrop_path: getImageUrl(item.thumb_url || item.poster_url),
            vote_average: item.tmdb?.vote_average || item.imdb?.id ? 7.5 : 0,
            release_date: item.year ? item.year + '-01-01' : '',
            year: item.year || '',
            slug: item.slug || '',
            type: item.type || 'single',
            quality: item.quality || 'HD',
            lang: item.lang || 'Vietsub',
            episode_current: item.episode_current || '',
            episode_total: item.episode_total || '',
            source: CONFIG.source_name,
            // Giữ nguyên data gốc
            kkphim_data: item
        };
    }

    // Component hiển thị danh sách phim
    function kkphimComponent(object) {
        var comp = new Lampa.InteractionCategory(object);
        var last_filter = {};
        var page = 1;

        // Override hàm build
        comp.create = function() {
            var _this = this;
            this.activity.loader(true);

            var url = getApiUrl(object.url, page);

            kkphim_network.clear();
            kkphim_network.timeout(15000);
            kkphim_network.silent(url, function(response) {
                var items = [];
                
                if (response.status === 'success' || response.status === true) {
                    var data = response.data || response;
                    var movies = data.items || data.movies || [];
                    
                    kkphim_total_pages = data.params?.pagination?.totalPages || 
                                         data.pagination?.totalPages || 
                                         Math.ceil((data.params?.pagination?.totalItems || movies.length) / 24);
                    
                    movies.forEach(function(item) {
                        items.push(convertToLampaFormat(item));
                    });
                }

                if (items.length) {
                    _this.build(items);
                } else {
                    _this.empty();
                }

                _this.activity.loader(false);
                _this.activity.toggle();
            }, function(error) {
                _this.activity.loader(false);
                _this.empty();
                Lampa.Noty.show('KKPhim: Lỗi kết nối');
            });
        };

        comp.nextPage = function() {
            if (page < kkphim_total_pages) {
                page++;
                this.create();
            }
        };

        comp.prevPage = function() {
            if (page > 1) {
                page--;
                this.create();
            }
        };

        return comp;
    }

    // Tạo URL API
    function getApiUrl(type, page) {
        page = page || 1;
        var url = '';

        switch(type) {
            case 'new':
                url = CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
                break;
            case 'phim-le':
                url = CONFIG.api_url + '/danh-sach/phim-le?page=' + page;
                break;
            case 'phim-bo':
                url = CONFIG.api_url + '/danh-sach/phim-bo?page=' + page;
                break;
            case 'hoat-hinh':
                url = CONFIG.api_url + '/danh-sach/hoat-hinh?page=' + page;
                break;
            case 'tv-shows':
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

    // Tìm kiếm phim
    function kkphimSearch(object, callback) {
        var url = CONFIG.api_url + '/tim-kiem?keyword=' + encodeURIComponent(object.search);

        kkphim_network.clear();
        kkphim_network.timeout(15000);
        kkphim_network.silent(url, function(response) {
            var items = [];

            if (response.status === 'success' || response.status === true) {
                var data = response.data || response;
                var movies = data.items || data.movies || [];

                movies.forEach(function(item) {
                    items.push(convertToLampaFormat(item));
                });
            }

            callback(items);
        }, function() {
            callback([]);
        });
    }

    // Lấy chi tiết phim
    function kkphimDetail(object, callback) {
        var slug = object.card.slug || object.card.id;
        var url = CONFIG.base_url + '/phim/' + slug;

        kkphim_network.clear();
        kkphim_network.timeout(15000);
        kkphim_network.silent(url, function(response) {
            if (response.status === 'success' || response.status === true) {
                var movie = response.movie || response.data?.movie;
                var episodes = response.episodes || response.data?.episodes || [];

                var detail = convertToLampaFormat(movie);
                detail.episodes = episodes;

                callback(detail);
            } else {
                callback(null);
            }
        }, function() {
            callback(null);
        });
    }

    // Lấy danh sách tập phim
    function kkphimEpisodes(detail) {
        var episodes = [];
        var data = detail.episodes || [];

        data.forEach(function(server, serverIndex) {
            var serverName = server.server_name || 'Server ' + (serverIndex + 1);
            var serverData = server.server_data || server.items || [];

            serverData.forEach(function(ep) {
                episodes.push({
                    name: ep.name || ep.episode || 'Tập ' + (episodes.length + 1),
                    episode: ep.name || ep.episode,
                    season: 1,
                    server: serverName,
                    url: ep.link_embed || ep.link_m3u8 || '',
                    link_m3u8: ep.link_m3u8 || '',
                    link_embed: ep.link_embed || ''
                });
            });
        });

        return episodes;
    }

    // Phát video
    function kkphimPlay(episode, callback) {
        var stream_url = episode.link_m3u8 || episode.url;

        if (stream_url) {
            callback({
                url: stream_url,
                quality: {},
                title: episode.name
            });
        } else if (episode.link_embed) {
            // Nếu chỉ có embed, thử extract m3u8
            extractM3u8FromEmbed(episode.link_embed, callback);
        } else {
            callback(null);
        }
    }

    // Extract m3u8 từ embed
    function extractM3u8FromEmbed(embed_url, callback) {
        kkphim_network.clear();
        kkphim_network.timeout(10000);
        kkphim_network.silent(embed_url, function(html) {
            var m3u8_match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
            if (m3u8_match) {
                callback({
                    url: m3u8_match[0],
                    quality: {}
                });
            } else {
                callback(null);
            }
        }, function() {
            callback(null);
        }, false, {
            dataType: 'text'
        });
    }

    // Đăng ký source cho Lampa
    function registerSource() {
        Lampa.Source.add(CONFIG.source_name, {
            title: CONFIG.source_title,
            search: kkphimSearch,
            params: {
                component: 'kkphim_category'
            },
            menu: [
                {
                    title: 'Phim Mới',
                    url: 'new'
                },
                {
                    title: 'Phim Lẻ',
                    url: 'phim-le'
                },
                {
                    title: 'Phim Bộ',
                    url: 'phim-bo'
                },
                {
                    title: 'Hoạt Hình',
                    url: 'hoat-hinh'
                },
                {
                    title: 'TV Shows',
                    url: 'tv-shows'
                },
                {
                    title: 'Phim Vietsub',
                    url: 'phim-vietsub'
                },
                {
                    title: 'Phim Thuyết Minh',
                    url: 'phim-thuyet-minh'
                }
            ]
        });
    }

    // Đăng ký component
    function registerComponent() {
        Lampa.Component.add('kkphim_category', kkphimComponent);
    }

    // Thêm KKPhim vào menu chính
    function addToMainMenu() {
        var menu_item = $('<li class="menu__item selector" data-action="kkphim">\
            <div class="menu__ico">\
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">\
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>\
                </svg>\
            </div>\
            <div class="menu__text">KKPhim</div>\
        </li>');

        menu_item.on('hover:enter', function() {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main',
                page: 1
            });
        });

        // Thêm vào menu
        $('.menu .menu__list').eq(0).append(menu_item);
    }

    // Component trang chính KKPhim
    function kkphimMainComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var items = [];
        var html = $('<div class="kkphim-main"></div>');
        var body = $('<div class="category-full"></div>');

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            var categories = [
                { title: 'Phim Mới Cập Nhật', url: 'new' },
                { title: 'Phim Lẻ', url: 'phim-le' },
                { title: 'Phim Bộ', url: 'phim-bo' },
                { title: 'Hoạt Hình', url: 'hoat-hinh' }
            ];

            var loaded = 0;
            var total = categories.length;

            categories.forEach(function(cat) {
                loadCategory(cat, function() {
                    loaded++;
                    if (loaded >= total) {
                        _this.activity.loader(false);
                        _this.activity.toggle();
                    }
                });
            });
        };

        function loadCategory(category, callback) {
            var url = getApiUrl(category.url, 1);

            network.silent(url, function(response) {
                var movies = [];

                if (response.status === 'success' || response.status === true) {
                    var data = response.data || response;
                    var list = data.items || data.movies || [];

                    list.slice(0, 12).forEach(function(item) {
                        movies.push(convertToLampaFormat(item));
                    });
                }

                if (movies.length) {
                    var line = createLine(category.title, movies, category.url);
                    body.append(line);
                }

                callback();
            }, function() {
                callback();
            });
        }

        function createLine(title, movies, url) {
            var line = $('<div class="kkphim-line"></div>');
            var head = $('<div class="kkphim-line__head">\
                <div class="kkphim-line__title">' + title + '</div>\
                <div class="kkphim-line__more selector">Xem thêm</div>\
            </div>');
            var content = $('<div class="kkphim-line__content"></div>');

            head.find('.kkphim-line__more').on('hover:enter', function() {
                Lampa.Activity.push({
                    url: url,
                    title: title,
                    component: 'kkphim_category',
                    page: 1
                });
            });

            movies.forEach(function(movie) {
                var card = createCard(movie);
                content.append(card);
            });

            line.append(head);
            line.append(content);

            return line;
        }

        function createCard(movie) {
            var card = $('<div class="kkphim-card selector">\
                <div class="kkphim-card__img">\
                    <img src="' + (movie.poster_path || './img/img_broken.svg') + '" />\
                    <div class="kkphim-card__quality">' + (movie.quality || 'HD') + '</div>\
                    <div class="kkphim-card__episode">' + (movie.episode_current || '') + '</div>\
                </div>\
                <div class="kkphim-card__title">' + movie.title + '</div>\
                <div class="kkphim-card__year">' + (movie.year || '') + '</div>\
            </div>');

            card.on('hover:enter', function() {
                openMovie(movie);
            });

            return card;
        }

        function openMovie(movie) {
            Lampa.Activity.push({
                url: '',
                title: movie.title,
                component: 'kkphim_full',
                card: movie,
                page: 1
            });
        }

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

    // Component chi tiết phim
    function kkphimFullComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div class="kkphim-full"></div>');
        var body = $('<div class="kkphim-full__body"></div>');
        var movie = object.card;

        this.create = function() {
            var _this = this;
            this.activity.loader(true);

            kkphimDetail(object, function(detail) {
                _this.activity.loader(false);

                if (detail) {
                    _this.build(detail);
                } else {
                    _this.empty();
                }

                _this.activity.toggle();
            });
        };

        this.build = function(detail) {
            // Header với poster và info
            var header = $('<div class="kkphim-full__header">\
                <div class="kkphim-full__poster">\
                    <img src="' + (detail.poster_path || './img/img_broken.svg') + '" />\
                </div>\
                <div class="kkphim-full__info">\
                    <div class="kkphim-full__title">' + detail.title + '</div>\
                    <div class="kkphim-full__original">' + (detail.original_title || '') + '</div>\
                    <div class="kkphim-full__meta">\
                        <span class="kkphim-full__year">' + (detail.year || '') + '</span>\
                        <span class="kkphim-full__quality">' + (detail.quality || 'HD') + '</span>\
                        <span class="kkphim-full__lang">' + (detail.lang || 'Vietsub') + '</span>\
                    </div>\
                    <div class="kkphim-full__overview">' + (detail.overview || 'Không có mô tả') + '</div>\
                </div>\
            </div>');

            body.append(header);

            // Danh sách tập
            var episodes = kkphimEpisodes(detail);
            if (episodes.length) {
                var eps_section = $('<div class="kkphim-full__episodes"></div>');
                var eps_title = $('<div class="kkphim-full__eps-title">Danh sách tập</div>');
                var eps_list = $('<div class="kkphim-full__eps-list"></div>');

                episodes.forEach(function(ep, index) {
                    var ep_item = $('<div class="kkphim-full__ep selector" data-index="' + index + '">' + ep.name + '</div>');
                    
                    ep_item.on('hover:enter', function() {
                        playEpisode(ep, detail, episodes, index);
                    });

                    eps_list.append(ep_item);
                });

                eps_section.append(eps_title);
                eps_section.append(eps_list);
                body.append(eps_section);
            }
        };

        function playEpisode(episode, detail, all_episodes, index) {
            kkphimPlay(episode, function(stream) {
                if (stream) {
                    var playlist = all_episodes.map(function(ep, i) {
                        return {
                            title: detail.title + ' - ' + ep.name,
                            url: ep.link_m3u8 || ep.url,
                            index: i
                        };
                    });

                    Lampa.Player.play({
                        url: stream.url,
                        title: detail.title + ' - ' + episode.name,
                        playlist: playlist,
                        position: index
                    });

                    Lampa.Player.playlist(playlist);
                } else {
                    Lampa.Noty.show('Không thể phát video này');
                }
            });
        }

        this.empty = function() {
            var empty = $('<div class="kkphim-full__empty">Không tìm thấy thông tin phim</div>');
            body.append(empty);
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

    // CSS styles
    function addStyles() {
        var styles = '\
            .kkphim-main { padding: 1.5em; }\
            .kkphim-line { margin-bottom: 2em; }\
            .kkphim-line__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em; }\
            .kkphim-line__title { font-size: 1.5em; font-weight: bold; }\
            .kkphim-line__more { font-size: 1em; color: #fff; opacity: 0.7; padding: 0.5em 1em; }\
            .kkphim-line__more.focus { background: rgba(255,255,255,0.1); border-radius: 0.5em; }\
            .kkphim-line__content { display: flex; overflow-x: auto; gap: 1em; padding: 0.5em 0; }\
            .kkphim-card { width: 12em; flex-shrink: 0; }\
            .kkphim-card.focus .kkphim-card__img { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,255,255,0.3); }\
            .kkphim-card__img { position: relative; border-radius: 0.5em; overflow: hidden; aspect-ratio: 2/3; transition: transform 0.2s; }\
            .kkphim-card__img img { width: 100%; height: 100%; object-fit: cover; }\
            .kkphim-card__quality { position: absolute; top: 0.5em; left: 0.5em; background: #e50914; padding: 0.2em 0.5em; border-radius: 0.3em; font-size: 0.8em; }\
            .kkphim-card__episode { position: absolute; bottom: 0.5em; right: 0.5em; background: rgba(0,0,0,0.8); padding: 0.2em 0.5em; border-radius: 0.3em; font-size: 0.75em; }\
            .kkphim-card__title { margin-top: 0.5em; font-size: 1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
            .kkphim-card__year { font-size: 0.85em; opacity: 0.7; }\
            .kkphim-full { padding: 1.5em; }\
            .kkphim-full__header { display: flex; gap: 2em; margin-bottom: 2em; }\
            .kkphim-full__poster { width: 200px; flex-shrink: 0; }\
            .kkphim-full__poster img { width: 100%; border-radius: 0.5em; }\
            .kkphim-full__info { flex: 1; }\
            .kkphim-full__title { font-size: 2em; font-weight: bold; margin-bottom: 0.25em; }\
            .kkphim-full__original { font-size: 1.2em; opacity: 0.7; margin-bottom: 1em; }\
            .kkphim-full__meta { display: flex; gap: 1em; margin-bottom: 1em; }\
            .kkphim-full__meta span { background: rgba(255,255,255,0.1); padding: 0.3em 0.8em; border-radius: 0.3em; }\
            .kkphim-full__quality { background: #e50914 !important; }\
            .kkphim-full__overview { line-height: 1.6; opacity: 0.9; }\
            .kkphim-full__episodes { margin-top: 2em; }\
            .kkphim-full__eps-title { font-size: 1.5em; font-weight: bold; margin-bottom: 1em; }\
            .kkphim-full__eps-list { display: flex; flex-wrap: wrap; gap: 0.5em; }\
            .kkphim-full__ep { padding: 0.8em 1.2em; background: rgba(255,255,255,0.1); border-radius: 0.5em; cursor: pointer; }\
            .kkphim-full__ep.focus { background: #e50914; }\
            .kkphim-full__empty { text-align: center; padding: 3em; opacity: 0.7; }\
        ';

        var style = document.createElement('style');
        style.textContent = styles;
        document.head.appendChild(style);
    }

    // Khởi tạo plugin
    function initPlugin() {
        // Đợi Lampa load xong
        if (window.Lampa) {
            addStyles();
            registerComponent();
            
            // Đăng ký components
            Lampa.Component.add('kkphim_main', kkphimMainComponent);
            Lampa.Component.add('kkphim_full', kkphimFullComponent);
            Lampa.Component.add('kkphim_category', kkphimComponent);

            // Thêm vào menu
            addToMainMenu();

            // Đăng ký source
            if (typeof Lampa.Source !== 'undefined') {
                registerSource();
            }

            console.log('KKPhim Plugin loaded successfully!');
        } else {
            setTimeout(initPlugin, 100);
        }
    }

    // Chạy khi DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlugin);
    } else {
        initPlugin();
    }

})();