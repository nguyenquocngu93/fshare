(function () {
    'use strict';

    if (window.plugin_torrentplus_ready) return;
    window.plugin_torrentplus_ready = true;

    var STG_PREFIX = 'tplus_';

    /* ============================================================
       STORAGE
    ============================================================ */
    function getSetting(key) { return Lampa.Storage.get(STG_PREFIX + key, ''); }

    function getTsUrl() {
        // Dùng chung TorrServer với plugin KKPhim nếu có
        var url = getSetting('torrserver_url')
               || Lampa.Storage.get('kkphim_torrserver_url', '')
               || '';
        if (!url) return null;
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
        return url;
    }
    function getTsPass() {
        return getSetting('torrserver_pass')
            || Lampa.Storage.get('kkphim_torrserver_pass', '')
            || '';
    }
    function getJackettUrl() {
        var url = getSetting('jackett_url') || '';
        if (!url) return '';
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        return url;
    }
    function getJackettKey() { return getSetting('jackett_key') || ''; }

    /* ============================================================
       HELPERS
    ============================================================ */
    function padZero(n) { return (n < 10 ? '0' : '') + n; }

    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
            '&dn=' + encodeURIComponent(name || '') +
            '&tr=' + encodeURIComponent('udp://tracker.opentrackr.org:1337/announce') +
            '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce') +
            '&tr=' + encodeURIComponent('udp://tracker.torrent.eu.org:451/announce') +
            '&tr=' + encodeURIComponent('udp://tracker.tiny-vps.com:6969/announce') +
            '&tr=' + encodeURIComponent('udp://exodus.desync.com:6969/announce');
    }

    function parseSize(str) {
        if (!str) return 0;
        var m = String(str).match(/([\d.,]+)\s*(TB|GB|MB|KB|B)/i);
        if (!m) return 0;
        var n = parseFloat(m[1].replace(',', '.'));
        switch (m[2].toUpperCase()) {
            case 'TB': return n * 1e12;
            case 'GB': return n * 1e9;
            case 'MB': return n * 1e6;
            case 'KB': return n * 1e3;
        }
        return n;
    }

    function fmtBytes(b) {
        b = parseInt(b) || 0;
        if (b >= 1e12) return (b / 1e12).toFixed(2) + ' TB';
        if (b >= 1e9)  return (b / 1e9).toFixed(2)  + ' GB';
        if (b >= 1e6)  return (b / 1e6).toFixed(0)  + ' MB';
        if (b >= 1e3)  return (b / 1e3).toFixed(0)  + ' KB';
        return b + ' B';
    }

    function getMediaType(card) {
        if (card.number_of_seasons || card.first_air_date ||
            card.type === 'tv' || card.type === 'series') return 'series';
        return 'movie';
    }

    function getQuality(title) {
        var m = (title || '').match(
            /\b(2160p|4K|UHD|1080p|1080i|720p|480p|BluRay|BDRip|BRRip|WEB-?DL|WEBRip|HDRip|REMUX|HDTV|DVDRip)\b/i
        );
        return m ? m[1].toUpperCase() : '';
    }

    function reguest(url, onOk, onFail) {
        var net = new Lampa.Reguest();
        net.timeout(20000);
        net.silent(url,
            function (data) { onOk(data); },
            function (a, b) {
                var code = (a && a.status) ? a.status : 0;
                (onFail || function () {})(code ? 'HTTP ' + code : (b || 'Error'));
            }
        );
    }

    /* ============================================================
       TORRSERVER
    ============================================================ */
    function tsHeaders() {
        var h = { 'Content-Type': 'application/json' };
        var p = getTsPass();
        if (p) h['Authorization'] = 'Basic ' + btoa('admin:' + p);
        return h;
    }

    function tsAdd(magnet, title, onDone, onFail) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
        jQuery.ajax({
            url:      tsUrl + '/torrents',
            type:     'POST',
            headers:  tsHeaders(),
            data:     JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
            dataType: 'json',
            timeout:  15000,
            success:  function (d)  { onDone((d && d.hash) || ''); },
            error:    function ()   { onFail && onFail(); }
        });
    }

    function tsGetFiles(hash, onDone) {
        var tsUrl = getTsUrl();
        jQuery.ajax({
            url:      tsUrl + '/torrents',
            type:     'POST',
            headers:  tsHeaders(),
            data:     JSON.stringify({ action: 'get', hash: hash }),
            dataType: 'json',
            timeout:  15000,
            success: function (data) {
                var files = ((data && data.file_stats) || [])
                    .filter(function (f) {
                        return /\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/i.test(f.path || '');
                    })
                    .sort(function (a, b) {
                        return (a.path || '').localeCompare(b.path || '', undefined, { numeric: true });
                    });
                onDone(files, data);
            },
            error: function () { onDone([], null); }
        });
    }

    function tsPlayFile(hash, fileId, title, card) {
        var tsUrl = getTsUrl();
        var url   = tsUrl + '/stream/' + encodeURIComponent(title || 'video') +
                    '?link=' + hash + '&index=' + fileId + '&play';
        Lampa.Player.play({ title: title, url: url, poster: card.poster || '', movie: card });
        try {
            if (Lampa.Favorite && Lampa.Favorite.add) Lampa.Favorite.add('history', card);
        } catch(e) {}
    }

    function tsAddAndPickFile(magnet, hash, torrentTitle, playTitle, card) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
        Lampa.Noty.show('Đang thêm vào TorrServer...');
        tsAdd(magnet, torrentTitle, function (retHash) {
            var h = retHash || hash;
            if (!h) { Lampa.Noty.show('Không lấy được hash'); return; }
            Lampa.Noty.show('Đang lấy danh sách file...');
            var tries = 0;
            function tryGet() {
                tries++;
                tsGetFiles(h, function (files) {
                    if (!files.length && tries < 6) { setTimeout(tryGet, 2000); return; }
                    if (!files.length) { tsPlayFile(h, 0, playTitle, card); return; }
                    if (files.length === 1) { tsPlayFile(h, files[0].id || 0, playTitle, card); return; }
                    showFileList(files, h, playTitle, card);
                });
            }
            setTimeout(tryGet, 2000);
        }, function () {
            Lampa.Noty.show('TorrServer lỗi...');
            if (hash) tsPlayFile(hash, 0, playTitle, card);
        });
    }

    function showFileList(files, hash, playTitle, card) {
        Lampa.Select.show({
            title: '📂 ' + playTitle,
            items: files.map(function (f) {
                var name = (f.path || '').split('/').pop() || 'File';
                var em   = name.match(/[Ee](\d+)|[Сс](\d+)|\b(\d{2,3})\b/);
                return {
                    title:    name + (em ? ' [Ep ' + (em[1] || em[2] || em[3]) + ']' : ''),
                    subtitle: f.length ? fmtBytes(f.length) : '',
                    file:     f
                };
            }),
            onSelect: function (item) {
                tsPlayFile(hash, item.file.id || 0,
                    playTitle + ' — ' + (item.file.path || '').split('/').pop(),
                    card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       TORRENT SOURCES — copy y chang từ code hoạt động
    ============================================================ */
    function normResult(obj) {
        var hash = (obj.hash || '').toLowerCase()
            .replace(/^urn:btih:/i, '')
            .replace(/[^a-f0-9]/g, '');
        if (hash.length !== 40 && hash.length !== 32) return null;
        if (!obj.title || !String(obj.title).trim()) return null;
        return {
            title:   String(obj.title).trim(),
            seeds:   parseInt(obj.seeds)   || 0,
            peers:   parseInt(obj.peers)   || 0,
            size:    obj.size    || '',
            sizeNum: parseInt(obj.sizeNum) || parseSize(obj.size || ''),
            tracker: obj.tracker || '?',
            quality: getQuality(obj.title),
            hash:    hash,
            magnet:  obj.magnet || makeMagnet(hash, obj.title)
        };
    }

    /* KNABEN — GET, đúng endpoint */
    function fetchKnaben(query, cb) {
        var url = 'https://knaben.eu/api/v1' +
            '?search='             + encodeURIComponent(query) +
            '&orderBy=seeders'     +
            '&orderDirection=desc' +
            '&size=50'             +
            '&categories[]=200'   +
            '&categories[]=205'   +
            '&categories[]=207'   +
            '&categories[]=500'   +
            '&categories[]=501';

        reguest(url, function (data) {
            var raw  = typeof data === 'string' ? JSON.parse(data) : data;
            var hits = (raw && raw.hits) ? raw.hits : (Array.isArray(raw) ? raw : []);
            var results = hits.map(function (h) {
                var bytes = parseInt(h.bytes || h.size_bytes || 0);
                return normResult({
                    title:   h.title || h.name || '',
                    hash:    h.infohash || h.info_hash || h.hash || '',
                    seeds:   h.seeders  || h.seeds    || 0,
                    peers:   h.leechers || h.peers    || 0,
                    size:    bytes ? fmtBytes(bytes) : (h.size || ''),
                    sizeNum: bytes,
                    tracker: 'Knaben'
                });
            }).filter(Boolean);
            cb(results);
        }, function (e) { console.warn('[Knaben]', e); cb([]); });
    }

    /* APIBAY (The Pirate Bay) */
    function fetchApibay(query, cb) {
        var url = 'https://apibay.org/q.php?q=' + encodeURIComponent(query) + '&cat=0';
        reguest(url, function (data) {
            var raw = typeof data === 'string' ? JSON.parse(data) : data;
            if (!Array.isArray(raw)) { cb([]); return; }
            var results = raw
                .filter(function (r) { return r.id && r.id !== '0' && r.info_hash; })
                .map(function (r) {
                    var bytes = parseInt(r.size) || 0;
                    return normResult({
                        title:   r.name || '',
                        hash:    r.info_hash || '',
                        seeds:   parseInt(r.seeders)  || 0,
                        peers:   parseInt(r.leechers) || 0,
                        size:    bytes ? fmtBytes(bytes) : '',
                        sizeNum: bytes,
                        tracker: 'TPB'
                    });
                }).filter(Boolean);
            cb(results);
        }, function (e) { console.warn('[Apibay]', e); cb([]); });
    }

    /* YTS — chỉ phim lẻ */
    function fetchYts(query, cb) {
        var url = 'https://yts.mx/api/v2/list_movies.json' +
            '?query_term=' + encodeURIComponent(query) +
            '&sort_by=seeds&limit=20';
        reguest(url, function (data) {
            var raw    = typeof data === 'string' ? JSON.parse(data) : data;
            var movies = (raw && raw.data && raw.data.movies) ? raw.data.movies : [];
            var results = [];
            movies.forEach(function (movie) {
                (movie.torrents || []).forEach(function (t) {
                    var bytes = parseInt(t.size_bytes) || 0;
                    var r = normResult({
                        title:   movie.title_english + ' (' + movie.year + ') ' +
                                 (t.quality || '') + ' ' + (t.type || '') + ' [YTS]',
                        hash:    t.hash || '',
                        seeds:   parseInt(t.seeds)  || 0,
                        peers:   parseInt(t.peers)  || 0,
                        size:    bytes ? fmtBytes(bytes) : (t.size || ''),
                        sizeNum: bytes,
                        tracker: 'YTS'
                    });
                    if (r) results.push(r);
                });
            });
            cb(results);
        }, function (e) { console.warn('[YTS]', e); cb([]); });
    }

    /* TORRENTS-CSV */
    function fetchTorrentsCSV(query, cb) {
        var url = 'https://torrents-csv.com/service/search' +
            '?q=' + encodeURIComponent(query) + '&size=50&page=1';
        reguest(url, function (data) {
            var raw  = typeof data === 'string' ? JSON.parse(data) : data;
            var list = (raw && raw.torrents) ? raw.torrents : [];
            var results = list.map(function (t) {
                var bytes = parseInt(t.size_bytes || t.size || 0);
                return normResult({
                    title:   t.name || '',
                    hash:    t.infohash || t.info_hash || '',
                    seeds:   parseInt(t.seeders)  || 0,
                    peers:   parseInt(t.leechers) || 0,
                    size:    bytes ? fmtBytes(bytes) : '',
                    sizeNum: bytes,
                    tracker: 'TorrCSV'
                });
            }).filter(Boolean);
            cb(results);
        }, function (e) { console.warn('[TorrentsCSV]', e); cb([]); });
    }

    /* JACKETT */
    function fetchJackett(query, cb) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url || !key) { cb([]); return; }
        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' +
            encodeURIComponent(key) + '&Query=' + encodeURIComponent(query) +
            '&Category[]=2000&Category[]=5000',
            function (data) {
                var d = typeof data === 'string' ? JSON.parse(data) : data;
                var results = ((d && d.Results) || []).map(function (r) {
                    var link = r.MagnetUri || r.Link || '';
                    if (!link) return null;
                    var hm = link.match(/btih:([a-f0-9]+)/i);
                    return normResult({
                        title:   r.Title || '',
                        hash:    hm ? hm[1] : '',
                        seeds:   parseInt(r.Seeders) || 0,
                        peers:   parseInt(r.Peers)   || 0,
                        size:    fmtBytes(parseInt(r.Size) || 0),
                        sizeNum: parseInt(r.Size) || 0,
                        tracker: r.Tracker || 'Jackett',
                        magnet:  link
                    });
                }).filter(Boolean);
                cb(results);
            },
            function (e) { console.warn('[Jackett]', e); cb([]); }
        );
    }

    /* ============================================================
       MULTI SEARCH
    ============================================================ */
    var QUALITY_ORDER = ['2160P','4K','UHD','REMUX','1080P','1080I','720P','480P'];

    function searchAllSources(query, isMovie, onDone) {
        var combined = [], seenHash = {};
        var sources = [
            fetchKnaben,
            fetchApibay,
            fetchTorrentsCSV
        ];
        if (isMovie) sources.push(fetchYts);

        var total = sources.length, done = 0;

        function finish(results) {
            results.forEach(function (r) {
                if (!seenHash[r.hash]) {
                    seenHash[r.hash] = true;
                    combined.push(r);
                }
            });
            done++;
            if (done >= total) {
                combined.sort(function (a, b) {
                    if (b.seeds !== a.seeds) return b.seeds - a.seeds;
                    return b.sizeNum - a.sizeNum;
                });
                onDone(combined);
            }
        }

        sources.forEach(function (fn) {
            try { fn(query, function (r) { finish(r); }); }
            catch(e) { finish([]); }
        });
    }

    function showTorrentMenu(results, movieTitle, card) {
        if (!results || !results.length) {
            Lampa.Noty.show('Không tìm thấy torrent nào');
            return;
        }

        var byQ = {}, allQ = [];
        results.forEach(function (r) {
            var q = r.quality || 'OTHER';
            if (!byQ[q]) { byQ[q] = []; allQ.push(q); }
            byQ[q].push(r);
        });

        allQ.sort(function (a, b) {
            var ia = QUALITY_ORDER.indexOf(a), ib = QUALITY_ORDER.indexOf(b);
            if (ia === -1) ia = 99;
            if (ib === -1) ib = 99;
            return ia - ib;
        });

        var items = [];
        allQ.forEach(function (q) {
            var group = byQ[q];
            items.push({ title: '── ' + q + ' · ' + group.length + ' ──', separator: true });
            group.slice(0, 15).forEach(function (r) {
                var name = r.title.length > 55 ? r.title.slice(0, 52) + '…' : r.title;
                items.push({
                    title:    '[' + r.tracker + '] ' + name,
                    subtitle: (r.seeds > 0 ? '👤 ' + r.seeds : '⚠ 0 seed') +
                              (r.peers > 0 ? '/' + r.peers   : '') +
                              (r.size      ? '  💾 ' + r.size : ''),
                    r: r
                });
            });
        });

        Lampa.Select.show({
            title: '🧲 ' + movieTitle + ' (' + results.length + ')',
            items: items,
            onSelect: function (item) {
                if (item.separator) return;
                var r     = item.r;
                var tsUrl = getTsUrl();
                if (!r.hash) { Lampa.Noty.show('Không có hash'); return; }
                if (!tsUrl)  { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
                tsAddAndPickFile(r.magnet, r.hash, r.title, movieTitle, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       ENTRY POINTS
    ============================================================ */
    function searchTorrentMulti(card) {
        var title   = card.title || card.name || '';
        var orig    = card.original_title || card.original_name || title;
        var year    = (card.release_date || card.first_air_date || '').slice(0, 4);
        var isMovie = getMediaType(card) === 'movie';
        var query   = (orig || title) + (isMovie && year ? ' ' + year : '');

        Lampa.Noty.show('🔍 Đang tìm: ' + query);
        searchAllSources(query, isMovie, function (results) {
            if (!results.length && orig !== title) {
                var q2 = title + (isMovie && year ? ' ' + year : '');
                Lampa.Noty.show('Thử lại: ' + q2);
                searchAllSources(q2, isMovie, function (r2) {
                    showTorrentMenu(r2, title, card);
                });
            } else {
                showTorrentMenu(results, title, card);
            }
        });
    }

    function searchJackett(card) {
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query = (orig || title) + (year ? ' ' + year : '');

        var url = getJackettUrl(), key = getJackettKey();
        if (!url || !key) { Lampa.Noty.show('Vào Settings → cấu hình Jackett!'); return; }

        Lampa.Noty.show('Jackett: đang tìm...');
        fetchJackett(query, function (results) {
            if (!results.length && orig && orig !== title) {
                fetchJackett(title + (year ? ' ' + year : ''), function (r2) {
                    showTorrentMenu(r2, title, card);
                });
            } else {
                showTorrentMenu(results, title, card);
            }
        });
    }

    function getSeasonEpCount(card, s) {
        if (card.seasons) {
            var f = card.seasons.filter(function (x) { return x.season_number === s; })[0];
            if (f && f.episode_count) return f.episode_count;
        }
        return 50;
    }

    /* Series: chọn season + episode rồi search */
    function askEpisodeThenSearch(card, onPick) {
        var total = card.number_of_seasons || 1;

        function pickEp(s) {
            var totalEps = getSeasonEpCount(card, s);
            var ee = [];
            for (var e = 1; e <= totalEps; e++) {
                ee.push({ title: 'S' + padZero(s) + 'E' + padZero(e), s: s, e: e });
            }
            Lampa.Select.show({
                title:    'Season ' + s + ' — Chọn tập',
                items:    ee,
                onSelect: function (item) { onPick(item.s, item.e); },
                onBack:   function ()     { Lampa.Controller.toggle('full'); }
            });
        }

        if (total === 1) { pickEp(1); return; }
        var ss = [];
        for (var s = 1; s <= total; s++) {
            ss.push({ title: 'Season ' + s + ' (' + getSeasonEpCount(card, s) + ' tập)', s: s });
        }
        Lampa.Select.show({
            title:    'Chọn Season',
            items:    ss,
            onSelect: function (item) { pickEp(item.s); },
            onBack:   function ()     { Lampa.Controller.toggle('full'); }
        });
    }

    function searchSeriesMulti(card) {
        askEpisodeThenSearch(card, function (s, ep) {
            var title   = card.title || card.name || '';
            var orig    = card.original_title || card.original_name || title;
            var query   = (orig || title) + ' S' + padZero(s) + 'E' + padZero(ep);
            var display = title + ' S' + padZero(s) + 'E' + padZero(ep);

            Lampa.Noty.show('🔍 Đang tìm: ' + query);
            searchAllSources(query, false, function (results) {
                if (!results.length && orig !== title) {
                    var q2 = title + ' S' + padZero(s) + 'E' + padZero(ep);
                    searchAllSources(q2, false, function (r2) {
                        showTorrentMenu(r2, display, card);
                    });
                } else {
                    showTorrentMenu(results, display, card);
                }
            });
        });
    }

    function searchSeriesJackett(card) {
        askEpisodeThenSearch(card, function (s, ep) {
            var title = card.title || card.name || '';
            var orig  = card.original_title || card.original_name || '';
            var query = (orig || title) + ' S' + padZero(s) + 'E' + padZero(ep);
            var display = title + ' S' + padZero(s) + 'E' + padZero(ep);

            var url = getJackettUrl(), key = getJackettKey();
            if (!url || !key) { Lampa.Noty.show('Vào Settings → cấu hình Jackett!'); return; }

            Lampa.Noty.show('Jackett: đang tìm...');
            fetchJackett(query, function (results) {
                showTorrentMenu(results, display, card);
            });
        });
    }

    /* ============================================================
       SETTINGS
    ============================================================ */
    function initSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;
        Lampa.SettingsApi.addComponent({
            component: 'torrentplus',
            name:      'Torrent+',
            icon: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24">' +
                  '<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>' +
                  '<line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="1.5"/>' +
                  '<line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" stroke-width="2"/>' +
                  '<line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="2"/></svg>'
        });
        setTimeout(buildSettings, 200);
    }

    function buildSettings() {
        if (!Lampa.SettingsApi) return;
        var params = [
            {
                name: 'torrserver_url', type: 'input',
                field: {
                    name: 'TorrServer URL',
                    description: 'Để trống nếu đã cấu hình ở plugin KKPhim'
                }
            },
            {
                name: 'torrserver_pass', type: 'input',
                field: { name: 'TorrServer Password', description: 'Để trống nếu không có' }
            },
            {
                name: 'test_ts', type: 'button',
                field: { name: '🧪 Test TorrServer', description: 'Kiểm tra kết nối' },
                onChange: function () {
                    var u = getTsUrl();
                    if (!u) { Lampa.Noty.show('Chưa có URL TorrServer!'); return; }
                    Lampa.Noty.show('Đang test...');
                    jQuery.ajax({
                        url: u + '/echo', type: 'GET', timeout: 5000,
                        success: function ()    { Lampa.Noty.show('✅ TorrServer OK!'); },
                        error:   function (xhr) {
                            Lampa.Noty.show(xhr.status === 200 ? '✅ OK!' : '❌ ' + (xhr.status || 'timeout'));
                        }
                    });
                }
            },
            {
                name: 'jackett_url', type: 'input',
                field: { name: 'Jackett URL', description: 'VD: https://jac.red' }
            },
            {
                name: 'jackett_key', type: 'input',
                field: { name: 'Jackett API Key', description: 'API Key từ tài khoản' }
            },
            {
                name: 'test_jack', type: 'button',
                field: { name: '🧪 Test Jackett', description: 'Kiểm tra kết nối' },
                onChange: function () {
                    var u = getJackettUrl(), k = getJackettKey();
                    if (!u) { Lampa.Noty.show('Chưa nhập URL!'); return; }
                    if (!k) { Lampa.Noty.show('Chưa nhập Key!'); return; }
                    Lampa.Noty.show('Đang test...');
                    reguest(
                        u + '/api/v2.0/indexers/all/results?apikey=' + k + '&Query=test',
                        function ()  { Lampa.Noty.show('✅ Jackett OK!'); },
                        function (e) { Lampa.Noty.show('❌ ' + e); }
                    );
                }
            }
        ];

        params.forEach(function (p) {
            Lampa.SettingsApi.addParam({
                component: 'torrentplus',
                param: {
                    name:    STG_PREFIX + p.name,
                    type:    p.type,
                    values:  p.values  || '',
                    default: p.default || ''
                },
                field:    p.field,
                onChange: p.onChange || function (v) { Lampa.Storage.set(STG_PREFIX + p.name, v); }
            });
        });
    }

    /* ============================================================
       HOOK UI — thêm nút Torrent+ và Jackett
    ============================================================ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        var card = (e.data && e.data.movie) ? e.data.movie : (e.object && e.object.card);
        if (!card) return;

        var $ctx;
        if (e.object && e.object.activity)    $ctx = e.object.activity.render();
        else if (e.object && e.object.render) $ctx = e.object.render();
        else                                   $ctx = jQuery('body');

        if ($ctx.find('.view--tplus-multi').length) return;

        var isSeries = getMediaType(card) === 'series';

        function mkBtn(cls, svgIn, label, fn) {
            var $b = jQuery(
                '<div class="full-start__button selector ' + cls + '">' +
                '<svg viewBox="0 0 24 24" fill="none" width="44" height="44" ' +
                'stroke="currentColor" stroke-width="1.5" ' +
                'stroke-linecap="round" stroke-linejoin="round">' +
                svgIn + '</svg><span>' + label + '</span></div>'
            );
            $b.on('hover:enter', fn);
            return $b;
        }

        /* Torrent+ */
        var $mt = mkBtn('view--tplus-multi',
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
            '<line x1="11" y1="8"  x2="11" y2="14"/>' +
            '<line x1="8"  y1="11" x2="14" y2="11"/>',
            'Torrent+',
            function () {
                if (isSeries) searchSeriesMulti(card);
                else searchTorrentMulti(card);
            }
        );

        /* Jackett */
        var $jk = mkBtn('view--tplus-jackett',
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>',
            'Jackett',
            function () {
                if (isSeries) searchSeriesJackett(card);
                else searchJackett(card);
            }
        );

        var $anchor = $ctx.find('.view--torrent');
        if ($anchor.length) {
            $anchor.after($jk).after($mt);
        } else {
            $ctx.find('.full-start__buttons').append($mt).append($jk);
        }
    });

    /* ============================================================
       START
    ============================================================ */
    function start() {
        initSettings();
        console.log('[Torrent+] v1.0 — Knaben | TPB | TorrCSV | YTS | Jackett ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();