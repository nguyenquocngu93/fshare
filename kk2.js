(function () {
    'use strict';

    if (window.__kkphim_started) return;
    window.__kkphim_started = true;

    var SOURCE_NAME = 'kkphim';
    var CAT_NAME    = 'KKPhim';
    var BASE_URL    = 'https://phimapi.com';
    var IMG_URL     = 'https://phimimg.com/';
    var TMDB_TOKEN  = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_BASE   = 'https://api.themoviedb.org/3';
    var TMDB_IMG    = 'https://image.tmdb.org/t/p/';
    var STG_KEY     = 'kkphim_v5_settings';

    // =========================================================
    // STORAGE
    // =========================================================
    function ls() { try { return JSON.parse(localStorage.getItem(STG_KEY)) || {}; } catch(e) { return {}; } }
    function ss(o) { try { var c = ls(); Object.keys(o).forEach(function(k){ c[k]=o[k]; }); localStorage.setItem(STG_KEY, JSON.stringify(c)); } catch(e) {} }
    function getSetting(key, def) { var v = ls()[key]; return v === undefined ? def : v; }

    // =========================================================
    // HELPERS
    // =========================================================
    function getPoster(url) {
        if (!url) return '';
        return url.indexOf('http') === 0 ? url : IMG_URL + url;
    }

    function toNameArray(arr) {
        if (!arr || !arr.length) return [];
        return arr.map(function(item) {
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
            id:               item.slug || '',
            title:            item.name || '',
            name:             item.name || '',
            original_title:   item.origin_name || item.name || '',
            original_name:    item.origin_name || item.name || '',
            img:              thumb,
            poster:           poster,
            poster_path:      '',
            backdrop_path:    '',
            background_image: thumb,
            release_date:     item.year ? (item.year + '-01-01') : '',
            first_air_date:   item.year ? (item.year + '-01-01') : '',
            vote_average:     0,
            overview:         item.content || '',
            genres:           toNameArray(item.category || []),
            countries:        toNameArray(item.country  || []),
            production_companies: [],
            type:             'movie',
            media_type:       'movie',
            source:           SOURCE_NAME,
            kkphim_slug:      item.slug     || '',
            kkphim_type:      item.type     || '',
            kkphim_cats:      item.category || [],
            kkphim_year:      item.year     || 0,
        };
    }

    // =========================================================
    // TMDB
    // =========================================================
    function tmdbAjax(url, onOk, onFail) {
        $.ajax({
            url: url, type: 'GET',
            headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN },
            success: onOk,
            error: onFail || function() {}
        });
    }

    function tmdbFetch(path) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                url: TMDB_BASE + path, type: 'GET',
                headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN },
                success: resolve,
                error: function(xhr) { reject(new Error('TMDB ' + xhr.status)); }
            });
        });
    }

    var _tmdbLang = function() { return getSetting('tmdb_lang', 'vi-VN'); };

    function getTmdbInfo(card) {
        var raw      = card.tmdb || {};
        var tmdbId   = (typeof raw === 'object' ? raw.id : raw) || card.tmdb_id || '';
        var mediaType= (typeof raw === 'object' && raw.type)
                        ? raw.type
                        : ((card.kkphim_type || card.type) === 'single' ? 'movie' : 'tv');
        return { id: tmdbId ? String(tmdbId) : '', type: mediaType };
    }

    function searchTMDB(title, year, mediaType, onFound) {
        var url = TMDB_BASE + '/search/' + mediaType
                + '?query=' + encodeURIComponent(title) + '&language=' + _tmdbLang()
                + (year ? '&year=' + year : '');
        tmdbAjax(url, function(data) {
            var results = (data && data.results) || [];
            if (!results.length) { onFound(null); return; }
            var matched = null;
            if (year) {
                matched = results.filter(function(r) {
                    return (r.release_date || r.first_air_date || '').slice(0,4) === year;
                })[0];
            }
            onFound((matched || results[0]).id);
        }, function() { onFound(null); });
    }

    function fetchTMDBDetail(tmdbId, mediaType, onDone) {
        var url = TMDB_BASE + '/' + mediaType + '/' + tmdbId
                + '?language=' + _tmdbLang()
                + '&append_to_response=credits,recommendations,similar,images&include_image_language=en,vi,null';
        tmdbAjax(url, function(t) { onDone(t); }, function() { onDone(null); });
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
            var logo  = logos.filter(function(l){ return l.iso_639_1 === 'en'; })[0] || logos[0];
            if (logo && logo.file_path) {
                result.logo      = TMDB_IMG + 'w300' + logo.file_path;
                result.logo_path = logo.file_path;
            }

            if (t.vote_average) {
                result.vote_average = Math.round(t.vote_average * 10) / 10;
                result.vote_count   = t.vote_count || 0;
            }
            if (t.release_date)   result.release_date  = t.release_date;
            if (t.first_air_date) result.first_air_date = t.first_air_date;
            if (t.runtime)        result.runtime        = t.runtime;
            if (t.episode_run_time && t.episode_run_time.length) result.runtime = t.episode_run_time[0] || 0;
            if (t.number_of_seasons)  result.number_of_seasons  = t.number_of_seasons;
            if (t.number_of_episodes) result.number_of_episodes = t.number_of_episodes;
            if (t.tagline) result.tagline = t.tagline;

            var credits  = t.credits || {};
            var castList = (credits.cast || []).slice(0, 20).map(function(a) {
                return {
                    id: a.id, name: a.name, character: a.character || '',
                    profile_path: a.profile_path || '',
                    img: a.profile_path ? TMDB_IMG + 'w185' + a.profile_path : '',
                    known_for_department: 'Acting',
                };
            });
            var crewList = (credits.crew || []).filter(function(c) {
                return c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay';
            }).slice(0, 5).map(function(c) {
                return {
                    id: c.id, name: c.name, job: c.job,
                    profile_path: c.profile_path || '',
                    img: c.profile_path ? TMDB_IMG + 'w185' + c.profile_path : '',
                    known_for_department: c.department || '',
                };
            });
            if (castList.length || crewList.length) {
                result.credits   = { cast: castList, crew: crewList };
                result.persons   = castList.concat(crewList);
                result.actors    = castList;
                result.directors = crewList.filter(function(c){ return c.job === 'Director'; });
            }

            var similar = (t.similar && t.similar.results) || [];
            var recomm  = (t.recommendations && t.recommendations.results) || [];
            var simAll  = recomm.length ? recomm : similar;
            if (simAll.length) {
                result.similar = simAll.slice(0, 20).map(function(s) {
                    return {
                        id:             s.id,
                        title:          s.title || s.name || '',
                        name:           s.name  || s.title || '',
                        original_title: s.original_title || s.original_name || '',
                        original_name:  s.original_name  || s.original_title || '',
                        poster_path:    s.poster_path  || '',
                        backdrop_path:  s.backdrop_path || '',
                        img:            s.poster_path ? TMDB_IMG + 'w300' + s.poster_path : '',
                        vote_average:   s.vote_average || 0,
                        overview:       s.overview || '',
                        release_date:   s.release_date   || s.first_air_date || '',
                        first_air_date: s.first_air_date || s.release_date   || '',
                        media_type:     s.media_type || (t.first_air_date ? 'tv' : 'movie'),
                        source:         SOURCE_NAME,
                    };
                });
            }

            result.tmdb    = { id: String(t.id), type: t.first_air_date ? 'tv' : 'movie' };
            result.tmdb_id = String(t.id);
        } catch(e) { console.warn('[KKPhim] applyTMDB:', e); }
    }

    function enrichWithTMDB(result, movie, onDone) {
        var info        = getTmdbInfo(movie);
        var searchTitle = movie.origin_name || movie.name || '';
        var searchYear  = movie.year ? String(movie.year) : '';

        function done(t) { applyTMDB(result, t); onDone(result, t); }

        if (info.id) {
            fetchTMDBDetail(info.id, info.type, done);
        } else if (searchTitle) {
            searchTMDB(searchTitle, searchYear, info.type, function(foundId) {
                if (foundId) fetchTMDBDetail(String(foundId), info.type, done);
                else {
                    var other = info.type === 'movie' ? 'tv' : 'movie';
                    searchTMDB(searchTitle, searchYear, other, function(foundId2) {
                        if (foundId2) fetchTMDBDetail(String(foundId2), other, done);
                        else onDone(result, null);
                    });
                }
            });
        } else {
            onDone(result, null);
        }
    }

    // =========================================================
    // DANH MUC
    // =========================================================
    var CATEGORIES = [
        { url: '/danh-sach/phim-moi-cap-nhat',  title: 'Phim mới cập nhật' },
        { url: '/v1/api/danh-sach/phim-le',     title: 'Phim lẻ'           },
        { url: '/v1/api/danh-sach/phim-bo',     title: 'Phim bộ'           },
        { url: '/v1/api/danh-sach/hoat-hinh',   title: 'Hoạt hình'         },
        { url: '/v1/api/danh-sach/tv-shows',    title: 'TV Shows'           },
        { url: '/v1/api/the-loai/hanh-dong',    title: 'Hành Động'         },
        { url: '/v1/api/the-loai/tinh-cam',     title: 'Tình Cảm'          },
        { url: '/v1/api/the-loai/hai-huoc',     title: 'Hài Hước'          },
        { url: '/v1/api/the-loai/kinh-di',      title: 'Kinh Dị'           },
        { url: '/v1/api/the-loai/vo-thuat',     title: 'Võ Thuật'          },
        { url: '/v1/api/the-loai/vien-tuong',   title: 'Viễn Tưởng'        },
        { url: '/v1/api/the-loai/phieu-luu',    title: 'Phiêu Lưu'         },
        { url: '/v1/api/the-loai/chinh-kich',   title: 'Chính Kịch'        },
        { url: '/v1/api/the-loai/tam-ly',       title: 'Tâm Lý'            },
        { url: '/v1/api/the-loai/the-thao',     title: 'Thể Thao'          },
        { url: '/v1/api/the-loai/am-nhac',      title: 'Âm Nhạc'           },
        { url: '/v1/api/the-loai/gia-dinh',     title: 'Gia Đình'          },
        { url: '/v1/api/the-loai/bi-an',        title: 'Bí Ẩn'             },
        { url: '/v1/api/the-loai/tai-lieu',     title: 'Tài Liệu'          },
        { url: '/v1/api/the-loai/chien-tranh',  title: 'Chiến Tranh'       },
    ];

    function fetchPage(catUrl, page, onOk, onFail) {
        var net = new Lampa.Reguest();
        var sep = catUrl.indexOf('?') >= 0 ? '&' : '?';
        net.silent(BASE_URL + catUrl + sep + 'page=' + page, function(data) {
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
            } catch(e) {}
            onOk({ items: items, page: page, totalPages: totalPages, totalItems: totalItems });
        }, onFail || function() {});
    }

    // =========================================================
    // EPISODES
    // =========================================================
    var _epsCache = {};

    function fetchEpisodes(slug, callback) {
        if (_epsCache[slug]) { callback(_epsCache[slug]); return; }
        var net = new Lampa.Reguest();
        net.silent(BASE_URL + '/phim/' + slug, function(res) {
            _epsCache[slug] = res.episodes || [];
            callback(_epsCache[slug]);
        }, function() { callback([]); });
    }

    function playEpisode(card, ep, playlist, idx) {
        var link = ep.link_m3u8 || ep.link_embed || '';
        if (!link) { Lampa.Noty.show('Không có link phim'); return; }
        Lampa.Player.play({ url: link, title: card.title || '', poster: card.img || card.poster || '' });
        if (playlist && playlist.length) Lampa.Player.playlist(playlist, idx || 0);
    }

    function showEpisodeMenu(card, episodes) {
        if (!episodes || !episodes.length) { Lampa.Noty.show('Không có link phim'); return; }
        // Single server, single episode
        if (episodes.length === 1 && (episodes[0].server_data || []).length === 1) {
            var ep0 = episodes[0].server_data[0];
            playEpisode(card, ep0, null, 0);
            return;
        }
        // Single server, multiple episodes
        if (episodes.length === 1) {
            showEpSelect(card, episodes[0]);
            return;
        }
        // Multiple servers
        Lampa.Select.show({
            title: 'Chọn server',
            items: episodes.map(function(srv, si) {
                return { title: srv.server_name || ('Server ' + (si + 1)), index: si };
            }),
            onSelect: function(item) { showEpSelect(card, episodes[item.index]); },
        });
    }

    function showEpSelect(card, server) {
        var data = server.server_data || [];
        if (!data.length) { Lampa.Noty.show('Không có tập phim'); return; }
        if (data.length === 1) {
            var playlist1 = data.map(function(ep){ return { url: ep.link_m3u8 || ep.link_embed || '', title: (card.title || '') + ' - ' + (ep.name || '') }; });
            playEpisode(card, data[0], playlist1, 0);
            return;
        }
        var playlist = data.map(function(ep) {
            return { url: ep.link_m3u8 || ep.link_embed || '', title: (card.title || '') + ' - ' + (ep.name || '') };
        });
        Lampa.Select.show({
            title: server.server_name || 'Chọn tập',
            items: data.map(function(ep, idx) { return { title: ep.name || ('Tập ' + (idx + 1)), index: idx }; }),
            onSelect: function(item) { playEpisode(card, data[item.index], playlist, item.index); },
        });
    }

    // =========================================================
    // GENRE SLUG
    // =========================================================
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

    // =========================================================
    // CSS
    // =========================================================
    function injectCSS() {
        if (document.getElementById('kkp-v5-style')) return;
        var s = document.createElement('style');
        s.id = 'kkp-v5-style';
        s.textContent = [
            /* Ẩn type badges của Lampa gốc */
            '.card__type{display:none!important}',
            '.card-label--type{display:none!important}',
            '.item__type{display:none!important}',
            '.full-start__genres{display:none!important}',
            '.full-start-new__genres{display:none!important}',
            /* KKPhim persons row dùng class Lampa */
            '.kkp-persons-scroll{display:flex;gap:1em;overflow-x:auto;padding:0.5em 0;-webkit-overflow-scrolling:touch;scrollbar-width:none;}',
            '.kkp-persons-scroll::-webkit-scrollbar{display:none;}',
            '.kkp-similar-scroll{display:flex;gap:0.6em;overflow-x:auto;padding:0.4em 0;-webkit-overflow-scrolling:touch;scrollbar-width:none;}',
            '.kkp-similar-scroll::-webkit-scrollbar{display:none;}',
            '.kkp-ep-chips{display:flex;flex-wrap:wrap;gap:0.4em;padding:0.4em 0;}',
            /* Settings */
            '.kkp-stg-wrap{padding:1em 1.5em;}',
            '.kkp-stg-title{font-size:1.4em;font-weight:800;margin-bottom:1em;color:#fff;}',
            '.kkp-stg-group{margin-bottom:1.5em;}',
            '.kkp-stg-group-title{font-size:0.8em;text-transform:uppercase;letter-spacing:0.1em;opacity:0.45;margin-bottom:0.5em;}',
            '.kkp-stg-item{display:flex;justify-content:space-between;align-items:center;padding:0.6em 0.8em;border-radius:0.4em;cursor:pointer;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);margin-bottom:0.3em;transition:background 0.15s;}',
            '.kkp-stg-item:hover,.kkp-stg-item.focus,.kkp-stg-item.selected{background:rgba(1,180,228,0.15);border-color:rgba(1,180,228,0.4);}',
            '.kkp-stg-item-label{flex:1;}',
            '.kkp-stg-item-name{font-size:0.95em;color:rgba(255,255,255,0.9);}',
            '.kkp-stg-item-desc{font-size:0.78em;color:rgba(255,255,255,0.4);margin-top:0.1em;}',
            '.kkp-stg-item-val{font-size:0.9em;color:#4ade80;font-weight:600;white-space:nowrap;margin-left:1em;}',
            '.kkp-stg-item-val--off{color:rgba(255,255,255,0.3);}',
            '.kkp-stg-ver{font-size:0.75em;opacity:0.3;text-align:center;padding-top:1em;}',
            /* Main page */
            '.kkp-main-wrap{padding-bottom:2em;}',
            '.kkp-topbar{display:flex;align-items:center;justify-content:space-between;padding:0.8em 1.5em 0.4em;}',
            '.kkp-topbar-title{font-size:1.4em;font-weight:800;color:#01b4e4;}',
            '.kkp-topbar-btns{display:flex;gap:0.5em;}',
            '.kkp-topbtn{padding:0.4em 1em;border-radius:2em;font-size:0.85em;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);transition:all 0.15s;}',
            '.kkp-topbtn:hover,.kkp-topbtn.focus,.kkp-topbtn.selected{background:rgba(1,180,228,0.2);border-color:rgba(1,180,228,0.5);color:#fff;}',
            '.kkp-tabs{display:flex;gap:0.5em;padding:0.4em 1.5em 0.6em;flex-wrap:wrap;}',
            '.kkp-tab{padding:0.45em 1.1em;border-radius:2em;font-size:0.9em;cursor:pointer;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.55);background:rgba(255,255,255,0.04);transition:all 0.15s;}',
            '.kkp-tab--active{background:rgba(1,180,228,0.18);border-color:rgba(1,180,228,0.5);color:#01b4e4;font-weight:600;}',
            /* Row */
            '.kkp-row{padding:0 0 1.2em;}',
            '.kkp-row-head{display:flex;align-items:center;justify-content:space-between;padding:0.3em 1.5em 0.5em;}',
            '.kkp-row-title{font-size:1.1em;font-weight:700;color:#fff;}',
            '.kkp-row-more{font-size:0.82em;opacity:0.6;cursor:pointer;padding:0.2em 0.6em;border-radius:1em;border:1px solid rgba(255,255,255,0.2);transition:all 0.15s;}',
            '.kkp-row-more:hover,.kkp-row-more.focus,.kkp-row-more.selected{opacity:1;background:rgba(255,255,255,0.1);}',
            '.kkp-row-list{display:flex;gap:0.6em;overflow-x:auto;padding:0 1.5em 0.5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;}',
            '.kkp-row-list::-webkit-scrollbar{display:none;}',
            /* Card */
            '.kkp-card{flex:0 0 auto;width:8em;cursor:pointer;border-radius:0.4em;overflow:hidden;background:rgba(255,255,255,0.04);transition:transform 0.15s,background 0.15s;}',
            '.kkp-card:hover,.kkp-card.focus,.kkp-card.selected{transform:scale(1.04);background:rgba(255,255,255,0.08);}',
            '.kkp-card-img{width:100%;aspect-ratio:2/3;overflow:hidden;position:relative;background:#111;}',
            '.kkp-card-img img{width:100%;height:100%;object-fit:cover;}',
            '.kkp-card-info{padding:0.35em 0.4em 0.45em;}',
            '.kkp-card-name{font-size:0.78em;font-weight:600;color:rgba(255,255,255,0.9);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3;}',
            '.kkp-card-year{font-size:0.68em;color:rgba(255,255,255,0.35);margin-top:0.15em;}',
            '.kkp-card-score{position:absolute;bottom:0.3em;right:0.3em;background:rgba(0,0,0,0.7);border-radius:0.25em;padding:0.1em 0.35em;font-size:0.68em;font-weight:700;color:#f9d77e;}',
            /* Grid infinite */
            '.kkp-grid-wrap{padding:0 1.5em 2em;}',
            '.kkp-grid-title{font-size:1.2em;font-weight:700;padding:0.8em 0 0.6em;color:#fff;}',
            '.kkp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.6em;}',
            '.kkp-grid .kkp-card{width:auto;flex:none;}',
            '.kkp-loadmore{text-align:center;padding:1em;opacity:0.4;font-size:0.85em;}',
            '.kkp-spinner{text-align:center;padding:1em;opacity:0.5;font-size:0.85em;}',
            /* Person card */
            '.kkp-person-card{flex:0 0 auto;width:6em;text-align:center;cursor:pointer;}',
            '.kkp-person-avatar{width:5em;height:5em;border-radius:50%;overflow:hidden;margin:0 auto 0.4em;background:rgba(255,255,255,0.1);}',
            '.kkp-person-avatar img{width:100%;height:100%;object-fit:cover;}',
            '.kkp-person-name{font-size:0.75em;font-weight:600;color:rgba(255,255,255,0.85);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
            '.kkp-person-role{font-size:0.65em;color:rgba(255,255,255,0.4);margin-top:0.1em;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}',
            /* Episode chip */
            '.kkp-ep-chip{padding:0.4em 0.85em;border-radius:0.35em;font-size:0.82em;cursor:pointer;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.85);transition:all 0.12s;white-space:nowrap;}',
            '.kkp-ep-chip:hover,.kkp-ep-chip.focus,.kkp-ep-chip.selected{background:rgba(1,180,228,0.25);border-color:rgba(1,180,228,0.6);color:#fff;}',
            /* Genre tags */
            '.kkp-genre-tags{display:flex;flex-wrap:wrap;gap:0.4em;padding:0.5em 1.5em;}',
            '.kkp-genre-tag{padding:0.3em 0.8em;border-radius:2em;font-size:0.8em;cursor:pointer;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.75);transition:all 0.12s;}',
            '.kkp-genre-tag:hover,.kkp-genre-tag.focus,.kkp-genre-tag.selected{background:rgba(1,180,228,0.2);border-color:rgba(1,180,228,0.5);color:#fff;}',
            /* Play button */
            '.kkp-play-btn{display:inline-flex;align-items:center;gap:0.5em;padding:0.5em 1.2em;border-radius:0.4em;font-size:0.9em;font-weight:700;cursor:pointer;background:rgba(1,180,228,0.18);border:1px solid rgba(1,180,228,0.4);color:#01b4e4;transition:all 0.15s;margin:0.5em 1.5em;}',
            '.kkp-play-btn:hover,.kkp-play-btn.focus,.kkp-play-btn.selected{background:rgba(1,180,228,0.35);color:#fff;}',
        ].join('\n');
        document.head.appendChild(s);
    }

    // =========================================================
    // CARD BUILDER (Lampa-style similar cards)
    // =========================================================
    function buildCard(item, onClick) {
        var poster = item.img || item.poster || (item.poster_path ? TMDB_IMG + 'w300' + item.poster_path : '');
        var year   = (item.release_date || item.first_air_date || '').slice(0, 4);
        var score  = item.vote_average ? Number(item.vote_average).toFixed(1) : '';

        var $card = $(
            '<div class="kkp-card selector">' +
            '<div class="kkp-card-img">' +
            (poster ? '<img src="' + poster + '" loading="lazy" onerror="this.style.opacity=\'0.2\'">' : '') +
            (score  ? '<div class="kkp-card-score">' + score + '</div>' : '') +
            '</div>' +
            '<div class="kkp-card-info">' +
            '<div class="kkp-card-name">' + (item.title || item.name || '') + '</div>' +
            (year ? '<div class="kkp-card-year">' + year + '</div>' : '') +
            '</div></div>'
        );
        $card.on('hover:enter click', onClick);
        return $card;
    }

    function buildPersonCard(person, onClick) {
        var img = person.profile_path
            ? TMDB_IMG + 'w185' + person.profile_path
            : (person.img || '');
        var $p = $(
            '<div class="kkp-person-card selector">' +
            '<div class="kkp-person-avatar">' +
            (img ? '<img src="' + img + '" loading="lazy">' : '') +
            '</div>' +
            '<div class="kkp-person-name">' + (person.name || '') + '</div>' +
            (person.character || person.job
                ? '<div class="kkp-person-role">' + (person.character || person.job || '') + '</div>'
                : '') +
            '</div>'
        );
        if (onClick) $p.on('hover:enter click', onClick);
        return $p;
    }

    // =========================================================
    // ROW BUILDER (dùng Lampa items-line style)
    // =========================================================
    function buildRow(title, moreText, onMore) {
        var $head = $('<div class="kkp-row-head"></div>');
        $head.append('<div class="kkp-row-title">' + title + '</div>');
        if (moreText && onMore) {
            var $more = $('<div class="kkp-row-more selector">' + moreText + ' ›</div>');
            $more.on('hover:enter click', onMore);
            $head.append($more);
        }
        var $list = $('<div class="kkp-row-list"></div>');
        var $row  = $('<div class="kkp-row"></div>').append($head).append($list);
        return { row: $row, list: $list };
    }

    // =========================================================
    // SIMILAR ROWS - dùng Lampa card native (items--small)
    // =========================================================
    function buildSimilarRow(items, title) {
        if (!items || !items.length) return null;
        var $scroll = $('<div class="kkp-similar-scroll"></div>');
        items.forEach(function(item) {
            var $c = buildCard(item, function() {
                if (item.source === SOURCE_NAME) {
                    Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
                } else {
                    var mt = item.media_type || 'movie';
                    Lampa.Activity.push({ url: '', component: 'full', source: 'tmdb', id: item.id, card: item, media_type: mt });
                }
            });
            $scroll.append($c);
        });
        var $sect = $('<div class="kkp-row"></div>');
        $sect.append('<div class="kkp-row-head"><div class="kkp-row-title">' + (title || 'Phim liên quan') + '</div></div>');
        $sect.append($scroll);
        return $sect;
    }

    // =========================================================
    // API SOURCE
    // =========================================================
    function KKPhimApi() {
        var self     = this;
        self.network = new Lampa.Reguest();

        self.list = function(params, onComplete, onError) {
            var page   = params.page || 1;
            var catUrl = params.cat_url || params.url || '/danh-sach/phim-moi-cap-nhat';

            fetchPage(catUrl, page, function(res) {
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

        self.category = function(params, onComplete, onError) {
            var parts = CATEGORIES.map(function(cat) {
                return function(cb) {
                    fetchPage(cat.url, 1, function(res) {
                        cb({ title: cat.title, results: res.items, url: cat.url, cat_url: cat.url,
                             page: 1, total_pages: res.totalPages, source: SOURCE_NAME });
                    }, function() { cb({ title: cat.title, results: [], url: cat.url, cat_url: cat.url }); });
                };
            });
            Lampa.Api.partNext(parts, 2, onComplete, onError);
        };

        self.full = function(params, onComplete, onError) {
            var card = params.card || {};
            var slug = card.kkphim_slug || card.id;
            if (!slug) { if (onError) onError('no slug'); return; }

            self.network.silent(BASE_URL + '/phim/' + slug, function(data) {
                var movie    = data.movie    || {};
                var episodes = data.episodes || [];
                _epsCache[slug] = episodes;

                var result = normalizeItem(movie);
                result.overview        = movie.content || '';
                result.kkphim_episodes = episodes;

                var isSeries = movie.type !== 'single' && episodes.length > 0;
                if (isSeries) {
                    var seasons = [];
                    episodes.forEach(function(server, si) {
                        var eps = (server.server_data || []).map(function(ep, ei) {
                            return {
                                episode_number: ei + 1,
                                season_number:  si + 1,
                                name:           ep.name || ('Tập ' + (ei + 1)),
                                overview:       '',
                                still_path:     '',
                                air_date:       '',
                                link_m3u8:      ep.link_m3u8  || '',
                                link_embed:     ep.link_embed || '',
                            };
                        });
                        seasons.push({
                            season_number: si + 1,
                            name:          server.server_name || ('Server ' + (si + 1)),
                            episode_count: eps.length,
                            episodes:      eps,
                            overview:      '',
                            poster_path:   '',
                            air_date:      '',
                        });
                    });
                    result.number_of_seasons  = seasons.length;
                    result.number_of_episodes = (episodes[0] && episodes[0].server_data) ? episodes[0].server_data.length : 0;
                    result.seasons            = seasons;
                    result.season_number      = 1;
                    result.type               = 'tv';
                    result.media_type         = 'tv';
                }

                // Cast từ KKPhim
                var kkActors = (movie.actor || []).filter(Boolean).map(function(n, i) {
                    return { id: 'kk-' + i, name: n, character: '', profile_path: '', img: '', known_for_department: 'Acting' };
                });
                var kkDirs = (movie.director || []).filter(Boolean).map(function(n, i) {
                    return { id: 'kk-dir-' + i, name: n, job: 'Director', profile_path: '', img: '', known_for_department: 'Directing' };
                });
                if (kkActors.length || kkDirs.length) {
                    result.credits   = { cast: kkActors, crew: kkDirs };
                    result.persons   = kkActors.concat(kkDirs);
                    result.actors    = kkActors;
                    result.directors = kkDirs;
                }

                enrichWithTMDB(result, movie, function(enriched) {
                    onComplete({ movie: enriched });
                });
            }, onError);
        };

        self.search = function(params, onComplete, onError) {
            var q = encodeURIComponent(params.query || '');
            self.network.silent(BASE_URL + '/v1/api/tim-kiem?keyword=' + q, function(data) {
                var items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : [];
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
        };

        self.seasons = function(card, seasons, onComplete) {
            if (seasons && seasons.length) { onComplete(seasons); return; }
            var slug = card.kkphim_slug || card.id;
            if (!slug) { onComplete([]); return; }
            fetchEpisodes(slug, function(eps) {
                var result = [];
                eps.forEach(function(server, si) {
                    var episodes = (server.server_data || []).map(function(ep, ei) {
                        return {
                            episode_number: ei + 1, season_number: si + 1,
                            name: ep.name || ('Tập ' + (ei + 1)),
                            overview: '', still_path: '', air_date: '',
                            link_m3u8: ep.link_m3u8 || '', link_embed: ep.link_embed || '',
                        };
                    });
                    result.push({ season_number: si + 1, name: server.server_name || ('Server ' + (si + 1)), episode_count: episodes.length, episodes: episodes });
                });
                onComplete(result);
            });
        };

        self.seasonEpisodes = function(params, onComplete, onError) {
            var card = params.card || {};
            var sNum = params.season || params.season_number || 1;
            var slug = card.kkphim_slug || card.id;
            if (!slug) { if (onError) onError('no slug'); return; }
            fetchEpisodes(slug, function(allEps) {
                var server   = allEps[sNum - 1] || allEps[0] || {};
                var episodes = (server.server_data || []).map(function(ep, ei) {
                    return {
                        episode_number: ei + 1, season_number: sNum,
                        name: ep.name || ('Tập ' + (ei + 1)),
                        overview: '', still_path: '', air_date: '',
                        link_m3u8: ep.link_m3u8 || '', link_embed: ep.link_embed || '',
                    };
                });
                onComplete({ episodes: episodes });
            });
        };

        self.episodeDetail = function(params, onComplete, onError) {
            var card  = params.card || {};
            var sNum  = params.season  || params.season_number  || 1;
            var epNum = params.episode || params.episode_number || 1;
            var slug  = card.kkphim_slug || card.id;
            if (!slug) { if (onError) onError('no slug'); return; }
            fetchEpisodes(slug, function(allEps) {
                var server = allEps[sNum - 1] || allEps[0] || {};
                var epData = (server.server_data || [])[epNum - 1] || {};
                onComplete({
                    episode_number: epNum, season_number: sNum,
                    name:        epData.name || ('Tập ' + epNum),
                    overview:    '', still_path: card.backdrop_path || '', air_date: '',
                    link_m3u8:   epData.link_m3u8  || '',
                    link_embed:  epData.link_embed || '',
                });
            });
        };

        self.person = function(params, onComplete, onError) {
            var card = params.card || params.movie || params.item || {};
            var info = getTmdbInfo(card);
            if (!info.id) {
                var fb = card.credits || { cast: [], crew: [] };
                onComplete({ persons: (fb.cast || []).concat(fb.crew || []), cast: fb.cast || [], crew: fb.crew || [], actors: fb.cast || [], directors: (fb.crew || []).filter(function(c){ return c.job === 'Director'; }) });
                return;
            }
            tmdbAjax(TMDB_BASE + '/' + info.type + '/' + info.id + '/credits?language=' + _tmdbLang(), function(data) {
                var mapP = function(p, extra) { return Object.assign({ id: p.id, name: p.name, img: p.profile_path ? TMDB_IMG + 'w185' + p.profile_path : '', profile_path: p.profile_path || '', character: p.character || '', role: p.character || p.job || '' }, extra || {}); };
                var cast = (data.cast || []).slice(0, 20).map(function(a){ return mapP(a, { known_for_department: 'Acting' }); });
                var crew = (data.crew || []).filter(function(c){ return c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay'; }).slice(0, 5).map(function(c){ return mapP(c, { job: c.job, known_for_department: c.department }); });
                onComplete({ persons: cast.concat(crew), cast: cast, crew: crew, actors: cast, directors: crew.filter(function(c){ return c.job === 'Director'; }) });
            }, function(){ if (onError) onError('failed'); });
        };

        self.similar = function(params, onComplete, onError) {
            var card = params.card || {};
            var info = getTmdbInfo(card);
            var fmt  = function(results, mt) {
                return results.slice(0, 20).map(function(s) {
                    return { id: s.id, title: s.title || s.name || '', name: s.name || s.title || '', poster_path: s.poster_path || '', img: s.poster_path ? TMDB_IMG + 'w300' + s.poster_path : '', vote_average: s.vote_average || 0, release_date: s.release_date || s.first_air_date || '', first_air_date: s.first_air_date || s.release_date || '', media_type: s.media_type || mt, source: SOURCE_NAME };
                });
            };
            if (info.id) {
                tmdbAjax(TMDB_BASE + '/' + info.type + '/' + info.id + '/recommendations?language=' + _tmdbLang() + '&page=1', function(data) {
                    var res = (data && data.results) || [];
                    if (res.length) { onComplete({ results: fmt(res, info.type) }); return; }
                    tmdbAjax(TMDB_BASE + '/' + info.type + '/' + info.id + '/similar?language=' + _tmdbLang() + '&page=1', function(data2) {
                        onComplete({ results: fmt((data2 && data2.results) || [], info.type) });
                    }, function(){ _fallbackSimilar(card, onComplete); });
                }, function(){ _fallbackSimilar(card, onComplete); });
            } else {
                _fallbackSimilar(card, onComplete);
            }
        };

        function _fallbackSimilar(card, onComplete) {
            var gi = getGenreSlug(card);
            if (!gi) { onComplete({ results: [] }); return; }
            var cardSlug = card.kkphim_slug || card.id;
            var net1 = new Lampa.Reguest();
            net1.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=1', function(fd) {
                var tp = 1;
                try { var p = fd.data && fd.data.params && fd.data.params.pagination; tp = (p && p.totalPages) || 1; } catch(e) {}
                var rp = Math.max(1, Math.floor(Math.random() * Math.min(tp, 10)) + 1);
                var net2 = new Lampa.Reguest();
                net2.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=' + rp, function(data2) {
                    var items = [];
                    try { items = (data2.data && data2.data.items) ? data2.data.items.map(normalizeItem) : []; } catch(e) {}
                    onComplete({ results: items.filter(function(i){ return i.id !== cardSlug; }).sort(function(){ return Math.random() - 0.5; }).slice(0, 20) });
                }, function(){ onComplete({ results: [] }); });
            }, function(){ onComplete({ results: [] }); });
        }

        self.clear = function() { self.network.clear(); };
    }

    // =========================================================
    // MAIN COMPONENT - dùng Lampa.Scroll
    // =========================================================
    Lampa.Component.add('kkphim_main', function(objParam) {
        var scroll       = new Lampa.Scroll({ mask: true, over: true });
        var comp         = this;
        var currentTab   = (objParam && objParam._tab) || 'kkphim';
        var $content, $tabKK, $tabTMDB;

        this.create = function() {
            comp.activity.loader(true);
            setupScroll();
            var $wrap = $('<div class="kkp-main-wrap"></div>');

            // Topbar
            var $topbar = $('<div class="kkp-topbar"></div>');
            $topbar.append('<div class="kkp-topbar-title">KKPhim</div>');
            var $btns = $('<div class="kkp-topbar-btns"></div>');
            var $search = $('<div class="kkp-topbtn selector">🔍 Tìm kiếm</div>');
            var $settings = $('<div class="kkp-topbtn selector">⚙ Cài đặt</div>');
            $search.on('hover:enter click', function() { doSearch(); });
            $settings.on('hover:enter click', function() {
                Lampa.Activity.push({ url: '', title: 'Cài đặt', component: 'kkphim_settings' });
            });
            $btns.append($search).append($settings);
            $topbar.append($btns);
            $wrap.append($topbar);

            // Tabs
            var $tabs = $('<div class="kkp-tabs"></div>');
            $tabKK   = $('<div class="kkp-tab selector ' + (currentTab === 'kkphim' ? 'kkp-tab--active' : '') + '">KKPhim</div>');
            $tabTMDB = $('<div class="kkp-tab selector ' + (currentTab === 'tmdb'   ? 'kkp-tab--active' : '') + '">TMDB</div>');
            $tabKK.on('hover:enter click',   function() { switchTab('kkphim'); });
            $tabTMDB.on('hover:enter click', function() { switchTab('tmdb');   });
            $tabs.append($tabKK).append($tabTMDB);
            $wrap.append($tabs);

            $content = $('<div class="kkp-tab-content"></div>');
            $wrap.append($content);
            scroll.append($wrap);

            loadTab(currentTab);

            function switchTab(tab) {
                if (currentTab === tab) return;
                currentTab = tab;
                $tabKK.toggleClass('kkp-tab--active',   tab === 'kkphim');
                $tabTMDB.toggleClass('kkp-tab--active', tab === 'tmdb');
                $content.empty();
                comp.activity.loader(true);
                loadTab(tab);
            }
        };

        function loadTab(tab) {
            if (tab === 'tmdb') loadTMDBTab();
            else loadKKPhimTab();
        }

        function loadKKPhimTab() {
            var cats = [
                { name: 'Phim mới cập nhật',  api: 'danh-sach/phim-moi-cap-nhat' },
                { name: 'Phim lẻ',            api: 'v1/api/danh-sach/phim-le'    },
                { name: 'Phim bộ',            api: 'v1/api/danh-sach/phim-bo'    },
                { name: 'Hoạt hình',          api: 'v1/api/danh-sach/hoat-hinh'  },
                { name: 'TV Shows',            api: 'v1/api/danh-sach/tv-shows'   },
            ];
            var loaded = 0;
            cats.forEach(function(cat) {
                var apiUrl = '/' + cat.api;
                $.ajax({
                    url: BASE_URL + apiUrl + '?page=1', type: 'GET',
                    success: function(res) {
                        var list = ((res && res.data && res.data.items) || (res && res.items) || []).filter(function(i){ return i && i.slug; });
                        if (list.length) {
                            var items = list.slice(0, 20).map(normalizeItem);
                            var r = buildRow(cat.name, 'Xem thêm', function() {
                                Lampa.Activity.push({ title: cat.name, component: 'kkphim_grid', cat_url: apiUrl, source: SOURCE_NAME, page: 1 });
                            });
                            items.forEach(function(item) {
                                r.list.append(buildCard(item, function() {
                                    Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
                                }));
                            });
                            $content.append(r.row);
                        }
                        loaded++;
                        if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); }
                    },
                    error: function() {
                        loaded++;
                        if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); }
                    }
                });
            });
        }

        function loadTMDBTab() {
            var secs = [
                { name: 'Xu hướng hôm nay',  path: '/trending/all/day?language='    + _tmdbLang() + '&page=1', type: 'multi' },
                { name: 'Phim lẻ phổ biến',  path: '/movie/popular?language='       + _tmdbLang() + '&page=1', type: 'movie' },
                { name: 'Phim bộ phổ biến',  path: '/tv/popular?language='          + _tmdbLang() + '&page=1', type: 'tv'    },
                { name: 'Đang chiếu rạp',    path: '/movie/now_playing?language='   + _tmdbLang() + '&page=1', type: 'movie' },
                { name: 'Top phim lẻ',       path: '/movie/top_rated?language='     + _tmdbLang() + '&page=1', type: 'movie' },
                { name: 'Top phim bộ',       path: '/tv/top_rated?language='        + _tmdbLang() + '&page=1', type: 'tv'    },
            ];
            var loaded = 0;
            secs.forEach(function(sec) {
                tmdbAjax(TMDB_BASE + sec.path, function(data) {
                    var results = (data.results || []).filter(function(i){ return i.media_type !== 'person'; });
                    if (results.length) {
                        var r = buildRow(sec.name, 'Xem thêm', null);
                        results.slice(0, 20).forEach(function(item) {
                            if (!item.media_type) item.media_type = sec.type;
                            var d = {
                                id: item.id, title: item.title || item.name || '',
                                name: item.name || item.title || '',
                                poster_path: item.poster_path || '',
                                backdrop_path: item.backdrop_path || '',
                                img: item.poster_path ? TMDB_IMG + 'w300' + item.poster_path : '',
                                vote_average: item.vote_average || 0,
                                release_date: item.release_date || item.first_air_date || '',
                                first_air_date: item.first_air_date || item.release_date || '',
                                media_type: item.media_type || sec.type,
                                source: 'tmdb',
                            };
                            r.list.append(buildCard(d, function() {
                                Lampa.Activity.push({ component: 'full', source: 'tmdb', id: d.id, card: d, media_type: d.media_type });
                            }));
                        });
                        $content.append(r.row);
                    }
                    loaded++;
                    if (loaded >= secs.length) { comp.activity.loader(false); comp.start(); }
                }, function() {
                    loaded++;
                    if (loaded >= secs.length) { comp.activity.loader(false); comp.start(); }
                });
            });
        }

        function doSearch() {
            try {
                if (Lampa.Input && Lampa.Input.edit) {
                    Lampa.Input.edit({ title: 'Tìm kiếm KKPhim', value: '', free: true }, function(kw) {
                        if (!kw) return;
                        Lampa.Activity.push({ url: '', title: kw.trim(), component: 'kkphim_search', keyword: kw.trim(), source: SOURCE_NAME, page: 1 });
                    });
                    return;
                }
            } catch(e) {}
            var kw = window.prompt('Tìm kiếm:');
            if (kw && kw.trim()) {
                Lampa.Activity.push({ url: '', title: kw.trim(), component: 'kkphim_search', keyword: kw.trim(), source: SOURCE_NAME, page: 1 });
            }
        }

        function setupScroll() {
            var el = scroll.render();
            el.css({ overflow: 'hidden', position: 'relative', height: '100%' });
            var b = el.find('.scroll__body');
            b.css({ 'overflow-y': 'auto', 'overflow-x': 'hidden', '-webkit-overflow-scrolling': 'touch', height: '100%', 'padding-bottom': '5em' });
        }

        this.start = function() {
            Lampa.Controller.add('content', {
                toggle:  function() { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); },
                left:    function() { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right:   function() { Navigator.move('right'); },
                up:      function() { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down:    function() { Navigator.move('down'); },
                back:    function() { Lampa.Activity.backward(); }
            });
            setTimeout(function() { Lampa.Controller.toggle('content'); Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, 0);
        };
        this.pause   = function() {};
        this.stop    = function() {};
        this.render  = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    });

    // =========================================================
    // GRID INFINITE SCROLL
    // =========================================================
    Lampa.Component.add('kkphim_grid', function(obj) {
        var scroll   = new Lampa.Scroll({ mask: true, over: true });
        var comp     = this;
        var catUrl   = obj.cat_url || '/danh-sach/phim-moi-cap-nhat';
        var page     = 1, totalPages = 1, loading = false;

        this.create = function() {
            comp.activity.loader(true);
            setupScroll();
            var $wrap = $('<div class="kkp-grid-wrap"></div>');
            $wrap.append('<div class="kkp-grid-title">' + (obj.title || 'KKPhim') + '</div>');
            var $grid    = $('<div class="kkp-grid"></div>');
            var $spinner = $('<div class="kkp-spinner" style="display:none">Đang tải...</div>');
            var $end     = $('<div class="kkp-loadmore" style="display:none">— Đã tải hết —</div>');
            $wrap.append($grid).append($spinner).append($end);
            scroll.append($wrap);

            scroll.render().find('.scroll__body').on('scroll', function() {
                var el = this;
                if (!loading && page <= totalPages && el.scrollTop + el.clientHeight >= el.scrollHeight - 500) {
                    loadPage();
                }
            });

            loadPage();

            function loadPage() {
                loading = true;
                $spinner.show();
                fetchPage(catUrl, page, function(res) {
                    totalPages = res.totalPages || 1;
                    res.items.forEach(function(item) {
                        var $c = buildCard(item, function() {
                            Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
                        });
                        $c.addClass('kkp-card--grid');
                        $grid.append($c);
                    });
                    $spinner.hide();
                    loading = false;
                    if (page >= totalPages) $end.show();
                    else page++;
                    comp.activity.loader(false);
                    comp.start();
                }, function() {
                    $spinner.hide();
                    loading = false;
                    comp.activity.loader(false);
                });
            }
        };

        function setupScroll() {
            var el = scroll.render();
            el.css({ overflow: 'hidden', position: 'relative', height: '100%' });
            var b = el.find('.scroll__body');
            b.css({ 'overflow-y': 'auto', 'overflow-x': 'hidden', '-webkit-overflow-scrolling': 'touch', height: '100%', 'padding-bottom': '5em' });
        }

        this.start = function() {
            Lampa.Controller.add('content', {
                toggle:  function() { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); },
                left:    function() { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right:   function() { Navigator.move('right'); },
                up:      function() { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down:    function() { Navigator.move('down'); },
                back:    function() { Lampa.Activity.backward(); }
            });
            setTimeout(function() { Lampa.Controller.toggle('content'); Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, 0);
        };
        this.pause   = function() {};
        this.stop    = function() {};
        this.render  = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    });

    // =========================================================
    // SEARCH COMPONENT
    // =========================================================
    Lampa.Component.add('kkphim_search', function(obj) {
        var scroll   = new Lampa.Scroll({ mask: true, over: true });
        var comp     = this;
        var kw       = obj.keyword || '';
        var page     = 1, done = false, loading = false;

        this.create = function() {
            comp.activity.loader(true);
            setupScroll();
            var $wrap = $('<div class="kkp-grid-wrap"></div>');
            $wrap.append('<div class="kkp-grid-title">🔍 ' + kw + '</div>');
            var $grid    = $('<div class="kkp-grid"></div>');
            var $spinner = $('<div class="kkp-spinner" style="display:none">Đang tải...</div>');
            var $end     = $('<div class="kkp-loadmore" style="display:none">Đã hết</div>');
            $wrap.append($grid).append($spinner).append($end);
            scroll.append($wrap);

            scroll.render().find('.scroll__body').on('scroll', function() {
                var el = this;
                if (!loading && !done && el.scrollTop + el.clientHeight >= el.scrollHeight - 400) {
                    doLoad();
                }
            });

            doLoad();

            function doLoad() {
                loading = true;
                $spinner.show();
                $.ajax({
                    url: BASE_URL + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&limit=30&page=' + page,
                    type: 'GET',
                    success: function(data) {
                        var items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : [];
                        $spinner.hide();
                        if (!items.length) {
                            done = true;
                            $end.show().text(page <= 1 ? 'Không tìm thấy kết quả' : 'Đã hết');
                        } else {
                            items.forEach(function(item) {
                                $grid.append(buildCard(item, function() {
                                    Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
                                }));
                            });
                            page++;
                        }
                        loading = false;
                        comp.activity.loader(false);
                        comp.start();
                    },
                    error: function() {
                        $spinner.hide();
                        loading = false;
                        done = true;
                        $end.show().text('Lỗi tải');
                        comp.activity.loader(false);
                    }
                });
            }
        };

        function setupScroll() {
            var el = scroll.render();
            el.css({ overflow: 'hidden', position: 'relative', height: '100%' });
            scroll.render().find('.scroll__body').css({ 'overflow-y': 'auto', '-webkit-overflow-scrolling': 'touch', height: '100%', 'padding-bottom': '5em' });
        }

        this.start = function() {
            Lampa.Controller.add('content', {
                toggle:  function() { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); },
                left:    function() { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right:   function() { Navigator.move('right'); },
                up:      function() { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down:    function() { Navigator.move('down'); },
                back:    function() { Lampa.Activity.backward(); }
            });
            setTimeout(function() { Lampa.Controller.toggle('content'); Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, 0);
        };
        this.pause   = function() {};
        this.stop    = function() {};
        this.render  = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    });

    // =========================================================
    // SETTINGS COMPONENT
    // =========================================================
    Lampa.Component.add('kkphim_settings', function() {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var comp   = this;

        function mkGroup(title) {
            return $('<div class="kkp-stg-group"></div>').append('<div class="kkp-stg-group-title">' + title + '</div>');
        }

        function mkItem(name, desc, value, isOn, cb) {
            var $it = $('<div class="kkp-stg-item selector"></div>');
            var valClass = (isOn === null || isOn === undefined) ? '' : (isOn ? '' : ' kkp-stg-item-val--off');
            $it.html(
                '<div class="kkp-stg-item-label">' +
                '<div class="kkp-stg-item-name">' + name + '</div>' +
                (desc ? '<div class="kkp-stg-item-desc">' + desc + '</div>' : '') +
                '</div>' +
                '<div class="kkp-stg-item-val' + valClass + '">' + (value !== undefined ? value : '') + '</div>'
            );
            if (isOn) $it.find('.kkp-stg-item-val').css('color', '#4ade80');
            if (cb) $it.on('hover:enter click', cb);
            return $it;
        }

        function mkToggle(name, desc, key, def, labels) {
            labels = labels || ['ON', 'OFF'];
            var cur = getSetting(key, def);
            var isOn = cur === true || cur === 'true' || cur === labels[0];
            var $it = mkItem(name, desc, isOn ? labels[0] : labels[1], isOn, function() {
                var newVal = !isOn;
                var o = {}; o[key] = newVal; ss(o);
                comp.create();
            });
            return $it;
        }

        function mkSelect(name, desc, key, def, options) {
            var cur = getSetting(key, def);
            var $g  = mkGroup(name);
            if (desc) $g.append('<div class="kkp-stg-item-desc" style="padding:0 0 0.4em 0.2em;opacity:0.5;font-size:0.8em;">' + desc + '</div>');
            options.forEach(function(opt) {
                var isOn = String(cur) === String(opt.k);
                $g.append(mkItem(opt.n, opt.d || '', isOn ? '✓' : '', isOn, function() {
                    var o = {}; o[key] = opt.k; ss(o);
                    comp.create();
                }));
            });
            return $g;
        }

        this.create = function() {
            scroll.render().find('.scroll__body').empty();
            var $w = $('<div class="kkp-stg-wrap"></div>');
            $w.append('<div class="kkp-stg-title">⚙ Cài đặt KKPhim</div>');

            // TMDB Language
            $w.append(mkSelect('Ngôn ngữ TMDB', '', 'tmdb_lang', 'vi-VN', [
                { k: 'vi-VN', n: 'Tiếng Việt' },
                { k: 'en-US', n: 'English' },
                { k: 'ja-JP', n: 'Japanese' },
                { k: 'ko-KR', n: 'Korean' },
                { k: 'zh-CN', n: 'Chinese' },
            ]));

            // Grid columns
            $w.append(mkSelect('Số cột lưới', '', 'grid_cols', '3', [
                { k: '2', n: '2 cột' },
                { k: '3', n: '3 cột' },
                { k: '4', n: '4 cột' },
            ]));

            // Clear cache
            var $gData = mkGroup('Dữ liệu');
            $gData.append(mkItem('Xóa lịch sử tập phim', 'Xóa cache episodes', 'Xóa', null, function() {
                Object.keys(_epsCache).forEach(function(k){ delete _epsCache[k]; });
                Lampa.Noty.show('Đã xóa cache!');
            }));
            $gData.append(mkItem('Reset cài đặt', 'Khôi phục mặc định', 'Reset', null, function() {
                localStorage.removeItem(STG_KEY);
                Lampa.Noty.show('Đã reset!');
                comp.create();
            }));
            $w.append($gData);

            $w.append('<div class="kkp-stg-ver">KKPhim v5.0 | Lampa UI Native</div>');

            scroll.render().find('.scroll__body').append($w);
            comp.start();
        };

        function setupScroll() {
            scroll.render().css({ overflow: 'hidden', position: 'relative', height: '100%' });
            scroll.render().find('.scroll__body').css({ 'overflow-y': 'auto', '-webkit-overflow-scrolling': 'touch', height: '100%', 'padding-bottom': '5em' });
        }

        this.start = function() {
            setupScroll();
            Lampa.Controller.add('content', {
                toggle:  function() { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); },
                left:    function() { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right:   function() { Navigator.move('right'); },
                up:      function() { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down:    function() { Navigator.move('down'); },
                back:    function() { Lampa.Activity.backward(); }
            });
            setTimeout(function() { Lampa.Controller.toggle('content'); Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, 0);
        };
        this.pause   = function() {};
        this.stop    = function() {};
        this.render  = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    });

    // =========================================================
    // FULL LISTENER - inject vào Lampa full card
    // =========================================================
    Lampa.Listener.follow('full', function(e) {
        var obj  = e.object || {};
        var card = (e.data && e.data.movie) ? e.data.movie : (obj.card || (obj.activity && obj.activity.card));
        if (!card || card.source !== SOURCE_NAME) return;

        var slug = card.kkphim_slug || card.id;

        if (e.type === 'destroy') {
            delete _epsCache[slug];
            return;
        }
        if (e.type !== 'complite') return;

        // Pre-fetch episodes
        fetchEpisodes(slug, function() {});

        var $render = obj.activity ? obj.activity.render() : (obj.render ? obj.render() : null);
        var $ctx    = $render ? $render : $('body');

        // === NÚT XEM KKPhim (Lampa native button style) ===
        if (!$ctx.find('.view--kkphim').length) {
            var $btn = $(
                '<div class="full-start__button selector view--kkphim" data-subtitle="KKPhim">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
                '<path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/>' +
                '</svg><span>KKPhim</span></div>'
            );
            $btn.on('hover:enter', function() {
                fetchEpisodes(slug, function(eps) {
                    if (!eps || !eps.length) { Lampa.Noty.show('Không có link phim'); return; }
                    showEpisodeMenu(card, eps);
                });
            });
            var $tor = $ctx.find('.view--torrent');
            if ($tor.length) $tor.after($btn);
            else $ctx.find('.full-start__buttons').append($btn);
        }

        // === LOGO từ TMDB ===
        var info = getTmdbInfo(card);
        if (info.id) {
            fetchTMDBDetail(info.id, info.type, function(tmdbData) {
                if (!tmdbData || !$ctx.closest('body').length) return;
                var logos = (tmdbData.images && tmdbData.images.logos) || [];
                var logo  = logos.filter(function(l){ return l.iso_639_1 === 'en'; })[0] || logos[0];
                if (logo && logo.file_path) {
                    var logoUrl = TMDB_IMG + 'w300' + logo.file_path;
                    var $t = $ctx.find('.full-start-new__title');
                    if ($t.length) {
                        $t.html('<img style="margin-top:5px;max-height:120px;max-width:280px;" src="' + logoUrl + '"/>');
                    }
                }
            });
        }

        // === GENRE TAGS (Lampa style) ===
        injectGenreTags(card, $ctx);

        // === CAST & DIRECTORS (Lampa items-line style) ===
        injectCastSection(card, $ctx);

        // === EPISODES ROW ===
        injectEpisodesSection(card, $ctx);

        // === SIMILAR (Lampa card style) ===
        injectSimilarSection(card, $ctx);
    });

    // =========================================================
    // INJECT: GENRE TAGS
    // =========================================================
    function injectGenreTags(card, $ctx) {
        if ($ctx.find('.kkp-genre-tags').length) return;
        var genres = card.genres || [];
        if (!genres.length) return;

        var $tags = $('<div class="kkp-genre-tags"></div>');
        genres.forEach(function(g) {
            var slug = g.slug || (isNaN(g.id) ? g.id : '');
            if (!slug) return;
            var $t = $('<div class="kkp-genre-tag selector">' + (g.name || '') + '</div>');
            $t.on('hover:enter click', (function(gn, gs) { return function() {
                Lampa.Activity.push({ title: gn, component: 'kkphim_grid', cat_url: '/v1/api/the-loai/' + gs, source: SOURCE_NAME, page: 1 });
            }; })(g.name || slug, slug));
            $tags.append($t);
        });

        var $d = $ctx.find('.full-descr').first();
        if ($d.length) $d.after($tags);
        else $ctx.find('.full-start').first().append($tags);
    }

    // =========================================================
    // INJECT: CAST SECTION (copy Lampa items-line)
    // =========================================================
    var _castInjected = {};

    function injectCastSection(card, $ctx) {
        var slug = card.kkphim_slug || card.id;
        if (_castInjected[slug] || $ctx.find('.kkp-cast-section').length) return;
        _castInjected[slug] = true;

        var info = getTmdbInfo(card);

        function render(credits) {
            if (!$ctx.closest('body').length) return;
            var cast = (credits.cast || []).slice(0, 15);
            var dirs = (credits.crew || []).filter(function(c){ return c.job === 'Director'; });
            if (!cast.length && !dirs.length) return;

            var $sect = $('<div class="kkp-cast-section"></div>');

            // Đạo diễn
            if (dirs.length) {
                var rDir = buildRow('Đạo diễn', null, null);
                dirs.forEach(function(d) {
                    rDir.list.append(buildPersonCard(d, function() {
                        if (d.id && !String(d.id).startsWith('kk-')) {
                            Lampa.Activity.push({ url: '', component: 'actor', id: d.id, source: 'tmdb' });
                        }
                    }));
                });
                $sect.append(rDir.row);
            }

            // Diễn viên
            if (cast.length) {
                var rCast = buildRow('Diễn viên', null, null);
                cast.forEach(function(a) {
                    rCast.list.append(buildPersonCard(a, function() {
                        if (a.id && !String(a.id).startsWith('kk-')) {
                            Lampa.Activity.push({ url: '', component: 'actor', id: a.id, source: 'tmdb' });
                        }
                    }));
                });
                $sect.append(rCast.row);
            }

            // Chèn sau genre tags hoặc descr
            setTimeout(function() {
                if (!$ctx.closest('body').length) return;
                var $after = $ctx.find('.kkp-genre-tags');
                if (!$after.length) $after = $ctx.find('.full-descr');
                if ($after.length) $after.last().after($sect);
                else $ctx.find('.full-start').first().append($sect);
            }, 100);
        }

        if (info.id) {
            tmdbAjax(TMDB_BASE + '/' + info.type + '/' + info.id + '/credits?language=' + _tmdbLang(), function(data) {
                if (!$ctx.closest('body').length) return;
                render(data);
            }, function() { render(card.credits || { cast: [], crew: [] }); });
        } else {
            render(card.credits || { cast: [], crew: [] });
        }
    }

    // =========================================================
    // INJECT: EPISODES SECTION
    // =========================================================
    function injectEpisodesSection(card, $ctx) {
        if ($ctx.find('.kkp-episodes-section').length) return;
        var slug = card.kkphim_slug || card.id;
        if (!slug) return;

        fetchEpisodes(slug, function(episodes) {
            if (!episodes || !episodes.length || !$ctx.closest('body').length) return;
            var firstServer = episodes[0] || {};
            var epList      = firstServer.server_data || [];
            if (epList.length <= 1) return;

            var curSrv = 0;
            var $sect  = $('<div class="kkp-episodes-section"></div>');

            var $head = $('<div class="kkp-row-head"></div>');
            var $title = $('<div class="kkp-row-title"></div>');
            $head.append($title);

            if (episodes.length > 1) {
                var $srvBtn = $('<div class="kkp-row-more selector">Đổi server ›</div>');
                $srvBtn.on('hover:enter click', function() {
                    Lampa.Select.show({
                        title: 'Chọn server',
                        items: episodes.map(function(srv, si) {
                            return { title: srv.server_name || ('Server ' + (si + 1)), index: si, selected: si === curSrv };
                        }),
                        onSelect: function(item) { curSrv = item.index; renderEps(); }
                    });
                });
                $head.append($srvBtn);
            }

            var $chips = $('<div class="kkp-row"><div class="kkp-ep-chips" style="padding:0 1.5em 0.8em;"></div></div>');
            $sect.append($head).append($chips);

            function renderEps() {
                var server = episodes[curSrv] || {};
                var data   = server.server_data || [];
                $title.text('Danh sách tập' + (episodes.length > 1 ? ' — ' + (server.server_name || ('Server ' + (curSrv + 1))) : ''));
                $chips.find('.kkp-ep-chips').empty();
                var playlist = data.map(function(ep) {
                    return { url: ep.link_m3u8 || ep.link_embed || '', title: (card.title || '') + ' - ' + (ep.name || '') };
                });
                data.forEach(function(ep, idx) {
                    var $c = $('<div class="kkp-ep-chip selector">' + (ep.name || ('Tập ' + (idx + 1))) + '</div>');
                    $c.on('hover:enter click', function() {
                        var link = ep.link_m3u8 || ep.link_embed || '';
                        if (!link) { Lampa.Noty.show('Không có link'); return; }
                        Lampa.Player.play({ url: link, title: (card.title || '') + ' - ' + (ep.name || ''), poster: card.img || card.poster || '' });
                        Lampa.Player.playlist(playlist, idx);
                    });
                    $chips.find('.kkp-ep-chips').append($c);
                });
            }

            renderEps();

            setTimeout(function() {
                if (!$ctx.closest('body').length) return;
                var $after = $ctx.find('.full-start__buttons');
                if (!$after.length) $after = $ctx.find('.full-start__rate');
                if ($after.length) $after.last().after($sect);
                else {
                    var $descr = $ctx.find('.full-descr');
                    if ($descr.length) $descr.before($sect);
                    else $ctx.find('.full-start').first().append($sect);
                }
            }, 150);
        });
    }

    // =========================================================
    // INJECT: SIMILAR SECTION (Lampa card style)
    // =========================================================
    var _simInjected = {};

    function injectSimilarSection(card, $ctx) {
        var slug = card.kkphim_slug || card.id;
        if (_simInjected[slug] || $ctx.find('.kkp-similar-section').length) return;
        _simInjected[slug] = true;

        var info = getTmdbInfo(card);

        function render(items) {
            if (!items.length || !$ctx.closest('body').length) return;
            var $sect = buildSimilarRow(items, 'Phim liên quan');
            if (!$sect) return;
            $sect.addClass('kkp-similar-section');

            setTimeout(function() {
                if (!$ctx.closest('body').length) return;
                var $after = $ctx.find('.kkp-cast-section');
                if (!$after.length) $after = $ctx.find('.kkp-genre-tags');
                if (!$after.length) $after = $ctx.find('.full-descr');
                if ($after.length) $after.last().after($sect);
                else $ctx.find('.full-start').first().append($sect);
            }, 400);
        }

        function fmtItems(results, mt) {
            return results.slice(0, 20).map(function(s) {
                return {
                    id: s.id, title: s.title || s.name || '', name: s.name || s.title || '',
                    poster_path: s.poster_path || '',
                    img: s.poster_path ? TMDB_IMG + 'w300' + s.poster_path : '',
                    vote_average: s.vote_average || 0,
                    release_date: s.release_date || s.first_air_date || '',
                    first_air_date: s.first_air_date || s.release_date || '',
                    media_type: s.media_type || mt,
                    source: 'tmdb',
                };
            });
        }

        if (info.id) {
            tmdbAjax(TMDB_BASE + '/' + info.type + '/' + info.id + '/recommendations?language=' + _tmdbLang() + '&page=1', function(data) {
                var res = (data && data.results) || [];
                if (res.length) { render(fmtItems(res, info.type)); return; }
                tmdbAjax(TMDB_BASE + '/' + info.type + '/' + info.id + '/similar?language=' + _tmdbLang() + '&page=1', function(data2) {
                    var res2 = (data2 && data2.results) || [];
                    if (res2.length) render(fmtItems(res2, info.type));
                    else fallbackSim();
                }, function() { fallbackSim(); });
            }, function() { fallbackSim(); });
        } else {
            fallbackSim();
        }

        function fallbackSim() {
            var gi = getGenreSlug(card);
            if (!gi) { return; }
            var cardSlug = card.kkphim_slug || card.id;
            var net = new Lampa.Reguest();
            net.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=1', function(fd) {
                var tp = 1;
                try { var p = fd.data && fd.data.params && fd.data.params.pagination; tp = (p && p.totalPages) || 1; } catch(e) {}
                var rp   = Math.max(1, Math.floor(Math.random() * Math.min(tp, 10)) + 1);
                var net2 = new Lampa.Reguest();
                net2.silent(BASE_URL + '/v1/api/the-loai/' + gi.slug + '?page=' + rp, function(data2) {
                    var items = [];
                    try { items = (data2.data && data2.data.items) ? data2.data.items.map(normalizeItem) : []; } catch(e) {}
                    items = items.filter(function(i){ return i.id !== cardSlug; }).sort(function(){ return Math.random() - 0.5; }).slice(0, 20);
                    render(items);
                }, function() {});
            }, function() {});
        }
    }

    // =========================================================
    // MENU
    // =========================================================
    function addMenuItem() {
        if ($('.menu__item[data-action="kkphim"]').length) return;
        var $item = $(
            '<li class="menu__item selector" data-action="kkphim">' +
            '<div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">' +
            '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/>' +
            '</svg></div>' +
            '<div class="menu__text">' + CAT_NAME + '</div>' +
            '</li>'
        );
        $item.on('hover:enter', function() {
            Lampa.Activity.push({ url: '', title: CAT_NAME, component: 'kkphim_main', page: 1 });
        });
        $('.menu .menu__list').eq(0).append($item);
    }

    // =========================================================
    // START
    // =========================================================
    function startPlugin() {
        injectCSS();

        // Đăng ký API source
        var apiInstance = new KKPhimApi();
        Lampa.Api.sources[SOURCE_NAME] = apiInstance;

        // Đăng ký component category cho Lampa routing
        // (dùng khi Lampa.Activity.push với component:'category', source:'kkphim')

        // Grid component cho "Xem thêm"
        // (đã đăng ký ở trên: kkphim_grid)

        // Add menu
        setTimeout(addMenuItem, 500);
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') setTimeout(addMenuItem, 500);
        });

        // Hook category component để add "Xem thêm" buttons
        Lampa.Listener.follow('activity', function(e) {
            if (e.type !== 'start') return;
            var obj = e.object || {};
            if (obj.source !== SOURCE_NAME || obj.component !== 'category') return;
            setTimeout(function() {
                $('.items__head, .category__title').each(function() {
                    var $head = $(this);
                    if ($head.find('.kkp-more-btn').length) return;
                    var txt = $head.text().replace(/\s*[>›].*/g, '').trim();
                    var cfg = null;
                    CATEGORIES.forEach(function(c) { if (c.title === txt) cfg = c; });
                    if (!cfg) return;
                    var $btn = $('<span class="kkp-more-btn selector" style="font-size:12px;opacity:.65;cursor:pointer;margin-left:10px;padding:2px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;vertical-align:middle;">Xem thêm ›</span>');
                    $btn.on('hover:enter click', function() {
                        Lampa.Activity.push({ title: cfg.title, component: 'kkphim_grid', cat_url: cfg.url, source: SOURCE_NAME, page: 1 });
                    });
                    $head.append($btn);
                });
            }, 900);
        });

        console.log('[KKPhim] v5.0 started — Lampa UI Native');
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();