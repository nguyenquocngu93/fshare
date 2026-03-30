(function () {
    'use strict';

    if (window.__kkphim_plugin_started) return;
    window.__kkphim_plugin_started = true;

    var SOURCES = {
        kkphim: { key: 'kkphim', name: 'KKPhim', api: 'https://phimapi.com/', img: 'https://phimimg.com/' },
        ophim: { key: 'ophim', name: 'OPhim', api: 'https://ophim1.com/', img: 'https://img.ophim.live/uploads/movies/' }
    };

    var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_IMG = 'https://image.tmdb.org/t/p/original';
    var TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var SETTINGS_KEY = 'kkphim_settings';

    function loadSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } }
    function saveSettings(o) { try { var c = loadSettings(); Object.keys(o).forEach(function (k) { c[k] = o[k]; }); localStorage.setItem(SETTINGS_KEY, JSON.stringify(c)); } catch (e) {} }
    function getSourceKey() { return loadSettings().source || 'ophim'; }
    function getSource() { return SOURCES[getSourceKey()] || SOURCES.ophim; }
    function SRC_API() { return getSource().api; }
    function SRC_IMG() { return getSource().img; }
    function getTSHost() { return loadSettings().torrserver_host || ''; }
    function getTSPass() { return loadSettings().torrserver_password || ''; }
    function getTioConfig() { return loadSettings().torrentio_config || ''; }

    function fullImg(u) {
        if (!u) return '';
        if (u.indexOf('http') === 0) return u;
        var base = SRC_IMG();
        return base ? base + u : u;
    }

    function cleanTioConfig(raw) {
        if (!raw) return '';
        raw = String(raw).trim();
        if (!raw) return '';
        var m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
        if (m) return m[1];
        m = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
        if (m) return m[1].replace(/\/+$/, '');
        m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
        if (m) return m[1];
        if (raw.indexOf('torrentio.strem.fun') > -1) {
            raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i, '').replace(/^\/+|\/+$/g, '');
            if (raw && raw.indexOf('=') > -1) return raw.replace(/\|/g, '%7C');
            return '';
        }
        raw = raw.replace(/^\/+|\/+$/g, '').replace(/\|/g, '%7C');
        return raw.indexOf('=') === -1 ? '' : raw;
    }

    function tsUrl(p) {
        var h = getTSHost();
        if (!h) return '';
        h = h.replace(/\/+$/, '');
        if (h.indexOf('http') !== 0) h = 'http://' + h;
        return h + p;
    }

    function tsHdr() {
        var h = { 'Content-Type': 'application/json' };
        var pw = getTSPass();
        if (pw) h['Authorization'] = 'Basic ' + btoa('admin:' + pw);
        return h;
    }

    async function tsAdd(mag, title, poster) {
        var u = tsUrl('/torrents');
        if (!u) throw new Error('TS chua cau hinh');
        var r = await fetch(u, { method: 'POST', headers: tsHdr(), body: JSON.stringify({ action: 'add', link: mag, title: title || '', poster: poster || '', save_to_db: false }) });
        if (!r.ok) throw new Error('TS:' + r.status);
        return await r.json();
    }

    async function tsGetFiles(hash) {
        var u = tsUrl('/torrents');
        if (!u) throw new Error('TS chua cau hinh');
        var r = await fetch(u, { method: 'POST', headers: tsHdr(), body: JSON.stringify({ action: 'get', hash: hash }) });
        if (!r.ok) throw new Error('TS:' + r.status);
        return await r.json();
    }

    function buildMag(h) {
        var m = 'magnet:?xt=urn:btih:' + h;
        var trackers = [
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://open.stealth.si:80/announce',
            'udp://tracker.torrent.eu.org:451/announce',
            'udp://open.demonii.com:1337/announce',
            'udp://exodus.desync.com:6969/announce',
            'udp://tracker.openbittorrent.com:6969/announce'
        ];
        trackers.forEach(function (t) { m += '&tr=' + encodeURIComponent(t); });
        return m;
    }

    async function playViaTS(stream, title, poster, fileIdx) {
        if (!getTSHost()) { Lampa.Noty.show('Chua cau hinh TorrServer!'); return; }
        Lampa.Noty.show('Dang gui TorrServer...');
        try {
            var td = await tsAdd(buildMag(stream.infoHash), title, poster);
            var hash = td.hash || stream.infoHash;
            await delay(2000);
            var info = null, rt = 0;
            while (rt < 3) {
                try {
                    info = await tsGetFiles(hash);
                    if (info && info.file_stats && info.file_stats.length) break;
                } catch (e) {}
                rt++;
                await delay(1500);
            }
            var files = [];
            if (info && info.file_stats) {
                files = info.file_stats.filter(function (f) {
                    return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);
                }).sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
            }

            var playUrl;
            if (!files.length) {
                playUrl = tsUrl('/stream/fname?link=' + hash + '&index=0&play');
            } else if (files.length === 1) {
                playUrl = tsUrl('/stream/fname?link=' + hash + '&index=' + (files[0].id || 0) + '&play');
            } else if (fileIdx !== undefined && fileIdx !== null && fileIdx >= 0 && fileIdx < files.length) {
                playUrl = tsUrl('/stream/fname?link=' + hash + '&index=' + (files[fileIdx].id || fileIdx) + '&play');
            } else {
                Lampa.Select.show({
                    title: 'File (' + files.length + ')',
                    items: files.map(function (f, i) {
                        var n = (f.path || ('File ' + i)).split('/').pop();
                        var s = f.length ? (f.length / 1048576).toFixed(0) + 'MB' : '';
                        return { title: n + (s ? ' (' + s + ')' : ''), value: f };
                    }),
                    onSelect: function (a) {
                        Lampa.Player.play({ title: title + ' - ' + (a.value.path || '').split('/').pop(), url: tsUrl('/stream/fname?link=' + hash + '&index=' + a.value.id + '&play') });
                    },
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
                return;
            }
            Lampa.Player.play({ title: title, url: playUrl });
        } catch (e) {
            Lampa.Noty.show('Loi TS: ' + (e.message || ''));
        }
    }

    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    async function tmdbFetch(path) {
        var r = await fetch('https://api.themoviedb.org/3' + path, {
            headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN, 'Content-Type': 'application/json' }
        });
        if (!r.ok) throw new Error('TMDB ' + r.status);
        return await r.json();
    }

    async function getImdbId(type, id) {
        if (!id) return null;
        try { return (await tmdbFetch('/' + type + '/' + id + '/external_ids')).imdb_id || null; } catch (e) { return null; }
    }

    async function getTmdbSeasons(id) {
        try {
            var r = await tmdbFetch('/tv/' + id + '?language=vi-VN');
            if (r && r.seasons) {
                return r.seasons.filter(function (s) { return s.season_number > 0; }).map(function (s) {
                    return { season_number: s.season_number, name: s.name || ('Season ' + s.season_number), episode_count: s.episode_count || 0 };
                });
            }
        } catch (e) {}
        return [];
    }

    async function tmdbTrending(page) { return await tmdbFetch('/trending/all/week?language=vi-VN&page=' + (page || 1)); }
    async function tmdbPopularMovies(page) { return await tmdbFetch('/movie/popular?language=vi-VN&page=' + (page || 1)); }
    async function tmdbPopularTV(page) { return await tmdbFetch('/tv/popular?language=vi-VN&page=' + (page || 1)); }
    async function tmdbTopRatedMovies(page) { return await tmdbFetch('/movie/top_rated?language=vi-VN&page=' + (page || 1)); }
    async function tmdbTopRatedTV(page) { return await tmdbFetch('/tv/top_rated?language=vi-VN&page=' + (page || 1)); }
    async function tmdbSearchMulti(query, page) { return await tmdbFetch('/search/multi?language=vi-VN&query=' + encodeURIComponent(query) + '&page=' + (page || 1)); }
    async function tmdbDetailFull(type, id) { return await tmdbFetch('/' + type + '/' + id + '?language=vi-VN&append_to_response=credits,images,similar,external_ids'); }
    async function tmdbImagesFull(type, id) { return await tmdbFetch('/' + type + '/' + id + '/images'); }

    function tmdbNormCard(item) {
        if (!item) return null;
        var mt = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        return {
            tmdb_id: item.id,
            media_type: mt,
            name: item.title || item.name || '',
            origin_name: item.original_title || item.original_name || '',
            poster_url: item.poster_path ? TMDB_IMG_W500 + item.poster_path : '',
            year: (item.release_date || item.first_air_date || '').slice(0, 4),
            vote: item.vote_average ? Number(item.vote_average).toFixed(1) : '',
            overview: item.overview || ''
        };
    }

    async function searchSourceSlug(source, kw) {
        try {
            var r = await fetch(source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=1');
            if (!r.ok) return [];
            var d = await r.json();
            return (d && d.data && d.data.items) || (d && d.items) || [];
        } catch (e) { return []; }
    }

    function normStr(s) {
        return String(s || '').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '').replace(/\s+/g, ' ');
    }

    function matchBest(items, title, origTitle, year) {
        if (!items || !items.length) return null;
        var nT = normStr(title);
        var nO = normStr(origTitle);
        for (var i = 0; i < items.length; i++) {
            var n1 = normStr(items[i].name || items[i].title || '');
            var n2 = normStr(items[i].origin_name || items[i].original_name || '');
            if ((nT && (n1 === nT || n2 === nT)) || (nO && (n1 === nO || n2 === nO))) {
                if (!year || !items[i].year || String(items[i].year) === String(year)) return items[i];
            }
        }
        for (var j = 0; j < items.length; j++) {
            var m1 = normStr(items[j].name || items[j].title || '');
            var m2 = normStr(items[j].origin_name || items[j].original_name || '');
            if ((nT && (m1.indexOf(nT) > -1 || nT.indexOf(m1) > -1)) || (nO && (m2.indexOf(nO) > -1 || nO.indexOf(m2) > -1))) {
                if (!year || !items[j].year || String(items[j].year) === String(year)) return items[j];
            }
        }
        return null;
    }

    async function findAllSlugs(title, origTitle, year) {
        var results = { kkphim: null, ophim: null };
        var terms = [title];
        if (origTitle && origTitle !== title) terms.push(origTitle);
        for (var i = 0; i < terms.length; i++) {
            if (!results.kkphim) {
                var items1 = await searchSourceSlug(SOURCES.kkphim, terms[i]);
                var f1 = matchBest(items1, title, origTitle, year);
                if (f1 && f1.slug) results.kkphim = f1.slug;
            }
            if (!results.ophim) {
                var items2 = await searchSourceSlug(SOURCES.ophim, terms[i]);
                var f2 = matchBest(items2, title, origTitle, year);
                if (f2 && f2.slug) results.ophim = f2.slug;
            }
            if (results.kkphim && results.ophim) break;
        }
        return results;
    }

    async function fetchDetail(source, slug) {
        try {
            var r = await fetch(source.api + 'phim/' + slug);
            if (!r.ok) return null;
            var d = await r.json();
            return { movie: d.movie || d || {}, episodes: d.episodes || [] };
        } catch (e) { return null; }
    }

    async function findAllSeasonSlugs(source, title, origTitle) {
        var results = [];
        try {
            var items = await searchSourceSlug(source, title);
            if (!items.length && origTitle) items = await searchSourceSlug(source, origTitle);
            var nT = normStr(title);
            var nO = normStr(origTitle);
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                if (!it.slug) continue;
                var n1 = normStr(it.name || it.title || '');
                var n2 = normStr(it.origin_name || it.original_name || '');
                var match = false;
                if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1 || n1 === nT)) match = true;
                if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1 || n2 === nO)) match = true;
                if (!match && results.length > 0) {
                    var baseSlug = normStr(results[0].slug);
                    var curSlug = normStr(it.slug);
                    if (curSlug.indexOf(baseSlug) > -1 || baseSlug.indexOf(curSlug) > -1) match = true;
                }
                if (match) {
                    var sn = extractSeasonNum(it.name || it.title || '', it.slug || '');
                    results.push({ slug: it.slug, name: it.name || it.title || '', season: sn, source: source });
                }
            }
        } catch (e) {}
        return results;
    }

    function extractSeasonNum(name, slug) {
        var m = name.match(/season\s*(\d+)/i) || name.match(/ph\u1ea7n\s*(\d+)/i) || name.match(/m\u00f9a\s*(\d+)/i) ||
                slug.match(/season-(\d+)/i) || slug.match(/phan-(\d+)/i) || slug.match(/mua-(\d+)/i) ||
                name.match(/S(\d+)/);
        if (m) return parseInt(m[1]);
        var numMatch = name.match(/(\d+)$/) || slug.match(/-(\d+)$/);
        if (numMatch) {
            var n = parseInt(numMatch[1]);
            if (n >= 2 && n <= 30) return n;
        }
        return 1;
    }

    async function gatherAllSeasons(title, origTitle, slugs) {
        var allSeasonSlugs = [];
        var kkSeasons = await findAllSeasonSlugs(SOURCES.kkphim, title, origTitle);
        kkSeasons.forEach(function (s) { allSeasonSlugs.push(s); });
        var opSeasons = await findAllSeasonSlugs(SOURCES.ophim, title, origTitle);
        opSeasons.forEach(function (s) { allSeasonSlugs.push(s); });
        if (!allSeasonSlugs.length) {
            if (slugs.kkphim) allSeasonSlugs.push({ slug: slugs.kkphim, name: title, season: 1, source: SOURCES.kkphim });
            if (slugs.ophim) allSeasonSlugs.push({ slug: slugs.ophim, name: title, season: 1, source: SOURCES.ophim });
        }
        var seasonMap = {};
        allSeasonSlugs.forEach(function (s) {
            var key = s.season;
            if (!seasonMap[key]) seasonMap[key] = [];
            seasonMap[key].push(s);
        });
        return seasonMap;
    }

    async function loadSeasonEpisodes(seasonEntry) {
        var detail = await fetchDetail(seasonEntry.source, seasonEntry.slug);
        if (!detail || !detail.episodes || !detail.episodes.length) return [];
        var eps = [];
        detail.episodes.forEach(function (sv) {
            (sv.server_data || []).forEach(function (ep) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                if (link) {
                    eps.push({
                        name: ep.name || ep.slug || '',
                        slug: ep.slug || '',
                        link: link,
                        server: sv.server_name || 'Server',
                        source: seasonEntry.source.name
                    });
                }
            });
        });
        var seen = {};
        return eps.filter(function (e) {
            var k = e.name;
            if (seen[k]) return false;
            seen[k] = true;
            return true;
        });
    }

    function tioUrl(type, imdbId, s, e) {
        var t = type === 'tv' ? 'series' : 'movie';
        var id = imdbId;
        if (type === 'tv' && s && e) id = imdbId + ':' + s + ':' + e;
        var c = cleanTioConfig(getTioConfig());
        return TORRENTIO_BASE + (c ? '/' + c : '') + '/stream/' + t + '/' + id + '.json';
    }

    async function fetchTio(type, imdbId, s, e) {
        var r = await fetch(tioUrl(type, imdbId, s, e));
        if (!r.ok) throw new Error('Tio ' + r.status);
        var d = await r.json();
        return (d.streams || []).map(function (st) {
            var lines = (st.title || '').split('\n');
            var name = lines[0] || '?';
            var info = lines.slice(1).join(' | ');
            var sm = info.match(/\u{1F4BE}\s*([\d.]+\s*[GMKT]B)/iu) || info.match(/([\d.]+\s*[GMKT]B)/i);
            var sd = info.match(/\u{1F464}\s*(\d+)/u);
            return {
                name: name, title: st.title || '', infoHash: st.infoHash || '',
                fileIdx: st.fileIdx, url: st.url || '',
                size: sm ? sm[1] : '', seeds: sd ? sd[1] : '', rawName: st.name || ''
            };
        });
    }

    function showTioResults(streams, title, poster) {
        var ts = !!getTSHost();
        Lampa.Select.show({
            title: 'Torrent ' + title + ' (' + streams.length + ')' + (ts ? ' > TS' : ''),
            items: streams.slice(0, 40).map(function (s) {
                var l = s.name;
                if (s.size) l += ' | ' + s.size;
                if (s.seeds) l += ' | S:' + s.seeds;
                if (s.rawName) l += ' [' + s.rawName + ']';
                return { title: l, value: s };
            }),
            onSelect: function (a) {
                var s = a.value;
                if (ts && s.infoHash) playViaTS(s, title, poster, s.fileIdx);
                else if (s.url) Lampa.Player.play({ title: title, url: s.url });
                else Lampa.Noty.show(s.infoHash ? 'Chua cau hinh TS!' : 'Khong co link');
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    async function openTorrentMovie(tmdbId, title, poster, imdbId) {
        Lampa.Noty.show('Tim torrent...');
        try {
            var imdb = imdbId || await getImdbId('movie', tmdbId);
            if (!imdb) { Lampa.Noty.show('Khong tim IMDB ID'); return; }
            var streams = await fetchTio('movie', imdb);
            if (!streams.length) { Lampa.Noty.show('Khong co torrent'); return; }
            showTioResults(streams, title, poster);
        } catch (e) { Lampa.Noty.show('Loi: ' + (e.message || '')); }
    }

    async function openTorrentTV(tmdbId, title, poster, imdbId) {
        Lampa.Noty.show('Tai seasons...');
        try {
            var imdb = imdbId || await getImdbId('tv', tmdbId);
            if (!imdb) { Lampa.Noty.show('Khong tim IMDB ID'); return; }
            var seasons = await getTmdbSeasons(tmdbId);
            if (seasons.length > 1) {
                Lampa.Select.show({
                    title: 'Season',
                    items: seasons.map(function (s) {
                        return { title: s.name + (s.episode_count ? ' (' + s.episode_count + ' tap)' : ''), value: s };
                    }),
                    onSelect: function (a) { pickTorrentEp(a.value, imdb, title, poster); },
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
            } else if (seasons.length === 1) {
                pickTorrentEp(seasons[0], imdb, title, poster);
            } else {
                promptTorrentEp(1, imdb, title, poster);
            }
        } catch (e) { Lampa.Noty.show('Loi: ' + (e.message || '')); }
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function pickTorrentEp(season, imdb, title, poster) {
        if (!season.episode_count) { promptTorrentEp(season.season_number, imdb, title, poster); return; }
        var items = [];
        for (var i = 1; i <= season.episode_count; i++) {
            items.push({ title: 'S' + pad(season.season_number) + 'E' + pad(i), value: { s: season.season_number, e: i } });
        }
        Lampa.Select.show({
            title: season.name,
            items: items,
            onSelect: async function (a) {
                var label = title + ' S' + pad(a.value.s) + 'E' + pad(a.value.e);
                Lampa.Noty.show('Tim ' + label + '...');
                try {
                    var streams = await fetchTio('tv', imdb, a.value.s, a.value.e);
                    if (!streams.length) { Lampa.Noty.show('Khong co torrent'); return; }
                    showTioResults(streams, label, poster);
                } catch (e) { Lampa.Noty.show('Loi: ' + (e.message || '')); }
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    function promptTorrentEp(ds, imdb, title, poster) {
        try {
            if (Lampa.Input && Lampa.Input.edit) {
                Lampa.Input.edit({ title: 'Season:Episode', value: ds + ':1', free: true }, async function (v) {
                    var p = String(v || ds + ':1').split(':');
                    var s = parseInt(p[0]) || ds;
                    var e = parseInt(p[1]) || 1;
                    var label = title + ' S' + pad(s) + 'E' + pad(e);
                    Lampa.Noty.show('Tim ' + label + '...');
                    try {
                        var streams = await fetchTio('tv', imdb, s, e);
                        if (!streams.length) { Lampa.Noty.show('Khong co torrent'); return; }
                        showTioResults(streams, label, poster);
                    } catch (err) { Lampa.Noty.show('Loi: ' + (err.message || '')); }
                });
                return;
            }
        } catch (e) {}
        var v = window.prompt('Season:Episode', ds + ':1');
        var p = String(v || ds + ':1').split(':');
        var s = parseInt(p[0]) || ds;
        var e2 = parseInt(p[1]) || 1;
        var label = title + ' S' + pad(s) + 'E' + pad(e2);
        Lampa.Noty.show('Tim ' + label + '...');
        fetchTio('tv', imdb, s, e2).then(function (streams) {
            if (!streams.length) { Lampa.Noty.show('Khong co torrent'); return; }
            showTioResults(streams, label, '');
        }).catch(function (err) { Lampa.Noty.show('Loi: ' + (err.message || '')); });
    }

    function detectType(d) {
        if (d && d.tmdb && d.tmdb.type === 'tv') return 'tv';
        if (d && d.tmdb && d.tmdb.type === 'movie') return 'movie';
        if (d && (d.type === 'series' || d.type === 'tvshows' || d.type === 'hoathinh')) return 'tv';
        if (d && d.episode_total && d.episode_total !== '1') return 'tv';
        return 'movie';
    }

    function getTmdbId(d) { return (d && d.tmdb && d.tmdb.id) ? d.tmdb.id : null; }

    function pickLogo(imgs) {
        if (!imgs || !imgs.logos || !imgs.logos.length) return null;
        return imgs.logos.find(function (l) { return l.iso_639_1 === 'vi'; }) ||
               imgs.logos.find(function (l) { return l.iso_639_1 === 'en'; }) ||
               imgs.logos[0] || null;
    }

    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function cleanDesc(s) { return String(s || '').replace(/<[^>]+>/g, '').trim() || 'Khong co mo ta'; }
    function fmtTxt(s) { return esc(s || '').replace(/\n/g, '<br>'); }

    function norm(i) {
        if (!i) return null;
        return {
            name: i.name || i.title || '',
            origin_name: i.origin_name || '',
            slug: i.slug || '',
            poster_url: i.poster_url || i.poster || '',
            thumb_url: i.thumb_url || i.thumb || '',
            year: i.year || '',
            quality: i.quality || '',
            episode_current: i.episode_current || '',
            tmdb: i.tmdb || {},
            category: Array.isArray(i.category) ? i.category : [],
            director: i.director || '',
            content: i.content || '',
            time: i.time || '',
            episode_total: i.episode_total || '',
            type: i.type || ''
        };
    }

    function getFirstEp(eps) {
        for (var i = 0; i < (eps || []).length; i++) {
            if (eps[i] && eps[i].server_data && eps[i].server_data.length) return eps[i].server_data[0];
        }
        return null;
    }

    function bindEnter(el, fn) {
        var sx = 0, sy = 0, moved = false, touched = false;
        el.on('touchstart', function (e) {
            var t = ((e.originalEvent || e).touches || [])[0];
            if (t) { sx = t.clientX; sy = t.clientY; moved = false; }
        });
        el.on('touchmove', function (e) {
            var t = ((e.originalEvent || e).touches || [])[0];
            if (t && (Math.abs(t.clientX - sx) > 16 || Math.abs(t.clientY - sy) > 16)) moved = true;
        });
        el.on('touchend', function (e) {
            if (moved) return;
            touched = true; e.preventDefault(); e.stopPropagation();
            setTimeout(function () { fn.call(el[0], e); }, 100);
            setTimeout(function () { touched = false; }, 350);
        });
        el.on('click', function (e) {
            if (touched || moved) return;
            e.preventDefault(); e.stopPropagation();
            fn.call(this, e);
        });
        el.on('hover:enter', function (e) { fn.call(this, e); });
    }

    function openSearch() {
        function go(kw) {
            kw = String(kw || '').trim();
            if (kw) Lampa.Activity.push({ url: '', title: 'Tim', component: 'kkphim_search', keyword: kw, page_num: 1 });
        }
        try {
            if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: 'Tim phim', value: '', free: true }, go); return; }
        } catch (e) {}
        go(window.prompt('Tim phim:'));
    }

    function openTmdbSearch() {
        function go(kw) {
            kw = String(kw || '').trim();
            if (kw) Lampa.Activity.push({ url: '', title: 'TMDB: ' + kw, component: 'kkphim_tmdb_search', keyword: kw, page_num: 1 });
        }
        try {
            if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: 'Tim phim TMDB', value: '', free: true }, go); return; }
        } catch (e) {}
        go(window.prompt('Tim phim TMDB:'));
    }

    function enableScroll(scroll) {
        var el = scroll.render();
        el.css({ overflow: 'hidden', position: 'relative', height: '100%' });
        var b = el.find('.scroll__body');
        var p = {
            transform: 'none', 'overflow-y': 'auto', 'overflow-x': 'hidden',
            '-webkit-overflow-scrolling': 'touch', height: '100%', 'padding-bottom': '8em', 'touch-action': 'pan-y'
        };
        b.css($.extend({ position: 'relative' }, p));
        if (b[0]) Object.keys(p).forEach(function (k) { b[0].style.setProperty(k, p[k], 'important'); });
    }

    function clearScroll(s) { try { s.render().find('.scroll__body').empty(); } catch (e) {} }

    function applyCtrl(scroll) {
        Lampa.Controller.add('content', {
            toggle: function () { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); },
            left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
            right: function () { Navigator.move('right'); },
            up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
            down: function () { Navigator.move('down'); },
            back: function () { Lampa.Activity.backward(); }
        });
        setTimeout(function () {
            Lampa.Controller.toggle('content');
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(false, scroll.render());
        }, 0);
    }

    function mkPeople(list, key) {
        return (list || []).map(function (p) {
            var av = p.profile_path ? '<img src="' + TMDB_IMG_W500 + p.profile_path + '">' : '<div class="kk-cast-empty"></div>';
            return '<div class="kk-cast-card"><div class="kk-cast-img">' + av + '</div><div class="kk-cast-name">' + esc(p.name || '') + '</div><div class="kk-cast-role">' + esc(p[key] || '') + '</div></div>';
        }).join('');
    }

    function mkCard(item) {
        var normalized = norm(item);
        if (!normalized) return $('<div></div>');
        var p = fullImg(normalized.poster_url || normalized.thumb_url);
        var c = $('<div class="kk-card selector"><div class="kk-card-img"><img src="' + p + '">' +
            (normalized.quality ? '<div class="kk-card-q">' + esc(normalized.quality) + '</div>' : '') +
            (normalized.episode_current ? '<div class="kk-card-ep">' + esc(normalized.episode_current) + '</div>' : '') +
            '</div><div class="kk-card-name">' + esc(normalized.name) + '</div><div class="kk-card-year">' + esc(normalized.year) + '</div></div>');
        bindEnter(c, function () {
            if (!normalized.slug) return;
            Lampa.Activity.push({ url: '', title: normalized.name || '', component: 'kkphim_detail', movie: normalized, page: 1 });
        });
        return c;
    }

    function mkTmdbCard(item) {
        var data = tmdbNormCard(item);
        if (!data || !data.tmdb_id) return $('<div></div>');
        var c = $('<div class="kk-card selector"><div class="kk-card-img">' +
            (data.poster_url ? '<img src="' + data.poster_url + '">' : '<div style="width:100%;height:100%;background:#333"></div>') +
            (data.vote ? '<div class="kk-card-q">*' + esc(data.vote) + '</div>' : '') +
            (data.media_type === 'tv' ? '<div class="kk-card-ep">TV</div>' : '') +
            '</div><div class="kk-card-name">' + esc(data.name) + '</div><div class="kk-card-year">' + esc(data.year) + '</div></div>');
        bindEnter(c, function () {
            Lampa.Activity.push({ url: '', title: data.name || '', component: 'kkphim_tmdb_detail', tmdb_id: data.tmdb_id, media_type: data.media_type, page: 1 });
        });
        return c;
    }

    function injectCSS() {
        if ($('#kk-css').length) return;
        var css = '';
        css += '.kk-topbar{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:.8em;gap:1em;z-index:5}';
        css += '.kk-topbar-title{font-size:2em;font-weight:900;color:#fff;flex:1}';
        css += '.kk-topbar-btns{display:flex;gap:.5em}';
        css += '.kk-btn{display:inline-flex;align-items:center;gap:.45em;padding:.8em 1.1em;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.10);color:#fff;font-size:.98em;font-weight:800;cursor:pointer}';
        css += '.kk-btn.focus{background:#fff;color:#000}';
        css += '.kk-srcbar{display:flex;gap:.5em;padding:0 1.5em .7em;flex-wrap:wrap}';
        css += '.kk-srcbtn{padding:.6em 1em;border-radius:.75em;font-size:.95em;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.1)}';
        css += '.kk-srcbtn--on{background:rgba(99,102,241,.25);border-color:rgba(99,102,241,.5);color:#c4b5fd}';
        css += '.kk-srcbtn--off{background:rgba(255,255,255,.06);color:rgba(255,255,255,.45)}';
        css += '.kk-srcbtn.focus{background:rgba(99,102,241,.4);color:#fff}';
        css += '.kk-tsbar{padding:0 1.5em .5em}';
        css += '.kk-tsbadge{display:inline-flex;align-items:center;gap:.4em;padding:.45em .85em;border-radius:.65em;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.15);font-size:.88em;color:#4ade80;font-weight:700}';
        css += '.kk-row{margin-bottom:1.9em}';
        css += '.kk-row-head{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:.85em}';
        css += '.kk-row-title{font-size:1.55em;font-weight:900;color:#fff}';
        css += '.kk-row-more{font-size:.98em;font-weight:800;padding:.7em 1.1em;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}';
        css += '.kk-row-more.focus{background:#fff;color:#000}';
        css += '.kk-row-list{display:flex;gap:.9em;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .2em;-webkit-overflow-scrolling:touch}';
        css += '.kk-row-list::-webkit-scrollbar,.kk-cast-list::-webkit-scrollbar,.kk-similar-list::-webkit-scrollbar{display:none}';
        css += '.kk-card{flex:0 0 auto;width:9.5em;cursor:pointer}';
        css += '.kk-card--grid{width:100%}';
        css += '.kk-card-img{position:relative;width:100%;aspect-ratio:2/3;border-radius:.9em;overflow:hidden;background:#242424}';
        css += '.kk-card-img img{width:100%;height:100%;object-fit:cover}';
        css += '.kk-card-q{position:absolute;top:.5em;left:.5em;padding:.2em .5em;border-radius:.4em;font-size:.7em;font-weight:800;background:#f6c344;color:#000}';
        css += '.kk-card-ep{position:absolute;top:.5em;right:.5em;padding:.2em .5em;border-radius:.4em;font-size:.7em;font-weight:800;background:#e53935;color:#fff}';
        css += '.kk-card-name{margin-top:.6em;font-size:1em;line-height:1.3;font-weight:700;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}';
        css += '.kk-card-year{margin-top:.18em;font-size:.88em;color:rgba(255,255,255,.5)}';
        css += '.kk-grid-wrap{padding:0 1.5em}';
        css += '.kk-grid-title{font-size:1.9em;font-weight:900;color:#fff;margin:0 0 .85em}';
        css += '.kk-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.9em}';
        css += '.kk-loadmore{margin-top:1.1em;text-align:center;padding:.9em;border-radius:.9em;background:rgba(255,255,255,.08);color:#fff;font-size:1em;font-weight:800;cursor:pointer}';
        css += '.kk-loadmore.focus{background:#ff2332}';
        css += '.kk-detail-wrap{background:#141414;border-radius:1.4em;overflow:hidden;margin:0 0 1em}';
        css += '.kk-hero{position:relative;overflow:hidden;background:#111}';
        css += '.kk-hero-bg{position:relative;height:25em}';
        css += '.kk-hero-bg img{width:100%;height:100%;object-fit:cover}';
        css += '.kk-hero-mask{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.16) 24%,rgba(0,0,0,.36) 52%,rgba(14,14,14,.78) 78%,rgba(14,14,14,1))}';
        css += '.kk-hero-bottom{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:1.4em 1.5em 1.2em}';
        css += '.kk-hero-flex{display:block}';
        css += '.kk-hero-poster{display:none}';
        css += '.kk-hero-info{min-width:0}';
        css += '.kk-logo{max-width:34em;margin:0 0 1em}';
        css += '.kk-logo img{max-width:100%;max-height:10em;object-fit:contain;filter:drop-shadow(0 .4em 1.1em rgba(0,0,0,.45))}';
        css += '.kk-title{font-size:2.5em;line-height:1.05;font-weight:900;color:#fff;margin-bottom:.2em}';
        css += '.kk-origin{font-size:1.15em;line-height:1.45;color:rgba(255,255,255,.82)}';
        css += '.kk-body{position:relative;z-index:3;padding:1.4em 1.5em 0;background:#141414}';
        css += '.kk-metas{display:flex;flex-wrap:wrap;gap:.65em;margin:0 0 1.1em}';
        css += '.kk-meta{padding:.55em .95em;border-radius:.8em;background:rgba(255,255,255,.08);color:#fff;font-size:1.1em;font-weight:800}';
        css += '.kk-genres{display:flex;flex-wrap:wrap;gap:.65em;margin:0 0 1.1em}';
        css += '.kk-genre{padding:.55em .95em;border-radius:.8em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.95);font-size:1.02em;font-weight:700;cursor:pointer}';
        css += '.kk-genre.focus{background:rgba(255,255,255,.18)}';
        css += '.kk-crew{margin:0 0 1.1em}';
        css += '.kk-crew b{font-size:1.2em;font-weight:900;color:#fff;display:block;margin-bottom:.2em}';
        css += '.kk-crew span{font-size:1.08em;color:rgba(255,255,255,.88)}';
        css += '.kk-desc{font-size:1.2em;line-height:1.75;color:rgba(255,255,255,.93);margin:0 0 1.3em}';
        css += '.kk-actions{display:flex;flex-wrap:wrap;gap:.7em;padding:.1em 0 .2em}';
        css += '.kk-act-wrap{width:100%}';
        css += '.kk-act{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:.95em;border-radius:.95em;font-size:1.15em;font-weight:900;cursor:pointer}';
        css += '.kk-act--play{background:#ff1730;color:#fff}';
        css += '.kk-act--play.focus{background:#ff3047}';
        css += '.kk-act--torrent{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}';
        css += '.kk-act--torrent.focus{background:linear-gradient(135deg,#818cf8,#a78bfa)}';
        css += '.kk-act--disabled{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.35);cursor:default}';
        css += '.kk-section{padding:1.25em 1.5em 0;background:#141414}';
        css += '.kk-section+.kk-section{padding-top:1.15em;border-top:1px solid rgba(255,255,255,.04)}';
        css += '.kk-body+.kk-section{border-top:1px solid rgba(255,255,255,.04)}';
        css += '.kk-section--last{padding-bottom:1.4em}';
        css += '.kk-block-title{font-size:1.75em;font-weight:900;color:#fff;margin:0 0 .8em}';
        css += '.kk-cast-list{display:flex;gap:1em;overflow-x:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x}';
        css += '.kk-cast-card{flex:0 0 auto;width:7.2em;text-align:center}';
        css += '.kk-cast-img{width:6.5em;height:6.5em;border-radius:50%;overflow:hidden;background:#2b2b2b;margin:0 auto .65em;border:2px solid rgba(255,255,255,.08)}';
        css += '.kk-cast-img img{width:100%;height:100%;object-fit:cover}';
        css += '.kk-cast-empty{width:100%;height:100%;background:#333;border-radius:50%}';
        css += '.kk-cast-name{font-size:1em;font-weight:800;color:#fff}';
        css += '.kk-cast-role{font-size:.88em;color:rgba(255,255,255,.6);margin-top:.12em}';
        css += '.kk-server{font-size:1.12em;font-weight:800;color:#63d471;margin:.95em 0 .65em}';
        css += '.kk-eps{display:flex;flex-wrap:wrap;gap:.65em}';
        css += '.kk-ep{min-width:4.2em;text-align:center;padding:.8em 1em;border-radius:.75em;background:rgba(255,255,255,.09);color:#fff;font-size:1em;font-weight:800;cursor:pointer}';
        css += '.kk-ep.focus{background:#ff2233}';
        css += '.kk-similar{padding-bottom:1.1em}';
        css += '.kk-similar-list{display:flex;gap:.9em;overflow-x:auto;-webkit-overflow-scrolling:touch}';
        css += '.kk-similar-list .kk-card{width:8.5em}';
        css += '.kk-slug-info{margin:0 0 1.1em;padding:.85em 1.1em;border-radius:.85em;font-size:1em;font-weight:700}';
        css += '.kk-slug-found{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.15);color:#4ade80}';
        css += '.kk-slug-notfound{background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.15);color:#fbbf24}';
        css += '.kk-stg-wrap{padding:1.4em}';
        css += '.kk-stg-title{font-size:2em;font-weight:900;color:#fff;margin:0 0 1.3em}';
        css += '.kk-stg-group{margin-bottom:1.7em}';
        css += '.kk-stg-group-title{font-size:1.3em;font-weight:900;color:#fff;margin:0 0 .8em;display:flex;align-items:center;gap:.5em}';
        css += '.kk-stg-item{display:flex;align-items:center;gap:.9em;margin-bottom:.7em;padding:1em 1.1em;border-radius:.95em;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06);cursor:pointer}';
        css += '.kk-stg-item.focus{background:rgba(99,102,241,.2);border-color:rgba(99,102,241,.45)}';
        css += '.kk-stg-label{flex:1}';
        css += '.kk-stg-label-name{font-size:1.08em;font-weight:800;color:#fff}';
        css += '.kk-stg-label-desc{font-size:.92em;color:rgba(255,255,255,.45);margin-top:.18em}';
        css += '.kk-stg-value{font-size:.98em;font-weight:700;color:#a78bfa;max-width:12em;text-align:right;word-break:break-all}';
        css += '.kk-stg-status{margin-top:.7em;padding:.85em 1.1em;border-radius:.85em;font-size:.98em;font-weight:700}';
        css += '.kk-stg-status--ok{background:rgba(74,222,128,.12);color:#4ade80}';
        css += '.kk-stg-status--err{background:rgba(248,113,113,.12);color:#f87171}';
        css += '.kk-stg-status--loading{background:rgba(255,255,255,.06);color:rgba(255,255,255,.5)}';
        css += '.selector,.kk-act,.kk-ep,.kk-row-more,.kk-loadmore,.kk-genre,.kk-card,.kk-btn,.kk-stg-item,.kk-srcbtn{touch-action:manipulation;-webkit-tap-highlight-color:transparent}';
        css += '@media(orientation:landscape){';
        css += '.kk-hero-bg{height:28em}';
        css += '.kk-hero-bottom{padding:1.5em 1.8em 1.3em}';
        css += '.kk-hero-flex{display:flex;align-items:flex-end;gap:1.3em}';
        css += '.kk-hero-poster{display:block;width:9.5em;min-width:9.5em}';
        css += '.kk-hero-poster img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:.95em;background:#242424}';
        css += '.kk-hero-info{flex:1;padding-bottom:.2em}';
        css += '.kk-logo{max-width:26em;margin-bottom:.95em}';
        css += '.kk-logo img{max-height:8em}';
        css += '.kk-title{font-size:2.7em}';
        css += '.kk-body{padding:1.3em 1.8em 0}';
        css += '.kk-section{padding:1.2em 1.8em 0}';
        css += '.kk-similar-list .kk-card{width:8.8em}';
        css += '}';
        css += '@media(max-width:768px){.kk-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:.75em}}';
        $('head').append('<style id="kk-css">' + css + '</style>');
    }

    function addMenu() {
        function ins() {
            if ($('.menu__item[data-action="kkphim"]').length) return;
            var m = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');
            bindEnter(m, function () { Lampa.Activity.push({ url: '', title: 'KKPhim', component: 'kkphim_main', page: 1 }); });
            $('.menu .menu__list').first().append(m);
        }
        setTimeout(ins, 500);
        Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') setTimeout(ins, 500); });
    }

    function startPlugin() {
        injectCSS();
        addMenu();

        Lampa.Component.add('kkphim_settings', function () {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            this.create = function () {
                clearScroll(scroll);
                var s = loadSettings();
                var w = $('<div class="kk-stg-wrap"></div>');
                w.append('<div class="kk-stg-title">Cai dat</div>');

                var g0 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">Nguon phim</div>');
                var cur = s.source || 'ophim';
                Object.keys(SOURCES).forEach(function (k) {
                    var src = SOURCES[k];
                    var it = si(src.name, src.api, cur === k ? 'OK' : 'Chon');
                    if (cur === k) it.find('.kk-stg-value').css('color', '#4ade80');
                    bindEnter(it, function () { saveSettings({ source: k }); Lampa.Noty.show(src.name); comp.create(); });
                    g0.append(it);
                });
                w.append(g0);

                var g1 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">TorrServer</div>');
                var hi = si('Dia chi', '192.168.1.100:8090', s.torrserver_host || 'Chua cai');
                bindEnter(hi, function () {
                    pi('Dia chi TorrServer', s.torrserver_host || '', function (v) {
                        v = (v || '').trim();
                        saveSettings({ torrserver_host: v });
                        s.torrserver_host = v;
                        hi.find('.kk-stg-value').text(v || 'Chua cai');
                    });
                });
                g1.append(hi);
                var pwi = si('Mat khau', 'De trong neu khong', s.torrserver_password ? '****' : 'Khong');
                bindEnter(pwi, function () {
                    pi('Mat khau', s.torrserver_password || '', function (v) {
                        v = (v || '').trim();
                        saveSettings({ torrserver_password: v });
                        s.torrserver_password = v;
                        pwi.find('.kk-stg-value').text(v ? '****' : 'Khong');
                    });
                });
                g1.append(pwi);
                var ti = si('Test', '', 'Nhan');
                var st1 = $('<div class="kk-stg-status" style="display:none"></div>');
                bindEnter(ti, function () { testTS(st1); });
                g1.append(ti).append(st1);
                w.append(g1);

                var g2 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">Torrentio</div>');
                var tii = si('Config', 'Paste manifest URL', s.torrentio_config ? 'Co' : 'Mac dinh');
                bindEnter(tii, function () {
                    pi('Config', s.torrentio_config || '', function (v) {
                        v = (v || '').trim();
                        saveSettings({ torrentio_config: v });
                        s.torrentio_config = v;
                        tii.find('.kk-stg-value').text(v ? 'Co' : 'Mac dinh');
                    });
                });
                g2.append(tii);
                var tti = si('Test', '', 'Nhan');
                var st2 = $('<div class="kk-stg-status" style="display:none"></div>');
                bindEnter(tti, function () { testTIO(st2); });
                g2.append(tti).append(st2);
                w.append(g2);

                var g4 = $('<div class="kk-stg-group"></div>');
                var cl = si('Xoa cai dat', '', 'Xoa');
                cl.find('.kk-stg-value').css('color', '#f87171');
                bindEnter(cl, function () { localStorage.removeItem(SETTINGS_KEY); Lampa.Noty.show('Da xoa'); Lampa.Activity.backward(); });
                g4.append(cl);
                w.append(g4);

                scroll.append(w);
                comp.start();
            };

            function si(n, d, v) {
                return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">' + esc(n) + '</div>' + (d ? '<div class="kk-stg-label-desc">' + esc(d) + '</div>' : '') + '</div><div class="kk-stg-value">' + esc(v) + '</div></div>');
            }
            function pi(t, c, cb) {
                try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: t, value: c || '', free: true, nosave: true }, cb); return; } } catch (e) {}
                var v = window.prompt(t, c || '');
                if (v !== null) cb(v);
            }
            async function testTS(el) {
                if (!getTSHost()) { el.show().attr('class', 'kk-stg-status kk-stg-status--err').text('Chua nhap'); return; }
                el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('...');
                try {
                    var r = await fetch(tsUrl('/echo'), { headers: tsHdr() });
                    el.attr('class', 'kk-stg-status ' + (r.ok ? 'kk-stg-status--ok' : 'kk-stg-status--err')).text(r.ok ? 'OK' : 'Loi ' + r.status);
                } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('Loi: ' + (e.message || '')); }
            }
            async function testTIO(el) {
                el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('...');
                var c = cleanTioConfig(getTioConfig());
                var u = TORRENTIO_BASE + (c ? '/' + c : '') + '/stream/movie/tt1375666.json';
                try {
                    var r = await fetch(u);
                    if (!r.ok) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('Loi ' + r.status); return; }
                    var d = await r.json();
                    el.attr('class', 'kk-stg-status kk-stg-status--ok').text('OK: ' + (d.streams || []).length + ' torrent');
                } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('Loi: ' + (e.message || '')); }
            }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });

        Lampa.Component.add('kkphim_main', function () {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this, _src = '';
            var cats = [
                { name: 'Phim Moi', api: 'danh-sach/phim-moi-cap-nhat' },
                { name: 'Phim Bo', api: 'v1/api/danh-sach/phim-bo' },
                { name: 'Phim Le', api: 'v1/api/danh-sach/phim-le' },
                { name: 'Hoat Hinh', api: 'v1/api/danh-sach/hoat-hinh' },
                { name: 'TV Shows', api: 'v1/api/danh-sach/tv-shows' }
            ];

            this.create = function () {
                network.clear();
                this.activity.loader(true);
                clearScroll(scroll);
                var src = getSource();
                _src = src.key;

                var tb = $('<div class="kk-topbar"><div class="kk-topbar-title">' + esc(src.name) + '</div><div class="kk-topbar-btns"><div class="kk-btn selector">Search</div><div class="kk-btn selector">Settings</div></div></div>');
                bindEnter($(tb.find('.kk-btn')[0]), openSearch);
                bindEnter($(tb.find('.kk-btn')[1]), function () { Lampa.Activity.push({ url: '', title: 'Cai dat', component: 'kkphim_settings' }); });
                scroll.append(tb);

                var sb = $('<div class="kk-srcbar"></div>');
                Object.keys(SOURCES).forEach(function (k) {
                    var s = SOURCES[k];
                    var on = k === src.key;
                    var btn = $('<div class="kk-srcbtn selector ' + (on ? 'kk-srcbtn--on' : 'kk-srcbtn--off') + '">' + esc(s.name) + '</div>');
                    bindEnter(btn, function () { if (on) return; saveSettings({ source: k }); Lampa.Noty.show(s.name); comp.create(); });
                    sb.append(btn);
                });
                var tmdbBtn = $('<div class="kk-srcbtn selector kk-srcbtn--off" style="background:rgba(1,180,228,.15);border-color:rgba(1,180,228,.4);color:#01b4e4">TMDB</div>');
                bindEnter(tmdbBtn, function () { Lampa.Activity.push({ url: '', title: 'TMDB', component: 'kkphim_tmdb_main', page: 1 }); });
                sb.append(tmdbBtn);
                scroll.append(sb);

                if (getTSHost()) scroll.append($('<div class="kk-tsbar"><div class="kk-tsbadge">TS: ' + esc(getTSHost()) + '</div></div>'));

                var loaded = 0;
                cats.forEach(function (cat) {
                    network.silent(SRC_API() + cat.api + '?page=1', function (res) {
                        var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(norm).filter(function (i) { return i && i.slug; });
                        if (list.length) {
                            var row = $('<div class="kk-row"></div>');
                            var more = $('<div class="kk-row-more selector">Xem them</div>');
                            var rl = $('<div class="kk-row-list"></div>');
                            bindEnter(more, function () { Lampa.Activity.push({ url: '', title: cat.name, component: 'kkphim_category', cat: cat, page_num: 1, mode: 'api' }); });
                            list.slice(0, 12).forEach(function (i) { rl.append(mkCard(i)); });
                            row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">' + esc(cat.name) + '</div>').append(more)).append(rl);
                            scroll.append(row);
                        }
                        loaded++;
                        if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); }
                    }, function () {
                        loaded++;
                        if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); }
                    });
                });
            };

            this.start = function () {
                if (_src && _src !== getSourceKey()) { comp.create(); return; }
                applyCtrl(scroll); enableScroll(scroll);
            };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        Lampa.Component.add('kkphim_tmdb_main', function () {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;

            this.create = function () {
                comp.activity.loader(true);
                clearScroll(scroll);

                var tb = $('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">TMDB</div><div class="kk-topbar-btns"><div class="kk-btn selector">Search</div><div class="kk-btn selector">Settings</div></div></div>');
                bindEnter($(tb.find('.kk-btn')[0]), openTmdbSearch);
                bindEnter($(tb.find('.kk-btn')[1]), function () { Lampa.Activity.push({ url: '', title: 'Cai dat', component: 'kkphim_settings' }); });
                scroll.append(tb);

                var sb = $('<div class="kk-srcbar"></div>');
                Object.keys(SOURCES).forEach(function (k) {
                    var s = SOURCES[k];
                    var btn = $('<div class="kk-srcbtn selector kk-srcbtn--off">' + esc(s.name) + '</div>');
                    bindEnter(btn, function () { saveSettings({ source: k }); Lampa.Activity.push({ url: '', title: 'KKPhim', component: 'kkphim_main', page: 1 }); });
                    sb.append(btn);
                });
                sb.append('<div class="kk-srcbtn kk-srcbtn--on" style="background:rgba(1,180,228,.25);border-color:rgba(1,180,228,.5);color:#01b4e4">TMDB</div>');
                scroll.append(sb);

                if (getTSHost()) scroll.append($('<div class="kk-tsbar"><div class="kk-tsbadge">TS: ' + esc(getTSHost()) + '</div></div>'));

                var sections = [
                    { name: 'Xu huong tuan', fn: tmdbTrending, lt: 'trending' },
                    { name: 'Phim le pho bien', fn: tmdbPopularMovies, lt: 'popular_movies' },
                    { name: 'Phim bo pho bien', fn: tmdbPopularTV, lt: 'popular_tv' },
                    { name: 'Phim le danh gia cao', fn: tmdbTopRatedMovies, lt: 'top_movies' },
                    { name: 'Phim bo danh gia cao', fn: tmdbTopRatedTV, lt: 'top_tv' }
                ];

                var loaded = 0;
                sections.forEach(function (sec) {
                    sec.fn(1).then(function (res) {
                        var items = (res.results || []).filter(function (i) { return i.media_type !== 'person'; });
                        if (items.length) {
                            var row = $('<div class="kk-row"></div>');
                            var more = $('<div class="kk-row-more selector">Xem them</div>');
                            var rl = $('<div class="kk-row-list"></div>');
                            bindEnter(more, function () { Lampa.Activity.push({ url: '', title: sec.name, component: 'kkphim_tmdb_list', listType: sec.lt, page_num: 1 }); });
                            items.slice(0, 12).forEach(function (i) { rl.append(mkTmdbCard(i)); });
                            row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">' + esc(sec.name) + '</div>').append(more)).append(rl);
                            scroll.append(row);
                        }
                        loaded++;
                        if (loaded >= sections.length) { comp.activity.loader(false); comp.start(); }
                    }).catch(function () {
                        loaded++;
                        if (loaded >= sections.length) { comp.activity.loader(false); comp.start(); }
                    });
                });
            };

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });

        Lampa.Component.add('kkphim_tmdb_list', function (obj) {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var page = obj.page_num || 1;
            var grid = $('<div class="kk-grid"></div>');
            var lm = $('<div class="kk-loadmore selector">Tai them</div>');
            var loading = false, hasMore = true;
            var fetchFn = { trending: tmdbTrending, popular_movies: tmdbPopularMovies, popular_tv: tmdbPopularTV, top_movies: tmdbTopRatedMovies, top_tv: tmdbTopRatedTV }[obj.listType] || tmdbTrending;

            this.create = function () {
                comp.activity.loader(true);
                clearScroll(scroll);
                scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">' + esc(obj.title || 'TMDB') + '</div>').append(grid).append(lm));
                bindEnter(lm, function () { if (!loading && hasMore) doLoad(); });
                doLoad();
            };

            function doLoad() {
                loading = true;
                lm.text('Dang tai...');
                fetchFn(page).then(function (res) {
                    var items = (res.results || []).filter(function (i) { return i.media_type !== 'person'; });
                    if (!items.length) { hasMore = false; lm.text('Het'); comp.activity.loader(false); loading = false; comp.start(); return; }
                    items.forEach(function (i) { grid.append(mkTmdbCard(i).addClass('kk-card--grid')); });
                    page++;
                    loading = false;
                    lm.text('Tai them');
                    comp.activity.loader(false);
                    comp.start();
                }).catch(function () { loading = false; lm.text('Loi'); comp.activity.loader(false); });
            }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });

        Lampa.Component.add('kkphim_tmdb_search', function (obj) {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var kw = obj.keyword || '', page = obj.page_num || 1;
            var grid = $('<div class="kk-grid"></div>');
            var lm = $('<div class="kk-loadmore selector">Tai them</div>');
            var loading = false, hasMore = true;

            this.create = function () {
                comp.activity.loader(true);
                clearScroll(scroll);
                scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">TMDB: ' + esc(kw) + '</div>').append(grid).append(lm));
                bindEnter(lm, function () { if (!loading && hasMore) doLoad(); });
                doLoad();
            };

            function doLoad() {
                loading = true;
                lm.text('Dang tai...');
                tmdbSearchMulti(kw, page).then(function (res) {
                    var items = (res.results || []).filter(function (i) { return i.media_type !== 'person'; });
                    if (!items.length) { hasMore = false; lm.text(page === 1 ? 'Khong co' : 'Het'); comp.activity.loader(false); loading = false; comp.start(); return; }
                    items.forEach(function (i) { grid.append(mkTmdbCard(i).addClass('kk-card--grid')); });
                    page++;
                    loading = false;
                    lm.text('Tai them');
                    comp.activity.loader(false);
                    comp.start();
                }).catch(function () { loading = false; lm.text('Loi'); comp.activity.loader(false); });
            }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });

        Lampa.Component.add('kkphim_tmdb_detail', function (obj) {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var tmdbId = obj.tmdb_id;
            var mediaType = obj.media_type || 'movie';

            this.create = function () {
                comp.activity.loader(true);
                clearScroll(scroll);
                if (!tmdbId) {
                    comp.activity.loader(false);
                    scroll.append('<div class="empty__body"><div class="empty__title">Khong co du lieu</div></div>');
                    comp.start();
                    return;
                }

                tmdbDetailFull(mediaType, tmdbId).then(async function (tmdb) {
                    var logos = null;
                    try { logos = await tmdbImagesFull(mediaType, tmdbId); } catch (e) {}

                    var title = tmdb.title || tmdb.name || '';
                    var origTitle = tmdb.original_title || tmdb.original_name || '';
                    var year = (tmdb.release_date || tmdb.first_air_date || '').slice(0, 4);

                    Lampa.Noty.show('Tim nguon phat...');
                    var slugs = await findAllSlugs(title, origTitle, year);

                    buildTmdbDetail(tmdb, logos, slugs);
                }).catch(function (e) {
                    comp.activity.loader(false);
                    Lampa.Noty.show('Loi TMDB: ' + (e.message || ''));
                });
            };

            async function buildTmdbDetail(tmdb, logos, slugs) {
                clearScroll(scroll);

                var bk = tmdb.backdrop_path ? TMDB_IMG + tmdb.backdrop_path : '';
                var ps = tmdb.poster_path ? TMDB_IMG_W500 + tmdb.poster_path : '';
                var t = tmdb.title || tmdb.name || '';
                var o = tmdb.original_title || tmdb.original_name || '';
                var d = tmdb.overview || 'Khong co mo ta';
                var v = tmdb.vote_average ? Number(tmdb.vote_average).toFixed(1) : 'N/A';
                var y = (tmdb.release_date || tmdb.first_air_date || '').slice(0, 4);
                var rt = tmdb.runtime ? tmdb.runtime + ' phut' : '';
                if (!rt && tmdb.episode_run_time && tmdb.episode_run_time.length) rt = tmdb.episode_run_time[0] + ' phut/tap';
                var epTotal = tmdb.number_of_episodes ? tmdb.number_of_episodes + ' tap' : '';
                var nSeasons = tmdb.number_of_seasons ? tmdb.number_of_seasons + ' season' : '';

                var logo = pickLogo(logos || (tmdb.images || {}));
                var logoH = '';
                if (logo && logo.file_path) logoH = '<div class="kk-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '"></div>';

                var ghtml = '';
                if (tmdb.genres && tmdb.genres.length) {
                    ghtml = tmdb.genres.map(function (g) { return '<span class="kk-genre">' + esc(g.name || '') + '</span>'; }).join('');
                }

                var castH = '', dirH = '', crewH = '', dir = '';
                if (tmdb.credits) {
                    castH = mkPeople((tmdb.credits.cast || []).slice(0, 12), 'character');
                    var dirs = (tmdb.credits.crew || []).filter(function (c) { return c.job === 'Director' || c.job === 'Creator' || c.job === 'Series Director'; });
                    dirs = dirs.filter(function (p, i, a) { return a.findIndex(function (x) { return x.name === p.name; }) === i; }).slice(0, 10);
                    if (dirs.length) {
                        dir = dirs.map(function (c) { return c.name; }).join(', ');
                        dirH = mkPeople(dirs.map(function (c) { return { name: c.name, profile_path: c.profile_path, job: c.job || 'Dao dien' }; }), 'job');
                    }
                }
                if (dir) crewH = '<div class="kk-crew"><b>Dao dien</b><span>' + esc(dir) + '</span></div>';

                var imdbId = (tmdb.external_ids && tmdb.external_ids.imdb_id) || null;

                var hasSlug = !!(slugs.kkphim || slugs.ophim);
                var slugInfoHtml = '';
                if (hasSlug) {
                    var foundSrcs = [];
                    if (slugs.kkphim) foundSrcs.push('KKPhim');
                    if (slugs.ophim) foundSrcs.push('OPhim');
                    slugInfoHtml = '<div class="kk-slug-info kk-slug-found">Nguon: ' + foundSrcs.join(', ') + '</div>';
                } else {
                    slugInfoHtml = '<div class="kk-slug-info kk-slug-notfound">Khong tim thay nguon phat - Chi co Torrent</div>';
                }

                var tH = logoH ? '' : '<div class="kk-title">' + esc(t) + '</div>';

                var hero = $('<div class="kk-hero"><div class="kk-hero-bg">' + (bk ? '<img src="' + bk + '">' : '') + '<div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster">' + (ps ? '<img src="' + ps + '">' : '') + '</div><div class="kk-hero-info">' + logoH + tH + '<div class="kk-origin">' + esc(o) + '</div></div></div></div></div>');

                var actHtml = '';
                if (mediaType === 'movie') {
                    if (hasSlug) {
                        actHtml += '<div class="kk-act-wrap"><div class="kk-act kk-act--play selector" data-action="play-movie">Xem phim</div></div>';
                    } else {
                        actHtml += '<div class="kk-act-wrap"><div class="kk-act kk-act--disabled">Khong co nguon phat</div></div>';
                    }
                    actHtml += '<div class="kk-act-wrap"><div class="kk-act kk-act--torrent selector" data-action="torrent-movie">Torrent' + (getTSHost() ? ' > TS' : '') + '</div></div>';
                } else {
                    if (hasSlug) {
                        actHtml += '<div class="kk-act-wrap"><div class="kk-act kk-act--play selector" data-action="play-tv">Xem phim</div></div>';
                    } else {
                        actHtml += '<div class="kk-act-wrap"><div class="kk-act kk-act--disabled">Khong co nguon phat</div></div>';
                    }
                    actHtml += '<div class="kk-act-wrap"><div class="kk-act kk-act--torrent selector" data-action="torrent-tv">Torrent' + (getTSHost() ? ' > TS' : '') + '</div></div>';
                }

                var body = $('<div class="kk-body">' +
                    '<div class="kk-metas"><span class="kk-meta">* ' + esc(v) + '</span>' +
                    (y ? '<span class="kk-meta">' + esc(y) + '</span>' : '') +
                    (rt ? '<span class="kk-meta">' + esc(rt) + '</span>' : '') +
                    (epTotal ? '<span class="kk-meta">' + esc(epTotal) + '</span>' : '') +
                    (nSeasons ? '<span class="kk-meta">' + esc(nSeasons) + '</span>' : '') +
                    '</div>' +
                    '<div class="kk-genres">' + ghtml + '</div>' + crewH +
                    slugInfoHtml +
                    '<div class="kk-desc">' + fmtTxt(d) + '</div>' +
                    '<div class="kk-actions">' + actHtml + '</div></div>');

                bindEnter(body.find('[data-action="play-movie"]'), async function () {
                    var slug = slugs.kkphim || slugs.ophim;
                    var src = slugs.kkphim ? SOURCES.kkphim : SOURCES.ophim;
                    Lampa.Noty.show('Tai tu ' + src.name + '...');
                    try {
                        var detail = await fetchDetail(src, slug);
                        if (!detail || !detail.episodes || !detail.episodes.length) {
                            if (slugs.kkphim && slugs.ophim) {
                                var otherKey = src.key === 'kkphim' ? 'ophim' : 'kkphim';
                                src = SOURCES[otherKey];
                                slug = slugs[otherKey];
                                detail = await fetchDetail(src, slug);
                            }
                        }
                        if (!detail || !detail.episodes || !detail.episodes.length) { Lampa.Noty.show('Khong co tap phim'); return; }
                        var ep = getFirstEp(detail.episodes);
                        if (!ep) { Lampa.Noty.show('Khong co link'); return; }
                        var link = ep.link_m3u8 || ep.link_embed || '';
                        if (!link) { Lampa.Noty.show('Khong co link'); return; }
                        Lampa.Player.play({ title: t, url: link });
                    } catch (e) { Lampa.Noty.show('Loi: ' + (e.message || '')); }
                });

                bindEnter(body.find('[data-action="play-tv"]'), async function () {
                    Lampa.Noty.show('Dang tim tat ca seasons...');
                    try {
                        var seasonMap = await gatherAllSeasons(t, o, slugs);
                        var seasonNums = Object.keys(seasonMap).map(Number).sort(function (a, b) { return a - b; });

                        if (!seasonNums.length) { Lampa.Noty.show('Khong tim thay seasons'); return; }

                        if (seasonNums.length === 1) {
                            loadAndShowEpisodes(seasonMap[seasonNums[0]], t, seasonNums[0]);
                        } else {
                            Lampa.Select.show({
                                title: 'Chon Season (' + seasonNums.length + ')',
                                items: seasonNums.map(function (sn) {
                                    var entries = seasonMap[sn];
                                    var srcs = entries.map(function (e) { return e.source.name; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
                                    return { title: 'Season ' + sn + ' (' + srcs + ')', value: { entries: entries, season: sn } };
                                }),
                                onSelect: function (a) { loadAndShowEpisodes(a.value.entries, t, a.value.season); },
                                onBack: function () { Lampa.Controller.toggle('content'); }
                            });
                        }
                    } catch (e) { Lampa.Noty.show('Loi: ' + (e.message || '')); }
                });

                bindEnter(body.find('[data-action="torrent-movie"]'), function () {
                    openTorrentMovie(tmdbId, t, ps, imdbId);
                });

                bindEnter(body.find('[data-action="torrent-tv"]'), function () {
                    openTorrentTV(tmdbId, t, ps, imdbId);
                });

                var dw = $('<div class="kk-detail-wrap"></div>').append(hero).append(body);

                if (dirH) dw.append('<div class="kk-section"><div class="kk-block-title">Dao dien</div><div class="kk-cast-list">' + dirH + '</div></div>');
                if (castH) dw.append('<div class="kk-section"><div class="kk-block-title">Dien vien</div><div class="kk-cast-list">' + castH + '</div></div>');

                if (tmdb.similar && tmdb.similar.results && tmdb.similar.results.length) {
                    var simRow = $('<div class="kk-section kk-section--last kk-similar"></div>').append('<div class="kk-block-title">Phim lien quan</div>');
                    var simList = $('<div class="kk-similar-list"></div>');
                    tmdb.similar.results.slice(0, 12).forEach(function (i) {
                        if (!i.media_type) i.media_type = mediaType;
                        simList.append(mkTmdbCard(i));
                    });
                    simRow.append(simList);
                    dw.append(simRow);
                } else {
                    dw.append('<div class="kk-section kk-section--last"></div>');
                }

                scroll.append(dw);
                comp.activity.loader(false);
                comp.start();
            }

            async function loadAndShowEpisodes(seasonEntries, title, seasonNum) {
                Lampa.Noty.show('Tai tap Season ' + seasonNum + '...');
                var allEps = [];
                for (var i = 0; i < seasonEntries.length; i++) {
                    var eps = await loadSeasonEpisodes(seasonEntries[i]);
                    if (eps.length > allEps.length) allEps = eps;
                }

                if (!allEps.length) {
                    Lampa.Noty.show('Khong co tap nao');
                    return;
                }

                Lampa.Select.show({
                    title: 'Season ' + seasonNum + ' (' + allEps.length + ' tap)',
                    items: allEps.map(function (ep) {
                        return { title: ep.name + ' [' + ep.source + ']', value: ep };
                    }),
                    onSelect: function (a) {
                        var link = a.value.link;
                        if (!link) { Lampa.Noty.show('Khong co link'); return; }
                        Lampa.Player.play({ title: title + ' S' + pad(seasonNum) + ' - ' + a.value.name, url: link });
                    },
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
            }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });

        Lampa.Component.add('kkphim_category', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var page = obj.page_num || 1;
            var title = obj.title || (obj.cat && obj.cat.name) || '';
            var mode = obj.mode || 'api';
            var apiPath = obj.cat ? obj.cat.api : null;
            var catSlug = obj.category_slug || '';
            var grid = $('<div class="kk-grid"></div>');
            var lm = $('<div class="kk-loadmore selector">Tai them</div>');
            var loading = false, hasMore = true;

            this.create = function () {
                this.activity.loader(true);
                clearScroll(scroll);
                scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">' + esc(title) + '</div>').append(grid).append(lm));
                bindEnter(lm, function () { if (!loading && hasMore) doLoad(); });
                doLoad();
            };

            function hr(res) {
                var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(norm).filter(function (i) { return i && i.slug; });
                if (!list.length) { hasMore = false; lm.text('Het'); comp.activity.loader(false); loading = false; comp.start(); return; }
                list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); });
                page++;
                loading = false;
                lm.text('Tai them');
                comp.activity.loader(false);
                comp.start();
            }

            function doLoad() {
                loading = true;
                lm.text('Dang tai...');
                var url = (mode === 'category' && catSlug) ? SRC_API() + 'v1/api/the-loai/' + catSlug + '?page=' + page : SRC_API() + apiPath + '?page=' + page;
                network.silent(url, hr, function () {
                    if (mode === 'category' && catSlug) {
                        network.silent(SRC_API() + 'the-loai/' + catSlug + '?page=' + page, hr, function () { loading = false; lm.text('Loi'); comp.activity.loader(false); });
                    } else { loading = false; lm.text('Loi'); comp.activity.loader(false); }
                });
            }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        Lampa.Component.add('kkphim_search', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var kw = obj.keyword || '', page = obj.page_num || 1;
            var grid = $('<div class="kk-grid"></div>');
            var lm = $('<div class="kk-loadmore selector">Tai them</div>');
            var loading = false, hasMore = true;

            this.create = function () {
                this.activity.loader(true);
                clearScroll(scroll);
                scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">Tim: ' + esc(kw) + '</div>').append(grid).append(lm));
                bindEnter(lm, function () { if (!loading && hasMore) doLoad(); });
                doLoad();
            };

            function hr(res) {
                var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(norm).filter(function (i) { return i && i.slug; });
                if (!list.length) { hasMore = false; lm.text(page === 1 ? 'Khong co' : 'Het'); comp.activity.loader(false); loading = false; comp.start(); return; }
                list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); });
                page++;
                loading = false;
                lm.text('Tai them');
                comp.activity.loader(false);
                comp.start();
            }

            function doLoad() {
                loading = true;
                lm.text('Dang tai...');
                network.silent(SRC_API() + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, hr, function () {
                    network.silent(SRC_API() + 'tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, hr, function () { loading = false; lm.text('Loi'); comp.activity.loader(false); });
                });
            }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        Lampa.Component.add('kkphim_detail', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true });
            var movie = norm(obj.movie);
            var comp = this, rendered = false;

            this.create = function () {
                this.activity.loader(true);
                clearScroll(scroll);
                rendered = false;
                if (!movie || !movie.slug) {
                    this.activity.loader(false);
                    scroll.append('<div class="empty__body"><div class="empty__title">Khong co du lieu</div></div>');
                    comp.start();
                    return;
                }
                network.silent(SRC_API() + 'phim/' + movie.slug, function (res) {
                    if (rendered) return;
                    var data = norm(res.movie || res || {});
                    var episodes = res.episodes || [];
                    loadAll(data, episodes);
                }, function () { comp.activity.loader(false); Lampa.Noty.show('Loi tai phim'); });
            };

            async function loadAll(data, episodes) {
                if (!data || !data.slug) data = movie;
                try {
                    var tid = getTmdbId(data), tt = detectType(data), tmdb = null, logos = null;
                    if (tid) {
                        try { tmdb = await tmdbFetch('/' + tt + '/' + tid + '?language=vi-VN&append_to_response=credits,images'); } catch (e) {
                            try { tmdb = await tmdbFetch('/' + tt + '/' + tid + '?language=en-US&append_to_response=credits,images'); } catch (e2) {}
                        }
                        try { logos = await tmdbFetch('/' + tt + '/' + tid + '/images'); } catch (e3) {}
                    }
                    if (!rendered) { build(data, episodes, tmdb, logos, tt); rendered = true; }
                } catch (e) {
                    if (!rendered) { build(data, episodes, null, null, detectType(data)); rendered = true; }
                }
                comp.activity.loader(false);
                comp.start();
            }

            function build(data, episodes, tmdb, logos, ttype) {
                clearScroll(scroll);
                if (!Array.isArray(data.category)) data.category = [];

                var bk = fullImg(data.thumb_url || data.poster_url);
                var ps = fullImg(data.poster_url || data.thumb_url);
                var t = data.name || '';
                var o2 = data.origin_name || '';
                var d = cleanDesc(data.content);
                var v = (data.tmdb && data.tmdb.vote_average) || 'N/A';
                var y = data.year || '';
                var rt = data.time || '';
                var epCur = data.episode_current || '';
                var ghtml = '', castH = '', dirH = '', crewH = '', logoH = '', dir = '';

                if (tmdb) {
                    if (tmdb.backdrop_path) bk = TMDB_IMG + tmdb.backdrop_path;
                    if (tmdb.poster_path) ps = TMDB_IMG + tmdb.poster_path;
                    if (tmdb.title || tmdb.name) t = tmdb.title || tmdb.name;
                    if (tmdb.original_title || tmdb.original_name) o2 = tmdb.original_title || tmdb.original_name;
                    if (tmdb.overview) d = tmdb.overview;
                    if (tmdb.vote_average) v = Number(tmdb.vote_average).toFixed(1);
                    if (tmdb.release_date) y = tmdb.release_date.slice(0, 4);
                    if (!y && tmdb.first_air_date) y = tmdb.first_air_date.slice(0, 4);
                    if (tmdb.runtime) rt = tmdb.runtime + ' phut';
                    var logo = pickLogo(logos || tmdb.images);
                    if (logo && logo.file_path) logoH = '<div class="kk-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '"></div>';
                    if (tmdb.credits) {
                        castH = mkPeople((tmdb.credits.cast || []).slice(0, 12), 'character');
                        var dirs = (tmdb.credits.crew || []).filter(function (c) { return c.job === 'Director' || c.job === 'Creator' || c.job === 'Series Director'; });
                        dirs = dirs.filter(function (p, i, a) { return a.findIndex(function (x) { return x.name === p.name; }) === i; }).slice(0, 10);
                        if (dirs.length) {
                            dir = dirs.map(function (c) { return c.name; }).join(', ');
                            dirH = mkPeople(dirs.map(function (c) { return { name: c.name, profile_path: c.profile_path, job: c.job || 'Dao dien' }; }), 'job');
                        }
                    }
                }

                var pCats = data.category || [];
                if (pCats.length) {
                    ghtml = pCats.map(function (g) {
                        return g ? '<span class="kk-genre selector" data-slug="' + esc(g.slug || '') + '" data-title="' + esc(g.name || '') + '">' + esc(g.name || '') + '</span>' : '';
                    }).join('');
                } else if (tmdb && tmdb.genres) {
                    ghtml = tmdb.genres.map(function (g) { return '<span class="kk-genre">' + esc(g.name || '') + '</span>'; }).join('');
                }

                if (data.director && !dir) dir = Array.isArray(data.director) ? data.director.join(', ') : String(data.director || '');
                if (dir && !dirH) crewH = '<div class="kk-crew"><b>Dao dien</b><span>' + esc(dir) + '</span></div>';

                var hasTmdb = !!getTmdbId(data);
                var tBtn = hasTmdb ? '<div class="kk-act-wrap"><div class="kk-act kk-act--torrent selector">Torrent' + (getTSHost() ? ' > TS' : '') + '</div></div>' : '';
                var tH = logoH ? '' : '<div class="kk-title">' + esc(t) + '</div>';

                var hero = $('<div class="kk-hero"><div class="kk-hero-bg"><img src="' + bk + '"><div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster"><img src="' + ps + '"></div><div class="kk-hero-info">' + logoH + tH + '<div class="kk-origin">' + esc(o2) + '</div></div></div></div></div>');

                var body = $('<div class="kk-body"><div class="kk-metas"><span class="kk-meta">* ' + esc(v) + '</span>' +
                    (y ? '<span class="kk-meta">' + esc(y) + '</span>' : '') +
                    (rt ? '<span class="kk-meta">' + esc(rt) + '</span>' : '') +
                    (epCur ? '<span class="kk-meta">' + esc(epCur) + '</span>' : '') + '</div>' +
                    '<div class="kk-genres">' + ghtml + '</div>' + crewH +
                    '<div class="kk-desc">' + fmtTxt(d) + '</div>' +
                    '<div class="kk-actions"><div class="kk-act-wrap"><div class="kk-act kk-act--play selector">Xem phim</div></div>' + tBtn + '</div></div>');

                bindEnter(body.find('.kk-act--play'), function () {
                    var f = getFirstEp(episodes);
                    if (!f) { Lampa.Noty.show('Khong co tap'); return; }
                    var link = f.link_m3u8 || f.link_embed || '';
                    if (!link) { Lampa.Noty.show('Khong co link'); return; }
                    Lampa.Player.play({ title: (data.name || '') + ' - ' + (f.name || ''), url: link });
                });

                if (hasTmdb) {
                    bindEnter(body.find('.kk-act--torrent'), function () {
                        var tid2 = getTmdbId(data);
                        if (ttype === 'tv') openTorrentTV(tid2, data.name || '', ps, null);
                        else openTorrentMovie(tid2, data.name || '', ps, null);
                    });
                }

                body.find('.kk-genre[data-slug]').each(function () {
                    var g = $(this);
                    bindEnter(g, function () {
                        var slug = g.attr('data-slug');
                        if (slug) Lampa.Activity.push({ url: '', title: g.attr('data-title') || '', component: 'kkphim_category', mode: 'category', category_slug: slug, page_num: 1 });
                    });
                });

                var dw = $('<div class="kk-detail-wrap"></div>').append(hero).append(body);

                if (dirH) dw.append('<div class="kk-section"><div class="kk-block-title">Dao dien</div><div class="kk-cast-list">' + dirH + '</div></div>');
                if (castH) dw.append('<div class="kk-section"><div class="kk-block-title">Dien vien</div><div class="kk-cast-list">' + castH + '</div></div>');

                if (episodes && episodes.length) {
                    var ew = $('<div class="kk-section"></div>').append('<div class="kk-block-title">Danh sach tap</div>');
                    episodes.forEach(function (sv) {
                        ew.append('<div class="kk-server">' + esc(sv.server_name || '') + '</div>');
                        var g = $('<div class="kk-eps"></div>');
                        (sv.server_data || []).forEach(function (ep) {
                            var b = $('<div class="kk-ep selector">' + esc(ep.name || '') + '</div>');
                            bindEnter(b, function () {
                                var link = ep.link_m3u8 || ep.link_embed || '';
                                if (!link) { Lampa.Noty.show('Khong co link'); return; }
                                Lampa.Player.play({ title: (data.name || '') + ' - ' + (ep.name || ''), url: link });
                            });
                            g.append(b);
                        });
                        ew.append(g);
                    });
                    dw.append(ew);
                }

                scroll.append(dw);

                var cats = data.category || [];
                if (cats.length && cats[0] && cats[0].slug) {
                    network.silent(SRC_API() + 'v1/api/the-loai/' + cats[0].slug + '?page=1', function (r) {
                        var list = ((r && r.items) || (r && r.data && r.data.items) || []).map(norm).filter(function (i) { return i && i.slug && i.slug !== movie.slug; }).slice(0, 12);
                        if (list.length) {
                            var row = $('<div class="kk-section kk-section--last kk-similar"></div>').append('<div class="kk-block-title">Phim lien quan</div>');
                            var rl = $('<div class="kk-similar-list"></div>');
                            list.forEach(function (i) { rl.append(mkCard(i)); });
                            row.append(rl);
                            dw.append(row);
                        } else {
                            dw.append('<div class="kk-section kk-section--last"></div>');
                        }
                    }, function () { dw.append('<div class="kk-section kk-section--last"></div>'); });
                } else {
                    dw.append('<div class="kk-section kk-section--last"></div>');
                }
            }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();