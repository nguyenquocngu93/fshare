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

    function buildQuery(card) {
        var title   = card.title || card.name || '';
        var orig    = card.original_title || card.original_name || '';
        var year    = (card.release_date || card.first_air_date || '').slice(0, 4);
        var isMovie = getMediaType(card) === 'movie';
        var q1      = (orig || title).trim();
        if (isMovie && year) q1 += ' ' + year;
        var q2 = (title !== orig && title) ? title.trim() : '';
        return { main: q1, fallback: q2, display: title, isMovie: isMovie };
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

    function tsAdd(link, title, onDone, onFail) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
        jQuery.ajax({
            url:      tsUrl + '/torrents',
            type:     'POST',
            headers:  tsHeaders(),
            data:     JSON.stringify({
                action: 'add', link: link,
                title: title || '', save_to_db: false
            }),
            dataType: 'json', timeout: 15000,
            success: function (d)  { onDone((d && d.hash) || ''); },
            error:   function ()   { onFail && onFail(); }
        });
    }

    function tsGetFiles(hash, onDone) {
        var tsUrl = getTsUrl();
        jQuery.ajax({
            url:      tsUrl + '/torrents',
            type:     'POST',
            headers:  tsHeaders(),
            data:     JSON.stringify({ action: 'get', hash: hash }),
            dataType: 'json', timeout: 15000,
            success: function (data) {
                var files = ((data && data.file_stats) || [])
                    .filter(function (f) {
                        return /\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/i.test(f.path || '');
                    })
                    .sort(function (a, b) {
                        return (a.path || '').localeCompare(b.path || '', undefined, { numeric: true });
                    });
                onDone(files);
            },
            error: function () { onDone([]); }
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

    function tsAddAndPlay(sendLink, hash, torrentTitle, playTitle, card) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
        Lampa.Noty.show('Đang thêm vào TorrServer...');
        tsAdd(sendLink, torrentTitle, function (retHash) {
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
                    title:    name + (em ? ' [Ep ' + (em[1]||em[2]||em[3]) + ']' : ''),
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
       SOURCES — chỉ giữ cái hoạt động thật
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
            magnet:  obj.magnet || makeMagnet(hash, obj.title),
            link:    obj.link   || ''
        };
    }

    function normJackett(r) {
        if (!r.Title || !String(r.Title).trim()) return null;
        var magnetUri  = r.MagnetUri || '';
        var torrentUrl = r.Link      || '';
        var link       = magnetUri   || torrentUrl;
        if (!link) return null;
        var hash = '';
        var hm   = link.match(/btih:([a-f0-9]{32,40})/i);
        if (hm) hash = hm[1].toLowerCase();
        var sb = parseInt(r.Size || 0);
        return {
            title:   String(r.Title).trim(),
            seeds:   parseInt(r.Seeders  || 0),
            peers:   parseInt(r.Leechers || 0),
            size:    sb ? fmtBytes(sb) : '',
            sizeNum: sb,
            tracker: r.Tracker || r.TrackerId || 'Jackett',
            quality: getQuality(r.Title),
            hash:    hash,
            magnet:  magnetUri || (hash ? makeMagnet(hash, r.Title) : ''),
            link:    torrentUrl || magnetUri
        };
    }

    /* ✅ Bitsearch — hoạt động */
    function fetchBitsearch(query, cb) {
        reguest(
            'https://bitsearch.to/api/v1/search?q=' +
            encodeURIComponent(query) + '&category=1&sort=seeders',
            function (data) {
                var raw  = typeof data === 'string' ? JSON.parse(data) : data;
                var list = (raw && raw.results)
                    ? raw.results
                    : (Array.isArray(raw) ? raw : []);
                cb(list.map(function (r) {
                    var bytes = parseInt(r.size || 0);
                    return normResult({
                        title:   r.name  || r.title    || '',
                        hash:    r.info_hash || r.infohash || r.hash || '',
                        seeds:   parseInt(r.seeders  || r.seeds   || 0),
                        peers:   parseInt(r.leechers || r.peers   || 0),
                        size:    bytes ? fmtBytes(bytes) : '',
                        sizeNum: bytes,
                        tracker: 'Bitsearch'
                    });
                }).filter(Boolean));
            },
            function (e) { console.warn('[Bitsearch]', e); cb([]); }
        );
    }

    /* ✅ TorrentsCSV — hoạt động */
    function fetchTorrentsCSV(query, cb) {
        reguest(
            'https://torrents-csv.com/service/search?q=' +
            encodeURIComponent(query) + '&size=50&page=1',
            function (data) {
                var raw  = typeof data === 'string' ? JSON.parse(data) : data;
                var list = (raw && raw.torrents) ? raw.torrents : [];
                cb(list.map(function (t) {
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
                }).filter(Boolean));
            },
            function (e) { console.warn('[TorrCSV]', e); cb([]); }
        );
    }

    /* ✅ Jackett — hoạt động (user tự host) */
    function fetchJackett(query, cb) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url || !key) { cb([]); return; }
        reguest(
            url + '/api/v2.0/indexers/all/results' +
            '?apikey=' + encodeURIComponent(key) +
            '&Query='  + encodeURIComponent(query) +
            '&Category[]=2000&Category[]=5000',
            function (data) {
                var d   = typeof data === 'string' ? JSON.parse(data) : data;
                var raw = (d && d.Results) ? d.Results : [];
                cb(raw.map(normJackett).filter(function (r) {
                    return r && (r.magnet || r.link);
                }));
            },
            function (e) { console.warn('[Jackett]', e); cb([]); }
        );
    }

    /* ============================================================
       MULTI SEARCH — song song Bitsearch + TorrCSV
    ============================================================ */
    var QUALITY_ORDER = ['2160P','4K','UHD','REMUX','1080P','1080I','720P','480P'];

    function searchAllSources(query, onDone) {
        var combined = [], seenHash = {};
        /* Chỉ 2 nguồn xác nhận hoạt động */
        var sources  = [fetchBitsearch, fetchTorrentsCSV];
        var total    = sources.length, done = 0;

        function finish(results) {
            results.forEach(function (r) {
                if (r.hash) {
                    if (!seenHash[r.hash]) {
                        seenHash[r.hash] = true;
                        combined.push(r);
                    }
                } else {
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

    /* ============================================================
       HIỂN THỊ KẾT QUẢ
    ============================================================ */
    function showTorrentMenu(results, displayTitle, card) {
        if (!results || !results.length) {
            Lampa.Noty.show('Không tìm thấy kết quả nào');
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
            group.slice(0, 20).forEach(function (r) {
                var name    = r.title.length > 60 ? r.title.slice(0, 57) + '…' : r.title;
                var seedTxt = r.seeds > 0 ? '👤 ' + r.seeds : '⚠ 0 seed';
                var peerTxt = r.peers > 0 ? '/' + r.peers   : '';
                var sizeTxt = r.size       ? '  💾 ' + r.size : '';
                items.push({
                    title:    '🧲 [' + r.tracker + '] ' + name,
                    subtitle: seedTxt + peerTxt + sizeTxt,
                    r:        r
                });
            });
        });

        Lampa.Select.show({
            title: '🔍 ' + displayTitle + ' (' + results.length + ')',
            items: items,
            onSelect: function (item) {
                if (item.separator) return;
                var r     = item.r;
                var tsUrl = getTsUrl();
                if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
                var sendLink = r.magnet || r.link;
                if (!sendLink) { Lampa.Noty.show('Không có link'); return; }
                tsAddAndPlay(sendLink, r.hash, r.title, displayTitle, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       ENTRY POINTS
    ============================================================ */
    function doSearchMulti(card) {
        var q = buildQuery(card);
        Lampa.Noty.show('🔍 Bitsearch + TorrCSV: ' + q.main);
        searchAllSources(q.main, function (results) {
            if (!results.length && q.fallback) {
                Lampa.Noty.show('Thử lại: ' + q.fallback);
                searchAllSources(q.fallback, function (r2) {
                    showTorrentMenu(r2, q.display, card);
                });
            } else {
                showTorrentMenu(results, q.display, card);
            }
        });
    }

    function doSearchJackett(card) {
        var q   = buildQuery(card);
        var url = getJackettUrl(), key = getJackettKey();
        if (!url || !key) { Lampa.Noty.show('Vào Settings → cấu hình Jackett!'); return; }
        Lampa.Noty.show('Jackett: đang tìm "' + q.main + '"...');
        fetchJackett(q.main, function (results) {
            if (!results.length && q.fallback) {
                Lampa.Noty.show('Jackett: thử "' + q.fallback + '"...');
                fetchJackett(q.fallback, function (r2) {
                    showTorrentMenu(r2, q.display, card);
                });
            } else {
                showTorrentMenu(results, q.display, card);
            }
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
                    name:        'TorrServer URL',
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
                    if (!u) { Lampa.Noty.show('Chưa có URL!'); return; }
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
                field: { name: 'Jackett URL', description: 'VD: https://jac.maxvol.pro' }
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
                        u + '/api/v2.0/indexers/all/results?apikey=' + k +
                        '&Query=test&Category[]=2000',
                        function (data) {
                            var d = typeof data === 'string' ? JSON.parse(data) : data;
                            var n = (d && d.Results) ? d.Results.length : 0;
                            Lampa.Noty.show('✅ Jackett OK! ' + n + ' kết quả');
                        },
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
                onChange: p.onChange || function (v) {
                    Lampa.Storage.set(STG_PREFIX + p.name, v);
                }
            });
        });
    }

    /* ============================================================
       HOOK UI
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

        var $mt = mkBtn('view--tplus-multi',
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
            '<line x1="11" y1="8"  x2="11" y2="14"/>' +
            '<line x1="8"  y1="11" x2="14" y2="11"/>',
            'Torrent+',
            function () { doSearchMulti(card); }
        );

        var $jk = mkBtn('view--tplus-jackett',
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>',
            'Jackett',
            function () { doSearchJackett(card); }
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
        console.log('[Torrent+] v1.4 — Bitsearch ✅ | TorrCSV ✅ | Jackett ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();