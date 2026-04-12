(function () {
    'use strict';

    if (window.plugin_kkphim_parser_ready) return;
    window.plugin_kkphim_parser_ready = true;

    var SOURCES = {
        kkphim: { name: 'KKPhim', api: 'https://phimapi.com/' },
        ophim:  { name: 'OPhim',  api: 'https://ophim1.com/' }
    };

    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var TMDB_API_KEY   = '4ef0d7355d9ffb5151e987764708ce96';
    var STG_PREFIX     = 'kkparser_';

    /* ============================================================
       STORAGE
    ============================================================ */
    function getSetting(key) { return Lampa.Storage.get(STG_PREFIX + key, ''); }
    function setSetting(key, val) { Lampa.Storage.set(STG_PREFIX + key, val); }

    function getTsUrl() {
        var url = getSetting('torrserver_url') || '';
        if (!url) return null;
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
        return url;
    }
    function getTsPass()        { return getSetting('torrserver_pass') || ''; }
    function getTioConfig()     { return parseTioConfig(getSetting('torrentio_config') || ''); }
    function getAioUrl()        { return (getSetting('aio_url') || '').replace(/\/manifest\.json\s*$/i, '').replace(/\/+$/, ''); }
    function getTorrentEngine() { return getSetting('torrent_engine') || 'torrentio'; }
    function getJackettUrl() {
        var url = getSetting('jackett_url') || '';
        if (!url) return '';
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        return url;
    }
    function getJackettKey() { return getSetting('jackett_key') || ''; }
    function getProwlarrUrl() {
        var url = getSetting('prowlarr_url') || '';
        if (!url) return '';
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
        return url;
    }
    function getProwlarrKey() { return getSetting('prowlarr_key') || ''; }

    function parseTioConfig(raw) {
        if (!raw) return '';
        raw = String(raw).trim();
        var m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
        if (m) return m[1];
        m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
        if (m) return m[1];
        if (raw.indexOf('torrentio.strem.fun') > -1) {
            raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '')
                .replace(/\/(manifest\.json|stream\/.*)?$/i, '')
                .replace(/^\/+|\/+$/g, '');
            return (raw.indexOf('=') > -1) ? raw.replace(/\|/g, '%7C') : '';
        }
        raw = raw.replace(/^\/+|\/+$/g, '').replace(/\|/g, '%7C');
        return raw.indexOf('=') === -1 ? '' : raw;
    }

    /* ============================================================
       HELPERS
    ============================================================ */
    function normalizeStr(s) {
        return String(s || '').toLowerCase().trim()
            .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '')
            .replace(/\s+/g, ' ');
    }
    function padZero(n) { return (n < 10 ? '0' : '') + n; }

    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
            '&dn=' + encodeURIComponent(name || '') +
            '&tr=' + encodeURIComponent('udp://tracker.opentrackr.org:1337/announce') +
            '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce') +
            '&tr=' + encodeURIComponent('udp://tracker.torrent.eu.org:451/announce') +
            '&tr=' + encodeURIComponent('udp://tracker.tiny-vps.com:6969/announce') +
            '&tr=' + encodeURIComponent('udp://tracker.dler.org:6969/announce');
    }

    function parseSize(str) {
        if (!str) return 0;
        var s = String(str).replace(/,/g, '.').replace(/\s+/g, ' ').trim();
        var m = s.match(/([\d.]+)\s*(T[Bi]*B|G[Bi]*B|M[Bi]*B|K[Bi]*B|B)/i);
        if (!m) return 0;
        var n = parseFloat(m[1]);
        var u = m[2].toUpperCase();
        if (u.startsWith('T')) return n * 1e12;
        if (u.startsWith('G')) return n * 1e9;
        if (u.startsWith('M')) return n * 1e6;
        if (u.startsWith('K')) return n * 1e3;
        return n;
    }

    function fmtBytes(b) {
        b = parseInt(b) || 0;
        if (b >= 1e12) return (b / 1e12).toFixed(2) + ' TB';
        if (b >= 1e9)  return (b / 1e9).toFixed(2) + ' GB';
        if (b >= 1e6)  return (b / 1e6).toFixed(0) + ' MB';
        if (b > 0)     return b + ' B';
        return '';
    }

    function extractQuality(title) {
        var m = (title || '').match(
            /\b(2160p|4K|UHD|1080p|720p|480p|BluRay|BDRip|BRRip|WEB-?DL|WEBRip|HDRip|HDCAM|DVDRip|REMUX)\b/i
        );
        return m ? m[1] : '';
    }

    function getMediaType(card) {
        if (card.number_of_seasons || card.first_air_date ||
            card.type === 'tv' || card.type === 'series') return 'series';
        return 'movie';
    }

    function getImdbId(card) {
        var id = card.imdb_id
            || (card.ids && card.ids.imdb)
            || (card.external_ids && card.external_ids.imdb_id) || '';
        if (id && !/^tt/i.test(String(id))) id = 'tt' + id;
        return id || null;
    }

    /* Lampa native request */
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

    /* jQuery ajax — dùng khi cần header tùy chỉnh hoặc dataType xml */
    function ajaxGet(url, opts, onOk, onFail) {
        $.ajax(Object.assign({
            url:     url,
            type:    'GET',
            timeout: 20000
        }, opts || {}))
        .done(function(data) { onOk(data); })
        .fail(function(xhr) { (onFail || function(){})(xhr.status || 'Error'); });
    }

    /* ============================================================
       TIMECODE / HISTORY
    ============================================================ */
    function buildTimelineId(card, season, episode) {
        var base = 'kkparser_' + (card.id || card.imdb_id || card.title || '');
        if (season && episode) base += '_s' + padZero(season) + 'e' + padZero(episode);
        return base;
    }

    function saveTimecode(card, season, episode, percent, time) {
        try {
            Lampa.Storage.set(buildTimelineId(card, season, episode), {
                percent: percent || 0, time: time || 0,
                season: season || 0, episode: episode || 0, updated: Date.now()
            });
        } catch(e) {}
    }

    function loadTimecode(card, season, episode) {
        try {
            return Lampa.Storage.get(buildTimelineId(card, season, episode), null)
                || { percent: 0, time: 0 };
        } catch(e) { return { percent: 0, time: 0 }; }
    }

    function addToLampaHistory(card, season, episode, title) {
        try {
            var h = Object.assign({}, card);
            if (season)  h.season  = season;
            if (episode) h.episode = episode;
            if (title)   h.title   = title;
            if (Lampa.Favorite && Lampa.Favorite.add) Lampa.Favorite.add('history', h);
        } catch(e) {}
    }

    function updateLampaTimeline(card, season, episode, percent) {
        try {
            if (Lampa.Timeline && Lampa.Timeline.update) {
                var c = Object.assign({}, card);
                if (season)  c.season  = season;
                if (episode) c.episode = episode;
                Lampa.Timeline.update(c, { percent: percent || 0 });
            }
        } catch(e) {}
    }

    function hookPlayerProgress(card, season, episode) {
        try {
            Lampa.Listener.follow('player', function onEv(e) {
                if (e.type === 'destroy' || e.type === 'stop') {
                    Lampa.Listener.remove('player', onEv);
                    var pct = 0, t = 0;
                    try {
                        if (Lampa.Player && Lampa.Player.video) {
                            var v = Lampa.Player.video;
                            t   = v.currentTime || 0;
                            pct = v.duration > 0 ? Math.round((t / v.duration) * 100) : 0;
                        }
                    } catch(ex) {}
                    saveTimecode(card, season, episode, pct, t);
                    updateLampaTimeline(card, season, episode, pct);
                    addToLampaHistory(card, season, episode);
                }
                if (e.type === 'timeupdate') {
                    try {
                        if (Lampa.Player && Lampa.Player.video) {
                            var v2 = Lampa.Player.video;
                            var t2 = v2.currentTime || 0;
                            var p2 = v2.duration > 0 ? Math.round((t2 / v2.duration) * 100) : 0;
                            if (p2 > 0 && p2 % 10 === 0)
                                saveTimecode(card, season, episode, p2, t2);
                        }
                    } catch(ex) {}
                }
            });
        } catch(e) {}
    }

    /* ============================================================
       PLAY
    ============================================================ */
    function doPlay(params) {
        var card    = params.card    || {};
        var url     = params.url     || '';
        var title   = params.title   || card.title || card.name || '';
        var episode = params.episode || null;
        if (!url) { Lampa.Noty.show('Không có link phát'); return; }

        var season = episode ? (episode.season  || 0) : 0;
        var epNum  = episode ? (episode.episode || 0) : 0;
        var tc     = loadTimecode(card, season, epNum);

        var obj = { title: title, url: url, poster: card.poster || card.img || '', movie: card };
        if (episode) { obj.season = season; obj.episode = epNum; }
        if (tc && tc.time > 30) { obj.time = tc.time; obj.percent = tc.percent; }

        Lampa.Player.play(obj);
        addToLampaHistory(card, season, epNum, title);
        updateLampaTimeline(card, season, epNum, tc ? tc.percent : 0);
        hookPlayerProgress(card, season, epNum);
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
        $.ajax({
            url: tsUrl + '/torrents', type: 'POST', headers: tsHeaders(),
            data: JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
            dataType: 'json', timeout: 15000,
            success: function(data) { onDone((data && data.hash) || ''); },
            error:   function()     { onFail && onFail(); }
        });
    }

    function tsGetFiles(hash, onDone) {
        var tsUrl = getTsUrl();
        $.ajax({
            url: tsUrl + '/torrents', type: 'POST', headers: tsHeaders(),
            data: JSON.stringify({ action: 'get', hash: hash }),
            dataType: 'json', timeout: 15000,
            success: function(data) {
                var files = ((data && data.file_stats) || [])
                    .filter(function(f) {
                        return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/);
                    })
                    .sort(function(a, b) {
                        return (a.path || '').localeCompare(b.path || '', undefined, { numeric: true });
                    });
                onDone(files, data);
            },
            error: function() { onDone([], null); }
        });
    }

    function tsPlayFile(hash, fileId, title, card, season, episode) {
        var tsUrl = getTsUrl();
        var url   = tsUrl + '/stream/' + encodeURIComponent(title || 'video') +
                    '?link=' + hash + '&index=' + fileId + '&play';
        doPlay({ url: url, title: title, card: card,
                 episode: (season && episode) ? { season: season, episode: episode } : null });
    }

    function tsAddAndPickFile(magnet, hash, torrentTitle, playTitle, card, season, episode) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }

        Lampa.Noty.show('Đang thêm vào TorrServer...');
        tsAdd(magnet, torrentTitle, function(returnedHash) {
            var h = returnedHash || hash;
            if (!h) { Lampa.Noty.show('Không lấy được hash'); return; }

            Lampa.Noty.show('Đang lấy danh sách file...');
            var tries = 0;
            function tryGet() {
                tries++;
                tsGetFiles(h, function(files) {
                    if (!files.length && tries < 6) { setTimeout(tryGet, 2500); return; }
                    if (!files.length) { tsPlayFile(h, 0, playTitle, card, season, episode); return; }
                    if (files.length === 1) { tsPlayFile(h, files[0].id || 0, playTitle, card, season, episode); return; }
                    showFileList(files, h, playTitle, card, season, episode);
                });
            }
            setTimeout(tryGet, 2500);
        }, function() {
            Lampa.Noty.show('TorrServer lỗi');
            if (hash) tsPlayFile(hash, 0, playTitle, card, season, episode);
        });
    }

    function showFileList(files, hash, playTitle, card, season, episode) {
        Lampa.Select.show({
            title: '📂 Chọn file — ' + playTitle,
            items: files.map(function(f) {
                var parts    = (f.path || '').split('/');
                var filename = parts[parts.length - 1] || f.path || 'File';
                var epM      = filename.match(/[Ee](\d+)|[Сс](\d+)|\b(\d{2,3})\b/);
                var epL      = epM ? ' [Ep ' + (epM[1]||epM[2]||epM[3]) + ']' : '';
                return {
                    title:    filename + epL,
                    subtitle: f.length ? fmtBytes(f.length) : '',
                    file: f
                };
            }),
            onSelect: function(item) {
                tsPlayFile(hash, item.file.id || 0,
                    playTitle + ' — ' + (item.file.path || '').split('/').pop(),
                    card, season, episode);
            },
            onBack: function() { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       TORRENT PLUS — Nguồn có API JSON thực sự
    ============================================================ */

    /*
     * Knaben — https://api.knaben.eu
     * API public, không cần key, hỗ trợ CORS
     * Docs: https://knaben.eu/docs
     */
    function searchKnaben(query, cb) {
        var url = 'https://api.knaben.eu/v1';
        var body = JSON.stringify({
            search_type:      'best_match',
            search_field:     'title',
            query:            query,
            size:             40,
            from:             0,
            orderBy:          'seeders',
            orderDirection:   'desc',
            categories:       [200, 500, 2000, 5000]
        });

        $.ajax({
            url:         url,
            type:        'POST',
            contentType: 'application/json',
            data:        body,
            timeout:     20000,
            success: function(data) {
                var d     = typeof data === 'string' ? JSON.parse(data) : data;
                var hits  = [];

                /* Knaben trả { hits: [...] } hoặc { hits: { hits: [...] } } */
                if (Array.isArray(d.hits)) {
                    hits = d.hits;
                } else if (d.hits && Array.isArray(d.hits.hits)) {
                    hits = d.hits.hits.map(function(h) { return h._source || h; });
                }

                var results = hits.map(function(r) {
                    var hash = (r.hash || r.info_hash || '').toLowerCase().replace(/\s/g,'');
                    var sb   = parseInt(r.bytes || r.size || 0);
                    if (!hash) return null;
                    return {
                        title:   r.title || r.name || '',
                        seeds:   parseInt(r.seeders  || 0),
                        peers:   parseInt(r.leechers || 0),
                        size:    fmtBytes(sb),
                        sizeNum: sb,
                        tracker: r.tracker || r.indexer || 'Knaben',
                        quality: extractQuality(r.title || r.name || ''),
                        hash:    hash,
                        magnet:  r.magnet || r.magnetUri || makeMagnet(hash, r.title || r.name)
                    };
                }).filter(Boolean);

                cb(results);
            },
            error: function(xhr) {
                console.warn('[Knaben]', xhr.status, xhr.responseText);
                cb([]);
            }
        });
    }

    /*
     * TorrentCSV — https://torrentcsv.com
     * Open-source, API JSON, không cần key
     */
    function searchTorrentCSV(query, cb) {
        var url = 'https://torrentcsv.com/search/?q=' +
                  encodeURIComponent(query) + '&p=0';

        reguest(url, function(data) {
            var d     = typeof data === 'string' ? JSON.parse(data) : data;
            var items = d.results || d.torrents || d.data || [];
            if (!Array.isArray(items)) items = [];

            var results = items.map(function(r) {
                var hash = (r.infohash || r.hash || '').toLowerCase();
                if (!hash) return null;
                var sb = parseInt(r.size || 0);
                return {
                    title:   r.name || r.title || '',
                    seeds:   parseInt(r.seeders  || r.se || 0),
                    peers:   parseInt(r.leechers || r.le || 0),
                    size:    fmtBytes(sb),
                    sizeNum: sb,
                    tracker: 'TorrentCSV',
                    quality: extractQuality(r.name || ''),
                    hash:    hash,
                    magnet:  makeMagnet(hash, r.name || r.title)
                };
            }).filter(Boolean);

            cb(results);
        }, function(e) {
            console.warn('[TorrentCSV]', e);
            cb([]);
        });
    }

    /*
     * BTDigg — https://btdig.com
     * API JSON công khai
     */
    function searchBTDigg(query, cb) {
        var url = 'https://btdigggink2pdqzqrik3blmqemsbntpzwxottujilcdjfz4kikvoskid.onion.ly/search?q=' +
                  encodeURIComponent(query) + '&p=0&order=0';
        /* Dùng mirror btdig.com */
        var url2 = 'https://btdig.com/search?q=' +
                   encodeURIComponent(query) + '&p=0&order=0';

        function parse(data) {
            var d     = typeof data === 'string' ? JSON.parse(data) : data;
            var items = d.results || d.list || d.data || d || [];
            if (!Array.isArray(items)) return [];
            return items.map(function(r) {
                var hash = (r.info_hash || r.hash || '').toLowerCase();
                if (!hash) return null;
                var sb = parseSize(r.size || '');
                return {
                    title:   r.name || r.title || '',
                    seeds:   0,
                    peers:   0,
                    size:    r.size || '',
                    sizeNum: sb,
                    tracker: 'BTDigg',
                    quality: extractQuality(r.name || ''),
                    hash:    hash,
                    magnet:  r.magnet || makeMagnet(hash, r.name)
                };
            }).filter(Boolean);
        }

        reguest(url2, function(data) {
            cb(parse(data));
        }, function() {
            reguest(url, function(data) {
                cb(parse(data));
            }, function(e) {
                console.warn('[BTDigg]', e);
                cb([]);
            });
        });
    }

    /*
     * Prowlarr — torznab API (giống Jackett, do user tự host)
     * Endpoint: /api/v1/search
     */
    function searchProwlarr(query, cb) {
        var url = getProwlarrUrl(), key = getProwlarrKey();
        if (!url || !key) { cb([]); return; }

        var apiUrl = url + '/api/v1/search?apikey=' + encodeURIComponent(key) +
                     '&query=' + encodeURIComponent(query) +
                     '&categories=2000,5000&type=search';

        reguest(apiUrl, function(data) {
            var d = typeof data === 'string' ? JSON.parse(data) : data;
            var items = Array.isArray(d) ? d : (d.Results || d.results || []);
            var results = items.map(function(r) {
                var link = r.downloadUrl || r.magnetUrl || r.MagnetUri || r.Link || '';
                if (!link) return null;
                var hm = link.match(/btih:([a-f0-9]+)/i);
                var sb = parseInt(r.size || r.Size || 0);
                return {
                    title:   r.title || r.Title || '',
                    seeds:   parseInt(r.seeders  || r.Seeders  || 0),
                    peers:   parseInt(r.leechers || r.Leechers || 0),
                    size:    fmtBytes(sb),
                    sizeNum: sb,
                    tracker: r.indexer || r.Tracker || 'Prowlarr',
                    quality: extractQuality(r.title || r.Title || ''),
                    hash:    hm ? hm[1].toLowerCase() : '',
                    magnet:  link
                };
            }).filter(function(r) { return r && (r.hash || r.magnet); });
            cb(results);
        }, function(e) {
            console.warn('[Prowlarr]', e);
            cb([]);
        });
    }

    /*
     * Jackett — torznab (user tự host)
     */
    function fetchJackett(query, cb) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url || !key) { cb([]); return; }

        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' +
            encodeURIComponent(key) + '&Query=' + encodeURIComponent(query) +
            '&Category[]=2000&Category[]=5000',
            function(data) {
                var d       = typeof data === 'string' ? JSON.parse(data) : data;
                var results = ((d && d.Results) || []).map(function(r) {
                    var link = r.MagnetUri || r.Link || '';
                    if (!link) return null;
                    var hm = link.match(/btih:([a-f0-9]+)/i);
                    var sb = parseInt(r.Size || 0);
                    return {
                        title:   r.Title || '',
                        seeds:   parseInt(r.Seeders || 0),
                        peers:   parseInt(r.Peers   || 0),
                        size:    fmtBytes(sb),
                        sizeNum: sb,
                        tracker: r.Tracker || 'Jackett',
                        quality: extractQuality(r.Title || ''),
                        hash:    hm ? hm[1].toLowerCase() : '',
                        magnet:  link
                    };
                }).filter(Boolean);
                cb(results);
            },
            function(e) { console.warn('[Jackett]', e); cb([]); }
        );
    }

    /* ============================================================
       TORRENT PLUS — Menu chính
    ============================================================ */

    /* Định nghĩa nguồn — chỉ các nguồn THỰC SỰ có API */
    function getTorrentPlusSources() {
        var list = [
            { key: 'knaben',     name: 'Knaben',      fn: searchKnaben,     always: true },
            { key: 'torrentcsv', name: 'TorrentCSV',  fn: searchTorrentCSV, always: true },
            { key: 'btdigg',     name: 'BTDigg',      fn: searchBTDigg,     always: true }
        ];

        /* Prowlarr — chỉ hiện nếu đã cấu hình */
        if (getProwlarrUrl() && getProwlarrKey()) {
            list.push({ key: 'prowlarr', name: 'Prowlarr', fn: searchProwlarr, always: false });
        }

        return list;
    }

    function showTorrentPlusMenu(card) {
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var query = (orig || title).trim();

        var sources   = getTorrentPlusSources();
        var menuItems = [
            {
                title:    '🔍 Tìm tất cả nguồn',
                subtitle: sources.map(function(s) { return s.name; }).join(' · '),
                action:   'all',
                query:    query
            }
        ];

        sources.forEach(function(src) {
            menuItems.push({
                title:  '📡 ' + src.name,
                action: src.key,
                query:  query
            });
        });

        /* Thêm Jackett nếu đã cấu hình */
        if (getJackettUrl() && getJackettKey()) {
            menuItems.push({
                title:    '🔧 Jackett',
                subtitle: 'Server của bạn',
                action:   'jackett',
                query:    query
            });
        }

        Lampa.Select.show({
            title: '🌐 Torrent Plus — ' + (title.length > 30 ? title.slice(0,27)+'...' : title),
            items: menuItems,
            onSelect: function(item) {
                if (item.action === 'all') {
                    doSearchAll(card, item.query, sources);
                } else if (item.action === 'jackett') {
                    doSearchJackett(card, item.query);
                } else {
                    var src = sources.filter(function(s) { return s.key === item.action; })[0];
                    if (src) doSearchSingle(card, item.query, src);
                }
            },
            onBack: function() { Lampa.Controller.toggle('full'); }
        });
    }

    function doSearchSingle(card, query, src) {
        var title = card.title || card.name || '';
        Lampa.Noty.show(src.name + ': đang tìm...');

        src.fn(query, function(results) {
            if (!results.length && query !== title) {
                /* Thử lại với title nếu query là orig */
                src.fn(title, function(r2) {
                    showTorrentPlusResults(r2, title, src.name, card);
                });
            } else {
                showTorrentPlusResults(results, title, src.name, card);
            }
        });
    }

    function doSearchAll(card, query, sources) {
        var title      = card.title || card.name || '';
        var allResults = [];
        var done       = 0;
        var total      = sources.length;

        Lampa.Noty.show('Đang tìm từ ' + total + ' nguồn...');

        sources.forEach(function(src) {
            src.fn(query, function(results) {
                results.forEach(function(r) {
                    if (r.hash) {
                        var dup = allResults.some(function(x) { return x.hash === r.hash; });
                        if (!dup) allResults.push(r);
                    } else {
                        allResults.push(r);
                    }
                });
                done++;
                if (done === total) {
                    allResults.sort(function(a, b) {
                        if (b.seeds !== a.seeds) return b.seeds - a.seeds;
                        return b.sizeNum - a.sizeNum;
                    });
                    showTorrentPlusResults(allResults, title, 'Tất cả nguồn', card);
                }
            });
        });
    }

    function doSearchJackett(card, query) {
        var title = card.title || card.name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var q     = query + (year ? ' ' + year : '');

        Lampa.Noty.show('Jackett: đang tìm...');
        fetchJackett(q, function(r) {
            if (!r.length) {
                fetchJackett(title, function(r2) {
                    showTorrentPlusResults(r2, title, 'Jackett', card);
                });
            } else {
                showTorrentPlusResults(r, title, 'Jackett', card);
            }
        });
    }

    /* Hiển thị kết quả — chỉ search tên, user chọn pack */
    function showTorrentPlusResults(results, movieTitle, label, card) {
        if (!results || !results.length) {
            Lampa.Noty.show(label + ': Không tìm thấy kết quả nào');
            return;
        }

        var tsUrl = getTsUrl();

        /* Sort: seeds desc → size desc */
        results.sort(function(a, b) {
            if (b.seeds !== a.seeds) return b.seeds - a.seeds;
            return b.sizeNum - a.sizeNum;
        });

        Lampa.Select.show({
            title: '📦 ' + label + ' — ' +
                   (movieTitle.length > 25 ? movieTitle.slice(0,22)+'...' : movieTitle) +
                   ' (' + results.length + ')',
            items: results.map(function(r) {
                var q    = r.quality ? '[' + r.quality + '] ' : '';
                var src  = '[' + (r.tracker || label) + '] ';
                var name = (r.title || '').length > 45
                           ? (r.title || '').slice(0, 42) + '...'
                           : (r.title || '');
                var info = '';
                if (r.seeds) info += '🌱' + r.seeds;
                if (r.peers) info += '/' + r.peers;
                if (r.size)  info += (info ? '  ' : '') + '💾' + r.size;
                return {
                    title:    q + src + name,
                    subtitle: info || '—',
                    r:        r
                };
            }),
            onSelect: function(item) {
                var r = item.r;
                if (!tsUrl) {
                    Lampa.Noty.show('Chưa cấu hình TorrServer!');
                    return;
                }
                if (!r.hash && !r.magnet) {
                    Lampa.Noty.show('Không có magnet link');
                    return;
                }
                var magnet = r.magnet || makeMagnet(r.hash, r.title);
                tsAddAndPickFile(magnet, r.hash, r.title, movieTitle, card, null, null);
            },
            onBack: function() { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       KKPHIM / OPHIM
    ============================================================ */
    function extractSeasonNumber(name, slug) {
        var text = (name || '') + ' ' + (slug || '');
        var patterns = [
            /[Ss]eason[\s\-._]*(\d+)/i, /[Pp]h[aầ]n[\s\-._]*(\d+)/i,
            /[Mm][uù]a[\s\-._]*(\d+)/i, /\bS(\d+)\b/
        ];
        for (var i = 0; i < patterns.length; i++) {
            var m = text.match(patterns[i]);
            if (m) return parseInt(m[1]);
        }
        return 1;
    }

    function getBaseSlug(slug) {
        if (!slug) return '';
        return slug.replace(/-?season-?\d+/gi,'').replace(/-?phan-?\d+/gi,'')
            .replace(/-?mua-?\d+/gi,'').replace(/-?s\d+$/gi,'')
            .replace(/^-+|-+$/g,'').replace(/-+/g,'-');
    }

    function getBaseName(name) {
        if (!name) return '';
        return name
            .replace(/[\s\-]*[\(\[]?\s*[Ss]eason\s*\d+\s*[\)\]]?/gi,'')
            .replace(/[\s\-]*[\(\[]?\s*[Pp]h[aầ]n\s*\d+\s*[\)\]]?/gi,'')
            .replace(/[\s\-]*[\(\[]?\s*[Mm][uù]a\s*\d+\s*[\)\]]?/gi,'')
            .replace(/[\s\-]*\bS\d+\b/g,'').trim();
    }

    function searchSource(source, keyword, cb) {
        reguest(
            source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&limit=30',
            function(data) {
                var items = (data && data.status === 'success' && data.data && data.data.items)
                    ? data.data.items
                    : ((data && data.data && data.data.items) ? data.data.items
                    : ((data && data.items) ? data.items : []));
                cb(items);
            },
            function() { cb([]); }
        );
    }

    function fetchDetail(source, slug, cb) {
        reguest(source.api + 'v1/api/phim/' + slug, function(data) {
            if (data && data.status === 'success' && data.data) {
                var item = data.data.item || data.data;
                cb({ movie: item, episodes: data.data.episodes || item.episodes || [] });
            } else {
                reguest(source.api + 'phim/' + slug,
                    function(d2) { cb({ movie: d2.movie||d2.item||d2||{}, episodes: d2.episodes||[] }); },
                    function()   { cb({ movie: {}, episodes: [] }); }
                );
            }
        }, function() {
            reguest(source.api + 'phim/' + slug,
                function(d2) { cb({ movie: d2.movie||d2.item||d2||{}, episodes: d2.episodes||[] }); },
                function()   { cb({ movie: {}, episodes: [] }); }
            );
        });
    }

    function matchScore(item, title, orig, year) {
        var score = 0;
        var nT = normalizeStr(title), nO = normalizeStr(orig);
        var n1 = normalizeStr(item.name||''), n2 = normalizeStr(item.origin_name||'');
        var nTb = normalizeStr(getBaseName(title)), nOb = normalizeStr(getBaseName(orig));
        var n1b = normalizeStr(getBaseName(item.name||'')), n2b = normalizeStr(getBaseName(item.origin_name||''));

        if (nT && (n1===nT||n2===nT)) score+=100;
        else if (nO && (n1===nO||n2===nO)) score+=100;
        else if (nTb && (n1b===nTb||n2b===nTb)) score+=90;
        else if (nOb && (n1b===nOb||n2b===nOb)) score+=90;
        else if (nT && (n1.indexOf(nT)>-1||nT.indexOf(n1)>-1)) score+=50;
        else if (nO && (n2.indexOf(nO)>-1||nO.indexOf(n2)>-1)) score+=50;
        else if (nTb && (n1b.indexOf(nTb)>-1||nTb.indexOf(n1b)>-1)) score+=40;
        else if (nOb && (n2b.indexOf(nOb)>-1||nOb.indexOf(n2b)>-1)) score+=40;

        if (year && item.year) {
            var iy = parseInt(item.year), ty = parseInt(year);
            if (iy===ty) score+=30; else if (Math.abs(iy-ty)<=1) score+=15;
        }
        return score;
    }

    function findAllSeasons(source, keyword, title, orig, year, cb) {
        var terms = [];
        var names = [getBaseName(orig), getBaseName(title), getBaseName(keyword), orig, title, keyword];
        names.forEach(function(t) {
            if (t && terms.indexOf(t) === -1) terms.push(t);
        });
        if (!terms.length) terms.push(keyword);

        var allResults = [], idx = 0;
        function doSearch() {
            if (idx >= terms.length) { processResults(allResults); return; }
            var term = terms[idx++];
            searchSource(source, term, function(items) {
                items.forEach(function(it) {
                    if (!allResults.some(function(x) { return x.slug === it.slug; }))
                        allResults.push(it);
                });
                doSearch();
            });
        }

        function processResults(results) {
            if (!results.length) { cb(null); return; }
            var groups = {};
            results.forEach(function(item) {
                var base = getBaseSlug(item.slug||'');
                var sn   = extractSeasonNumber(item.name, item.slug);
                if (!groups[base]) groups[base] = [];
                if (!groups[base].some(function(x) { return x.season_num===sn && x.slug===item.slug; })) {
                    groups[base].push({
                        season_num: sn, slug: item.slug,
                        name: item.name||'', origin_name: item.origin_name||'',
                        year: item.year||'', type: item.type||''
                    });
                }
            });

            var targetSlug = getBaseSlug(normalizeStr(orig||title||keyword)
                .replace(/[^\w\s]/g,'').replace(/\s+/g,'-'));
            var bestGroup = null, bestScore = -1;

            for (var base in groups) {
                if (!groups.hasOwnProperty(base)) continue;
                var score = 0, seasons = groups[base];
                if (base === targetSlug) score = 100;
                else if (base.indexOf(targetSlug)>-1 || targetSlug.indexOf(base)>-1) score = 70;
                else {
                    var bw = base.split('-').filter(Boolean);
                    var tw = targetSlug.split('-').filter(Boolean);
                    var cm = tw.filter(function(w) { return bw.indexOf(w)>-1; }).length;
                    if (cm > 0) score = (cm / Math.max(bw.length, tw.length)) * 60;
                }
                seasons.forEach(function(s) { score = Math.max(score, matchScore(s, title, orig, year)); });
                if (seasons.length > 1) score += 5;
                if (year && seasons.some(function(s) { return String(s.year)===String(year); })) score += 10;
                if (score > bestScore) { bestScore = score; bestGroup = { base: base, seasons: seasons }; }
            }

            if (!bestGroup || bestScore < 10) {
                var first = results[0];
                cb({ movie_name: getBaseName(first.origin_name||first.name||''),
                     seasons: [{ season_num:1, slug:first.slug, name:first.name||'',
                                 origin_name:first.origin_name||'', year:first.year||'', type:first.type||'' }] });
                return;
            }

            bestGroup.seasons.sort(function(a,b) { return a.season_num - b.season_num; });
            var unique = [], seen = {};
            bestGroup.seasons.forEach(function(s) {
                if (!seen[s.season_num]) { seen[s.season_num]=true; unique.push(s); }
            });
            var mn = getBaseName(unique[0].origin_name||unique[0].name||'') || title || keyword;
            cb({ movie_name: mn, seasons: unique });
        }

        doSearch();
    }

    function cleanName(name) { return (name||'').replace(/^#+\s*/,'').trim(); }

    function searchAndPlay(sourceKey, card) {
        var source = SOURCES[sourceKey];
        if (!source) return;
        var title = card.title||card.name||'';
        var orig  = card.original_title||card.original_name||'';
        var year  = (card.release_date||card.first_air_date||'').slice(0,4);

        Lampa.Noty.show(source.name + ': đang tìm...');
        findAllSeasons(source, title, title, orig, year, function(result) {
            if (!result || !result.seasons || !result.seasons.length) {
                searchSource(source, orig||title, function(items) {
                    if (!items.length && orig && orig!==title)
                        searchSource(source, title, function(i2) { showManualSelect(source,i2,card); });
                    else showManualSelect(source, items, card);
                });
                return;
            }
            showSeasonMenu(source, result, card);
        });
    }

    function showSeasonMenu(source, result, card) {
        var seasons = result.seasons;
        var title   = card.title||card.name||result.movie_name;
        if (seasons.length === 1) {
            loadSeasonEpisodes(source, seasons[0], card, title);
            return;
        }
        Lampa.Select.show({
            title: '📺 ' + result.movie_name + ' — ' + seasons.length + ' Season',
            items: seasons.map(function(s) {
                return { title:'Season '+s.season_num+': '+s.name,
                         subtitle: s.year ? 'Năm: '+s.year : '', season: s };
            }),
            onSelect: function(item) { loadSeasonEpisodes(source, item.season, card, title); },
            onBack:   function()     { Lampa.Controller.toggle('full'); }
        });
    }

    function loadSeasonEpisodes(source, season, card, movieTitle) {
        Lampa.Noty.show('Đang tải ' + season.name + '...');
        fetchDetail(source, season.slug, function(data) {
            var eps = data.episodes || [];
            if (!eps.length) { Lampa.Noty.show('Không có tập phim'); return; }
            playEpisode(card, eps, season.season_num, movieTitle, season.name);
        });
    }

    function playEpisode(card, episodes, seasonNum, movieTitle, seasonName) {
        var displayTitle = seasonName || movieTitle || card.title||card.name||'';
        var servers = (episodes||[]).filter(function(s) { return s.server_data && s.server_data.length; });
        if (!servers.length) { Lampa.Noty.show('Không có tập phim'); return; }
        if (servers.length === 1) { showEpisodeMenu(displayTitle, servers[0], card, seasonNum); return; }
        Lampa.Select.show({
            title: displayTitle + ' — Chọn phiên bản',
            items: servers.map(function(s,i) {
                return { title: cleanName(s.server_name)||('Phiên bản '+(i+1)),
                         subtitle: (s.server_data||[]).length+' tập', srv: s };
            }),
            onSelect: function(item) { showEpisodeMenu(displayTitle, item.srv, card, seasonNum); },
            onBack:   function()     { Lampa.Controller.toggle('full'); }
        });
    }

    function showEpisodeMenu(title, serverData, card, seasonNum) {
        var eps  = serverData.server_data || [];
        var sNum = seasonNum || 1;
        var mT   = title + (cleanName(serverData.server_name) ? ' · '+cleanName(serverData.server_name) : '');
        if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }

        var playlist = eps.map(function(ep,i) {
            return { title: mT+' — '+(ep.name||'Tập '+(i+1)),
                     url: ep.link_m3u8||ep.link_embed||'', movie: card, season: sNum, episode: i+1 };
        });

        Lampa.Select.show({
            title: '🎬 ' + mT + ' (' + eps.length + ' tập)',
            items: eps.map(function(ep,i) {
                var link = ep.link_m3u8||ep.link_embed||'';
                var tc   = loadTimecode(card, sNum, i+1);
                var pct  = (tc && tc.percent>0) ? ' ✅'+tc.percent+'%' : '';
                return {
                    title:    (ep.name||'Tập '+(i+1)) + pct,
                    subtitle: !link ? '⚠ Không có link' : (link.indexOf('.m3u8')>-1 ? '🎬 M3U8' : '🌐 Embed'),
                    ep: ep, idx: i
                };
            }),
            onSelect: function(item) {
                var link = item.ep.link_m3u8||item.ep.link_embed||'';
                if (!link) { Lampa.Noty.show('Không có link phát'); return; }
                doPlay({ url:link, title:mT+' — '+(item.ep.name||'Tập '+(item.idx+1)),
                         card:card, episode:{season:sNum, episode:item.idx+1} });
                try { Lampa.Player.playlist(playlist, item.idx); } catch(e) {}
            },
            onBack: function() { Lampa.Controller.toggle('full'); }
        });
    }

    function showManualSelect(source, items, card) {
        if (!items||!items.length) { Lampa.Noty.show('Không tìm thấy trên '+source.name); return; }
        Lampa.Select.show({
            title: source.name + ' — Kết quả',
            items: items.map(function(it) {
                var sn = extractSeasonNumber(it.name, it.slug);
                return {
                    title: (it.name||'') + (it.origin_name?' ('+it.origin_name+')':'') +
                           (sn>1?' [S'+sn+']':'') + (it.year?' ['+it.year+']':''),
                    subtitle: it.slug, slug: it.slug, item: it
                };
            }),
            onSelect: function(sel) {
                if (!sel.slug) return;
                var sn = extractSeasonNumber(sel.item.name, sel.item.slug);
                Lampa.Noty.show('Đang tải...');
                fetchDetail(source, sel.slug, function(data) {
                    var eps = data.episodes||[];
                    if (!eps.length) { Lampa.Noty.show('Không có tập phim'); return; }
                    playEpisode(card, eps, sn, card.title||card.name, sel.item.name);
                });
            },
            onBack: function() { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       TORRENTIO / AIO
    ============================================================ */
    function buildStreamUrl(type, imdbId, season, episode) {
        var engine = getTorrentEngine();
        var sType  = type === 'series' ? 'series' : 'movie';
        var id     = imdbId;
        if (type === 'series' && season && episode) id = imdbId+':'+season+':'+episode;
        if (engine === 'aio') {
            var base = getAioUrl();
            return base ? base+'/stream/'+sType+'/'+id+'.json' : null;
        }
        var cfg   = getTioConfig();
        var base2 = TORRENTIO_BASE + (cfg ? '/'+cfg : '');
        return base2+'/stream/'+sType+'/'+id+'.json';
    }

    function fetchStreams(url, cb) {
        reguest(url, function(d) { cb((d && d.streams)||[]); },
                     function(e) { Lampa.Noty.show('Lỗi: '+e); cb([]); });
    }

    function parseStream(st) {
        var lines = (st.title||'').split('\n');
        var name  = lines[0] || String(st.name||'').split('\n')[0] || '?';
        var info  = lines[1] || '';
        var sM    = info.match(/💾\s*([\d.,]+\s*[GMKBT]+)/i);
        var seM   = info.match(/👤\s*(\d+)/);
        var srcM  = info.match(/⚙️\s*(\S+)/);
        var sz    = sM ? sM[1].trim() : '';
        return {
            title:   name, hash: (st.infoHash||'').toLowerCase(),
            fileIdx: typeof st.fileIdx==='number' ? st.fileIdx : 0,
            url:     st.url||'', size: sz, sizeNum: parseSize(sz),
            seeds:   seM ? parseInt(seM[1]) : 0,
            tracker: srcM ? srcM[1] : 'Torrentio',
            magnet:  st.infoHash ? makeMagnet(st.infoHash, name) : ''
        };
    }

    function showStreamsMenu(streams, movieTitle, card, season, episode) {
        if (!streams||!streams.length) { Lampa.Noty.show('Không tìm thấy torrent'); return; }
        var tsUrl  = getTsUrl();
        var label  = getTorrentEngine()==='aio' ? 'AIOStreams' : 'Torrentio';
        var parsed = streams.map(parseStream).filter(function(s){return s.hash;})
            .sort(function(a,b){return b.sizeNum-a.sizeNum;});

        Lampa.Select.show({
            title: '🧲 '+label+': '+movieTitle+' ('+parsed.length+')',
            items: parsed.map(function(s) {
                return {
                    title:    '['+s.tracker+'] '+s.title,
                    subtitle: (s.seeds?'👤'+s.seeds+'  ':'')+(s.size?'💾'+s.size:''),
                    s: s
                };
            }),
            onSelect: function(item) {
                var s = item.s;
                if (tsUrl && s.hash) {
                    tsAdd(s.magnet, movieTitle, function(hash) {
                        var h   = hash||s.hash;
                        var url = tsUrl+'/stream/'+encodeURIComponent(movieTitle)+
                                  '?link='+h+'&index='+s.fileIdx+'&play';
                        doPlay({url:url, title:movieTitle, card:card,
                                episode:(season&&episode)?{season:season,episode:episode}:null});
                    }, function() {
                        doPlay({url:tsUrl+'/stream/'+encodeURIComponent(movieTitle)+
                                   '?link='+s.hash+'&index='+s.fileIdx+'&play',
                                title:movieTitle, card:card});
                    });
                } else if (s.url) {
                    doPlay({url:s.url, title:movieTitle, card:card,
                            episode:(season&&episode)?{season:season,episode:episode}:null});
                } else {
                    Lampa.Noty.show(s.hash?'Chưa cấu hình TorrServer!':'Không có link');
                }
            },
            onBack: function() { Lampa.Controller.toggle('full'); }
        });
    }

    function searchTorrent(card, season, episode) {
        var title  = card.title||card.name||'';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);
        Lampa.Noty.show('Đang tìm torrent...');

        function run(id) {
            var url = buildStreamUrl(type, id, season, episode);
            if (!url) { Lampa.Noty.show(getTorrentEngine()==='aio'?'Chưa cấu hình AIO!':'Lỗi config'); return; }
            fetchStreams(url, function(streams) {
                var epLabel = (season&&episode)?' S'+padZero(season)+'E'+padZero(episode):'';
                showStreamsMenu(streams, title+epLabel, card, season, episode);
            });
        }

        if (imdbId) { run(imdbId); return; }
        reguest(
            'https://api.themoviedb.org/3/'+(type==='series'?'tv':'movie')+'/'+card.id+
            '/external_ids?api_key='+TMDB_API_KEY,
            function(d) {
                var id = d && d.imdb_id;
                if (id) { card.imdb_id=id; run(id); }
                else Lampa.Noty.show('Không tìm thấy IMDB ID');
            },
            function() { Lampa.Noty.show('Lỗi lấy IMDB ID'); }
        );
    }

    function getSeasonEpCount(card, season) {
        if (card.seasons) {
            var s = card.seasons.filter(function(x){return x.season_number===season;})[0];
            if (s && s.episode_count) return s.episode_count;
        }
        return 50;
    }

    function askTorrentTV(card) {
        var total = card.number_of_seasons||1;
        function pickEp(s) {
            var totalEps = getSeasonEpCount(card, s);
            var ee = [];
            for (var e=1; e<=totalEps; e++) {
                var tc = loadTimecode(card,s,e);
                ee.push({ title:'S'+padZero(s)+'E'+padZero(e)+((tc&&tc.percent>0)?' ✅'+tc.percent+'%':''), s:s, e:e });
            }
            Lampa.Select.show({
                title: 'Season '+s+' — Chọn tập',
                items: ee,
                onSelect: function(item) { searchTorrent(card,item.s,item.e); },
                onBack:   function()     { Lampa.Controller.toggle('full'); }
            });
        }
        if (total===1) { pickEp(1); return; }
        var ss = [];
        for (var s=1; s<=total; s++)
            ss.push({ title:'Season '+s+' ('+getSeasonEpCount(card,s)+' tập)', s:s });
        Lampa.Select.show({
            title: 'Chọn Season', items: ss,
            onSelect: function(item) { pickEp(item.s); },
            onBack:   function()     { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       SETTINGS
    ============================================================ */
    function initSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;
        Lampa.SettingsApi.addComponent({
            component: 'kkparser',
            name:      'KKPhim Parser',
            icon: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24">' +
                  '<rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/>' +
                  '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>'
        });
        setTimeout(buildSettings, 100);
    }

    function buildSettings() {
        if (!Lampa.SettingsApi) return;
        var params = [
            { name:'torrserver_url',  type:'input',  field:{ name:'TorrServer URL',      description:'VD: 192.168.1.100:8090' } },
            { name:'torrserver_pass', type:'input',  field:{ name:'TorrServer Password', description:'Để trống nếu không có' } },
            { name:'test_torrserver', type:'button', field:{ name:'🧪 Test TorrServer',  description:'Kiểm tra kết nối' },
              onChange: function() {
                var url = getTsUrl();
                if (!url) { Lampa.Noty.show('Chưa nhập URL!'); return; }
                Lampa.Noty.show('Đang test...');
                $.ajax({ url:url+'/echo', type:'GET', timeout:5000,
                    success: function()    { Lampa.Noty.show('✅ TorrServer OK!'); },
                    error:   function(xhr) { Lampa.Noty.show(xhr.status===200?'✅ OK!':'❌ HTTP '+(xhr.status||'timeout')); }
                });
              }
            },
            { name:'torrent_engine',    type:'select', values:{'torrentio':'Torrentio','aio':'AIOStreams'}, default:'torrentio',
              field:{ name:'Engine Torrent', description:'Torrentio hoặc AIOStreams' } },
            { name:'torrentio_config',  type:'input',  field:{ name:'Torrentio Config',  description:'Link manifest hoặc để trống' } },
            { name:'aio_url',           type:'input',  field:{ name:'AIOStreams URL',     description:'URL manifest AIO' } },
            { name:'jackett_url',       type:'input',  field:{ name:'Jackett URL',        description:'VD: https://jac.red' } },
            { name:'jackett_key',       type:'input',  field:{ name:'Jackett API Key',    description:'API Key của bạn' } },
            { name:'test_jackett',      type:'button', field:{ name:'🧪 Test Jackett',    description:'Kiểm tra kết nối Jackett' },
              onChange: function() {
                var url=getJackettUrl(), key=getJackettKey();
                if (!url) { Lampa.Noty.show('Chưa nhập URL!'); return; }
                if (!key) { Lampa.Noty.show('Chưa nhập Key!'); return; }
                Lampa.Noty.show('Đang test...');
                reguest(url+'/api/v2.0/indexers/all/results?apikey='+key+'&Query=test&Category[]=2000',
                    function() { Lampa.Noty.show('✅ Jackett OK!'); },
                    function(e){ Lampa.Noty.show('❌ '+e); });
              }
            },
            { name:'prowlarr_url',  type:'input',  field:{ name:'Prowlarr URL',     description:'VD: http://192.168.1.100:9696' } },
            { name:'prowlarr_key',  type:'input',  field:{ name:'Prowlarr API Key', description:'Settings → General → API Key' } },
            { name:'test_prowlarr', type:'button', field:{ name:'🧪 Test Prowlarr', description:'Kiểm tra kết nối Prowlarr' },
              onChange: function() {
                var url=getProwlarrUrl(), key=getProwlarrKey();
                if (!url) { Lampa.Noty.show('Chưa nhập URL!'); return; }
                if (!key) { Lampa.Noty.show('Chưa nhập Key!'); return; }
                Lampa.Noty.show('Đang test...');
                reguest(url+'/api/v1/system/status?apikey='+key,
                    function() { Lampa.Noty.show('✅ Prowlarr OK!'); },
                    function(e){ Lampa.Noty.show('❌ '+e); });
              }
            }
        ];

        params.forEach(function(p) {
            Lampa.SettingsApi.addParam({
                component: 'kkparser',
                param: { name: STG_PREFIX+p.name, type: p.type, values: p.values||'', default: p.default||'' },
                field:    p.field,
                onChange: p.onChange || function(v) { Lampa.Storage.set(STG_PREFIX+p.name, v); }
            });
        });
    }

    /* ============================================================
       HOOK — Thêm nút vào trang phim
    ============================================================ */
    Lampa.Listener.follow('full', function(e) {
        if (e.type !== 'complite') return;
        var card = (e.data && e.data.movie) ? e.data.movie : (e.object && e.object.card);
        if (!card) return;

        var $ctx = e.object && e.object.activity
            ? e.object.activity.render()
            : (e.object && e.object.render ? e.object.render() : $('body'));

        if ($ctx.find('.view--kkphim').length) return;

        var isSeries = getMediaType(card) === 'series';

        function mkBtn(cls, svgInner, label, fn) {
            var $b = $(
                '<div class="full-start__button selector ' + cls + '">' +
                '<svg viewBox="0 0 24 24" fill="none" width="44" height="44" ' +
                'stroke="currentColor" stroke-width="1.5" ' +
                'stroke-linecap="round" stroke-linejoin="round">' +
                svgInner + '</svg>' +
                '<span>' + label + '</span></div>'
            );
            $b.on('hover:enter', fn);
            return $b;
        }

        var $kk = mkBtn('view--kkphim',
            '<rect x="2" y="2" width="20" height="20" rx="3"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'KKPhim', function() { searchAndPlay('kkphim', card); }
        );

        var $op = mkBtn('view--ophim',
            '<circle cx="12" cy="12" r="10"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'OPhim', function() { searchAndPlay('ophim', card); }
        );

        var $tr = mkBtn('view--kkparser-torrent',
            '<circle cx="12" cy="12" r="10"/>' +
            '<polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>',
            getTorrentEngine()==='aio' ? 'AIOStreams' : 'Torrentio',
            function() { if (isSeries) askTorrentTV(card); else searchTorrent(card,null,null); }
        );

        var $jk = mkBtn('view--kkparser-jackett',
            '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
            'Jackett', function() {
                var title = card.title||card.name||'';
                var orig  = card.original_title||card.original_name||'';
                var year  = (card.release_date||card.first_air_date||'').slice(0,4);
                var q     = (orig||title)+(year?' '+year:'');
                Lampa.Noty.show('Jackett: đang tìm...');
                fetchJackett(q, function(r) {
                    showTorrentPlusResults(r, title, 'Jackett', card);
                });
            }
        );

        /* ★ Torrent Plus ★ */
        var $tp = mkBtn('view--kkparser-torrentplus',
            /* Icon: lưới + dấu cộng */
            '<path d="M4 6h16M4 10h16M4 14h10"/>' +
            '<circle cx="18" cy="16" r="4" fill="none"/>' +
            '<line x1="18" y1="14" x2="18" y2="18"/>' +
            '<line x1="16" y1="16" x2="20" y2="16"/>',
            'Torrent+',
            function() { showTorrentPlusMenu(card); }
        );

        var $anchor = $ctx.find('.view--torrent');
        if ($anchor.length) {
            $anchor.after($tp).after($jk).after($tr).after($op).after($kk);
        } else {
            $ctx.find('.full-start__buttons').append($kk).append($op).append($tr).append($jk).append($tp);
        }
    });

    /* ============================================================
       START
    ============================================================ */
    function start() {
        initSettings();
        console.log('[KKPhim Parser] v2.1.0 — Torrent Plus: Knaben+TorrentCSV+BTDigg+Prowlarr ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function(e) { if (e.type==='ready') start(); });

})();