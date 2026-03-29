(function () {
    'use strict';

    if (window.__kkphim_plugin_started) return;
    window.__kkphim_plugin_started = true;

    var API = 'https://phimapi.com/';
    var IMG = 'https://phimimg.com/';
    var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_IMG = 'https://image.tmdb.org/t/p/original';
    var TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
    var TORRENTIO_BASE = 'https://torrentio.strem.fun';

    var SETTINGS_KEY = 'kkphim_settings';

    function loadSettings() {
        try { var s = localStorage.getItem(SETTINGS_KEY); return s ? JSON.parse(s) : {}; } catch (e) { return {}; }
    }

    function saveSettings(obj) {
        try { var cur = loadSettings(); Object.keys(obj).forEach(function (k) { cur[k] = obj[k]; }); localStorage.setItem(SETTINGS_KEY, JSON.stringify(cur)); } catch (e) {}
    }

    function getTorrServerHost() { return loadSettings().torrserver_host || ''; }
    function getTorrServerPassword() { return loadSettings().torrserver_password || ''; }
    function getTorrentioConfig() { return loadSettings().torrentio_config || ''; }

    // ===================== TORRENTIO CONFIG =====================
    function cleanTorrentioConfig(raw) {
        if (!raw) return '';
        raw = String(raw).trim();
        if (!raw) return '';

        var m1 = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
        if (m1 && m1[1]) return m1[1];

        var m2 = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
        if (m2 && m2[1]) return m2[1].replace(/\/+$/, '');

        var m3 = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
        if (m3 && m3[1]) return m3[1];

        if (raw.indexOf('torrentio.strem.fun') > -1) {
            raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '');
            raw = raw.replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i, '');
            raw = raw.replace(/^\/+|\/+$/g, '');
            if (raw && raw.indexOf('=') > -1) return raw.replace(/\|/g, '%7C');
            return '';
        }

        raw = raw.replace(/^\/+|\/+$/g, '');
        raw = raw.replace(/\|/g, '%7C');
        if (raw.indexOf('=') === -1) return '';
        return raw;
    }

    // ===================== TORRSERVER =====================
    function torrServerUrl(path) {
        var host = getTorrServerHost();
        if (!host) return '';
        host = host.replace(/\/+$/, '');
        if (host.indexOf('http') !== 0) host = 'http://' + host;
        return host + path;
    }

    function torrServerHeaders() {
        var h = { 'Content-Type': 'application/json' };
        var pw = getTorrServerPassword();
        if (pw) h['Authorization'] = 'Basic ' + btoa('admin:' + pw);
        return h;
    }

    async function torrServerAdd(magnet, title, poster) {
        var url = torrServerUrl('/torrents');
        if (!url) throw new Error('TorrServer chưa cấu hình');

        var r = await fetch(url, {
            method: 'POST',
            headers: torrServerHeaders(),
            body: JSON.stringify({ action: 'add', link: magnet, title: title || 'KKPhim', poster: poster || '', save_to_db: false })
        });

        if (!r.ok) {
            var err = ''; try { err = await r.text(); } catch (e) {}
            throw new Error('TorrServer add: ' + r.status + ' ' + err);
        }
        return await r.json();
    }

    async function torrServerGetFiles(hash) {
        var url = torrServerUrl('/torrents');
        if (!url) throw new Error('TorrServer chưa cấu hình');

        var r = await fetch(url, {
            method: 'POST',
            headers: torrServerHeaders(),
            body: JSON.stringify({ action: 'get', hash: hash })
        });

        if (!r.ok) throw new Error('TorrServer get: ' + r.status);
        return await r.json();
    }

    function buildMagnet(infoHash) {
        var m = 'magnet:?xt=urn:btih:' + infoHash;
        ['udp://tracker.opentrackr.org:1337/announce',
         'udp://open.stealth.si:80/announce',
         'udp://tracker.torrent.eu.org:451/announce',
         'udp://open.demonii.com:1337/announce',
         'udp://exodus.desync.com:6969/announce',
         'udp://tracker.openbittorrent.com:6969/announce',
         'udp://explodie.org:6969/announce',
         'udp://p4p.arenabg.com:1337/announce'
        ].forEach(function (tr) { m += '&tr=' + encodeURIComponent(tr); });
        return m;
    }

    async function playViaTorrServer(stream, title, poster, fileIdx) {
        var host = getTorrServerHost();
        if (!host) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }

        Lampa.Noty.show('Đang gửi đến TorrServer...');

        try {
            var magnet = buildMagnet(stream.infoHash);
            var torData = await torrServerAdd(magnet, title, poster);
            var hash = torData.hash || stream.infoHash;

            // Chờ TorrServer nhận torrent
            await new Promise(function (r) { setTimeout(r, 2000); });

            // Lấy file list
            var info = null;
            var retries = 0;
            while (retries < 3) {
                try {
                    info = await torrServerGetFiles(hash);
                    if (info && info.file_stats && info.file_stats.length) break;
                } catch (e) {}
                retries++;
                await new Promise(function (r) { setTimeout(r, 1500); });
            }

            var files = [];
            if (info && info.file_stats) {
                files = info.file_stats.filter(function (f) {
                    return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|wmv|flv|webm|ts|m2ts)$/);
                }).sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
            }

            console.log('[KKPhim] TorrServer files:', files.length, 'fileIdx:', fileIdx);

            if (files.length === 0) {
                // Không tìm file video → thử phát trực tiếp
                var directUrl = torrServerUrl('/stream/fname?link=' + hash + '&index=0&play');
                Lampa.Player.play({ title: title, url: directUrl });
                Lampa.Noty.show('Đang phát từ TorrServer');
                return;
            }

            if (files.length === 1) {
                // 1 file → phát luôn
                var playUrl = torrServerUrl('/stream/fname?link=' + hash + '&index=' + (files[0].id || 0) + '&play');
                Lampa.Player.play({ title: title, url: playUrl });
                Lampa.Noty.show('Đang phát từ TorrServer');
                return;
            }

            // Nhiều file
            if (fileIdx !== undefined && fileIdx !== null && fileIdx >= 0 && fileIdx < files.length) {
                // Có fileIdx từ Torrentio → dùng luôn
                var playUrl2 = torrServerUrl('/stream/fname?link=' + hash + '&index=' + (files[fileIdx].id || fileIdx) + '&play');
                Lampa.Player.play({ title: title, url: playUrl2 });
                Lampa.Noty.show('Đang phát từ TorrServer');
            } else {
                // Cho user chọn file
                showTorrServerFiles(files, hash, title);
            }

        } catch (e) {
            Lampa.Noty.show('Lỗi TorrServer: ' + (e.message || ''));
            console.error('[KKPhim] TorrServer error:', e);
        }
    }

    function showTorrServerFiles(files, hash, title) {
        var items = files.map(function (f, i) {
            var name = (f.path || ('File ' + i)).split('/').pop();
            var sizeMB = f.length ? (f.length / 1024 / 1024).toFixed(0) + ' MB' : '';
            return { title: name + (sizeMB ? ' (' + sizeMB + ')' : ''), value: { id: f.id, path: f.path } };
        });

        Lampa.Select.show({
            title: '📁 Chọn file (' + files.length + ')',
            items: items,
            onSelect: function (a) {
                var url = torrServerUrl('/stream/fname?link=' + hash + '&index=' + a.value.id + '&play');
                Lampa.Player.play({ title: title + ' - ' + (a.value.path || '').split('/').pop(), url: url });
                Lampa.Noty.show('Đang phát từ TorrServer');
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    // ===================== TMDB =====================
    async function tmdbFetch(path) {
        var r = await fetch('https://api.themoviedb.org/3' + path, {
            headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN, 'Content-Type': 'application/json' }
        });
        if (!r.ok) throw new Error('TMDB err ' + r.status);
        return await r.json();
    }

    async function getImdbId(ttype, tmdbId) {
        if (!tmdbId) return null;
        try {
            var res = await tmdbFetch('/' + ttype + '/' + tmdbId + '/external_ids');
            return res.imdb_id || null;
        } catch (e) { return null; }
    }

    // Lấy số season từ TMDB
    async function getTmdbSeasons(tmdbId) {
        try {
            var res = await tmdbFetch('/tv/' + tmdbId + '?language=vi-VN');
            if (res && res.seasons) {
                return res.seasons.filter(function (s) {
                    return s.season_number > 0; // bỏ season 0 (specials)
                }).map(function (s) {
                    return {
                        season_number: s.season_number,
                        name: s.name || ('Season ' + s.season_number),
                        episode_count: s.episode_count || 0,
                        air_date: s.air_date || ''
                    };
                });
            }
        } catch (e) {
            console.log('[KKPhim] Cannot get TMDB seasons:', e);
        }
        return [];
    }

    // ===================== TORRENTIO =====================
    function getTorrentioUrl(ttype, imdbId, season, episode) {
        var mediaType = ttype === 'tv' ? 'series' : 'movie';
        var id = imdbId;
        if (ttype === 'tv' && season && episode) id = imdbId + ':' + season + ':' + episode;

        var config = cleanTorrentioConfig(getTorrentioConfig());
        var url = TORRENTIO_BASE;
        if (config) url += '/' + config;
        url += '/stream/' + mediaType + '/' + id + '.json';
        return url;
    }

    async function fetchTorrentio(ttype, imdbId, season, episode) {
        var url = getTorrentioUrl(ttype, imdbId, season, episode);
        console.log('[KKPhim] Torrentio URL:', url);

        var r = await fetch(url);
        if (!r.ok) {
            console.error('[KKPhim] Torrentio error:', r.status);
            throw new Error('Torrentio error: ' + r.status);
        }
        var data = await r.json();

        return (data.streams || []).map(function (s) {
            var lines = (s.title || '').split('\n');
            var name = lines[0] || 'Unknown';
            var info = lines.slice(1).join(' | ');
            var sizeMatch = info.match(/💾\s*([\d.]+\s*[GMKT]B)/i) || info.match(/([\d.]+\s*[GMKT]B)/i);
            var seedsMatch = info.match(/👤\s*(\d+)/);
            return {
                name: name,
                title: s.title || '',
                infoHash: s.infoHash || '',
                fileIdx: s.fileIdx,
                url: s.url || '',
                behaviorHints: s.behaviorHints || {},
                size: sizeMatch ? sizeMatch[1] : '',
                seeds: seedsMatch ? seedsMatch[1] : '',
                rawName: s.name || ''
            };
        });
    }

    function showTorrentResults(streams, title, poster) {
        var hasTorrServer = !!getTorrServerHost();

        var items = streams.slice(0, 40).map(function (s) {
            var label = s.name;
            if (s.size) label += ' | ' + s.size;
            if (s.seeds) label += ' | 👤' + s.seeds;
            if (s.rawName) label += ' [' + s.rawName + ']';
            return { title: label, value: s };
        });

        Lampa.Select.show({
            title: '🧲 ' + title + ' (' + streams.length + ')' + (hasTorrServer ? ' → TorrServer' : ''),
            items: items,
            onSelect: function (a) {
                var stream = a.value;
                if (hasTorrServer && stream.infoHash) {
                    playViaTorrServer(stream, title, poster, stream.fileIdx);
                } else if (stream.url) {
                    Lampa.Player.play({ title: title + ' - ' + stream.name, url: stream.url });
                } else if (stream.infoHash) {
                    Lampa.Noty.show('Chưa cấu hình TorrServer!');
                } else {
                    Lampa.Noty.show('Không có link phát');
                }
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    // ========= TORRENT SEARCH - FIX TV SERIES =========
    async function openTorrentSearch(tmdbId, ttype, data, episodes, poster) {
        if (ttype === 'tv') {
            openTorrentTvPicker(tmdbId, ttype, data, episodes, poster);
            return;
        }

        // Movie → tìm trực tiếp
        Lampa.Noty.show('Đang tìm torrent...');
        try {
            var imdbId = await getImdbId(ttype, tmdbId);
            if (!imdbId) { Lampa.Noty.show('Không tìm thấy IMDB ID'); return; }
            var streams = await fetchTorrentio(ttype, imdbId);
            if (!streams.length) { Lampa.Noty.show('Không tìm thấy torrent nào'); return; }
            showTorrentResults(streams, data.name || '', poster);
        } catch (e) {
            Lampa.Noty.show('Lỗi: ' + (e.message || ''));
        }
    }

    async function openTorrentTvPicker(tmdbId, ttype, data, episodes, poster) {
        Lampa.Noty.show('Đang tải thông tin seasons...');

        // Bước 1: Lấy seasons từ TMDB
        var tmdbSeasons = await getTmdbSeasons(tmdbId);
        console.log('[KKPhim] TMDB seasons:', tmdbSeasons);

        // Bước 2: Lấy IMDB ID trước
        var imdbId = await getImdbId(ttype, tmdbId);
        if (!imdbId) {
            // Fallback: thử tìm dưới dạng movie
            console.log('[KKPhim] No IMDB for tv, trying movie...');
            imdbId = await getImdbId('movie', tmdbId);
            if (!imdbId) {
                Lampa.Noty.show('Không tìm thấy IMDB ID');
                return;
            }
        }
        console.log('[KKPhim] IMDB ID:', imdbId);

        // Bước 3: Xây dựng danh sách chọn
        if (tmdbSeasons.length > 1) {
            // Nhiều season → cho chọn season trước
            pickSeason(tmdbSeasons, imdbId, data, poster);
        } else if (tmdbSeasons.length === 1) {
            // 1 season → vào chọn tập luôn
            pickEpisode(tmdbSeasons[0], imdbId, data, episodes, poster);
        } else {
            // Không có info season từ TMDB → dùng episodes từ KKPhim
            pickEpisodeFallback(imdbId, data, episodes, poster);
        }
    }

    function pickSeason(tmdbSeasons, imdbId, data, poster) {
        var items = tmdbSeasons.map(function (s) {
            var label = s.name;
            if (s.episode_count) label += ' (' + s.episode_count + ' tập)';
            if (s.air_date) label += ' - ' + s.air_date.slice(0, 4);
            return {
                title: label,
                value: s
            };
        });

        Lampa.Select.show({
            title: '📺 ' + (data.name || '') + ' - Chọn Season',
            items: items,
            onSelect: function (a) {
                var season = a.value;
                // Có episode_count → tạo danh sách tập
                if (season.episode_count > 0) {
                    var epItems = [];
                    for (var i = 1; i <= season.episode_count; i++) {
                        epItems.push({
                            title: 'S' + pad(season.season_number) + 'E' + pad(i) + ' - Tập ' + i,
                            value: { season: season.season_number, episode: i }
                        });
                    }

                    Lampa.Select.show({
                        title: '📺 ' + (data.name || '') + ' - ' + season.name,
                        items: epItems,
                        onSelect: function (b) {
                            doTorrentSearch(imdbId, data, b.value.season, b.value.episode, poster);
                        },
                        onBack: function () {
                            // Quay lại chọn season
                            pickSeason(tmdbSeasons, imdbId, data, poster);
                        }
                    });
                } else {
                    // Không biết số tập → cho nhập
                    promptEpisodeNumber(season.season_number, imdbId, data, poster);
                }
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    function pickEpisode(tmdbSeason, imdbId, data, episodes, poster) {
        var seasonNum = tmdbSeason.season_number;
        var epCount = tmdbSeason.episode_count;

        // Nếu TMDB có episode count → dùng
        if (epCount > 0) {
            var items = [];
            for (var i = 1; i <= epCount; i++) {
                items.push({
                    title: 'S' + pad(seasonNum) + 'E' + pad(i) + ' - Tập ' + i,
                    value: { season: seasonNum, episode: i }
                });
            }

            Lampa.Select.show({
                title: '📺 ' + (data.name || '') + ' - Chọn tập',
                items: items,
                onSelect: function (a) {
                    doTorrentSearch(imdbId, data, a.value.season, a.value.episode, poster);
                },
                onBack: function () { Lampa.Controller.toggle('content'); }
            });
            return;
        }

        // Fallback: dùng episodes từ KKPhim
        pickEpisodeFallback(imdbId, data, episodes, poster);
    }

    function pickEpisodeFallback(imdbId, data, episodes, poster) {
        var items = [];

        if (episodes && episodes.length) {
            var epList = [];
            episodes.forEach(function (sv) {
                (sv.server_data || []).forEach(function (ep) {
                    var epNum = parseInt((ep.name || '').replace(/[^\d]/g, '')) || 0;
                    if (epNum > 0 && !epList.find(function (e) { return e.ep === epNum; })) {
                        epList.push({ ep: epNum, name: ep.name });
                    }
                });
            });

            epList.sort(function (a, b) { return a.ep - b.ep; });

            if (epList.length) {
                items = epList.map(function (e) {
                    return {
                        title: 'S01E' + pad(e.ep) + ' - Tập ' + e.ep,
                        value: { season: 1, episode: e.ep }
                    };
                });
            }
        }

        if (!items.length) {
            promptEpisodeNumber(1, imdbId, data, poster);
            return;
        }

        Lampa.Select.show({
            title: '📺 ' + (data.name || '') + ' - Chọn tập (Season 1)',
            items: items,
            onSelect: function (a) {
                doTorrentSearch(imdbId, data, a.value.season, a.value.episode, poster);
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    function promptEpisodeNumber(defaultSeason, imdbId, data, poster) {
        try {
            if (Lampa.Input && Lampa.Input.edit) {
                Lampa.Input.edit({ title: 'Nhập Season:Episode (VD: ' + defaultSeason + ':1)', value: defaultSeason + ':1', free: true }, function (val) {
                    var p = String(val || defaultSeason + ':1').split(':');
                    doTorrentSearch(imdbId, data, parseInt(p[0]) || defaultSeason, parseInt(p[1]) || 1, '');
                });
                return;
            }
        } catch (ex) {}
        var input = window.prompt('Nhập Season:Episode', defaultSeason + ':1');
        var p = String(input || defaultSeason + ':1').split(':');
        doTorrentSearch(imdbId, data, parseInt(p[0]) || defaultSeason, parseInt(p[1]) || 1, '');
    }

    async function doTorrentSearch(imdbId, data, season, episode, poster) {
        var label = (data.name || '') + ' S' + pad(season) + 'E' + pad(episode);
        Lampa.Noty.show('Đang tìm torrent ' + label + '...');

        console.log('[KKPhim] Searching torrent:', imdbId, 'S' + season + 'E' + episode);

        try {
            var streams = await fetchTorrentio('tv', imdbId, season, episode);

            if (!streams.length) {
                Lampa.Noty.show('Không tìm thấy torrent cho ' + label);
                return;
            }

            showTorrentResults(streams, label, poster);
        } catch (e) {
            Lampa.Noty.show('Lỗi: ' + (e.message || ''));
        }
    }

    function pad(n) {
        return (n < 10 ? '0' : '') + n;
    }

    // ===================== HELPERS =====================
    function detectType(d) {
        if (d && d.tmdb && d.tmdb.type === 'tv') return 'tv';
        if (d && d.tmdb && d.tmdb.type === 'movie') return 'movie';
        if (d && (d.type === 'series' || d.type === 'tvshows' || d.type === 'hoathinh')) return 'tv';
        if (d && d.episode_total && d.episode_total !== '1') return 'tv';
        return 'movie';
    }

    function getTmdbId(d) { return (d && d.tmdb && d.tmdb.id) ? d.tmdb.id : null; }

    function fullImg(url) {
        if (!url) return '';
        return url.indexOf('http') === 0 ? url : IMG + url;
    }

    function pickLogo(imgs) {
        if (!imgs || !imgs.logos || !imgs.logos.length) return null;
        return imgs.logos.find(function (l) { return l.iso_639_1 === 'vi'; }) ||
            imgs.logos.find(function (l) { return l.iso_639_1 === 'en'; }) ||
            imgs.logos[0] || null;
    }

    function escapeHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function cleanDesc(s) { s = String(s || '').replace(/<[^>]+>/g, '').trim(); return s || 'Không có mô tả'; }
    function formatText(s) { return escapeHtml(s || '').replace(/\n/g, '<br>'); }

    function normalizeItem(item) {
        if (!item) return null;
        return {
            name: item.name || item.title || '',
            origin_name: item.origin_name || '',
            slug: item.slug || '',
            poster_url: item.poster_url || item.poster || '',
            thumb_url: item.thumb_url || item.thumb || '',
            year: item.year || '',
            quality: item.quality || '',
            episode_current: item.episode_current || '',
            tmdb: item.tmdb || {},
            category: item.category || [],
            director: item.director || '',
            content: item.content || '',
            time: item.time || '',
            episode_total: item.episode_total || '',
            type: item.type || ''
        };
    }

    function bindEnter(el, fn) {
        var startX = 0, startY = 0, moved = false, touched = false, TOUCH_LIMIT = 16;
        el.on('touchstart', function (e) {
            var t = e.originalEvent && e.originalEvent.touches ? e.originalEvent.touches[0] : (e.touches ? e.touches[0] : null);
            if (!t) return; startX = t.clientX; startY = t.clientY; moved = false;
        });
        el.on('touchmove', function (e) {
            var t = e.originalEvent && e.originalEvent.touches ? e.originalEvent.touches[0] : (e.touches ? e.touches[0] : null);
            if (!t) return;
            if (Math.abs(t.clientX - startX) > TOUCH_LIMIT || Math.abs(t.clientY - startY) > TOUCH_LIMIT) moved = true;
        });
        el.on('touchend', function (e) {
            if (moved) return;
            touched = true; e.preventDefault(); e.stopPropagation();
            setTimeout(function () { fn.call(el[0], e); }, 100);
            setTimeout(function () { touched = false; }, 350);
        });
        el.on('click', function (e) {
            if (touched || moved) return; e.preventDefault(); e.stopPropagation(); fn.call(this, e);
        });
        el.on('hover:enter', function (e) { fn.call(this, e); });
    }

    function getFirstEpisode(episodes) {
        for (var i = 0; i < (episodes || []).length; i++) {
            var sv = episodes[i];
            if (sv && sv.server_data && sv.server_data.length) return sv.server_data[0];
        }
        return null;
    }

    function openSearchPrompt() {
        function goSearch(kw) {
            kw = String(kw || '').trim();
            if (!kw) return;
            Lampa.Activity.push({ url: '', title: 'Tìm kiếm', component: 'kkphim_search', keyword: kw, page_num: 1 });
        }
        try {
            if (Lampa.Input && Lampa.Input.edit) {
                Lampa.Input.edit({ title: 'Tìm phim', value: '', free: true }, function (kw) { goSearch(kw); });
                return;
            }
        } catch (e) {}
        goSearch(window.prompt('Nhập từ khóa:'));
    }

    function enableNativeScroll(scroll) {
        var el = scroll.render();
        el.css({ 'overflow': 'hidden', 'position': 'relative', 'height': '100%' });
        var body = el.find('.scroll__body');
        var props = { 'transform': 'none', 'overflow-y': 'auto', 'overflow-x': 'hidden', '-webkit-overflow-scrolling': 'touch', 'height': '100%', 'padding-bottom': '8em', 'touch-action': 'pan-y' };
        body.css($.extend({ position: 'relative' }, props));
        if (body[0]) Object.keys(props).forEach(function (p) { body[0].style.setProperty(p, props[p], 'important'); });
        setTimeout(function () {
            var b2 = scroll.render().find('.scroll__body');
            if (b2[0]) ['transform', 'overflow-y', 'overflow-x', '-webkit-overflow-scrolling', 'touch-action'].forEach(function (p) { b2[0].style.setProperty(p, props[p], 'important'); });
        }, 50);
    }

    function clearScroll(scroll) { try { scroll.render().find('.scroll__body').empty(); } catch (e) {} }

    function applyController(scroll) {
        Lampa.Controller.add('content', {
            toggle: function () { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); },
            left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
            right: function () { Navigator.move('right'); },
            up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
            down: function () { Navigator.move('down'); },
            back: function () { Lampa.Activity.backward(); }
        });
        setTimeout(function () { Lampa.Controller.toggle('content'); Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, 0);
    }

    function makePeopleCards(list, roleKey) {
        return (list || []).map(function (p) {
            var av = p.profile_path ? '<img src="' + TMDB_IMG_W500 + p.profile_path + '">' : '<div class="kk-cast-empty"></div>';
            return '<div class="kk-cast-card"><div class="kk-cast-img">' + av + '</div><div class="kk-cast-name">' + escapeHtml(p.name || '') + '</div><div class="kk-cast-role">' + escapeHtml(p[roleKey] || '') + '</div></div>';
        }).join('');
    }

    // ===================== STYLES =====================
    function injectStyle() {
        if ($('#kk-css').length) return;
        $('head').append(`<style id="kk-css">
            .kk-topbar{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:1.5em;gap:1em;position:relative;z-index:5}
            .kk-topbar-title{font-size:2.05em;font-weight:900;color:#fff;min-width:0;flex:1}
            .kk-topbar-btns{display:flex;gap:.6em;align-items:center}
            .kk-search-btn,.kk-settings-btn{display:inline-flex;align-items:center;justify-content:center;gap:.55em;min-width:0;padding:.9em 1.25em;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.10);color:#fff;font-size:1.02em;font-weight:800;cursor:pointer}
            .kk-search-btn.focus,.kk-settings-btn.focus{background:#fff;color:#000}
            .kk-row{margin-bottom:2.15em}
            .kk-row-head{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:1em;gap:.8em}
            .kk-row-title{font-size:1.65em;font-weight:900;color:#fff;line-height:1.25}
            .kk-row-more{font-size:1.02em;font-weight:800;padding:.8em 1.3em;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
            .kk-row-more.focus{background:#fff;color:#000}
            .kk-row-list{display:flex;gap:1em;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .2em;-webkit-overflow-scrolling:touch}
            .kk-row-list::-webkit-scrollbar,.kk-cast-list::-webkit-scrollbar,.kk-similar-list::-webkit-scrollbar{display:none}
            .kk-card{flex:0 0 auto;width:10em;cursor:pointer}
            .kk-card--grid{width:100%}
            .kk-card-img{position:relative;width:100%;aspect-ratio:2/3;border-radius:1em;overflow:hidden;background:#242424}
            .kk-card-img img{width:100%;height:100%;object-fit:cover;display:block}
            .kk-card-q{position:absolute;top:.55em;left:.55em;padding:.24em .55em;border-radius:.45em;font-size:.74em;font-weight:800;background:#f6c344;color:#000}
            .kk-card-ep{position:absolute;top:.55em;right:.55em;padding:.24em .55em;border-radius:.45em;font-size:.74em;font-weight:800;background:#e53935;color:#fff}
            .kk-card-name{margin-top:.7em;font-size:1.04em;line-height:1.34;font-weight:700;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
            .kk-card-year{margin-top:.24em;font-size:.94em;color:rgba(255,255,255,.55)}
            .kk-grid-wrap{padding:0 1.5em}
            .kk-grid-title{font-size:2em;font-weight:900;color:#fff;margin:0 0 .95em;line-height:1.2}
            .kk-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1em}
            .kk-loadmore{margin-top:1.25em;text-align:center;padding:1em 1.2em;border-radius:1em;background:rgba(255,255,255,.08);color:#fff;font-size:1.05em;font-weight:800;cursor:pointer}
            .kk-loadmore.focus{background:#ff2332}
            .kk-detail-wrap{background:#141414;border-radius:1.5em;overflow:hidden;margin:0 0 1em}
            .kk-hero{position:relative;overflow:hidden;background:#111}
            .kk-hero-bg{position:relative;height:26em}
            .kk-hero-bg img{width:100%;height:100%;object-fit:cover;display:block}
            .kk-hero-mask{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.08) 0%,rgba(0,0,0,.16) 24%,rgba(0,0,0,.36) 52%,rgba(14,14,14,.78) 78%,rgba(14,14,14,1) 100%)}
            .kk-hero-bottom{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:1.6em 1.7em 1.35em}
            .kk-hero-flex{display:block}
            .kk-hero-poster{display:none}
            .kk-hero-info{min-width:0}
            .kk-logo{max-width:36em;margin:0 0 1.15em}
            .kk-logo img{max-width:100%;max-height:11.8em;object-fit:contain;display:block;filter:drop-shadow(0 .45em 1.3em rgba(0,0,0,.45))}
            .kk-title{font-size:2.7em;line-height:1.04;font-weight:900;color:#fff;margin-bottom:.22em}
            .kk-origin{font-size:1.24em;line-height:1.5;color:rgba(255,255,255,.84)}
            .kk-body{position:relative;z-index:3;padding:1.6em 1.7em 0;background:#141414}
            .kk-metas{display:flex;flex-wrap:wrap;gap:.72em;margin:0 0 1.22em}
            .kk-meta{padding:.66em 1.05em;border-radius:.9em;background:rgba(255,255,255,.08);color:#fff;font-size:1.16em;font-weight:800;line-height:1.2}
            .kk-genres{display:flex;flex-wrap:wrap;gap:.72em;margin:0 0 1.22em}
            .kk-genre{padding:.62em 1.08em;border-radius:.9em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.95);font-size:1.08em;font-weight:700;cursor:pointer;line-height:1.2}
            .kk-genre.focus{background:rgba(255,255,255,.18);color:#fff}
            .kk-crew{margin:0 0 1.25em}
            .kk-crew b{display:block;font-size:1.28em;font-weight:900;color:#fff;margin:0 0 .3em}
            .kk-crew span{display:block;font-size:1.16em;line-height:1.65;color:rgba(255,255,255,.88)}
            .kk-desc{font-size:1.28em;line-height:1.82;color:rgba(255,255,255,.94);margin:0 0 1.5em}
            .kk-actions{display:flex;align-items:center;gap:.8em;flex-wrap:wrap;padding:.15em 0 .25em}
            .kk-play-wrap,.kk-torrent-wrap{width:100%}
            .kk-play{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:1em 1.2em;border-radius:1.05em;background:#ff1730;color:#fff;font-size:1.22em;font-weight:900;cursor:pointer;line-height:1.2}
            .kk-play.focus{background:#ff3047}
            .kk-torrent{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:1em 1.2em;border-radius:1.05em;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:1.22em;font-weight:900;cursor:pointer;line-height:1.2}
            .kk-torrent.focus{background:linear-gradient(135deg,#818cf8,#a78bfa)}
            .kk-section{margin:0;padding:1.35em 1.7em 0;background:#141414}
            .kk-section+.kk-section{padding-top:1.3em;border-top:1px solid rgba(255,255,255,.04)}
            .kk-body+.kk-section{border-top:1px solid rgba(255,255,255,.04)}
            .kk-section--last{padding-bottom:1.6em}
            .kk-block-title{font-size:1.9em;font-weight:900;color:#fff;margin:0 0 .9em;line-height:1.22}
            .kk-cast-list{display:flex;gap:1.1em;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-x}
            .kk-cast-card{flex:0 0 auto;width:8em;text-align:center}
            .kk-cast-img{width:7.1em;height:7.1em;border-radius:50%;overflow:hidden;background:#2b2b2b;margin:0 auto .78em;border:2px solid rgba(255,255,255,.08)}
            .kk-cast-img img{width:100%;height:100%;object-fit:cover;display:block}
            .kk-cast-empty{width:100%;height:100%;background:#333;border-radius:50%}
            .kk-cast-name{font-size:1.08em;line-height:1.38;font-weight:800;color:#fff}
            .kk-cast-role{font-size:.96em;line-height:1.38;color:rgba(255,255,255,.66);margin-top:.2em}
            .kk-server{font-size:1.22em;font-weight:800;color:#63d471;margin:1.1em 0 .78em}
            .kk-eps{display:flex;flex-wrap:wrap;gap:.78em}
            .kk-ep{min-width:4.7em;text-align:center;padding:.9em 1.15em;border-radius:.85em;background:rgba(255,255,255,.09);color:#fff;font-size:1.08em;font-weight:800;cursor:pointer;line-height:1.2}
            .kk-ep.focus{background:#ff2233}
            .kk-similar{padding-bottom:1.2em}
            .kk-similar-list{display:flex;gap:1em;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch}
            .kk-similar-list .kk-card{width:9.2em}
            .kk-stg-wrap{padding:1.5em}
            .kk-stg-title{font-size:2.2em;font-weight:900;color:#fff;margin:0 0 1.5em}
            .kk-stg-group{margin-bottom:2em}
            .kk-stg-group-title{font-size:1.4em;font-weight:900;color:#fff;margin:0 0 .9em;display:flex;align-items:center;gap:.5em}
            .kk-stg-item{display:flex;align-items:center;gap:1em;margin-bottom:.8em;padding:1.1em 1.3em;border-radius:1.1em;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06);cursor:pointer}
            .kk-stg-item.focus{background:rgba(99,102,241,.2);border-color:rgba(99,102,241,.45)}
            .kk-stg-label{flex:1;min-width:0}
            .kk-stg-label-name{font-size:1.15em;font-weight:800;color:#fff;line-height:1.3}
            .kk-stg-label-desc{font-size:.98em;color:rgba(255,255,255,.5);margin-top:.25em;line-height:1.4}
            .kk-stg-value{font-size:1.05em;font-weight:700;color:#a78bfa;max-width:14em;text-align:right;word-break:break-all;line-height:1.3}
            .kk-stg-status{margin-top:1em;padding:1em 1.3em;border-radius:1em;font-size:1.05em;font-weight:700;line-height:1.4}
            .kk-stg-status--ok{background:rgba(74,222,128,.12);color:#4ade80}
            .kk-stg-status--err{background:rgba(248,113,113,.12);color:#f87171}
            .kk-stg-status--loading{background:rgba(255,255,255,.06);color:rgba(255,255,255,.5)}
            .kk-stg-preview{margin-top:.6em;padding:.8em 1em;border-radius:.8em;background:rgba(255,255,255,.04);font-family:monospace;font-size:.88em;color:rgba(255,255,255,.6);word-break:break-all;line-height:1.5}
            .selector,.kk-play,.kk-torrent,.kk-ep,.kk-row-more,.kk-loadmore,.kk-genre,.kk-card,.kk-search-btn,.kk-settings-btn,.kk-stg-item{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
            @media(orientation:portrait){.kk-logo img{max-height:12.2em}.kk-title{font-size:2.35em}.kk-origin{font-size:1.14em}}
            @media(orientation:landscape){.kk-hero-bg{height:29em}.kk-hero-bottom{padding:1.7em 1.95em 1.45em}.kk-hero-flex{display:flex;align-items:flex-end;gap:1.45em}.kk-hero-poster{display:block;width:10.5em;min-width:10.5em}.kk-hero-poster img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:1.1em;display:block;background:#242424}.kk-hero-info{flex:1;min-width:0;padding-bottom:.25em}.kk-logo{max-width:28em;margin-bottom:1.05em}.kk-logo img{max-height:8.9em}.kk-title{font-size:2.85em}.kk-origin{font-size:1.18em}.kk-body{padding:1.5em 1.95em 0}.kk-section{padding:1.35em 1.95em 0}.kk-similar-list .kk-card{width:9.4em}}
            @media(max-width:768px){.kk-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:.85em}}
        </style>`);
    }

    // ===================== MENU =====================
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

    function mkCard(item) {
        item = normalizeItem(item);
        if (!item) return $('<div></div>');
        var p = fullImg(item.poster_url || item.thumb_url);
        var c = $('<div class="kk-card selector"><div class="kk-card-img"><img src="' + p + '">' + (item.quality ? '<div class="kk-card-q">' + escapeHtml(item.quality) + '</div>' : '') + (item.episode_current ? '<div class="kk-card-ep">' + escapeHtml(item.episode_current) + '</div>' : '') + '</div><div class="kk-card-name">' + escapeHtml(item.name || '') + '</div><div class="kk-card-year">' + escapeHtml(item.year || '') + '</div></div>');
        bindEnter(c, function () {
            if (!item || !item.slug) { Lampa.Noty.show('Không có slug'); return; }
            Lampa.Activity.push({ url: '', title: item.name || 'KKPhim', component: 'kkphim_detail', movie: item, page: 1 });
        });
        return c;
    }

    // ===================== COMPONENTS =====================
    function startPlugin() {
        injectStyle();
        addMenu();

        // ==================== SETTINGS ====================
        Lampa.Component.add('kkphim_settings', function () {
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var comp = this;

            this.create = function () {
                clearScroll(scroll);
                var settings = loadSettings();
                var wrap = $('<div class="kk-stg-wrap"></div>');
                wrap.append('<div class="kk-stg-title">⚙️ Cài đặt KKPhim</div>');

                // TorrServer
                var grp1 = $('<div class="kk-stg-group"></div>');
                grp1.append('<div class="kk-stg-group-title">🖥️ TorrServer</div>');

                var hostItem = mkStgItem('Địa chỉ TorrServer', 'VD: 192.168.1.100:8090', settings.torrserver_host || 'Chưa cài');
                bindEnter(hostItem, function () {
                    promptInput('Địa chỉ TorrServer', settings.torrserver_host || '', function (v) {
                        v = String(v || '').trim(); saveSettings({ torrserver_host: v }); settings.torrserver_host = v;
                        hostItem.find('.kk-stg-value').text(v || 'Chưa cài');
                    });
                });
                grp1.append(hostItem);

                var pwItem = mkStgItem('Mật khẩu', 'Để trống nếu không có', settings.torrserver_password ? '••••••' : 'Không có');
                bindEnter(pwItem, function () {
                    promptInput('Mật khẩu TorrServer', settings.torrserver_password || '', function (v) {
                        v = String(v || '').trim(); saveSettings({ torrserver_password: v }); settings.torrserver_password = v;
                        pwItem.find('.kk-stg-value').text(v ? '••••••' : 'Không có');
                    });
                });
                grp1.append(pwItem);

                var testItem = mkStgItem('🔌 Kiểm tra kết nối', 'Test TorrServer', 'Nhấn');
                var statusDiv = $('<div class="kk-stg-status kk-stg-status--loading" style="display:none"></div>');
                bindEnter(testItem, function () { testConn(statusDiv); });
                grp1.append(testItem).append(statusDiv);
                wrap.append(grp1);

                // Torrentio
                var grp2 = $('<div class="kk-stg-group"></div>');
                grp2.append('<div class="kk-stg-group-title">🧲 Torrentio</div>');

                var tioItem = mkStgItem('Torrentio Config', 'Paste manifest URL hoặc config string', settings.torrentio_config ? 'Có config' : 'Mặc định');
                var tioPreview = $('<div class="kk-stg-preview">URL: ' + escapeHtml(buildPreviewUrl()) + '</div>');
                bindEnter(tioItem, function () {
                    promptInput('Torrentio Config', settings.torrentio_config || '', function (v) {
                        v = String(v || '').trim(); saveSettings({ torrentio_config: v }); settings.torrentio_config = v;
                        tioItem.find('.kk-stg-value').text(v ? 'Có config' : 'Mặc định');
                        tioPreview.html('URL: ' + escapeHtml(buildPreviewUrl()));
                    });
                });
                grp2.append(tioItem).append(tioPreview);

                var testTio = mkStgItem('🧪 Test Torrentio', 'Thử tìm torrent Inception', 'Nhấn');
                var tioStatus = $('<div class="kk-stg-status kk-stg-status--loading" style="display:none"></div>');
                bindEnter(testTio, function () { testTorrentioFn(tioStatus); });
                grp2.append(testTio).append(tioStatus);
                wrap.append(grp2);

                // Clear
                var grp3 = $('<div class="kk-stg-group"></div>');
                grp3.append('<div class="kk-stg-group-title">ℹ️ Khác</div>');
                var clearItem = mkStgItem('🗑️ Xóa tất cả cài đặt', 'Reset', 'Xóa');
                clearItem.find('.kk-stg-value').css('color', '#f87171');
                bindEnter(clearItem, function () {
                    try { localStorage.removeItem(SETTINGS_KEY); } catch (e) {}
                    Lampa.Noty.show('Đã xóa'); Lampa.Activity.backward();
                });
                grp3.append(clearItem);
                wrap.append(grp3);

                scroll.append(wrap);
                comp.start();
            };

            function mkStgItem(name, desc, value) {
                return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">' + escapeHtml(name) + '</div><div class="kk-stg-label-desc">' + escapeHtml(desc) + '</div></div><div class="kk-stg-value">' + escapeHtml(value) + '</div></div>');
            }

            function buildPreviewUrl() {
                var config = cleanTorrentioConfig(getTorrentioConfig());
                return TORRENTIO_BASE + (config ? '/' + config : '') + '/stream/movie/{imdb}.json';
            }

            function promptInput(title, cur, cb) {
                try {
                    if (Lampa.Input && Lampa.Input.edit) {
                        Lampa.Input.edit({ title: title, value: cur || '', free: true, nosave: true }, function (v) { cb(v); });
                        return;
                    }
                } catch (e) {}
                var v = window.prompt(title, cur || '');
                if (v !== null) cb(v);
            }

            async function testConn(el) {
                if (!getTorrServerHost()) { el.show().attr('class', 'kk-stg-status kk-stg-status--err').text('❌ Chưa nhập địa chỉ'); return; }
                el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳ Đang kiểm tra...');
                try {
                    var r = await fetch(torrServerUrl('/echo'), { method: 'GET', headers: torrServerHeaders() });
                    el.attr('class', 'kk-stg-status ' + (r.ok ? 'kk-stg-status--ok' : 'kk-stg-status--err')).text(r.ok ? '✅ OK!' : '❌ HTTP ' + r.status);
                } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || 'Lỗi')); }
            }

            async function testTorrentioFn(el) {
                el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳ Testing...');
                var config = cleanTorrentioConfig(getTorrentioConfig());
                var url = TORRENTIO_BASE + (config ? '/' + config : '') + '/stream/movie/tt1375666.json';
                try {
                    var r = await fetch(url);
                    if (!r.ok) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ HTTP ' + r.status + '\n' + url); return; }
                    var data = await r.json();
                    el.attr('class', 'kk-stg-status kk-stg-status--ok').text('✅ OK! ' + (data.streams || []).length + ' kết quả\n' + url);
                } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || '') + '\n' + url); }
            }

            this.start = function () { applyController(scroll); enableNativeScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });

        // ==================== MAIN ====================
        Lampa.Component.add('kkphim_main', function () {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var comp = this;
            var cats = [
                { name: 'Phim Mới Cập Nhật', api: 'danh-sach/phim-moi-cap-nhat' },
                { name: 'Phim Bộ', api: 'v1/api/danh-sach/phim-bo' },
                { name: 'Phim Lẻ', api: 'v1/api/danh-sach/phim-le' },
                { name: 'Hoạt Hình', api: 'v1/api/danh-sach/hoat-hinh' }
            ];

            this.create = function () {
                this.activity.loader(true); clearScroll(scroll);
                var topbar = $('<div class="kk-topbar"><div class="kk-topbar-title">KKPhim</div><div class="kk-topbar-btns"><div class="kk-search-btn selector"><span>🔍</span><span>Tìm</span></div><div class="kk-settings-btn selector"><span>⚙️</span><span>Cài đặt</span></div></div></div>');
                bindEnter(topbar.find('.kk-search-btn'), function () { openSearchPrompt(); });
                bindEnter(topbar.find('.kk-settings-btn'), function () { Lampa.Activity.push({ url: '', title: 'Cài đặt', component: 'kkphim_settings', page: 1 }); });
                scroll.append(topbar);

                var host = getTorrServerHost();
                if (host) scroll.append($('<div style="padding:0 1.5em .5em"><div style="display:inline-flex;align-items:center;gap:.5em;padding:.6em 1em;border-radius:.8em;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.15)"><span>🖥️</span><span style="color:#4ade80;font-weight:700;font-size:.95em">TorrServer: ' + escapeHtml(host) + '</span></div></div>'));

                var loaded = 0;
                cats.forEach(function (cat) {
                    network.silent(API + cat.api + '?page=1', function (res) {
                        var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(normalizeItem).filter(function (i) { return i && i.slug; });
                        if (list.length) {
                            var row = $('<div class="kk-row"></div>');
                            var more = $('<div class="kk-row-more selector">Xem thêm</div>');
                            bindEnter(more, function () { Lampa.Activity.push({ url: '', title: cat.name, component: 'kkphim_category', cat: cat, page_num: 1, mode: 'api' }); });
                            var rl = $('<div class="kk-row-list"></div>');
                            list.slice(0, 12).forEach(function (i) { rl.append(mkCard(i)); });
                            row.append($('<div class="kk-row-head"></div>').append($('<div class="kk-row-title">' + escapeHtml(cat.name) + '</div>')).append(more)).append(rl);
                            scroll.append(row);
                        }
                        loaded++; if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); }
                    }, function () { loaded++; if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); } });
                });
            };
            this.start = function () { applyController(scroll); enableNativeScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // ==================== CATEGORY ====================
        Lampa.Component.add('kkphim_category', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var comp = this;
            var page = object.page_num || 1;
            var title = object.title || (object.cat && object.cat.name) || 'Danh mục';
            var mode = object.mode || 'api';
            var apiPath = object.cat ? object.cat.api : null;
            var catSlug = object.category_slug || '';
            var grid = $('<div class="kk-grid"></div>');
            var loadMore = $('<div class="kk-loadmore selector">Tải thêm</div>');
            var loading = false, hasMore = true;

            this.create = function () {
                this.activity.loader(true); clearScroll(scroll);
                var wrap = $('<div class="kk-grid-wrap"></div>');
                wrap.append($('<div class="kk-grid-title">' + escapeHtml(title) + '</div>')).append(grid).append(loadMore);
                scroll.append(wrap);
                bindEnter(loadMore, function () { if (!loading && hasMore) doLoad(); });
                doLoad();
            };

            function handleRes(res) {
                var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(normalizeItem).filter(function (i) { return i && i.slug; });
                if (!list.length) { hasMore = false; loadMore.text('Hết'); comp.activity.loader(false); loading = false; comp.start(); return; }
                list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); });
                page++; loading = false; loadMore.text('Tải thêm'); comp.activity.loader(false); comp.start();
            }

            function doLoad() {
                loading = true; loadMore.text('Đang tải...');
                var url = (mode === 'category' && catSlug) ? API + 'v1/api/the-loai/' + catSlug + '?page=' + page : API + apiPath + '?page=' + page;
                network.silent(url, handleRes, function () {
                    if (mode === 'category' && catSlug) network.silent(API + 'the-loai/' + catSlug + '?page=' + page, handleRes, function () { loading = false; loadMore.text('Lỗi'); comp.activity.loader(false); });
                    else { loading = false; loadMore.text('Lỗi'); comp.activity.loader(false); }
                });
            }

            this.start = function () { applyController(scroll); enableNativeScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // ==================== SEARCH ====================
        Lampa.Component.add('kkphim_search', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var comp = this;
            var keyword = object.keyword || '';
            var page = object.page_num || 1;
            var grid = $('<div class="kk-grid"></div>');
            var loadMore = $('<div class="kk-loadmore selector">Tải thêm</div>');
            var loading = false, hasMore = true;

            this.create = function () {
                this.activity.loader(true); clearScroll(scroll);
                var wrap = $('<div class="kk-grid-wrap"></div>');
                wrap.append($('<div class="kk-grid-title">Kết quả: ' + escapeHtml(keyword) + '</div>')).append(grid).append(loadMore);
                scroll.append(wrap);
                bindEnter(loadMore, function () { if (!loading && hasMore) doLoad(); });
                doLoad();
            };

            function handleRes(res) {
                var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(normalizeItem).filter(function (i) { return i && i.slug; });
                if (!list.length && page === 1) { hasMore = false; loadMore.text('Không có kết quả'); comp.activity.loader(false); loading = false; comp.start(); return; }
                if (!list.length) { hasMore = false; loadMore.text('Hết'); comp.activity.loader(false); loading = false; comp.start(); return; }
                list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); });
                page++; loading = false; loadMore.text('Tải thêm'); comp.activity.loader(false); comp.start();
            }

            function doLoad() {
                loading = true; loadMore.text('Đang tải...');
                network.silent(API + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + page, handleRes, function () {
                    network.silent(API + 'tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + page, handleRes, function () { loading = false; loadMore.text('Lỗi'); comp.activity.loader(false); });
                });
            }

            this.start = function () { applyController(scroll); enableNativeScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // ==================== DETAIL ====================
        Lampa.Component.add('kkphim_detail', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var movie = normalizeItem(object.movie);
            var comp = this;
            var rendered = false;

            this.create = function () {
                this.activity.loader(true); clearScroll(scroll); rendered = false;
                if (!movie || !movie.slug) { this.activity.loader(false); scroll.append($('<div class="empty__body"><div class="empty__title">Không có dữ liệu</div></div>')); comp.start(); return; }
                network.silent(API + 'phim/' + movie.slug, function (res) {
                    if (rendered) return;
                    loadAll(res.movie || res || {}, res.episodes || []);
                }, function () { comp.activity.loader(false); Lampa.Noty.show('Lỗi tải phim'); });
            };

            async function loadAll(data, episodes) {
                data = normalizeItem(data);
                try {
                    var tid = getTmdbId(data), ttype = detectType(data), tmdb = null, logos = null;
                    if (tid) {
                        try { tmdb = await tmdbFetch('/' + ttype + '/' + tid + '?language=vi-VN&append_to_response=credits,images'); } catch (e) {
                            try { tmdb = await tmdbFetch('/' + ttype + '/' + tid + '?language=en-US&append_to_response=credits,images'); } catch (e2) {}
                        }
                        try { logos = await tmdbFetch('/' + ttype + '/' + tid + '/images'); } catch (e3) {}
                    }
                    if (!rendered) { buildDetail(data, episodes, tmdb, logos, ttype); rendered = true; }
                } catch (e) { if (!rendered) { buildDetail(data, episodes, null, null, detectType(data)); rendered = true; } }
                comp.activity.loader(false); comp.start();
            }

            function buildDetail(data, episodes, tmdb, logos, ttype) {
                clearScroll(scroll);
                var bk = fullImg(data.thumb_url || data.poster_url), ps = fullImg(data.poster_url || data.thumb_url);
                var t = data.name || '', o = data.origin_name || '', d = cleanDesc(data.content);
                var v = (data.tmdb && data.tmdb.vote_average) || 'N/A', y = data.year || '', rt = data.time || '', epCur = data.episode_current || '';
                var ghtml = '', castH = '', directorH = '', crewH = '', logoH = '', dir = '';

                if (tmdb) {
                    if (tmdb.backdrop_path) bk = TMDB_IMG + tmdb.backdrop_path;
                    if (tmdb.poster_path) ps = TMDB_IMG + tmdb.poster_path;
                    if (tmdb.title || tmdb.name) t = tmdb.title || tmdb.name;
                    if (tmdb.original_title || tmdb.original_name) o = tmdb.original_title || tmdb.original_name;
                    if (tmdb.overview) d = tmdb.overview;
                    if (tmdb.vote_average) v = Number(tmdb.vote_average).toFixed(1);
                    if (tmdb.release_date) y = tmdb.release_date.slice(0, 4);
                    if (!y && tmdb.first_air_date) y = tmdb.first_air_date.slice(0, 4);
                    if (tmdb.runtime) rt = tmdb.runtime + ' phút';
                    var logo = pickLogo(logos || tmdb.images);
                    if (logo && logo.file_path) logoH = '<div class="kk-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '"></div>';
                    if (tmdb.credits) {
                        castH = makePeopleCards((tmdb.credits.cast || []).slice(0, 12), 'character');
                        var crew = tmdb.credits.crew || [], dirs = [];
                        if (ttype === 'movie') dirs = crew.filter(function (c) { return c.job === 'Director'; });
                        else dirs = crew.filter(function (c) { return c.job === 'Creator' || c.job === 'Director' || c.job === 'Series Director'; });
                        dirs = dirs.filter(function (p, i, a) { return a.findIndex(function (x) { return (x.id && x.id === p.id) || x.name === p.name; }) === i; }).slice(0, 10);
                        if (dirs.length) { dir = dirs.map(function (c) { return c.name; }).join(', '); directorH = makePeopleCards(dirs.map(function (c) { return { name: c.name, profile_path: c.profile_path, job: c.job || 'Đạo diễn' }; }), 'job'); }
                    }
                }

                var pCats = data.category || [];
                if (pCats.length) ghtml = pCats.map(function (g) { return '<span class="kk-genre selector" data-slug="' + escapeHtml(g.slug || '') + '" data-title="' + escapeHtml(g.name || '') + '">' + escapeHtml(g.name || '') + '</span>'; }).join('');
                else if (tmdb && tmdb.genres) ghtml = tmdb.genres.map(function (g) { return '<span class="kk-genre">' + escapeHtml(g.name || '') + '</span>'; }).join('');

                if (data.director && !dir) {
                    dir = Array.isArray(data.director) ? data.director.join(', ') : data.director;
                    var ld = (Array.isArray(data.director) ? data.director : String(data.director).split(',')).map(function (n) { return { name: String(n).trim(), profile_path: '', job: 'Đạo diễn' }; }).filter(function (x) { return x.name; });
                    if (ld.length) directorH = makePeopleCards(ld, 'job');
                }
                if (dir && !directorH) crewH = '<div class="kk-crew"><b>Đạo diễn</b><span>' + escapeHtml(dir) + '</span></div>';

                var hasTmdb = !!getTmdbId(data);
                var torrentBtn = hasTmdb ? '<div class="kk-torrent-wrap"><div class="kk-torrent selector">🧲 Tìm Torrent' + (getTorrServerHost() ? ' → TorrServer' : '') + '</div></div>' : '';
                var titleHtml = logoH ? '' : '<div class="kk-title">' + escapeHtml(t) + '</div>';

                var hero = $('<div class="kk-hero"><div class="kk-hero-bg"><img src="' + bk + '"><div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster"><img src="' + ps + '"></div><div class="kk-hero-info">' + logoH + titleHtml + '<div class="kk-origin">' + escapeHtml(o) + '</div></div></div></div></div>');
                var body = $('<div class="kk-body"><div class="kk-metas"><span class="kk-meta">⭐ ' + escapeHtml(v) + '</span>' + (y ? '<span class="kk-meta">📅 ' + escapeHtml(y) + '</span>' : '') + (rt ? '<span class="kk-meta">⏱ ' + escapeHtml(rt) + '</span>' : '') + (epCur ? '<span class="kk-meta">🎬 ' + escapeHtml(epCur) + '</span>' : '') + '</div><div class="kk-genres">' + ghtml + '</div>' + crewH + '<div class="kk-desc">' + formatText(d) + '</div><div class="kk-actions"><div class="kk-play-wrap"><div class="kk-play selector">▶ Xem phim</div></div>' + torrentBtn + '</div></div>');

                bindEnter(body.find('.kk-play'), function () {
                    var first = getFirstEpisode(episodes);
                    if (first) playEp(first); else Lampa.Noty.show('Không tìm thấy tập');
                });

                if (hasTmdb) {
                    bindEnter(body.find('.kk-torrent'), function () {
                        openTorrentSearch(getTmdbId(data), ttype, data, episodes, ps);
                    });
                }

                body.find('.kk-genre[data-slug]').each(function () {
                    var g = $(this);
                    bindEnter(g, function () {
                        var slug = g.attr('data-slug');
                        if (slug) Lampa.Activity.push({ url: '', title: g.attr('data-title') || 'Thể loại', component: 'kkphim_category', mode: 'category', category_slug: slug, page_num: 1 });
                    });
                });

                var dw = $('<div class="kk-detail-wrap"></div>');
                dw.append(hero).append(body);
                if (directorH) dw.append($('<div class="kk-section"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">' + directorH + '</div></div>'));
                if (castH) dw.append($('<div class="kk-section"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">' + castH + '</div></div>'));

                if (episodes && episodes.length) {
                    var ew = $('<div class="kk-section"></div>');
                    ew.append($('<div class="kk-block-title">Danh sách tập</div>'));
                    episodes.forEach(function (sv) {
                        ew.append($('<div class="kk-server">' + escapeHtml(sv.server_name || '') + '</div>'));
                        var g = $('<div class="kk-eps"></div>');
                        (sv.server_data || []).forEach(function (ep) {
                            var b = $('<div class="kk-ep selector">' + escapeHtml(ep.name || '') + '</div>');
                            bindEnter(b, function () { playEp(ep); });
                            g.append(b);
                        });
                        ew.append(g);
                    });
                    dw.append(ew);
                }

                scroll.append(dw);
                loadSimilar(data, dw);
            }

            function loadSimilar(data, dw) {
                var cats = data.category || [];
                if (!cats.length || !cats[0].slug) { dw.append($('<div class="kk-section kk-section--last"></div>')); return; }
                network.silent(API + 'v1/api/the-loai/' + cats[0].slug + '?page=1', function (res) { handleSim(res, dw); }, function () {
                    network.silent(API + 'the-loai/' + cats[0].slug + '?page=1', function (r2) { handleSim(r2, dw); }, function () { dw.append($('<div class="kk-section kk-section--last"></div>')); });
                });
            }

            function handleSim(res, dw) {
                var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(normalizeItem).filter(function (i) { return i && i.slug && i.slug !== movie.slug; }).slice(0, 12);
                if (!list.length) { dw.append($('<div class="kk-section kk-section--last"></div>')); return; }
                var row = $('<div class="kk-section kk-section--last kk-similar"></div>');
                row.append($('<div class="kk-block-title">Phim liên quan</div>'));
                var rl = $('<div class="kk-similar-list"></div>');
                list.forEach(function (i) { rl.append(mkCard(i)); });
                row.append(rl); dw.append(row);
            }

            function playEp(ep) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                if (!link) { Lampa.Noty.show('Không có link phát'); return; }
                Lampa.Player.play({ title: (movie.name || '') + ' - ' + (ep.name || ''), url: link });
            }

            this.start = function () { applyController(scroll); enableNativeScroll(scroll); };
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();