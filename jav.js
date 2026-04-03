/* KKPhim Plugin v5.0 - Lampa Native Integration */
(function(){
'use strict';

if(window.__kkphim_v5_started) return;
window.__kkphim_v5_started = true;

// =====================================================================
// CẤU HÌNH
// =====================================================================
var SOURCE_NAME = 'kkphim';
var SOURCE_TITLE = 'KKPhim';

var SOURCES = {
    kkphim: {key:'kkphim', name:'KKPhim', api:'https://phimapi.com/', img:'https://phimimg.com/'},
    ophim: {key:'ophim', name:'OPhim', api:'https://ophim1.com/', img:'https://img.ophim.live/uploads/movies/'}
};

var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
var TMDB_BASE = 'https://api.themoviedb.org/3';
var TMDB_IMG = 'https://image.tmdb.org/t/p/';

var TIO_BASE = 'https://torrentio.strem.fun';
var STG_KEY = 'kkphim_settings';

var MENU_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z" fill="currentColor"/></svg>';

// =====================================================================
// DANH MỤC
// =====================================================================
var CATEGORIES = [
    {url: 'danh-sach/phim-moi-cap-nhat', title: 'Phim mới cập nhật'},
    {url: 'v1/api/danh-sach/phim-le', title: 'Phim lẻ'},
    {url: 'v1/api/danh-sach/phim-bo', title: 'Phim bộ'},
    {url: 'v1/api/danh-sach/hoat-hinh', title: 'Hoạt hình'},
    {url: 'v1/api/danh-sach/tv-shows', title: 'TV Shows'},
    {url: 'v1/api/the-loai/hanh-dong', title: 'Hành động'},
    {url: 'v1/api/the-loai/tinh-cam', title: 'Tình cảm'},
    {url: 'v1/api/the-loai/hai-huoc', title: 'Hài hước'},
    {url: 'v1/api/the-loai/kinh-di', title: 'Kinh dị'},
    {url: 'v1/api/the-loai/vien-tuong', title: 'Viễn tưởng'},
    {url: 'v1/api/the-loai/phieu-luu', title: 'Phiêu lưu'},
    {url: 'v1/api/the-loai/tam-ly', title: 'Tâm lý'},
    {url: 'v1/api/the-loai/hoat-hinh', title: 'Hoạt hình'},
];

// =====================================================================
// SETTINGS HELPERS
// =====================================================================
function getSettings() {
    try { return JSON.parse(localStorage.getItem(STG_KEY)) || {}; } 
    catch(e) { return {}; }
}

function saveSettings(obj) {
    try {
        var current = getSettings();
        Object.keys(obj).forEach(function(k) { current[k] = obj[k]; });
        localStorage.setItem(STG_KEY, JSON.stringify(current));
    } catch(e) {}
}

function isSourceEnabled(key) {
    var s = getSettings();
    if (s['source_' + key + '_enabled'] === undefined) return true;
    return s['source_' + key + '_enabled'] === true;
}

function getEnabledSources() {
    var r = {};
    Object.keys(SOURCES).forEach(function(k) {
        if (isSourceEnabled(k)) r[k] = SOURCES[k];
    });
    return r;
}

function tsHost() { return getSettings().torrserver_host || ''; }
function tsPass() { return getSettings().torrserver_password || ''; }
function tioConf() { return getSettings().torrentio_config || ''; }
function aioUrl() { return getSettings().aio_url || ''; }
function tEngine() { return getSettings().torrent_engine || 'torrentio'; }
function tmdbLang() { return getSettings().tmdb_lang || 'vi-VN'; }

// =====================================================================
// UTILITIES
// =====================================================================
function getPoster(url, source) {
    if (!url) return '';
    if (url.indexOf('http') === 0) return url;
    var base = source ? source.img : SOURCES.kkphim.img;
    return base ? base + url : url;
}

function normalizeStr(s) {
    return String(s || '').toLowerCase().trim()
        .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '')
        .replace(/\s+/g, ' ');
}

function toNameArray(arr) {
    if (!arr || !arr.length) return [];
    return arr.map(function(item) {
        if (typeof item === 'string') return {id: item, slug: item, name: item};
        var slug = item.slug || (typeof item.id === 'string' && isNaN(item.id) ? item.id : '');
        return {id: slug || String(item.id || ''), slug: slug, name: item.name || ''};
    });
}

// =====================================================================
// NORMALIZE ITEM - Chuẩn hóa data từ KKPhim/OPhim sang format Lampa
// =====================================================================
function normalizeItem(item, source) {
    if (!item) return {};
    
    source = source || SOURCES.kkphim;
    var poster = getPoster(item.poster_url, source);
    var thumb = getPoster(item.thumb_url || item.poster_url, source);
    var isTV = item.type === 'series' || item.type === 'tvshows' || item.type === 'hoathinh';
    
    return {
        id: item.slug || item._id || '',
        title: item.name || '',
        name: item.name || '',
        original_title: item.origin_name || item.name || '',
        original_name: item.origin_name || item.name || '',
        img: thumb,
        poster: poster,
        poster_path: poster,
        backdrop_path: thumb,
        background_image: thumb,
        release_date: item.year ? (item.year + '-01-01') : '',
        first_air_date: item.year ? (item.year + '-01-01') : '',
        vote_average: 0,
        overview: item.content || '',
        genres: toNameArray(item.category || []),
        countries: toNameArray(item.country || []),
        type: isTV ? 'tv' : 'movie',
        media_type: isTV ? 'tv' : 'movie',
        source: SOURCE_NAME,
        
        // Custom fields
        kkphim_slug: item.slug || '',
        kkphim_type: item.type || '',
        kkphim_cats: item.category || [],
        kkphim_year: item.year || 0,
        kkphim_quality: item.quality || '',
        kkphim_lang: item.lang || '',
        kkphim_episodes: item.episode_current || '',
        kkphim_source_key: source.key || 'kkphim',
    };
}

// =====================================================================
// TMDB HELPERS
// =====================================================================
function tmdbFetch(path) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: TMDB_BASE + path,
            type: 'GET',
            headers: {'Authorization': 'Bearer ' + TMDB_TOKEN},
            success: resolve,
            error: function(xhr) { reject(new Error('TMDB ' + xhr.status)); }
        });
    });
}

function getImdbId(type, id) {
    return tmdbFetch('/' + type + '/' + id + '/external_ids').then(function(r) {
        return r.imdb_id || null;
    }).catch(function() { return null; });
}

function searchTMDB(title, year, mediaType) {
    var url = '/search/' + mediaType + '?query=' + encodeURIComponent(title) + '&language=' + tmdbLang();
    if (year) url += '&year=' + year;
    
    return tmdbFetch(url).then(function(data) {
        var results = (data && data.results) || [];
        if (!results.length) return null;
        
        if (year) {
            var matched = results.find(function(r) {
                return (r.release_date || r.first_air_date || '').slice(0,4) === String(year);
            });
            if (matched) return matched;
        }
        return results[0];
    }).catch(function() { return null; });
}

function getTMDBDetail(id, type) {
    return tmdbFetch('/' + type + '/' + id + '?language=' + tmdbLang() + 
        '&append_to_response=credits,images,similar,recommendations,external_ids,content_ratings,release_dates' +
        '&include_image_language=en,vi,null');
}

function getTMDBSeasons(tvId) {
    return tmdbFetch('/tv/' + tvId + '?language=' + tmdbLang()).then(function(r) {
        if (r && r.seasons) {
            return r.seasons.filter(function(s) { return s.season_number > 0; });
        }
        return [];
    }).catch(function() { return []; });
}

