(function () {
    'use strict';

    if (window.__kkphim_plugin_started) return;
    window.__kkphim_plugin_started = true;

    var SOURCES = {
        kkphim: { key: 'kkphim', name: 'KKPhim', api: 'https://phimapi.com/', img: 'https://phimimg.com/' },
        ophim: { key: 'ophim', name: 'OPhim', api: 'https://ophim1.com/', img: 'https://img.ophim.live/uploads/movies/' },
        sphim: { key: 'sphim', name: 'SuperPhim', api: 'https://superphim.net/', img: 'https://superphim.net/' },
        phimhay: { key: 'phimhay', name: 'PhimHay247', api: 'https://phimhay247z.org/', img: 'https://phimhay247z.org/' }
    };

    var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_API_KEY = '6979c8ec101ed849f44d197c86582644';
    var TMDB_IMG = 'https://image.tmdb.org/t/p/original';
    var TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var SUBDL_API_KEY = '';
    var SUBDL_API = 'https://api.subdl.com/api/v1/subtitles';
    var SUBDL_CDN = 'https://dl.subdl.com';
    var SETTINGS_KEY = 'kkphim_settings';

    var EXT_PLAYERS = {
        vlc: { name: 'VLC', icon: '🟠', pkg: 'org.videolan.vlc', desc: 'Mọi codec, DTS/TrueHD' },
        mx: { name: 'MX Player', icon: '🔵', pkg: 'com.mxtech.videoplayer.ad', desc: 'HW+ decode, auto sub' },
        mxpro: { name: 'MX Pro', icon: '🔷', pkg: 'com.mxtech.videoplayer.pro', desc: 'HW+, auto sub' },
        justplayer: { name: 'Just Player', icon: '⚫', pkg: 'com.brouken.player', desc: 'mpv-based, auto sub' },
        vimu: { name: 'Vimu', icon: '🟣', pkg: 'com.vimu.player', desc: 'Android TV tối ưu' },
        kodi: { name: 'Kodi', icon: '🔶', pkg: 'org.xbmc.kodi', desc: 'Đa năng' }
    };

    // ===================== SETTINGS =====================
    function loadSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } }
    function saveSettings(o) { try { var c = loadSettings(); Object.keys(o).forEach(function (k) { c[k] = o[k]; }); localStorage.setItem(SETTINGS_KEY, JSON.stringify(c)); } catch (e) {} }
    function getSourceKey() { return loadSettings().source || 'ophim'; }
    function getSource() { return SOURCES[getSourceKey()] || SOURCES.ophim; }
    function SRC_API() { return getSource().api; }
    function SRC_IMG() { return getSource().img; }
    function getTSHost() { return loadSettings().torrserver_host || ''; }
    function getTSPass() { return loadSettings().torrserver_password || ''; }
    function getTioConfig() { return loadSettings().torrentio_config || ''; }
    function getSubMode() { return loadSettings().sub_mode || 'ask'; }
    function getSubdlKey() { return loadSettings().subdl_api_key || SUBDL_API_KEY; }
    function getSelectedPlayer() { return loadSettings().ext_player || 'internal'; }
    function isNguonC() { return false; } // Đã bỏ NguonC

    function fullImg(u) {
        if (!u) return '';
        if (u.indexOf('http') === 0) return u;
        var base = SRC_IMG();
        return base ? base + u : u;
    }

    // ===================== TMDB SEARCH =====================
    var _tmdbSearchCache = {};
    async function searchTmdbByName(name, originName, year, type) {
        if (!name && !originName) return null;
        var cacheKey = (originName || name) + ':' + year + ':' + type;
        if (_tmdbSearchCache[cacheKey] !== undefined) return _tmdbSearchCache[cacheKey];
        var searchName = (originName || name).replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/season\s*\d+/gi, '').replace(/phần\s*\d+/gi, '').trim();
        if (!searchName) return null;
        var mediaType = type === 'tv' ? 'tv' : 'movie';
        try {
            var url, r, d;
            url = 'https://api.themoviedb.org/3/search/' + mediaType + '?api_key=' + TMDB_API_KEY + '&query=' + encodeURIComponent(searchName) + (year ? '&year=' + year : '') + '&language=vi-VN';
            r = await fetch(url); if (r.ok) { d = await r.json(); if (d.results && d.results.length) { _tmdbSearchCache[cacheKey] = d.results[0]; return d.results[0]; } }
            if (year) { url = 'https://api.themoviedb.org/3/search/' + mediaType + '?api_key=' + TMDB_API_KEY + '&query=' + encodeURIComponent(searchName) + '&language=vi-VN'; r = await fetch(url); if (r.ok) { d = await r.json(); if (d.results && d.results.length) { _tmdbSearchCache[cacheKey] = d.results[0]; return d.results[0]; } } }
            if (name && name !== searchName) { url = 'https://api.themoviedb.org/3/search/' + mediaType + '?api_key=' + TMDB_API_KEY + '&query=' + encodeURIComponent(name) + '&language=vi-VN'; r = await fetch(url); if (r.ok) { d = await r.json(); if (d.results && d.results.length) { _tmdbSearchCache[cacheKey] = d.results[0]; return d.results[0]; } } }
            url = 'https://api.themoviedb.org/3/search/multi?api_key=' + TMDB_API_KEY + '&query=' + encodeURIComponent(searchName) + '&language=vi-VN';
            r = await fetch(url); if (r.ok) { d = await r.json(); if (d.results && d.results.length) { var match = d.results.find(function (i) { return i.media_type === mediaType || i.media_type === 'movie' || i.media_type === 'tv'; }); if (match) { _tmdbSearchCache[cacheKey] = match; return match; } } }
        } catch (e) {}
        _tmdbSearchCache[cacheKey] = null;
        return null;
    }

    // ===================== API =====================
    function apiListUrl(catApi, page) { return SRC_API() + catApi + '?page=' + page; }
    function apiDetailUrl(slug) { return SRC_API() + 'phim/' + slug; }
    function apiSearchUrl(kw, page) { return SRC_API() + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page; }
    function apiCatUrl(slug, page) { return SRC_API() + 'v1/api/the-loai/' + slug + '?page=' + page; }
    function universalList(res) { return ((res && res.items) || (res && res.data && res.data.items) || []).map(norm).filter(function (i) { return i && i.slug; }); }
    function universalDetail(res) { return { movie: norm(res.movie || res || {}), episodes: res.episodes || [] }; }

    // ===================== TORRENTIO =====================
    function cleanTioConfig(raw) {
        if (!raw) return ''; raw = String(raw).trim(); if (!raw) return '';
        var m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i); if (m) return m[1];
        m = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i); if (m) return m[1].replace(/\/+$/, '');
        m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i); if (m) return m[1];
        if (raw.indexOf('torrentio.strem.fun') > -1) { raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i, '').replace(/^\/+|\/+$/g, ''); if (raw && raw.indexOf('=') > -1) return raw.replace(/\|/g, '%7C'); return ''; }
        raw = raw.replace(/^\/+|\/+$/g, '').replace(/\|/g, '%7C'); return raw.indexOf('=') === -1 ? '' : raw;
    }

    // ===================== TORRSERVER =====================
    function tsUrl(p) { var h = getTSHost(); if (!h) return ''; h = h.replace(/\/+$/, ''); if (h.indexOf('http') !== 0) h = 'http://' + h; return h + p; }
    function tsHdr() { var h = { 'Content-Type': 'application/json' }; var pw = getTSPass(); if (pw) h['Authorization'] = 'Basic ' + btoa('admin:' + pw); return h; }
    async function tsAdd(mag, title, poster) { var u = tsUrl('/torrents'); if (!u) throw new Error('TS chưa cấu hình'); var r = await fetch(u, { method: 'POST', headers: tsHdr(), body: JSON.stringify({ action: 'add', link: mag, title: title || '', poster: poster || '', save_to_db: false }) }); if (!r.ok) throw new Error('TS:' + r.status); return await r.json(); }
    async function tsGetFiles(hash) { var u = tsUrl('/torrents'); if (!u) throw new Error('TS chưa cấu hình'); var r = await fetch(u, { method: 'POST', headers: tsHdr(), body: JSON.stringify({ action: 'get', hash: hash }) }); if (!r.ok) throw new Error('TS:' + r.status); return await r.json(); }
    function buildMag(h) { var m = 'magnet:?xt=urn:btih:' + h; ['udp://tracker.opentrackr.org:1337/announce', 'udp://open.stealth.si:80/announce', 'udp://tracker.torrent.eu.org:451/announce', 'udp://open.demonii.com:1337/announce', 'udp://exodus.desync.com:6969/announce', 'udp://tracker.openbittorrent.com:6969/announce'].forEach(function (t) { m += '&tr=' + encodeURIComponent(t); }); return m; }

    async function playViaTS(stream, title, poster, fileIdx, movieData, ttype, season, episode) {
        if (!getTSHost()) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
        Lampa.Noty.show('Đang gửi TorrServer...');
        try {
            var td = await tsAdd(buildMag(stream.infoHash), title, poster); var hash = td.hash || stream.infoHash; await delay(2000);
            var info = null, rt = 0; while (rt < 3) { try { info = await tsGetFiles(hash); if (info && info.file_stats && info.file_stats.length) break; } catch (e) {} rt++; await delay(1500); }
            var files = []; if (info && info.file_stats) files = info.file_stats.filter(function (f) { return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/); }).sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
            var playUrl;
            if (!files.length) playUrl = tsUrl('/stream/fname?link=' + hash + '&index=0&play');
            else if (files.length === 1) playUrl = tsUrl('/stream/fname?link=' + hash + '&index=' + (files[0].id || 0) + '&play');
            else if (fileIdx !== undefined && fileIdx !== null && fileIdx >= 0 && fileIdx < files.length) playUrl = tsUrl('/stream/fname?link=' + hash + '&index=' + (files[fileIdx].id || fileIdx) + '&play');
            else {
                Lampa.Select.show({ title: '📁 File (' + files.length + ')', items: files.map(function (f, i) { var n = (f.path || ('File ' + i)).split('/').pop(); var s = f.length ? (f.length / 1048576).toFixed(0) + 'MB' : ''; return { title: n + (s ? ' (' + s + ')' : ''), value: f }; }),
                    onSelect: async function (a) { await playUrlWithSub(tsUrl('/stream/fname?link=' + hash + '&index=' + a.value.id + '&play'), title + ' - ' + (a.value.path || '').split('/').pop(), movieData, ttype, season, episode); },
                    onBack: function () { Lampa.Controller.toggle('content'); } });
                return;
            }
            await playUrlWithSub(playUrl, title, movieData, ttype, season, episode);
        } catch (e) { Lampa.Noty.show('Lỗi TS: ' + (e.message || '')); }
    }

    // ===================== SUBTITLE =====================
    var _subCache = {};
    function srtToVtt(srt) { return 'WEBVTT\n\n' + srt.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2'); }

    async function loadJSZip() {
        if (window.JSZip) return;
        await new Promise(function (ok, fail) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
    }

    async function extractSubText(sub) {
        try {
            if (sub.isZip) {
                await loadJSZip();
                var r = await fetch(sub.url); var buf = await r.arrayBuffer();
                var zip = await JSZip.loadAsync(buf); var srtFile = null;
                zip.forEach(function (path, entry) { if (!srtFile && !entry.dir && path.match(/\.(srt|vtt|ass|ssa|sub)$/i)) srtFile = entry; });
                if (srtFile) return await srtFile.async('text');
                return null;
            } else {
                var r2 = await fetch(sub.url); return await r2.text();
            }
        } catch (e) { return null; }
    }

    async function resolveSubForInternal(sub) {
        if (!sub || !sub.url) return '';
        try {
            var text = await extractSubText(sub);
            if (!text) return sub.url;
            if (text.indexOf('WEBVTT') === -1) text = srtToVtt(text);
            return URL.createObjectURL(new Blob([text], { type: 'text/vtt;charset=utf-8' }));
        } catch (e) { return sub.url; }
    }

    async function searchSubs(imdbId, tmdbId, type, season, episode, title) {
        var ck = (imdbId || tmdbId || title || '') + ':' + (season || 0) + ':' + (episode || 0);
        if (_subCache[ck]) return _subCache[ck];
        var apiKey = getSubdlKey();
        try {
            var p = [];
            if (apiKey) p.push('api_key=' + apiKey);
            if (imdbId) p.push('imdb_id=' + imdbId);
            else if (tmdbId) p.push('tmdb_id=' + tmdbId);
            else if (title) p.push('film_name=' + encodeURIComponent(title));
            else { _subCache[ck] = []; return []; }
            if (type === 'tv' && season && episode) { p.push('season_number=' + season); p.push('episode_number=' + episode); }
            p.push('languages=vi,en,zh,ja,ko');
            p.push('subs_per_page=100');
            p.push('type=' + (type === 'tv' ? 'tv' : 'movie'));
            var r = await fetch(SUBDL_API + '?' + p.join('&'));
            if (!r.ok) { _subCache[ck] = []; return []; }
            var d = await r.json();
            if (d.status && d.subtitles && d.subtitles.length) {
                var lm = { vi: '🇻🇳 Tiếng Việt', vietnamese: '🇻🇳 Tiếng Việt', en: '🇬🇧 English', english: '🇬🇧 English', zh: '🇨🇳 中文', ja: '🇯🇵 日本語', ko: '🇰🇷 한국어' };
                var results = d.subtitles.map(function (s) {
                    var lang = (s.language || s.lang || '').toLowerCase();
                    var label = lm[lang] || lang.toUpperCase();
                    if (s.release_name) label += ' · ' + s.release_name;
                    if (s.author) label += ' (' + s.author + ')';
                    return { label: label, url: SUBDL_CDN + s.url, language: lang, isZip: (s.url || '').endsWith('.zip'), release_name: s.release_name || '' };
                });
                results.sort(function (a, b) {
                    var order = { vi: 0, vietnamese: 0, en: 1, english: 1 };
                    return (order[a.language] !== undefined ? order[a.language] : 2) - (order[b.language] !== undefined ? order[b.language] : 2);
                });
                _subCache[ck] = results; return results;
            }
        } catch (e) {}
        _subCache[ck] = []; return [];
    }

    // ===================== SUBTITLE OVERLAY =====================
    function parseCues(text) {
        var cues = [];
        try {
            var content = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            if (content.indexOf('WEBVTT') === -1) content = 'WEBVTT\n\n' + content.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
            var blocks = content.split(/\n\n+/);
            blocks.forEach(function (block) {
                var lines = block.trim().split('\n'); if (!lines.length) return;
                var timeIdx = -1;
                for (var i = 0; i < lines.length; i++) { if (lines[i].indexOf('-->') !== -1) { timeIdx = i; break; } }
                if (timeIdx === -1) return;
                var timeParts = lines[timeIdx].split('-->'); if (timeParts.length < 2) return;
                var start = parseTime(timeParts[0].trim()); var end = parseTime(timeParts[1].trim().split(' ')[0]);
                var textLines = lines.slice(timeIdx + 1).join('\n').replace(/<[^>]+>/g, '').trim();
                if (textLines && start >= 0 && end > start) cues.push({ start: start, end: end, text: textLines });
            });
        } catch (e) {}
        return cues;
    }

    function parseTime(str) {
        try {
            str = str.trim(); var parts = str.split(':');
            if (parts.length === 3) return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
            if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
        } catch (e) {}
        return -1;
    }

    var _overlayActive = false, _overlayInterval = null, _overlayCues = [], _overlayVideo = null;

    function startSubOverlay(cues, videoEl) {
        stopSubOverlay(); if (!cues || !cues.length) return;
        _overlayCues = cues; _overlayActive = true;
        var overlay = document.getElementById('kk-sub-overlay');
        if (!overlay) { overlay = document.createElement('div'); overlay.id = 'kk-sub-overlay'; overlay.style.cssText = 'position:fixed;bottom:10%;left:50%;transform:translateX(-50%);z-index:99999;text-align:center;pointer-events:none;max-width:90%;width:auto'; document.body.appendChild(overlay); }
        overlay.style.display = 'block';
        _overlayVideo = videoEl || document.querySelector('video');
        _overlayInterval = setInterval(function () {
            if (!_overlayActive) { clearInterval(_overlayInterval); return; }
            var video = _overlayVideo || document.querySelector('video'); if (!video) return;
            var ct = video.currentTime, cur = null;
            for (var i = 0; i < _overlayCues.length; i++) { if (ct >= _overlayCues[i].start && ct <= _overlayCues[i].end) { cur = _overlayCues[i]; break; } }
            var el = document.getElementById('kk-sub-overlay'); if (!el) return;
            if (cur) el.innerHTML = '<div style="display:inline-block;background:rgba(0,0,0,0.82);color:#fff;font-size:1.4em;font-weight:600;line-height:1.5;padding:0.3em 0.8em;border-radius:0.4em;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:pre-line;max-width:100%;word-break:break-word">' + esc(cur.text) + '</div>';
            else el.innerHTML = '';
        }, 100);
    }

    function stopSubOverlay() {
        _overlayActive = false;
        if (_overlayInterval) { clearInterval(_overlayInterval); _overlayInterval = null; }
        var el = document.getElementById('kk-sub-overlay');
        if (el) { el.innerHTML = ''; el.style.display = 'none'; }
        _overlayCues = [];
    }

    // ===================== PLAYER =====================
    function playInternal(videoUrl, title, subUrl, subLabel) {
        stopSubOverlay();
        Lampa.Player.play({ title: title, url: videoUrl });
        if (!subUrl) return;
        var attempts = 0;
        var injectSub = setInterval(function () {
            attempts++; if (attempts > 40) { clearInterval(injectSub); return; }
            var video = document.querySelector('video'); if (!video || !video.src) return;
            clearInterval(injectSub);
            Array.from(video.querySelectorAll('track[data-kkphim]')).forEach(function (t) { t.remove(); });
            var track = document.createElement('track');
            track.kind = 'subtitles'; track.label = subLabel || 'Subtitle'; track.srclang = 'vi';
            track.src = subUrl; track.setAttribute('data-kkphim', '1'); track.default = true;
            video.appendChild(track);
            track.addEventListener('load', function () { try { for (var i = 0; i < video.textTracks.length; i++) video.textTracks[i].mode = video.textTracks[i].label === (subLabel || 'Subtitle') ? 'showing' : 'disabled'; } catch (e) {} });
            setTimeout(function () { try { for (var i = 0; i < video.textTracks.length; i++) if (video.textTracks[i].label === (subLabel || 'Subtitle')) video.textTracks[i].mode = 'showing'; } catch (e) {} }, 800);
            Lampa.Noty.show('📝 ' + (subLabel || 'Subtitle'));
        }, 500);
    }

    async function playWithOverlaySub(videoUrl, title, subObj) {
        stopSubOverlay();
        var subText = null;
        if (subObj) { try { subText = await extractSubText(subObj); } catch (e) {} }
        var cues = subText ? parseCues(subText) : [];
        Lampa.Player.play({ title: title, url: videoUrl });
        if (cues.length) {
            var attempts = 0;
            var waitVideo = setInterval(function () {
                attempts++; if (attempts > 40) { clearInterval(waitVideo); return; }
                var video = document.querySelector('video'); if (!video || !video.src) return;
                clearInterval(waitVideo);
                try { for (var i = 0; i < video.textTracks.length; i++) video.textTracks[i].mode = 'disabled'; } catch (e) {}
                startSubOverlay(cues, video);
                Lampa.Noty.show('📝 ' + (subObj.label || 'Subtitle') + ' (overlay)');
                video.addEventListener('ended', stopSubOverlay);
            }, 500);
        } else { Lampa.Noty.show('⚠️ Không đọc được phụ đề'); }
    }

    function playExternal(playerKey, videoUrl, title) {
        var player = EXT_PLAYERS[playerKey]; if (!player) { Lampa.Player.play({ title: title, url: videoUrl }); return; }
        try { if (window.AndroidJS && window.AndroidJS.openIntent) { window.AndroidJS.openIntent(JSON.stringify({ action: 'android.intent.action.VIEW', data: videoUrl, type: 'video/*', package: player.pkg, extras: { title: title || '' } })); Lampa.Noty.show('Đang mở ' + player.name + '...'); return; } } catch (e) {}
        try { if (window.AndroidJS && window.AndroidJS.openPlayer) { window.AndroidJS.openPlayer(videoUrl, 'video/*', player.pkg); Lampa.Noty.show('Đang mở ' + player.name + '...'); return; } } catch (e) {}
        try { if (Lampa.Android && Lampa.Android.openPlayer) { Lampa.Android.openPlayer(videoUrl, 'video/*', player.pkg); Lampa.Noty.show('Đang mở ' + player.name + '...'); return; } } catch (e) {}
        copyToClipboard(videoUrl); Lampa.Noty.show('Đã copy link → mở ' + player.name + ' thủ công');
    }

    function copyToClipboard(text) {
        try { if (navigator.clipboard) { navigator.clipboard.writeText(text); return true; } var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); return true; } catch (e) { return false; }
    }

    // ===================== TMDB INFO COPY (Menu tên chuẩn để search sub) =====================
    function showTmdbInfo(data, tmdbData) {
        var title = '';
        var year = '';

        if (tmdbData) {
            title = tmdbData.title || tmdbData.name || tmdbData.original_title || tmdbData.original_name || '';
            if (tmdbData.release_date) year = tmdbData.release_date.slice(0, 4);
            else if (tmdbData.first_air_date) year = tmdbData.first_air_date.slice(0, 4);
        }

        if (!title) {
            title = data.origin_name || data.name || '';
            year = data.year || '';
        }

        var searchQuery = title + (year ? ' ' + year : '');
        var items = [
            { title: '📋 Copy: ' + searchQuery, value: searchQuery },
            { title: '📋 Copy tên gốc: ' + (title || ''), value: title },
        ];

        if (year) items.push({ title: '📋 Copy tên + năm: ' + title + ' (' + year + ')', value: title + ' (' + year + ')' });
        if (data.name && data.name !== title) items.push({ title: '📋 Copy tên Việt: ' + data.name, value: data.name });

        Lampa.Select.show({
            title: '🔍 Tìm sub trên MX/SubDL',
            items: items,
            onSelect: function (a) {
                copyToClipboard(a.value);
                Lampa.Noty.show('✅ Đã copy: ' + a.value + '\n→ Paste vào MX Player để tìm sub!');
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    // ===================== PLAYER MENU =====================
    async function showPlayerMenu(videoUrl, title, subObj, tmdbInfo, movieData) {
        var items = [];
        var subFlag = subObj ? ((subObj.language === 'vi' || subObj.language === 'vietnamese') ? ' 🇻🇳' : ' 🇬🇧') : '';

        items.push({ title: '📱 Lampa + 📝 Sub overlay' + subFlag, value: 'internal_sub' });

        // External players
        Object.keys(EXT_PLAYERS).forEach(function (k) {
            var p = EXT_PLAYERS[k];
            items.push({ title: p.icon + ' ' + p.name, value: 'ext_' + k });
        });

        // Tìm sub trên MX Player (copy tên TMDB chuẩn)
        items.push({ title: '🔍 Copy tên chuẩn để tìm sub (MX/SubDL)', value: 'copy_tmdb_name' });

        items.push({ title: '📱 Lampa (không sub)', value: 'internal_nosub' });
        items.push({ title: '📋 Copy link video', value: 'copy_video' });
        if (subObj) {
            items.push({ title: '📋 Copy link sub', value: 'copy_sub' });
            items.push({ title: '📋 Copy cả hai', value: 'copy_both' });
        }

        Lampa.Select.show({
            title: '🎬 Chọn cách phát' + subFlag,
            items: items,
            onSelect: async function (a) {
                if (a.value === 'internal_sub') {
                    if (subObj) await playWithOverlaySub(videoUrl, title, subObj);
                    else Lampa.Player.play({ title: title, url: videoUrl });

                } else if (a.value.indexOf('ext_') === 0) {
                    stopSubOverlay();
                    playExternal(a.value.replace('ext_', ''), videoUrl, title);

                } else if (a.value === 'copy_tmdb_name') {
                    // Hiện menu copy tên TMDB chuẩn
                    showTmdbInfo(movieData || {}, tmdbInfo);

                } else if (a.value === 'internal_nosub') {
                    stopSubOverlay(); Lampa.Player.play({ title: title, url: videoUrl });

                } else if (a.value === 'copy_video') {
                    copyToClipboard(videoUrl); Lampa.Noty.show('✅ Đã copy link video');

                } else if (a.value === 'copy_sub' && subObj) {
                    copyToClipboard(subObj.url); Lampa.Noty.show('✅ Đã copy link sub');

                } else if (a.value === 'copy_both' && subObj) {
                    copyToClipboard('Video: ' + videoUrl + '\nSub: ' + subObj.url);
                    Lampa.Noty.show('✅ Đã copy cả hai');
                }
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    // Cache tmdb info cho từng phim để dùng trong menu
    var _currentTmdbData = null;
    var _currentMovieData = null;

    async function playUrlWithSub(videoUrl, title, movieData, ttype, season, episode) {
        var mode = getSubMode();
        var playerKey = getSelectedPlayer();

        if (mode === 'off') {
            stopSubOverlay();
            if (playerKey === 'internal' || playerKey === 'ask') Lampa.Player.play({ title: title, url: videoUrl });
            else playExternal(playerKey, videoUrl, title);
            return;
        }

        var tmdbId = movieData ? getTmdbId(movieData) : null, imdbId = null;
        if (!tmdbId && movieData) {
            var tmdbResult = await searchTmdbByName(movieData.name, movieData.origin_name, movieData.year, ttype || detectType(movieData));
            if (tmdbResult) { tmdbId = tmdbResult.id; if (!movieData.tmdb) movieData.tmdb = {}; movieData.tmdb.id = tmdbId; }
        }
        if (tmdbId) { try { imdbId = await getImdbId(ttype || 'movie', tmdbId); } catch (e) {} }

        var subs = [];
        try { subs = await searchSubs(imdbId, tmdbId, ttype, season, episode, movieData ? (movieData.origin_name || movieData.name || '') : ''); } catch (e) {}

        var bestSub = subs.find(function (s) { return s.language === 'vi' || s.language === 'vietnamese'; }) || subs.find(function (s) { return s.language === 'en' || s.language === 'english'; }) || subs[0] || null;

        if (mode === 'auto') {
            if (playerKey === 'internal') {
                if (bestSub) { Lampa.Noty.show('Tải phụ đề...'); var subUrl = await resolveSubForInternal(bestSub); stopSubOverlay(); playInternal(videoUrl, title, subUrl, bestSub.label); }
                else { stopSubOverlay(); Lampa.Player.play({ title: title, url: videoUrl }); }
            } else if (playerKey === 'ask') {
                await showPlayerMenu(videoUrl, title, bestSub, _currentTmdbData, movieData);
            } else {
                if (bestSub) { Lampa.Noty.show('Tải phụ đề...'); await playWithOverlaySub(videoUrl, title, bestSub); }
                else { stopSubOverlay(); playExternal(playerKey, videoUrl, title); }
            }
            return;
        }

        // mode = ask: hỏi sub
        if (!subs.length) {
            if (playerKey === 'ask') {
                await showPlayerMenu(videoUrl, title, null, _currentTmdbData, movieData);
            } else {
                stopSubOverlay();
                if (playerKey === 'internal') Lampa.Player.play({ title: title, url: videoUrl });
                else playExternal(playerKey, videoUrl, title);
            }
            return;
        }

        Lampa.Select.show({
            title: '📝 Phụ đề (' + subs.length + ')',
            items: [{ title: '❌ Không dùng sub', value: null }].concat(subs.slice(0, 30).map(function (s) { return { title: s.label, value: s }; })),
            onSelect: async function (a) {
                if (!a.value) {
                    if (playerKey === 'ask') { await showPlayerMenu(videoUrl, title, null, _currentTmdbData, movieData); return; }
                    stopSubOverlay();
                    if (playerKey === 'internal') Lampa.Player.play({ title: title, url: videoUrl });
                    else playExternal(playerKey, videoUrl, title);
                    return;
                }
                if (playerKey === 'internal') {
                    Lampa.Noty.show('Tải phụ đề...'); var su = await resolveSubForInternal(a.value);
                    stopSubOverlay(); playInternal(videoUrl, title, su, a.value.label);
                } else if (playerKey === 'ask') {
                    await showPlayerMenu(videoUrl, title, a.value, _currentTmdbData, movieData);
                } else {
                    Lampa.Noty.show('Tải phụ đề...'); await playWithOverlaySub(videoUrl, title, a.value);
                }
            },
            onBack: function () {
                if (playerKey === 'ask') { showPlayerMenu(videoUrl, title, bestSub, _currentTmdbData, movieData); return; }
                stopSubOverlay();
                if (playerKey === 'internal') Lampa.Player.play({ title: title, url: videoUrl });
                else playExternal(playerKey, videoUrl, title);
            }
        });
    }

    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    // ===================== TMDB =====================
    async function tmdbFetch(path) { var r = await fetch('https://api.themoviedb.org/3' + path, { headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN, 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error('TMDB ' + r.status); return await r.json(); }
    async function getImdbId(type, id) { if (!id) return null; try { return (await tmdbFetch('/' + type + '/' + id + '/external_ids')).imdb_id || null; } catch (e) { return null; } }
    async function getTmdbSeasons(id) { try { var r = await tmdbFetch('/tv/' + id + '?language=vi-VN'); if (r && r.seasons) return r.seasons.filter(function (s) { return s.season_number > 0; }).map(function (s) { return { season_number: s.season_number, name: s.name || ('Season ' + s.season_number), episode_count: s.episode_count || 0 }; }); } catch (e) {} return []; }

    // ===================== TORRENTIO =====================
    function tioUrl(type, imdbId, s, e) { var t = type === 'tv' ? 'series' : 'movie', id = imdbId; if (type === 'tv' && s && e) id = imdbId + ':' + s + ':' + e; var c = cleanTioConfig(getTioConfig()); return TORRENTIO_BASE + (c ? '/' + c : '') + '/stream/' + t + '/' + id + '.json'; }
    async function fetchTio(type, imdbId, s, e) { var r = await fetch(tioUrl(type, imdbId, s, e)); if (!r.ok) throw new Error('Tio ' + r.status); var d = await r.json(); return (d.streams || []).map(function (s) { var lines = (s.title || '').split('\n'), name = lines[0] || '?', info = lines.slice(1).join(' | '); var sm = info.match(/💾\s*([\d.]+\s*[GMKT]B)/i) || info.match(/([\d.]+\s*[GMKT]B)/i), sd = info.match(/👤\s*(\d+)/); return { name: name, title: s.title || '', infoHash: s.infoHash || '', fileIdx: s.fileIdx, url: s.url || '', size: sm ? sm[1] : '', seeds: sd ? sd[1] : '', rawName: s.name || '' }; }); }
    function showTioResults(streams, title, poster, movieData, ttype, season, episode) { var ts = !!getTSHost(); Lampa.Select.show({ title: '🧲 ' + title + ' (' + streams.length + ')' + (ts ? ' → TS' : ''), items: streams.slice(0, 40).map(function (s) { var l = s.name; if (s.size) l += ' | ' + s.size; if (s.seeds) l += ' | 👤' + s.seeds; if (s.rawName) l += ' [' + s.rawName + ']'; return { title: l, value: s }; }), onSelect: function (a) { var s = a.value; if (ts && s.infoHash) playViaTS(s, title, poster, s.fileIdx, movieData, ttype, season, episode); else if (s.url) playUrlWithSub(s.url, title, movieData, ttype, season, episode); else Lampa.Noty.show(s.infoHash ? 'Chưa cấu hình TS!' : 'Không có link'); }, onBack: function () { Lampa.Controller.toggle('content'); } }); }
    async function openTorrentSearch(tmdbId, ttype, data, episodes, poster) { if (!tmdbId && data) { Lampa.Noty.show('Tìm TMDB...'); var tr = await searchTmdbByName(data.name, data.origin_name, data.year, ttype); if (tr) { tmdbId = tr.id; if (!data.tmdb) data.tmdb = {}; data.tmdb.id = tmdbId; } } if (!tmdbId) { Lampa.Noty.show('Không tìm thấy trên TMDB'); return; } if (ttype === 'tv') { tvTorrentPicker(tmdbId, data, episodes, poster); return; } Lampa.Noty.show('Tìm torrent...'); try { var imdb = await getImdbId(ttype, tmdbId); if (!imdb) { Lampa.Noty.show('Không tìm IMDB ID'); return; } var streams = await fetchTio(ttype, imdb); if (!streams.length) { Lampa.Noty.show('Không có torrent'); return; } showTioResults(streams, data.name || '', poster, data, ttype, null, null); } catch (e) { Lampa.Noty.show('Lỗi: ' + (e.message || '')); } }
    async function tvTorrentPicker(tmdbId, data, episodes, poster) { Lampa.Noty.show('Tải seasons...'); var seasons = await getTmdbSeasons(tmdbId); var imdb = await getImdbId('tv', tmdbId); if (!imdb) imdb = await getImdbId('movie', tmdbId); if (!imdb) { Lampa.Noty.show('Không tìm IMDB ID'); return; } if (seasons.length > 1) pickSeason(seasons, imdb, data, poster); else if (seasons.length === 1) pickEpFrom(seasons[0], imdb, data, poster); else pickEpFB(imdb, data, episodes, poster); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function pickSeason(seasons, imdb, data, poster) { Lampa.Select.show({ title: '📺 Season', items: seasons.map(function (s) { return { title: s.name + (s.episode_count ? ' (' + s.episode_count + ' tập)' : ''), value: s }; }), onSelect: function (a) { if (a.value.episode_count > 0) pickEpFrom(a.value, imdb, data, poster); else promptEp(a.value.season_number, imdb, data, poster); }, onBack: function () { Lampa.Controller.toggle('content'); } }); }
    function pickEpFrom(season, imdb, data, poster) { var items = []; for (var i = 1; i <= season.episode_count; i++) items.push({ title: 'S' + pad(season.season_number) + 'E' + pad(i), value: { s: season.season_number, e: i } }); Lampa.Select.show({ title: '📺 ' + season.name, items: items, onSelect: function (a) { doTvSearch(imdb, data, a.value.s, a.value.e, poster); }, onBack: function () { Lampa.Controller.toggle('content'); } }); }
    function pickEpFB(imdb, data, episodes, poster) { var eps = []; if (episodes) episodes.forEach(function (sv) { (sv.server_data || []).forEach(function (ep) { var n = parseInt((ep.name || '').replace(/[^\d]/g, '')) || 0; if (n > 0 && eps.indexOf(n) === -1) eps.push(n); }); }); eps.sort(function (a, b) { return a - b; }); if (!eps.length) { promptEp(1, imdb, data, poster); return; } Lampa.Select.show({ title: '📺 Chọn tập', items: eps.map(function (n) { return { title: 'S01E' + pad(n), value: { s: 1, e: n } }; }), onSelect: function (a) { doTvSearch(imdb, data, a.value.s, a.value.e, poster); }, onBack: function () { Lampa.Controller.toggle('content'); } }); }
    function promptEp(ds, imdb, data, poster) { try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: 'Season:Episode', value: ds + ':1', free: true }, function (v) { var p = String(v || ds + ':1').split(':'); doTvSearch(imdb, data, parseInt(p[0]) || ds, parseInt(p[1]) || 1, poster); }); return; } } catch (e) {} var v = window.prompt('Season:Episode', ds + ':1'), p = String(v || ds + ':1').split(':'); doTvSearch(imdb, data, parseInt(p[0]) || ds, parseInt(p[1]) || 1, poster); }
    async function doTvSearch(imdb, data, s, e, poster) { var label = (data.name || '') + ' S' + pad(s) + 'E' + pad(e); Lampa.Noty.show('Tìm ' + label + '...'); try { var streams = await fetchTio('tv', imdb, s, e); if (!streams.length) { Lampa.Noty.show('Không có torrent'); return; } showTioResults(streams, label, poster, data, 'tv', s, e); } catch (err) { Lampa.Noty.show('Lỗi: ' + (err.message || '')); } }

    // ===================== HELPERS =====================
    function detectType(d) { if (d && d.tmdb && d.tmdb.type === 'tv') return 'tv'; if (d && d.tmdb && d.tmdb.type === 'movie') return 'movie'; if (d && (d.type === 'series' || d.type === 'tvshows' || d.type === 'hoathinh')) return 'tv'; if (d && d.episode_total && d.episode_total !== '1') return 'tv'; return 'movie'; }
    function getTmdbId(d) { return (d && d.tmdb && d.tmdb.id) ? d.tmdb.id : null; }
    function pickLogo(imgs) { if (!imgs || !imgs.logos || !imgs.logos.length) return null; return imgs.logos.find(function (l) { return l.iso_639_1 === 'vi'; }) || imgs.logos.find(function (l) { return l.iso_639_1 === 'en'; }) || imgs.logos[0] || null; }
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function cleanDesc(s) { return String(s || '').replace(/<[^>]+>/g, '').trim() || 'Không có mô tả'; }
    function fmtTxt(s) { return esc(s || '').replace(/\n/g, '<br>'); }
    function norm(i) { if (!i) return null; return { name: i.name || i.title || '', origin_name: i.origin_name || '', slug: i.slug || '', poster_url: i.poster_url || i.poster || '', thumb_url: i.thumb_url || i.thumb || '', year: i.year || '', quality: i.quality || '', episode_current: i.episode_current || '', tmdb: i.tmdb || {}, category: Array.isArray(i.category) ? i.category : [], director: i.director || '', content: i.content || '', time: i.time || '', episode_total: i.episode_total || '', type: i.type || '' }; }
    function getFirstEp(eps) { for (var i = 0; i < (eps || []).length; i++) if (eps[i] && eps[i].server_data && eps[i].server_data.length) return eps[i].server_data[0]; return null; }

    function bindEnter(el, fn) {
        var sx = 0, sy = 0, moved = false, touched = false;
        el.on('touchstart', function (e) { var t = ((e.originalEvent || e).touches || [])[0]; if (t) { sx = t.clientX; sy = t.clientY; moved = false; } });
        el.on('touchmove', function (e) { var t = ((e.originalEvent || e).touches || [])[0]; if (t && (Math.abs(t.clientX - sx) > 16 || Math.abs(t.clientY - sy) > 16)) moved = true; });
        el.on('touchend', function (e) { if (moved) return; touched = true; e.preventDefault(); e.stopPropagation(); setTimeout(function () { fn.call(el[0], e); }, 100); setTimeout(function () { touched = false; }, 350); });
        el.on('click', function (e) { if (touched || moved) return; e.preventDefault(); e.stopPropagation(); fn.call(this, e); });
        el.on('hover:enter', function (e) { fn.call(this, e); });
    }

    function openSearch() { function go(kw) { kw = String(kw || '').trim(); if (kw) Lampa.Activity.push({ url: '', title: 'Tìm', component: 'kkphim_search', keyword: kw, page_num: 1 }); } try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: 'Tìm phim', value: '', free: true }, go); return; } } catch (e) {} go(window.prompt('Tìm phim:')); }
    function enableScroll(scroll) { var el = scroll.render(); el.css({ overflow: 'hidden', position: 'relative', height: '100%' }); var b = el.find('.scroll__body'), p = { transform: 'none', 'overflow-y': 'auto', 'overflow-x': 'hidden', '-webkit-overflow-scrolling': 'touch', height: '100%', 'padding-bottom': '8em', 'touch-action': 'pan-y' }; b.css($.extend({ position: 'relative' }, p)); if (b[0]) Object.keys(p).forEach(function (k) { b[0].style.setProperty(k, p[k], 'important'); }); }
    function clearScroll(s) { try { s.render().find('.scroll__body').empty(); } catch (e) {} }
    function applyCtrl(scroll) { Lampa.Controller.add('content', { toggle: function () { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); }, right: function () { Navigator.move('right'); }, up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); }, down: function () { Navigator.move('down'); }, back: function () { Lampa.Activity.backward(); } }); setTimeout(function () { Lampa.Controller.toggle('content'); Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, 0); }
    function mkPeople(list, key) { return (list || []).map(function (p) { var av = p.profile_path ? '<img src="' + TMDB_IMG_W500 + p.profile_path + '">' : '<div class="kk-cast-empty"></div>'; return '<div class="kk-cast-card"><div class="kk-cast-img">' + av + '</div><div class="kk-cast-name">' + esc(p.name || '') + '</div><div class="kk-cast-role">' + esc(p[key] || '') + '</div></div>'; }).join(''); }
    function mkCard(item) { var normalized = norm(item); if (!normalized) return $('<div></div>'); var p = fullImg(normalized.poster_url || normalized.thumb_url); var c = $('<div class="kk-card selector"><div class="kk-card-img"><img src="' + p + '">' + (normalized.quality ? '<div class="kk-card-q">' + esc(normalized.quality) + '</div>' : '') + (normalized.episode_current ? '<div class="kk-card-ep">' + esc(normalized.episode_current) + '</div>' : '') + '</div><div class="kk-card-name">' + esc(normalized.name) + '</div><div class="kk-card-year">' + esc(normalized.year) + '</div></div>'); bindEnter(c, function () { if (!normalized.slug) return; Lampa.Activity.push({ url: '', title: normalized.name || '', component: 'kkphim_detail', movie: normalized, page: 1 }); }); return c; }

    // ===================== CSS =====================
    function injectCSS() {
        if ($('#kk-css').length) return;
        $('head').append('<style id="kk-css">.kk-topbar{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:.8em;gap:1em;z-index:5}.kk-topbar-title{font-size:2em;font-weight:900;color:#fff;flex:1}.kk-topbar-btns{display:flex;gap:.5em}.kk-btn{display:inline-flex;align-items:center;gap:.45em;padding:.8em 1.1em;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.10);color:#fff;font-size:.98em;font-weight:800;cursor:pointer}.kk-btn.focus{background:#fff;color:#000}.kk-srcbar{display:flex;gap:.5em;padding:0 1.5em .7em;flex-wrap:wrap}.kk-srcbtn{padding:.6em 1em;border-radius:.75em;font-size:.95em;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.1)}.kk-srcbtn--on{background:rgba(99,102,241,.25);border-color:rgba(99,102,241,.5);color:#c4b5fd}.kk-srcbtn--off{background:rgba(255,255,255,.06);color:rgba(255,255,255,.45)}.kk-srcbtn.focus{background:rgba(99,102,241,.4);color:#fff}.kk-tsbar{padding:0 1.5em .5em}.kk-tsbadge{display:inline-flex;align-items:center;gap:.4em;padding:.45em .85em;border-radius:.65em;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.15);font-size:.88em;color:#4ade80;font-weight:700}.kk-row{margin-bottom:1.9em}.kk-row-head{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:.85em}.kk-row-title{font-size:1.55em;font-weight:900;color:#fff}.kk-row-more{font-size:.98em;font-weight:800;padding:.7em 1.1em;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}.kk-row-more.focus{background:#fff;color:#000}.kk-row-list{display:flex;gap:.9em;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .2em;-webkit-overflow-scrolling:touch}.kk-row-list::-webkit-scrollbar,.kk-cast-list::-webkit-scrollbar,.kk-similar-list::-webkit-scrollbar{display:none}.kk-card{flex:0 0 auto;width:9.5em;cursor:pointer}.kk-card--grid{width:100%}.kk-card-img{position:relative;width:100%;aspect-ratio:2/3;border-radius:.9em;overflow:hidden;background:#242424}.kk-card-img img{width:100%;height:100%;object-fit:cover}.kk-card-q{position:absolute;top:.5em;left:.5em;padding:.2em .5em;border-radius:.4em;font-size:.7em;font-weight:800;background:#f6c344;color:#000}.kk-card-ep{position:absolute;top:.5em;right:.5em;padding:.2em .5em;border-radius:.4em;font-size:.7em;font-weight:800;background:#e53935;color:#fff}.kk-card-name{margin-top:.6em;font-size:1em;line-height:1.3;font-weight:700;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.kk-card-year{margin-top:.18em;font-size:.88em;color:rgba(255,255,255,.5)}.kk-grid-wrap{padding:0 1.5em}.kk-grid-title{font-size:1.9em;font-weight:900;color:#fff;margin:0 0 .85em}.kk-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.9em}.kk-loadmore{margin-top:1.1em;text-align:center;padding:.9em;border-radius:.9em;background:rgba(255,255,255,.08);color:#fff;font-size:1em;font-weight:800;cursor:pointer}.kk-loadmore.focus{background:#ff2332}.kk-detail-wrap{background:#141414;border-radius:1.4em;overflow:hidden;margin:0 0 1em}.kk-hero{position:relative;overflow:hidden;background:#111}.kk-hero-bg{position:relative;height:25em}.kk-hero-bg img{width:100%;height:100%;object-fit:cover}.kk-hero-mask{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.16) 24%,rgba(0,0,0,.36) 52%,rgba(14,14,14,.78) 78%,rgba(14,14,14,1))}.kk-hero-bottom{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:1.4em 1.5em 1.2em}.kk-hero-flex{display:block}.kk-hero-poster{display:none}.kk-hero-info{min-width:0}.kk-logo{max-width:34em;margin:0 0 1em}.kk-logo img{max-width:100%;max-height:10em;object-fit:contain;filter:drop-shadow(0 .4em 1.1em rgba(0,0,0,.45))}.kk-title{font-size:2.5em;line-height:1.05;font-weight:900;color:#fff;margin-bottom:.2em}.kk-origin{font-size:1.15em;line-height:1.45;color:rgba(255,255,255,.82)}.kk-body{position:relative;z-index:3;padding:1.4em 1.5em 0;background:#141414}.kk-metas{display:flex;flex-wrap:wrap;gap:.65em;margin:0 0 1.1em}.kk-meta{padding:.55em .95em;border-radius:.8em;background:rgba(255,255,255,.08);color:#fff;font-size:1.1em;font-weight:800}.kk-genres{display:flex;flex-wrap:wrap;gap:.65em;margin:0 0 1.1em}.kk-genre{padding:.55em .95em;border-radius:.8em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.95);font-size:1.02em;font-weight:700;cursor:pointer}.kk-genre.focus{background:rgba(255,255,255,.18)}.kk-crew{margin:0 0 1.1em}.kk-crew b{font-size:1.2em;font-weight:900;color:#fff;display:block;margin-bottom:.2em}.kk-crew span{font-size:1.08em;color:rgba(255,255,255,.88)}.kk-desc{font-size:1.2em;line-height:1.75;color:rgba(255,255,255,.93);margin:0 0 1.3em}.kk-actions{display:flex;flex-wrap:wrap;gap:.7em;padding:.1em 0 .2em}.kk-act-wrap{width:100%}.kk-act{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:.95em;border-radius:.95em;font-size:1.15em;font-weight:900;cursor:pointer}.kk-act--play{background:#ff1730;color:#fff}.kk-act--play.focus{background:#ff3047}.kk-act--torrent{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}.kk-act--torrent.focus{background:linear-gradient(135deg,#818cf8,#a78bfa)}.kk-act--sub{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#fff}.kk-act--sub.focus{background:rgba(255,255,255,.18)}.kk-act--info{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#fff}.kk-act--info.focus{background:rgba(255,255,255,.18)}.kk-section{padding:1.25em 1.5em 0;background:#141414}.kk-section+.kk-section{padding-top:1.15em;border-top:1px solid rgba(255,255,255,.04)}.kk-body+.kk-section{border-top:1px solid rgba(255,255,255,.04)}.kk-section--last{padding-bottom:1.4em}.kk-block-title{font-size:1.75em;font-weight:900;color:#fff;margin:0 0 .8em}.kk-cast-list{display:flex;gap:1em;overflow-x:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x}.kk-cast-card{flex:0 0 auto;width:7.2em;text-align:center}.kk-cast-img{width:6.5em;height:6.5em;border-radius:50%;overflow:hidden;background:#2b2b2b;margin:0 auto .65em;border:2px solid rgba(255,255,255,.08)}.kk-cast-img img{width:100%;height:100%;object-fit:cover}.kk-cast-empty{width:100%;height:100%;background:#333;border-radius:50%}.kk-cast-name{font-size:1em;font-weight:800;color:#fff}.kk-cast-role{font-size:.88em;color:rgba(255,255,255,.6);margin-top:.12em}.kk-server{font-size:1.12em;font-weight:800;color:#63d471;margin:.95em 0 .65em}.kk-eps{display:flex;flex-wrap:wrap;gap:.65em}.kk-ep{min-width:4.2em;text-align:center;padding:.8em 1em;border-radius:.75em;background:rgba(255,255,255,.09);color:#fff;font-size:1em;font-weight:800;cursor:pointer}.kk-ep.focus{background:#ff2233}.kk-similar{padding-bottom:1.1em}.kk-similar-list{display:flex;gap:.9em;overflow-x:auto;-webkit-overflow-scrolling:touch}.kk-similar-list .kk-card{width:8.5em}.kk-stg-wrap{padding:1.4em}.kk-stg-title{font-size:2em;font-weight:900;color:#fff;margin:0 0 1.3em}.kk-stg-group{margin-bottom:1.7em}.kk-stg-group-title{font-size:1.3em;font-weight:900;color:#fff;margin:0 0 .8em;display:flex;align-items:center;gap:.5em}.kk-stg-item{display:flex;align-items:center;gap:.9em;margin-bottom:.7em;padding:1em 1.1em;border-radius:.95em;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06);cursor:pointer}.kk-stg-item.focus{background:rgba(99,102,241,.2);border-color:rgba(99,102,241,.45)}.kk-stg-label{flex:1}.kk-stg-label-name{font-size:1.08em;font-weight:800;color:#fff}.kk-stg-label-desc{font-size:.92em;color:rgba(255,255,255,.45);margin-top:.18em}.kk-stg-value{font-size:.98em;font-weight:700;color:#a78bfa;max-width:12em;text-align:right;word-break:break-all}.kk-stg-status{margin-top:.7em;padding:.85em 1.1em;border-radius:.85em;font-size:.98em;font-weight:700}.kk-stg-status--ok{background:rgba(74,222,128,.12);color:#4ade80}.kk-stg-status--err{background:rgba(248,113,113,.12);color:#f87171}.kk-stg-status--loading{background:rgba(255,255,255,.06);color:rgba(255,255,255,.5)}video::cue{background:rgba(0,0,0,.75);color:#fff;font-size:1.2em;line-height:1.5;padding:.2em .6em;border-radius:.3em}.selector,.kk-act,.kk-ep,.kk-row-more,.kk-loadmore,.kk-genre,.kk-card,.kk-btn,.kk-stg-item,.kk-srcbtn{touch-action:manipulation;-webkit-tap-highlight-color:transparent}@media(orientation:landscape){.kk-hero-bg{height:28em}.kk-hero-bottom{padding:1.5em 1.8em 1.3em}.kk-hero-flex{display:flex;align-items:flex-end;gap:1.3em}.kk-hero-poster{display:block;width:9.5em;min-width:9.5em}.kk-hero-poster img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:.95em;background:#242424}.kk-hero-info{flex:1;padding-bottom:.2em}.kk-logo{max-width:26em;margin-bottom:.95em}.kk-logo img{max-height:8em}.kk-title{font-size:2.7em}.kk-body{padding:1.3em 1.8em 0}.kk-section{padding:1.2em 1.8em 0}.kk-similar-list .kk-card{width:8.8em}}@media(max-width:768px){.kk-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:.75em}}</style>');
    }

    // ===================== MENU =====================
    function addMenu() {
        function ins() { if ($('.menu__item[data-action="kkphim"]').length) return; var m = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>'); bindEnter(m, function () { Lampa.Activity.push({ url: '', title: 'KKPhim', component: 'kkphim_main', page: 1 }); }); $('.menu .menu__list').first().append(m); }
        setTimeout(ins, 500); Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') setTimeout(ins, 500); });
    }

    // ===================== COMPONENTS =====================
    function startPlugin() {
        injectCSS(); addMenu();

        // SETTINGS
        Lampa.Component.add('kkphim_settings', function () {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            this.create = function () {
                clearScroll(scroll); var s = loadSettings(), w = $('<div class="kk-stg-wrap"></div>');
                w.append('<div class="kk-stg-title">⚙️ Cài đặt</div>');

                var g0 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">📺 Nguồn phim</div>');
                var cur = s.source || 'ophim';
                Object.keys(SOURCES).forEach(function (k) { var src = SOURCES[k], it = si(src.name, src.api, cur === k ? '✅' : 'Chọn'); if (cur === k) it.find('.kk-stg-value').css('color', '#4ade80'); bindEnter(it, function () { saveSettings({ source: k }); Lampa.Noty.show(src.name); comp.create(); }); g0.append(it); });
                w.append(g0);

                var g1 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🖥️ TorrServer</div>');
                var hi = si('Địa chỉ', '192.168.1.100:8090', s.torrserver_host || 'Chưa cài');
                bindEnter(hi, function () { pi('Địa chỉ', s.torrserver_host || '', function (v) { v = (v || '').trim(); saveSettings({ torrserver_host: v }); s.torrserver_host = v; hi.find('.kk-stg-value').text(v || 'Chưa cài'); }); }); g1.append(hi);
                var pwi = si('Mật khẩu', 'Để trống nếu không', s.torrserver_password ? '••••' : 'Không');
                bindEnter(pwi, function () { pi('Mật khẩu', s.torrserver_password || '', function (v) { v = (v || '').trim(); saveSettings({ torrserver_password: v }); s.torrserver_password = v; pwi.find('.kk-stg-value').text(v ? '••••' : 'Không'); }); }); g1.append(pwi);
                var ti = si('🔌 Test', '', 'Nhấn'), st1 = $('<div class="kk-stg-status" style="display:none"></div>');
                bindEnter(ti, function () { testTS(st1); }); g1.append(ti).append(st1); w.append(g1);

                var g2 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🧲 Torrentio</div>');
                var tii = si('Config', 'Paste manifest URL', s.torrentio_config ? 'Có' : 'Mặc định');
                bindEnter(tii, function () { pi('Config', s.torrentio_config || '', function (v) { v = (v || '').trim(); saveSettings({ torrentio_config: v }); s.torrentio_config = v; tii.find('.kk-stg-value').text(v ? 'Có' : 'Mặc định'); }); }); g2.append(tii);
                var tti = si('🧪 Test', '', 'Nhấn'), st2 = $('<div class="kk-stg-status" style="display:none"></div>');
                bindEnter(tti, function () { testTIO(st2); }); g2.append(tti).append(st2); w.append(g2);

                var g3 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">📝 Phụ đề</div>');
                var subdlItem = si('SubDL API Key', 'subdl.com → Profile → API', s.subdl_api_key ? '✅ Có' : '❌ Chưa có');
                if (s.subdl_api_key) subdlItem.find('.kk-stg-value').css('color', '#4ade80'); else subdlItem.find('.kk-stg-value').css('color', '#f87171');
                bindEnter(subdlItem, function () { pi('SubDL API Key', s.subdl_api_key || '', function (v) { v = (v || '').trim(); saveSettings({ subdl_api_key: v }); s.subdl_api_key = v; subdlItem.find('.kk-stg-value').text(v ? '✅ Có' : '❌ Chưa có').css('color', v ? '#4ade80' : '#f87171'); }); }); g3.append(subdlItem);
                var subM = s.sub_mode || 'ask';
                [{ k: 'ask', n: 'Hỏi mỗi lần', d: 'Chọn sub trước khi phát' }, { k: 'auto', n: 'Tự động (Việt)', d: 'Ưu tiên tiếng Việt' }, { k: 'off', n: 'Tắt', d: 'Không tìm sub' }].forEach(function (sm) { var it = si(sm.n, sm.d, subM === sm.k ? '✅' : 'Chọn'); if (subM === sm.k) it.find('.kk-stg-value').css('color', '#4ade80'); bindEnter(it, function () { saveSettings({ sub_mode: sm.k }); Lampa.Noty.show('Sub: ' + sm.n); comp.create(); }); g3.append(it); });
                var tsi = si('🧪 Test sub', 'Thử Inception', 'Nhấn'), st3 = $('<div class="kk-stg-status" style="display:none"></div>');
                bindEnter(tsi, function () { testSub(st3); }); g3.append(tsi).append(st3); w.append(g3);

                var g5 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🎬 Trình phát</div>');
                g5.append($('<div style="padding:.5em 1.1em .7em;font-size:.88em;color:rgba(255,255,255,.45);line-height:1.5">💡 Chọn "Luôn hỏi" để có menu copy tên TMDB chuẩn tìm sub trên MX Player.</div>'));
                var curP = s.ext_player || 'internal';
                var intI = si('📱 Tích hợp', 'Lampa player, sub đầy đủ', curP === 'internal' ? '✅' : 'Chọn');
                if (curP === 'internal') intI.find('.kk-stg-value').css('color', '#4ade80');
                bindEnter(intI, function () { saveSettings({ ext_player: 'internal' }); comp.create(); }); g5.append(intI);
                Object.keys(EXT_PLAYERS).forEach(function (k) { var p = EXT_PLAYERS[k]; var it = si(p.icon + ' ' + p.name, p.desc + ' + sub overlay', curP === k ? '✅' : 'Chọn'); if (curP === k) it.find('.kk-stg-value').css('color', '#4ade80'); bindEnter(it, function () { saveSettings({ ext_player: k }); comp.create(); }); g5.append(it); });
                var askI = si('❓ Luôn hỏi', 'Linh hoạt nhất (khuyên dùng)', curP === 'ask' ? '✅' : 'Chọn');
                if (curP === 'ask') askI.find('.kk-stg-value').css('color', '#4ade80');
                bindEnter(askI, function () { saveSettings({ ext_player: 'ask' }); comp.create(); }); g5.append(askI); w.append(g5);

                var g4 = $('<div class="kk-stg-group"></div>');
                var cl = si('🗑️ Xóa cài đặt', '', 'Xóa'); cl.find('.kk-stg-value').css('color', '#f87171');
                bindEnter(cl, function () { localStorage.removeItem(SETTINGS_KEY); Lampa.Noty.show('Đã xóa'); Lampa.Activity.backward(); }); g4.append(cl); w.append(g4);
                scroll.append(w); comp.start();
            };

            function si(n, d, v) { return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">' + esc(n) + '</div>' + (d ? '<div class="kk-stg-label-desc">' + esc(d) + '</div>' : '') + '</div><div class="kk-stg-value">' + esc(v) + '</div></div>'); }
            function pi(t, c, cb) { try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: t, value: c || '', free: true, nosave: true }, cb); return; } } catch (e) {} var v = window.prompt(t, c || ''); if (v !== null) cb(v); }
            async function testTS(el) { if (!getTSHost()) { el.show().attr('class', 'kk-stg-status kk-stg-status--err').text('❌ Chưa nhập'); return; } el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳'); try { var r = await fetch(tsUrl('/echo'), { headers: tsHdr() }); el.attr('class', 'kk-stg-status ' + (r.ok ? 'kk-stg-status--ok' : 'kk-stg-status--err')).text(r.ok ? '✅ OK' : '❌ ' + r.status); } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || '')); } }
            async function testTIO(el) { el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳'); var u = TORRENTIO_BASE + (cleanTioConfig(getTioConfig()) ? '/' + cleanTioConfig(getTioConfig()) : '') + '/stream/movie/tt1375666.json'; try { var r = await fetch(u); if (!r.ok) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + r.status); return; } var d = await r.json(); el.attr('class', 'kk-stg-status kk-stg-status--ok').text('✅ ' + (d.streams || []).length + ' torrent'); } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || '')); } }
            async function testSub(el) { el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳'); try { var subs = await searchSubs('tt1375666', null, 'movie', null, null, 'Inception'); if (subs.length) el.attr('class', 'kk-stg-status kk-stg-status--ok').text('✅ ' + subs.length + ' sub'); else el.attr('class', 'kk-stg-status kk-stg-status--err').text(getSubdlKey() ? '❌ Không có' : '❌ Cần API key'); } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || '')); } }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {};
            this.render = function () { return scroll.render(); }; this.destroy = function () { scroll.destroy(); };
        });

        // MAIN
        Lampa.Component.add('kkphim_main', function () {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this, _src = '';
            var cats = [{ name: 'Phim Mới', api: 'danh-sach/phim-moi-cap-nhat' }, { name: 'Phim Bộ', api: 'v1/api/danh-sach/phim-bo' }, { name: 'Phim Lẻ', api: 'v1/api/danh-sach/phim-le' }, { name: 'Hoạt Hình', api: 'v1/api/danh-sach/hoat-hinh' }, { name: 'TV Shows', api: 'v1/api/danh-sach/tv-shows' }];
            this.create = function () {
                network.clear(); this.activity.loader(true); clearScroll(scroll);
                var src = getSource(); _src = src.key;
                var tb = $('<div class="kk-topbar"><div class="kk-topbar-title">' + esc(src.name) + '</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');
                bindEnter($(tb.find('.kk-btn')[0]), openSearch); bindEnter($(tb.find('.kk-btn')[1]), function () { Lampa.Activity.push({ url: '', title: 'Cài đặt', component: 'kkphim_settings' }); }); scroll.append(tb);
                var sb = $('<div class="kk-srcbar"></div>');
                Object.keys(SOURCES).forEach(function (k) { var s = SOURCES[k], on = k === src.key; var btn = $('<div class="kk-srcbtn selector ' + (on ? 'kk-srcbtn--on' : 'kk-srcbtn--off') + '">' + esc(s.name) + '</div>'); bindEnter(btn, function () { if (on) return; saveSettings({ source: k }); Lampa.Noty.show(s.name); comp.create(); }); sb.append(btn); }); scroll.append(sb);
                if (getTSHost()) scroll.append($('<div class="kk-tsbar"><div class="kk-tsbadge">🖥️ ' + esc(getTSHost()) + '</div></div>'));
                var loaded = 0;
                cats.forEach(function (cat) {
                    network.silent(apiListUrl(cat.api, 1), function (res) { var list = universalList(res); if (list.length) { var row = $('<div class="kk-row"></div>'); var more = $('<div class="kk-row-more selector">Xem thêm</div>'); var rl = $('<div class="kk-row-list"></div>'); bindEnter(more, function () { Lampa.Activity.push({ url: '', title: cat.name, component: 'kkphim_category', cat: cat, page_num: 1, mode: 'api' }); }); list.slice(0, 12).forEach(function (i) { rl.append(mkCard(i)); }); row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">' + esc(cat.name) + '</div>').append(more)).append(rl); scroll.append(row); } loaded++; if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); } }, function () { loaded++; if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); } });
                });
            };
            this.start = function () { if (_src && _src !== getSourceKey()) { comp.create(); return; } applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // CATEGORY
        Lampa.Component.add('kkphim_category', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var page = obj.page_num || 1, title = obj.title || (obj.cat && obj.cat.name) || '', mode = obj.mode || 'api', apiPath = obj.cat ? obj.cat.api : null, catSlug = obj.category_slug || '';
            var grid = $('<div class="kk-grid"></div>'), lm = $('<div class="kk-loadmore selector">Tải thêm</div>'), loading = false, hasMore = true;
            this.create = function () { this.activity.loader(true); clearScroll(scroll); scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">' + esc(title) + '</div>').append(grid).append(lm)); bindEnter(lm, function () { if (!loading && hasMore) doLoad(); }); doLoad(); };
            function hr(res) { var list = universalList(res); if (!list.length) { hasMore = false; lm.text('Hết'); comp.activity.loader(false); loading = false; comp.start(); return; } list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); }); page++; loading = false; lm.text('Tải thêm'); comp.activity.loader(false); comp.start(); }
            function doLoad() { loading = true; lm.text('Đang tải...'); var url = (mode === 'category' && catSlug) ? apiCatUrl(catSlug, page) : apiListUrl(apiPath, page); network.silent(url, hr, function () { network.silent(SRC_API() + 'the-loai/' + catSlug + '?page=' + page, hr, function () { loading = false; lm.text('Lỗi'); comp.activity.loader(false); }); }); }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // SEARCH
        Lampa.Component.add('kkphim_search', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var kw = obj.keyword || '', page = obj.page_num || 1;
            var grid = $('<div class="kk-grid"></div>'), lm = $('<div class="kk-loadmore selector">Tải thêm</div>'), loading = false, hasMore = true;
            this.create = function () { this.activity.loader(true); clearScroll(scroll); scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 ' + esc(kw) + '</div>').append(grid).append(lm)); bindEnter(lm, function () { if (!loading && hasMore) doLoad(); }); doLoad(); };
            function hr(res) { var list = universalList(res); if (!list.length) { hasMore = false; lm.text(page === 1 ? 'Không có' : 'Hết'); comp.activity.loader(false); loading = false; comp.start(); return; } list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); }); page++; loading = false; lm.text('Tải thêm'); comp.activity.loader(false); comp.start(); }
            function doLoad() { loading = true; lm.text('Đang tải...'); network.silent(apiSearchUrl(kw, page), hr, function () { network.silent(SRC_API() + 'tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, hr, function () { loading = false; lm.text('Lỗi'); comp.activity.loader(false); }); }); }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // DETAIL
        Lampa.Component.add('kkphim_detail', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true });
            var rawMovie = obj.movie, movie = norm(rawMovie), comp = this, rendered = false;
            this.create = function () {
                this.activity.loader(true); clearScroll(scroll); rendered = false;
                if (!movie || !movie.slug) { this.activity.loader(false); scroll.append('<div class="empty__body"><div class="empty__title">Không có dữ liệu</div></div>'); comp.start(); return; }
                network.silent(apiDetailUrl(movie.slug), function (res) { if (rendered) return; var parsed = universalDetail(res); loadAll(parsed.movie, parsed.episodes); }, function () { comp.activity.loader(false); Lampa.Noty.show('Lỗi tải phim'); });
            };

            async function loadAll(data, episodes) {
                if (!data || !data.slug) data = movie;
                try {
                    var tid = getTmdbId(data), tt = detectType(data), tmdb = null, logos = null;
                    if (!tid) { var tr = await searchTmdbByName(data.name, data.origin_name, data.year, tt); if (tr) { tid = tr.id; if (!data.tmdb) data.tmdb = {}; data.tmdb.id = tid; data.tmdb.type = tr.media_type || tt; } }
                    if (tid) {
                        try { tmdb = await tmdbFetch('/' + tt + '/' + tid + '?language=vi-VN&append_to_response=credits,images'); } catch (e) { try { tmdb = await tmdbFetch('/' + tt + '/' + tid + '?language=en-US&append_to_response=credits,images'); } catch (e2) {} }
                        try { logos = await tmdbFetch('/' + tt + '/' + tid + '/images'); } catch (e3) {}
                    }
                    // Lưu tmdb data để dùng trong menu copy tên
                    _currentTmdbData = tmdb;
                    _currentMovieData = data;
                    if (!rendered) { build(data, episodes, tmdb, logos, tt); rendered = true; }
                } catch (e) { if (!rendered) { build(data, episodes, null, null, detectType(data)); rendered = true; } }
                comp.activity.loader(false); comp.start();
            }

            function build(data, episodes, tmdb, logos, ttype) {
                clearScroll(scroll); if (!Array.isArray(data.category)) data.category = [];
                var bk = fullImg(data.thumb_url || data.poster_url), ps = fullImg(data.poster_url || data.thumb_url);
                var t = data.name || '', o = data.origin_name || '', d = cleanDesc(data.content), v = (data.tmdb && data.tmdb.vote_average) || 'N/A';
                var y = data.year || '', rt = data.time || '', epCur = data.episode_current || '';
                var ghtml = '', castH = '', dirH = '', crewH = '', logoH = '', dir = '';

                if (tmdb) {
                    if (tmdb.backdrop_path) bk = TMDB_IMG + tmdb.backdrop_path; if (tmdb.poster_path) ps = TMDB_IMG + tmdb.poster_path;
                    if (tmdb.title || tmdb.name) t = tmdb.title || tmdb.name; if (tmdb.original_title || tmdb.original_name) o = tmdb.original_title || tmdb.original_name;
                    if (tmdb.overview) d = tmdb.overview; if (tmdb.vote_average) v = Number(tmdb.vote_average).toFixed(1);
                    if (tmdb.release_date) y = tmdb.release_date.slice(0, 4); if (!y && tmdb.first_air_date) y = tmdb.first_air_date.slice(0, 4); if (tmdb.runtime) rt = tmdb.runtime + ' phút';
                    var logo = pickLogo(logos || tmdb.images); if (logo && logo.file_path) logoH = '<div class="kk-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '"></div>';
                    if (tmdb.credits) {
                        castH = mkPeople((tmdb.credits.cast || []).slice(0, 12), 'character');
                        var dirs = (tmdb.credits.crew || []).filter(function (c) { return c.job === 'Director' || c.job === 'Creator' || c.job === 'Series Director'; }).filter(function (p, i, a) { return a.findIndex(function (x) { return x.name === p.name; }) === i; }).slice(0, 10);
                        if (dirs.length) { dir = dirs.map(function (c) { return c.name; }).join(', '); dirH = mkPeople(dirs.map(function (c) { return { name: c.name, profile_path: c.profile_path, job: c.job || 'Đạo diễn' }; }), 'job'); }
                    }
                }

                if (data.category && data.category.length) ghtml = data.category.map(function (g) { if (!g) return ''; return '<span class="kk-genre selector" data-slug="' + esc(g.slug || '') + '" data-title="' + esc(g.name || '') + '">' + esc(g.name || '') + '</span>'; }).join('');
                else if (tmdb && tmdb.genres) ghtml = tmdb.genres.map(function (g) { return '<span class="kk-genre">' + esc(g.name || '') + '</span>'; }).join('');
                if (data.director && !dir) dir = Array.isArray(data.director) ? data.director.join(', ') : String(data.director || '');
                if (dir && !dirH) crewH = '<div class="kk-crew"><b>Đạo diễn</b><span>' + esc(dir) + '</span></div>';
                var tH = logoH ? '' : '<div class="kk-title">' + esc(t) + '</div>';

                var hero = $('<div class="kk-hero"><div class="kk-hero-bg"><img src="' + bk + '"><div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster"><img src="' + ps + '"></div><div class="kk-hero-info">' + logoH + tH + '<div class="kk-origin">' + esc(o) + '</div></div></div></div></div>');

                // Nút thông tin TMDB để copy tên chuẩn
                var infoBtn = '<div class="kk-act-wrap"><div class="kk-act kk-act--info selector">🔍 Copy tên chuẩn</div></div>';

                var body = $('<div class="kk-body"><div class="kk-metas"><span class="kk-meta">⭐ ' + esc(v) + '</span>' + (y ? '<span class="kk-meta">📅 ' + esc(y) + '</span>' : '') + (rt ? '<span class="kk-meta">⏱ ' + esc(rt) + '</span>' : '') + (epCur ? '<span class="kk-meta">🎬 ' + esc(epCur) + '</span>' : '') + '</div><div class="kk-genres">' + ghtml + '</div>' + crewH + '<div class="kk-desc">' + fmtTxt(d) + '</div><div class="kk-actions"><div class="kk-act-wrap"><div class="kk-act kk-act--play selector">▶ Xem phim</div></div><div class="kk-act-wrap"><div class="kk-act kk-act--torrent selector">🧲 Torrent' + (getTSHost() ? ' → TS' : '') + '</div></div><div class="kk-act-wrap"><div class="kk-act kk-act--sub selector">📝 Phụ đề</div></div>' + infoBtn + '</div></div>');

                bindEnter(body.find('.kk-act--play'), function () { var f = getFirstEp(episodes); if (!f) { Lampa.Noty.show('Không có tập'); return; } var link = f.link_m3u8 || f.link_embed || ''; if (!link) { Lampa.Noty.show('Không có link'); return; } var epNum = parseInt((f.name || '').replace(/[^\d]/g, '')) || null; playUrlWithSub(link, (data.name || '') + ' - ' + (f.name || ''), data, ttype, ttype === 'tv' ? 1 : null, epNum); });
                bindEnter(body.find('.kk-act--torrent'), function () { openTorrentSearch(getTmdbId(data), ttype, data, episodes, ps); });

                // Nút sub
                bindEnter(body.find('.kk-act--sub'), async function () {
                    var tmdbId = getTmdbId(data), imdb = null;
                    if (!tmdbId) { var tr = await searchTmdbByName(data.name, data.origin_name, data.year, ttype); if (tr) { tmdbId = tr.id; if (!data.tmdb) data.tmdb = {}; data.tmdb.id = tmdbId; } }
                    if (tmdbId) try { imdb = await getImdbId(ttype, tmdbId); } catch (e) {}
                    Lampa.Noty.show('Tìm phụ đề...');
                    var subs = await searchSubs(imdb, tmdbId, ttype, null, null, data.origin_name || data.name || '');
                    if (!subs.length) { Lampa.Noty.show(getSubdlKey() ? 'Không có phụ đề' : 'Cần API key SubDL!'); return; }
                    Lampa.Select.show({ title: '📝 Phụ đề (' + subs.length + ')', items: subs.slice(0, 30).map(function (s) { return { title: s.label, value: s }; }), onSelect: function (a) { Lampa.Noty.show('✅ ' + a.value.label); Lampa.Controller.toggle('content'); }, onBack: function () { Lampa.Controller.toggle('content'); } });
                });

                // Nút copy tên chuẩn TMDB
                bindEnter(body.find('.kk-act--info'), function () {
                    showTmdbInfo(data, tmdb);
                });

                body.find('.kk-genre[data-slug]').each(function () { var g = $(this); bindEnter(g, function () { var slug = g.attr('data-slug'); if (slug) Lampa.Activity.push({ url: '', title: g.attr('data-title') || '', component: 'kkphim_category', mode: 'category', category_slug: slug, page_num: 1 }); }); });

                var dw = $('<div class="kk-detail-wrap"></div>').append(hero).append(body);
                if (dirH) dw.append('<div class="kk-section"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">' + dirH + '</div></div>');
                if (castH) dw.append('<div class="kk-section"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">' + castH + '</div></div>');

                if (episodes && episodes.length) {
                    var ew = $('<div class="kk-section"></div>').append('<div class="kk-block-title">Danh sách tập</div>');
                    episodes.forEach(function (sv) {
                        ew.append('<div class="kk-server">' + esc(sv.server_name || '') + '</div>');
                        var g = $('<div class="kk-eps"></div>');
                        (sv.server_data || []).forEach(function (ep) { var b = $('<div class="kk-ep selector">' + esc(ep.name || '') + '</div>'); bindEnter(b, function () { var link = ep.link_m3u8 || ep.link_embed || ''; if (!link) { Lampa.Noty.show('Không có link'); return; } var epNum = parseInt((ep.name || '').replace(/[^\d]/g, '')) || null; playUrlWithSub(link, (data.name || '') + ' - ' + (ep.name || ''), data, ttype, ttype === 'tv' ? 1 : null, epNum); }); g.append(b); });
                        ew.append(g);
                    });
                    dw.append(ew);
                }

                scroll.append(dw);
                var cats = data.category || [];
                if (cats.length && cats[0] && cats[0].slug) {
                    network.silent(apiCatUrl(cats[0].slug, 1), function (r) { var list = universalList(r).filter(function (i) { return i.slug !== movie.slug; }).slice(0, 12); if (list.length) { var row = $('<div class="kk-section kk-section--last kk-similar"></div>').append('<div class="kk-block-title">Phim liên quan</div>'); var rl = $('<div class="kk-similar-list"></div>'); list.forEach(function (i) { rl.append(mkCard(i)); }); row.append(rl); dw.append(row); } else dw.append('<div class="kk-section kk-section--last"></div>'); }, function () { dw.append('<div class="kk-section kk-section--last"></div>'); });
                } else { dw.append('<div class="kk-section kk-section--last"></div>'); }
            }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { network.clear(); scroll.destroy(); };
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();