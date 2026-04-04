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

    // ═══════════════════════════════════════════════════════════
    // TORRENTIO PROVIDERS & OPTIONS
    // ═══════════════════════════════════════════════════════════
    var TORRENTIO_PROVIDERS = {
        'yts':                { name: 'YTS',                 desc: 'Movies (small size)' },
        'eztv':               { name: 'EZTV',                desc: 'TV Shows' },
        'rarbg':              { name: 'RARBG',               desc: 'Movies & TV' },
        '1337x':              { name: '1337x',               desc: 'General' },
        'thepiratebay':       { name: 'The Pirate Bay',      desc: 'General' },
        'kickasstorrents':    { name: 'KickassTorrents',     desc: 'General' },
        'torrentgalaxy':      { name: 'TorrentGalaxy',       desc: 'General' },
        'magnetdl':           { name: 'MagnetDL',            desc: 'General' },
        'horriblesubs':       { name: 'HorribleSubs',        desc: 'Anime' },
        'nyaasi':             { name: 'Nyaa.si',             desc: 'Anime' },
        'tokyotosho':         { name: 'TokyoTosho',          desc: 'Anime' },
        'anidex':             { name: 'AniDex',              desc: 'Anime' },
        'rutor':              { name: 'Rutor',               desc: 'Russian' },
        'rutracker':          { name: 'RuTracker',           desc: 'Russian' },
        'comando':            { name: 'Comando',             desc: 'Portuguese' },
        'bluetigers':         { name: 'BlueTigers',          desc: 'Italian' },
        'ilcorsaronero':      { name: 'IlCorsaroNero',       desc: 'Italian' },
        'mejortorrent':       { name: 'MejorTorrent',        desc: 'Spanish' }
    };

    var TORRENTIO_QUALITY = {
        'scr':       { name: 'Screener',        desc: 'Loại bỏ Screener' },
        'cam':       { name: 'CAM',             desc: 'Loại bỏ CAM quality' },
        'unknown':   { name: 'Unknown',         desc: 'Loại bỏ Unknown quality' },
        '480p':      { name: '480p',            desc: 'Loại bỏ 480p' },
        '720p':      { name: '720p',            desc: 'Loại bỏ 720p' },
        '1080p':     { name: '1080p',           desc: 'Loại bỏ 1080p' },
        '2160p':     { name: '4K/2160p',        desc: 'Loại bỏ 4K' },
        'brremux':   { name: 'BluRay REMUX',    desc: 'Loại bỏ REMUX (file lớn)' },
        'hdrall':    { name: 'HDR (all)',       desc: 'Loại bỏ tất cả HDR' },
        'dolbyvision': { name: 'Dolby Vision', desc: 'Loại bỏ Dolby Vision' }
    };

    var TORRENTIO_SORT = {
        'qualitysize':  { name: 'Chất lượng + Size',  desc: 'Ưu tiên chất lượng, sau đó size' },
        'qualityseeds': { name: 'Chất lượng + Seeds', desc: 'Ưu tiên chất lượng, sau đó seeds' },
        'size':         { name: 'Size (lớn → nhỏ)',   desc: 'File lớn nhất trước' },
        'seeds':        { name: 'Seeds (nhiều → ít)', desc: 'Nhiều seeds nhất trước' }
    };

    var TORRENTIO_LANGUAGES = {
        'vietnamese':  { name: '🇻🇳 Tiếng Việt',    code: 'vi' },
        'english':     { name: '🇺🇸 English',       code: 'en' },
        'japanese':    { name: '🇯🇵 日本語',        code: 'ja' },
        'korean':      { name: '🇰🇷 한국어',        code: 'ko' },
        'chinese':     { name: '🇨🇳 中文',          code: 'zh' },
        'thai':        { name: '🇹🇭 ไทย',          code: 'th' },
        'french':      { name: '🇫🇷 Français',      code: 'fr' },
        'german':      { name: '🇩🇪 Deutsch',       code: 'de' },
        'spanish':     { name: '🇪🇸 Español',       code: 'es' },
        'portuguese':  { name: '🇧🇷 Português',     code: 'pt' },
        'russian':     { name: '🇷🇺 Русский',       code: 'ru' },
        'italian':     { name: '🇮🇹 Italiano',      code: 'it' },
        'hindi':       { name: '🇮🇳 हिन्दी',        code: 'hi' },
        'arabic':      { name: '🇸🇦 العربية',       code: 'ar' }
    };

    var AIO_SORT_OPTIONS = {
        'quality':     { name: 'Chất lượng',      desc: 'Sắp xếp theo quality' },
        'size_desc':   { name: 'Size ↓',          desc: 'File lớn trước' },
        'size_asc':    { name: 'Size ↑',          desc: 'File nhỏ trước' },
        'seeds_desc':  { name: 'Seeds ↓',         desc: 'Nhiều seeds trước' },
        'seeds_asc':   { name: 'Seeds ↑',         desc: 'Ít seeds trước' }
    };

    /* ════════════════════════════════════════════════════════════
       STORAGE FUNCTIONS
    ════════════════════════════════════════════════════════════ */
    function getSetting(key)      { return Lampa.Storage.get(STG_PREFIX + key, ''); }
    function setSetting(key, val) { Lampa.Storage.set(STG_PREFIX + key, val); }
    function getSettingArray(key) {
        var val = getSetting(key);
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val); } catch(e) { return val.split(',').filter(Boolean); }
    }
    function setSettingArray(key, arr) {
        setSetting(key, JSON.stringify(arr || []));
    }

    function getTsUrl() {
        var url = getSetting('torrserver_url') || '';
        if (!url) return null;
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
        return url;
    }
    function getTsPass()        { return getSetting('torrserver_pass') || ''; }
    function getTorrentEngine() { return getSetting('torrent_engine') || 'torrentio'; }
    function getAioUrl()        { return (getSetting('aio_url') || '').replace(/\/manifest\.json\s*$/i, '').replace(/\/+$/, ''); }
    function getAioSort()       { return getSetting('aio_sort') || 'quality'; }

    function getJackettUrl() {
        var url = getSetting('jackett_url') || '';
        if (!url) return '';
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        return url;
    }
    function getJackettKey() { return getSetting('jackett_key') || ''; }

    // Build Torrentio config from settings
    function buildTorrentioConfig() {
        var parts = [];
        
        // Providers
        var providers = getSettingArray('tio_providers');
        if (providers.length > 0) {
            parts.push('providers=' + providers.join(','));
        }
        
        // Quality filter (loại bỏ)
        var qualityFilter = getSettingArray('tio_quality_filter');
        if (qualityFilter.length > 0) {
            parts.push('qualityfilter=' + qualityFilter.join(','));
        }
        
        // Sort
        var sort = getSetting('tio_sort') || 'qualitysize';
        parts.push('sort=' + sort);
        
        // Languages
        var languages = getSettingArray('tio_languages');
        if (languages.length > 0) {
            parts.push('language=' + languages.join(','));
        }
        
        return parts.join('|');
    }

    /* ════════════════════════════════════════════════════════════
       HELPERS
    ════════════════════════════════════════════════════════════ */
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
            '&tr=' + encodeURIComponent('udp://tracker.torrent.eu.org:451/announce');
    }

    function parseSize(str) {
        if (!str) return 0;
        var m = String(str).match(/([\d.,]+)\s*(TB|GB|MB|KB)/i);
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
        return b + ' B';
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

    function reguest(url, onOk, onFail) {
        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(url,
            function (data) { onOk(data); },
            function (a, b) {
                var code = (a && a.status) ? a.status : 0;
                (onFail || function () {})(code ? 'HTTP ' + code : (b || 'Error'));
            }
        );
    }

    /* ════════════════════════════════════════════════════════════
       PLAY HELPER
    ════════════════════════════════════════════════════════════ */
    function doPlay(params) {
        var card    = params.card    || {};
        var url     = params.url     || '';
        var title   = params.title   || card.title || card.name || '';
        var episode = params.episode || null;

        if (!url) { Lampa.Noty.show('Không có link phát'); return; }

        var obj = { title: title, url: url, poster: card.poster || card.img || '', movie: card };
        if (episode) { obj.season = episode.season; obj.episode = episode.episode; }

        Lampa.Player.play(obj);
        try { if (Lampa.Timeline && Lampa.Timeline.update) Lampa.Timeline.update(card, { percent: 0 }); } catch(e) {}
        try { if (Lampa.Favorite && Lampa.Favorite.add) Lampa.Favorite.add('history', Object.assign({}, card)); } catch(e) {}
    }

    /* ════════════════════════════════════════════════════════════
       TORRSERVER
    ════════════════════════════════════════════════════════════ */
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
            url: tsUrl + '/torrents',
            type: 'POST',
            headers: tsHeaders(),
            data: JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
            dataType: 'json',
            timeout: 15000,
            success: function (data) { onDone((data && data.hash) || ''); },
            error:   function ()     { onFail && onFail(); }
        });
    }

    function tsGetFiles(hash, onDone) {
        var tsUrl = getTsUrl();
        $.ajax({
            url: tsUrl + '/torrents',
            type: 'POST',
            headers: tsHeaders(),
            data: JSON.stringify({ action: 'get', hash: hash }),
            dataType: 'json',
            timeout: 15000,
            success: function (data) {
                var files = ((data && data.file_stats) || [])
                    .filter(function (f) {
                        return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/);
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
        var name  = encodeURIComponent(title || 'video');
        var url   = tsUrl + '/stream/' + name + '?link=' + hash + '&index=' + fileId + '&play';
        doPlay({ url: url, title: title, card: card });
    }

    function tsAddAndPickFile(magnet, hash, torrentTitle, playTitle, card) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }

        Lampa.Noty.show('Đang thêm vào TorrServer...');

        tsAdd(magnet, torrentTitle, function (returnedHash) {
            var h = returnedHash || hash;
            if (!h) {
                Lampa.Noty.show('Không lấy được hash từ TorrServer');
                return;
            }

            Lampa.Noty.show('Đang tải danh sách file...');

            var tries = 0, maxTries = 5;

            function tryGetFiles() {
                tries++;
                tsGetFiles(h, function (files) {
                    if (!files.length && tries < maxTries) {
                        setTimeout(tryGetFiles, 2000);
                        return;
                    }

                    if (!files.length) {
                        Lampa.Noty.show('Phát file đầu tiên...');
                        tsPlayFile(h, 0, playTitle, card);
                        return;
                    }

                    if (files.length === 1) {
                        tsPlayFile(h, files[0].id || 0, playTitle, card);
                        return;
                    }

                    showFileList(files, h, playTitle, card);
                });
            }

            setTimeout(tryGetFiles, 2000);

        }, function () {
            Lampa.Noty.show('TorrServer lỗi, thử phát trực tiếp...');
            if (hash) tsPlayFile(hash, 0, playTitle, card);
        });
    }

    function showFileList(files, hash, playTitle, card) {
        Lampa.Select.show({
            title: '📂 Chọn file — ' + playTitle,
            items: files.map(function (f) {
                var parts    = (f.path || '').split('/');
                var filename = parts[parts.length - 1] || f.path || 'File';
                var size     = f.length ? ' — ' + fmtBytes(f.length) : '';
                var epMatch  = filename.match(/[Ee](\d+)|[Сс](\d+)|[Ее]пизод\s*(\d+)|\b(\d{2,3})\b/);
                var epLabel  = epMatch ? ' [Ep ' + (epMatch[1] || epMatch[2] || epMatch[3] || epMatch[4]) + ']' : '';

                return { title: filename + epLabel, subtitle: size.trim(), file: f };
            }),
            onSelect: function (item) {
                var f = item.file;
                var fTitle = playTitle + ' — ' + (f.path || '').split('/').pop();
                tsPlayFile(hash, f.id || 0, fTitle, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // TORRSERVER SPEED TEST
    // ═══════════════════════════════════════════════════════════
    function testTorrServerSpeed() {
        var tsUrl = getTsUrl();
        if (!tsUrl) {
            Lampa.Noty.show('❌ Chưa cấu hình TorrServer!');
            return;
        }

        Lampa.Noty.show('🔄 Đang test tốc độ TorrServer...');

        // Test với 1 file nhỏ để đo latency và throughput
        var testMagnet = 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny';
        var startTime = Date.now();
        
        $.ajax({
            url: tsUrl + '/echo',
            type: 'GET',
            timeout: 5000,
            success: function () {
                var pingTime = Date.now() - startTime;
                
                // Lấy thông tin server
                $.ajax({
                    url: tsUrl + '/settings',
                    type: 'POST',
                    headers: tsHeaders(),
                    data: JSON.stringify({ action: 'get' }),
                    dataType: 'json',
                    timeout: 5000,
                    success: function (settings) {
                        var cacheSize = settings && settings.CacheSize 
                            ? fmtBytes(settings.CacheSize) 
                            : 'N/A';
                        var preloadSize = settings && settings.PreloadBuffer
                            ? fmtBytes(settings.PreloadBuffer)
                            : 'N/A';
                        
                        // Hiển thị kết quả
                        showSpeedTestResult({
                            ping: pingTime,
                            cacheSize: cacheSize,
                            preloadSize: preloadSize,
                            status: 'online'
                        });
                    },
                    error: function () {
                        showSpeedTestResult({
                            ping: pingTime,
                            cacheSize: 'N/A',
                            preloadSize: 'N/A',
                            status: 'online'
                        });
                    }
                });
            },
            error: function () {
                showSpeedTestResult({ status: 'offline' });
            }
        });
    }

    function showSpeedTestResult(result) {
        if (result.status === 'offline') {
            Lampa.Select.show({
                title: '❌ TorrServer Speed Test',
                items: [
                    { title: '🔴 Trạng thái: OFFLINE', subtitle: 'Không thể kết nối' },
                    { title: '💡 Kiểm tra:', subtitle: 'URL, mạng, firewall' }
                ],
                onSelect: function () {},
                onBack: function () { Lampa.Controller.toggle('settings'); }
            });
            return;
        }

        var pingStatus = result.ping < 100 ? '🟢 Tuyệt vời' :
                         result.ping < 300 ? '🟡 Tốt' :
                         result.ping < 500 ? '🟠 Trung bình' : '🔴 Chậm';

        Lampa.Select.show({
            title: '✅ TorrServer Speed Test',
            items: [
                { title: '🟢 Trạng thái: ONLINE', subtitle: 'Kết nối thành công' },
                { title: '⚡ Ping: ' + result.ping + 'ms', subtitle: pingStatus },
                { title: '💾 Cache Size: ' + result.cacheSize, subtitle: 'Bộ nhớ đệm' },
                { title: '📥 Preload Buffer: ' + result.preloadSize, subtitle: 'Buffer tải trước' },
                { title: '', subtitle: '' },
                { title: '💡 Mẹo tối ưu:', subtitle: '' },
                { title: '• Cache 512MB+ cho 4K', subtitle: '' },
                { title: '• Preload 32MB+ để stream mượt', subtitle: '' }
            ],
            onSelect: function () {},
            onBack: function () { Lampa.Controller.toggle('settings'); }
        });
    }

    /* ════════════════════════════════════════════════════════════
       KKPHIM / OPHIM - SEASON DETECTION
    ════════════════════════════════════════════════════════════ */
    function extractSeasonNumber(name, slug) {
        var text = (name || '') + ' ' + (slug || '');
        var patterns = [
            /[Ss]eason[\s\-._]*(\d+)/i,
            /[Pp]h[aầ]n[\s\-._]*(\d+)/i,
            /[Mm][uù]a[\s\-._]*(\d+)/i,
            /\bS(\d+)\b/,
        ];
        for (var i = 0; i < patterns.length; i++) {
            var m = text.match(patterns[i]);
            if (m) return parseInt(m[1]);
        }
        return 1;
    }

    function getBaseSlug(slug) {
        if (!slug) return '';
        return slug
            .replace(/-?season-?\d+/gi, '')
            .replace(/-?phan-?\d+/gi, '')
            .replace(/-?mua-?\d+/gi, '')
            .replace(/-?s\d+$/gi, '')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }

    function getBaseName(name) {
        if (!name) return '';
        return name
            .replace(/[\s\-]*[\(\[]?\s*[Ss]eason\s*\d+\s*[\)\]]?/gi, '')
            .replace(/[\s\-]*[\(\[]?\s*[Pp]h[aầ]n\s*\d+\s*[\)\]]?/gi, '')
            .replace(/[\s\-]*[\(\[]?\s*[Mm][uù]a\s*\d+\s*[\)\]]?/gi, '')
            .replace(/[\s\-]*\bS\d+\b/g, '')
            .trim();
    }

    function searchSource(source, keyword, cb) {
        reguest(
            source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&limit=30',
            function (data) {
                var items = [];
                if (data && data.status === 'success' && data.data && data.data.items) {
                    items = data.data.items;
                } else if (data && data.data && data.data.items) {
                    items = data.data.items;
                } else if (data && data.items) {
                    items = data.items;
                }
                cb(items);
            },
            function () { cb([]); }
        );
    }

    function fetchDetail(source, slug, cb) {
        reguest(
            source.api + 'v1/api/phim/' + slug,
            function (data) {
                if (data && data.status === 'success' && data.data) {
                    var item = data.data.item || data.data;
                    var episodes = data.data.episodes || item.episodes || [];
                    cb({ movie: item, episodes: episodes });
                } else {
                    reguest(
                        source.api + 'phim/' + slug,
                        function (data2) {
                            cb({
                                movie: data2.movie || data2.item || data2 || {},
                                episodes: data2.episodes || []
                            });
                        },
                        function () { cb({ movie: {}, episodes: [] }); }
                    );
                }
            },
            function () {
                reguest(
                    source.api + 'phim/' + slug,
                    function (data2) {
                        cb({
                            movie: data2.movie || data2.item || data2 || {},
                            episodes: data2.episodes || []
                        });
                    },
                    function () { cb({ movie: {}, episodes: [] }); }
                );
            }
        );
    }

    function matchScore(item, title, orig, year) {
        var score = 0;
        var nT = normalizeStr(title), nO = normalizeStr(orig);
        var n1 = normalizeStr(item.name || '');
        var n2 = normalizeStr(item.origin_name || '');

        var nT_base = normalizeStr(getBaseName(title));
        var nO_base = normalizeStr(getBaseName(orig));
        var n1_base = normalizeStr(getBaseName(item.name || ''));
        var n2_base = normalizeStr(getBaseName(item.origin_name || ''));

        if (nT && (n1 === nT || n2 === nT)) score += 100;
        else if (nO && (n1 === nO || n2 === nO)) score += 100;
        else if (nT_base && (n1_base === nT_base || n2_base === nT_base)) score += 90;
        else if (nO_base && (n1_base === nO_base || n2_base === nO_base)) score += 90;
        else if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 50;
        else if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1)) score += 50;

        if (year && item.year) {
            var iy = parseInt(item.year), ty = parseInt(year);
            if (iy === ty) score += 30;
            else if (Math.abs(iy - ty) <= 1) score += 15;
        }
        return score;
    }

    function findAllSeasons(source, keyword, title, orig, year, cb) {
        var baseKeyword = getBaseName(keyword);
        var baseTitle = getBaseName(title);
        var baseOrig = getBaseName(orig);

        var terms = [];
        if (baseOrig) terms.push(baseOrig);
        if (baseTitle && terms.indexOf(baseTitle) === -1) terms.push(baseTitle);
        if (baseKeyword && terms.indexOf(baseKeyword) === -1) terms.push(baseKeyword);
        if (orig && terms.indexOf(orig) === -1) terms.push(orig);
        if (title && terms.indexOf(title) === -1) terms.push(title);
        if (!terms.length) terms.push(keyword);

        var allResults = [];
        var searchIdx = 0;

        function doSearch() {
            if (searchIdx >= terms.length) {
                processResults(allResults);
                return;
            }

            var term = terms[searchIdx];
            searchIdx++;

            searchSource(source, term, function (items) {
                for (var i = 0; i < items.length; i++) {
                    var exists = false;
                    for (var j = 0; j < allResults.length; j++) {
                        if (allResults[j].slug === items[i].slug) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) allResults.push(items[i]);
                }
                doSearch();
            });
        }

        function processResults(results) {
            if (!results.length) { cb(null); return; }

            var groups = {};
            for (var i = 0; i < results.length; i++) {
                var item = results[i];
                var base = getBaseSlug(item.slug || '');
                var seasonNum = extractSeasonNumber(item.name, item.slug);

                if (!groups[base]) groups[base] = [];

                var duplicate = false;
                for (var d = 0; d < groups[base].length; d++) {
                    if (groups[base][d].season_num === seasonNum && groups[base][d].slug === item.slug) {
                        duplicate = true;
                        break;
                    }
                }

                if (!duplicate) {
                    groups[base].push({
                        season_num: seasonNum,
                        slug: item.slug,
                        name: item.name || '',
                        origin_name: item.origin_name || '',
                        year: item.year || '',
                        type: item.type || '',
                        poster: item.poster_url || item.thumb_url || ''
                    });
                }
            }

            var targetSlug = getBaseSlug(
                normalizeStr(orig || title || keyword)
                    .replace(/[^\w\s]/g, '')
                    .replace(/\s+/g, '-')
            );

            var bestGroup = null;
            var bestScore = -1;

            for (var base in groups) {
                if (!groups.hasOwnProperty(base)) continue;

                var score = 0;
                var seasons = groups[base];

                if (base === targetSlug) score = 100;
                else if (base.indexOf(targetSlug) > -1 || targetSlug.indexOf(base) > -1) score = 70;
                else {
                    var baseWords = base.split('-').filter(Boolean);
                    var targetWords = targetSlug.split('-').filter(Boolean);
                    var common = 0;
                    for (var w = 0; w < targetWords.length; w++) {
                        if (baseWords.indexOf(targetWords[w]) > -1) common++;
                    }
                    if (common > 0) {
                        score = (common / Math.max(baseWords.length, targetWords.length)) * 60;
                    }
                }

                for (var s = 0; s < seasons.length; s++) {
                    var ms = matchScore(seasons[s], title, orig, year);
                    if (ms > 0) score = Math.max(score, ms);
                }

                if (seasons.length > 1) score += 5;

                if (year) {
                    for (var y = 0; y < seasons.length; y++) {
                        if (String(seasons[y].year) === String(year)) {
                            score += 10;
                            break;
                        }
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestGroup = { base: base, seasons: seasons };
                }
            }

            if (!bestGroup || bestScore < 10) {
                var first = results[0];
                cb({
                    movie_name: getBaseName(first.origin_name || first.name || ''),
                    seasons: [{
                        season_num: 1, slug: first.slug, name: first.name || '',
                        origin_name: first.origin_name || '', year: first.year || '', type: first.type || ''
                    }]
                });
                return;
            }

            bestGroup.seasons.sort(function (a, b) { return a.season_num - b.season_num; });

            var unique = [];
            var seenNums = {};
            for (var u = 0; u < bestGroup.seasons.length; u++) {
                var sn = bestGroup.seasons[u].season_num;
                if (!seenNums[sn]) {
                    seenNums[sn] = true;
                    unique.push(bestGroup.seasons[u]);
                }
            }

            var movieName = '';
            if (unique.length > 0) movieName = getBaseName(unique[0].origin_name || unique[0].name || '');
            if (!movieName) movieName = title || keyword;

            cb({ movie_name: movieName, seasons: unique });
        }

        doSearch();
    }

    function cleanName(name) { return (name || '').replace(/^#+\s*/, '').trim(); }

    /* ════════════════════════════════════════════════════════════
       KKPHIM/OPHIM FLOW
    ════════════════════════════════════════════════════════════ */
    function searchAndPlay(sourceKey, card) {
        var source = SOURCES[sourceKey];
        if (!source) return;

        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);

        Lampa.Noty.show(source.name + ': đang tìm tất cả season...');

        findAllSeasons(source, title, title, orig, year, function (result) {
            if (!result || !result.seasons || !result.seasons.length) {
                Lampa.Noty.show(source.name + ': thử tìm thủ công...');
                var searchTerm = orig || title;
                searchSource(source, searchTerm, function (items) {
                    if (!items.length && orig && title !== orig) {
                        searchSource(source, title, function (items2) {
                            showManualSelect(source, items2, card);
                        });
                    } else {
                        showManualSelect(source, items, card);
                    }
                });
                return;
            }
            showSeasonMenu(source, result, card);
        });
    }

    function showSeasonMenu(source, result, card) {
        var seasons = result.seasons;
        var movieName = result.movie_name;
        var title = card.title || card.name || movieName;

        if (seasons.length === 1) {
            Lampa.Noty.show('Đang tải ' + seasons[0].name + '...');
            loadSeasonEpisodes(source, seasons[0], card, title);
            return;
        }

        Lampa.Select.show({
            title: '📺 ' + movieName + ' — ' + seasons.length + ' Season',
            items: seasons.map(function (s, idx) {
                return {
                    title: 'Season ' + s.season_num + ': ' + s.name,
                    subtitle: s.year ? 'Năm: ' + s.year : '',
                    season: s, index: idx
                };
            }),
            onSelect: function (item) {
                Lampa.Noty.show('Đang tải ' + item.season.name + '...');
                loadSeasonEpisodes(source, item.season, card, title);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function loadSeasonEpisodes(source, season, card, movieTitle) {
        fetchDetail(source, season.slug, function (data) {
            var eps = data.episodes || [];
            if (!eps.length) {
                Lampa.Noty.show('Không có tập phim cho ' + season.name);
                return;
            }
            playEpisode(card, eps, season.season_num, movieTitle, season.name);
        });
    }

    function playEpisode(card, episodes, seasonNum, movieTitle, seasonName) {
        var displayTitle = seasonName || movieTitle || card.title || card.name || '';

        var servers = (episodes || []).filter(function (srv) {
            return srv.server_data && srv.server_data.length > 0;
        });

        if (!servers.length) { Lampa.Noty.show('Không có tập phim'); return; }

        if (servers.length === 1) {
            showEpisodeMenu(displayTitle, servers[0], card, seasonNum);
            return;
        }

        Lampa.Select.show({
            title: displayTitle + ' — Chọn phiên bản',
            items: servers.map(function (srv, idx) {
                var name  = cleanName(srv.server_name) || ('Phiên bản ' + (idx + 1));
                var count = (srv.server_data || []).length;
                return { title: name, subtitle: count + ' tập', srv: srv };
            }),
            onSelect: function (item) { showEpisodeMenu(displayTitle, item.srv, card, seasonNum); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function showEpisodeMenu(title, serverData, card, seasonNum) {
        var eps = serverData.server_data || [];
        var srvName = cleanName(serverData.server_name);
        var menuTitle = title + (srvName ? ' · ' + srvName : '');
        var sNum = seasonNum || 1;

        if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }

        var playlist = eps.map(function (ep, idx) {
            return {
                title: menuTitle + ' — ' + (ep.name || ('Tập ' + (idx + 1))),
                url: ep.link_m3u8 || ep.link_embed || '',
                movie: card, season: sNum, episode: idx + 1
            };
        });

        Lampa.Select.show({
            title: '🎬 ' + menuTitle + ' (' + eps.length + ' tập)',
            items: eps.map(function (ep, idx) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                return {
                    title: ep.name || ('Tập ' + (idx + 1)),
                    subtitle: !link ? '⚠ Không có link' : (link.indexOf('.m3u8') > -1 ? '🎬 M3U8' : '🌐 Embed'),
                    ep: ep, idx: idx
                };
            }),
            onSelect: function (item) {
                var link = item.ep.link_m3u8 || item.ep.link_embed || '';
                if (!link) { Lampa.Noty.show('Không có link phát'); return; }
                doPlay({
                    url: link,
                    title: menuTitle + ' — ' + (item.ep.name || ('Tập ' + (item.idx + 1))),
                    card: card,
                    episode: { season: sNum, episode: item.idx + 1 }
                });
                try { Lampa.Player.playlist(playlist, item.idx); } catch(e) {}
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function showManualSelect(source, items, card) {
        if (!items || !items.length) {
            Lampa.Noty.show('Không tìm thấy trên ' + source.name);
            return;
        }
        Lampa.Select.show({
            title: source.name + ' — Kết quả tìm kiếm',
            items: items.map(function (it) {
                var seasonNum = extractSeasonNumber(it.name, it.slug);
                var seasonLabel = seasonNum > 1 ? ' [S' + seasonNum + ']' : '';
                return {
                    title: (it.name || '') + (it.origin_name ? ' (' + it.origin_name + ')' : '') + seasonLabel + (it.year ? ' [' + it.year + ']' : ''),
                    subtitle: 'Slug: ' + it.slug,
                    slug: it.slug, item: it
                };
            }),
            onSelect: function (sel) {
                if (sel.slug) {
                    var sNum = extractSeasonNumber(sel.item.name, sel.item.slug);
                    Lampa.Noty.show('Đang tải...');
                    fetchDetail(source, sel.slug, function (data) {
                        var eps = data.episodes || [];
                        if (!eps.length) { Lampa.Noty.show('Không có tập phim'); return; }
                        playEpisode(card, eps, sNum, card.title || card.name, sel.item.name);
                    });
                }
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ════════════════════════════════════════════════════════════
       JACKETT
    ════════════════════════════════════════════════════════════ */
    function fetchJackett(query, cb) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url) { Lampa.Noty.show('Chưa cấu hình Jackett!'); cb([]); return; }
        if (!key) { Lampa.Noty.show('Chưa nhập API Key!'); cb([]); return; }

        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(key) +
            '&Query=' + encodeURIComponent(query) + '&Category[]=2000&Category[]=5000',
            function (data) {
                var d = typeof data === 'string' ? JSON.parse(data) : data;
                var results = ((d && d.Results) || []).map(function (r) {
                    var link = r.MagnetUri || r.Link || '';
                    if (!link) return null;
                    var hm = link.match(/btih:([a-f0-9]+)/i);
                    var qm = (r.Title || '').match(/\b(2160p|4K|1080p|720p|480p|BluRay|WEB-?DL|HDRip)\b/i);
                    return {
                        title: r.Title || '',
                        seeds: parseInt(r.Seeders) || 0,
                        peers: parseInt(r.Peers) || 0,
                        size: fmtBytes(parseInt(r.Size) || 0),
                        sizeNum: parseInt(r.Size) || 0,
                        tracker: r.Tracker || 'Jackett',
                        quality: qm ? qm[1] : '',
                        hash: hm ? hm[1].toLowerCase() : '',
                        magnet: link
                    };
                }).filter(Boolean).sort(function (a, b) { return b.sizeNum - a.sizeNum; });
                cb(results);
            },
            function (e) { Lampa.Noty.show('Jackett lỗi: ' + e); cb([]); }
        );
    }

    function searchJackett(card) {
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query = (orig || title) + (year ? ' ' + year : '');

        Lampa.Noty.show('Jackett: đang tìm...');
        fetchJackett(query, function (r) {
            if (!r.length && orig && orig !== title) {
                fetchJackett(title + (year ? ' ' + year : ''), function (r2) {
                    showPackMenu(r2, title, 'Jackett', card);
                });
            } else {
                showPackMenu(r, title, 'Jackett', card);
            }
        });
    }

    /* ════════════════════════════════════════════════════════════
       PACK MENU
    ════════════════════════════════════════════════════════════ */
    function showPackMenu(results, movieTitle, label, card) {
        if (!results || !results.length) {
            Lampa.Noty.show(label + ': Không tìm thấy');
            return;
        }

        var tsUrl = getTsUrl();

        Lampa.Select.show({
            title: '🧲 ' + label + ': ' + movieTitle + ' (' + results.length + ')',
            items: results.map(function (r) {
                var line1 = '[' + (r.tracker || label) + ']' + (r.quality ? ' ' + r.quality : '');
                var line2 = r.title.length > 55 ? r.title.slice(0, 52) + '...' : r.title;
                return {
                    title: line1 + ' — ' + line2,
                    subtitle: '👤 ' + r.seeds + (r.peers ? '/' + r.peers : '') + '  💾 ' + r.size,
                    r: r
                };
            }),
            onSelect: function (item) {
                var r = item.r;
                if (!tsUrl) {
                    Lampa.Noty.show('Chưa cấu hình TorrServer!');
                    return;
                }
                if (!r.magnet && !r.hash) {
                    Lampa.Noty.show('Không có magnet link');
                    return;
                }
                var magnet = r.magnet || makeMagnet(r.hash, r.title);
                tsAddAndPickFile(magnet, r.hash, r.title, movieTitle, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ════════════════════════════════════════════════════════════
       TORRENTIO / AIO
    ════════════════════════════════════════════════════════════ */
    function buildStreamUrl(type, imdbId, season, episode) {
        var engine = getTorrentEngine();
        var sType  = type === 'series' ? 'series' : 'movie';
        var id     = imdbId;
        if (type === 'series' && season && episode) id = imdbId + ':' + season + ':' + episode;
        
        if (engine === 'aio') {
            var base = getAioUrl();
            return base ? base + '/stream/' + sType + '/' + id + '.json' : null;
        }
        
        // Build Torrentio URL with config
        var cfg = buildTorrentioConfig();
        var base2 = TORRENTIO_BASE + (cfg ? '/' + cfg : '');
        return base2 + '/stream/' + sType + '/' + id + '.json';
    }

    function fetchStreams(url, cb) {
        reguest(url,
            function (data) { cb((data && data.streams) || []); },
            function (e)    { Lampa.Noty.show('Lỗi torrent: ' + e); cb([]); }
        );
    }

    function parseStream(st) {
        var lines = (st.title || '').split('\n');
        var name  = lines[0] || String(st.name || '').split('\n')[0] || '?';
        var info  = lines[1] || '';
        var sizeM = info.match(/💾\s*([\d.,]+\s*[GMKBT]+)/i);
        var seedM = info.match(/👤\s*(\d+)/);
        var srcM  = info.match(/⚙️\s*(\S+)/);
        var sz    = sizeM ? sizeM[1].trim() : '';
        
        // Extract quality
        var qualityM = name.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);
        var quality = qualityM ? qualityM[1] : '';
        var qualityScore = quality === '2160p' || quality === '4K' || quality === 'UHD' ? 4 :
                          quality === '1080p' ? 3 : quality === '720p' ? 2 : quality === '480p' ? 1 : 0;
        
        return {
            title:   name,
            hash:    (st.infoHash || '').toLowerCase(),
            fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0,
            url:     st.url || '',
            size:    sz,
            sizeNum: parseSize(sz),
            seeds:   seedM ? parseInt(seedM[1]) : 0,
            tracker: srcM ? srcM[1] : 'Torrentio',
            magnet:  st.infoHash ? makeMagnet(st.infoHash, name) : '',
            quality: quality,
            qualityScore: qualityScore
        };
    }

    function sortStreams(streams) {
        var sortOption = getTorrentEngine() === 'aio' ? getAioSort() : 'quality';
        
        return streams.sort(function (a, b) {
            switch (sortOption) {
                case 'size_desc':
                    return b.sizeNum - a.sizeNum;
                case 'size_asc':
                    return a.sizeNum - b.sizeNum;
                case 'seeds_desc':
                    return b.seeds - a.seeds;
                case 'seeds_asc':
                    return a.seeds - b.seeds;
                case 'quality':
                default:
                    if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
                    return b.sizeNum - a.sizeNum;
            }
        });
    }

    function showStreamsMenu(streams, movieTitle, card, season, episode) {
        if (!streams || !streams.length) { Lampa.Noty.show('Không tìm thấy torrent'); return; }
        var tsUrl = getTsUrl();
        var label = getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio';
        var parsed = streams.map(parseStream).filter(function (s) { return s.hash; });
        
        // Apply sorting
        parsed = sortStreams(parsed);

        Lampa.Select.show({
            title: '🧲 ' + label + ': ' + movieTitle + ' (' + parsed.length + ')',
            items: parsed.map(function (s) {
                var qualityBadge = s.quality ? '[' + s.quality + '] ' : '';
                return {
                    title:    qualityBadge + '[' + s.tracker + '] ' + s.title,
                    subtitle: (s.seeds ? '👤 ' + s.seeds + '  ' : '') + (s.size ? '💾 ' + s.size : ''),
                    s: s
                };
            }),
            onSelect: function (item) {
                var s = item.s;
                if (tsUrl && s.hash) {
                    var name = encodeURIComponent(movieTitle);
                    tsAdd(s.magnet, movieTitle, function (hash) {
                        var h = hash || s.hash;
                        var url = tsUrl + '/stream/' + name + '?link=' + h + '&index=' + s.fileIdx + '&play';
                        doPlay({ url: url, title: movieTitle, card: card,
                            episode: (season && episode) ? { season: season, episode: episode } : null });
                    }, function () {
                        var url = tsUrl + '/stream/' + name + '?link=' + s.hash + '&index=' + s.fileIdx + '&play';
                        doPlay({ url: url, title: movieTitle, card: card });
                    });
                } else if (s.url) {
                    doPlay({ url: s.url, title: movieTitle, card: card,
                        episode: (season && episode) ? { season: season, episode: episode } : null });
                } else {
                    Lampa.Noty.show(s.hash ? 'Chưa cấu hình TorrServer!' : 'Không có link');
                }
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function searchTorrent(card, season, episode) {
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);

        Lampa.Noty.show('Đang tìm torrent...');

        function run(id) {
            var url = buildStreamUrl(type, id, season, episode);
            if (!url) { Lampa.Noty.show(getTorrentEngine() === 'aio' ? 'Chưa cấu hình AIO!' : 'Lỗi config'); return; }
            fetchStreams(url, function (streams) {
                var epLabel = (season && episode) ? ' S' + padZero(season) + 'E' + padZero(episode) : '';
                showStreamsMenu(streams, title + epLabel, card, season, episode);
            });
        }

        if (imdbId) { run(imdbId); return; }

        reguest(
            'https://api.themoviedb.org/3/' + (type === 'series' ? 'tv' : 'movie') + '/' + card.id +
            '/external_ids?api_key=' + TMDB_API_KEY,
            function (d) {
                var id = d && d.imdb_id;
                if (id) { card.imdb_id = id; run(id); }
                else Lampa.Noty.show('Không tìm thấy IMDB ID');
            },
            function () { Lampa.Noty.show('Lỗi lấy IMDB ID'); }
        );
    }

    function getSeasonEpCount(card, season) {
        if (card.seasons) {
            var s = card.seasons.filter(function (x) { return x.season_number === season; })[0];
            if (s && s.episode_count) return s.episode_count;
        }
        return 50;
    }

    function askTorrentTV(card) {
        var total = card.number_of_seasons || 1;

        function pickEp(s) {
            var totalEps = getSeasonEpCount(card, s);
            var ee = [];
            for (var e = 1; e <= totalEps; e++) ee.push({ title: 'S' + padZero(s) + 'E' + padZero(e), s: s, e: e });
            Lampa.Select.show({
                title: 'Season ' + s + ' — Chọn tập', items: ee,
                onSelect: function (item) { searchTorrent(card, item.s, item.e); },
                onBack: function () { Lampa.Controller.toggle('full'); }
            });
        }

        if (total === 1) { pickEp(1); return; }

        var ss = [];
        for (var s = 1; s <= total; s++) ss.push({ title: 'Season ' + s + ' (' + getSeasonEpCount(card, s) + ' tập)', s: s });
        Lampa.Select.show({
            title: 'Chọn Season', items: ss,
            onSelect: function (item) { pickEp(item.s); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ════════════════════════════════════════════════════════════
       SETTINGS - PROFESSIONAL UI
    ════════════════════════════════════════════════════════════ */
    
    function showMultiSelect(title, options, currentValues, onSave) {
        var items = [];
        var selected = currentValues.slice();
        
        for (var key in options) {
            if (!options.hasOwnProperty(key)) continue;
            var opt = options[key];
            var isSelected = selected.indexOf(key) > -1;
            items.push({
                title: (isSelected ? '✅ ' : '⬜ ') + opt.name,
                subtitle: opt.desc || '',
                key: key,
                selected: isSelected
            });
        }
        
        items.push({ title: '', subtitle: '' });
        items.push({ title: '💾 LƯU CÀI ĐẶT', subtitle: 'Nhấn để lưu', action: 'save' });
        items.push({ title: '🔄 CHỌN TẤT CẢ', subtitle: '', action: 'all' });
        items.push({ title: '❌ BỎ CHỌN TẤT CẢ', subtitle: '', action: 'none' });
        
        Lampa.Select.show({
            title: title,
            items: items,
            onSelect: function (item) {
                if (item.action === 'save') {
                    onSave(selected);
                    Lampa.Noty.show('✅ Đã lưu!');
                    return;
                }
                if (item.action === 'all') {
                    selected = Object.keys(options);
                    showMultiSelect(title, options, selected, onSave);
                    return;
                }
                if (item.action === 'none') {
                    selected = [];
                    showMultiSelect(title, options, selected, onSave);
                    return;
                }
                
                // Toggle selection
                var idx = selected.indexOf(item.key);
                if (idx > -1) selected.splice(idx, 1);
                else selected.push(item.key);
                
                showMultiSelect(title, options, selected, onSave);
            },
            onBack: function () { Lampa.Controller.toggle('settings'); }
        });
    }

    function showSingleSelect(title, options, currentValue, onSave) {
        var items = [];
        
        for (var key in options) {
            if (!options.hasOwnProperty(key)) continue;
            var opt = options[key];
            var isSelected = key === currentValue;
            items.push({
                title: (isSelected ? '🔘 ' : '⚪ ') + opt.name,
                subtitle: opt.desc || '',
                key: key
            });
        }
        
        Lampa.Select.show({
            title: title,
            items: items,
            onSelect: function (item) {
                onSave(item.key);
                Lampa.Noty.show('✅ Đã chọn: ' + options[item.key].name);
            },
            onBack: function () { Lampa.Controller.toggle('settings'); }
        });
    }

    function showTorrentioConfigMenu() {
        Lampa.Select.show({
            title: '⚙️ Cấu hình Torrentio',
            items: [
                { title: '📡 Chọn nguồn (Providers)', subtitle: getSettingArray('tio_providers').length + ' nguồn đã chọn', action: 'providers' },
                { title: '🎬 Lọc chất lượng', subtitle: 'Loại bỏ quality không mong muốn', action: 'quality' },
                { title: '📊 Sắp xếp kết quả', subtitle: TORRENTIO_SORT[getSetting('tio_sort') || 'qualitysize'].name, action: 'sort' },
                { title: '🌍 Ngôn ngữ ưu tiên', subtitle: getSettingArray('tio_languages').length + ' ngôn ngữ', action: 'languages' },
                { title: '', subtitle: '' },
                { title: '📋 Xem config hiện tại', subtitle: 'Copy để dùng ở nơi khác', action: 'view' },
                { title: '🔄 Reset về mặc định', subtitle: '', action: 'reset' }
            ],
            onSelect: function (item) {
                switch (item.action) {
                    case 'providers':
                        showMultiSelect(
                            '📡 Chọn nguồn Torrent',
                            TORRENTIO_PROVIDERS,
                            getSettingArray('tio_providers'),
                            function (selected) { setSettingArray('tio_providers', selected); }
                        );
                        break;
                    case 'quality':
                        showMultiSelect(
                            '🎬 Loại bỏ chất lượng (Quality Filter)',
                            TORRENTIO_QUALITY,
                            getSettingArray('tio_quality_filter'),
                            function (selected) { setSettingArray('tio_quality_filter', selected); }
                        );
                        break;
                    case 'sort':
                        showSingleSelect(
                            '📊 Sắp xếp kết quả',
                            TORRENTIO_SORT,
                            getSetting('tio_sort') || 'qualitysize',
                            function (selected) { setSetting('tio_sort', selected); }
                        );
                        break;
                    case 'languages':
                        showMultiSelect(
                            '🌍 Ngôn ngữ ưu tiên',
                            TORRENTIO_LANGUAGES,
                            getSettingArray('tio_languages'),
                            function (selected) { setSettingArray('tio_languages', selected); }
                        );
                        break;
                    case 'view':
                        var config = buildTorrentioConfig();
                        var fullUrl = TORRENTIO_BASE + (config ? '/' + config : '') + '/manifest.json';
                        Lampa.Select.show({
                            title: '📋 Config hiện tại',
                            items: [
                                { title: 'Config string:', subtitle: config || '(mặc định)' },
                                { title: 'Full URL:', subtitle: fullUrl },
                                { title: '', subtitle: '' },
                                { title: '💡 Copy URL này để dùng trong Stremio', subtitle: '' }
                            ],
                            onSelect: function () {},
                            onBack: function () { showTorrentioConfigMenu(); }
                        });
                        break;
                    case 'reset':
                        setSettingArray('tio_providers', []);
                        setSettingArray('tio_quality_filter', []);
                        setSetting('tio_sort', 'qualitysize');
                        setSettingArray('tio_languages', []);
                        Lampa.Noty.show('✅ Đã reset về mặc định!');
                        break;
                }
            },
            onBack: function () { Lampa.Controller.toggle('settings'); }
        });
    }

    function showAioConfigMenu() {
        Lampa.Select.show({
            title: '⚙️ Cấu hình AIOStreams',
            items: [
                { title: '📊 Sắp xếp kết quả', subtitle: AIO_SORT_OPTIONS[getAioSort()].name, action: 'sort' },
                { title: '', subtitle: '' },
                { title: '💡 Gợi ý:', subtitle: 'Cấu hình chi tiết tại aiostreams.elfhosted.com' }
            ],
            onSelect: function (item) {
                if (item.action === 'sort') {
                    showSingleSelect(
                        '📊 Sắp xếp kết quả AIO',
                        AIO_SORT_OPTIONS,
                        getAioSort(),
                        function (selected) { setSetting('aio_sort', selected); }
                    );
                }
            },
            onBack: function () { Lampa.Controller.toggle('settings'); }
        });
    }

    function initSettings() {
        if (Lampa.SettingsApi && Lampa.SettingsApi.addComponent) {
            Lampa.SettingsApi.addComponent({
                component: 'kkparser',
                name: '🎬 KKPhim Parser',
                icon: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>'
            });

            setTimeout(function () { buildSettings(); }, 100);
        }
    }

    function buildSettings() {
        if (!Lampa.SettingsApi) return;

        // ═══════════════════════════════════════════════════════════
        // TORRSERVER SECTION
        // ═══════════════════════════════════════════════════════════
        
        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'section_ts', type: 'title', default: '' },
            field: { name: '═══ TORRSERVER ═══', description: '' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'torrserver_url', type: 'input', values: '', default: '' },
            field: { name: '📡 Địa chỉ TorrServer', description: 'VD: 192.168.1.100:8090' },
            onChange: function (value) { Lampa.Storage.set(STG_PREFIX + 'torrserver_url', value); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'torrserver_pass', type: 'input', values: '', default: '' },
            field: { name: '🔑 Mật khẩu TorrServer', description: 'Để trống nếu không có' },
            onChange: function (value) { Lampa.Storage.set(STG_PREFIX + 'torrserver_pass', value); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'test_ts', type: 'button', default: '' },
            field: { name: '🔌 Test kết nối', description: 'Kiểm tra TorrServer' },
            onChange: function () {
                var url = getTsUrl();
                if (!url) { Lampa.Noty.show('❌ Chưa nhập địa chỉ!'); return; }
                Lampa.Noty.show('🔄 Đang test...');
                $.ajax({
                    url: url + '/echo', type: 'GET', timeout: 5000,
                    success: function () { Lampa.Noty.show('✅ TorrServer OK!'); },
                    error: function (xhr) { Lampa.Noty.show(xhr.status === 200 ? '✅ OK!' : '❌ Lỗi: ' + (xhr.status || 'timeout')); }
                });
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'test_speed', type: 'button', default: '' },
            field: { name: '⚡ Test tốc độ & thông tin', description: 'Ping, cache, buffer...' },
            onChange: function () { testTorrServerSpeed(); }
        });

        // ═══════════════════════════════════════════════════════════
        // TORRENT ENGINE SECTION
        // ═══════════════════════════════════════════════════════════
        
        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'section_engine', type: 'title', default: '' },
            field: { name: '═══ TORRENT ENGINE ═══', description: '' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: {
                name: STG_PREFIX + 'torrent_engine',
                type: 'select',
                values: { 'torrentio': 'Torrentio', 'aio': 'AIOStreams' },
                default: 'torrentio'
            },
            field: { name: '🔧 Engine', description: 'Chọn nguồn torrent' },
            onChange: function (value) { Lampa.Storage.set(STG_PREFIX + 'torrent_engine', value); }
        });

        // ═══════════════════════════════════════════════════════════
        // TORRENTIO CONFIG
        // ═══════════════════════════════════════════════════════════
        
        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'section_tio', type: 'title', default: '' },
            field: { name: '═══ TORRENTIO ═══', description: '' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'tio_config_menu', type: 'button', default: '' },
            field: { name: '⚙️ Cấu hình Torrentio', description: 'Nguồn, chất lượng, sắp xếp, ngôn ngữ' },
            onChange: function () { showTorrentioConfigMenu(); }
        });

        // ═══════════════════════════════════════════════════════════
        // AIOSTREAMS CONFIG
        // ═══════════════════════════════════════════════════════════
        
        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'section_aio', type: 'title', default: '' },
            field: { name: '═══ AIOSTREAMS ═══', description: '' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'aio_url', type: 'input', values: '', default: '' },
            field: { name: '🔗 AIOStreams URL', description: 'URL manifest từ aiostreams.elfhosted.com' },
            onChange: function (value) { Lampa.Storage.set(STG_PREFIX + 'aio_url', value); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'aio_config_menu', type: 'button', default: '' },
            field: { name: '⚙️ Cấu hình AIOStreams', description: 'Sắp xếp kết quả' },
            onChange: function () { showAioConfigMenu(); }
        });

        // ═══════════════════════════════════════════════════════════
        // JACKETT
        // ═══════════════════════════════════════════════════════════
        
        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'section_jackett', type: 'title', default: '' },
            field: { name: '═══ JACKETT ═══', description: '' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'jackett_url', type: 'input', values: '', default: '' },
            field: { name: '🔍 Jackett Server', description: 'VD: jac.red hoặc IP:port' },
            onChange: function (value) { Lampa.Storage.set(STG_PREFIX + 'jackett_url', value); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'jackett_key', type: 'input', values: '', default: '' },
            field: { name: '🔑 Jackett API Key', description: 'API Key từ tài khoản' },
            onChange: function (value) { Lampa.Storage.set(STG_PREFIX + 'jackett_key', value); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'test_jackett', type: 'button', default: '' },
            field: { name: '🧪 Test Jackett', description: 'Kiểm tra kết nối' },
            onChange: function () {
                var url = getJackettUrl(), key = getJackettKey();
                if (!url) { Lampa.Noty.show('❌ Chưa nhập URL!'); return; }
                if (!key) { Lampa.Noty.show('❌ Chưa nhập Key!'); return; }
                Lampa.Noty.show('🔄 Đang test...');
                reguest(
                    url + '/api/v2.0/indexers/all/results?apikey=' + key + '&Query=test&Category[]=2000',
                    function () { Lampa.Noty.show('✅ Jackett OK!'); },
                    function (e) { Lampa.Noty.show('❌ Lỗi: ' + e); }
                );
            }
        });

        // ═══════════════════════════════════════════════════════════
        // INFO
        // ═══════════════════════════════════════════════════════════
        
        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'section_info', type: 'title', default: '' },
            field: { name: '═══ THÔNG TIN ═══', description: '' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'version', type: 'static', default: '' },
            field: { name: '📦 Version: 2.0.0', description: 'Professional Settings Edition' }
        });
    }

    /* ════════════════════════════════════════════════════════════
       HOOK + MENU + START
    ════════════════════════════════════════════════════════════ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        var card = e.data && e.data.movie ? e.data.movie : (e.object && e.object.card);
        if (!card) return;
        var $ctx = e.object && e.object.activity ? e.object.activity.render()
                 : (e.object && e.object.render ? e.object.render() : $('body'));
        if ($ctx.find('.view--kkphim').length) return;

        var isSeries = getMediaType(card) === 'series';

        function mkBtn(cls, inner, label, fn) {
            var $b = $('<div class="full-start__button selector ' + cls + '">' +
                '<svg viewBox="0 0 24 24" fill="none" width="44" height="44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                inner + '</svg><span>' + label + '</span></div>');
            $b.on('hover:enter', fn);
            return $b;
        }

        var $kk = mkBtn('view--kkphim',
            '<rect x="2" y="2" width="20" height="20" rx="3"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'KKPhim', function () { searchAndPlay('kkphim', card); });

        var $op = mkBtn('view--ophim',
            '<circle cx="12" cy="12" r="10"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'OPhim', function () { searchAndPlay('ophim', card); });

        var engineLabel = getTorrentEngine() === 'aio' ? 'AIO' : 'Torrentio';
        var $tr = mkBtn('view--kkparser-torrent',
            '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>',
            engineLabel,
            function () { if (isSeries) askTorrentTV(card); else searchTorrent(card, null, null); });

        var $jk = mkBtn('view--kkparser-jackett',
            '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
            'Jackett', function () { searchJackett(card); });

        var $anchor = $ctx.find('.view--torrent');
        if ($anchor.length) {
            $anchor.after($jk).after($tr).after($op).after($kk);
        } else {
            $ctx.find('.full-start__buttons').append($kk).append($op).append($tr).append($jk);
        }
    });

    function start() {
        initSettings();
        console.log('[KKPhim Parser] v2.0.0 — Professional Settings ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();