// =====================================================================
// ENRICH WITH TMDB - Bổ sung thông tin từ TMDB vào card
// =====================================================================
function enrichWithTMDB(result, movie) {
    return new Promise(function(resolve) {
        var searchTitle = movie.origin_name || movie.name || '';
        var searchYear = movie.year ? String(movie.year) : '';
        var mediaType = (movie.type === 'series' || movie.type === 'tvshows') ? 'tv' : 'movie';
        
        if (!searchTitle) {
            resolve(result);
            return;
        }
        
        searchTMDB(searchTitle, searchYear, mediaType).then(function(tmdbResult) {
            if (!tmdbResult) {
                resolve(result);
                return;
            }
            
            return getTMDBDetail(tmdbResult.id, tmdbResult.media_type || mediaType).then(function(t) {
                if (!t) {
                    resolve(result);
                    return;
                }
                
                // Apply TMDB data
                if (t.backdrop_path) {
                    result.backdrop_path = t.backdrop_path;
                    result.background_image = TMDB_IMG + 'original' + t.backdrop_path;
                }
                if (t.poster_path) {
                    result.poster_path = t.poster_path;
                    result.poster = TMDB_IMG + 'w500' + t.poster_path;
                    result.img = result.poster;
                }
                if (t.vote_average) {
                    result.vote_average = Math.round(t.vote_average * 10) / 10;
                    result.vote_count = t.vote_count || 0;
                }
                if (t.overview) result.overview = t.overview;
                if (t.tagline) result.tagline = t.tagline;
                if (t.runtime) result.runtime = t.runtime;
                if (t.release_date) result.release_date = t.release_date;
                if (t.first_air_date) result.first_air_date = t.first_air_date;
                if (t.number_of_seasons) result.number_of_seasons = t.number_of_seasons;
                if (t.number_of_episodes) result.number_of_episodes = t.number_of_episodes;
                
                // Genres từ TMDB (có ID)
                if (t.genres && t.genres.length) {
                    result.genres = t.genres;
                }
                
                // Countries
                if (t.production_countries && t.production_countries.length) {
                    result.production_countries = t.production_countries;
                }
                
                // Credits
                if (t.credits) {
                    result.credits = t.credits;
                    
                    var cast = (t.credits.cast || []).slice(0, 20).map(function(a) {
                        return {
                            id: a.id,
                            name: a.name,
                            character: a.character || '',
                            profile_path: a.profile_path || '',
                            img: a.profile_path ? TMDB_IMG + 'w185' + a.profile_path : ''
                        };
                    });
                    
                    var crew = (t.credits.crew || []).filter(function(c) {
                        return c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay';
                    }).slice(0, 5).map(function(c) {
                        return {
                            id: c.id,
                            name: c.name,
                            job: c.job,
                            profile_path: c.profile_path || '',
                            img: c.profile_path ? TMDB_IMG + 'w185' + c.profile_path : ''
                        };
                    });
                    
                    result.persons = cast.concat(crew);
                    result.actors = cast;
                    result.directors = crew.filter(function(c) { return c.job === 'Director'; });
                }
                
                // Images (logo)
                if (t.images && t.images.logos && t.images.logos.length) {
                    var logo = t.images.logos.find(function(l) { return l.iso_639_1 === 'en'; }) || t.images.logos[0];
                    if (logo && logo.file_path) {
                        result.logo = TMDB_IMG + 'w300' + logo.file_path;
                        result.logo_path = logo.file_path;
                    }
                }
                
                // Similar
                if (t.similar && t.similar.results) {
                    result.similar = t.similar.results.slice(0, 12).map(function(s) {
                        s.media_type = mediaType;
                        return s;
                    });
                }
                
                // Recommendations
                if (t.recommendations && t.recommendations.results) {
                    result.recommendations = t.recommendations.results.slice(0, 12).map(function(r) {
                        r.media_type = mediaType;
                        return r;
                    });
                }
                
                // External IDs
                if (t.external_ids) {
                    result.imdb_id = t.external_ids.imdb_id || '';
                    result.external_ids = t.external_ids;
                }
                
                // TMDB ID
                result.tmdb_id = t.id;
                result.tmdb = {id: t.id, type: mediaType};
                
                resolve(result);
            });
        }).catch(function() {
            resolve(result);
        });
    });
}

// =====================================================================
// SOURCE API HELPERS - Fetch từ KKPhim/OPhim
// =====================================================================
function fetchSourcePage(source, apiPath, page) {
    return new Promise(function(resolve, reject) {
        var url = source.api + apiPath;
        var sep = url.indexOf('?') >= 0 ? '&' : '?';
        url += sep + 'page=' + page;
        
        $.ajax({
            url: url,
            type: 'GET',
            success: function(data) {
                var items = [], totalPages = 1, totalItems = 0;
                
                try {
                    if (data.items) {
                        items = data.items.map(function(i) { return normalizeItem(i, source); });
                        totalPages = (data.pagination && data.pagination.totalPages) || 1;
                        totalItems = (data.pagination && data.pagination.totalItems) || items.length;
                    } else if (data.data && data.data.items) {
                        items = data.data.items.map(function(i) { return normalizeItem(i, source); });
                        var pag = data.data.params && data.data.params.pagination;
                        totalPages = (pag && pag.totalPages) || 1;
                        totalItems = (pag && pag.totalItems) || items.length;
                    }
                } catch(e) {}
                
                resolve({
                    items: items,
                    page: page,
                    totalPages: totalPages,
                    totalItems: totalItems
                });
            },
            error: reject
        });
    });
}

function fetchSourceDetail(source, slug) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: source.api + 'phim/' + slug,
            type: 'GET',
            success: function(data) {
                resolve({
                    movie: data.movie || data || {},
                    episodes: data.episodes || []
                });
            },
            error: reject
        });
    });
}

function searchSource(source, keyword) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=1',
            type: 'GET',
            success: function(data) {
                var items = (data && data.data && data.data.items) || (data && data.items) || [];
                resolve(items);
            },
            error: function() { resolve([]); }
        });
    });
}

// =====================================================================
// MATCH & FIND SLUGS - Tìm slug phù hợp từ các nguồn
// =====================================================================
function matchScore(item, title, orig, year) {
    var score = 0;
    var nT = normalizeStr(title), nO = normalizeStr(orig);
    var n1 = normalizeStr(item.name || item.title || '');
    var n2 = normalizeStr(item.origin_name || item.original_name || '');
    
    if (nT && (n1 === nT || n2 === nT)) score += 100;
    else if (nO && (n1 === nO || n2 === nO)) score += 100;
    else if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 50;
    else if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1)) score += 50;
    
    if (year && item.year) {
        var iy = parseInt(item.year), ty = parseInt(year);
        if (iy === ty) score += 30;
        else if (Math.abs(iy - ty) <= 1) score += 15;
    }
    
    return score;
}

function findBestMatch(items, title, orig, year) {
    if (!items || !items.length) return null;
    
    var scored = items.map(function(it) {
        return {item: it, score: matchScore(it, title, orig, year)};
    }).filter(function(x) {
        return x.score > 0;
    }).sort(function(a, b) {
        return b.score - a.score;
    });
    
    return scored.length ? scored[0].item : null;
}

