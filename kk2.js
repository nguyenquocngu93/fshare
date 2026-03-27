(function () {
    'use strict';

    if (window.plugin_kkphim_ready) return;
    window.plugin_kkphim_ready = true;

    Lampa.Platform.tv();

    // ===== CONFIG =====
    var SOURCE_NAME = 'KKPHIM';
    var API = 'https://phimapi.com';
    var CACHE_TIME = 1000 * 60 * 60 * 3;
    var cache = {};
    var TMDB_KEY = Lampa.TMDB.key();

    var ICON = '<svg width="36" height="36" viewBox="0 0 24 24"><path fill="white" d="M12 2C6 2 2 6 2 12s4 10 10 10 10-4 10-10S18 2 12 2zm-2 14V8l6 4-6 4z"/></svg>';

    // ===== FIX ẢNH =====
    var originalImg = Lampa.Api.img;
    Lampa.Api.img = function (path, size, source) {
        if (source === SOURCE_NAME) {
            if (!path) return '';
            if (path.startsWith('http')) return path;
            return 'https://phimimg.com/' + path;
        }
        return originalImg.call(this, path, size, source);
    };

    // ===== CACHE =====
    function getCache(key) {
        var c = cache[key];
        if (c && Date.now() - c.time < CACHE_TIME) return c.data;
        return null;
    }

    function setCache(key, data) {
        cache[key] = { time: Date.now(), data: data };
    }

    // ===== NORMALIZE =====
    function normalize(json) {
        var items = json.items || json.data?.items || [];

        return {
            results: items.map(function (i) {
                return {
                    id: i._id || i.slug,
                    title: i.name,
                    name: i.name,
                    poster_path: i.poster_url || i.thumb_url,
                    backdrop_path: i.poster_url || i.thumb_url,
                    img: i.poster_url || i.thumb_url,
                    overview: i.content || '',
                    release_date: i.year || '',
                    vote_average: i.vote_average || 0,
                    type: i.type === 'single' ? 'movie' : 'tv',
                    source: SOURCE_NAME,
                    slug: i.slug,
                    episode_current: i.episode_current
                };
            }),
            page: json.pagination?.currentPage || 1,
            total_pages: Math.ceil((json.pagination?.totalItems || 1) / 10)
        };
    }

    // ===== TMDB MATCH =====
    function findMatch(list, title, year) {
        return list.find(function (r) {
            var n = (r.title || r.name || '').toLowerCase();
            var y = (r.release_date || r.first_air_date || '').slice(0, 4);
            return n === title.toLowerCase() && (!year || y == year);
        }) || list[0];
    }

    // ===== API =====
    function KK() {
        var net = new Lampa.Reguest();

        this.get = function (url, ok, err) {
            var c = getCache(url);
            if (c) return ok(c);

            net.silent(url, function (json) {
                var n = normalize(json);
                setCache(url, n);
                ok(n);
            }, err);
        };

        this.category = function (p, ok, err) {

            var categories = [
                { title: 'Phim mới', url: API + '/danh-sach/phim-moi-cap-nhat?page=1' },
                { title: 'Phim lẻ', url: API + '/v1/api/danh-sach/phim-le?page=1' },
                { title: 'Phim bộ', url: API + '/v1/api/danh-sach/phim-bo?page=1' },
                { title: 'Hoạt hình', url: API + '/v1/api/danh-sach/hoat-hinh?page=1' }
            ];

            var parts = categories.map(cat => next => {
                this.get(cat.url, function (json) {
                    next({
                        title: cat.title,
                        results: json.results,
                        url: cat.url,
                        source: SOURCE_NAME,
                        more: json.page < json.total_pages,
                        page: json.page
                    });
                });
            });

            Lampa.Api.partNext(parts, 5, ok, err);
        };

        this.list = function (p, ok, err) {
            var url = p.url.replace(/page=\d+/, 'page=' + p.page);
            if (!/page=/.test(url)) url += (url.includes('?') ? '&' : '?') + 'page=' + p.page;
            this.get(url, ok, err);
        };

        this.full = function (p, ok) {
            var card = p.card;
            var title = card.title;
            var year = (card.release_date || '').slice(0, 4);

            var search = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}`;

            new Lampa.Reguest().silent(search, function (r) {
                if (!r.results || !r.results.length) return ok(card);

                var m = findMatch(r.results, title, year);
                var type = m.media_type || (m.first_air_date ? 'tv' : 'movie');

                var url = `https://api.themoviedb.org/3/${type}/${m.id}?api_key=${TMDB_KEY}&append_to_response=credits,videos`;

                new Lampa.Reguest().silent(url, ok, () => ok(card));
            }, () => ok(card));
        };

        this.seasons = Lampa.Api.sources.tmdb.seasons;
        this.person = Lampa.Api.sources.tmdb.person;

        this.clear = function () {
            net.clear();
            cache = {};
        };
    }

    function start() {

        Lampa.Api.sources[SOURCE_NAME] = new KK();

        // label tập
        Lampa.Listener.follow('card', function (e) {
            if (e.type === 'build' && e.object.data.source === SOURCE_NAME) {
                if (e.object.data.episode_current) {
                    $(e.object.card).find('.card__view')
                        .append('<div class="card__type">' + e.object.data.episode_current + '</div>');
                }
            }
        });

        // ===== MENU (GIỮ NGUYÊN STYLE ANIME.JS) =====
        var button = $(
            '<li class="menu__item selector" data-action="kkphim">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">kkphim</div>' +
            '</li>'
        );

        button.on('hover:enter', function () {
            Lampa.Activity.push({
                title: 'KKPhim',
                component: 'category',
                source: SOURCE_NAME,
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(button);
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', e => e.type === 'ready' && start());

})();