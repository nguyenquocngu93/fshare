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
        s.textContent = [
            '.card__type{display:none!important}',
            '.card-label--type{display:none!important}',
            '.card__label--tv{display:none!important}',
            '.item__type{display:none!important}',
            '.full-start__genres{display:none!important}',
            '.full-start-new__genres{display:none!important}',
        ].join('');
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
            img:                  thumb,
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
                + '?language=vi-VN&append_to_response=credits,recommendations,similar,images&include_image_language=en,vi,null';
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
            if (t.first_air_date) result.first_air_date  = t.first_air_date;
            if (t.runtime)        result.runtime         = t.runtime;
            if (t.episode_run_time && t.episode_run_time.length) result.runtime = t.episode_run_time[0] || 0;

            if (t.number_of_seasons) result.number_of_seasons = t.number_of_seasons;
            if (t.number_of_episodes) result.number_of_episodes = t.number_of_episodes;

            var credits  = t.credits || {};
            var castList = (credits.cast || []).slice(0, 20).map(function (a) {
                return {
                    id: a.id, name: a.name, character: a.character || '',
                    profile_path: a.profile_path || '',
                    img: a.profile_path ? TMDB_IMG + 'w185' + a.profile_path : '',
                    order: a.order || 0,
                    known_for_department: 'Acting',
                };
            });
            var crewList = (credits.crew || []).filter(function (c) {
                return c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay';
            }).slice(0, 5).map(function (c) {
                return {
                    id: c.id, name: c.name, job: c.job,
                    department: c.department || '',
                    profile_path: c.profile_path || '',
                    img: c.profile_path ? TMDB_IMG + 'w185' + c.profile_path : '',
                    known_for_department: c.department || '',
                };
            });
            if (castList.length || crewList.length) {
                result.credits   = { cast: castList, crew: crewList };
                result.persons   = castList.concat(crewList);
                result.actors    = castList;
                result.directors = crewList.filter(function (c) { return c.job === 'Director'; });
            }

            // Similar / Recommendations tu TMDB
            var similar = (t.similar && t.similar.results) || [];
            var recomm  = (t.recommendations && t.recommendations.results) || [];
            var simAll  = recomm.length ? recomm : similar;
            if (simAll.length) {
                result.simpilar = simAll.slice(0, 20).map(function (s) {
                    return {
                        id:             s.id,
                        title:          s.title || s.name || '',
                        name:           s.name || s.title || '',
                        original_title: s.original_title || s.original_name || '',
                        original_name:  s.original_name || s.original_title || '',
                        poster_path:    s.poster_path || '',
                        backdrop_path:  s.backdrop_path || '',
                        img:            s.poster_path ? TMDB_IMG + 'w300' + s.poster_path : '',
                        vote_average:   s.vote_average || 0,
                        overview:       s.overview || '',
                        release_date:   s.release_date || s.first_air_date || '',
                        first_air_date: s.first_air_date || s.release_date || '',
                        media_type:     s.media_type || (t.first_air_date ? 'tv' : 'movie'),
                        source:         SOURCE_NAME,
                    };
                });
            }

            result.tmdb    = { id: String(t.id), type: t.first_air_date ? 'tv' : 'movie' };
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
                else {
                    // Retry voi type khac
                    var otherType = info.type === 'movie' ? 'tv' : 'movie';
                    searchTMDB(searchTitle, searchYear, otherType, function (foundId2) {
                        if (foundId2) fetchTMDBDetail(String(foundId2), otherType, done);
                        else onDone(result, null);
                    });
                }
            });
        } else {
            onDone(result, null);
        }
    }

    // =====================================================================
    // DANH MUC
    // =====================================================================
    var CATEGORIES = [
        { url: '/danh-sach/phim-moi-cap-nhat',   title: 'Phim m\u1EDBi c\u1EADp nh\u1EADt' },
        { url: '/v1/api/danh-sach/phim-le',      title: 'Phim l\u1EBB'                       },
        { url: '/v1/api/danh-sach/phim-bo',      title: 'Phim b\u1ED9'                       },
        { url: '/v1/api/danh-sach/hoat-hinh',    title: 'Ho\u1EA1t h\u00ECnh'                },
        { url: '/v1/api/danh-sach/tv-shows',     title: 'TV Shows'                           },
        { url: '/v1/api/the-loai/hanh-dong',     title: 'H\u00E0nh \u0110\u1ED9ng'          },
        { url: '/v1/api/the-loai/tinh-cam',      title: 'T\u00ECnh C\u1EA3m'                 },
        { url: '/v1/api/the-loai/hai-huoc',      title: 'H\u00E0i H\u01B0\u1EDBc'           },
        { url: '/v1/api/the-loai/kinh-di',       title: 'Kinh D\u1ECB'                       },
        { url: '/v1/api/the-loai/vo-thuat',      title: 'V\u00F5 Thu\u1EADt'                 },
        { url: '/v1/api/the-loai/vien-tuong',    title: 'Vi\u1EC5n T\u01B0\u1EDFng'         },
        { url: '/v1/api/the-loai/phieu-luu',     title: 'Phi\u00EAu L\u01B0u'               },
        { url: '/v1/api/the-loai/chinh-kich',    title: 'Ch\u00EDnh K\u1ECBch'               },
        { url: '/v1/api/the-loai/tam-ly',        title: 'T\u00E2m L\u00FD'                   },
        { url: '/v1/api/the-loai/bia-kich',      title: 'Bi\u1EC1n K\u1ECBch'               },
        { url: '/v1/api/the-loai/the-thao',      title: 'Th\u1EC3 Thao'                      },
        { url: '/v1/api/the-loai/am-nhac',       title: '\u00C2m Nh\u1EA1c'                  },
        { url: '/v1/api/the-loai/khoa-hoc',      title: 'Khoa H\u1ECDc'                      },
        { url: '/v1/api/the-loai/lich-su',       title: 'L\u1ECBch S\u1EED'                  },
        { url: '/v1/api/the-loai/gia-dinh',      title: 'Gia \u0110\u00ECnh'                 },
        { url: '/v1/api/the-loai/bi-an',         title: 'B\u00ED \u1EA8n'                    },
        { url: '/v1/api/the-loai/tai-lieu',      title: 'T\u00E0i Li\u1EC7u'                 },
        { url: '/v1/api/the-loai/chien-tranh',   title: 'Chi\u1EBFn Tranh'                   },
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
            var page   = params.page || 1;
            var catUrl = '';

            if (params.cat_url) {
                catUrl = params.cat_url;
            } else if (params.url) {
                catUrl = params.url;
            } else if (params.genres && params.genres[0]) {
                var g    = params.genres[0];
                var slug = g.slug || (isNaN(g.id) ? g.id : '');
                if (slug) catUrl = '/v1/api/the-loai/' + slug;
            } else if (params.genre) {
                var g2    = params.genre;
                var slug2 = (typeof g2 === 'object')
                    ? (g2.slug || (isNaN(g2.id) ? g2.id : ''))
                    : (isNaN(g2) ? g2 : '');
                if (slug2) catUrl = '/v1/api/the-loai/' + slug2;
            } else if (params.type === 'genre' && params.value) {
                catUrl = '/v1/api/the-loai/' + params.value;
            }

            if (!catUrl) catUrl = '/danh-sach/phim-moi-cap-nhat';

            fetchPage(catUrl, page, function (res) {
                onComplete({
                    results:       res.items,
                    page:          res.page,
                    total_pages:   res.totalPages,
                    total_results: res.totalItems,
                    cat_url:       catUrl,
                    url:           catUrl,
                });
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

                // Cache episodes
                _epsCache[slug] = episodes;

                var result               = normalizeItem(movie);
                result.overview          = movie.content || '';
                result.kkphim_episodes   = episodes;

                // === XAY DUNG SEASONS/EPISODES DUNG FORMAT LAMPA GOC ===
                // Lampa goc su dung: seasons[].episodes[].episode_number, .name, .overview, .still_path, .air_date
                // Va card.number_of_seasons, card.season_number, card.episode_run_time
                var isSeries = movie.type !== 'single' && episodes.length > 0;

                if (isSeries) {
                    var seasons = [];
                    episodes.forEach(function (server, si) {
                        var eps = (server.server_data || []).map(function (ep, ei) {
                            return {
                                episode_number: ei + 1,
                                season_number:  si + 1,
                                name:           ep.name || ('T\u1EADp ' + (ei + 1)),
                                overview:       '',
                                still_path:     '',
                                air_date:       '',
                                // Custom fields cho play
                                link_m3u8:      ep.link_m3u8  || '',
                                link_embed:     ep.link_embed || '',
                            };
                        });
                        seasons.push({
                            season_number:  si + 1,
                            name:           server.server_name || ('Server ' + (si + 1)),
                            episode_count:  eps.length,
                            episodes:       eps,
                            overview:       '',
                            poster_path:    '',
                            air_date:       '',
                        });
                    });

                    result.number_of_seasons  = seasons.length;
                    result.number_of_episodes = (episodes[0] && episodes[0].server_data) ? episodes[0].server_data.length : 0;
                    result.seasons            = seasons;
                    result.season_number      = 1;
                    // Lampa dung type 'tv' de hien thi tab seasons
                    result.type               = 'tv';
                    result.media_type         = 'tv';
                }

                // Cast tu KKPhim truoc (khong co anh)
                var kkActors = (movie.actor || []).filter(Boolean).map(function (n, i) {
                    return {
                        id: 'kk-' + i, name: n, character: '',
                        profile_path: '', img: '',
                        known_for_department: 'Acting',
                    };
                });
                var kkDirs = (movie.director || []).filter(Boolean).map(function (n, i) {
                    return {
                        id: 'kk-dir-' + i, name: n, job: 'Director',
                        profile_path: '', img: '',
                        known_for_department: 'Directing',
                    };
                });
                if (kkActors.length || kkDirs.length) {
                    result.credits   = { cast: kkActors, crew: kkDirs };
                    result.persons   = kkActors.concat(kkDirs);
                    result.actors    = kkActors;
                    result.directors = kkDirs;
                }

                // Enrich TMDB
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

        // === SEASONS: Lampa goc goi khi click tab Seasons ===
        self.seasons = function (card, seasons, onComplete) {
            // card: the card object, seasons: array of seasons from card.seasons
            // Lampa mong doi: onComplete(episodes_array) cho season duoc chon
            // Nhung thuc te Lampa goi: api.seasons(card, card.seasons, callback)
            if (seasons && seasons.length) {
                onComplete(seasons);
            } else if (card && (card.kkphim_slug || card.id)) {
                var slug = card.kkphim_slug || card.id;
                fetchEpisodes(slug, function (eps) {
                    var result = [];
                    eps.forEach(function (server, si) {
                        var episodes = (server.server_data || []).map(function (ep, ei) {
                            return {
                                episode_number: ei + 1,
                                season_number:  si + 1,
                                name:           ep.name || ('T\u1EADp ' + (ei + 1)),
                                overview:       '',
                                still_path:     '',
                                air_date:       '',
                                link_m3u8:      ep.link_m3u8  || '',
                                link_embed:     ep.link_embed || '',
                            };
                        });
                        result.push({
                            season_number: si + 1,
                            name:          server.server_name || ('Server ' + (si + 1)),
                            episode_count: episodes.length,
                            episodes:      episodes,
                        });
                    });
                    onComplete(result);
                });
            } else {
                onComplete([]);
            }
        };

        // === SEASON EPISODES: Lampa goc goi khi chon 1 season ===
        self.seasonEpisodes = function (params, onComplete, onError) {
            var card   = params.card || {};
            var sNum   = params.season  || params.season_number || 1;
            var slug   = card.kkphim_slug || card.id;

            if (!slug) { if (onError) onError('no slug'); return; }

            fetchEpisodes(slug, function (allEps) {
                var serverIdx = sNum - 1;
                var server    = allEps[serverIdx] || allEps[0] || {};
                var episodes  = (server.server_data || []).map(function (ep, ei) {
                    return {
                        episode_number: ei + 1,
                        season_number:  sNum,
                        name:           ep.name || ('T\u1EADp ' + (ei + 1)),
                        overview:       '',
                        still_path:     '',
                        air_date:       '',
                        link_m3u8:      ep.link_m3u8  || '',
                        link_embed:     ep.link_embed || '',
                    };
                });
                onComplete({ episodes: episodes });
            });
        };

        // === EPISODE DETAIL: Lampa goc goi khi chon 1 episode ===
        self.episodeDetail = function (params, onComplete, onError) {
            var card   = params.card || {};
            var sNum   = params.season  || params.season_number || 1;
            var epNum  = params.episode || params.episode_number || 1;
            var slug   = card.kkphim_slug || card.id;

            if (!slug) { if (onError) onError('no slug'); return; }

            fetchEpisodes(slug, function (allEps) {
                var serverIdx = sNum - 1;
                var server    = allEps[serverIdx] || allEps[0] || {};
                var epData    = (server.server_data || [])[epNum - 1] || {};

                onComplete({
                    episode_number: epNum,
                    season_number:  sNum,
                    name:           epData.name || ('T\u1EADp ' + epNum),
                    overview:       '',
                    still_path:     card.backdrop_path || '',
                    air_date:       '',
                    link_m3u8:      epData.link_m3u8  || '',
                    link_embed:     epData.link_embed || '',
                });
            });
        };

        // === PERSON: Lampa goc goi de hien thi cast/crew ===
        self.person = function (params, onComplete, onError) {
            var card = params.card || params.movie || params.item || {};
            var info = getTmdbInfo(card);

            if (!info.id) {
                // Khong co TMDB ID, tra ve cast tu card
                var fallback = card.credits || { cast: [], crew: [] };
                onComplete({
                    persons:    (fallback.cast || []).concat(fallback.crew || []),
                    cast:       fallback.cast || [],
                    crew:       fallback.crew || [],
                    actors:     fallback.cast || [],
                    directors:  (fallback.crew || []).filter(function (c) { return c.job === 'Director'; }),
                });
                return;
            }

            tmdbAjax(
                TMDB_BASE + '/' + info.type + '/' + info.id + '/credits?language=vi-VN',
                function (data) {
                    var mapPerson = function (p, extra) {
                        return Object.assign({
                            id:           p.id,
                            name:         p.name,
                            img:          p.profile_path ? TMDB_IMG + 'w185' + p.profile_path : '',
                            profile_path: p.profile_path || '',
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
                        persons:    cast.concat(crew),
                        cast:       cast,
                        crew:       crew,
                        actors:     cast,
                        directors:  crew.filter(function (c) { return c.job === 'Director'; }),
                    });
                },
                function () { if (onError) onError('failed'); }
            );
        };

        // === SIMILAR: Lampa goc goi de hien thi phim lien quan ===
        self.similar = function (params, onComplete, onError) {
            var card = params.card || {};
            var info = getTmdbInfo(card);

            if (info.id) {
                // Lay similar tu TMDB
                tmdbAjax(
                    TMDB_BASE + '/' + info.type + '/' + info.id + '/recommendations?language=vi-VN&page=1',
                    function (data) {
                        var results = (data && data.results) || [];
                        if (!results.length) {
                            // Fallback: dung similar thay vi recommendations
                            tmdbAjax(
                                TMDB_BASE + '/' + info.type + '/' + info.id + '/similar?language=vi-VN&page=1',
                                function (data2) {
                                    var res2 = (data2 && data2.results) || [];
                                    onComplete({ results: formatTmdbSimilar(res2, info.type) });
                                },
                                function () { fallbackSimilar(card, onComplete); }
                            );
                            return;
                        }
                        onComplete({ results: formatTmdbSimilar(results, info.type) });
                    },
                    function () { fallbackSimilar(card, onComplete); }
                );
            } else {
                fallbackSimilar(card, onComplete);
            }
        };

        function formatTmdbSimilar(results, mediaType) {
            return results.slice(0, 20).map(function (s) {
                return {
                    id:             s.id,
                    title:          s.title || s.name || '',
                    name:           s.name || s.title || '',
                    original_title: s.original_title || s.original_name || '',
                    original_name:  s.original_name || s.original_title || '',
                    poster_path:    s.poster_path || '',
                    backdrop_path:  s.backdrop_path || '',
                    img:            s.poster_path ? TMDB_IMG + 'w300' + s.poster_path : '',
                    vote_average:   s.vote_average || 0,
                    overview:       s.overview || '',
                    release_date:   s.release_date || s.first_air_date || '',
                    first_air_date: s.first_air_date || s.release_date || '',
                    media_type:     s.media_type || mediaType,
                    source:         SOURCE_NAME,
                };
            });
        }

        // Fallback: lay phim cung the loai tu KKPhim
        function fallbackSimilar(card, onComplete) {
            var gi = getGenreSlug(card);
            if (!gi) { onComplete({ results: [] }); return; }
            var cardSlug = card.kkphim_slug || card.id;
            var net1 = new Lampa.Reguest();
            net1.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=1', function (fd) {
                var tp = 1;
                try {
                    var p = fd.data && fd.data.params && fd.data.params.pagination;
                    tp = (p && p.totalPages) || 1;
                } catch (e) {}
                var rp = Math.max(1, Math.floor(Math.random() * Math.min(tp, 10)) + 1);
                var net2 = new Lampa.Reguest();
                net2.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=' + rp, function (data2) {
                    var items = [];
                    try {
                        items = (data2.data && data2.data.items) ? data2.data.items.map(normalizeItem) : [];
                    } catch (e) {}
                    items = items.filter(function (i) { return i.id !== cardSlug; })
                                 .sort(function () { return Math.random() - 0.5; })
                                 .slice(0, 20);
                    onComplete({ results: items });
                }, function () { onComplete({ results: [] }); });
            }, function () { onComplete({ results: [] }); });
        }

        self.clear = function () { self.network.clear(); };
    }

    // =====================================================================
    // COMPONENT: DANH SACH INFINITE SCROLL
    // =====================================================================
    function KKPhimListComponent(object) {
        var catUrl   = object.cat_url || '/danh-sach/phim-moi-cap-nhat';
        var catTitle = object.title   || 'KKPhim';
        var curPage  = 1, totalPages = 1, loading = false;

        var $html = $(
            '<div class="kkp-list-wrap" style="min-height:100vh;">' +
            '<div class="kkp-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;"></div>' +
            '<div class="kkp-loader" style="text-align:center;padding:1.5em;display:none;"><span style="opacity:.5;font-size:.9em;">Đang tải...</span></div>' +
            '<div class="kkp-end" style="text-align:center;padding:1em;display:none;"><span style="opacity:.4;font-size:.85em;">— Đã tải hết phim —</span></div>' +
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
                '<img src="' + poster + '" loading="lazy" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' +
                '</div>' +
                '<div style="padding:6px 8px;">' +
                '<div style="font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (item.title || '') + '</div>' +
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
            var selectors = ['.activity__body', '.layer__scroll', '.app__content', '.app'];
            var el = null;
            for (var i = 0; i < selectors.length; i++) {
                var found = document.querySelector(selectors[i]);
                if (found && found.scrollHeight > found.clientHeight) {
                    el = found;
                    break;
                }
            }
            if (!el) el = document.documentElement;
            var scrollTop    = el.scrollTop || window.pageYOffset || 0;
            var clientHeight = el.clientHeight || window.innerHeight;
            var scrollHeight = el.scrollHeight || document.body.scrollHeight;
            if (scrollTop + clientHeight >= scrollHeight - 600) {
                if (!loading && curPage < totalPages) { curPage++; loadPage(curPage); }
            }
        }

        this.create = function () {
            loadPage(1);
            window.addEventListener('scroll', onScroll, true);
            return $html;
        };
        this.start   = function () { return this.create(); };
        this.render  = function () { return $html; };
        this.header  = function () { return catTitle; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () {};
        this.destroy = function () {
            window.removeEventListener('scroll', onScroll, true);
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
    // GENRE SLUG HELPER
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

    // =====================================================================
    // INJECT: THE LOAI
    // =====================================================================
    function injectGenres(card, $ctx) {
        if (!card || card.source !== SOURCE_NAME) return;
        if ($ctx.find('.kkp-genres-wrap').length) return;
        var genres = card.genres || [];
        if (!genres.length) return;

        var $wrap = $(
            '<div class="kkp-genres-wrap" style="padding:.2em 1.5em 1em;">' +
            '<div style="font-size:.8em;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin:0 0 .8em;">Thể loại</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:8px;"></div>' +
            '</div>'
        );
        var $row = $wrap.find('div').last();

        genres.forEach(function (g) {
            var slug = g.slug || (isNaN(g.id) ? g.id : '');
            if (!slug) return;
            var $tag = $(
                '<div class="selector" style="padding:6px 16px;border-radius:20px;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);">' +
                (g.name || '') + '</div>'
            );
            $tag.on('hover:enter click', (function(gName, gSlug) {
                return function () {
                    Lampa.Activity.push({
                        title:     gName,
                        component: 'kkphim_list',
                        cat_url:   '/v1/api/the-loai/' + gSlug,
                        source:    SOURCE_NAME,
                        page:      1,
                    });
                };
            })(g.name || slug, slug));
            $row.append($tag);
        });

        var $d = $ctx.find('.full-descr').first();
        if ($d.length) $d.after($wrap);
        else $ctx.find('.full-start').first().append($wrap);
    }

    // =====================================================================
    // KHOI DONG
    // =====================================================================
    function startPlugin() {
        if (window.kkphim_started) return;
        window.kkphim_started = true;

        injectCSS();

        // Dang ky source API
        var apiInstance = new KKPhimApi();
        Lampa.Api.sources[SOURCE_NAME] = apiInstance;

        // === OVERRIDE Lampa.Api methods de route dung ve KKPhim API ===
        // Lampa goc goi Lampa.Api.person(), Lampa.Api.seasons(), etc.
        // Can dam bao khi source = kkphim thi goi dung ham cua minh

        // Hook vao Lampa.Api methods
        var origMethods = {};

        function hookApiMethod(methodName) {
            if (Lampa.Api[methodName]) {
                origMethods[methodName] = Lampa.Api[methodName];
            }
            Lampa.Api[methodName] = function (params) {
                var args = arguments;
                var card = params && (params.card || params.movie || params);
                var src  = (card && card.source) || (params && params.source) || '';

                if (src === SOURCE_NAME && apiInstance[methodName]) {
                    return apiInstance[methodName].apply(apiInstance, args);
                }

                if (origMethods[methodName]) {
                    return origMethods[methodName].apply(Lampa.Api, args);
                }
            };
        }

        // Hook cac method quan trong
        // Khong hook tat ca vi co the break Lampa goc
        // Chi hook khi can thiet

        Lampa.Component.add('kkphim_list', KKPhimListComponent);

        // === FULL LISTENER ===
        Lampa.Listener.follow('full', function (e) {
            var obj  = e.object || {};
            var card = (e.data && e.data.movie) ? e.data.movie : (obj.card || (obj.activity && obj.activity.card));
            if (!card || card.source !== SOURCE_NAME) return;
            var slug = card.kkphim_slug || card.id;

            if (e.type === 'destroy') {
                delete _epsCache[slug];
                return;
            }
            if (e.type !== 'complite') return;

            fetchEpisodes(slug, function () {});

            var $render = obj.activity ? obj.activity.render() : (obj.render ? obj.render() : null);
            var $ctx    = $render || $('body');

            // === NUT KKPHIM ===
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

            // === INJECT GENRES ===
            injectGenres(card, $ctx);

            // === INJECT LOGO TU TMDB ===
            var info = getTmdbInfo(card);
            if (info.id) {
                fetchTMDBDetail(info.id, info.type, function (tmdbData) {
                    if (!tmdbData || !$ctx.closest('body').length) return;

                    var logos = (tmdbData.images && tmdbData.images.logos) || [];
                    var logo  = logos.filter(function (l) { return l.iso_639_1 === 'en'; })[0] || logos[0];
                    if (logo && logo.file_path) {
                        var logoPath = logo.file_path.replace('.svg', '.png');
                        var logoUrl  = TMDB_IMG + 'w300' + logoPath;
                        var $t = $ctx.find('.full-start-new__title');
                        if ($t.length) {
                            $t.html('<img style="margin-top:5px;max-height:125px;" src="' + logoUrl + '"/>');
                        }
                    }
                });
            }

            // === INJECT CAST ROW (Lampa native style) ===
            injectCastRow(card, $ctx);

            // === INJECT SIMILAR ROW (Lampa native style) ===
            injectSimilarRow(card, $ctx);

            // === INJECT EPISODES ROW ===
            injectEpisodesRow(card, $ctx);
        });

        injectViewMore();

        // === MENU ITEM ===
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

    // =====================================================================
    // INJECT: CAST ROW (Lampa native component style)
    // =====================================================================
    function injectCastRow(card, $ctx) {
        if ($ctx.find('.kkp-persons-row').length) return;

        var info = getTmdbInfo(card);
        if (!info.id) {
            // Fallback: dung cast tu card (KKPhim, khong co anh)
            renderCastBlock(card.credits || { cast: [], crew: [] }, $ctx);
            return;
        }

        tmdbAjax(
            TMDB_BASE + '/' + info.type + '/' + info.id + '/credits?language=vi-VN',
            function (data) {
                if (!$ctx.closest('body').length) return;
                renderCastBlock(data, $ctx);
            },
            function () {
                renderCastBlock(card.credits || { cast: [], crew: [] }, $ctx);
            }
        );
    }

    function renderCastBlock(credits, $ctx) {
        if ($ctx.find('.kkp-persons-row').length) return;
        var cast = (credits.cast || []).slice(0, 20);
        var dirs = (credits.crew || []).filter(function (c) {
            return c.job === 'Director';
        });
        if (!cast.length && !dirs.length) return;

        var $wrap = $('<div class="kkp-persons-row"></div>');

        // === DAO DIEN ===
        if (dirs.length) {
            var $dSect = $(
                '<div class="items-line" style="padding:0 1.5em;">' +
                '<div class="items-line__head"><div class="items-line__title">Đạo diễn</div></div>' +
                '<div class="items-line__body"></div></div>'
            );
            var $dBody = $dSect.find('.items-line__body');
            var $dScroll = $('<div style="display:flex;gap:1.2em;overflow-x:auto;padding-bottom:0.5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;"></div>');

            dirs.forEach(function (d) {
                var img = d.profile_path ? TMDB_IMG + 'w185' + d.profile_path : (d.img || '');
                var $p = $(
                    '<div class="card-person selector" style="width:7em;flex-shrink:0;text-align:center;">' +
                    '<div class="card-person__img" style="width:6em;height:6em;border-radius:50%;overflow:hidden;margin:0 auto .5em;background:#222;">' +
                    (img ? '<img src="' + img + '" style="width:100%;height:100%;object-fit:cover;"/>' : '') +
                    '</div>' +
                    '<div class="card-person__name" style="font-size:.8em;">' + (d.name || '') + '</div>' +
                    '<div class="card-person__role" style="font-size:.7em;opacity:.5;">Director</div>' +
                    '</div>'
                );
                $p.on('hover:enter click', function () {
                    if (d.id && !String(d.id).startsWith('kk-')) {
                        Lampa.Activity.push({ url: '', component: 'actor', id: d.id, source: 'tmdb' });
                    }
                });
                $dScroll.append($p);
            });

            $dBody.append($dScroll);
            $wrap.append($dSect);
        }

        // === DIEN VIEN ===
        if (cast.length) {
            var $cSect = $(
                '<div class="items-line" style="padding:0 1.5em;">' +
                '<div class="items-line__head"><div class="items-line__title">Diễn viên</div></div>' +
                '<div class="items-line__body"></div></div>'
            );
            var $cBody = $cSect.find('.items-line__body');
            var $cScroll = $('<div style="display:flex;gap:1.2em;overflow-x:auto;padding-bottom:0.5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;"></div>');

            cast.forEach(function (a) {
                var img = a.profile_path ? TMDB_IMG + 'w185' + a.profile_path : (a.img || '');
                var $p = $(
                    '<div class="card-person selector" style="width:7em;flex-shrink:0;text-align:center;">' +
                    '<div class="card-person__img" style="width:6em;height:6em;border-radius:50%;overflow:hidden;margin:0 auto .5em;background:#222;">' +
                    (img ? '<img src="' + img + '" style="width:100%;height:100%;object-fit:cover;"/>' : '') +
                    '</div>' +
                    '<div class="card-person__name" style="font-size:.8em;">' + (a.name || '') + '</div>' +
                    (a.character ? '<div class="card-person__role" style="font-size:.7em;opacity:.5;">' + a.character + '</div>' : '') +
                    '</div>'
                );
                $p.on('hover:enter click', function () {
                    if (a.id && !String(a.id).startsWith('kk-')) {
                        Lampa.Activity.push({ url: '', component: 'actor', id: a.id, source: 'tmdb' });
                    }
                });
                $cScroll.append($p);
            });

            $cBody.append($cScroll);
            $wrap.append($cSect);
        }

        // Insert after genres or descr
        var $after = $ctx.find('.kkp-genres-wrap');
        if (!$after.length) $after = $ctx.find('.full-descr');
        if ($after.length) $after.last().after($wrap);
        else $ctx.find('.full-start').first().append($wrap);
    }

    // =====================================================================
    // INJECT: SIMILAR ROW (Lampa native card style)
    // =====================================================================
    var _simInjected = {};

    function injectSimilarRow(card, $ctx) {
        var slug = card.kkphim_slug || card.id;
        if (_simInjected[slug] || $ctx.find('.kkp-similar-section').length) return;
        _simInjected[slug] = true;

        var info = getTmdbInfo(card);

        function renderSimilar(items) {
            if (!items.length || !$ctx.closest('body').length) return;

            var $sect = $(
                '<div class="kkp-similar-section items-line" style="padding:0 1.5em;">' +
                '<div class="items-line__head"><div class="items-line__title">Phim liên quan</div></div>' +
                '<div class="items-line__body"></div></div>'
            );
            var $body = $sect.find('.items-line__body');
            var $scroll = $('<div style="display:flex;gap:0.6em;overflow-x:auto;padding-bottom:0.5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;"></div>');

            items.forEach(function (item) {
                var poster = item.img || (item.poster_path ? TMDB_IMG + 'w300' + item.poster_path : '');
                var title  = item.title || item.name || '';
                var year   = (item.release_date || item.first_air_date || '').slice(0, 4);

                var $card = $(
                    '<div class="card selector" style="width:7em;flex-shrink:0;">' +
                    '<div class="card__img" style="padding-top:150%;position:relative;background:#111;border-radius:0.3em;overflow:hidden;">' +
                    (poster ? '<img src="' + poster + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' : '') +
                    '</div>' +
                    '<div class="card__title" style="font-size:.75em;margin-top:.3em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + title + '</div>' +
                    (year ? '<div class="card__age" style="font-size:.65em;opacity:.4;">' + year + '</div>' : '') +
                    '</div>'
                );

                $card.on('hover:enter click', function () {
                    if (item.source === SOURCE_NAME && item.id) {
                        Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
                    } else if (item.id) {
                        // TMDB similar -> open as TMDB
                        var mt = item.media_type || 'movie';
                        Lampa.Activity.push({ url: '', component: 'full', id: item.id, source: 'tmdb', card: item, media_type: mt });
                    }
                });

                $scroll.append($card);
            });

            $body.append($scroll);

            // Insert after cast or genres
            setTimeout(function () {
                if (!$ctx.closest('body').length) return;
                var $after = $ctx.find('.kkp-persons-row');
                if (!$after.length) $after = $ctx.find('.kkp-genres-wrap');
                if (!$after.length) $after = $ctx.find('.full-descr');
                if ($after.length) $after.last().after($sect);
                else $ctx.find('.full-start').first().append($sect);
            }, 300);
        }

        if (info.id) {
            // Lay similar tu TMDB
            tmdbAjax(
                TMDB_BASE + '/' + info.type + '/' + info.id + '/recommendations?language=vi-VN&page=1',
                function (data) {
                    var results = (data && data.results) || [];
                    if (!results.length) {
                        tmdbAjax(
                            TMDB_BASE + '/' + info.type + '/' + info.id + '/similar?language=vi-VN&page=1',
                            function (data2) {
                                var res2 = (data2 && data2.results) || [];
                                renderSimilar(formatSimilarItems(res2, info.type));
                            },
                            function () { fallbackSimilarRender(card, renderSimilar); }
                        );
                        return;
                    }
                    renderSimilar(formatSimilarItems(results, info.type));
                },
                function () { fallbackSimilarRender(card, renderSimilar); }
            );
        } else {
            fallbackSimilarRender(card, renderSimilar);
        }
    }

    function formatSimilarItems(results, mediaType) {
        return results.slice(0, 20).map(function (s) {
            return {
                id:             s.id,
                title:          s.title || s.name || '',
                name:           s.name || s.title || '',
                poster_path:    s.poster_path || '',
                img:            s.poster_path ? TMDB_IMG + 'w300' + s.poster_path : '',
                vote_average:   s.vote_average || 0,
                release_date:   s.release_date || s.first_air_date || '',
                first_air_date: s.first_air_date || s.release_date || '',
                media_type:     s.media_type || mediaType,
                source:         'tmdb',
            };
        });
    }

    function fallbackSimilarRender(card, callback) {
        var gi = getGenreSlug(card);
        if (!gi) { callback([]); return; }
        var cardSlug = card.kkphim_slug || card.id;
        var net1 = new Lampa.Reguest();
        net1.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=1', function (fd) {
            var tp = 1;
            try { var p = fd.data && fd.data.params && fd.data.params.pagination; tp = (p && p.totalPages) || 1; } catch (e) {}
            var rp = Math.max(1, Math.floor(Math.random() * Math.min(tp, 10)) + 1);
            var net2 = new Lampa.Reguest();
            net2.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=' + rp, function (data2) {
                var items = [];
                try { items = (data2.data && data2.data.items) ? data2.data.items.map(normalizeItem) : []; } catch (e) {}
                items = items.filter(function (i) { return i.id !== cardSlug; })
                             .sort(function () { return Math.random() - 0.5; }).slice(0, 20);
                callback(items);
            }, function () { callback([]); });
        }, function () { callback([]); });
    }

    // =====================================================================
    // INJECT: EPISODES ROW (cho phim bo)
    // =====================================================================
    function injectEpisodesRow(card, $ctx) {
        if ($ctx.find('.kkp-episodes-section').length) return;
        var slug = card.kkphim_slug || card.id;
        if (!slug) return;

        fetchEpisodes(slug, function (episodes) {
            if (!episodes || !episodes.length || !$ctx.closest('body').length) return;

            // Chi hien row episodes cho phim co > 1 tap
            var firstServer = episodes[0] || {};
            var epList      = firstServer.server_data || [];
            if (epList.length <= 1) return;

            var $sect = $(
                '<div class="kkp-episodes-section items-line" style="padding:0 1.5em;">' +
                '<div class="items-line__head">' +
                '<div class="items-line__title">Danh sách tập' +
                (episodes.length > 1 ? ' — ' + (firstServer.server_name || 'Server 1') : '') +
                '</div>' +
                (episodes.length > 1 ? '<div class="items-line__more selector" style="font-size:.8em;opacity:.6;cursor:pointer;">Đổi server ›</div>' : '') +
                '</div>' +
                '<div class="items-line__body"></div></div>'
            );

            var $body    = $sect.find('.items-line__body');
            var $title   = $sect.find('.items-line__title');
            var $more    = $sect.find('.items-line__more');
            var curSrv   = 0;

            function renderEpRow(serverIdx) {
                $body.empty();
                var server = episodes[serverIdx] || {};
                var data   = server.server_data || [];
                $title.text('Danh sách tập' + (episodes.length > 1 ? ' — ' + (server.server_name || ('Server ' + (serverIdx + 1))) : ''));

                var $scroll = $('<div style="display:flex;gap:0.5em;overflow-x:auto;padding-bottom:0.5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-wrap:wrap;"></div>');

                data.forEach(function (ep, idx) {
                    var epName = ep.name || ('T\u1EADp ' + (idx + 1));
                    var $ep = $(
                        '<div class="selector" style="padding:0.5em 1em;border-radius:0.3em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);font-size:.85em;cursor:pointer;white-space:nowrap;">' +
                        epName + '</div>'
                    );
                    $ep.on('hover:enter click', function () {
                        var link = ep.link_m3u8 || ep.link_embed || '';
                        if (!link) { Lampa.Noty.show('Không có link'); return; }
                        var poster = card.img || card.poster || '';
                        var title  = card.title || '';

                        // Tao playlist
                        var playlist = data.map(function (e) {
                            return {
                                url:   e.link_m3u8 || e.link_embed || '',
                                title: title + ' - ' + (e.name || ''),
                            };
                        });

                        Lampa.Player.play({
                            url:    link,
                            title:  title + ' - ' + epName,
                            poster: poster,
                        });
                        Lampa.Player.playlist(playlist, idx);
                    });
                    $scroll.append($ep);
                });

                $body.append($scroll);
            }

            renderEpRow(0);

            // Doi server
            if (episodes.length > 1) {
                $more.on('hover:enter click', function () {
                    Lampa.Select.show({
                        title:    'Chọn server',
                        items:    episodes.map(function (srv, si) {
                            return { title: srv.server_name || ('Server ' + (si + 1)), index: si, selected: si === curSrv };
                        }),
                        onSelect: function (item) {
                            curSrv = item.index;
                            renderEpRow(curSrv);
                        },
                    });
                });
            }

            // Insert: sau play button, truoc genres
            setTimeout(function () {
                if (!$ctx.closest('body').length) return;
                var $after = $ctx.find('.full-start__buttons');
                if (!$after.length) $after = $ctx.find('.full-start__rate');
                if ($after.length) $after.last().after($sect);
                else {
                    var $descr = $ctx.find('.full-descr');
                    if ($descr.length) $descr.before($sect);
                    else $ctx.find('.full-start').first().append($sect);
                }
            }, 200);
        });
    }

    // =====================================================================
    // START
    // =====================================================================
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();