function findSlugs(title, orig, year) {
    return new Promise(function(resolve) {
        var result = {};
        var enabledSources = getEnabledSources();
        var terms = [title];
        
        if (orig && orig !== title) terms.push(orig);
        if (year) {
            terms.push(title + ' ' + year);
            if (orig && orig !== title) terms.push(orig + ' ' + year);
        }
        
        var promises = [];
        
        Object.keys(enabledSources).forEach(function(key) {
            var source = enabledSources[key];
            
            var p = (async function() {
                for (var i = 0; i < terms.length; i++) {
                    if (result[key]) break;
                    
                    var items = await searchSource(source, terms[i]);
                    var best = findBestMatch(items, title, orig, year);
                    
                    if (best && best.slug) {
                        result[key] = best.slug;
                        break;
                    }
                }
            })();
            
            promises.push(p);
        });
        
        Promise.all(promises).then(function() {
            resolve(result);
        }).catch(function() {
            resolve(result);
        });
    });
}

console.log('[KKPhim v5] Part 1 loaded - Core & Utilities');

// =====================================================================
// API SOURCE - Đăng ký làm nguồn phim chính thức của Lampa
// =====================================================================
function KKPhimAPI() {
    var self = this;
    self.network = new Lampa.Reguest();
    
    /**
     * LIST - Lấy danh sách phim theo category/genre
     * Lampa gọi khi: browse category, load more, genre filter
     */
    self.list = function(params, onComplete, onError) {
        var page = params.page || 1;
        var source = SOURCES.kkphim; // Default source
        var apiPath = '';
        
        // 1. Truyền trực tiếp cat_url (từ component custom hoặc More button)
        if (params.cat_url) {
            apiPath = params.cat_url;
        }
        // 2. Lampa native url param
        else if (params.url) {
            apiPath = params.url;
        }
        // 3. Genre filter - Lampa truyền genres array
        else if (params.genres && params.genres[0]) {
            var g = params.genres[0];
            var slug = g.slug || (isNaN(g.id) ? g.id : '');
            if (slug) apiPath = 'v1/api/the-loai/' + slug;
        }
        // 4. Single genre object
        else if (params.genre) {
            var g2 = params.genre;
            var slug2 = (typeof g2 === 'object') 
                ? (g2.slug || (isNaN(g2.id) ? g2.id : ''))
                : (isNaN(g2) ? g2 : '');
            if (slug2) apiPath = 'v1/api/the-loai/' + slug2;
        }
        // 5. Type + value (Lampa legacy)
        else if (params.type === 'genre' && params.value) {
            apiPath = 'v1/api/the-loai/' + params.value;
        }
        
        // Fallback
        if (!apiPath) apiPath = 'danh-sach/phim-moi-cap-nhat';
        
        fetchSourcePage(source, apiPath, page).then(function(res) {
            onComplete({
                results: res.items,
                page: res.page,
                total_pages: res.totalPages,
                total_results: res.totalItems,
                cat_url: apiPath,
                url: apiPath
            });
        }).catch(onError || function() {});
    };
    
    /**
     * CATEGORY - Lấy tất cả categories cho trang chủ
     * Lampa gọi khi: vào source lần đầu
     */
    self.category = function(params, onComplete, onError) {
        var parts = CATEGORIES.map(function(cat) {
            return function(callback) {
                var source = SOURCES.kkphim;
                
                fetchSourcePage(source, cat.url, 1).then(function(res) {
                    callback({
                        title: cat.title,
                        results: res.items,
                        url: cat.url,
                        cat_url: cat.url,
                        page: 1,
                        total_pages: res.totalPages,
                        total_results: res.totalItems,
                        source: SOURCE_NAME
                    });
                }).catch(function() {
                    callback({
                        title: cat.title,
                        results: [],
                        url: cat.url,
                        cat_url: cat.url
                    });
                });
            };
        });
        
        // Load parallel với limit 3 concurrent
        Lampa.Api.partNext(parts, 3, onComplete, onError);
    };
    
    /**
     * FULL - Lấy chi tiết phim đầy đủ
     * Lampa gọi khi: mở trang detail phim
     */
    self.full = function(params, onComplete, onError) {
        var card = params.card || {};
        var slug = card.kkphim_slug || card.id;
        var sourceKey = card.kkphim_source_key || 'kkphim';
        var source = SOURCES[sourceKey] || SOURCES.kkphim;
        
        if (!slug) {
            if (onError) onError('No slug');
            return;
        }
        
        fetchSourceDetail(source, slug).then(function(data) {
            var movie = data.movie || {};
            var episodes = data.episodes || [];
            
            // Build seasons array từ episodes
            var seasons = [];
            episodes.forEach(function(server, si) {
                var eps = (server.server_data || []).map(function(ep, ei) {
                    return {
                        episode_number: ei + 1,
                        season_number: si + 1,
                        name: ep.name || ('Tập ' + (ei + 1)),
                        air_date: '',
                        link_m3u8: ep.link_m3u8 || '',
                        link_embed: ep.link_embed || '',
                        slug: ep.slug || '',
                        filename: ep.filename || ''
                    };
                });
                
                seasons.push({
                    season_number: si + 1,
                    name: server.server_name || ('Server ' + (si + 1)),
                    episodes: eps,
                    server_name: server.server_name || ''
                });
            });
            
            var result = normalizeItem(movie, source);
            result.overview = movie.content || '';
            result.number_of_seasons = seasons.length || 1;
            result.seasons = seasons;
            result.kkphim_episodes = episodes;
            
            // Cast/Crew từ KKPhim (không có ảnh)
            var kkActors = (movie.actor || []).map(function(n, i) {
                return {
                    id: 'kk_actor_' + i,
                    name: n,
                    character: '',
                    profile_path: '',
                    img: ''
                };
            });
            
            var kkDirs = (movie.director || []).map(function(n, i) {
                return {
                    id: 'kk_dir_' + i,
                    name: n,
                    job: 'Director',
                    department: 'Directing',
                    profile_path: '',
                    img: ''
                };
            });
            
            if (kkActors.length || kkDirs.length) {
                result.credits = {cast: kkActors, crew: kkDirs};
                result.persons = kkActors.concat(kkDirs);
                result.actors = kkActors;
                result.directors = kkDirs;
            }
            
            // Enrich với TMDB để có đầy đủ metadata
            enrichWithTMDB(result, movie).then(function(enriched) {
                onComplete({movie: enriched});
            }).catch(function() {
                onComplete({movie: result});
            });
            
        }).catch(onError || function() {});
    };
    
    /**
     * SEARCH - Tìm kiếm phim
     * Lampa gọi khi: search box
     */
    self.search = function(params, onComplete, onError) {
        var keyword = params.query || '';
        var source = SOURCES.kkphim;
        
        searchSource(source, keyword).then(function(items) {
            var results = items.map(function(i) {
                return normalizeItem(i, source);
            });
            
            onComplete({
                results: results,
                page: 1,
                total_pages: 1,
                total_results: results.length
            });
        }).catch(function() {
            onComplete({results: [], page: 1, total_pages: 1, total_results: 0});
        });
    };
    
    /**
     * SEASONS - Lấy danh sách seasons (cho TV shows)
     * Lampa gọi khi: mở season selector
     */
    self.seasons = function(params, onComplete, onError) {
        var card = params.card || {};
        
        if (card.seasons && card.seasons.length) {
            onComplete({seasons: card.seasons});
        } else {
            self.full({card: card}, function(res) {
                onComplete({
                    seasons: (res.movie && res.movie.seasons) || []
                });
            }, onError);
        }
    };
    
    /**
     * PERSON - Lấy thông tin người (cast/crew)
     * Lampa gọi khi: click vào actor/director
     */
    self.person = function(params, onComplete, onError) {
        var card = params.card || params.movie || params.item || {};
        
        // Nếu có TMDB ID -> dùng TMDB API
        if (card.tmdb_id) {
            var type = card.media_type || card.type || 'movie';
            
            tmdbFetch('/' + type + '/' + card.tmdb_id + '/credits?language=' + tmdbLang())
                .then(function(data) {
                    var cast = (data.cast || []).slice(0, 20).map(function(a) {
                        return {
                            id: a.id,
                            name: a.name,
                            img: a.profile_path ? TMDB_IMG + 'w185' + a.profile_path : '',
                            profile_path: a.profile_path || '',
                            character: a.character || '',
                            role: a.character || '',
                            known_for_department: 'Acting'
                        };
                    });
                    
                    var crew = (data.crew || [])
                        .filter(function(c) {
                            return c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay';
                        })
                        .slice(0, 5)
                        .map(function(c) {
                            return {
                                id: c.id,
                                name: c.name,
                                img: c.profile_path ? TMDB_IMG + 'w185' + c.profile_path : '',
                                profile_path: c.profile_path || '',
                                job: c.job,
                                role: c.job,
                                known_for_department: c.department
                            };
                        });
                    
                    onComplete({
                        persons: cast.concat(crew),
                        cast: cast,
                        crew: crew,
                        actors: cast,
                        directors: crew.filter(function(c) { return c.job === 'Director'; })
                    });
                })
                .catch(function() {
                    if (onError) onError('Failed');
                });
        } else {
            // Không có TMDB -> trả về empty
            onComplete({
                persons: [],
                cast: [],
                crew: [],
                actors: [],
                directors: []
            });
        }
    };
    
    /**
     * CLEAR - Cleanup
     */
    self.clear = function() {
        self.network.clear();
    };
}

