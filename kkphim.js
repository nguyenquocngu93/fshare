(function () {
    'use strict';

    var SOURCE_NAME = 'kkphim';
    var CAT_NAME    = 'KKPhim';
    var BASE_URL    = 'https://phimapi.com';
    var IMG_URL     = 'https://phimimg.com/';
    var TMDB_TOKEN  = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_BASE   = 'https://api.themoviedb.org/3';
    var TMDB_IMG    = 'https://image.tmdb.org/t/p/';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    // =====================================================================
    // CSS
    // =====================================================================
    function injectCSS() {
        if (document.getElementById('kkp-style')) return;
        var s = document.createElement('style');
        s.id = 'kkp-style';
        s.textContent = '.card__type{display:none!important}.card-label--type{display:none!important}.card__label--tv{display:none!important}.item__type{display:none!important}.kkp-similar-row::-webkit-scrollbar{display:none}.kkp-cast-row::-webkit-scrollbar{display:none}';
        document.head.appendChild(s);
    }

    // =====================================================================
    // HELPERS
    // =====================================================================
    function getPoster(url) {
        if (!url) return '';
        return (url.indexOf('http') === 0) ? url : IMG_URL + url;
    }

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
            kkphim_slug:          item.slug     || '',
            kkphim_type:          item.type     || '',
            kkphim_cats:          item.category || [],
            kkphim_year:          item.year     || 0,
        };
    }

    // =====================================================================
    // TMDB HELPERS
    // =====================================================================
    function tmdbAjax(url, onOk, onFail) {
        $.ajax({
            url: url, type: 'GET',
            headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN },
            success: onOk,
            error:   onFail || function () {},
        });
    }

    function getTmdbInfo(movieOrCard) {
        var raw       = movieOrCard.tmdb || {};
        var tmdbId    = (typeof raw === 'object' ? raw.id : raw) || movieOrCard.tmdb_id || '';
        var mediaType = (typeof raw === 'object' && raw.type)
                        ? raw.type
                        : ((movieOrCard.kkphim_type || movieOrCard.type) === 'single' ? 'movie' : 'tv');
        return { id: tmdbId ? String(tmdbId) : '', type: mediaType };
    }

    function searchTMDB(title, year, mediaType, onFound) {
        var url = TMDB_BASE + '/search/' + mediaType
                + '?query=' + encodeURIComponent(title) + '&language=vi-VN'
                + (year ? '&year=' + year : '');
        tmdbAjax(url, function (data) {
            var results = (data && data.results) || [];
            if (!results.length) { onFound(null); return; }
            var matched = null;
            if (year) {
                matched = results.filter(function (r) {
                    return (r.release_date || r.first_air_date || '').slice(0, 4) === year;
                })[0];
            }
            onFound((matched || results[0]).id);
        }, function () { onFound(null); });
    }

    function fetchTMDBDetail(tmdbId, mediaType, onDone) {
        var url = TMDB_BASE + '/' + mediaType + '/' + tmdbId
                + '?language=vi-VN&append_to_response=credits,images&include_image_language=en,vi,null';
        tmdbAjax(url, function (t) { onDone(t); }, function () { onDone(null); });
    }

    function applyTMDB(result, t) {
        if (!t) return;
        try {
            if (t.backdrop_path) {
                result.backdrop_path    = t.backdrop_path;
                result.background_image = TMDB_IMG + 'original' + t.backdrop_path;
            }
            if (t.poster_path) result.poster_path = t.poster_path;

            var logos = (t.images && t.images.logos) || [];
            var logo  = logos.filter(function (l) { return l.iso_639_1 === 'en'; })[0] || logos[0];
            if (logo && logo.file_path) {
                result.logo      = TMDB_IMG + 'w300' + logo.file_path;
                result.logo_path = logo.file_path;
            }

            if (t.vote_average) {
                result.vote_average = Math.round(t.vote_average * 10) / 10;
                result.vote_count   = t.vote_count || 0;
            }
            if (t.release_date)   result.release_date   = t.release_date;
            if (t.first_air_date) result.first_air_date = t.first_air_date;
            if (t.runtime)        result.runtime         = t.runtime;
            if (t.episode_run_time && t.episode_run_time.length) result.runtime = t.episode_run_time[0] || 0;

            if (t.genres && t.genres.length) {
                result.genres = t.genres.map(function (g) { return { id: String(g.id), name: g.name }; });
            }

            var credits  = t.credits || {};
            var castList = (credits.cast || []).slice(0, 15).map(function (a) {
                return { id: a.id, name: a.name, character: a.character || '', profile_path: a.profile_path || '', img: a.profile_path ? TMDB_IMG + 'w185' + a.profile_path : '', order: a.order || 0 };
            });
            var crewList = (credits.crew || []).filter(function (c) {
                return c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay';
            }).slice(0, 5).map(function (c) {
                return { id: c.id, name: c.name, job: c.job, department: c.department || '', profile_path: c.profile_path || '', img: c.profile_path ? TMDB_IMG + 'w185' + c.profile_path : '' };
            });
            if (castList.length || crewList.length) {
                result.credits   = { cast: castList, crew: crewList };
                result.persons   = castList.concat(crewList);
                result.actors    = castList;
                result.directors = crewList.filter(function (c) { return c.job === 'Director'; });
            }

            result.tmdb    = String(t.id);
            result.tmdb_id = String(t.id);
        } catch (e) { console.warn('[KKPhim] applyTMDB:', e); }
    }

    function enrichWithTMDB(result, movie, onDone) {
        var info        = getTmdbInfo(movie);
        var searchTitle = movie.origin_name || movie.name || '';
        var searchYear  = movie.year ? String(movie.year) : '';

        function done(t) { applyTMDB(result, t); onDone(result, t); }

        if (info.id) {
            fetchTMDBDetail(info.id, info.type, done);
        } else if (searchTitle) {
            searchTMDB(searchTitle, searchYear, info.type, function (foundId) {
                if (foundId) fetchTMDBDetail(String(foundId), info.type, done);
                else onDone(result, null);
            });
        } else {
            onDone(result, null);
        }
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
            } catch (e) {}
            onOk({ items: items, page: page, totalPages: totalPages, totalItems: totalItems });
        }, onFail || function () {});
    }

    // =====================================================================
    // EPISODE HELPERS
    // =====================================================================
    var _epsCache = {};

    function fetchEpisodes(slug, callback) {
        if (_epsCache[slug]) { callback(_epsCache[slug]); return; }
        var net = new Lampa.Reguest();
        net.silent(BASE_URL + '/phim/' + slug, function (res) {
            _epsCache[slug] = res.episodes || [];
            callback(_epsCache[slug]);
        }, function () { callback([]); });
    }

    function showEpList(card, server) {
        var title  = card.title || '';
        var poster = card.img   || card.poster || '';
        var data   = server.server_data || [];
        if (!data.length) return;
        if (data.length === 1) {
            var lk = data[0].link_m3u8 || data[0].link_embed || '';
            if (lk) Lampa.Player.play({ url: lk, title: title, poster: poster });
            return;
        }
        var playlist = data.map(function (ep) {
            return { url: ep.link_m3u8 || ep.link_embed || '', title: title + ' - ' + (ep.name || '') };
        });
        Lampa.Select.show({
            title:    server.server_name || 'Ch\u1ECDn t\u1EADp',
            items:    data.map(function (ep, idx) { return { title: ep.name || ('T\u1EADp ' + (idx + 1)), index: idx }; }),
            onSelect: function (item) {
                var l = data[item.index].link_m3u8 || data[item.index].link_embed || '';
                if (!l) return;
                Lampa.Player.play({ url: l, title: title + ' - ' + (data[item.index].name || ''), poster: poster });
                Lampa.Player.playlist(playlist, item.index);
            },
        });
    }

    function showEpisodeMenu(card, episodes) {
        var title  = card.title || '';
        var poster = card.img   || card.poster || '';
        if (!episodes.length) return;
        if (episodes.length === 1 && (episodes[0].server_data || []).length === 1) {
            var ep = episodes[0].server_data[0];
            var lk = ep.link_m3u8 || ep.link_embed || '';
            if (lk) Lampa.Player.play({ url: lk, title: title, poster: poster });
            return;
        }
        if (episodes.length === 1) { showEpList(card, episodes[0]); return; }
        Lampa.Select.show({
            title:    'Ch\u1ECDn server',
            items:    episodes.map(function (srv, si) { return { title: srv.server_name || ('Server ' + (si + 1)), index: si }; }),
            onSelect: function (item) { showEpList(card, episodes[item.index]); },
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
                    }, function () { cb({ title: cat.title, results: [], url: cat.url, cat_url: cat.url }); });
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
                            episode_number: ei + 1, season_number: si + 1,
                            name: ep.name || ('T\u1EADp ' + (ei + 1)), air_date: '',
                            link_m3u8: ep.link_m3u8 || '', link_embed: ep.link_embed || '',
                        };
                    });
                    seasons.push({ season_number: si + 1, name: server.server_name || ('Server ' + (si + 1)), episodes: eps });
                });

                var result               = normalizeItem(movie);
                result.overview          = movie.content || '';
                result.number_of_seasons = seasons.length || 1;
                result.seasons           = seasons;
                result.kkphim_episodes   = episodes;

                // Cast tu KKPhim truoc (khong co anh)
                var kkActors = (movie.actor    || []).map(function (n, i) { return { id: i,        name: n, character: '', profile_path: '', img: '' }; });
                var kkDirs   = (movie.director || []).map(function (n, i) { return { id: 9000 + i, name: n, job: 'Director', profile_path: '', img: '' }; });
                if (kkActors.length || kkDirs.length) {
                    result.credits   = { cast: kkActors, crew: kkDirs };
                    result.persons   = kkActors.concat(kkDirs);
                    result.actors    = kkActors;
                    result.directors = kkDirs;
                }

                // Enrich TMDB: backdrop, logo, rating, cast co anh
                enrichWithTMDB(result, movie, function (enriched) {
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

        self.person = function (params, onComplete, onError) {
            // Lampa truyen card qua nhieu ten field khac nhau
            var card = params.card || params.movie || params.item || {};
            var info = getTmdbInfo(card);
            if (!info.id) { onError('no tmdb'); return; }

            tmdbAjax(
                TMDB_BASE + '/' + info.type + '/' + info.id
                + '/credits?language=vi-VN',
                function (data) {
                    // Format dung cho Lampa native cast renderer
                    var mapPerson = function (p, extra) {
                        return Object.assign({
                            id:           p.id,
                            name:         p.name,
                            // Lampa dung 'img' hoac 'profile_path' de hien anh
                            img:          p.profile_path ? TMDB_IMG + 'w185' + p.profile_path : '',
                            profile_path: p.profile_path || '',
                            // Lampa dung 'character' hoac 'role'
                            character:    p.character || '',
                            role:         p.character || p.job || '',
                        }, extra || {});
                    };

                    var cast = (data.cast || []).slice(0, 20).map(function (a) {
                        return mapPerson(a, { known_for_department: 'Acting' });
                    });
                    var crew = (data.crew || [])
                        .filter(function (c) { return c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay'; })
                        .slice(0, 5)
                        .map(function (c) { return mapPerson(c, { job: c.job, known_for_department: c.department }); });

                    onComplete({
                        persons: cast.concat(crew),
                        cast:    cast,
                        crew:    crew,
                        // Mot so version Lampa dung field nay
                        actors:     cast,
                        directors:  crew.filter(function (c) { return c.job === 'Director'; }),
                    });
                },
                function () { onError('failed'); }
            );
        };

        self.clear = function () { self.network.clear(); };
    }

    // =====================================================================
    // COMPONENT: DANH SACH INFINITE SCROLL
    // =====================================================================
    function KKPhimListComponent(object) {
        var catUrl     = object.cat_url || '/danh-sach/phim-moi-cap-nhat';
        var catTitle   = object.title   || 'KKPhim';
        var curPage    = 1, totalPages = 1, loading = false;

        var $html = $(
            '<div class="kkp-list-wrap" style="min-height:100vh;">' +
            '<div class="kkp-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;padding:1em 1.5em;"></div>' +
            '<div class="kkp-loader" style="text-align:center;padding:1.5em;display:none;"><span style="opacity:.5;font-size:.9em;">\u0110ang t\u1EA3i...</span></div>' +
            '<div class="kkp-end" style="text-align:center;padding:1em;display:none;"><span style="opacity:.4;font-size:.85em;">\u2014 \u0110\u00E3 t\u1EA3i h\u1EBFt phim \u2014</span></div>' +
            '</div>'
        );
        var $grid = $html.find('.kkp-grid'), $loader = $html.find('.kkp-loader'), $end = $html.find('.kkp-end');

        function renderCard(item) {
            var poster = item.img || item.poster || '';
            var year   = item.release_date ? item.release_date.slice(0, 4) : '';
            var $card  = $(
                '<div class="kkp-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                '<div style="position:relative;padding-top:150%;background:#111;"><img src="' + poster + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/></div>' +
                '<div style="padding:6px 8px;"><div style="font-size:13px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (item.title || '') + '</div>' +
                '<div style="font-size:11px;opacity:.5;margin-top:2px;">' + year + '</div></div></div>'
            );
            $card.on('hover:enter click', function () {
                Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
            });
            $grid.append($card);
        }

        function loadPage(page) {
            if (loading) return;
            loading = true; $loader.show();
            fetchPage(catUrl, page, function (res) {
                totalPages = res.totalPages || 1;
                res.items.forEach(renderCard);
                loading = false; $loader.hide();
                if (curPage >= totalPages) $end.show();
            }, function () { loading = false; $loader.hide(); });
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
                var $s = $html.closest('.activity__body,.layer__scroll,.app__content');
                ($s.length ? $s : $(window)).on('scroll.kkplist', onScroll);
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
    // INJECT: XEM THEM
    // =====================================================================
    function injectViewMore() {
        Lampa.Listener.follow('activity', function (e) {
            if (e.type !== 'start') return;
            var obj = e.object || {};
            if (obj.source !== SOURCE_NAME || obj.component !== 'category') return;
            setTimeout(function () {
                $('.items__head,.category__title').each(function () {
                    var $head = $(this);
                    if ($head.find('.kkp-more-btn').length) return;
                    var txt = $head.text().replace(/\s*[>›].*/g, '').trim();
                    var cfg = null;
                    CATEGORIES.forEach(function (c) { if (c.title === txt) cfg = c; });
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
    // INJECT: CAST/CREW VAO DOM
    // =====================================================================
    function injectCastToDOM($ctx, tmdbData) {
        if (!tmdbData || $ctx.find('.kkp-cast-wrap').length) return;
        var credits   = tmdbData.credits || {};
        var cast      = credits.cast || [];
        var directors = (credits.crew || []).filter(function (c) { return c.job === 'Director'; });
        if (!cast.length && !directors.length) return;

        var $wrap = $('<div class="kkp-cast-wrap" style="padding:0 1.5em 1em;"></div>');

        // DAO DIEN - layout giong dien vien (hang ngang, anh tron)
        if (directors.length) {
            $wrap.append('<div style="font-size:.8em;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin:1em 0 .6em;">Đạo diễn</div>');
            var $drow = $('<div style="display:flex;gap:18px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;"></div>');
            directors.forEach(function (d) {
                var img = d.profile_path ? TMDB_IMG + 'w185' + d.profile_path : '';
                var $item = $('<div class="selector" style="flex:0 0 100px;text-align:center;"></div>');
                $item.append(img
                    ? '<img src="' + img + '" style="width:86px;height:86px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 7px;background:#222;"/>'
                    : '<div style="width:86px;height:86px;border-radius:50%;background:#333;margin:0 auto 7px;"></div>'
                );
                $item.append('<div style="font-size:11px;line-height:1.3;">' + (d.name || '') + '</div>');
                $item.append('<div style="font-size:10px;opacity:.4;margin-top:2px;">Director</div>');
                $drow.append($item);
            });
            $wrap.append($drow);
        }

        // DIEN VIEN
        if (cast.length) {
            $wrap.append('<div style="font-size:.8em;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin:1em 0 .6em;">Diễn viên</div>');
            var $crow = $('<div style="display:flex;gap:18px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;"></div>');
            cast.slice(0, 15).forEach(function (a) {
                var img = a.profile_path ? TMDB_IMG + 'w185' + a.profile_path : '';
                var $item = $('<div class="selector" style="flex:0 0 100px;text-align:center;"></div>');
                $item.append(img
                    ? '<img src="' + img + '" style="width:86px;height:86px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 7px;background:#222;"/>'
                    : '<div style="width:86px;height:86px;border-radius:50%;background:#333;margin:0 auto 7px;"></div>'
                );
                $item.append('<div style="font-size:11px;line-height:1.3;">' + (a.name || '') + '</div>');
                if (a.character) $item.append('<div style="font-size:10px;opacity:.4;margin-top:2px;">' + a.character + '</div>');
                $crow.append($item);
            });
            $wrap.append($crow);
        }

        var $target = $ctx.find('.kkp-similar-wrap');
        if ($target.length) { $target.before($wrap); return; }
        $target = $ctx.find('.full-descr');
        if ($target.length) { $target.after($wrap); return; }
        $ctx.find('.full-start').append($wrap);
    }

    // =====================================================================
    // INJECT: PHIM LIEN QUAN
    // =====================================================================
    function getGenreSlug(card) {
        var cats = card.kkphim_cats || [];
        for (var i = 0; i < cats.length; i++) {
            var c = cats[i];
            if (typeof c === 'object') {
                if (c.slug) return { slug: c.slug, name: c.name || c.slug };
                if (typeof c.id === 'string' && isNaN(c.id) && c.id) return { slug: c.id, name: c.name || c.id };
            }
        }
        var genres = card.genres || [];
        if (genres.length) {
            var g = genres[0], s = g.slug || g.id || '';
            if (s && isNaN(s)) return { slug: String(s), name: g.name || String(s) };
        }
        return null;
    }

    var _injectedMap = {};

    function injectSimilarMovies(card, $ctx) {
        if (!card || card.source !== SOURCE_NAME) return;
        var gi = getGenreSlug(card);
        if (!gi) return;
        var cardSlug = card.kkphim_slug || card.id;
        if (_injectedMap[cardSlug]) return;
        _injectedMap[cardSlug] = true;

        setTimeout(function () {
            if (!$ctx.closest('body').length || $ctx.find('.kkp-similar-wrap').length) return;
            var net1 = new Lampa.Reguest();
            net1.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=1', function (fd) {
                var tp = 1;
                try { var p = fd.data && fd.data.params && fd.data.params.pagination; tp = (p && p.totalPages) || 1; } catch (e) {}
                var rp = Math.floor(Math.random() * tp) + 1;
                var net2 = new Lampa.Reguest();
                net2.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=' + rp, function (data) {
                    if (!$ctx.closest('body').length) return;
                    var items = [];
                    try { items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : []; } catch (e) { return; }
                    items = items.filter(function (i) { return i.id !== cardSlug; })
                                 .sort(function () { return Math.random() - 0.5; }).slice(0, 20);
                    if (!items.length) return;

                    var $wrap = $(
                        '<div class="kkp-similar-wrap" data-slug="' + cardSlug + '" style="padding:.5em 0 1.4em;">' +
                        '<div style="padding:0 1.5em 1.2em;"><span style="font-size:1.15em;font-weight:700;">Phim li\u00EAn quan</span></div>' +
                        '<div class="kkp-similar-row" style="display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;"></div>' +
                        '</div>'
                    );
                    var $row = $wrap.find('.kkp-similar-row');
                    items.forEach(function (item) {
                        var poster = item.img || item.poster || '';
                        var year   = item.release_date ? item.release_date.slice(0, 4) : '';
                        var $c = $(
                            '<div class="kkp-sim-card selector" style="flex:0 0 110px;width:110px;flex-shrink:0;cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                            '<div style="position:relative;padding-top:150%;background:#111;"><img src="' + poster + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/></div>' +
                            '<div style="padding:5px 6px;"><div style="font-size:11px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (item.title || '') + '</div>' +
                            '<div style="font-size:10px;opacity:.45;margin-top:2px;">' + year + '</div></div></div>'
                        );
                        $c.on('hover:enter click', (function (it) {
                            return function () { Lampa.Activity.push({ component: 'full', id: it.id, source: SOURCE_NAME, card: it }); };
                        })(item));
                        $row.append($c);
                    });

                    setTimeout(function () {
                        if (!$ctx.closest('body').length) return;
                        var $after = $ctx.find('.kkp-cast-wrap');
                        if (!$after.length) $after = $ctx.find('.full-descr');
                        if ($after.length) $after.last().after($wrap);
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
            var card = (e.data && e.data.movie) ? e.data.movie : (obj.card || (obj.activity && obj.activity.card));
            if (!card || card.source !== SOURCE_NAME) return;
            var slug = card.kkphim_slug || card.id;

            if (e.type === 'destroy') {
                delete _injectedMap[slug];
                delete _epsCache[slug];
                return;
            }
            if (e.type !== 'complite') return;

            fetchEpisodes(slug, function () {});

            var $render = obj.activity ? obj.activity.render() : (obj.render ? obj.render() : null);
            var $ctx    = $render || $('body');

            // Nut KKPhim trong hang buttons
            if (!$ctx.find('.view--kkphim').length) {
                var $btn = $(
                    '<div class="full-start__button selector view--kkphim" data-subtitle="KKPhim">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                    '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
                    '<path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>' +
                    '<span>KKPhim</span></div>'
                );
                $btn.on('hover:enter', function () {
                    fetchEpisodes(slug, function (eps) {
                        if (!eps || !eps.length) { Lampa.Noty.show('Kh\u00F4ng c\u00F3 link phim'); return; }
                        showEpisodeMenu(card, eps);
                    });
                });
                var $tor = $ctx.find('.view--torrent');
                if ($tor.length) $tor.after($btn);
                else $ctx.find('.full-start__buttons').append($btn);
            }

            injectSimilarMovies(card, $ctx);

            // Inject cast/crew + logo tu TMDB vao DOM
            var info = getTmdbInfo(card);
            if (info.id) {
                fetchTMDBDetail(info.id, info.type, function (tmdbData) {
                    if (!$ctx.closest('body').length) return;

                    // Inject cast
                    injectCastToDOM($ctx, tmdbData);

                    // Inject logo - dung y chang logo.js plugin chinh xac
                    var logos = (tmdbData.images && tmdbData.images.logos) || [];
                    var logo  = logos.filter(function (l) { return l.iso_639_1 === 'en'; })[0] || logos[0];
                    if (logo && logo.file_path) {
                        var logoPath = logo.file_path.replace('.svg', '.png');
                        var logoUrl  = Lampa.TMDB.image('/t/p/w300' + logoPath);
                        // Dung dung class cua Lampa: .full-start-new__title
                        var $t = $ctx.find('.full-start-new__title');
                        if ($t.length) {
                            $t.html('<img style="margin-top:5px;max-height:125px;" src="' + logoUrl + '"/>');
                        }
                    }
                });
            }
        });

        injectViewMore();

        // Hook Genre: bam vao the loai -> mo danh sach phim theo the loai
        // Bat tat ca activity tu source KKPhim co component la genre/catalog/category_filter
        // -> redirect sang kkphim_list
        Lampa.Listener.follow('activity', function (e) {
            if (e.type !== 'start') return;
            var obj = e.object || {};
            if (obj.source !== SOURCE_NAME) return;

            var redirectComponents = ['genre', 'catalog', 'category_filter', 'items'];
            if (redirectComponents.indexOf(obj.component) === -1) return;

            // Co the co genre info trong obj
            var genreName = obj.title || obj.genre || '';
            var genreId   = obj.genre_id || obj.id || '';

            // Tim slug tu genreId hoac genreName trong CATEGORIES
            var slug = '';
            if (genreId && isNaN(genreId)) {
                slug = genreId;
            } else if (obj.url) {
                // url co the la /v1/api/the-loai/slug
                var m = obj.url.match(/the-loai\/([^?]+)/);
                if (m) slug = m[1];
            }

            if (!slug) return;

            // Thay the activity bang kkphim_list
            setTimeout(function () {
                Lampa.Activity.replace({
                    title:     genreName || slug,
                    component: 'kkphim_list',
                    cat_url:   '/v1/api/the-loai/' + slug,
                    source:    SOURCE_NAME,
                    page:      1,
                });
            }, 0);
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var obj  = e.object || {};
            var card = (e.data && e.data.movie) ? e.data.movie : (obj.card || (obj.activity && obj.activity.card));
            if (!card || card.source !== SOURCE_NAME) return;

            setTimeout(function () {
                var $render = obj.activity ? obj.activity.render() : (obj.render ? obj.render() : $('body'));
                // Lam moi cac the loai tag
                $render.find('.full-info__tag, .full-start__genre, .info-tag, .tag').each(function () {
                    var $el = $(this);
                    if ($el.data('kkp-genre')) return;
                    $el.data('kkp-genre', true);

                    $el.on('hover:enter click', function (ev) {
                        ev.stopPropagation();
                        var genreText = $el.text().trim();
                        var genres    = card.genres || [];
                        var matched   = genres.filter(function (g) {
                            return g.name === genreText || g.name.toLowerCase() === genreText.toLowerCase();
                        })[0];
                        var slug = matched ? (matched.slug || matched.id) : '';
                        if (!slug || !isNaN(slug)) return;

                        Lampa.Activity.push({
                            title:     genreText,
                            component: 'kkphim_list',
                            cat_url:   '/v1/api/the-loai/' + slug,
                            source:    SOURCE_NAME,
                            page:      1,
                        });
                    });
                });
            }, 1000);
        });

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
