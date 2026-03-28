(function () {
    'use strict';

    var PLUGIN_ID = 'kkphim';
    var PLUGIN_NAME = 'KKPhim';
    var API = 'https://phimapi.com';
    var IMG = 'https://phimimg.com';

    function log() {
        console.log.apply(console, ['[' + PLUGIN_NAME + ']'].concat([].slice.call(arguments)));
    }

    function request(url, ok, fail) {
        network.silent(url, function (resp) {
            try {
                var json = typeof resp === 'string' ? JSON.parse(resp) : resp;
                ok && ok(json || {});
            } catch (e) {
                log('JSON parse error:', e, url);
                fail && fail(e);
            }
        }, function (a, c) {
            log('Request error:', url, a, c);
            fail && fail(c || a);
        }, false, {
            dataType: 'json'
        });
    }

    function img(url) {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (url.indexOf('//') === 0) return 'https:' + url;
        if (url[0] === '/') return IMG + url;
        return IMG + '/' + url;
    }

    function stripHtml(text) {
        if (!text) return '';
        return String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }

    function arrNames(arr) {
        if (!Array.isArray(arr)) return [];
        return arr.map(function (x) {
            return typeof x === 'string' ? x : (x && x.name ? x.name : '');
        }).filter(Boolean);
    }

    function guessType(item) {
        var t = String(item.type || item.movie_type || '').toLowerCase();
        if (t === 'series' || t === 'tvshows' || t === 'hoathinh' || t === 'tv') return 'tv';
        return 'movie';
    }

    function cardInfo(data) {
        var parts = [];

        if (data.year) parts.push(String(data.year));
        if (data.quality) parts.push(data.quality);
        if (data.language) parts.push(data.language);

        return parts.filter(Boolean).join(' • ');
    }

    function mapListItem(item) {
        var poster = img(item.poster_url || item.thumb_url || '');
        var backdrop = img(item.thumb_url || item.poster_url || '');

        var mapped = {
            source: PLUGIN_ID,
            id: item.slug || item._id || item.id || '',
            slug: item.slug || '',
            title: item.name || '',
            original_title: item.origin_name || '',
            poster_path: poster,
            backdrop_path: backdrop,
            background_image: backdrop,
            overview: stripHtml(item.content || ''),
            year: item.year || '',
            quality: item.quality || '',
            language: item.lang || '',
            type: guessType(item)
        };

        mapped.card_info = cardInfo(mapped);
        return mapped;
    }

    function mapFull(json) {
        var movie = json.movie || {};
        var episodes = json.episodes || [];

        var poster = img(movie.poster_url || movie.thumb_url || '');
        var backdrop = img(movie.thumb_url || movie.poster_url || '');

        var mapped = {
            source: PLUGIN_ID,
            id: movie.slug || movie._id || movie.id || '',
            slug: movie.slug || '',
            title: movie.name || '',
            original_title: movie.origin_name || '',
            poster_path: poster,
            backdrop_path: backdrop,
            background_image: backdrop,
            overview: stripHtml(movie.content || ''),
            year: movie.year || '',
            quality: movie.quality || '',
            language: movie.lang || '',
            type: guessType(movie),
            genres: arrNames(movie.category),
            countries: arrNames(movie.country),
            actors: arrNames(movie.actor).map(function (name) { return { name: name }; }),
            directors: arrNames(movie.director).map(function (name) { return { name: name }; }),
            runtime: movie.time || '',
            time: movie.time || '',
            episode_current: movie.episode_current || '',
            episode_total: movie.episode_total || '',
            episodes: episodes
        };

        mapped.card_info = [
            mapped.year,
            mapped.runtime,
            mapped.quality,
            mapped.language
        ].filter(Boolean).join(' • ');

        return mapped;
    }

    function parsePaging(json, page) {
        return {
            page: page || 1,
            total_pages: (json.pagination && json.pagination.totalPages) || 1
        };
    }

    function mapResult(json, page) {
        var items = (json.items || []).map(mapListItem);
        var pg = parsePaging(json, page);

        return {
            results: items,
            page: pg.page,
            total_pages: pg.total_pages
        };
    }

    var Catalogs = [
        {
            title: 'Mới cập nhật',
            url: '/danh-sach/phim-moi-cap-nhat'
        },
        {
            title: 'Phim lẻ',
            url: '/v1/api/danh-sach/phim-le'
        },
        {
            title: 'Phim bộ',
            url: '/v1/api/danh-sach/phim-bo'
        },
        {
            title: 'Hoạt hình',
            url: '/v1/api/danh-sach/hoat-hinh'
        },
        {
            title: 'TV Shows',
            url: '/v1/api/danh-sach/tv-shows'
        }
    ];

    function buildUrl(base, page) {
        return API + base + (base.indexOf('?') > -1 ? '&' : '?') + 'page=' + (page || 1);
    }

    var KKSource = {
        menu: function (params, onComplite, onError) {
            try {
                onComplite(Catalogs.map(function (item) {
                    return {
                        title: item.title,
                        url: item.url
                    };
                }));
            } catch (e) {
                onError && onError(e);
            }
        },

        main: function (params, onComplite, onError) {
            var page = params.page || 1;
            request(buildUrl('/danh-sach/phim-moi-cap-nhat', page), function (json) {
                onComplite(mapResult(json, page));
            }, onError);
        },

        category: function (params, onComplite, onError) {
            var page = params.page || 1;
            var url = params.url || '/danh-sach/phim-moi-cap-nhat';

            request(buildUrl(url, page), function (json) {
                onComplite(mapResult(json, page));
            }, onError);
        },

        search: function (params, onComplite, onError) {
            var page = params.page || 1;
            var query = encodeURIComponent(params.query || '');

            request(API + '/v1/api/tim-kiem?keyword=' + query + '&page=' + page, function (json) {
                var items = (json.items || json.data || []).map(mapListItem);

                onComplite({
                    results: items,
                    page: page,
                    total_pages: (json.pagination && json.pagination.totalPages) || 1
                });
            }, onError);
        },

        full: function (params, onComplite, onError) {
            var card = params.card || {};
            var slug = card.slug || card.id;

            if (!slug) {
                onError && onError('No slug');
                return;
            }

            request(API + '/phim/' + slug, function (json) {
                onComplite(mapFull(json));
            }, onError);
        },

        stream: function (params, onComplite, onError) {
            try {
                var card = params.card || {};
                var episodes = card.episodes || [];
                var links = [];

                episodes.forEach(function (server) {
                    var serverName = server.server_name || 'Server';
                    (server.server_data || []).forEach(function (ep) {
                        if (ep.link_m3u8) {
                            links.push({
                                title: serverName + ' - Tập ' + (ep.name || ''),
                                url: ep.link_m3u8,
                                method: 'play'
                            });
                        } else if (ep.link_embed) {
                            links.push({
                                title: serverName + ' - Tập ' + (ep.name || ''),
                                url: ep.link_embed,
                                method: 'play'
                            });
                        }
                    });
                });

                onComplite(links);
            } catch (e) {
                onError && onError(e);
            }
        }
    };

    function injectStyles() {
        if (document.getElementById('kkphim-style')) return;

        var css = `
        .card--collection .card__view,
        .card .card__view{
            background-size: cover !important;
            background-position: center center !important;
            border-radius: 14px !important;
        }

        .card .card__title{
            font-weight: 600 !important;
        }

        .card .card__text,
        .card .card__info{
            opacity: .88;
            font-size: 1.05em;
        }

        .full-start-new__background,
        .full-start__background{
            background-size: cover !important;
            background-position: center center !important;
            filter: saturate(1.05);
        }
        `;

        var style = document.createElement('style');
        style.id = 'kkphim-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function registerPlugin() {
        injectStyles();

        if (window.Lampa && Lampa.Api && Lampa.Api.sources) {
            Lampa.Api.sources[PLUGIN_ID] = KKSource;
            log('Source registered');
        }

        if (window.Lampa && Lampa.Params && Lampa.Params.select) {
            Lampa.Params.select('source', {
                name: PLUGIN_ID,
                title: PLUGIN_NAME
            });
            log('Source selector added');
        }

        log('Plugin loaded');
    }

    if (window.appready) {
        registerPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') registerPlugin();
        });
    }
})();