// =====================================================================
// ĐĂNG KÝ API SOURCE VÀO LAMPA
// =====================================================================
function registerAPI() {
    if (!Lampa.Api) {
        console.error('[KKPhim] Lampa.Api not found!');
        return;
    }
    
    if (!Lampa.Api.sources) {
        Lampa.Api.sources = {};
    }
    
    // Đăng ký API
    Lampa.Api.sources[SOURCE_NAME] = new KKPhimAPI();
    
    console.log('[KKPhim v5] API registered as source:', SOURCE_NAME);
}

console.log('[KKPhim v5] Part 2 loaded - API Source');

// =====================================================================
// EPISODES CACHE
// =====================================================================
var _episodesCache = {};

function getEpisodesFromCache(slug, sourceKey) {
    var key = sourceKey + '_' + slug;
    return _episodesCache[key] || null;
}

function setEpisodesCache(slug, sourceKey, episodes) {
    var key = sourceKey + '_' + slug;
    _episodesCache[key] = episodes;
}

function clearEpisodesCache() {
    _episodesCache = {};
}

// =====================================================================
// PLAY EPISODE - Phát tập phim từ KKPhim/OPhim
// =====================================================================
function playEpisode(card, episodes) {
    var title = card.title || card.name || '';
    var poster = card.img || card.poster || '';
    
    if (!episodes || !episodes.length) {
        Lampa.Noty.show('Không có tập phim');
        return;
    }
    
    // Tổng số tập
    var totalEps = 0;
    episodes.forEach(function(srv) {
        totalEps += (srv.server_data || []).length;
    });
    
    if (totalEps === 0) {
        Lampa.Noty.show('Không có tập phim');
        return;
    }
    
    // Nếu chỉ có 1 tập duy nhất -> phát luôn
    if (totalEps === 1) {
        var ep = null;
        for (var i = 0; i < episodes.length; i++) {
            if (episodes[i].server_data && episodes[i].server_data.length) {
                ep = episodes[i].server_data[0];
                break;
            }
        }
        
        if (ep) {
            var link = ep.link_m3u8 || ep.link_embed || '';
            if (link) {
                Lampa.Player.play({
                    title: title,
                    url: link,
                    poster: poster
                });
            } else {
                Lampa.Noty.show('Không có link phát');
            }
        }
        return;
    }
    
    // Nếu chỉ có 1 server -> hiển thị danh sách tập
    if (episodes.length === 1 && episodes[0].server_data) {
        showEpisodeList(card, episodes[0]);
        return;
    }
    
    // Nhiều server -> chọn server trước
    showServerSelect(card, episodes);
}

function showServerSelect(card, episodes) {
    var title = card.title || card.name || '';
    
    Lampa.Select.show({
        title: 'Chọn Server - ' + title,
        items: episodes.map(function(srv, idx) {
            var count = (srv.server_data || []).length;
            return {
                title: (srv.server_name || 'Server ' + (idx + 1)) + ' (' + count + ' tập)',
                value: srv
            };
        }),
        onSelect: function(item) {
            showEpisodeList(card, item.value);
        },
        onBack: function() {
            Lampa.Controller.toggle('content');
        }
    });
}

function showEpisodeList(card, serverData) {
    var title = card.title || card.name || '';
    var poster = card.img || card.poster || '';
    var eps = serverData.server_data || [];
    
    if (!eps.length) {
        Lampa.Noty.show('Không có tập');
        return;
    }
    
    // Build playlist cho Player
    var playlist = eps.map(function(ep) {
        return {
            title: title + ' - ' + (ep.name || ''),
            url: ep.link_m3u8 || ep.link_embed || '',
            poster: poster
        };
    });
    
    Lampa.Select.show({
        title: (serverData.server_name || 'Server') + ' - ' + title,
        items: eps.map(function(ep, idx) {
            var link = ep.link_m3u8 || ep.link_embed || '';
            return {
                title: (ep.name || 'Tập ' + (idx + 1)) + (!link ? ' [N/A]' : ''),
                value: ep,
                index: idx
            };
        }),
        onSelect: function(item) {
            var ep = item.value;
            var link = ep.link_m3u8 || ep.link_embed || '';
            
            if (!link) {
                Lampa.Noty.show('Không có link phát');
                return;
            }
            
            Lampa.Player.play({
                title: title + ' - ' + (ep.name || ''),
                url: link,
                poster: poster
            });
            
            // Set playlist
            Lampa.Player.playlist(playlist, item.index);
        },
        onBack: function() {
            Lampa.Controller.toggle('content');
        }
    });
}

// =====================================================================
// TORRENT STREAM HELPERS
// =====================================================================
function getTorrentioConfig() {
    var raw = tioConf();
    if (!raw) return '';
    raw = String(raw).trim();
    
    // Extract config từ URL
    var m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
    if (m) return m[1];
    
    m = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
    if (m) return m[1].replace(/\/+$/, '');
    
    m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
    if (m) return m[1];
    
    if (raw.indexOf('torrentio.strem.fun') > -1) {
        raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '')
            .replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i, '')
            .replace(/^\/+|\/+$/g, '');
        if (raw && raw.indexOf('=') > -1) {
            return raw.replace(/\|/g, '%7C');
        }
        return '';
    }
    
    raw = raw.replace(/^\/+|\/+$/g, '').replace(/\|/g, '%7C');
    return raw.indexOf('=') === -1 ? '' : raw;
}

function getAIOUrl() {
    var raw = aioUrl();
    if (!raw) return '';
    return String(raw).trim()
        .replace(/\/manifest\.json\s*$/i, '')
        .replace(/\/+$/, '');
}

