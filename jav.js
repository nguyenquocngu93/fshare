(function () {
    'use strict';

    function log(msg) {
        console.log('KKPhim: ' + msg);
    }

    if (!window.Lampa) return;

    var network = new Lampa.Reguest();

    var CONFIG = {
        base_url: 'https://phimapi.com',
        api_url: 'https://phimapi.com/v1/api',
        img_url: 'https://phimimg.com'
    };

    function getImageUrl(path) {
        if (!path) return '';
        if (path.indexOf('http') === 0) return path;
        return CONFIG.img_url + '/' + String(path).replace(/^\/+/, '');
    }

    function clearHtml(str) {
        if (!str) return '';
        return String(str).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    }

    function convertToLampaFormat(item) {
        return {
            id: item._id || item.slug,
            title: item.name || '',
            name: item.name || '',
            original_title: item.origin_name || '',
            overview: clearHtml(item.content || item.description || ''),
            poster_path: getImageUrl(item.poster_url || item.thumb_url),
            backdrop_path: getImageUrl(item.thumb_url || item.poster_url),
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
            case 'new':
                return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
            case 'phim-le':
                return CONFIG.api_url + '/danh-sach/phim-le?page=' + page;
            case 'phim-bo':
                return CONFIG.api_url + '/danh-sach/phim-bo?page=' + page;
            case 'hoat-hinh':
                return CONFIG.api_url + '/danh-sach/hoat-hinh?page=' + page;
            case 'tv-shows':
                return CONFIG.api_url + '/danh-sach/tv-shows?page=' + page;
            default:
                return CONFIG.base_url + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        }
    }

    function createCard(movie, onEnter) {
        var card = document.createElement('div');
        card.className = 'kkphim-card selector';
        card.innerHTML = ''
            + '<div class="kkphim-card__img">'
            + '  <img src="' + (movie.poster_path || './img/img_broken.svg') + '" />'
            + '  <div class="kkphim-card__quality">' + (movie.quality || 'HD') + '</div>'
            + (movie.episode_current ? '<div class="kkphim-card__ep">' + movie.episode_current + '</div>' : '')
            + '</div>'
            + '<div class="kkphim-card__title">' + (movie.title || '') + '</div>'
            + '<div class="kkphim-card__year">' + (movie.year || '') + '</div>';

        var img = card.querySelector('img');
        if (img) {
            img.onerror = function () {
                this.src = './img/img_broken.svg';
            };
        }

        card.addEventListener('click', function () {
            onEnter();
        });

        $(card).on('hover:enter', function () {
            onEnter();
        });

        return card;
    }

    function bindBack(activity) {
        // fallback cho các bản lampa cũ/khác nhau
        if (activity && typeof activity.bind !== 'undefined') return;
    }

    /**
     * CATEGORY
     */
    function KKCategory(object) {
        var html = document.createElement('div');
        var scroll = document.createElement('div');
        var body = document.createElement('div');
        var page = 1;
        var total_pages = 1;
        var loading = false;
        var items = [];

        html.className = 'kkphim-page';
        scroll.className = 'kkphim-scroll';
        body.className = 'kkphim-grid';

        scroll.appendChild(body);
        html.appendChild(scroll);

        this.create = function () {
            this.load();
        };

        this.load = function () {
            var _this = this;
            if (loading) return;
            loading = true;

            if (_this.activity && _this.activity.loader) _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(getApiUrl(object.url || 'new', page), function (response) {
                loading = false;
                if (_this.activity && _this.activity.loader) _this.activity.loader(false);

                var data = response.data || response || {};
                var list = data.items || [];
                total_pages = (data.params && data.params.pagination && data.params.pagination.totalPages) || 1;

                if (!list.length && page === 1) {
                    body.innerHTML = '<div class="kkphim-empty">Không có dữ liệu</div>';
                    if (_this.activity && _this.activity.toggle) _this.activity.toggle();
                    return;
                }

                list.forEach(function (item) {
                    var movie = convertToLampaFormat(item);
                    var card = createCard(movie, function () {
                        Lampa.Activity.push({
                            url: '',
                            title: movie.title,
                            component: 'kkphim_full',
                            card: movie,
                            page: 1
                        });
                    });
                    body.appendChild(card);
                    items.push(card);
                });

                if (page < total_pages) {
                    var old = body.querySelector('.kkphim-loadmore');
                    if (old) old.remove();

                    var more = document.createElement('div');
                    more.className = 'kkphim-loadmore selector';
                    more.innerHTML = 'Tải thêm';

                    more.addEventListener('click', function () {
                        more.remove();
                        page++;
                        _this.load();
                    });

                    $(more).on('hover:enter', function () {
                        more.remove();
                        page++;
                        _this.load();
                    });

                    body.appendChild(more);
                    items.push(more);
                }

                if (_this.activity && _this.activity.toggle) _this.activity.toggle();
            }, function () {
                loading = false;
                if (_this.activity && _this.activity.loader) _this.activity.loader(false);
                if (!body.innerHTML) body.innerHTML = '<div class="kkphim-empty">Lỗi tải dữ liệu</div>';
                if (_this.activity && _this.activity.toggle) _this.activity.toggle();
            });
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return $(html);
        };
        this.destroy = function () {
            network.clear();
            items = [];
            html.remove();
        };
    }

    /**
     * SEARCH
     */
    function KKSearch(object) {
        var html = document.createElement('div');
        var scroll = document.createElement('div');
        var body = document.createElement('div');
        var items = [];
        var keyword = object.search || '';

        html.className = 'kkphim-page';
        scroll.className = 'kkphim-scroll';
        body.className = 'kkphim-grid';

        scroll.appendChild(body);
        html.appendChild(scroll);

        this.create = function () {
            var _this = this;

            if (_this.activity && _this.activity.loader) _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(CONFIG.api_url + '/tim-kiem?keyword=' + encodeURIComponent(keyword), function (response) {
                if (_this.activity && _this.activity.loader) _this.activity.loader(false);

                var data = response.data || response || {};
                var list = data.items || [];

                if (!list.length) {
                    body.innerHTML = '<div class="kkphim-empty">Không tìm thấy phim "' + keyword + '"</div>';
                    if (_this.activity && _this.activity.toggle) _this.activity.toggle();
                    return;
                }

                list.forEach(function (item) {
                    var movie = convertToLampaFormat(item);
                    var card = createCard(movie, function () {
                        Lampa.Activity.push({
                            url: '',
                            title: movie.title,
                            component: 'kkphim_full',
                            card: movie,
                            page: 1
                        });
                    });
                    body.appendChild(card);
                    items.push(card);
                });

                if (_this.activity && _this.activity.toggle) _this.activity.toggle();
            }, function () {
                if (_this.activity && _this.activity.loader) _this.activity.loader(false);
                body.innerHTML = '<div class="kkphim-empty">Lỗi tìm kiếm</div>';
                if (_this.activity && _this.activity.toggle) _this.activity.toggle();
            });
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return $(html);
        };
        this.destroy = function () {
            network.clear();
            items = [];
            html.remove();
        };
    }

    /**
     * MAIN
     */
    function KKMain(object) {
        var html = document.createElement('div');
        var scroll = document.createElement('div');
        var body = document.createElement('div');

        html.className = 'kkphim-page';
        scroll.className = 'kkphim-scroll';
        body.className = 'kkphim-main';

        scroll.appendChild(body);
        html.appendChild(scroll);

        var categories = [
            { title: 'Phim Mới Cập Nhật', url: 'new' },
            { title: 'Phim Lẻ', url: 'phim-le' },
            { title: 'Phim Bộ', url: 'phim-bo' },
            { title: 'Hoạt Hình', url: 'hoat-hinh' },
            { title: 'TV Shows', url: 'tv-shows' }
        ];

        this.create = function () {
            var _this = this;
            if (_this.activity && _this.activity.loader) _this.activity.loader(true);

            var header = document.createElement('div');
            header.className = 'kkphim-header';
            header.innerHTML = ''
                + '<div class="kkphim-header__title">KKPhim</div>'
                + '<div class="kkphim-header__search selector">🔍 Tìm kiếm</div>';

            var search = header.querySelector('.kkphim-header__search');

            search.addEventListener('click', function () {
                _this.search();
            });

            $(search).on('hover:enter', function () {
                _this.search();
            });

            body.appendChild(header);

            var loaded = 0;

            categories.forEach(function (cat) {
                network.silent(getApiUrl(cat.url, 1), function (response) {
                    var data = response.data || response || {};
                    var list = (data.items || []).slice(0, 12);

                    if (list.length) {
                        _this.appendLine(cat, list.map(convertToLampaFormat));
                    }

                    loaded++;
                    if (loaded >= categories.length) {
                        if (_this.activity && _this.activity.loader) _this.activity.loader(false);
                        if (_this.activity && _this.activity.toggle) _this.activity.toggle();
                    }
                }, function () {
                    loaded++;
                    if (loaded >= categories.length) {
                        if (_this.activity && _this.activity.loader) _this.activity.loader(false);
                        if (_this.activity && _this.activity.toggle) _this.activity.toggle();
                    }
                });
            });
        };

        this.search = function () {
            Lampa.Input.edit({
                title: 'Tìm kiếm phim',
                value: '',
                free: true
            }, function (value) {
                if (!value) return;

                Lampa.Activity.push({
                    url: value,
                    title: 'Tìm: ' + value,
                    component: 'kkphim_search',
                    search: value,
                    page: 1
                });
            });
        };

        this.appendLine = function (cat, movies) {
            var line = document.createElement('div');
            line.className = 'kkphim-line';

            var head = document.createElement('div');
            head.className = 'kkphim-line__head';
            head.innerHTML = ''
                + '<div class="kkphim-line__title">' + cat.title + '</div>'
                + '<div class="kkphim-line__more selector">Xem tất cả</div>';

            var more = head.querySelector('.kkphim-line__more');

            more.addEventListener('click', function () {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkphim_category',
                    page: 1
                });
            });

            $(more).on('hover:enter', function () {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkphim_category',
                    page: 1
                });
            });

            var row = document.createElement('div');
            row.className = 'kkphim-line__body';

            movies.forEach(function (movie) {
                row.appendChild(createCard(movie, function () {
                    Lampa.Activity.push({
                        url: '',
                        title: movie.title,
                        component: 'kkphim_full',
                        card: movie,
                        page: 1
                    });
                }));
            });

            line.appendChild(head);
            line.appendChild(row);
            body.appendChild(line);
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return $(html);
        };
        this.destroy = function () {
            network.clear();
            html.remove();
        };
    }

    /**
     * FULL / DETAIL
     */
    function KKFull(object) {
        var html = document.createElement('div');
        var scroll = document.createElement('div');
        var body = document.createElement('div');
        var card = object.card;

        html.className = 'kkphim-page kkphim-page--detail';
        scroll.className = 'kkphim-scroll';
        body.className = 'kkphim-detail-page';

        scroll.appendChild(body);
        html.appendChild(scroll);

        this.create = function () {
            var _this = this;
            if (_this.activity && _this.activity.loader) _this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(CONFIG.base_url + '/phim/' + card.slug, function (response) {
                if (_this.activity && _this.activity.loader) _this.activity.loader(false);

                if (!response || !response.movie) {
                    body.innerHTML = '<div class="kkphim-empty">Không tìm thấy thông tin phim</div>';
                    if (_this.activity && _this.activity.toggle) _this.activity.toggle();
                    return;
                }

                _this.build(response);
                if (_this.activity && _this.activity.toggle) _this.activity.toggle();
            }, function () {
                if (_this.activity && _this.activity.loader) _this.activity.loader(false);
                body.innerHTML = '<div class="kkphim-empty">Lỗi tải chi tiết phim</div>';
                if (_this.activity && _this.activity.toggle) _this.activity.toggle();
            });
        };

        this.build = function (data) {
            var _this = this;
            var movie = data.movie;
            var episodes = data.episodes || [];

            var backdrop = getImageUrl(movie.thumb_url || movie.poster_url);
            var poster = getImageUrl(movie.poster_url || movie.thumb_url);

            var info = document.createElement('div');
            info.className = 'kkphim-detail-hero';
            info.innerHTML = ''
                + '<div class="kkphim-detail-hero__bg" style="background-image:url(\'' + backdrop + '\')"></div>'
                + '<div class="kkphim-detail-hero__overlay"></div>'
                + '<div class="kkphim-detail-hero__content">'
                + '  <div class="kkphim-detail-hero__poster"><img src="' + poster + '" /></div>'
                + '  <div class="kkphim-detail-hero__info">'
                + '      <div class="kkphim-detail-hero__title">' + (movie.name || '') + '</div>'
                + '      <div class="kkphim-detail-hero__original">' + (movie.origin_name || '') + '</div>'
                + '      <div class="kkphim-detail-hero__meta">'
                + '          <span>' + (movie.year || 'N/A') + '</span>'
                + '          <span>' + (movie.quality || 'HD') + '</span>'
                + '          <span>' + (movie.lang || 'Vietsub') + '</span>'
                + '          <span>' + (movie.time || '') + '</span>'
                + '      </div>'
                + '      <div class="kkphim-detail-hero__extra">'
                + '          <div><b>Trạng thái:</b> ' + (movie.episode_current || 'Full') + '</div>'
                + '          <div><b>Tổng tập:</b> ' + (movie.episode_total || 'N/A') + '</div>'
                + '          <div><b>Quốc gia:</b> ' + ((movie.country || []).map(function (c) { return c.name; }).join(', ') || 'N/A') + '</div>'
                + '          <div><b>Thể loại:</b> ' + ((movie.category || []).map(function (c) { return c.name; }).join(', ') || 'N/A') + '</div>'
                + '      </div>'
                + '      <div class="kkphim-detail-hero__desc">' + clearHtml(movie.content || 'Không có mô tả') + '</div>'
                + '  </div>'
                + '</div>';

            body.appendChild(info);

            if (episodes.length) {
                episodes.forEach(function (server, sIndex) {
                    var serverData = server.server_data || [];
                    if (!serverData.length) return;

                    var section = document.createElement('div');
                    section.className = 'kkphim-episodes';

                    var title = document.createElement('div');
                    title.className = 'kkphim-episodes__title';
                    title.textContent = (server.server_name || ('Server ' + (sIndex + 1))) + ' (' + serverData.length + ' tập)';
                    section.appendChild(title);

                    var list = document.createElement('div');
                    list.className = 'kkphim-episodes__list';

                    serverData.forEach(function (ep, index) {
                        var btn = document.createElement('div');
                        btn.className = 'kkphim-ep selector';
                        btn.textContent = ep.name || ('Tập ' + (index + 1));

                        function playEpisode() {
                            var stream = ep.link_m3u8 || ep.link_embed;
                            if (!stream) {
                                Lampa.Noty.show('Không có link phát');
                                return;
                            }

                            var playlist = serverData.map(function (item, i) {
                                return {
                                    title: (movie.name || '') + ' - ' + (item.name || ('Tập ' + (i + 1))),
                                    url: item.link_m3u8 || item.link_embed
                                };
                            });

                            Lampa.Player.play({
                                url: stream,
                                title: (movie.name || '') + ' - ' + (ep.name || ''),
                                poster: poster,
                                backdrop: backdrop
                            });

                            if (Lampa.Player.playlist) Lampa.Player.playlist(playlist);
                        }

                        btn.addEventListener('click', playEpisode);
                        $(btn).on('hover:enter', playEpisode);

                        list.appendChild(btn);
                    });

                    section.appendChild(list);
                    body.appendChild(section);
                });
            } else {
                var empty = document.createElement('div');
                empty.className = 'kkphim-empty';
                empty.textContent = 'Phim chưa có tập';
                body.appendChild(empty);
            }
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return $(html);
        };
        this.destroy = function () {
            network.clear();
            html.remove();
        };
    }

    function addCSS() {
        if (document.getElementById('kkphim-css')) return;

        var style = document.createElement('style');
        style.id = 'kkphim-css';
        style.textContent = ''
            + '.kkphim-page{height:100%;}'
            + '.kkphim-scroll{height:100%;overflow-y:auto;overflow-x:hidden;padding:1em 1em 2em;}'
            + '.kkphim-scroll::-webkit-scrollbar{width:6px;height:6px;}'
            + '.kkphim-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:10px;}'

            + '.kkphim-main{padding-bottom:2em;}'
            + '.kkphim-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1em;}'

            + '.kkphim-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1em;}'
            + '.kkphim-header__title{font-size:1.8em;font-weight:700;color:#fff;}'
            + '.kkphim-header__search{padding:.55em 1em;border-radius:10px;background:rgba(255,255,255,.08);}'
            + '.kkphim-header__search.focus{background:rgba(255,255,255,.18);}'

            + '.kkphim-line{margin-bottom:1.5em;}'
            + '.kkphim-line__head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.7em;}'
            + '.kkphim-line__title{font-size:1.2em;font-weight:600;color:#fff;}'
            + '.kkphim-line__more{padding:.4em .8em;border-radius:8px;color:rgba(255,255,255,.7);}'
            + '.kkphim-line__more.focus{background:rgba(255,255,255,.12);color:#fff;}'
            + '.kkphim-line__body{display:flex;gap:1em;overflow-x:auto;padding:.2em 0 .5em;}'
            + '.kkphim-line__body::-webkit-scrollbar{height:6px;}'
            + '.kkphim-line__body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:10px;}'

            + '.kkphim-card{width:140px;flex:0 0 140px;}'
            + '.kkphim-card__img{position:relative;aspect-ratio:2/3;border-radius:12px;overflow:hidden;border:2px solid transparent;transition:.2s;}'
            + '.kkphim-card__img img{width:100%;height:100%;object-fit:cover;display:block;}'
            + '.kkphim-card.focus .kkphim-card__img{border-color:#fff;transform:scale(1.03);box-shadow:0 8px 24px rgba(0,0,0,.35);}'
            + '.kkphim-card__quality{position:absolute;top:6px;left:6px;background:#d62828;color:#fff;font-size:.72em;padding:2px 6px;border-radius:6px;font-weight:700;}'
            + '.kkphim-card__ep{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.72);color:#fff;font-size:.7em;padding:2px 6px;border-radius:6px;}'
            + '.kkphim-card__title{margin-top:.55em;font-size:.92em;line-height:1.3;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}'
            + '.kkphim-card__year{margin-top:.2em;color:rgba(255,255,255,.55);font-size:.82em;}'

            + '.kkphim-loadmore{grid-column:1/-1;text-align:center;padding:1em;border-radius:12px;background:rgba(255,255,255,.08);}'
            + '.kkphim-loadmore.focus{background:rgba(255,255,255,.16);}'
            + '.kkphim-empty{text-align:center;color:rgba(255,255,255,.6);padding:2em 1em;}'

            + '.kkphim-detail-page{padding-bottom:2em;}'
            + '.kkphim-detail-hero{position:relative;min-height:360px;border-radius:18px;overflow:hidden;margin-bottom:1.2em;background:#111;}'
            + '.kkphim-detail-hero__bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(0px) saturate(1.05);transform:scale(1.05);}'
            + '.kkphim-detail-hero__overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,10,.92) 0%,rgba(10,10,10,.75) 38%,rgba(10,10,10,.45) 100%),linear-gradient(180deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.65) 100%);}'
            + '.kkphim-detail-hero__content{position:relative;z-index:2;display:flex;gap:1.2em;padding:1.2em;align-items:flex-end;min-height:360px;}'
            + '.kkphim-detail-hero__poster{width:180px;flex:0 0 180px;}'
            + '.kkphim-detail-hero__poster img{width:100%;display:block;border-radius:14px;box-shadow:0 12px 28px rgba(0,0,0,.35);}'
            + '.kkphim-detail-hero__info{flex:1;min-width:0;color:#fff;}'
            + '.kkphim-detail-hero__title{font-size:2em;font-weight:700;line-height:1.2;margin-bottom:.15em;}'
            + '.kkphim-detail-hero__original{font-size:1em;color:rgba(255,255,255,.72);margin-bottom:.8em;}'
            + '.kkphim-detail-hero__meta{display:flex;gap:.5em;flex-wrap:wrap;margin-bottom:.8em;}'
            + '.kkphim-detail-hero__meta span{padding:.35em .7em;border-radius:999px;background:rgba(255,255,255,.14);font-size:.88em;}'
            + '.kkphim-detail-hero__extra{font-size:.93em;line-height:1.65;color:rgba(255,255,255,.9);margin-bottom:.8em;}'
            + '.kkphim-detail-hero__desc{max-width:900px;font-size:.95em;line-height:1.6;color:rgba(255,255,255,.82);display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden;}'

            + '.kkphim-episodes{margin-top:1em;padding:.4em 0 0;}'
            + '.kkphim-episodes__title{font-size:1.1em;font-weight:600;color:#fff;margin-bottom:.8em;}'
            + '.kkphim-episodes__list{display:flex;flex-wrap:wrap;gap:.6em;}'
            + '.kkphim-ep{padding:.65em 1em;border-radius:10px;background:rgba(255,255,255,.08);color:#fff;}'
            + '.kkphim-ep.focus{background:#d62828;}'

            + '@media(max-width:768px){'
            + '.kkphim-scroll{padding:.8em .8em 1.5em;}'
            + '.kkphim-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.9em;}'
            + '.kkphim-card{width:auto;flex:unset;}'
            + '.kkphim-detail-hero{min-height:auto;}'
            + '.kkphim-detail-hero__content{min-height:auto;align-items:flex-start;flex-direction:column;padding:1em;}'
            + '.kkphim-detail-hero__poster{width:140px;flex:0 0 140px;}'
            + '.kkphim-detail-hero__title{font-size:1.5em;}'
            + '}';

        document.head.appendChild(style);
    }

    function addMenu() {
        function insert() {
            var menu = $('.menu__list').first();
            if (!menu.length) {
                setTimeout(insert, 500);
                return;
            }

            if ($('[data-action="kkphim"]').length) return;

            var icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm2 2v10h12V7H6zm1 1.5h2v2H7v-2zm0 3h2v2H7v-2zm3-3h7v5h-7v-5z"/></svg>';

            var item = $('<li class="menu__item selector" data-action="kkphim">'
                + '<div class="menu__ico">' + icon + '</div>'
                + '<div class="menu__text">KKPhim</div>'
                + '</li>');

            function open() {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_main',
                    page: 1
                });
            }

            item.on('click', open);
            item.on('hover:enter', open);

            menu.append(item);
            log('Menu added');
        }

        insert();
    }

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

        if (window.appready) addMenu();
        else {
            if (Lampa.Listener && Lampa.Listener.follow) {
                Lampa.Listener.follow('app', function (e) {
                    if (e.type === 'ready') setTimeout(addMenu, 500);
                });
            }
            setTimeout(addMenu, 2500);
        }

        log('Plugin initialized');
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();