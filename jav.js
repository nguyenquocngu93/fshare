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

    // ===================== SETTINGS =====================
    var SETTINGS_KEY = 'kkphim_settings';

    function loadSettings() {
        try {
            var s = localStorage.getItem(SETTINGS_KEY);
            return s ? JSON.parse(s) : {};
        } catch (e) { return {}; }
    }

    function saveSettings(obj) {
        try {
            var cur = loadSettings();
            Object.keys(obj).forEach(function (k) { cur[k] = obj[k]; });
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(cur));
        } catch (e) {}
    }

    function getTorrServerHost() {
        return loadSettings().torrserver_host || '';
    }

    function getTorrServerPassword() {
        return loadSettings().torrserver_password || '';
    }

    function getTorrentioConfig() {
        return loadSettings().torrentio_config || '';
    }

    // ===================== TORRENTIO CONFIG PARSER =====================
    function cleanTorrentioConfig(raw) {
        if (!raw) return '';
        raw = String(raw).trim();
        if (!raw) return '';

        // Case 1: Manifest URL
        // https://torrentio.strem.fun/sort=seeders%7Cqualityfilter=brremux/manifest.json
        var m1 = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
        if (m1 && m1[1]) return m1[1];

        // Case 2: Configure URL
        // https://torrentio.strem.fun/configure/sort=seeders%7C...
        var m2 = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
        if (m2 && m2[1]) {
            var c = m2[1].replace(/\/+$/, '');
            return c;
        }

        // Case 3: Stream URL
        // https://torrentio.strem.fun/sort=seeders/stream/...
        var m3 = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
        if (m3 && m3[1]) return m3[1];

        // Case 4: Just domain with config
        // https://torrentio.strem.fun/sort=seeders
        if (raw.indexOf('torrentio.strem.fun') > -1) {
            raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '');
            raw = raw.replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i, '');
            raw = raw.replace(/^\/+|\/+$/g, '');
            if (raw && raw.indexOf('=') > -1) return raw.replace(/\|/g, '%7C');
            return '';
        }

        // Case 5: Raw config string with pipe
        // sort=seeders|qualityfilter=brremux
        raw = raw.replace(/^\/+|\/+$/g, '');

        // Encode | → %7C cho URL path hợp lệ
        raw = raw.replace(/\|/g, '%7C');

        // Validate: phải có dấu = để là config hợp lệ
        if (raw.indexOf('=') === -1) return '';

        return raw;
    }

    // ===================== TORRSERVER API =====================
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
            body: JSON.stringify({
                action: 'add',
                link: magnet,
                title: title || 'KKPhim Torrent',
                poster: poster || '',
                save_to_db: false
            })
        });

        if (!r.ok) {
            var errText = '';
            try { errText = await r.text(); } catch (e) {}
            throw new Error('TorrServer add error: ' + r.status + ' ' + errText);
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

        if (!r.ok) throw new Error('TorrServer get error: ' + r.status);
        return await r.json();
    }

    function buildMagnet(infoHash) {
        var magnet = 'magnet:?xt=urn:btih:' + infoHash;
        var trackers = [
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://open.stealth.si:80/announce',
            'udp://tracker.torrent.eu.org:451/announce',
            'udp://open.demonii.com:1337/announce',
            'udp://exodus.desync.com:6969/announce',
            'udp://tracker.tiny-vps.com:6969/announce',
            'udp://tracker.moeking.me:6969/announce',
            'udp://tracker.openbittorrent.com:6969/announce',
            'udp://explodie.org:6969/announce',
            'udp://p4p.arenabg.com:1337/announce'
        ];
        trackers.forEach(function (tr) { magnet += '&tr=' + encodeURIComponent(tr); });
        return magnet;
    }

    async function playViaTorrServer(stream, title, poster, fileIdx) {
        var host = getTorrServerHost();
        if (!host) {
            Lampa.Noty.show('Chưa cấu hình TorrServer! Vào Cài đặt KKPhim');
            return;
        }

        Lampa.Noty.show('Đang gửi đến TorrServer...');

        try {
            var magnet = buildMagnet(stream.infoHash);
            var torData = await torrServerAdd(magnet, title, poster);
            var hash = torData.hash || stream.infoHash;

            await new Promise(function (resolve) { setTimeout(resolve, 1500); });

            var info = null;
            try { info = await torrServerGetFiles(hash); } catch (e) {}

            var files = [];
            if (info && info.file_stats) {
                files = info.file_stats.filter(function (f) {
                    return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|wmv|flv|webm|ts|m2ts)$/);
                }).sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
            }

            if (files.length > 1 && (fileIdx === undefined || fileIdx === null)) {
                showTorrServerFiles(files, hash, title);
            } else {
                var idx = (fileIdx !== undefined && fileIdx !== null) ? fileIdx : 0;
                if (files.length && idx < files.length) idx = files[idx].id || idx;
                else if (files.length) idx = files[0].id || 0;

                var playUrl = torrServerUrl('/stream/fname?link=' + hash + '&index=' + idx + '&play');
                Lampa.Player.play({ title: title, url: playUrl });
                Lampa.Noty.show('Đang phát từ TorrServer');
            }
        } catch (e) {
            Lampa.Noty.show('Lỗi TorrServer: ' + (e.message || 'Unknown'));
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
                var playUrl = torrServerUrl('/stream/fname?link=' + hash + '&index=' + a.value.id + '&play');
                Lampa.Player.play({ title: title + ' - ' + (a.value.path || '').split('/').pop(), url: playUrl });
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
        if (!r.ok) throw new Error('TMDB err');
        return await r.json();
    }

    async function getImdbId(ttype, tmdbId) {
        if (!tmdbId) return null;
        try {
            var res = await tmdbFetch('/' + ttype + '/' + tmdbId + '/external_ids');
            return res.imdb_id || null;
        } catch (e) { return null; }
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

        // Debug: log URL để kiểm tra
        console.log('[KKPhim] Torrentio URL:', url);

        var r = await fetch(url);
        if (!r.ok) {
            var errBody = '';
            try { errBody = await r.text(); } catch (e) {}
            console.error('[KKPhim] Torrentio error:', r.status, errBody);
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
                    Lampa.Noty.show('Chưa cấu hình TorrServer! Vào Cài đặt KKPhim');
                } else {
                    Lampa.Noty.show('Không có link phát');
                }
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    async function openTorrentSearch(tmdbId, ttype, data, episodes, poster) {
        if (ttype === 'tv') { openTorrentTvPicker(tmdbId, ttype, data, episodes, poster); return; }

        Lampa.Noty.show('Đang tìm torrent...');
        try {
            var imdbId = await getImdbId(ttype, tmdbId);
            if (!imdbId) { Lampa.Noty.show('Không tìm thấy IMDB ID'); return; }
            var streams = await fetchTorrentio(ttype, imdbId);
            if (!streams.length) { Lampa.Noty.show('Không tìm thấy torrent nào'); return; }
            showTorrentResults(streams, data.name || '', poster);
        } catch (e) {
            Lampa.Noty.show('Lỗi tìm torrent: ' + (e.message || ''));
        }
    }

    function openTorrentTvPicker(tmdbId, ttype, data, episodes, poster) {
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
            if (epList.length) {
                items = epList.map(function (e) {
                    return { title: 'Season 1 - Tập ' + e.ep, season: 1, episode: e.ep };
                });
            }
        }

        if (!items.length) {
            try {
                if (Lampa.Input && Lampa.Input.edit) {
                    Lampa.Input.edit({ title: 'Nhập Season:Episode (VD: 1:5)', value: '1:1', free: true }, function (val) {
                        var p = String(val || '1:1').split(':');
                        searchTorrentForEp(tmdbId, ttype, data, parseInt(p[0]) || 1, parseInt(p[1]) || 1, poster);
                    });
                    return;
                }
            } catch (ex) {}
            var input = window.prompt('Nhập Season:Episode (VD: 1:5)', '1:1');
            var p = String(input || '1:1').split(':');
            searchTorrentForEp(tmdbId, ttype, data, parseInt(p[0]) || 1, parseInt(p[1]) || 1, poster);
            return;
        }

        Lampa.Select.show({
            title: 'Chọn tập để tìm torrent',
            items: items.map(function (it) { return { title: it.title, value: it }; }),
            onSelect: function (a) { searchTorrentForEp(tmdbId, ttype, data, a.value.season, a.value.episode, poster); },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    async function searchTorrentForEp(tmdbId, ttype, data, season, episode, poster) {
        Lampa.Noty.show('Đang tìm torrent S' + season + 'E' + episode + '...');
        try {
            var imdbId = await getImdbId(ttype, tmdbId);
            if (!imdbId) { Lampa.Noty.show('Không tìm thấy IMDB ID'); return; }
            var streams = await fetchTorrentio(ttype, imdbId, season, episode);
            if (!streams.length) { Lampa.Noty.show('Không tìm thấy torrent nào'); return; }
            showTorrentResults(streams, (data.name || '') + ' S' + season + 'E' + episode, poster);
        } catch (e) {
            Lampa.Noty.show('Lỗi tìm torrent: ' + (e.message || ''));
        }
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

    function cleanDesc(s) {
        s = String(s || '').replace(/<[^>]+>/g, '').trim();
        return s || 'Không có mô tả';
    }

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
            if (touched || moved) return;
            e.preventDefault(); e.stopPropagation(); fn.call(this, e);
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
        goSearch(window.prompt('Nhập từ khóa tìm phim:'));
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
            if (b2[0]) { ['transform', 'overflow-y', 'overflow-x', '-webkit-overflow-scrolling', 'touch-action'].forEach(function (p) { b2[0].style.setProperty(p, props[p], 'important'); }); }
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
            .kk-search-btn,.kk-settings-btn{display:inline-flex;align-items:center;justify-content:center;gap:.55em;min-width:0;padding:.9em 1.25em;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.10);color:#fff;font-size:1.02em;font-weight:800;cursor:pointer;box-shadow:0 .35em .9em rgba(0,0,0,.18)}
            .kk-search-btn.focus,.kk-settings-btn.focus{background:#fff;color:#000}
            .kk-row{margin-bottom:2.15em}
            .kk-row-head{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:1em;gap:.8em}
            .kk-row-title{font-size:1.65em;font-weight:900;color:#fff;line-height:1.25;padding:.1em 0}
            .kk-row-more{font-size:1.02em;font-weight:800;padding:.8em 1.3em;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;line-height:1}
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
            .kk-grid-title{font-size:2em;font-weight:900;color:#fff;margin:0 0 .95em;padding:.15em 0 .2em;line-height:1.2}
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
            .kk-origin{font-size:1.24em;line-height:1.5;color:rgba(255,255,255,.84);padding:.05em 0 .1em}
            .kk-body{position:relative;z-index:3;padding:1.6em 1.7em 0;background:#141414}
            .kk-metas{display:flex;flex-wrap:wrap;gap:.72em;margin:0 0 1.22em;padding:.05em 0}
            .kk-meta{padding:.66em 1.05em;border-radius:.9em;background:rgba(255,255,255,.08);color:#fff;font-size:1.16em;font-weight:800;line-height:1.2}
            .kk-genres{display:flex;flex-wrap:wrap;gap:.72em;margin:0 0 1.22em;padding:.05em 0}
            .kk-genre{padding:.62em 1.08em;border-radius:.9em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.95);font-size:1.08em;font-weight:700;cursor:pointer;line-height:1.2}
            .kk-genre.focus{background:rgba(255,255,255,.18);color:#fff}
            .kk-crew{margin:0 0 1.25em}
            .kk-crew b{display:block;font-size:1.28em;font-weight:900;color:#fff;margin:0 0 .3em}
            .kk-crew span{display:block;font-size:1.16em;line-height:1.65;color:rgba(255,255,255,.88)}
            .kk-desc{font-size:1.28em;line-height:1.82;color:rgba(255,255,255,.94);margin:0 0 1.5em}
            .kk-actions{display:flex;align-items:center;gap:.8em;flex-wrap:wrap;padding:.15em 0 .25em}
            .kk-play-wrap,.kk-torrent-wrap{width:100%}
            .kk-play{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:1em 1.2em;border-radius:1.05em;background:#ff1730;color:#fff;font-size:1.22em;font-weight:900;cursor:pointer;box-shadow:0 .5em 1.25em rgba(255,23,48,.22);line-height:1.2}
            .kk-play.focus{background:#ff3047}
            .kk-torrent{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:1em 1.2em;border-radius:1.05em;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:1.22em;font-weight:900;cursor:pointer;box-shadow:0 .5em 1.25em rgba(99,102,241,.22);line-height:1.2}
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
            @media(orientation:landscape){.kk-hero-bg{height:29em}.kk-hero-bottom{padding:1.7em 1.95em 1.45em}.kk-hero-flex{display:flex;align-items:flex-end;gap:1.45em}.kk-hero-poster{display:block;width:10.5em;min-width:10.5em}.kk-hero-poster img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:1.1em;display:block;background:#242424;box-shadow:0 .8em 1.8em rgba(0,0,0,.38)}.kk-hero-info{flex:1;min-width:0;padding-bottom:.25em}.kk-logo{max-width:28em;margin-bottom:1.05em}.kk-logo img{max-height:8.9em}.kk-title{font-size:2.85em}.kk-origin{font-size:1.18em}.kk-body{padding:1.5em 1.95em 0}.kk-section{padding:1.35em 1.95em 0}.kk-similar-list .kk-card{width:9.4em}}
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
        Lampa.Listener.follow('full', function () { setTimeout(ins, 500); });
    }

    function mkCard(item) {
        item = normalizeItem(item);
        if (!item) return $('<div></div>');
        var p = fullImg(item.poster_url || item.thumb_url);
        var c = $('<div class="kk-card selector"><div class="kk-card-img"><img src="' + p + '">' + (item.quality ? '<div class="kk-card-q">' + escapeHtml(item.quality) + '</div>' : '') + (item.episode_current ? '<div class="kk-card-ep">' + escapeHtml(item.episode_current) + '</div>' : '') + '</div><div class="kk-card-name">' + escapeHtml(item.name || '') + '</div><div class="kk-card-year">' + escapeHtml(item.year || '') + '</div></div>');
        bindEnter(c, function () {
            if (!item || !item.slug) { Lampa.Noty.show('Phim không có slug'); return; }
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
                var host = settings.torrserver_host || '';
                var pw = settings.torrserver_password || '';
                var tioConfig = settings.torrentio_config || '';

                var wrap = $('<div class="kk-stg-wrap"></div>');
                wrap.append('<div class="kk-stg-title">⚙️ Cài đặt KKPhim</div>');

                // === TorrServer ===
                var grp1 = $('<div class="kk-stg-group"></div>');
                grp1.append('<div class="kk-stg-group-title">🖥️ TorrServer</div>');

                var hostItem = $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">Địa chỉ TorrServer</div><div class="kk-stg-label-desc">VD: 192.168.1.100:8090</div></div><div class="kk-stg-value">' + escapeHtml(host || 'Chưa cài') + '</div></div>');
                bindEnter(hostItem, function () {
                    promptInput('Địa chỉ TorrServer', host, function (val) {
                        val = String(val || '').trim();
                        saveSettings({ torrserver_host: val });
                        hostItem.find('.kk-stg-value').text(val || 'Chưa cài');
                        Lampa.Noty.show(val ? 'Đã lưu: ' + val : 'Đã xóa');
                    });
                });
                grp1.append(hostItem);

                var pwItem = $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">Mật khẩu TorrServer</div><div class="kk-stg-label-desc">Để trống nếu không có</div></div><div class="kk-stg-value">' + (pw ? '••••••' : 'Không có') + '</div></div>');
                bindEnter(pwItem, function () {
                    promptInput('Mật khẩu TorrServer', pw, function (val) {
                        val = String(val || '').trim();
                        saveSettings({ torrserver_password: val });
                        pwItem.find('.kk-stg-value').text(val ? '••••••' : 'Không có');
                        Lampa.Noty.show(val ? 'Đã lưu mật khẩu' : 'Đã xóa mật khẩu');
                    });
                });
                grp1.append(pwItem);

                var testItem = $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">🔌 Kiểm tra kết nối</div><div class="kk-stg-label-desc">Test TorrServer</div></div><div class="kk-stg-value">Nhấn để thử</div></div>');
                var statusDiv = $('<div class="kk-stg-status kk-stg-status--loading" style="display:none"></div>');
                bindEnter(testItem, function () { testTorrServer(statusDiv); });
                grp1.append(testItem).append(statusDiv);
                wrap.append(grp1);

                // === Torrentio ===
                var grp2 = $('<div class="kk-stg-group"></div>');
                grp2.append('<div class="kk-stg-group-title">🧲 Torrentio</div>');

                // Preview URL hiện tại
                var currentClean = cleanTorrentioConfig(tioConfig);
                var previewUrl = TORRENTIO_BASE + (currentClean ? '/' + currentClean : '') + '/stream/movie/{imdb}.json';

                var tioItem = $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">Torrentio Config</div><div class="kk-stg-label-desc">Cách lấy: Vào torrentio.strem.fun/configure → chọn tùy chọn → copy link Install → paste vào đây</div></div><div class="kk-stg-value">' + escapeHtml(tioConfig ? 'Có config' : 'Mặc định') + '</div></div>');
                var tioPreview = $('<div class="kk-stg-preview">URL: ' + escapeHtml(previewUrl) + '</div>');

                bindEnter(tioItem, function () {
                    promptInput('Torrentio Config (paste manifest URL hoặc config string)', tioConfig, function (val) {
                        val = String(val || '').trim();
                        saveSettings({ torrentio_config: val });

                        var cleaned = cleanTorrentioConfig(val);
                        var newPreview = TORRENTIO_BASE + (cleaned ? '/' + cleaned : '') + '/stream/movie/{imdb}.json';

                        tioItem.find('.kk-stg-value').text(val ? 'Có config' : 'Mặc định');
                        tioPreview.html('URL: ' + escapeHtml(newPreview));

                        if (val && !cleaned) {
                            Lampa.Noty.show('⚠️ Config không hợp lệ, sẽ dùng mặc định');
                        } else {
                            Lampa.Noty.show(val ? 'Đã lưu config' : 'Dùng mặc định');
                        }

                        console.log('[KKPhim] Torrentio config raw:', val);
                        console.log('[KKPhim] Torrentio config cleaned:', cleaned);
                        console.log('[KKPhim] Torrentio URL preview:', newPreview);
                    });
                });
                grp2.append(tioItem).append(tioPreview);

                // Test Torrentio
                var testTioItem = $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">🧪 Test Torrentio</div><div class="kk-stg-label-desc">Thử tìm torrent cho phim Inception (tt1375666)</div></div><div class="kk-stg-value">Nhấn để thử</div></div>');
                var tioStatus = $('<div class="kk-stg-status kk-stg-status--loading" style="display:none"></div>');
                bindEnter(testTioItem, function () { testTorrentioConfig(tioStatus); });
                grp2.append(testTioItem).append(tioStatus);

                wrap.append(grp2);

                // === Info ===
                var grp3 = $('<div class="kk-stg-group"></div>');
                grp3.append('<div class="kk-stg-group-title">ℹ️ Thông tin</div>');

                var clearItem = $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">🗑️ Xóa tất cả cài đặt</div><div class="kk-stg-label-desc">Reset toàn bộ</div></div><div class="kk-stg-value" style="color:#f87171">Xóa</div></div>');
                bindEnter(clearItem, function () {
                    try { localStorage.removeItem(SETTINGS_KEY); } catch (e) {}
                    Lampa.Noty.show('Đã xóa tất cả cài đặt');
                    Lampa.Activity.backward();
                });
                grp3.append(clearItem);
                wrap.append(grp3);

                scroll.append(wrap);
                comp.start();
            };

            function promptInput(title, currentVal, cb) {
                try {
                    if (Lampa.Input && Lampa.Input.edit) {
                        Lampa.Input.edit({ title: title, value: currentVal || '', free: true, nosave: true }, function (val) { cb(val); });
                        return;
                    }
                } catch (e) {}
                var val = window.prompt(title, currentVal || '');
                if (val !== null) cb(val);
            }

            async function testTorrServer(statusDiv) {
                var host = getTorrServerHost();
                if (!host) { statusDiv.show().attr('class', 'kk-stg-status kk-stg-status--err').text('❌ Chưa nhập địa chỉ'); return; }
                statusDiv.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳ Đang kiểm tra...');
                try {
                    var r = await fetch(torrServerUrl('/echo'), { method: 'GET', headers: torrServerHeaders() });
                    if (r.ok) {
                        var text = ''; try { text = await r.text(); } catch (e) {}
                        statusDiv.attr('class', 'kk-stg-status kk-stg-status--ok').text('✅ Kết nối OK! ' + text.substring(0, 50));
                    } else {
                        statusDiv.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ HTTP ' + r.status);
                    }
                } catch (e) {
                    statusDiv.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || 'Timeout'));
                }
            }

            async function testTorrentioConfig(statusDiv) {
                statusDiv.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳ Đang test Torrentio...');

                var config = cleanTorrentioConfig(getTorrentioConfig());
                var testUrl = TORRENTIO_BASE;
                if (config) testUrl += '/' + config;
                testUrl += '/stream/movie/tt1375666.json';  // Inception

                console.log('[KKPhim] Test Torrentio URL:', testUrl);

                try {
                    var r = await fetch(testUrl);
                    if (!r.ok) {
                        var errBody = '';
                        try { errBody = await r.text(); } catch (e) {}
                        statusDiv.attr('class', 'kk-stg-status kk-stg-status--err')
                            .text('❌ HTTP ' + r.status + (errBody ? ': ' + errBody.substring(0, 100) : '') + '\nURL: ' + testUrl);
                        return;
                    }
                    var data = await r.json();
                    var count = (data.streams || []).length;
                    statusDiv.attr('class', 'kk-stg-status kk-stg-status--ok')
                        .text('✅ Config OK! Tìm thấy ' + count + ' torrent cho Inception\nURL: ' + testUrl);
                } catch (e) {
                    statusDiv.attr('class', 'kk-stg-status kk-stg-status--err')
                        .text('❌ ' + (e.message || 'Lỗi') + '\nURL: ' + testUrl);
                }
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
                { name: 'Phim Mới Cập Nhật', api: 'danh-sach/phim-moi-cap-nhat', slug: 'phim-moi-cap-nhat' },
                { name: 'Phim Bộ', api: 'v1/api/danh-sach/phim-bo', slug: 'phim-bo' },
                { name: 'Phim Lẻ', api: 'v1/api/danh-sach/phim-le', slug: 'phim-le' },
                { name: 'Hoạt Hình', api: 'v1/api/danh-sach/hoat-hinh', slug: 'hoat-hinh' }
            ];

            this.create = function () {
                this.activity.loader(true);
                clearScroll(scroll);

                var topbar = $('<div class="kk-topbar"><div class="kk-topbar-title">KKPhim</div><div class="kk-topbar-btns"><div class="kk-search-btn selector"><span>🔍</span><span>Tìm phim</span></div><div class="kk-settings-btn selector"><span>⚙️</span><span>Cài đặt</span></div></div></div>');
                bindEnter(topbar.find('.kk-search-btn'), function () { openSearchPrompt(); });
                bindEnter(topbar.find('.kk-settings-btn'), function () {
                    Lampa.Activity.push({ url: '', title: 'Cài đặt KKPhim', component: 'kkphim_settings', page: 1 });
                });
                scroll.append(topbar);

                var host = getTorrServerHost();
                if (host) {
                    scroll.append($('<div style="padding:0 1.5em .5em"><div style="display:inline-flex;align-items:center;gap:.5em;padding:.6em 1em;border-radius:.8em;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.15)"><span style="font-size:.95em">🖥️</span><span style="font-size:.95em;color:#4ade80;font-weight:700">TorrServer: ' + escapeHtml(host) + '</span></div></div>'));
                }

                var loaded = 0;
                cats.forEach(function (cat) {
                    network.silent(API + cat.api + '?page=1', function (res) {
                        var list = (res && res.items) ? res.items : (res && res.data && res.data.items) ? res.data.items : [];
                        list = list.map(normalizeItem).filter(function (item) { return item && item.slug; });
                        if (list.length) {
                            var row = $('<div class="kk-row"></div>');
                            var head = $('<div class="kk-row-head"></div>');
                            var more = $('<div class="kk-row-more selector">Xem thêm</div>');
                            var rl = $('<div class="kk-row-list"></div>');
                            bindEnter(more, function () { Lampa.Activity.push({ url: '', title: cat.name, component: 'kkphim_category', cat: cat, page_num: 1, mode: 'api' }); });
                            list.slice(0, 12).forEach(function (item) { rl.append(mkCard(item)); });
                            head.append($('<div class="kk-row-title">' + escapeHtml(cat.name) + '</div>')).append(more);
                            row.append(head).append(rl);
                            scroll.append(row);
                        }
                        loaded++;
                        if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); }
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
            var wrap = $('<div class="kk-grid-wrap"></div>');
            var grid = $('<div class="kk-grid"></div>');
            var loadMore = $('<div class="kk-loadmore selector">Tải thêm</div>');
            var loading = false, hasMore = true;

            this.create = function () {
                this.activity.loader(true); clearScroll(scroll);
                wrap.append($('<div class="kk-grid-title">' + escapeHtml(title) + '</div>')).append(grid).append(loadMore);
                scroll.append(wrap);
                bindEnter(loadMore, function () { if (!loading && hasMore) doLoad(); });
                doLoad();
            };

            function handleRes(res) {
                var list = (res && res.items) ? res.items : (res && res.data && res.data.items) ? res.data.items : [];
                list = list.map(normalizeItem).filter(function (item) { return item && item.slug; });
                if (!list.length) { hasMore = false; loadMore.text('Hết dữ liệu'); comp.activity.loader(false); loading = false; comp.start(); return; }
                list.forEach(function (item) { grid.append(mkCard(item).addClass('kk-card--grid')); });
                page++; loading = false; loadMore.text('Tải thêm'); comp.activity.loader(false); comp.start();
            }

            function doLoad() {
                loading = true; loadMore.text('Đang tải...');
                var url = (mode === 'category' && catSlug) ? API + 'v1/api/the-loai/' + catSlug + '?page=' + page : API + apiPath + '?page=' + page;
                network.silent(url, function (res) { handleRes(res); }, function () {
                    if (mode === 'category' && catSlug) {
                        network.silent(API + 'the-loai/' + catSlug + '?page=' + page, function (r2) { handleRes(r2); }, function () { loading = false; loadMore.text('Tải lại'); comp.activity.loader(false); Lampa.Noty.show('Lỗi'); });
                    } else { loading = false; loadMore.text('Tải lại'); comp.activity.loader(false); Lampa.Noty.show('Lỗi'); }
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
            var wrap = $('<div class="kk-grid-wrap"></div>');
            var grid = $('<div class="kk-grid"></div>');
            var loadMore = $('<div class="kk-loadmore selector">Tải thêm</div>');
            var loading = false, hasMore = true;

            this.create = function () {
                this.activity.loader(true); clearScroll(scroll);
                wrap.append($('<div class="kk-grid-title">Kết quả: ' + escapeHtml(keyword) + '</div>')).append(grid).append(loadMore);
                scroll.append(wrap);
                bindEnter(loadMore, function () { if (!loading && hasMore) doLoad(); });
                doLoad();
            };

            function handleRes(res) {
                var list = (res && res.items) ? res.items : (res && res.data && res.data.items) ? res.data.items : [];
                list = list.map(normalizeItem).filter(function (item) { return item && item.slug; });
                if (!list.length && page === 1) { hasMore = false; loadMore.text('Không có kết quả'); comp.activity.loader(false); loading = false; comp.start(); return; }
                if (!list.length) { hasMore = false; loadMore.text('Hết dữ liệu'); comp.activity.loader(false); loading = false; comp.start(); return; }
                list.forEach(function (item) { grid.append(mkCard(item).addClass('kk-card--grid')); });
                page++; loading = false; loadMore.text('Tải thêm'); comp.activity.loader(false); comp.start();
            }

            function doLoad() {
                loading = true; loadMore.text('Đang tải...');
                var url = API + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + page;
                network.silent(url, function (res) { handleRes(res); }, function () {
                    network.silent(API + 'tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + page, function (r2) { handleRes(r2); }, function () { loading = false; loadMore.text('Tải lại'); comp.activity.loader(false); Lampa.Noty.show('Lỗi tìm kiếm'); });
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
                if (!movie || !movie.slug) {
                    this.activity.loader(false);
                    scroll.append($('<div class="empty__body"><div class="empty__title">Không có dữ liệu</div></div>'));
                    comp.start(); return;
                }
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
                } catch (e) {
                    if (!rendered) { buildDetail(data, episodes, null, null, detectType(data)); rendered = true; }
                }
                comp.activity.loader(false); comp.start();
            }

            function buildDetail(data, episodes, tmdb, logos, ttype) {
                clearScroll(scroll);
                var bk = fullImg(data.thumb_url || data.poster_url);
                var ps = fullImg(data.poster_url || data.thumb_url);
                var t = data.name || '', o = data.origin_name || '', d = cleanDesc(data.content);
                var v = (data.tmdb && data.tmdb.vote_average) ? data.tmdb.vote_average : 'N/A';
                var y = data.year || '', rt = data.time || '', epCur = data.episode_current || '';
                var ghtml = '', castH = '', directorH = '', crewH = '', logoH = '', dir = '';
                var pCats = data.category || [];

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
                    if ((!rt || rt === '') && tmdb.episode_run_time && tmdb.episode_run_time.length) rt = tmdb.episode_run_time[0] + ' phút';
                    var logo = pickLogo(logos || tmdb.images);
                    if (logo && logo.file_path) logoH = '<div class="kk-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '"></div>';
                    if (tmdb.credits) {
                        castH = makePeopleCards((tmdb.credits.cast || []).slice(0, 12), 'character');
                        var crew = tmdb.credits.crew || [], directors = [];
                        if (ttype === 'movie') directors = crew.filter(function (c) { return c.job === 'Director'; });
                        else directors = crew.filter(function (c) { return c.job === 'Creator' || c.job === 'Director' || c.job === 'Series Director'; });
                        directors = directors.filter(function (p, i, arr) { return arr.findIndex(function (x) { return (x.id && x.id === p.id) || x.name === p.name; }) === i; }).slice(0, 10);
                        if (directors.length) {
                            dir = directors.map(function (c) { return c.name; }).join(', ');
                            directorH = makePeopleCards(directors.map(function (c) { return { name: c.name, profile_path: c.profile_path, job: c.job || 'Đạo diễn' }; }), 'job');
                        }
                    }
                }

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
                    if (first) playEp(first); else Lampa.Noty.show('Không tìm thấy tập phim');
                });

                if (hasTmdb) {
                    bindEnter(body.find('.kk-torrent'), function () {
                        openTorrentSearch(getTmdbId(data), ttype, data, episodes, ps);
                    });
                }

                body.find('.kk-genre[data-slug]').each(function () {
                    var g = $(this);
                    bindEnter(g, function () {
                        var slug = g.attr('data-slug'), tg = g.attr('data-title') || 'Thể loại';
                        if (slug) Lampa.Activity.push({ url: '', title: tg, component: 'kkphim_category', mode: 'category', category_slug: slug, page_num: 1 });
                    });
                });

                var detailWrap = $('<div class="kk-detail-wrap"></div>');
                detailWrap.append(hero).append(body);
                if (directorH) detailWrap.append($('<div class="kk-section"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">' + directorH + '</div></div>'));
                if (castH) detailWrap.append($('<div class="kk-section"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">' + castH + '</div></div>'));

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
                    detailWrap.append(ew);
                }

                scroll.append(detailWrap);
                loadSimilar(data, detailWrap);
            }

            function loadSimilar(data, detailWrap) {
                var cats = data.category || [];
                if (!cats.length || !cats[0].slug) { detailWrap.append($('<div class="kk-section kk-section--last"></div>')); return; }
                network.silent(API + 'v1/api/the-loai/' + cats[0].slug + '?page=1', function (res) { handleSimilar(res, detailWrap); }, function () {
                    network.silent(API + 'the-loai/' + cats[0].slug + '?page=1', function (r2) { handleSimilar(r2, detailWrap); }, function () { detailWrap.append($('<div class="kk-section kk-section--last"></div>')); });
                });
            }

            function handleSimilar(res, detailWrap) {
                var list = (res && res.items) ? res.items : (res && res.data && res.data.items) ? res.data.items : [];
                list = list.map(normalizeItem).filter(function (item) { return item && item.slug && item.slug !== movie.slug; }).slice(0, 12);
                if (!list.length) { detailWrap.append($('<div class="kk-section kk-section--last"></div>')); return; }
                var row = $('<div class="kk-section kk-section--last kk-similar"></div>');
                row.append($('<div class="kk-block-title">Phim liên quan</div>'));
                var rl = $('<div class="kk-similar-list"></div>');
                list.forEach(function (item) { rl.append(mkCard(item)); });
                row.append(rl); detailWrap.append(row);
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