function buildTorrentioUrl(type, imdbId, season, episode) {
    var streamType = type === 'tv' ? 'series' : 'movie';
    var id = imdbId;
    
    if (type === 'tv' && season && episode) {
        id = imdbId + ':' + season + ':' + episode;
    }
    
    var config = getTorrentioConfig();
    var base = TIO_BASE + (config ? '/' + config : '');
    
    return base + '/stream/' + streamType + '/' + id + '.json';
}

function buildAIOUrl(type, imdbId, season, episode) {
    var base = getAIOUrl();
    if (!base) return '';
    
    var streamType = type === 'tv' ? 'series' : 'movie';
    var id = imdbId;
    
    if (type === 'tv' && season && episode) {
        id = imdbId + ':' + season + ':' + episode;
    }
    
    return base + '/stream/' + streamType + '/' + id + '.json';
}

function fetchTorrentStreams(url) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: url,
            type: 'GET',
            timeout: 10000,
            success: function(data) {
                resolve(data.streams || []);
            },
            error: reject
        });
    });
}

function parseStream(st) {
    var rawName = String(st.name || '');
    var rawDesc = String(st.description || '');
    var rawTitle = String(st.title || '');
    var rawAll = rawName + '\n' + rawDesc + '\n' + rawTitle;
    
    var name = rawName.split('\n')[0].trim() || rawTitle.split('\n')[0].trim() || '?';
    
    // Quality
    var qual = '';
    var qm = rawAll.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);
    if (qm) qual = qm[1].toUpperCase();
    
    // Size
    var size = '';
    var sizePatterns = [
        /💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i,
        /\b([\d.,]+)\s*(TB)\b/i,
        /\b([\d.,]+)\s*(GB|GiB)\b/i,
        /\b([\d.,]+)\s*(MB|MiB)\b/i
    ];
    for (var i = 0; i < sizePatterns.length; i++) {
        var sm = rawAll.match(sizePatterns[i]);
        if (sm) {
            size = sm[2] ? sm[1] + ' ' + sm[2] : sm[1].trim();
            break;
        }
    }
    
    // Seeds
    var seeds = '';
    var seedPatterns = [
        /👤\s*(?:Seeders?:?\s*)?(\d+)/i,
        /Seeders?:?\s*(\d+)/i,
        /(\d+)\s*seed/i
    ];
    for (var j = 0; j < seedPatterns.length; j++) {
        var se = rawAll.match(seedPatterns[j]);
        if (se) {
            seeds = se[1];
            break;
        }
    }
    
    // Source
    var source = '';
    var sourcePatterns = [
        /🔗\s*(?:Source:?\s*)?([\w\.\-]+)/i,
        /Source:?\s*([\w\.\-]+)/i,
        /\[([A-Z0-9\-]+)\]/
    ];
    for (var k = 0; k < sourcePatterns.length; k++) {
        var srm = rawAll.match(sourcePatterns[k]);
        if (srm) {
            source = srm[1];
            break;
        }
    }
    
    return {
        name: name,
        infoHash: st.infoHash || '',
        fileIdx: st.fileIdx,
        url: st.url || '',
        size: size,
        seeds: seeds,
        quality: qual,
        source: source,
        rawName: rawName,
        rawDesc: rawDesc,
        rawTitle: rawTitle
    };
}

function formatStream(s) {
    var parts = [];
    
    var line1 = s.name;
    if (s.quality && line1.toUpperCase().indexOf(s.quality) === -1) {
        line1 += ' [' + s.quality + ']';
    }
    parts.push(line1);
    
    var meta = [];
    if (s.size) meta.push('💾 ' + s.size);
    if (s.seeds) meta.push('👤 ' + s.seeds);
    if (s.source) meta.push('🔗 ' + s.source);
    
    if (meta.length) parts.push(meta.join('  '));
    
    return parts.join('\n');
}

// =====================================================================
// TORRSERVER HELPERS
// =====================================================================
function getTorrServerUrl(path) {
    var host = tsHost();
    if (!host) return '';
    
    host = host.replace(/\/+$/, '');
    if (host.indexOf('http') !== 0) {
        host = 'http://' + host;
    }
    
    return host + path;
}

function getTorrServerHeaders() {
    var headers = {'Content-Type': 'application/json'};
    var pass = tsPass();
    
    if (pass) {
        headers['Authorization'] = 'Basic ' + btoa('admin:' + pass);
    }
    
    return headers;
}

function buildMagnet(infoHash) {
    var magnet = 'magnet:?xt=urn:btih:' + infoHash;
    var trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.stealth.si:80/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://tracker.bittor.pw:1337/announce',
        'udp://public.popcorn-tracker.org:6969/announce'
    ];
    
    trackers.forEach(function(t) {
        magnet += '&tr=' + encodeURIComponent(t);
    });
    
    return magnet;
}

