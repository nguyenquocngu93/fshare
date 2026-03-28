(function () {
    'use strict';

    if (!window.Lampa) return;

    var plugin_name = 'KKPhim';
    var API = 'https://phimapi.com';
    var IMG = 'https://phimimg.com/';
    var request = new Lampa.Reguest();

    function log() {
        console.log.apply(console, ['[KKPhim]'].concat([].slice.call(arguments)));
    }

    function stripHtml(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    }

    function fullImg(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        return IMG + url;
    }

    function mapItem(item) {
        return {
            id: item.slug || item._id || item.id,
            kp_slug: item.slug || item._id || item.id,
            title: item.name || item.title || 'Không tên',
            original_title: item.origin_name || item.original_title || '',
            poster_path: fullImg(item.poster_url || item.thumb_url || ''),
            backdrop_path: fullImg(item.thumb_url || item.poster_url || ''),
            img: fullImg(item.thumb_url || item.poster_url || ''),
            background: fullImg(item.poster_url || item.thumb_url || ''),
            release_date: item.year ? String(item.year) : '',
            first_air_date: item.year ? String(item.year) : '',
            vote_average: 8,
            overview: stripHtml(item.content || ''),
            type: (item.type === 'series' || item.type === 'tvshows') ? 'tv' : 'movie',
            source: 'kkphim'
        };
    }

    function mapCategoryList(data) {
        var items = [];
        if (data && data.data && data.data.items) items = data.data.items;
        else if (data && data.items) items = data.items;
        return items.map(mapItem);
    }

    function buildGenres(category) {
        if (!category || !category.length) return [];
        return category.map(function (g, i) {
            return {
                id: g.id || i + 1,
                name: g.name || ''
            };
        });
    }

    function buildCountries(country) {
        if (!country || !country.length) return [];
        return country.map(function (c) {
            return { name: c.name || '' };
        });
    }

    function normalizeDetail(json) {
        var m = json.movie || {};
        var mapped = mapItem(m);

        mapped.id = m.slug || mapped.id;
        mapped.kp_slug = m.slug || mapped.kp_slug;
        mapped.title = m.name || mapped.title;
        mapped.original_title = m.origin_name || mapped.original_title;
        mapped.overview = stripHtml(m.content || '');
        mapped.genres = buildGenres(m.category);
        mapped.production_companies = buildCountries(m.country);
        mapped.status = m.episode_current || '';
        mapped.poster_path = fullImg(m.poster_url || m.thumb_url || '');
        mapped.backdrop_path = fullImg(m.thumb_url || m.poster_url || '');
        mapped.img = fullImg(m.thumb_url || m.poster_url || '');
        mapped.background = fullImg(m.poster_url || m.thumb_url || '');
        mapped.release_date = m.year ? String(m.year) : '';
        mapped.year = m.year || '';
        mapped.vote_average = 8;
        mapped.type = (m.type === 'series' || m.type === 'tvshows') ? 'tv' : 'movie';
        mapped.source = 'kkphim';
        mapped.kkphim_episodes = json.episodes || [];

        return mapped;
    }

    function extractEpisodes(episodes) {
        var result = [];

        (episodes || []).forEach(function (server) {
            var server_name = server.server_name || 'Server';
            (server.server_data || []).forEach(function (ep, index) {
                result.push({
                    server: server_name,
                    name: ep.name || String(index + 1),
                    slug: ep.slug || ('tap-' + (index + 1)),
                    link_embed: ep.link_embed || '',
                    link_m3u8: ep.link_m3u8 || '',
                    url: ep.link_m3u8 || ep.link_embed || ''
                });
            });
        });

        return result;
    }

    function playEpisode(movie, allEpisodes, episode) {
        if (!episode || !episode.url) {
            Lampa.Noty.show('Không có link phát');
            return;
        }

        var playlist = allEpisodes.map(function (ep) {
            return {
                title: movie.title + ' - ' + ep.server + ' - Tập ' + ep.name,
                url: ep.url
            };
        });

        Lampa.Player.play({
            title: movie.title + ' - Tập ' + episode.name,
            url: episode.url,
            movie: movie
        });

        if (Lampa.Player.playlist) Lampa.Player.playlist(playlist);
    }

    function showEpisodes(movie) {
        var episodes = extractEpisodes(movie.kkphim_episodes);

        if (!episodes.length) {
            Lampa.Noty.show('Chưa có tập phim');
            return;
        }

        if (episodes.length === 1) {
            playEpisode(movie, episodes, episodes[0]);
            return;
        }

        var items = episodes.map(function (ep) {
            return {
                title: ep.server + ' - Tập ' + ep.name,
                episode: ep
            };
        });

        Lampa.Select.show({
            title: 'Danh sách tập',
            items: items,
            onSelect: function (a) {
                playEpisode(movie, episodes, a.episode);
            },
            onBack: function () {
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    function injectPlayButton(e) {
        try {
            if (!e || !e.data || !e.data.movie || e.data.movie.source !== 'kkphim') return;

            var root = e.object && e.object.activity ? e.object.activity.render() : null;
            if (!root || !root.length) return;
            if (root.find('.kkphim-play-button').length) return;

            var buttons = root.find('.full-start__buttons');
            if (!buttons.length) return;

            var play = $(
                '<div class="full-start__button selector button--play kkphim-play-button">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
                        '<path d="M8 5v14l11-7z"></path>' +
                    '</svg>' +
                    '<span>Phát phim</span>' +
                '</div>'
            );

            var episodes = $(
                '<div class="full-start__button selector kkphim-episode-button">' +
                    '<span>Tập phim</span>' +
                '</div>'
            );

            play.on('hover:enter', function () {
                var eps = extractEpisodes(e.data.movie.kkphim_episodes);
                if (!eps.length) return Lampa.Noty.show('Chưa có tập phim');
                playEpisode(e.data.movie, eps, eps[0]);
            });

            episodes.on('hover:enter', function () {
                showEpisodes(e.data.movie);
            });

            buttons.prepend(episodes);
            buttons.prepend(play);
        } catch (err) {
            log('inject button error', err);
        }
    }

    if (!Lampa.Api.sources) Lampa.Api.sources = {};

    Lampa.Api.sources.kkphim = {
        title: 'KKPhim',

        search: function (params, oncomplite, onerror) {
            var page = params.page || 1;
            var query = encodeURIComponent(params.query || '');
            var url = API + '/v1/api/tim-kiem?keyword=' + query + '&page=' + page;

            request.timeout(15000);
            request.silent(url, function (json) {
                oncomplite({
                    results: mapCategoryList(json),
                    total_pages: (json.data && json.data.params && json.data.params.pagination && json.data.params.pagination.totalPages) || 1,
                    page: page
                });
            }, function (a, c) {
                if (onerror) onerror(a, c);
            }, false, {
                dataType: 'json'
            });
        },

        full: function (params, oncomplite, onerror) {
            var slug = params.id || params.kp_slug;
            var url = API + '/phim/' + slug;

            request.timeout(15000);
            request.silent(url, function (json) {
                var movie = normalizeDetail(json);

                oncomplite({
                    movie: movie,
                    persons: { results: [] },
                    similar: { results: [] },
                    collection: { results: [] }
                });
            }, function (a, c) {
                if (onerror) onerror(a, c);
            }, false, {
                dataType: 'json'
            });
        },

        list: function (params, oncomplite, onerror) {
            var page = params.page || 1;
            var path = params.url || '/danh-sach/phim-moi-cap-nhat';
            var join = path.indexOf('?') >= 0 ? '&' : '?';
            var url = API + path + join + 'page=' + page;

            request.timeout(15000);
            request.silent(url, function (json) {
                var total_pages = 1;

                if (json.data && json.data.params && json.data.params.pagination) {
                    total_pages = json.data.params.pagination.totalPages || 1;
                } else if (json.pagination) {
                    total_pages = json.pagination.totalPages || 1;
                }

                oncomplite({
                    results: mapCategoryList(json),
                    total_pages: total_pages,
                    page: page
                });
            }, function (a, c) {
                if (onerror) onerror(a, c);
            }, false, {
                dataType: 'json'
            });
        }
    };

    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite' || e.type === 'build') {
            injectPlayButton(e);
        }
    });

    function KKPhimMain() {
        var html = $('<div class="kkphim-main"></div>');
        var scroll = new Lampa.Scroll({ over: true, mask: true });
        var lines = [];
        var self = this;

        this.create = function () {
            var component = this;
            component.activity.loader(true);

            var catalogs = [
                { title: 'Mới cập nhật', url: '/danh-sach/phim-moi-cap-nhat' },
                { title: 'Phim lẻ', url: '/v1/api/danh-sach/phim-le' },
                { title: 'Phim bộ', url: '/v1/api/danh-sach/phim-bo' },
                { title: 'Hoạt hình', url: '/v1/api/danh-sach/hoat-hinh' },
                { title: 'TV Shows', url: '/v1/api/danh-sach/tv-shows' }
            ];

            var loaded = 0;

            catalogs.forEach(function (cat) {
                var url = API + cat.url + '?page=1';

                request.timeout(15000);
                request.silent(url, function (json) {
                    var items = mapCategoryList(json);

                    if (items.length) {
                        var line = new Lampa.Line(items, {
                            title: cat.title,
                            object: {
                                source: 'kkphim'
                            },
                            nomore: false
                        });

                        line.onEnter = function (item) {
                            Lampa.Activity.push({
                                component: 'full',
                                title: item.title,
                                id: item.id,
                                source: 'kkphim'
                            });
                        };

                        line.onMore = function () {
                            Lampa.Activity.push({
                                component: 'category_full',
                                title: cat.title,
                                source: 'kkphim',
                                page: 1,
                                url: cat.url
                            });
                        };

                        line.create();
                        lines.push(line);
                        scroll.append(line.render());
                    }

                    loaded++;

                    if (loaded >= catalogs.length) {
                        component.activity.loader(false);
                        html.append(scroll.render());
                        component.activity.render().append(html);
                        component.start();
                    }
                }, function () {
                    loaded++;
                    if (loaded >= catalogs.length) {
                        component.activity.loader(false);
                        html.append(scroll.render());
                        component.activity.render().append(html);
                        component.start();
                    }
                }, false, {
                    dataType: 'json'
                });
            });
        };

        this.start = function () {
            Lampa.Controller.add('kkphim_main', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(scroll.render().find('.selector').eq(0), scroll.render());
                },
                up: function () {
                    navigate('up');
                },
                down: function () {
                    navigate('down');
                },
                left: function () {
                    navigate('left');
                },
                right: function () {
                    navigate('right');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('kkphim_main');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return html;
        };
        this.destroy = function () {
            lines.forEach(function (line) {
                if (line.destroy) line.destroy();
            });
            lines = [];
            scroll.destroy();
            html.remove();
        };
    }

    function KKPhimCategoryFull(object) {
        var html = $('<div class="kkphim-category-full"></div>');
        var body = $('<div class="category-full__body"></div>');
        var list = $('<div class="category-full__list"></div>');
        var scroll = new Lampa.Scroll({ over: true, mask: true });

        var page = 1;
        var loading = false;
        var total_pages = 1;
        var ended = false;
        var items = [];
        var source_url = object.url || '/danh-sach/phim-moi-cap-nhat';
        var title = object.title || 'Danh mục';

        this.create = function () {
            this.activity.loader(true);
            this.activity.toggleBackground(true);
            this.activity.title(title);
            body.append(list);
            scroll.append(body);
            html.append(scroll.render());
            this.activity.render().append(html);

            bindScroll.call(this);
            loadPage.call(this, page);
        };

        function createCard(item) {
            var card = $('<div class="poster selector"></div>');
            var img = $('<div class="poster__img"></div>');
            var image = $('<img class="poster__image" />');
            var name = $('<div class="poster__title">' + item.title + '</div>');

            image.attr('src', item.img || item.poster_path || '');
            img.append(image);
            card.append(img);
            card.append(name);

            card.on('hover:focus', function () {
                if (item.background) Lampa.Background.change(item.background);
            });

            card.on('hover:enter', function () {
                Lampa.Activity.push({
                    component: 'full',
                    title: item.title,
                    id: item.id,
                    source: 'kkphim'
                });
            });

            return card;
        }

        function appendItems(results) {
            results.forEach(function (item) {
                items.push(item);
                list.append(createCard(item));
            });
        }

        function loadPage(num) {
            var _this = this;
            if (loading || ended) return;
            loading = true;

            Lampa.Api.sources.kkphim.list({
                page: num,
                url: source_url
            }, function (resp) {
                total_pages = resp.total_pages || 1;
                appendItems(resp.results || []);
                page = num;
                loading = false;
                _this.activity.loader(false);

                if (page >= total_pages) ended = true;

                _this.start();
            }, function () {
                loading = false;
                _this.activity.loader(false);
                Lampa.Noty.show('Không tải được dữ liệu');
            });
        }

        function bindScroll() {
            var _this = this;

            scroll.render().on('scroll', function () {
                var el = scroll.render()[0];
                if (!el) return;

                if ((el.scrollTop + el.clientHeight) >= (el.scrollHeight - 300)) {
                    if (!loading && !ended) {
                        loadPage.call(_this, page + 1);
                    }
                }
            });
        }

        this.start = function () {
            Lampa.Controller.add('kkphim_category_full', {
                toggle: function () {
                    Lampa.Controller.collectionSet(html);
                    Lampa.Controller.collectionFocus(html.find('.selector').eq(0), html);
                },
                up: function () {
                    navigate('up');
                },
                down: function () {
                    navigate('down');
                },
                left: function () {
                    navigate('left');
                },
                right: function () {
                    navigate('right');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('kkphim_category_full');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return html;
        };
        this.destroy = function () {
            html.remove();
            scroll.destroy();
        };
    }

    Lampa.Component.add('kkphim_main', KKPhimMain);
    Lampa.Component.add('category_full', KKPhimCategoryFull);

    function addMenuButton() {
        var menu = $('.menu .menu__list').eq(0);
        if (!menu.length) return;
        if (menu.find('[data-action="kkphim"]').length) return;

        var button = $(
            '<li class="menu__item selector" data-action="kkphim">' +
                '<div class="menu__ico">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
                        '<path d="M4 6h16v12H4z"></path>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu__text">KKPhim</div>' +
            '</li>'
        );

        button.on('hover:enter', function () {
            Lampa.Activity.push({
                component: 'kkphim_main',
                title: 'KKPhim'
            });
        });

        menu.append(button);
    }

    function addStyles() {
        Lampa.Template.add('kkphim_style', `
            <style>
                .kkphim-category-full .category-full__list{
                    display:grid;
                    grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
                    gap:1.5em;
                    padding:1.5em;
                }
                .kkphim-category-full .poster{
                    display:flex;
                    flex-direction:column;
                }
                .kkphim-category-full .poster__img{
                    width:100%;
                    aspect-ratio:2/3;
                    background:rgba(255,255,255,0.08);
                    border-radius:1em;
                    overflow:hidden;
                }
                .kkphim-category-full .poster__image{
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    display:block;
                }
                .kkphim-category-full .poster__title{
                    margin-top:.7em;
                    font-size:1.1em;
                    line-height:1.35;
                }
                .kkphim-episode-button{
                    padding: 0 1.4em;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border-radius:0.8em;
                    background:rgba(255,255,255,0.12);
                    margin-right:0.8em;
                    height:3.2em;
                }
            </style>
        `);
        $('body').append(Lampa.Template.get('kkphim_style', {}, true));
    }

    function startPlugin() {
        addStyles();
        addMenuButton();
        log('plugin started');
    }

    if (Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    } else {
        startPlugin();
    }
})();