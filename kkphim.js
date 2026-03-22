(function () {
    'use strict';

    var SOURCE_NAME = 'kkphim';
    var CAT_NAME    = 'KKPhim';
    var BASE_URL    = 'https://phimapi.com';
    var IMG_URL     = 'https://phimimg.com/';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
             + '<path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
             + '</svg>';

    // =====================================================================
    // TMDB CONFIG
    // =====================================================================
    var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_BASE  = 'https://api.themoviedb.org/3';
    var TMDB_IMG   = 'https://image.tmdb.org/t/p/';

    // Fetch TMDB dung window.fetch (ho tro Authorization header)
    // Tim TMDB bang ten phim + nam (fallback khi khong co tmdb_id)
    function searchTMDB(title, year, kkType, onFound) {
        // kkType da la 'movie' hoac 'tv' (xu ly tu truoc)
        var mediaType = (kkType === 'single') ? 'movie' : (kkType || 'movie');
        var q = encodeURIComponent(title);
        var url = TMDB_BASE + '/search/' + mediaType
                + '?query=' + q + '&language=vi-VN'
                + (year ? '&year=' + year : '');
        $.ajax({
            url: url, type: 'GET',
            headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN },
            success: function (data) {
                var results = (data && data.results) || [];
                if (results.length) onFound(results[0].id, mediaType);
                else onFound(null, mediaType);
            },
            error: function () { onFound(null, mediaType); }
        });
    }

    function fetchTMDBDetail(tmdbId, mediaType, onDone) {
        var url = TMDB_BASE + '/' + mediaType + '/' + tmdbId
                + '?language=vi-VN&append_to_response=credits';
        $.ajax({
            url: url, type: 'GET',
            headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN },
            success: function (t) { onDone(t); },
            error: function () { onDone(null); }
        });
    }

    function applyTMDB(result, t) {
        if (!t) return;
        try {
            if (t.backdrop_path) {
                result.backdrop_path    = t.backdrop_path;
                result.background_image = TMDB_IMG + 'original' + t.backdrop_path;
            }
            if (t.poster_path) result.poster_path = t.poster_path;
            if (t.vote_average) {
                result.vote_average = Math.round(t.vote_average * 10) / 10;
                result.vote_count   = t.vote_count || 0;
            }
            if (t.release_date)   result.release_date   = t.release_date;
            if (t.first_air_date) result.first_air_date = t.first_air_date;
            if (t.runtime) result.runtime = t.runtime;
            if (t.episode_run_time && t.episode_run_time.length) {
                result.runtime = t.episode_run_time[0] || 0;
            }
            var credits = t.credits || {};
            if (credits.cast || credits.crew) {
                result.credits = {
                    cast: (credits.cast || []).slice(0, 15).map(function (a) {
                        return { id: a.id, name: a.name, character: a.character || '', profile_path: a.profile_path || '', order: a.order || 0 };
                    }),
                    crew: (credits.crew || []).filter(function (c) {
                        return c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay';
                    }).slice(0, 5).map(function (c) {
                        return { id: c.id, name: c.name, job: c.job, department: c.department, profile_path: c.profile_path || '' };
                    }),
                };
            }
            if (t.genres && t.genres.length) {
                result.genres = t.genres.map(function (g) {
                    return { id: String(g.id), name: g.name };
                });
            }
            result.tmdb    = String(t.id);
            result.tmdb_id = String(t.id);
        } catch (e) { console.warn('[KKPhim] applyTMDB error:', e); }
    }

    function enrichWithTMDB(result, tmdbId, kkType, searchTitle, searchYear, onDone) {
        // kkType da la 'movie' hoac 'tv' (xu ly tu truoc)
        var mediaType = (kkType === 'single') ? 'movie' : (kkType || 'movie');

        function done(t) {
            applyTMDB(result, t);
            onDone(result);
        }

        if (tmdbId) {
            // Co san tmdb_id -> fetch luon
            fetchTMDBDetail(String(tmdbId), mediaType, done);
        } else if (searchTitle) {
            // Khong co tmdb_id -> search bang ten goc (origin_name)
            searchTMDB(searchTitle, searchYear, kkType, function (foundId, foundType) {
                if (foundId) fetchTMDBDetail(String(foundId), foundType, done);
                else onDone(result);
            });
        } else {
            onDone(result);
        }
    }

    // =====================================================================
    // CSS - An badge TV
    // =====================================================================
    function injectCSS() {
        if (document.getElementById('kkp-style')) return;
        var s = document.createElement('style');
        s.id = 'kkp-style';
        s.textContent = '.card__type{display:none!important}.card-label--type{display:none!important}.card__label--tv{display:none!important}.item__type{display:none!important}.kkp-similar-row::-webkit-scrollbar{display:none}';
        document.head.appendChild(s);
    }

    // =====================================================================
    // HELPERS
    // =====================================================================
    function getPoster(url) {
        if (!url) return '';
        return (url.indexOf('http') === 0) ? url : IMG_URL + url;
    }

    // KKPhim: list API tra ve category[].id = so, category[].slug = "kinh-di"
    //         full API tra ve category[].id = "kinh-di" (la slug luon)
    function toNameArray(arr) {
        if (!arr || !arr.length) return [];
        return arr.map(function (item) {
            if (typeof item === 'string') return { id: item, slug: item, name: item };
            var slug = item.slug || (typeof item.id === 'string' && isNaN(item.id) ? item.id : '');
            return { id: slug || String(item.id || ''), slug: slug, name: item.name || '' };
        });
    }

    function normalizeItem(item) {
        if (!item) return {};
        var poster = getPoster(item.poster_url);
        var thumb  = getPoster(item.thumb_url || item.poster_url);
        return {
            id:                   item.slug || '',
            title:                item.name || '',
            name:                 item.name || '',
            original_title:       item.origin_name || item.name || '',
            original_name:        item.origin_name || item.name || '',
            img:                  poster,
            poster:               poster,
            poster_path:          '',
            backdrop_path:        '',
            background_image:     thumb,
            release_date:         item.year ? (item.year + '-01-01') : '',
            first_air_date:       item.year ? (item.year + '-01-01') : '',
            vote_average:         0,
            overview:             item.content || '',
            genres:               toNameArray(item.category || []),
            countries:            toNameArray(item.country  || []),
            production_companies: [],
            production_countries: [],
            spoken_languages:     [],
            type:                 'movie',
            media_type:           'movie',
            source:               SOURCE_NAME,
            kkphim_slug:          item.slug   || '',
            kkphim_type:          item.type   || '',
            kkphim_cats:          item.category || [],
        };
    }

    // =====================================================================
    // DANH MUC
    // =====================================================================
    var CATEGORIES = [
        { url: '/danh-sach/phim-moi-cap-nhat', title: 'Phim m\u1EDBi c\u1EADp nh\u1EADt' },
        { url: '/v1/api/danh-sach/phim-le',    title: 'Phim l\u1EBB'                      },
        { url: '/v1/api/danh-sach/phim-bo',    title: 'Phim b\u1ED9'                      },
        { url: '/v1/api/danh-sach/hoat-hinh',  title: 'Ho\u1EA1t h\u00ECnh'               },
        { url: '/v1/api/danh-sach/tv-shows',   title: 'TV Shows'                          },
    ];

    function fetchPage(catUrl, page, onOk, onFail) {
        var net = new Lampa.Reguest();
        var sep = (catUrl.indexOf('?') >= 0) ? '&' : '?';
        net.silent(BASE_URL + catUrl + sep + 'page=' + page, function (data) {
            var items = [], totalPages = 1, totalItems = 0;
            try {
                if (data.items) {
                    items      = data.items.map(normalizeItem);
                    totalPages = (data.pagination && data.pagination.totalPages) || 1;
                    totalItems = (data.pagination && data.pagination.totalItems) || items.length;
                } else if (data.data && data.data.items) {
                    items      = data.data.items.map(normalizeItem);
                    var pag    = data.data.params && data.data.params.pagination;
                    totalPages = (pag && pag.totalPages) || 1;
                    totalItems = (pag && pag.totalItems) || items.length;
                }
            } catch (e) { console.warn('[KKPhim] fetchPage:', e); }
            onOk({ items: items, page: page, totalPages: totalPages, totalItems: totalItems });
        }, onFail || function () {});
    }

    // Cache episodes theo slug de khoi fetch lai khi bam nut play
    var _epsCache = {};

    function fetchEpisodes(slug, callback) {
        if (_epsCache[slug]) { callback(_epsCache[slug]); return; }
        var net = new Lampa.Reguest();
        net.silent(BASE_URL + '/phim/' + slug, function (res) {
            _epsCache[slug] = res.episodes || [];
            callback(_epsCache[slug]);
        }, function () { callback([]); });
    }

    // Hien menu chon server -> tap bang Lampa.Select
    function showEpisodeMenu(card, episodes) {
        var title  = card.title || '';
        var poster = card.img   || card.poster || '';

        if (!episodes.length) return;

        // Neu chi co 1 server va 1 tap -> phat luon
        if (episodes.length === 1 && (episodes[0].server_data || []).length === 1) {
            var ep   = episodes[0].server_data[0];
            var link = ep.link_m3u8 || ep.link_embed || '';
            if (link) Lampa.Player.play({ url: link, title: title, poster: poster });
            return;
        }

        // Neu chi co 1 server va nhieu tap -> hien menu tap luon
        if (episodes.length === 1) {
            showEpList(card, episodes[0]);
            return;
        }

        // Nhieu server -> hien menu chon server truoc
        var serverItems = episodes.map(function (srv, si) {
            return { title: srv.server_name || ('Server ' + (si + 1)), index: si };
        });

        Lampa.Select.show({
            title:    'Chọn server',
            items:    serverItems,
            onSelect: function (item) {
                showEpList(card, episodes[item.index]);
            },
        });
    }

    function showEpList(card, server) {
        var title  = card.title || '';
        var poster = card.img   || card.poster || '';
        var data   = server.server_data || [];

        // Neu chi co 1 tap -> phat luon
        if (data.length === 1) {
            var link = data[0].link_m3u8 || data[0].link_embed || '';
            if (link) Lampa.Player.play({ url: link, title: title + ' - ' + (data[0].name || ''), poster: poster });
            return;
        }

        var playlist = data.map(function (ep) {
            return { url: ep.link_m3u8 || ep.link_embed || '', title: title + ' - ' + (ep.name || '') };
        });

        var epItems = data.map(function (ep, idx) {
            return { title: ep.name || ('Tập ' + (idx + 1)), index: idx };
        });

        Lampa.Select.show({
            title:    server.server_name || 'Chọn tập',
            items:    epItems,
            onSelect: function (item) {
                var link = data[item.index].link_m3u8 || data[item.index].link_embed || '';
                if (!link) return;
                Lampa.Player.play({ url: link, title: title + ' - ' + (data[item.index].name || ''), poster: poster });
                Lampa.Player.playlist(playlist, item.index);
            },
        });
    }

    // =====================================================================
    // API SOURCE
    // =====================================================================
    function KKPhimApi() {
        var self     = this;
        self.network = new Lampa.Reguest();

        self.list = function (params, onComplete, onError) {
            var page   = params.page    || 1;
            // Lampa truyen params.cat_url (custom) hoac params.url (native More)
            var catUrl = params.cat_url || params.url || '/danh-sach/phim-moi-cap-nhat';
            fetchPage(catUrl, page, function (res) {
                onComplete({ results: res.items, page: res.page, total_pages: res.totalPages, total_results: res.totalItems });
            }, onError);
        };

        self.category = function (params, onComplete, onError) {
            var parts = CATEGORIES.map(function (cat) {
                return function (cb) {
                    fetchPage(cat.url, 1, function (res) {
                        cb({ title: cat.title, results: res.items, url: cat.url, cat_url: cat.url,
                             page: 1, total_pages: res.totalPages, total_results: res.totalItems, source: SOURCE_NAME });
                    }, function () {
                        cb({ title: cat.title, results: [], url: cat.url, cat_url: cat.url });
                    });
                };
            });
            Lampa.Api.partNext(parts, 2, onComplete, onError);
        };

        self.full = function (params, onComplete, onError) {
            var card = params.card || {};
            var slug = card.kkphim_slug || card.id;
            if (!slug) { if (onError) onError('no slug'); return; }

            self.network.silent(BASE_URL + '/phim/' + slug, function (data) {
                var movie    = data.movie    || {};
                var episodes = data.episodes || [];
                var seasons  = [];
                episodes.forEach(function (server, si) {
                    var eps = (server.server_data || []).map(function (ep, ei) {
                        return {
                            episode_number: ei + 1,
                            season_number:  si + 1,
                            name:           ep.name || ('T\u1EADp ' + (ei + 1)),
                            air_date:       '',
                            link_m3u8:      ep.link_m3u8  || '',
                            link_embed:     ep.link_embed || '',
                        };
                    });
                    seasons.push({ season_number: si + 1, name: server.server_name || ('Server ' + (si + 1)), episodes: eps });
                });

                var result = normalizeItem(movie);
                result.overview          = movie.content || '';
                result.number_of_seasons = seasons.length || 1;
                result.seasons           = seasons;
                result.kkphim_episodes   = episodes;

                // Enrich voi TMDB
                // KKPhim tra ve: movie.tmdb = {type, id} hoac movie.tmdb_id
                var tmdbObj  = movie.tmdb || {};
                var tmdbId   = (typeof tmdbObj === 'object' ? tmdbObj.id : tmdbObj)
                               || movie.tmdb_id || '';
                tmdbId       = tmdbId ? String(tmdbId) : '';
                var kkType   = (typeof tmdbObj === 'object' && tmdbObj.type)
                               ? tmdbObj.type
                               : (movie.type === 'single' ? 'movie' : 'tv');
                var searchTitle = movie.origin_name || movie.name || '';
                var searchYear  = movie.year ? String(movie.year) : '';
                enrichWithTMDB(result, tmdbId, kkType, searchTitle, searchYear, function (enriched) {
                    onComplete({ movie: enriched });
                });
            }, onError);
        };

        self.search = function (params, onComplete, onError) {
            var q = encodeURIComponent(params.query || '');
            self.network.silent(BASE_URL + '/v1/api/tim-kiem?keyword=' + q, function (data) {
                var items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : [];
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
        };

        self.seasons = function (params, onComplete, onError) {
            var card = params.card || {};
            if (card.seasons && card.seasons.length) {
                onComplete({ seasons: card.seasons });
            } else {
                self.full({ card: card }, function (res) {
                    onComplete({ seasons: (res.movie && res.movie.seasons) || [] });
                }, onError);
            }
        };

        self.person = function (p, ok, err) { err('not supported'); };
        self.clear  = function () { self.network.clear(); };
    }

    // =====================================================================
    // COMPONENT: DANH SACH INFINITE SCROLL
    // =====================================================================
    function KKPhimListComponent(object) {
        var catUrl     = object.cat_url || '/danh-sach/phim-moi-cap-nhat';
        var catTitle   = object.title   || 'KKPhim';
        var curPage    = 1;
        var totalPages = 1;
        var loading    = false;

        var $html = $(
            '<div class="kkp-list-wrap" style="min-height:100vh;">' +
            '<div class="kkp-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;padding:1em 1.5em;"></div>' +
            '<div class="kkp-loader" style="text-align:center;padding:1.5em;display:none;"><span style="opacity:.5;font-size:.9em;">\u0110ang t\u1EA3i...</span></div>' +
            '<div class="kkp-end" style="text-align:center;padding:1em;display:none;"><span style="opacity:.4;font-size:.85em;">\u2014 \u0110\u00E3 t\u1EA3i h\u1EBFt phim \u2014</span></div>' +
            '</div>'
        );
        var $grid   = $html.find('.kkp-grid');
        var $loader = $html.find('.kkp-loader');
        var $end    = $html.find('.kkp-end');

        function renderCard(item) {
            var poster = item.img || item.poster || '';
            var year   = item.release_date ? item.release_date.slice(0, 4) : '';
            var $card  = $(
                '<div class="kkp-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                '<div style="position:relative;padding-top:150%;background:#111;">' +
                '<img src="' + poster + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' +
                '</div>' +
                '<div style="padding:6px 8px;">' +
                '<div style="font-size:13px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (item.title || '') + '</div>' +
                '<div style="font-size:11px;opacity:.5;margin-top:2px;">' + year + '</div>' +
                '</div></div>'
            );
            $card.on('hover:enter click', function () {
                Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
            });
            $grid.append($card);
        }

        function loadPage(page) {
            if (loading) return;
            loading = true;
            $loader.show();
            fetchPage(catUrl, page, function (res) {
                totalPages = res.totalPages || 1;
                res.items.forEach(renderCard);
                loading = false;
                $loader.hide();
                if (curPage >= totalPages) $end.show();
            }, function () {
                loading = false;
                $loader.hide();
            });
        }

        function onScroll() {
            var el = $html.parent()[0];
            if (!el) return;
            if ((el.scrollTop + el.clientHeight) >= (el.scrollHeight - 500)) {
                if (!loading && curPage < totalPages) { curPage++; loadPage(curPage); }
            }
        }

        this.start = function () {
            loadPage(1);
            setTimeout(function () {
                var $s = $html.closest('.activity__body, .layer__scroll, .app__content');
                if ($s.length) $s.on('scroll.kkplist', onScroll);
                else $(window).on('scroll.kkplist', onScroll);
            }, 400);
            return $html;
        };
        this.render  = function () { return $html; };
        this.header  = function () { return catTitle; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () {};
        this.destroy = function () {
            $(window).off('scroll.kkplist');
            $('.activity__body,.layer__scroll,.app__content').off('scroll.kkplist');
            $html.remove();
        };
    }

    // =====================================================================
    // INJECT: NUT XEM THEM TREN CATEGORY
    // =====================================================================
    function injectViewMore() {
        Lampa.Listener.follow('activity', function (e) {
            if (e.type !== 'start') return;
            var obj = e.object || {};
            if (obj.source !== SOURCE_NAME || obj.component !== 'category') return;
            setTimeout(function () {
                $('.items__head, .category__title').each(function () {
                    var $head = $(this);
                    if ($head.find('.kkp-more-btn').length) return;
                    var headText = $head.text().replace(/\s*[›>].*/g, '').trim();
                    var cfg = null;
                    CATEGORIES.forEach(function (c) { if (c.title === headText) cfg = c; });
                    if (!cfg) return;
                    var $btn = $('<span class="kkp-more-btn selector" style="font-size:12px;opacity:.65;cursor:pointer;margin-left:10px;padding:2px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;vertical-align:middle;">Xem th\u00EAm \u203A</span>');
                    $btn.on('hover:enter click', function () {
                        Lampa.Activity.push({ title: cfg.title, component: 'kkphim_list', cat_url: cfg.url, source: SOURCE_NAME, page: 1 });
                    });
                    $head.append($btn);
                });
            }, 900);
        });
    }

    // =====================================================================
    // INJECT: NUT TAP PHIM
    // =====================================================================
    // =====================================================================
    // INJECT: PHIM LIEN QUAN (random theo the loai)
    // =====================================================================
    function getGenreSlug(card) {
        // Thu nguon raw truoc (chinh xac hon)
        var cats = card.kkphim_cats || [];
        for (var i = 0; i < cats.length; i++) {
            var cat = cats[i];
            if (typeof cat === 'object') {
                if (cat.slug) return { slug: cat.slug, name: cat.name || cat.slug };
                if (typeof cat.id === 'string' && isNaN(cat.id) && cat.id) return { slug: cat.id, name: cat.name || cat.id };
            }
        }
        // Fallback: genres da normalize
        var genres = card.genres || [];
        if (genres.length) {
            var g = genres[0];
            var s = g.slug || g.id || '';
            if (s && isNaN(s)) return { slug: String(s), name: g.name || String(s) };
        }
        return null;
    }

    // Track slug da inject de tranh trung lap - dung object thay vi bien don
    var _injectedMap = {};

    function injectSimilarMovies(card, $ctx) {
        if (!card || card.source !== SOURCE_NAME) return;
        var genreInfo = getGenreSlug(card);
        if (!genreInfo) return;

        var genreSlug = genreInfo.slug;
        var cardSlug  = card.kkphim_slug || card.id;

        // Da inject cho slug nay roi -> bo qua
        if (_injectedMap[cardSlug]) return;
        _injectedMap[cardSlug] = true;

        setTimeout(function () {
            // Neu container khong con (user da back) -> huy
            if (!$ctx.closest('body').length) return;
            // Neu da co wrap trong container nay roi -> bo qua
            if ($ctx.find('.kkp-similar-wrap').length) return;

            var net1 = new Lampa.Reguest();
            net1.silent(BASE_URL + '/v1/api/the-loai/' + genreSlug + '?page=1', function (firstData) {
                var totalPages = 1;
                try {
                    var pag = firstData.data && firstData.data.params && firstData.data.params.pagination;
                    totalPages = (pag && pag.totalPages) || 1;
                } catch (e) {}

                var randomPage = Math.floor(Math.random() * totalPages) + 1;
                var net2 = new Lampa.Reguest();
                net2.silent(BASE_URL + '/v1/api/the-loai/' + genreSlug + '?page=' + randomPage, function (data) {
                    // Kiem tra container con ton tai
                    if (!$ctx.closest('body').length) return;

                    var items = [];
                    try {
                        items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : [];
                    } catch (e) { return; }

                    items = items.filter(function (i) { return i.id !== cardSlug; });
                    items = items.sort(function () { return Math.random() - 0.5; }).slice(0, 20);
                    if (!items.length) return;

                    var $wrap = $(
                        '<div class="kkp-similar-wrap" data-slug="' + cardSlug + '" style="padding:.5em 0 1.4em;">' +
                        '<div style="padding:0 1.5em .7em;">' +
                        '<span style="font-size:1em;font-weight:700;">Phim li\u00EAn quan</span>' +
                        '</div>' +
                        '<div class="kkp-similar-row" style="display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;"></div>' +
                        '</div>'
                    );

                    var $row = $wrap.find('.kkp-similar-row');
                    items.forEach(function (item) {
                        var poster = item.img || item.poster || '';
                        var year   = item.release_date ? item.release_date.slice(0, 4) : '';
                        var $c = $(
                            '<div class="kkp-sim-card selector" style="flex:0 0 110px;width:110px;flex-shrink:0;cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                            '<div style="position:relative;padding-top:150%;background:#111;">' +
                            '<img src="' + poster + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' +
                            '</div>' +
                            '<div style="padding:5px 6px;">' +
                            '<div style="font-size:11px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (item.title || '') + '</div>' +
                            '<div style="font-size:10px;opacity:.45;margin-top:2px;">' + year + '</div>' +
                            '</div></div>'
                        );
                        $c.on('hover:enter click', (function (it) {
                            return function () {
                                Lampa.Activity.push({ component: 'full', id: it.id, source: SOURCE_NAME, card: it });
                            };
                        })(item));
                        $row.append($c);
                    });

                    // Inject vao dung container hien tai
                    setTimeout(function () {
                        if (!$ctx.closest('body').length) return;
                        var $after = $ctx.find('.full-descr');
                        if ($after.length) $after.after($wrap);
                        else $ctx.find('.full-start').append($wrap);
                    }, 200);
                });
            });
        }, 700);
    }

    // =====================================================================
    // KHOI DONG
    // =====================================================================
    function startPlugin() {
        if (window.kkphim_started) return;
        window.kkphim_started = true;

        injectCSS();
        Lampa.Api.sources[SOURCE_NAME] = new KKPhimApi();
        Lampa.Component.add('kkphim_list', KKPhimListComponent);

        Lampa.Listener.follow('full', function (e) {
            var obj  = e.object || {};
            var card = (e.data && e.data.movie)
                       ? e.data.movie
                       : (obj.card || (obj.activity && obj.activity.card));
            if (!card || card.source !== SOURCE_NAME) return;

            var slug = card.kkphim_slug || card.id;

            if (e.type === 'destroy') {
                delete _injectedMap[slug];
                delete _epsCache[slug];
                return;
            }

            if (e.type !== 'complite') return;

            // Pre-fetch episodes
            fetchEpisodes(slug, function () {});

            // Inject nut KKPhim vao hang button (sau nut Torrent)
            // Giong cach online_mod lam: e.object.activity.render().find('.view--torrent').after(btn)
            var $render = obj.activity ? obj.activity.render() : (obj.render ? obj.render() : null);
            if ($render && !$render.find('.view--kkphim').length) {
                var $btn = $(
                    '<div class="full-start__button selector view--kkphim" data-subtitle="KKPhim">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                    '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
                    '<path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/>' +
                    '</svg>' +
                    '<span>KKPhim</span>' +
                    '</div>'
                );
                $btn.on('hover:enter', function () {
                    fetchEpisodes(slug, function (episodes) {
                        if (!episodes || !episodes.length) {
                            Lampa.Noty.show('Không có link phim');
                            return;
                        }
                        showEpisodeMenu(card, episodes);
                    });
                });
                var $torrent = $render.find('.view--torrent');
                if ($torrent.length) $torrent.after($btn);
                else $render.find('.full-start__buttons').append($btn);
            }

            // Inject phim lien quan
            var $ctx = $render || $('body');
            injectSimilarMovies(card, $ctx);
        });

        // Dang ky nguon KKPhim vao menu Source cua Lampa
        // Lampa fire event 'stream' khi user bam nut Play va chon nguon
        Lampa.Listener.follow('stream', function (e) {
            // e.object.card: thong tin phim dang xem
            var card = e.object && e.object.card;
            if (!card) return;

            // Chi xu ly phim tu nguon KKPhim
            var slug = card.kkphim_slug || card.id;
            if (!slug) return;

            // Them vao danh sach source
            e.results.push({
                title:   'KKPhim',
                search:  card,
                callback: function () {
                    fetchEpisodes(slug, function (episodes) {
                        if (!episodes || !episodes.length) {
                            Lampa.Noty.show('Không tìm thấy link phim');
                            return;
                        }
                        showEpisodeMenu(card, episodes);
                    });
                },
            });
        });

        injectViewMore();

        var $item = $(
            '<li data-action="' + SOURCE_NAME + '" class="menu__item selector">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">' + CAT_NAME + '</div></li>'
        );
        $item.on('hover:enter', function () {
            Lampa.Activity.push({ title: CAT_NAME, component: 'category', source: SOURCE_NAME, page: 1 });
        });
        $('.menu .menu__list').eq(0).append($item);
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();