function playTorrServer(stream, title, poster, fileIdx) {
    if (!tsHost()) {
        Lampa.Noty.show('Chưa cấu hình TorrServer!');
        return;
    }
    
    Lampa.Noty.show('Đang gửi lên TorrServer...');
    
    var url = getTorrServerUrl('/torrents');
    var headers = getTorrServerHeaders();
    
    fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            action: 'add',
            link: buildMagnet(stream.infoHash),
            title: title || '',
            poster: poster || '',
            save_to_db: false
        })
    }).then(function(r) {
        if (!r.ok) throw new Error('TorrServer: ' + r.status);
        return r.json();
    }).then(function(data) {
        var hash = data.hash || stream.infoHash;
        
        // Đợi TorrServer parse torrent
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve(hash);
            }, 2000);
        });
    }).then(function(hash) {
        // Get torrent info
        return fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                action: 'get',
                hash: hash
            })
        }).then(function(r) {
            return r.json();
        }).then(function(info) {
            return {hash: hash, info: info};
        });
    }).then(function(result) {
        var hash = result.hash;
        var info = result.info;
        
        var files = [];
        if (info && info.file_stats) {
            files = info.file_stats.filter(function(f) {
                var path = (f.path || '').toLowerCase();
                return path.match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);
            }).sort(function(a, b) {
                return (a.id || 0) - (b.id || 0);
            });
        }
        
        var playFile = function(fileUrl) {
            Lampa.Player.play({
                title: title,
                url: fileUrl,
                poster: poster
            });
        };
        
        // Nếu không có file video
        if (!files.length) {
            playFile(getTorrServerUrl('/stream/fname?link=' + hash + '&index=0&play'));
            return;
        }
        
        // Nếu chỉ có 1 file
        if (files.length === 1) {
            playFile(getTorrServerUrl('/stream/fname?link=' + hash + '&index=' + (files[0].id || 0) + '&play'));
            return;
        }
        
        // Nếu có fileIdx từ torrentio
        if (fileIdx !== undefined && fileIdx !== null && fileIdx >= 0) {
            playFile(getTorrServerUrl('/stream/fname?link=' + hash + '&index=' + (files[fileIdx] ? files[fileIdx].id : fileIdx) + '&play'));
            return;
        }
        
        // Nhiều file -> cho chọn
        Lampa.Select.show({
            title: 'Chọn file',
            items: files.map(function(f) {
                var filename = (f.path || '').split('/').pop();
                var size = f.length ? ' (' + (f.length / 1048576).toFixed(0) + ' MB)' : '';
                return {
                    title: filename + size,
                    value: f
                };
            }),
            onSelect: function(item) {
                playFile(getTorrServerUrl('/stream/fname?link=' + hash + '&index=' + item.value.id + '&play'));
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    }).catch(function(e) {
        Lampa.Noty.show('Lỗi TorrServer: ' + (e.message || ''));
    });
}

// =====================================================================
// SHOW TORRENT STREAMS MENU
// =====================================================================
function showTorrentStreamsMenu(streams, title, poster) {
    if (!streams || !streams.length) {
        Lampa.Noty.show('Không tìm thấy torrent');
        return;
    }
    
    var engine = tEngine();
    var engineName = engine === 'aio' ? 'AIOStreams' : 'Torrentio';
    var hasTorrServer = !!tsHost();
    
    var parsed = streams.slice(0, 40).map(parseStream);
    
    Lampa.Select.show({
        title: engineName + ': ' + title + ' (' + parsed.length + ')' + (hasTorrServer ? ' → TS' : ''),
        items: parsed.map(function(s) {
            return {
                title: formatStream(s),
                value: s
            };
        }),
        onSelect: function(item) {
            var s = item.value;
            
            if (hasTorrServer && s.infoHash) {
                playTorrServer(s, title, poster, s.fileIdx);
            } else if (s.url) {
                Lampa.Player.play({
                    title: title,
                    url: s.url,
                    poster: poster
                });
            } else {
                Lampa.Noty.show(s.infoHash ? 'Chưa cấu hình TorrServer!' : 'Không có link phát');
            }
        },
        onBack: function() {
            Lampa.Controller.toggle('content');
        }
    });
}

// =====================================================================
// PLAY TORRENT - MOVIE
// =====================================================================
function playTorrentMovie(card) {
    var title = card.title || card.name || '';
    var poster = card.img || card.poster || '';
    var imdbId = card.imdb_id || card.external_ids?.imdb_id || '';
    
    if (!imdbId && card.tmdb_id) {
        Lampa.Noty.show('Đang lấy IMDB ID...');
        
        getImdbId('movie', card.tmdb_id).then(function(id) {
            if (!id) {
                Lampa.Noty.show('Không tìm thấy IMDB ID');
                return;
            }
            
            card.imdb_id = id;
            playTorrentMovie(card);
        });
        return;
    }
    
    if (!imdbId) {
        Lampa.Noty.show('Không có IMDB ID');
        return;
    }
    
    Lampa.Noty.show('Đang tìm torrent...');
    
    var engine = tEngine();
    var url = '';
    
    if (engine === 'aio') {
        url = buildAIOUrl('movie', imdbId);
        if (!url) {
            Lampa.Noty.show('Chưa cấu hình AIOStreams!');
            return;
        }
    } else {
        url = buildTorrentioUrl('movie', imdbId);
    }
    
    fetchTorrentStreams(url).then(function(streams) {
        if (!streams.length) {
            Lampa.Noty.show('Không tìm thấy torrent');
            return;
        }
        
        showTorrentStreamsMenu(streams, title, poster);
    }).catch(function(e) {
        Lampa.Noty.show('Lỗi: ' + (e.message || 'Không thể tải torrent'));
    });
}

// =====================================================================
// PLAY TORRENT - TV
// =====================================================================
function playTorrentTV(card) {
    var title = card.title || card.name || '';
    var poster = card.img || card.poster || '';
    var imdbId = card.imdb_id || card.external_ids?.imdb_id || '';
    var tmdbId = card.tmdb_id || card.id;
    
    if (!imdbId && tmdbId) {
        Lampa.Noty.show('Đang lấy IMDB ID...');
        
        getImdbId('tv', tmdbId).then(function(id) {
            if (!id) {
                Lampa.Noty.show('Không tìm thấy IMDB ID');
                return;
            }
            
            card.imdb_id = id;
            playTorrentTV(card);
        });
        return;
    }
    
    if (!imdbId) {
        Lampa.Noty.show('Không có IMDB ID');
        return;
    }
    
    Lampa.Noty.show('Đang tải seasons...');
    
    getTMDBSeasons(tmdbId).then(function(seasons) {
        if (!seasons.length) {
            Lampa.Noty.show('Không tìm thấy seasons');
            return;
        }
        
        if (seasons.length === 1) {
            selectTorrentEpisode(seasons[0], imdbId, title, poster);
            return;
        }
        
        Lampa.Select.show({
            title: 'Chọn Season',
            items: seasons.map(function(s) {
                var count = s.episode_count ? ' (' + s.episode_count + ' tập)' : '';
                return {
                    title: s.name + count,
                    value: s
                };
            }),
            onSelect: function(item) {
                selectTorrentEpisode(item.value, imdbId, title, poster);
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    }).catch(function() {
        Lampa.Noty.show('Lỗi tải seasons');
    });
}

function selectTorrentEpisode(season, imdbId, title, poster) {
    var items = [];
    var epCount = season.episode_count || 10;
    
    for (var i = 1; i <= epCount; i++) {
        items.push({
            title: 'S' + padZero(season.season_number) + 'E' + padZero(i),
            value: {s: season.season_number, e: i}
        });
    }
    
    Lampa.Select.show({
        title: season.name,
        items: items,
        onSelect: function(item) {
            var s = item.value.s;
            var e = item.value.e;
            var epTitle = title + ' S' + padZero(s) + 'E' + padZero(e);
            
            Lampa.Noty.show('Đang tìm ' + epTitle + '...');
            
            var engine = tEngine();
            var url = '';
            
            if (engine === 'aio') {
                url = buildAIOUrl('tv', imdbId, s, e);
                if (!url) {
                    Lampa.Noty.show('Chưa cấu hình AIOStreams!');
                    return;
                }
            } else {
                url = buildTorrentioUrl('tv', imdbId, s, e);
            }
            
            fetchTorrentStreams(url).then(function(streams) {
                if (!streams.length) {
                    Lampa.Noty.show('Không tìm thấy');
                    return;
                }
                
                showTorrentStreamsMenu(streams, epTitle, poster);
            }).catch(function(e) {
                Lampa.Noty.show('Lỗi: ' + (e.message || ''));
            });
        },
        onBack: function() {
            Lampa.Controller.toggle('content');
        }
    });
}

function padZero(n) {
    return (n < 10 ? '0' : '') + n;
}

console.log('[KKPhim v5] Part 3 loaded - Play Functions');

// =====================================================================
// INJECT PLAY BUTTONS VÀO LAMPA FULL COMPONENT
// =====================================================================
function injectPlayButtons() {
    Lampa.Listener.follow('full', function(e) {
        if (e.type === 'complite') {
            var activity = e.object.activity;
            if (!activity) return;
            
            var card = activity.card || {};
            
            // Chỉ xử lý nếu là nguồn KKPhim
            if (card.source !== SOURCE_NAME) return;
            
            var slug = card.kkphim_slug || card.id;
            var sourceKey = card.kkphim_source_key || 'kkphim';
            var source = SOURCES[sourceKey] || SOURCES.kkphim;
            
            if (!slug) return;
            
            var render = activity.render();
            if (!render || !render.length) return;
            
            // Tìm container buttons của Lampa
            var buttonsContainer = render.find('.full-start__buttons');
            if (!buttonsContainer.length) return;
            
            // Kiểm tra đã inject chưa
            if (buttonsContainer.find('.view--kkphim').length) return;
            
            var title = card.title || card.name || '';
            var poster = card.img || card.poster || '';
            var isTV = card.type === 'tv' || card.media_type === 'tv';
            
            // ========== BUTTON 1: KKPhim/OPhim ==========
            var btnSource = $('<div class="full-start__button selector view--kkphim" data-subtitle="' + source.name + '">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
                '<path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>' +
                '<span>' + source.name + '</span></div>');
            
            btnSource.on('hover:enter', function() {
                Lampa.Noty.show('Đang tải...');
                
                // Kiểm tra cache trước
                var cached = getEpisodesFromCache(slug, sourceKey);
                if (cached) {
                    playEpisode(card, cached);
                    return;
                }
                
                // Fetch episodes
                fetchSourceDetail(source, slug).then(function(data) {
                    var episodes = data.episodes || [];
                    setEpisodesCache(slug, sourceKey, episodes);
                    
                    if (!episodes.length) {
                        Lampa.Noty.show('Không có tập phim');
                        return;
                    }
                    
                    playEpisode(card, episodes);
                }).catch(function() {
                    Lampa.Noty.show('Lỗi tải phim');
                });
            });
            
            // ========== BUTTON 2: Torrent ==========
            var engineName = tEngine() === 'aio' ? 'AIO' : 'Torrent';
            var btnTorrent = $('<div class="full-start__button selector view--torrent" data-subtitle="' + engineName + '">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                '<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
                '<path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                '<span>' + engineName + '</span></div>');
            
            btnTorrent.on('hover:enter', function() {
                if (isTV) {
                    playTorrentTV(card);
                } else {
                    playTorrentMovie(card);
                }
            });
            
            // ========== BUTTON 3: TorrServer (nếu có cấu hình) ==========
            if (tsHost()) {
                var btnTS = $('<div class="full-start__button selector view--torrserver" data-subtitle="TorrServer">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44">' +
                    '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>' +
                    '<path d="M3 9H21M9 3V21" stroke="currentColor" stroke-width="1.5"/></svg>' +
                    '<span>TorrServer</span></div>');
                
                btnTS.on('hover:enter', function() {
                    if (isTV) {
                        playTorrentTV(card);
                    } else {
                        playTorrentMovie(card);
                    }
                });
                
                buttonsContainer.append(btnTS);
            }
            
            // Insert buttons
            var torrentBtn = buttonsContainer.find('.view--torrent').first();
            if (torrentBtn.length) {
                torrentBtn.after(btnTorrent);
                torrentBtn.after(btnSource);
            } else {
                buttonsContainer.prepend(btnTorrent);
                buttonsContainer.prepend(btnSource);
            }
            
            console.log('[KKPhim] Injected play buttons for:', title);
        }
        
        // Cleanup khi destroy
        if (e.type === 'destroy') {
            var activity = e.object.activity;
            if (activity && activity.card) {
                var slug = activity.card.kkphim_slug || activity.card.id;
                var sourceKey = activity.card.kkphim_source_key || 'kkphim';
                if (slug && sourceKey) {
                    // Không clear cache ngay, giữ lại cho lần sau
                    // clearEpisodesCache();
                }
            }
        }
    });
}

// =====================================================================
// SETTINGS COMPONENT
// =====================================================================
function createSettingsComponent() {
    Lampa.Component.add('kkphim_settings', function(obj) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var component = this;
        
        this.create = function() {
            var settings = getSettings();
            var html = $('<div class="settings-list"></div>');
            
            // Title
            html.append('<div class="settings-param" style="padding: 1.5em; font-size: 1.2em; font-weight: bold; opacity: 0.8;">⚙️ Cài đặt KKPhim</div>');
            
            // ===== NGUỒN PHIM =====
            html.append(makeGroupTitle('📺 Nguồn phim'));
            
            Object.keys(SOURCES).forEach(function(key) {
                var source = SOURCES[key];
                var enabled = isSourceEnabled(key);
                
                html.append(makeToggle(
                    source.name,
                    'API: ' + source.api,
                    enabled,
                    function() {
                        var obj = {};
                        obj['source_' + key + '_enabled'] = !enabled;
                        saveSettings(obj);
                        Lampa.Noty.show(source.name + ': ' + (enabled ? 'Đã tắt' : 'Đã bật'));
                        component.create();
                    }
                ));
            });
            
            // ===== NGÔN NGỮ TMDB =====
            html.append(makeGroupTitle('🌐 Ngôn ngữ TMDB'));
            
            var currentLang = settings.tmdb_lang || 'vi-VN';
            var langs = [
                {key: 'vi-VN', name: 'Tiếng Việt'},
                {key: 'en-US', name: 'English'},
                {key: 'ja-JP', name: '日本語'},
                {key: 'ko-KR', name: '한국어'},
                {key: 'zh-CN', name: '中文'}
            ];
            
            langs.forEach(function(lang) {
                html.append(makeToggle(
                    lang.name,
                    lang.key,
                    currentLang === lang.key,
                    function() {
                        saveSettings({tmdb_lang: lang.key});
                        component.create();
                    }
                ));
            });
            
            // ===== TORRENT ENGINE =====
            html.append(makeGroupTitle('🎯 Nguồn Torrent'));
            
            var currentEngine = settings.torrent_engine || 'torrentio';
            
            html.append(makeToggle(
                'Torrentio',
                'Stremio addon mặc định',
                currentEngine === 'torrentio',
                function() {
                    saveSettings({torrent_engine: 'torrentio'});
                    component.create();
                }
            ));
            
            html.append(makeToggle(
                'AIOStreams',
                'All-in-one torrent addon',
                currentEngine === 'aio',
                function() {
                    saveSettings({torrent_engine: 'aio'});
                    component.create();
                }
            ));
            
            // ===== TORRSERVER =====
            html.append(makeGroupTitle('🖥️ TorrServer'));
            
            html.append(makeInput(
                'Địa chỉ TorrServer',
                '192.168.1.100:8090',
                settings.torrserver_host || '',
                function(value) {
                    saveSettings({torrserver_host: value});
                    Lampa.Noty.show('Đã lưu');
                }
            ));
            
            html.append(makeInput(
                'Mật khẩu',
                'Để trống nếu không có',
                settings.torrserver_password ? '••••••' : '',
                function(value) {
                    saveSettings({torrserver_password: value});
                    Lampa.Noty.show('Đã lưu');
                }
            ));
            
            // Test TorrServer
            var testBtn = makeButton('🧪 Test TorrServer', 'Kiểm tra kết nối');
            testBtn.on('hover:enter', function() {
                var host = tsHost();
                if (!host) {
                    Lampa.Noty.show('Chưa nhập địa chỉ TorrServer');
                    return;
                }
                
                Lampa.Noty.show('Đang kiểm tra...');
                
                var url = getTorrServerUrl('/echo');
                var headers = getTorrServerHeaders();
                
                fetch(url, {
                    method: 'GET',
                    headers: headers,
                    timeout: 5000
                }).then(function(r) {
                    if (r.ok) {
                        Lampa.Noty.show('✅ Kết nối thành công!');
                    } else {
                        Lampa.Noty.show('❌ Lỗi: ' + r.status);
                    }
                }).catch(function(e) {
                    Lampa.Noty.show('❌ Không thể kết nối: ' + (e.message || ''));
                });
            });
            html.append(testBtn);
            
            // ===== TORRENTIO CONFIG =====
            html.append(makeGroupTitle('🧲 Torrentio'));
            
            html.append(makeInput(
                'Config',
                'Dán link manifest hoặc config string',
                settings.torrentio_config ? 'Đã cấu hình' : '',
                function(value) {
                    saveSettings({torrentio_config: value});
                    Lampa.Noty.show('Đã lưu');
                }
            ));
            
            // ===== AIOSTREAMS =====
            html.append(makeGroupTitle('🌊 AIOStreams'));
            
            html.append(makeInput(
                'URL',
                'Dán full URL manifest',
                settings.aio_url || '',
                function(value) {
                    saveSettings({aio_url: value});
                    Lampa.Noty.show('Đã lưu');
                }
            ));
            
            // ===== RESET =====
            html.append(makeGroupTitle('🗑️ Quản lý dữ liệu'));
            
            var resetBtn = makeButton('Xóa tất cả cài đặt', 'Khôi phục mặc định');
            resetBtn.on('hover:enter', function() {
                Lampa.Select.show({
                    title: 'Xác nhận',
                    items: [
                        {title: 'Hủy', value: false},
                        {title: 'Xóa tất cả', value: true}
                    ],
                    onSelect: function(item) {
                        if (item.value) {
                            localStorage.removeItem(STG_KEY);
                            clearEpisodesCache();
                            Lampa.Noty.show('Đã xóa tất cả cài đặt');
                            Lampa.Activity.backward();
                        }
                    }
                });
            });
            html.append(resetBtn);
            
            // Version
            html.append('<div class="settings-param" style="padding: 1.5em; text-align: center; opacity: 0.4; font-size: 0.9em;">KKPhim v5.0</div>');
            
            scroll.append(html);
            component.start();
        };
        
        // Helper functions cho settings UI
        function makeGroupTitle(title) {
            return $('<div class="settings-param-title" style="padding: 1.2em 1.5em 0.5em; font-size: 1.1em; font-weight: 600; opacity: 0.7;">' + title + '</div>');
        }
        
        function makeToggle(name, desc, checked, callback) {
            var item = $('<div class="settings-param selector" style="padding: 0.8em 1.5em;">' +
                '<div class="settings-param__name">' + name + '</div>' +
                '<div class="settings-param__descr" style="opacity: 0.5; font-size: 0.9em;">' + desc + '</div>' +
                '<div class="settings-param__value">' + (checked ? '✅' : '○') + '</div>' +
                '</div>');
            
            item.on('hover:enter', callback);
            return item;
        }
        
        function makeInput(name, placeholder, currentValue, callback) {
            var item = $('<div class="settings-param selector" style="padding: 0.8em 1.5em;">' +
                '<div class="settings-param__name">' + name + '</div>' +
                '<div class="settings-param__descr" style="opacity: 0.5; font-size: 0.9em;">' + placeholder + '</div>' +
                '<div class="settings-param__value" style="font-size: 0.9em;">' + (currentValue || 'Chưa cài') + '</div>' +
                '</div>');
            
            item.on('hover:enter', function() {
                if (Lampa.Input && Lampa.Input.edit) {
                    Lampa.Input.edit({
                        title: name,
                        value: currentValue,
                        free: true,
                        nosave: true
                    }, callback);
                } else {
                    var value = window.prompt(name, currentValue);
                    if (value !== null) {
                        callback(value.trim());
                    }
                }
            });
            
            return item;
        }
        
        function makeButton(name, desc) {
            return $('<div class="settings-param selector" style="padding: 0.8em 1.5em;">' +
                '<div class="settings-param__name">' + name + '</div>' +
                '<div class="settings-param__descr" style="opacity: 0.5; font-size: 0.9em;">' + desc + '</div>' +
                '<div class="settings-param__value">▶</div>' +
                '</div>');
        }
        
        this.start = function() {
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up: function() {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function() {
                    Navigator.move('down');
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });
            
            Lampa.Controller.toggle('content');
        };
        
        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    });
}

// =====================================================================
// INJECT CSS - Ẩn các label không cần thiết
// =====================================================================
function injectCSS() {
    if (document.getElementById('kkphim-css')) return;
    
    var style = document.createElement('style');
    style.id = 'kkphim-css';
    style.textContent = `
        /* Ẩn type labels mặc định của Lampa */
        .card__type { display: none !important; }
        .card-label--type { display: none !important; }
        .card__label--tv { display: none !important; }
        .item__type { display: none !important; }
        
        /* Selectbox cho torrent menu - cho phép wrap text */
        .selectbox .selectbox-item__title {
            white-space: pre-wrap !important;
            overflow: visible !important;
            text-overflow: unset !important;
            -webkit-line-clamp: unset !important;
            display: block !important;
        }
        
        .selectbox .selectbox-item {
            height: auto !important;
            max-height: none !important;
            padding: 0.8em 1.5em !important;
        }
    `;
    
    document.head.appendChild(style);
}

// =====================================================================
// ADD MENU ITEM
// =====================================================================
function addMenuItem() {
    function insertMenu() {
        if ($('.menu__item[data-action="kkphim"]').length) return;
        
        var menuItem = $(
            '<li class="menu__item selector" data-action="kkphim">' +
            '<div class="menu__ico">' + MENU_ICON + '</div>' +
            '<div class="menu__text">' + SOURCE_TITLE + '</div>' +
            '</li>'
        );
        
        menuItem.on('hover:enter', function() {
            Lampa.Activity.push({
                url: '',
                title: SOURCE_TITLE,
                component: 'category',
                source: SOURCE_NAME,
                page: 1
            });
        });
        
        $('.menu .menu__list').eq(0).append(menuItem);
        
        console.log('[KKPhim] Menu item added');
    }
    
    // Insert sau khi app ready
    setTimeout(insertMenu, 500);
    
    // Đảm bảo insert khi app reload
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            setTimeout(insertMenu, 500);
        }
    });
}

// =====================================================================
// THÊM NÚT CÀI ĐẶT VÀO MENU
// =====================================================================
function addSettingsToMenu() {
    setTimeout(function() {
        if ($('.menu__item[data-action="kkphim_settings"]').length) return;
        
        var settingsItem = $(
            '<li class="menu__item selector" data-action="kkphim_settings">' +
            '<div class="menu__ico">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>' +
            '</div>' +
            '<div class="menu__text">Cài đặt ' + SOURCE_TITLE + '</div>' +
            '</li>'
        );
        
        settingsItem.on('hover:enter', function() {
            Lampa.Activity.push({
                url: '',
                title: 'Cài đặt ' + SOURCE_TITLE,
                component: 'kkphim_settings',
                page: 1
            });
        });
        
        // Insert sau menu item chính
        var mainItem = $('.menu__item[data-action="kkphim"]');
        if (mainItem.length) {
            mainItem.after(settingsItem);
        } else {
            $('.menu .menu__list').eq(0).append(settingsItem);
        }
        
    }, 600);
}

// =====================================================================
// KHỞI ĐỘNG PLUGIN
// =====================================================================
function startPlugin() {
    console.log('[KKPhim v5] Starting plugin...');
    
    // 1. Inject CSS
    injectCSS();
    
    // 2. Đăng ký API
    registerAPI();
    
    // 3. Inject play buttons
    injectPlayButtons();
    
    // 4. Tạo Settings component
    createSettingsComponent();
    
    // 5. Add menu items
    addMenuItem();
    addSettingsToMenu();
    
    console.log('[KKPhim v5] Plugin started successfully! ✅');
}

// =====================================================================
// AUTO START
// =====================================================================
if (window.appready) {
    startPlugin();
} else {
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            startPlugin();
        }
    });
}

console.log('[KKPhim v5] Part 4 loaded - Complete! 🎉');

})();