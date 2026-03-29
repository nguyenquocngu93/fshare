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

    // ===================== SETTINGS =====================
    function loadSettings() { try { var s = localStorage.getItem(SETTINGS_KEY); return s ? JSON.parse(s) : {}; } catch (e) { return {}; } }
    function saveSettings(obj) { try { var c = loadSettings(); Object.keys(obj).forEach(function (k) { c[k] = obj[k]; }); localStorage.setItem(SETTINGS_KEY, JSON.stringify(c)); } catch (e) {} }
    function getSourceKey() { return loadSettings().source || 'ophim'; }
    function getSource() { return SOURCES[getSourceKey()] || SOURCES.ophim; }
    function SRC_API() { return getSource().api; }
    function SRC_IMG() { return getSource().img; }
    function getTorrServerHost() { return loadSettings().torrserver_host || ''; }
    function getTorrServerPassword() { return loadSettings().torrserver_password || ''; }
    function getTorrentioConfig() { return loadSettings().torrentio_config || ''; }

    function fullImg(url) {
        if (!url) return '';
        if (url.indexOf('http') === 0) return url;
        return SRC_IMG() + url;
    }

    // ===================== TORRENTIO CONFIG =====================
    function cleanTorrentioConfig(raw) {
        if (!raw) return '';
        raw = String(raw).trim(); if (!raw) return '';
        var m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i); if (m) return m[1];
        m = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i); if (m) return m[1].replace(/\/+$/, '');
        m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i); if (m) return m[1];
        if (raw.indexOf('torrentio.strem.fun') > -1) { raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i, '').replace(/^\/+|\/+$/g, ''); if (raw && raw.indexOf('=') > -1) return raw.replace(/\|/g, '%7C'); return ''; }
        raw = raw.replace(/^\/+|\/+$/g, '').replace(/\|/g, '%7C');
        return raw.indexOf('=') === -1 ? '' : raw;
    }

    // ===================== TORRSERVER =====================
    function tsUrl(path) { var h = getTorrServerHost(); if (!h) return ''; h = h.replace(/\/+$/, ''); if (h.indexOf('http') !== 0) h = 'http://' + h; return h + path; }
    function tsHeaders() { var h = { 'Content-Type': 'application/json' }; var pw = getTorrServerPassword(); if (pw) h['Authorization'] = 'Basic ' + btoa('admin:' + pw); return h; }

    async function tsAdd(magnet, title, poster) {
        var url = tsUrl('/torrents'); if (!url) throw new Error('TorrServer chưa cấu hình');
        var r = await fetch(url, { method: 'POST', headers: tsHeaders(), body: JSON.stringify({ action: 'add', link: magnet, title: title || '', poster: poster || '', save_to_db: false }) });
        if (!r.ok) throw new Error('TS add: ' + r.status);
        return await r.json();
    }

    async function tsGetFiles(hash) {
        var url = tsUrl('/torrents'); if (!url) throw new Error('TorrServer chưa cấu hình');
        var r = await fetch(url, { method: 'POST', headers: tsHeaders(), body: JSON.stringify({ action: 'get', hash: hash }) });
        if (!r.ok) throw new Error('TS get: ' + r.status);
        return await r.json();
    }

    function buildMagnet(h) {
        var m = 'magnet:?xt=urn:btih:' + h;
        ['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce','udp://tracker.torrent.eu.org:451/announce','udp://open.demonii.com:1337/announce','udp://exodus.desync.com:6969/announce','udp://tracker.openbittorrent.com:6969/announce','udp://explodie.org:6969/announce','udp://p4p.arenabg.com:1337/announce'].forEach(function (t) { m += '&tr=' + encodeURIComponent(t); });
        return m;
    }

    async function playViaTS(stream, title, poster, fileIdx) {
        if (!getTorrServerHost()) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
        Lampa.Noty.show('Đang gửi TorrServer...');
        try {
            var torData = await tsAdd(buildMagnet(stream.infoHash), title, poster);
            var hash = torData.hash || stream.infoHash;
            await new Promise(function (r) { setTimeout(r, 2000); });
            var info = null, retry = 0;
            while (retry < 3) { try { info = await tsGetFiles(hash); if (info && info.file_stats && info.file_stats.length) break; } catch (e) {} retry++; await new Promise(function (r) { setTimeout(r, 1500); }); }
            var files = [];
            if (info && info.file_stats) files = info.file_stats.filter(function (f) { return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|wmv|flv|webm|ts|m2ts)$/); }).sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
            if (!files.length) { Lampa.Player.play({ title: title, url: tsUrl('/stream/fname?link=' + hash + '&index=0&play') }); return; }
            if (files.length === 1) { Lampa.Player.play({ title: title, url: tsUrl('/stream/fname?link=' + hash + '&index=' + (files[0].id || 0) + '&play') }); return; }
            if (fileIdx !== undefined && fileIdx !== null && fileIdx >= 0 && fileIdx < files.length) { Lampa.Player.play({ title: title, url: tsUrl('/stream/fname?link=' + hash + '&index=' + (files[fileIdx].id || fileIdx) + '&play') }); }
            else { showTSFiles(files, hash, title); }
        } catch (e) { Lampa.Noty.show('Lỗi TS: ' + (e.message || '')); }
    }

    function showTSFiles(files, hash, title) {
        Lampa.Select.show({
            title: '📁 Chọn file (' + files.length + ')',
            items: files.map(function (f, i) { var n = (f.path || ('File ' + i)).split('/').pop(); var s = f.length ? (f.length / 1048576).toFixed(0) + 'MB' : ''; return { title: n + (s ? ' (' + s + ')' : ''), value: f }; }),
            onSelect: function (a) { Lampa.Player.play({ title: title + ' - ' + (a.value.path || '').split('/').pop(), url: tsUrl('/stream/fname?link=' + hash + '&index=' + a.value.id + '&play') }); },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    // ===================== TMDB =====================
    async function tmdbFetch(path) { var r = await fetch('https://api.themoviedb.org/3' + path, { headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN, 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error('TMDB ' + r.status); return await r.json(); }
    async function getImdbId(type, id) { if (!id) return null; try { var r = await tmdbFetch('/' + type + '/' + id + '/external_ids'); return r.imdb_id || null; } catch (e) { return null; } }
    async function getTmdbSeasons(id) { try { var r = await tmdbFetch('/tv/' + id + '?language=vi-VN'); if (r && r.seasons) return r.seasons.filter(function (s) { return s.season_number > 0; }).map(function (s) { return { season_number: s.season_number, name: s.name || ('Season ' + s.season_number), episode_count: s.episode_count || 0 }; }); } catch (e) {} return []; }

    // ===================== TORRENTIO =====================
    function tioUrl(type, imdbId, s, e) {
        var t = type === 'tv' ? 'series' : 'movie', id = imdbId;
        if (type === 'tv' && s && e) id = imdbId + ':' + s + ':' + e;
        var c = cleanTorrentioConfig(getTorrentioConfig());
        return TORRENTIO_BASE + (c ? '/' + c : '') + '/stream/' + t + '/' + id + '.json';
    }

    async function fetchTio(type, imdbId, s, e) {
        var url = tioUrl(type, imdbId, s, e);
        var r = await fetch(url); if (!r.ok) throw new Error('Torrentio ' + r.status);
        var d = await r.json();
        return (d.streams || []).map(function (s) {
            var lines = (s.title || '').split('\n'), name = lines[0] || '?', info = lines.slice(1).join(' | ');
            var sm = info.match(/💾\s*([\d.]+\s*[GMKT]B)/i) || info.match(/([\d.]+\s*[GMKT]B)/i), sd = info.match(/👤\s*(\d+)/);
            return { name: name, title: s.title || '', infoHash: s.infoHash || '', fileIdx: s.fileIdx, url: s.url || '', size: sm ? sm[1] : '', seeds: sd ? sd[1] : '', rawName: s.name || '' };
        });
    }

    function showTioResults(streams, title, poster) {
        var ts = !!getTorrServerHost();
        Lampa.Select.show({
            title: '🧲 ' + title + ' (' + streams.length + ')' + (ts ? ' → TS' : ''),
            items: streams.slice(0, 40).map(function (s) { var l = s.name; if (s.size) l += ' | ' + s.size; if (s.seeds) l += ' | 👤' + s.seeds; if (s.rawName) l += ' [' + s.rawName + ']'; return { title: l, value: s }; }),
            onSelect: function (a) { var s = a.value; if (ts && s.infoHash) playViaTS(s, title, poster, s.fileIdx); else if (s.url) Lampa.Player.play({ title: title, url: s.url }); else Lampa.Noty.show(s.infoHash ? 'Chưa cấu hình TorrServer!' : 'Không có link'); },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    // ===================== TORRENT SEARCH =====================
    async function openTorrentSearch(tmdbId, ttype, data, episodes, poster) {
        if (ttype === 'tv') { tvTorrentPicker(tmdbId, data, episodes, poster); return; }
        Lampa.Noty.show('Đang tìm torrent...');
        try {
            var imdb = await getImdbId(ttype, tmdbId);
            if (!imdb) { Lampa.Noty.show('Không tìm IMDB ID'); return; }
            var streams = await fetchTio(ttype, imdb);
            if (!streams.length) { Lampa.Noty.show('Không có torrent'); return; }
            showTioResults(streams, data.name || '', poster);
        } catch (e) { Lampa.Noty.show('Lỗi: ' + (e.message || '')); }
    }

    async function tvTorrentPicker(tmdbId, data, episodes, poster) {
        Lampa.Noty.show('Đang tải seasons...');
        var seasons = await getTmdbSeasons(tmdbId);
        var imdb = await getImdbId('tv', tmdbId);
        if (!imdb) imdb = await getImdbId('movie', tmdbId);
        if (!imdb) { Lampa.Noty.show('Không tìm IMDB ID'); return; }

        if (seasons.length > 1) pickSeason(seasons, imdb, data, poster);
        else if (seasons.length === 1) pickEpFromSeason(seasons[0], imdb, data, poster);
        else pickEpFallback(imdb, data, episodes, poster);
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function pickSeason(seasons, imdb, data, poster) {
        Lampa.Select.show({
            title: '📺 ' + (data.name || '') + ' - Season',
            items: seasons.map(function (s) { return { title: s.name + (s.episode_count ? ' (' + s.episode_count + ' tập)' : ''), value: s }; }),
            onSelect: function (a) { var s = a.value; if (s.episode_count > 0) pickEpFromSeason(s, imdb, data, poster); else promptEp(s.season_number, imdb, data, poster); },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    function pickEpFromSeason(season, imdb, data, poster) {
        var items = [];
        for (var i = 1; i <= season.episode_count; i++) items.push({ title: 'S' + pad(season.season_number) + 'E' + pad(i), value: { s: season.season_number, e: i } });
        Lampa.Select.show({
            title: '📺 ' + (data.name || '') + ' - ' + season.name,
            items: items,
            onSelect: function (a) { doTvSearch(imdb, data, a.value.s, a.value.e, poster); },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    function pickEpFallback(imdb, data, episodes, poster) {
        var items = [];
        if (episodes && episodes.length) {
            var eps = [];
            episodes.forEach(function (sv) { (sv.server_data || []).forEach(function (ep) { var n = parseInt((ep.name || '').replace(/[^\d]/g, '')) || 0; if (n > 0 && !eps.find(function (x) { return x === n; })) eps.push(n); }); });
            eps.sort(function (a, b) { return a - b; });
            items = eps.map(function (n) { return { title: 'S01E' + pad(n), value: { s: 1, e: n } }; });
        }
        if (!items.length) { promptEp(1, imdb, data, poster); return; }
        Lampa.Select.show({
            title: '📺 ' + (data.name || '') + ' - Chọn tập',
            items: items,
            onSelect: function (a) { doTvSearch(imdb, data, a.value.s, a.value.e, poster); },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    function promptEp(defS, imdb, data, poster) {
        try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: 'Season:Episode (VD: ' + defS + ':1)', value: defS + ':1', free: true }, function (v) { var p = String(v || defS + ':1').split(':'); doTvSearch(imdb, data, parseInt(p[0]) || defS, parseInt(p[1]) || 1, ''); }); return; } } catch (e) {}
        var v = window.prompt('Season:Episode', defS + ':1'), p = String(v || defS + ':1').split(':');
        doTvSearch(imdb, data, parseInt(p[0]) || defS, parseInt(p[1]) || 1, '');
    }

    async function doTvSearch(imdb, data, s, e, poster) {
        var label = (data.name || '') + ' S' + pad(s) + 'E' + pad(e);
        Lampa.Noty.show('Tìm ' + label + '...');
        try {
            var streams = await fetchTio('tv', imdb, s, e);
            if (!streams.length) { Lampa.Noty.show('Không có torrent cho ' + label); return; }
            showTioResults(streams, label, poster);
        } catch (err) { Lampa.Noty.show('Lỗi: ' + (err.message || '')); }
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
    function pickLogo(imgs) { if (!imgs || !imgs.logos || !imgs.logos.length) return null; return imgs.logos.find(function (l) { return l.iso_639_1 === 'vi'; }) || imgs.logos.find(function (l) { return l.iso_639_1 === 'en'; }) || imgs.logos[0] || null; }
    function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
    function cleanDesc(s) { return String(s || '').replace(/<[^>]+>/g, '').trim() || 'Không có mô tả'; }
    function formatText(s) { return escapeHtml(s || '').replace(/\n/g, '<br>'); }
    function normalizeItem(i) { if (!i) return null; return { name: i.name || i.title || '', origin_name: i.origin_name || '', slug: i.slug || '', poster_url: i.poster_url || i.poster || '', thumb_url: i.thumb_url || i.thumb || '', year: i.year || '', quality: i.quality || '', episode_current: i.episode_current || '', tmdb: i.tmdb || {}, category: i.category || [], director: i.director || '', content: i.content || '', time: i.time || '', episode_total: i.episode_total || '', type: i.type || '' }; }

    function bindEnter(el, fn) {
        var sx = 0, sy = 0, moved = false, touched = false;
        el.on('touchstart', function (e) { var t = ((e.originalEvent || e).touches || [])[0]; if (t) { sx = t.clientX; sy = t.clientY; moved = false; } });
        el.on('touchmove', function (e) { var t = ((e.originalEvent || e).touches || [])[0]; if (t && (Math.abs(t.clientX - sx) > 16 || Math.abs(t.clientY - sy) > 16)) moved = true; });
        el.on('touchend', function (e) { if (moved) return; touched = true; e.preventDefault(); e.stopPropagation(); setTimeout(function () { fn.call(el[0], e); }, 100); setTimeout(function () { touched = false; }, 350); });
        el.on('click', function (e) { if (touched || moved) return; e.preventDefault(); e.stopPropagation(); fn.call(this, e); });
        el.on('hover:enter', function (e) { fn.call(this, e); });
    }

    function getFirstEp(eps) { for (var i = 0; i < (eps || []).length; i++) { if (eps[i] && eps[i].server_data && eps[i].server_data.length) return eps[i].server_data[0]; } return null; }

    function openSearch() {
        function go(kw) { kw = String(kw || '').trim(); if (kw) Lampa.Activity.push({ url: '', title: 'Tìm', component: 'kkphim_search', keyword: kw, page_num: 1 }); }
        try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: 'Tìm phim (' + getSource().name + ')', value: '', free: true }, go); return; } } catch (e) {}
        go(window.prompt('Tìm phim:'));
    }

    function enableScroll(scroll) {
        var el = scroll.render(); el.css({ overflow: 'hidden', position: 'relative', height: '100%' });
        var body = el.find('.scroll__body'), p = { transform: 'none', 'overflow-y': 'auto', 'overflow-x': 'hidden', '-webkit-overflow-scrolling': 'touch', height: '100%', 'padding-bottom': '8em', 'touch-action': 'pan-y' };
        body.css($.extend({ position: 'relative' }, p));
        if (body[0]) Object.keys(p).forEach(function (k) { body[0].style.setProperty(k, p[k], 'important'); });
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
        setTimeout(function () { Lampa.Controller.toggle('content'); Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, 0);
    }

    function mkPeople(list, key) { return (list || []).map(function (p) { var av = p.profile_path ? '<img src="' + TMDB_IMG_W500 + p.profile_path + '">' : '<div class="kk-cast-empty"></div>'; return '<div class="kk-cast-card"><div class="kk-cast-img">' + av + '</div><div class="kk-cast-name">' + escapeHtml(p.name || '') + '</div><div class="kk-cast-role">' + escapeHtml(p[key] || '') + '</div></div>'; }).join(''); }

    function parseList(res) { return ((res && res.items) || (res && res.data && res.data.items) || []).map(normalizeItem).filter(function (i) { return i && i.slug; }); }

    // ===================== CSS =====================
    function injectCSS() {
        if ($('#kk-css').length) return;
        $('head').append(`<style id="kk-css">
            .kk-topbar{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:.8em;gap:1em;z-index:5}
            .kk-topbar-title{font-size:2.05em;font-weight:900;color:#fff;flex:1}
            .kk-topbar-btns{display:flex;gap:.6em}
            .kk-btn{display:inline-flex;align-items:center;gap:.5em;padding:.85em 1.2em;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.10);color:#fff;font-size:1em;font-weight:800;cursor:pointer}
            .kk-btn.focus{background:#fff;color:#000}
            .kk-srcbar{display:flex;gap:.5em;padding:0 1.5em .8em;flex-wrap:wrap}
            .kk-srcbtn{padding:.65em 1.1em;border-radius:.8em;font-size:.98em;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.1)}
            .kk-srcbtn--on{background:rgba(99,102,241,.25);border-color:rgba(99,102,241,.5);color:#c4b5fd}
            .kk-srcbtn--off{background:rgba(255,255,255,.06);color:rgba(255,255,255,.45)}
            .kk-srcbtn.focus{background:rgba(99,102,241,.4);color:#fff;border-color:rgba(99,102,241,.7)}
            .kk-tsbar{padding:0 1.5em .6em}
            .kk-tsbadge{display:inline-flex;align-items:center;gap:.4em;padding:.5em .9em;border-radius:.7em;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.15);font-size:.9em;color:#4ade80;font-weight:700}
            .kk-row{margin-bottom:2em}.kk-row-head{display:flex;justify-content:space-between;align-items:center;padding:0 1.5em;margin-bottom:.9em;gap:.8em}
            .kk-row-title{font-size:1.6em;font-weight:900;color:#fff}
            .kk-row-more{font-size:1em;font-weight:800;padding:.75em 1.2em;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
            .kk-row-more.focus{background:#fff;color:#000}
            .kk-row-list{display:flex;gap:1em;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .2em;-webkit-overflow-scrolling:touch}
            .kk-row-list::-webkit-scrollbar,.kk-cast-list::-webkit-scrollbar,.kk-similar-list::-webkit-scrollbar{display:none}
            .kk-card{flex:0 0 auto;width:10em;cursor:pointer}.kk-card--grid{width:100%}
            .kk-card-img{position:relative;width:100%;aspect-ratio:2/3;border-radius:1em;overflow:hidden;background:#242424}
            .kk-card-img img{width:100%;height:100%;object-fit:cover}
            .kk-card-q{position:absolute;top:.5em;left:.5em;padding:.2em .5em;border-radius:.4em;font-size:.72em;font-weight:800;background:#f6c344;color:#000}
            .kk-card-ep{position:absolute;top:.5em;right:.5em;padding:.2em .5em;border-radius:.4em;font-size:.72em;font-weight:800;background:#e53935;color:#fff}
            .kk-card-name{margin-top:.65em;font-size:1.02em;line-height:1.3;font-weight:700;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
            .kk-card-year{margin-top:.2em;font-size:.9em;color:rgba(255,255,255,.5)}
            .kk-grid-wrap{padding:0 1.5em}.kk-grid-title{font-size:2em;font-weight:900;color:#fff;margin:0 0 .9em}
            .kk-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1em}
            .kk-loadmore{margin-top:1.2em;text-align:center;padding:1em;border-radius:1em;background:rgba(255,255,255,.08);color:#fff;font-size:1em;font-weight:800;cursor:pointer}
            .kk-loadmore.focus{background:#ff2332}
            .kk-detail-wrap{background:#141414;border-radius:1.5em;overflow:hidden;margin:0 0 1em}
            .kk-hero{position:relative;overflow:hidden;background:#111}.kk-hero-bg{position:relative;height:26em}.kk-hero-bg img{width:100%;height:100%;object-fit:cover}
            .kk-hero-mask{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.16) 24%,rgba(0,0,0,.36) 52%,rgba(14,14,14,.78) 78%,rgba(14,14,14,1))}
            .kk-hero-bottom{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:1.5em 1.6em 1.3em}
            .kk-hero-flex{display:block}.kk-hero-poster{display:none}.kk-hero-info{min-width:0}
            .kk-logo{max-width:36em;margin:0 0 1.1em}.kk-logo img{max-width:100%;max-height:11em;object-fit:contain;filter:drop-shadow(0 .4em 1.2em rgba(0,0,0,.45))}
            .kk-title{font-size:2.6em;line-height:1.04;font-weight:900;color:#fff;margin-bottom:.2em}
            .kk-origin{font-size:1.2em;line-height:1.5;color:rgba(255,255,255,.84)}
            .kk-body{position:relative;z-index:3;padding:1.5em 1.6em 0;background:#141414}
            .kk-metas{display:flex;flex-wrap:wrap;gap:.7em;margin:0 0 1.2em}
            .kk-meta{padding:.6em 1em;border-radius:.85em;background:rgba(255,255,255,.08);color:#fff;font-size:1.12em;font-weight:800}
            .kk-genres{display:flex;flex-wrap:wrap;gap:.7em;margin:0 0 1.2em}
            .kk-genre{padding:.58em 1em;border-radius:.85em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.95);font-size:1.05em;font-weight:700;cursor:pointer}
            .kk-genre.focus{background:rgba(255,255,255,.18)}
            .kk-crew{margin:0 0 1.2em}.kk-crew b{font-size:1.25em;font-weight:900;color:#fff;display:block;margin-bottom:.25em}.kk-crew span{font-size:1.12em;color:rgba(255,255,255,.88)}
            .kk-desc{font-size:1.25em;line-height:1.8;color:rgba(255,255,255,.94);margin:0 0 1.4em}
            .kk-actions{display:flex;flex-wrap:wrap;gap:.75em;padding:.1em 0 .2em}
            .kk-play-wrap,.kk-torrent-wrap{width:100%}
            .kk-play{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:1em;border-radius:1em;background:#ff1730;color:#fff;font-size:1.2em;font-weight:900;cursor:pointer}
            .kk-play.focus{background:#ff3047}
            .kk-torrent{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:1em;border-radius:1em;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:1.2em;font-weight:900;cursor:pointer}
            .kk-torrent.focus{background:linear-gradient(135deg,#818cf8,#a78bfa)}
            .kk-section{padding:1.3em 1.6em 0;background:#141414}
            .kk-section+.kk-section{padding-top:1.2em;border-top:1px solid rgba(255,255,255,.04)}
            .kk-body+.kk-section{border-top:1px solid rgba(255,255,255,.04)}
            .kk-section--last{padding-bottom:1.5em}
            .kk-block-title{font-size:1.85em;font-weight:900;color:#fff;margin:0 0 .85em}
            .kk-cast-list{display:flex;gap:1em;overflow-x:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x}
            .kk-cast-card{flex:0 0 auto;width:7.5em;text-align:center}
            .kk-cast-img{width:6.8em;height:6.8em;border-radius:50%;overflow:hidden;background:#2b2b2b;margin:0 auto .7em;border:2px solid rgba(255,255,255,.08)}
            .kk-cast-img img{width:100%;height:100%;object-fit:cover}.kk-cast-empty{width:100%;height:100%;background:#333;border-radius:50%}
            .kk-cast-name{font-size:1.02em;font-weight:800;color:#fff}.kk-cast-role{font-size:.9em;color:rgba(255,255,255,.6);margin-top:.15em}
            .kk-server{font-size:1.18em;font-weight:800;color:#63d471;margin:1em 0 .7em}
            .kk-eps{display:flex;flex-wrap:wrap;gap:.7em}
            .kk-ep{min-width:4.5em;text-align:center;padding:.85em 1.1em;border-radius:.8em;background:rgba(255,255,255,.09);color:#fff;font-size:1.05em;font-weight:800;cursor:pointer}
            .kk-ep.focus{background:#ff2233}
            .kk-similar{padding-bottom:1.2em}
            .kk-similar-list{display:flex;gap:1em;overflow-x:auto;-webkit-overflow-scrolling:touch}.kk-similar-list .kk-card{width:9em}
            .kk-stg-wrap{padding:1.5em}.kk-stg-title{font-size:2.1em;font-weight:900;color:#fff;margin:0 0 1.4em}
            .kk-stg-group{margin-bottom:1.8em}.kk-stg-group-title{font-size:1.35em;font-weight:900;color:#fff;margin:0 0 .85em;display:flex;align-items:center;gap:.5em}
            .kk-stg-item{display:flex;align-items:center;gap:1em;margin-bottom:.75em;padding:1em 1.2em;border-radius:1em;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06);cursor:pointer}
            .kk-stg-item.focus{background:rgba(99,102,241,.2);border-color:rgba(99,102,241,.45)}
            .kk-stg-label{flex:1}.kk-stg-label-name{font-size:1.1em;font-weight:800;color:#fff}.kk-stg-label-desc{font-size:.95em;color:rgba(255,255,255,.45);margin-top:.2em}
            .kk-stg-value{font-size:1em;font-weight:700;color:#a78bfa;max-width:13em;text-align:right;word-break:break-all}
            .kk-stg-status{margin-top:.8em;padding:.9em 1.2em;border-radius:.9em;font-size:1em;font-weight:700}
            .kk-stg-status--ok{background:rgba(74,222,128,.12);color:#4ade80}
            .kk-stg-status--err{background:rgba(248,113,113,.12);color:#f87171}
            .kk-stg-status--loading{background:rgba(255,255,255,.06);color:rgba(255,255,255,.5)}
            .kk-stg-preview{margin-top:.5em;padding:.7em .9em;border-radius:.7em;background:rgba(255,255,255,.04);font-family:monospace;font-size:.85em;color:rgba(255,255,255,.5);word-break:break-all}
            .selector,.kk-play,.kk-torrent,.kk-ep,.kk-row-more,.kk-loadmore,.kk-genre,.kk-card,.kk-btn,.kk-stg-item,.kk-srcbtn{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
            @media(orientation:landscape){.kk-hero-bg{height:29em}.kk-hero-bottom{padding:1.6em 1.9em 1.4em}.kk-hero-flex{display:flex;align-items:flex-end;gap:1.4em}.kk-hero-poster{display:block;width:10em;min-width:10em}.kk-hero-poster img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:1em;background:#242424}.kk-hero-info{flex:1;padding-bottom:.2em}.kk-logo{max-width:28em;margin-bottom:1em}.kk-logo img{max-height:8.5em}.kk-title{font-size:2.8em}.kk-body{padding:1.4em 1.9em 0}.kk-section{padding:1.3em 1.9em 0}.kk-similar-list .kk-card{width:9.2em}}
            @media(max-width:768px){.kk-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:.8em}}
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
        item = normalizeItem(item); if (!item) return $('<div></div>');
        var p = fullImg(item.poster_url || item.thumb_url);
        var c = $('<div class="kk-card selector"><div class="kk-card-img"><img src="' + p + '">' + (item.quality ? '<div class="kk-card-q">' + escapeHtml(item.quality) + '</div>' : '') + (item.episode_current ? '<div class="kk-card-ep">' + escapeHtml(item.episode_current) + '</div>' : '') + '</div><div class="kk-card-name">' + escapeHtml(item.name) + '</div><div class="kk-card-year">' + escapeHtml(item.year) + '</div></div>');
        bindEnter(c, function () { if (!item.slug) return; Lampa.Activity.push({ url: '', title: item.name || '', component: 'kkphim_detail', movie: item, page: 1 }); });
        return c;
    }

    // ===================== PLUGIN =====================
    function startPlugin() {
        injectCSS();
        addMenu();

        // ========== SETTINGS ==========
        Lampa.Component.add('kkphim_settings', function () {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            this.create = function () {
                clearScroll(scroll); var s = loadSettings(), w = $('<div class="kk-stg-wrap"></div>');
                w.append('<div class="kk-stg-title">⚙️ Cài đặt</div>');

                // Source
                var g0 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">📺 Nguồn phim</div>');
                var cur = s.source || 'ophim';
                Object.keys(SOURCES).forEach(function (k) {
                    var src = SOURCES[k], it = si(src.name, src.api, cur === k ? '✅ Đang dùng' : 'Chọn');
                    if (cur === k) it.find('.kk-stg-value').css('color', '#4ade80');
                    bindEnter(it, function () { saveSettings({ source: k }); Lampa.Noty.show('Đã chọn ' + src.name + ' - Quay lại trang chủ để áp dụng'); comp.create(); });
                    g0.append(it);
                });
                w.append(g0);

                // TorrServer
                var g1 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🖥️ TorrServer</div>');
                var hi = si('Địa chỉ', 'VD: 192.168.1.100:8090', s.torrserver_host || 'Chưa cài');
                bindEnter(hi, function () { pi('Địa chỉ TorrServer', s.torrserver_host || '', function (v) { v = (v || '').trim(); saveSettings({ torrserver_host: v }); s.torrserver_host = v; hi.find('.kk-stg-value').text(v || 'Chưa cài'); }); });
                g1.append(hi);
                var pwi = si('Mật khẩu', 'Để trống nếu không', s.torrserver_password ? '••••' : 'Không');
                bindEnter(pwi, function () { pi('Mật khẩu', s.torrserver_password || '', function (v) { v = (v || '').trim(); saveSettings({ torrserver_password: v }); s.torrserver_password = v; pwi.find('.kk-stg-value').text(v ? '••••' : 'Không'); }); });
                g1.append(pwi);
                var ti = si('🔌 Test', '', 'Nhấn'), st1 = $('<div class="kk-stg-status" style="display:none"></div>');
                bindEnter(ti, function () { testTS(st1); }); g1.append(ti).append(st1);
                w.append(g1);

                // Torrentio
                var g2 = $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">🧲 Torrentio</div>');
                var tii = si('Config', 'Paste manifest URL', s.torrentio_config ? 'Có' : 'Mặc định');
                var tp = $('<div class="kk-stg-preview">URL: ' + escapeHtml(bpUrl()) + '</div>');
                bindEnter(tii, function () { pi('Config', s.torrentio_config || '', function (v) { v = (v || '').trim(); saveSettings({ torrentio_config: v }); s.torrentio_config = v; tii.find('.kk-stg-value').text(v ? 'Có' : 'Mặc định'); tp.html('URL: ' + escapeHtml(bpUrl())); }); });
                g2.append(tii).append(tp);
                var tti = si('🧪 Test', 'Inception', 'Nhấn'), st2 = $('<div class="kk-stg-status" style="display:none"></div>');
                bindEnter(tti, function () { testTIO(st2); }); g2.append(tti).append(st2);
                w.append(g2);

                // Clear
                var g3 = $('<div class="kk-stg-group"></div>');
                var cl = si('🗑️ Xóa cài đặt', '', 'Xóa'); cl.find('.kk-stg-value').css('color', '#f87171');
                bindEnter(cl, function () { localStorage.removeItem(SETTINGS_KEY); Lampa.Noty.show('Đã xóa'); Lampa.Activity.backward(); });
                g3.append(cl); w.append(g3);

                scroll.append(w); comp.start();
            };
            function si(n, d, v) { return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">' + escapeHtml(n) + '</div>' + (d ? '<div class="kk-stg-label-desc">' + escapeHtml(d) + '</div>' : '') + '</div><div class="kk-stg-value">' + escapeHtml(v) + '</div></div>'); }
            function bpUrl() { var c = cleanTorrentioConfig(getTorrentioConfig()); return TORRENTIO_BASE + (c ? '/' + c : '') + '/stream/movie/{imdb}.json'; }
            function pi(t, c, cb) { try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: t, value: c || '', free: true, nosave: true }, cb); return; } } catch (e) {} var v = window.prompt(t, c || ''); if (v !== null) cb(v); }
            async function testTS(el) { if (!getTorrServerHost()) { el.show().attr('class', 'kk-stg-status kk-stg-status--err').text('❌ Chưa nhập'); return; } el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳...'); try { var r = await fetch(tsUrl('/echo'), { headers: tsHeaders() }); el.attr('class', 'kk-stg-status ' + (r.ok ? 'kk-stg-status--ok' : 'kk-stg-status--err')).text(r.ok ? '✅ OK!' : '❌ ' + r.status); } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || '')); } }
            async function testTIO(el) { el.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳...'); var c = cleanTorrentioConfig(getTorrentioConfig()); var u = TORRENTIO_BASE + (c ? '/' + c : '') + '/stream/movie/tt1375666.json'; try { var r = await fetch(u); if (!r.ok) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + r.status); return; } var d = await r.json(); el.attr('class', 'kk-stg-status kk-stg-status--ok').text('✅ ' + (d.streams || []).length + ' kết quả'); } catch (e) { el.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || '')); } }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {}; this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });

        // ========== MAIN ==========
        Lampa.Component.add('kkphim_main', function () {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var _loadedSource = '';

            var cats = [
                { name: 'Phim Mới', api: 'danh-sach/phim-moi-cap-nhat' },
                { name: 'Phim Bộ', api: 'v1/api/danh-sach/phim-bo' },
                { name: 'Phim Lẻ', api: 'v1/api/danh-sach/phim-le' },
                { name: 'Hoạt Hình', api: 'v1/api/danh-sach/hoat-hinh' },
                { name: 'TV Shows', api: 'v1/api/danh-sach/tv-shows' }
            ];

            this.create = function () {
                network.clear();
                this.activity.loader(true);
                clearScroll(scroll);

                var src = getSource();
                _loadedSource = src.key;

                // Topbar
                var tb = $('<div class="kk-topbar"><div class="kk-topbar-title">' + escapeHtml(src.name) + '</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍 Tìm</div><div class="kk-btn selector">⚙️</div></div></div>');
                var btns = tb.find('.kk-btn');
                bindEnter($(btns[0]), openSearch);
                bindEnter($(btns[1]), function () { Lampa.Activity.push({ url: '', title: 'Cài đặt', component: 'kkphim_settings', page: 1 }); });
                scroll.append(tb);

                // Source switcher
                var sb = $('<div class="kk-srcbar"></div>');
                Object.keys(SOURCES).forEach(function (k) {
                    var s = SOURCES[k], active = k === src.key;
                    var btn = $('<div class="kk-srcbtn selector ' + (active ? 'kk-srcbtn--on' : 'kk-srcbtn--off') + '">' + escapeHtml(s.name) + '</div>');
                    bindEnter(btn, function () {
                        if (active) return;
                        saveSettings({ source: k });
                        Lampa.Noty.show('Chuyển sang ' + s.name);
                        comp.create();
                    });
                    sb.append(btn);
                });
                scroll.append(sb);

                // TS badge
                var host = getTorrServerHost();
                if (host) scroll.append($('<div class="kk-tsbar"><div class="kk-tsbadge">🖥️ ' + escapeHtml(host) + '</div></div>'));

                // Categories
                var loaded = 0;
                cats.forEach(function (cat) {
                    network.silent(SRC_API() + cat.api + '?page=1', function (res) {
                        var list = parseList(res);
                        if (list.length) {
                            var row = $('<div class="kk-row"></div>'), more = $('<div class="kk-row-more selector">Xem thêm</div>'), rl = $('<div class="kk-row-list"></div>');
                            bindEnter(more, function () { Lampa.Activity.push({ url: '', title: cat.name, component: 'kkphim_category', cat: cat, page_num: 1, mode: 'api' }); });
                            list.slice(0, 12).forEach(function (i) { rl.append(mkCard(i)); });
                            row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">' + escapeHtml(cat.name) + '</div>').append(more)).append(rl);
                            scroll.append(row);
                        }
                        loaded++; if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); }
                    }, function () { loaded++; if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); } });
                });
            };

            this.start = function () {
                // Auto reload nếu source thay đổi
                var currentSrc = getSourceKey();
                if (_loadedSource && _loadedSource !== currentSrc) {
                    comp.create();
                    return;
                }
                applyCtrl(scroll);
                enableScroll(scroll);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // ========== CATEGORY ==========
        Lampa.Component.add('kkphim_category', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var page = obj.page_num || 1, title = obj.title || (obj.cat && obj.cat.name) || '', mode = obj.mode || 'api', apiPath = obj.cat ? obj.cat.api : null, catSlug = obj.category_slug || '';
            var grid = $('<div class="kk-grid"></div>'), lm = $('<div class="kk-loadmore selector">Tải thêm</div>'), loading = false, hasMore = true;
            this.create = function () {
                this.activity.loader(true); clearScroll(scroll);
                scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">' + escapeHtml(title) + '</div>').append(grid).append(lm));
                bindEnter(lm, function () { if (!loading && hasMore) doLoad(); }); doLoad();
            };
            function hr(res) { var list = parseList(res); if (!list.length) { hasMore = false; lm.text('Hết'); comp.activity.loader(false); loading = false; comp.start(); return; } list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); }); page++; loading = false; lm.text('Tải thêm'); comp.activity.loader(false); comp.start(); }
            function doLoad() {
                loading = true; lm.text('Đang tải...');
                var url = (mode === 'category' && catSlug) ? SRC_API() + 'v1/api/the-loai/' + catSlug + '?page=' + page : SRC_API() + apiPath + '?page=' + page;
                network.silent(url, hr, function () {
                    if (mode === 'category' && catSlug) network.silent(SRC_API() + 'the-loai/' + catSlug + '?page=' + page, hr, function () { loading = false; lm.text('Lỗi'); comp.activity.loader(false); });
                    else { loading = false; lm.text('Lỗi'); comp.activity.loader(false); }
                });
            }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {}; this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // ========== SEARCH ==========
        Lampa.Component.add('kkphim_search', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var kw = obj.keyword || '', page = obj.page_num || 1;
            var grid = $('<div class="kk-grid"></div>'), lm = $('<div class="kk-loadmore selector">Tải thêm</div>'), loading = false, hasMore = true;
            this.create = function () {
                this.activity.loader(true); clearScroll(scroll);
                scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 ' + escapeHtml(kw) + ' (' + getSource().name + ')</div>').append(grid).append(lm));
                bindEnter(lm, function () { if (!loading && hasMore) doLoad(); }); doLoad();
            };
            function hr(res) { var list = parseList(res); if (!list.length) { hasMore = false; lm.text(page === 1 ? 'Không có' : 'Hết'); comp.activity.loader(false); loading = false; comp.start(); return; } list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); }); page++; loading = false; lm.text('Tải thêm'); comp.activity.loader(false); comp.start(); }
            function doLoad() {
                loading = true; lm.text('Đang tải...');
                network.silent(SRC_API() + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, hr, function () {
                    network.silent(SRC_API() + 'tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, hr, function () { loading = false; lm.text('Lỗi'); comp.activity.loader(false); });
                });
            }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {}; this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // ========== DETAIL ==========
        Lampa.Component.add('kkphim_detail', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true });
            var movie = normalizeItem(obj.movie), comp = this, rendered = false;

            this.create = function () {
                this.activity.loader(true); clearScroll(scroll); rendered = false;
                if (!movie || !movie.slug) { this.activity.loader(false); scroll.append('<div class="empty__body"><div class="empty__title">Không có dữ liệu</div></div>'); comp.start(); return; }
                network.silent(SRC_API() + 'phim/' + movie.slug, function (res) {
                    if (rendered) return;
                    loadAll(res.movie || res || {}, res.episodes || []);
                }, function () { comp.activity.loader(false); Lampa.Noty.show('Lỗi'); });
            };

            async function loadAll(data, episodes) {
                data = normalizeItem(data);
                try {
                    var tid = getTmdbId(data), tt = detectType(data), tmdb = null, logos = null;
                    if (tid) {
                        try { tmdb = await tmdbFetch('/' + tt + '/' + tid + '?language=vi-VN&append_to_response=credits,images'); } catch (e) { try { tmdb = await tmdbFetch('/' + tt + '/' + tid + '?language=en-US&append_to_response=credits,images'); } catch (e2) {} }
                        try { logos = await tmdbFetch('/' + tt + '/' + tid + '/images'); } catch (e3) {}
                    }
                    if (!rendered) { build(data, episodes, tmdb, logos, tt); rendered = true; }
                } catch (e) { if (!rendered) { build(data, episodes, null, null, detectType(data)); rendered = true; } }
                comp.activity.loader(false); comp.start();
            }

            function build(data, episodes, tmdb, logos, ttype) {
                clearScroll(scroll);
                var bk = fullImg(data.thumb_url || data.poster_url), ps = fullImg(data.poster_url || data.thumb_url);
                var t = data.name || '', o = data.origin_name || '', d = cleanDesc(data.content);
                var v = (data.tmdb && data.tmdb.vote_average) || 'N/A', y = data.year || '', rt = data.time || '', epCur = data.episode_current || '';
                var ghtml = '', castH = '', dirH = '', crewH = '', logoH = '', dir = '';

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
                        castH = mkPeople((tmdb.credits.cast || []).slice(0, 12), 'character');
                        var dirs = (tmdb.credits.crew || []).filter(function (c) { return c.job === 'Director' || c.job === 'Creator' || c.job === 'Series Director'; });
                        dirs = dirs.filter(function (p, i, a) { return a.findIndex(function (x) { return x.name === p.name; }) === i; }).slice(0, 10);
                        if (dirs.length) { dir = dirs.map(function (c) { return c.name; }).join(', '); dirH = mkPeople(dirs.map(function (c) { return { name: c.name, profile_path: c.profile_path, job: c.job || 'Đạo diễn' }; }), 'job'); }
                    }
                }

                var pCats = data.category || [];
                if (pCats.length) ghtml = pCats.map(function (g) { return '<span class="kk-genre selector" data-slug="' + escapeHtml(g.slug || '') + '" data-title="' + escapeHtml(g.name || '') + '">' + escapeHtml(g.name || '') + '</span>'; }).join('');
                else if (tmdb && tmdb.genres) ghtml = tmdb.genres.map(function (g) { return '<span class="kk-genre">' + escapeHtml(g.name || '') + '</span>'; }).join('');
                if (data.director && !dir) dir = Array.isArray(data.director) ? data.director.join(', ') : data.director;
                if (dir && !dirH) crewH = '<div class="kk-crew"><b>Đạo diễn</b><span>' + escapeHtml(dir) + '</span></div>';

                var hasTmdb = !!getTmdbId(data);
                var tBtn = hasTmdb ? '<div class="kk-torrent-wrap"><div class="kk-torrent selector">🧲 Torrent' + (getTorrServerHost() ? ' → TS' : '') + '</div></div>' : '';
                var tH = logoH ? '' : '<div class="kk-title">' + escapeHtml(t) + '</div>';

                var hero = $('<div class="kk-hero"><div class="kk-hero-bg"><img src="' + bk + '"><div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster"><img src="' + ps + '"></div><div class="kk-hero-info">' + logoH + tH + '<div class="kk-origin">' + escapeHtml(o) + '</div></div></div></div></div>');
                var body = $('<div class="kk-body"><div class="kk-metas"><span class="kk-meta">⭐ ' + escapeHtml(v) + '</span>' + (y ? '<span class="kk-meta">📅 ' + escapeHtml(y) + '</span>' : '') + (rt ? '<span class="kk-meta">⏱ ' + escapeHtml(rt) + '</span>' : '') + (epCur ? '<span class="kk-meta">🎬 ' + escapeHtml(epCur) + '</span>' : '') + '</div><div class="kk-genres">' + ghtml + '</div>' + crewH + '<div class="kk-desc">' + formatText(d) + '</div><div class="kk-actions"><div class="kk-play-wrap"><div class="kk-play selector">▶ Xem phim</div></div>' + tBtn + '</div></div>');

                bindEnter(body.find('.kk-play'), function () { var f = getFirstEp(episodes); if (f) playEp(f); else Lampa.Noty.show('Không có tập'); });
                if (hasTmdb) bindEnter(body.find('.kk-torrent'), function () { openTorrentSearch(getTmdbId(data), ttype, data, episodes, ps); });

                body.find('.kk-genre[data-slug]').each(function () {
                    var g = $(this);
                    bindEnter(g, function () { var slug = g.attr('data-slug'); if (slug) Lampa.Activity.push({ url: '', title: g.attr('data-title') || '', component: 'kkphim_category', mode: 'category', category_slug: slug, page_num: 1 }); });
                });

                var dw = $('<div class="kk-detail-wrap"></div>').append(hero).append(body);
                if (dirH) dw.append('<div class="kk-section"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">' + dirH + '</div></div>');
                if (castH) dw.append('<div class="kk-section"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">' + castH + '</div></div>');

                if (episodes && episodes.length) {
                    var ew = $('<div class="kk-section"></div>').append('<div class="kk-block-title">Danh sách tập</div>');
                    episodes.forEach(function (sv) {
                        ew.append('<div class="kk-server">' + escapeHtml(sv.server_name || '') + '</div>');
                        var g = $('<div class="kk-eps"></div>');
                        (sv.server_data || []).forEach(function (ep) { var b = $('<div class="kk-ep selector">' + escapeHtml(ep.name || '') + '</div>'); bindEnter(b, function () { playEp(ep); }); g.append(b); });
                        ew.append(g);
                    });
                    dw.append(ew);
                }
                scroll.append(dw); loadSim(data, dw);
            }

            function loadSim(data, dw) {
                var cats = data.category || [];
                if (!cats.length || !cats[0].slug) { dw.append('<div class="kk-section kk-section--last"></div>'); return; }
                network.silent(SRC_API() + 'v1/api/the-loai/' + cats[0].slug + '?page=1', function (r) { hSim(r, dw); }, function () { network.silent(SRC_API() + 'the-loai/' + cats[0].slug + '?page=1', function (r2) { hSim(r2, dw); }, function () { dw.append('<div class="kk-section kk-section--last"></div>'); }); });
            }
            function hSim(res, dw) {
                var list = parseList(res).filter(function (i) { return i.slug !== movie.slug; }).slice(0, 12);
                if (!list.length) { dw.append('<div class="kk-section kk-section--last"></div>'); return; }
                var r = $('<div class="kk-section kk-section--last kk-similar"></div>').append('<div class="kk-block-title">Phim liên quan</div>');
                var rl = $('<div class="kk-similar-list"></div>'); list.forEach(function (i) { rl.append(mkCard(i)); }); r.append(rl); dw.append(r);
            }
            function playEp(ep) { var l = ep.link_m3u8 || ep.link_embed || ''; if (!l) { Lampa.Noty.show('Không có link'); return; } Lampa.Player.play({ title: (movie.name || '') + ' - ' + (ep.name || ''), url: l }); }

            this.start = function () { applyCtrl(scroll); enableScroll(scroll); };
            this.pause = function () {}; this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();