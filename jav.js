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
        switch (type) {
            case 'new': return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
            case 'phim-le': return CONFIG.api_url + '/danh-sach/phim-le?page=' + page;
            case 'phim-bo': return CONFIG.api_url + '/danh-sach/phim-bo?page=' + page;
            case 'hoat-hinh': return CONFIG.api_url + '/danh-sach/hoat-hinh?page=' + page;
            case 'tv-shows': return CONFIG.api_url + '/danh-sach/tv-shows?page=' + page;
            case 'phim-vietsub': return CONFIG.api_url + '/danh-sach/phim-vietsub?page=' + page;
            case 'phim-thuyet-minh': return CONFIG.api_url + '/danh-sach/phim-thuyet-minh?page=' + page;
            default: return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        }
    }

    // ==================== COMPONENT CATEGORY ====================
    function KKCategory(object) {
        var html = document.createElement('div');
        var scroll = document.createElement('div');
        var body = document.createElement('div');
        var page = 1;
        var total_pages = 100;
        var loading = false;
        var items = [];
        var active = 0;

        scroll.className = 'kkphim-scroll';
        body.className = 'kkphim-grid';

        scroll.appendChild(body);
        html.appendChild(scroll);

        this.create = function () {
            this.activity.loader(true);
            this.loadData();
        };

        this.loadData = function () {
            var _this = this;
            if (loading) return;
            loading = true;

            var url = getApiUrl(object.url || 'new', page);

            network.clear();
            network.timeout(15000);
            network.silent(url, function (response) {
                _this.activity.loader(false);
                loading = false;

                var movies = [];
                var data = response.data || response;
                var list = data.items || [];

                total_pages = data.params?.pagination?.totalPages ||
                    data.pagination?.totalPages || 100;

                list.forEach(function (item) {
                    movies.push(convertToLampaFormat(item));
                });

                if (movies.length) {
                    _this.build(movies);
                } else if (page === 1) {
                    _this.empty();
                }

                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                loading = false;
                if (page === 1) _this.empty();
                _this.activity.toggle();
            });
        };

        this.build = function (data) {
            var _this = this;

            data.forEach(function (movie, index) {
                var card = document.createElement('div');
                card.className = 'kkphim-card selector';
                card.innerHTML = '\
                    <div class="kkphim-card__img">\
                        <img src="' + (movie.poster_path || './img/img_broken.svg') + '" />\
                        <div class="kkphim-card__quality">' + (movie.quality || 'HD') + '</div>\
                        <div class="kkphim-card__ep">' + (movie.episode_current || '') + '</div>\
                    </div>\
                    <div class="kkphim-card__title">' + movie.title + '</div>\
                    <div class="kkphim-card__year">' + (movie.year || '') + '</div>\
                ';

                card.querySelector('img').onerror = function () {
                    this.src = './img/img_broken.svg';
                };

                // Click/touch event
                card.addEventListener('click', function () {
                    _this.openMovie(movie);
                });

                // Hover event cho TV remote
                $(card).on('hover:enter', function () {
                    _this.openMovie(movie);
                });

                body.appendChild(card);
                items.push(card);
            });

            // Nút tải thêm
            if (page < total_pages) {
                var loadMore = document.createElement('div');
                loadMore.className = 'kkphim-loadmore selector';
                loadMore.innerHTML = '<span>Tải thêm</span>';

                loadMore.addEventListener('click', function () {
                    page++;
                    loadMore.remove();
                    _this.activity.loader(true);
                    _this.loadData();
                });

                $(loadMore).on('hover:enter', function () {
                    page++;
                    loadMore.remove();
                    _this.activity.loader(true);
                    _this.loadData();
                });

                body.appendChild(loadMore);
            }
        };

        this.openMovie = function (movie) {
            Lampa.Activity.push({
                url: '',
                title: movie.title,
                component: 'kkphim_full',
                card: movie
            });
        };

        this.empty = function () {
            body.innerHTML = '<div class="kkphim-empty">Không có dữ liệu</div>';
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll);
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll);
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
            this.activity.mountCancel();
            this.create();
        };

        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return $(html); };
        this.destroy = function () {
            network.clear();
            items = [];
            html.remove();
        };
    }

    // ==================== COMPONENT FULL (CHI TIẾT) ====================
    function KKFull(object) {
        var html = document.createElement('div');
        var scroll = document.createElement('div');
        var body = document.createElement('div');
        var card = object.card;
        var episodeItems = [];

        scroll.className = 'kkphim-scroll';
        body.className = 'kkphim-full-body';

        scroll.appendChild(body);
        html.appendChild(scroll);

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            var url = CONFIG.base_url + '/phim/' + card.slug;

            network.clear();
            network.timeout(15000);
            network.silent(url, function (response) {
                _this.activity.loader(false);

                if (response.movie) {
                    _this.build(response);
                } else {
                    _this.empty();
                }

                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                _this.empty();
                _this.activity.toggle();
            });
        };

        this.build = function (data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];

            // Header
            var header = document.createElement('div');
            header.className = 'kkphim-detail';
            header.innerHTML = '\
                <div class="kkphim-detail__poster">\
                    <img src="' + getImageUrl(movie.poster_url || movie.thumb_url) + '" />\
                </div>\
                <div class="kkphim-detail__info">\
                    <div class="kkphim-detail__title">' + movie.name + '</div>\
                    <div class="kkphim-detail__original">' + (movie.origin_name || '') + '</div>\
                    <div class="kkphim-detail__meta">\
                        <span class="kkphim-tag kkphim-tag--primary">' + (movie.year || 'N/A') + '</span>\
                        <span class="kkphim-tag kkphim-tag--success">' + (movie.quality || 'HD') + '</span>\
                        <span class="kkphim-tag">' + (movie.lang || 'Vietsub') + '</span>\
                        <span class="kkphim-tag">' + (movie.time || '') + '</span>\
                    </div>\
                    <div class="kkphim-detail__extra">\
                        <div><b>Trạng thái:</b> ' + (movie.episode_current || 'Full') + '</div>\
                        <div><b>Quốc gia:</b> ' + (movie.country?.map(function (c) { return c.name }).join(', ') || 'N/A') + '</div>\
                        <div><b>Thể loại:</b> ' + (movie.category?.map(function (c) { return c.name }).join(', ') || 'N/A') + '</div>\
                    </div>\
                    <div class="kkphim-detail__desc">' + (movie.content || 'Không có mô tả').substring(0, 500) + '</div>\
                </div>\
            ';
            body.appendChild(header);

            // Episodes
            if (episodes.length) {
                episodes.forEach(function (server, sIdx) {
                    var serverData = server.server_data || [];
                    if (!serverData.length) return;

                    var section = document.createElement('div');
                    section.className = 'kkphim-episodes';
                    section.innerHTML = '<div class="kkphim-episodes__title">' + (server.server_name || 'Server ' + (sIdx + 1)) + ' (' + serverData.length + ' tập)</div>';

                    var list = document.createElement('div');
                    list.className = 'kkphim-episodes__list';

                    serverData.forEach(function (ep, epIdx) {
                        var epBtn = document.createElement('div');
                        epBtn.className = 'kkphim-ep selector';
                        epBtn.textContent = ep.name || 'Tập ' + (epIdx + 1);

                        epBtn.addEventListener('click', function () {
                            _this.play(ep, movie, serverData, epIdx);
                        });

                        $(epBtn).on('hover:enter', function () {
                            _this.play(ep, movie, serverData, epIdx);
                        });

                        list.appendChild(epBtn);
                        episodeItems.push(epBtn);
                    });

                    section.appendChild(list);
                    body.appendChild(section);
                });
            } else {
                var noEp = document.createElement('div');
                noEp.className = 'kkphim-empty';
                noEp.textContent = 'Phim chưa có tập nào';
                body.appendChild(noEp);
            }
        };

        this.play = function (episode, movie, allEps, index) {
            var streamUrl = episode.link_m3u8 || episode.link_embed;

            if (!streamUrl) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            var playlist = allEps.map(function (ep, i) {
                return {
                    title: movie.name + ' - ' + (ep.name || 'Tập ' + (i + 1)),
                    url: ep.link_m3u8 || ep.link_embed
                };
            });

            Lampa.Player.play({
                url: streamUrl,
                title: movie.name + ' - ' + (episode.name || ''),
                poster: getImageUrl(movie.poster_url)
            });

            Lampa.Player.playlist(playlist);
        };

        this.empty = function () {
            body.innerHTML = '<div class="kkphim-empty">Không tìm thấy thông tin phim</div>';
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll);
                    Lampa.Controller.collectionFocus(episodeItems.length ? episodeItems[0] : false, scroll);
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
            this.activity.mountCancel();
            this.create();
        };

        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return $(html); };
        this.destroy = function () {
            network.clear();
            episodeItems = [];
            html.remove();
        };
    }

    // ==================== COMPONENT MAIN ====================
    function KKMain(object) {
        var html = document.createElement('div');
        var scroll = document.createElement('div');
        var body = document.createElement('div');
        var allItems = [];

        scroll.className = 'kkphim-scroll';
        body.className = 'kkphim-main-body';

        scroll.appendChild(body);
        html.appendChild(scroll);

        var categories = [
            { title: '🎬 Phim Mới Cập Nhật', url: 'new' },
            { title: '🎥 Phim Lẻ', url: 'phim-le' },
            { title: '📺 Phim Bộ', url: 'phim-bo' },
            { title: '🎨 Hoạt Hình', url: 'hoat-hinh' },
            { title: '📡 TV Shows', url: 'tv-shows' }
        ];

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            // Header với search
            var header = document.createElement('div');
            header.className = 'kkphim-header';
            header.innerHTML = '\
                <div class="kkphim-header__title">KKPhim</div>\
                <div class="kkphim-header__search selector">🔍 Tìm kiếm phim</div>\
            ';

            var searchBtn = header.querySelector('.kkphim-header__search');
            allItems.push(searchBtn);

            searchBtn.addEventListener('click', function () {
                _this.openSearch();
            });

            $(searchBtn).on('hover:enter', function () {
                _this.openSearch();
            });

            body.appendChild(header);

            // Load categories
            var loaded = 0;
            categories.forEach(function (cat) {
                _this.loadCat(cat, function () {
                    loaded++;
                    if (loaded >= categories.length) {
                        _this.activity.loader(false);
                        _this.activity.toggle();
                    }
                });
            });
        };

        this.openSearch = function () {
            Lampa.Input.edit({
                title: 'Tìm kiếm phim',
                value: '',
                free: true
            }, function (text) {
                if (text) {
                    Lampa.Activity.push({
                        url: text,
                        title: 'Tìm: ' + text,
                        component: 'kkphim_search',
                        search: text
                    });
                }
            });
        };

        this.loadCat = function (cat, callback) {
            var _this = this;
            var url = getApiUrl(cat.url, 1);

            network.silent(url, function (response) {
                var data = response.data || response;
                var list = (data.items || []).slice(0, 12);

                if (list.length) {
                    _this.buildLine(cat, list.map(convertToLampaFormat));
                }
                callback();
            }, callback);
        };

        this.buildLine = function (cat, movies) {
            var _this = this;

            var line = document.createElement('div');
            line.className = 'kkphim-line';

            var head = document.createElement('div');
            head.className = 'kkphim-line__head';

            var title = document.createElement('div');
            title.className = 'kkphim-line__title';
            title.textContent = cat.title;

            var more = document.createElement('div');
            more.className = 'kkphim-line__more selector';
            more.textContent = 'Xem tất cả ➜';

            more.addEventListener('click', function () {
                _this.openCategory(cat);
            });

            $(more).on('hover:enter', function () {
                _this.openCategory(cat);
            });

            allItems.push(more);

            head.appendChild(title);
            head.appendChild(more);
            line.appendChild(head);

            var row = document.createElement('div');
            row.className = 'kkphim-line__body';

            movies.forEach(function (movie) {
                var card = document.createElement('div');
                card.className = 'kkphim-card selector';
                card.innerHTML = '\
                    <div class="kkphim-card__img">\
                        <img src="' + (movie.poster_path || './img/img_broken.svg') + '" />\
                        <div class="kkphim-card__quality">' + (movie.quality || 'HD') + '</div>\
                        <div class="kkphim-card__ep">' + (movie.episode_current || '') + '</div>\
                    </div>\
                    <div class="kkphim-card__title">' + movie.title + '</div>\
                    <div class="kkphim-card__year">' + (movie.year || '') + '</div>\
                ';

                card.querySelector('img').onerror = function () {
                    this.src = './img/img_broken.svg';
                };

                card.addEventListener('click', function () {
                    _this.openMovie(movie);
                });

                $(card).on('hover:enter', function () {
                    _this.openMovie(movie);
                });

                row.appendChild(card);
                allItems.push(card);
            });

            line.appendChild(row);
            body.appendChild(line);
        };

        this.openCategory = function (cat) {
            Lampa.Activity.push({
                url: cat.url,
                title: cat.title.replace(/[🎬🎥📺🎨📡]\s?/g, ''),
                component: 'kkphim_category'
            });
        };

        this.openMovie = function (movie) {
            Lampa.Activity.push({
                url: '',
                title: movie.title,
                component: 'kkphim_full',
                card: movie
            });
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll);
                    Lampa.Controller.collectionFocus(allItems.length ? allItems[0] : false, scroll);
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
            this.activity.mountCancel();
            this.create();
        };

        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return $(html); };
        this.destroy = function () {
            network.clear();
            allItems = [];
            html.remove();
        };
    }

    // ==================== COMPONENT SEARCH ====================
    function KKSearch(object) {
        var html = document.createElement('div');
        var scroll = document.createElement('div');
        var body = document.createElement('div');
        var keyword = object.search || '';
        var items = [];

        scroll.className = 'kkphim-scroll';
        body.className = 'kkphim-grid';

        scroll.appendChild(body);
        html.appendChild(scroll);

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            var url = CONFIG.api_url + '/tim-kiem?keyword=' + encodeURIComponent(keyword);

            network.clear();
            network.timeout(15000);
            network.silent(url, function (response) {
                _this.activity.loader(false);

                var movies = [];
                var data = response.data || response;
                var list = data.items || [];

                list.forEach(function (item) {
                    movies.push(convertToLampaFormat(item));
                });

                if (movies.length) {
                    _this.build(movies);
                } else {
                    _this.empty();
                }

                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                _this.empty();
                _this.activity.toggle();
            });
        };

        this.build = function (data) {
            var _this = this;

            data.forEach(function (movie) {
                var card = document.createElement('div');
                card.className = 'kkphim-card selector';
                card.innerHTML = '\
                    <div class="kkphim-card__img">\
                        <img src="' + (movie.poster_path || './img/img_broken.svg') + '" />\
                        <div class="kkphim-card__quality">' + (movie.quality || 'HD') + '</div>\
                    </div>\
                    <div class="kkphim-card__title">' + movie.title + '</div>\
                    <div class="kkphim-card__year">' + (movie.year || '') + '</div>\
                ';

                card.addEventListener('click', function () {
                    _this.openMovie(movie);
                });

                $(card).on('hover:enter', function () {
                    _this.openMovie(movie);
                });

                body.appendChild(card);
                items.push(card);
            });
        };

        this.openMovie = function (movie) {
            Lampa.Activity.push({
                url: '',
                title: movie.title,
                component: 'kkphim_full',
                card: movie
            });
        };

        this.empty = function () {
            body.innerHTML = '<div class="kkphim-empty">Không tìm thấy phim "' + keyword + '"</div>';
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll);
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll);
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
            this.activity.mountCancel();
            this.create();
        };

        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return $(html); };
        this.destroy = function () {
            network.clear();
            items = [];
            html.remove();
        };
    }

    // ==================== CSS ====================
    function addCSS() {
        if (document.getElementById('kkphim-css')) return;
        var style = document.createElement('style');
        style.id = 'kkphim-css';
        style.textContent = '\
            .kkphim-scroll { height: 100%; overflow-y: auto; overflow-x: hidden; padding: 1em; }\
            .kkphim-scroll::-webkit-scrollbar { width: 8px; }\
            .kkphim-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }\
            .kkphim-scroll::-webkit-scrollbar-track { background: transparent; }\
            \
            .kkphim-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1em; padding: 0.5em; }\
            .kkphim-main-body { padding-bottom: 2em; }\
            .kkphim-full-body { padding-bottom: 2em; }\
            \
            .kkphim-header { display: flex; justify-content: space-between; align-items: center; padding: 0.8em 0.5em; margin-bottom: 1em; border-bottom: 1px solid rgba(255,255,255,0.1); }\
            .kkphim-header__title { font-size: 1.6em; font-weight: bold; color: #e50914; }\
            .kkphim-header__search { padding: 0.6em 1.2em; background: rgba(255,255,255,0.1); border-radius: 2em; cursor: pointer; transition: all 0.2s; }\
            .kkphim-header__search:hover, .kkphim-header__search.focus { background: #e50914; }\
            \
            .kkphim-line { margin-bottom: 1.5em; }\
            .kkphim-line__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8em; }\
            .kkphim-line__title { font-size: 1.2em; color: #fff; }\
            .kkphim-line__more { padding: 0.4em 0.8em; color: rgba(255,255,255,0.6); font-size: 0.9em; cursor: pointer; border-radius: 0.3em; transition: all 0.2s; }\
            .kkphim-line__more:hover, .kkphim-line__more.focus { background: rgba(255,255,255,0.15); color: #fff; }\
            .kkphim-line__body { display: flex; gap: 1em; overflow-x: auto; padding: 0.5em 0; }\
            .kkphim-line__body::-webkit-scrollbar { height: 6px; }\
            .kkphim-line__body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }\
            \
            .kkphim-card { width: 130px; flex-shrink: 0; cursor: pointer; transition: transform 0.2s; }\
            .kkphim-card:hover, .kkphim-card.focus { transform: scale(1.05); }\
            .kkphim-card.focus .kkphim-card__img { border-color: #fff; box-shadow: 0 5px 20px rgba(0,0,0,0.5); }\
            .kkphim-card__img { position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 2/3; border: 2px solid transparent; transition: all 0.2s; }\
            .kkphim-card__img img { width: 100%; height: 100%; object-fit: cover; }\
            .kkphim-card__quality { position: absolute; top: 5px; left: 5px; background: #e50914; padding: 2px 6px; border-radius: 3px; font-size: 0.7em; font-weight: bold; }\
            .kkphim-card__ep { position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.85); padding: 2px 6px; border-radius: 3px; font-size: 0.65em; }\
            .kkphim-card__title { margin-top: 8px; font-size: 0.85em; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }\
            .kkphim-card__year { font-size: 0.75em; color: rgba(255,255,255,0.5); text-align: center; }\
            \
            .kkphim-detail { display: flex; gap: 1.5em; margin-bottom: 1.5em; flex-wrap: wrap; }\
            .kkphim-detail__poster { width: 180px; flex-shrink: 0; }\
            .kkphim-detail__poster img { width: 100%; border-radius: 8px; }\
            .kkphim-detail__info { flex: 1; min-width: 250px; }\
            .kkphim-detail__title { font-size: 1.5em; color: #fff; margin-bottom: 0.2em; }\
            .kkphim-detail__original { font-size: 1em; color: rgba(255,255,255,0.5); margin-bottom: 0.8em; }\
            .kkphim-detail__meta { display: flex; flex-wrap: wrap; gap: 0.5em; margin-bottom: 0.8em; }\
            .kkphim-tag { padding: 0.25em 0.6em; background: rgba(255,255,255,0.15); border-radius: 4px; font-size: 0.85em; }\
            .kkphim-tag--primary { background: #e50914; }\
            .kkphim-tag--success { background: #2ecc71; }\
            .kkphim-detail__extra { margin-bottom: 0.8em; line-height: 1.6; font-size: 0.9em; color: rgba(255,255,255,0.7); }\
            .kkphim-detail__desc { color: rgba(255,255,255,0.6); line-height: 1.5; font-size: 0.9em; max-height: 100px; overflow-y: auto; }\
            \
            .kkphim-episodes { margin-bottom: 1.5em; }\
            .kkphim-episodes__title { font-size: 1.1em; color: #fff; margin-bottom: 0.8em; padding-bottom: 0.4em; border-bottom: 1px solid rgba(255,255,255,0.1); }\
            .kkphim-episodes__list { display: flex; flex-wrap: wrap; gap: 0.5em; }\
            .kkphim-ep { padding: 0.5em 1em; background: rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer; transition: all 0.15s; }\
            .kkphim-ep:hover, .kkphim-ep.focus { background: #e50914; transform: scale(1.05); }\
            \
            .kkphim-loadmore { grid-column: 1 / -1; padding: 1em; text-align: center; background: rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; transition: all 0.2s; }\
            .kkphim-loadmore:hover, .kkphim-loadmore.focus { background: #e50914; }\
            \
            .kkphim-empty { grid-column: 1 / -1; text-align: center; padding: 3em; color: rgba(255,255,255,0.4); font-size: 1.1em; }\
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

            item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_main'
                });
            });

            // Thêm click event cho web/mobile
            item.on('click', function () {
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
            Lampa.Listener.follow('app', function (e) {
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