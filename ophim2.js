// ==================== CẤU HÌNH & HÀM CƠ BẢN ====================
var STG_PREFIX = 'kkparser_';
var TMDB_API_KEY = '6979c8ec101ed849f44d197c86582644';
var TORRENTIO_BASE = 'https://torrentio.strem.fun';

function getTsUrl() { return Lampa.Storage.get(STG_PREFIX + 'torrserver_url', ''); }
function getTsPass() { return Lampa.Storage.get(STG_PREFIX + 'torrserver_pass', ''); }
function getTorrentEngine() { return Lampa.Storage.get(STG_PREFIX + 'torrent_engine', 'torrentio'); }
function getTioConfig() { return Lampa.Storage.get(STG_PREFIX + 'torrentio_config', ''); }
function getAioUrl() { return Lampa.Storage.get(STG_PREFIX + 'aio_url', ''); }
function getJackettUrl() { return Lampa.Storage.get(STG_PREFIX + 'jackett_url', ''); }
function getJackettKey() { return Lampa.Storage.get(STG_PREFIX + 'jackett_key', ''); }
function getJacredUrl() { return Lampa.Storage.get(STG_PREFIX + 'jacred_url', 'https://jac.red/api/v1.0/torrents'); }

function parseSize(str) {
    if (!str) return 0;
    var m = String(str).match(/([\d,\.]+)\s*(TB|GB|MB|KB|B)/i);
    if (!m) return 0;
    var n = parseFloat(m[1].replace(',', ''));
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
    if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
    if (b >= 1e6) return (b / 1e6).toFixed(0) + ' MB';
    if (b >= 1e3) return (b / 1e3).toFixed(0) + ' KB';
    return b + ' B';
}

function getQuality(title) {
    var m = (title || '').match(/\b(2160p|4K|UHD|1080p|1080i|720p|480p|BluRay|BDRip|BRRip|WEB-?DL|WEBrip|HDRip|REMUX|HDTV|DVDRip)\b/i);
    return m ? m[1].toUpperCase() : '';
}

function getMediaType(card) {
    if (card.number_of_seasons || card.first_air_date || card.type === 'tv' || card.type === 'series') return 'series';
    return 'movie';
}

function getImdbId(card) {
    var id = card.imdb_id || (card.ids && card.ids.imdb) || (card.external_ids && card.external_ids.imdb_id) || '';
    if (id && !/tt/i.test(String(id))) id = 'tt' + id;
    return id || null;
}

function request(url, onOk, onFail) {
    var net = new Lampa.Request();
    net.timeout(20000);
    net.silent(url, function (data) { onOk(data); }, function (a, b) {
        var code = (a && a.status) ? a.status : 0;
        (onFail || function () {})(code ? 'HTTP ' + code : (b || 'Error'));
    });
}

function normResult(obj) {
    var hash = (obj.hash || '').toLowerCase().replace(/^urn:btih:/i, '').replace(/[^a-f0-9]/g, '');
    if (hash.length !== 40 && hash.length !== 32) return null;
    if (!obj.title || !String(obj.title).trim()) return null;
    var sizeNum = parseInt(obj.sizeNum) || parseSize(obj.size || '');
    return {
        title: String(obj.title).trim(),
        seeds: parseInt(obj.seeds) || 0,
        peers: parseInt(obj.peers) || 0,
        size: obj.size || (sizeNum ? fmtBytes(sizeNum) : ''),
        sizeNum: sizeNum,
        tracker: obj.tracker || '?',
        quality: getQuality(obj.title),
        hash: hash,
        magnet: obj.magnet || ('magnet:?xt=urn:btih:' + hash + '&dn=' + encodeURIComponent(obj.title))
    };
}

function makeMagnet(hash, name) {
    return 'magnet:?xt=urn:btih:' + hash + '&dn=' + encodeURIComponent(name || 'file');
}

function doPlay(params) {
    var card = params.card || {};
    var url = params.url || '';
    var title = params.title || card.title || card.name || '';
    var episode = params.episode || null;
    if (!url) { Lampa.Noty.show('Không có link phát'); return; }
    var obj = { title: title, url: url, poster: card.poster || card.img || '', movie: card };
    if (episode) { obj.season = episode.season; obj.episode = episode.episode; }
    Lampa.Player.play(obj);
    try { if (Lampa.Timeline && Lampa.Timeline.update) Lampa.Timeline.update(card, { percent: 0 }); } catch(e) {}
}

// ==================== TORRSERVER ====================
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
        success: function (data) { onDone((data && data.hash) || ''); },
        error: function () { onFail && onFail(); }
    });
}

function tsGetFiles(hash, onDone) {
    var tsUrl = getTsUrl();
    $.ajax({
        url: tsUrl + '/torrents', type: 'POST', headers: tsHeaders(),
        data: JSON.stringify({ action: 'get', hash: hash }),
        dataType: 'json', timeout: 15000,
        success: function (data) {
            var files = ((data && data.file_stats) || [])
                .filter(function (f) { return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/); })
                .sort(function (a, b) { return (a.path || '').localeCompare(b.path || '', undefined, { numeric: true }); });
            onDone(files, data);
        },
        error: function () { onDone([], null); }
    });
}

function tsPlayFile(hash, fileId, title, card) {
    var tsUrl = getTsUrl();
    var name = encodeURIComponent(title || 'video');
    var url = tsUrl + '/stream/' + name + '?link=' + hash + '&index=' + fileId + '&play';
    doPlay({ url: url, title: title, card: card });
}

function tsAddAndPickFile(magnet, hash, torrentTitle, playTitle, card) {
    var tsUrl = getTsUrl();
    if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
    Lampa.Noty.show('Đang thêm vào TorrServer...');
    tsAdd(magnet, torrentTitle, function (returnedHash) {
        var h = returnedHash || hash;
        if (!h) { Lampa.Noty.show('Không lấy được hash từ TorrServer'); return; }
        Lampa.Noty.show('Đang tải danh sách file...');
        var tries = 0;
        function tryGetFiles() {
            tries++;
            tsGetFiles(h, function (files) {
                if (!files.length && tries < 5) { setTimeout(tryGetFiles, 2000); return; }
                if (!files.length) { tsPlayFile(h, 0, playTitle, card); return; }
                if (files.length == 1) { tsPlayFile(h, files[0].id || 0, playTitle, card); }
                else { showFileList(files, h, playTitle, card); }
            });
        }
        tryGetFiles();
    }, function () {
        Lampa.Noty.show('TorrServer lỗi, thử phát trực tiếp...');
        if (hash) tsPlayFile(hash, 0, playTitle, card);
    });
}

function showFileList(files, hash, playTitle, card) {
    Lampa.Select.show({
        title: 'Chọn file - ' + playTitle,
        items: files.map(function (f) {
            var parts = (f.path || '').split('/');
            var filename = parts[parts.length - 1] || f.path || 'File';
            var size = f.length ? ' - ' + fmtBytes(f.length) : '';
            var epMatch = filename.match(/[Ee](\d+)/);
            var epLabel = epMatch ? ' [Ep ' + epMatch[1] + ']' : '';
            return { title: filename + epLabel, subtitle: size.trim(), file: f };
        }),
        onSelect: function (item) {
            var f = item.file;
            tsPlayFile(hash, f.id || 0, playTitle + ' - ' + (f.path || '').split('/').pop(), card);
        },
        onBack: function () { Lampa.Controller.toggle('full'); }
    });
}

// ==================== KKPHIM / OPHIM (giữ nguyên) ====================
function extractSeasonNumber(name, slug) {
    var text = (name || '') + ' ' + (slug || '');
    var patterns = [/[Ss]eason[\s\._]*(\d+)/, /[Pp]h[aâ]n[\s\._]*(\d+)/i, /[Mm]ùa[\s\._]*(\d+)/i, /\bS(\d+)\b/];
    for (var i = 0; i < patterns.length; i++) {
        var m = text.match(patterns[i]);
        if (m) return parseInt(m[1]);
    }
    return 1;
}

function getBaseSlug(slug) {
    if (!slug) return '';
    return slug.replace(/-?season-?\d+/gi, '').replace(/-?phan-?\d+/gi, '').replace(/-?mua-?\d+/gi, '').replace(/-?s\d+$/gi, '').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function getBaseName(name) {
    if (!name) return '';
    return name.replace(/[\s-]*[\(\{\}\)]?\s*[Ss]eason\s*\d+[\s\)\]\}]*/gi, '')
               .replace(/[\s-]*[\(\{\}\)]?\s*[Pp]h[aâ]n\s*\d+[\s\)\]\}]*/gi, '')
               .replace(/[\s-]*[\(\{\}\)]?\s*[Mm]ùa\s*\d+[\s\)\]\}]*/gi, '')
               .trim();
}

var SOURCES = {
    kkphim: { name: 'KKPhim', api: 'https://kkphim.com/' },
    ophim:  { name: 'OPhim',  api: 'https://ophim1.com/' }
};

function searchSource(source, keyword, cb) {
    request(source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&limit=30', function (data) {
        var items = [];
        if (data && data.status == 'success' && data.data && data.data.items) items = data.data.items;
        else if (data && data.data && data.data.items) items = data.data.items;
        cb(items);
    }, function () { cb([]); });
}

function fetchDetail(source, slug, cb) {
    request(source.api + 'v1/api/phim/' + slug, function (data) {
        if (data && data.status == 'success' && data.data) {
            var item = data.data.item || data.data;
            cb({ movie: item, episodes: data.data.episodes || item.episodes || [] });
        } else {
            request(source.api + 'phim/' + slug, function (d2) {
                cb({ movie: d2.movie || d2.item || d2 || {}, episodes: d2.episodes || [] });
            }, function () { cb({ movie: {}, episodes: [] }); });
        }
    }, function () { cb({ movie: {}, episodes: [] }); });
}

function findAllSeasons(source, keyword, title, orig, year, cb) {
    // Simplified: chỉ lấy kết quả đầu tiên
    searchSource(source, keyword, function (items) {
        if (!items.length) { cb(null); return; }
        var first = items[0];
        cb({ movie_name: getBaseName(first.origin_name || first.name || ''), seasons: [{ season_num: 1, slug: first.slug, name: first.name, origin_name: first.origin_name, year: first.year, type: first.type }] });
    });
}

function searchAndPlay(sourceKey, card) {
    var source = SOURCES[sourceKey];
    if (!source) return;
    var title = card.title || card.name || '';
    var orig = card.original_title || card.original_name || '';
    var year = (card.release_date || card.first_air_date || '').slice(0, 4);
    Lampa.Noty.show(source.name + ': đang tìm...');
    findAllSeasons(source, title, title, orig, year, function (result) {
        if (!result || !result.seasons || !result.seasons.length) {
            searchSource(source, orig || title, function (items) {
                showManualSelect(source, items, card);
            });
            return;
        }
        showSeasonMenu(source, result, card);
    });
}

function showSeasonMenu(source, result, card) {
    var seasons = result.seasons, movieName = result.movie_name;
    if (seasons.length === 1) {
        loadSeasonEpisodes(source, seasons[0], card, movieName);
        return;
    }
    Lampa.Select.show({
        title: '📺 ' + movieName,
        items: seasons.map(function (s, idx) {
            return { title: 'Season ' + s.season_num + ': ' + s.name, subtitle: s.year ? 'Năm: ' + s.year : '', season: s, index: idx };
        }),
        onSelect: function (item) { loadSeasonEpisodes(source, item.season, card, movieName); },
        onBack: function () { Lampa.Controller.toggle('full'); }
    });
}

function loadSeasonEpisodes(source, season, card, movieTitle) {
    fetchDetail(source, season.slug, function (data) {
        var eps = data.episodes || [];
        if (!eps.length) { Lampa.Noty.show('Không có tập phim'); return; }
        playEpisode(card, eps, season.season_num, movieTitle, season.name);
    });
}

function playEpisode(card, episodes, seasonNum, movieTitle, seasonName) {
    var displayTitle = seasonName || movieTitle || card.title || card.name || '';
    var servers = (episodes || []).filter(function (srv) { return srv.server_data && srv.server_data.length > 0; });
    if (!servers.length) { Lampa.Noty.show('Không có tập phim'); return; }
    if (servers.length === 1) { showEpisodeMenu(displayTitle, servers[0], card, seasonNum); return; }
    Lampa.Select.show({
        title: displayTitle + ' - Chọn phiên bản',
        items: servers.map(function (srv, idx) {
            var name = (srv.server_name || ('Phiên bản ' + (idx+1))).trim();
            return { title: name, subtitle: (srv.server_data || []).length + ' tập', srv: srv };
        }),
        onSelect: function (item) { showEpisodeMenu(displayTitle, item.srv, card, seasonNum); },
        onBack: function () { Lampa.Controller.toggle('full'); }
    });
}

function showEpisodeMenu(title, serverData, card, seasonNum) {
    var eps = serverData.server_data || [], sNum = seasonNum || 1;
    var srvName = (serverData.server_name || '').trim();
    var menuTitle = title + (srvName ? ' ' + srvName : '');
    if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }
    var playlist = eps.map(function (ep, idx) {
        return { title: menuTitle + ' - ' + (ep.name || ('Tập ' + (idx+1))), url: ep.link_m3u8 || ep.link_embed || '', movie: card, season: sNum, episode: idx+1 };
    });
    Lampa.Select.show({
        title: '📺 ' + menuTitle + ' (' + eps.length + ' tập)',
        items: eps.map(function (ep, idx) {
            var link = ep.link_m3u8 || ep.link_embed || '';
            return { title: ep.name || ('Tập ' + (idx+1)), subtitle: !link ? '❌ Không có link' : (link.indexOf('m3u8') > -1 ? '📺 M3U8' : '🔗 Embed'), ep: ep, idx: idx };
        }),
        onSelect: function (item) {
            var link = item.ep.link_m3u8 || item.ep.link_embed || '';
            if (!link) { Lampa.Noty.show('Không có link phát'); return; }
            doPlay({ url: link, title: menuTitle + ' - ' + (item.ep.name || ('Tập ' + (item.idx+1))), card: card, episode: { season: sNum, episode: item.idx+1 } });
            try { Lampa.Player.playlist(playlist, item.idx); } catch(e) {}
        },
        onBack: function () { Lampa.Controller.toggle('full'); }
    });
}

function showManualSelect(source, items, card) {
    if (!items || !items.length) { Lampa.Noty.show('Không tìm thấy trên ' + source.name); return; }
    Lampa.Select.show({
        title: source.name + ' - Kết quả',
        items: items.map(function (it) {
            var sn = extractSeasonNumber(it.name, it.slug);
            return { title: (it.name || '') + (it.origin_name ? ' (' + it.origin_name + ')' : '') + (sn > 1 ? ' [S' + sn + ']' : '') + (it.year ? ' [' + it.year + ']' : ''), subtitle: 'Slug: ' + it.slug, slug: it.slug, item: it };
        }),
        onSelect: function (sel) {
            if (!sel.slug) return;
            var sNum = extractSeasonNumber(sel.item.name, sel.item.slug);
            fetchDetail(source, sel.slug, function (data) {
                var eps = data.episodes || [];
                if (!eps.length) { Lampa.Noty.show('Không có tập phim'); return; }
                playEpisode(card, eps, sNum, card.title || card.name, sel.item.name);
            });
        },
        onBack: function () { Lampa.Controller.toggle('full'); }
    });
}

// ==================== JACKETT (giữ nguyên) ====================
function fetchJackett(query, cb) {
    var url = getJackettUrl(), key = getJackettKey();
    if (!url || !key) { cb([]); return; }
    request(url + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(key) + '&Query=' + encodeURIComponent(query) + '&Category[]=2000&Category[]=5000', function (data) {
        var d = typeof data === 'string' ? JSON.parse(data) : data;
        var results = ((d && d.Results) || []).map(function (r) {
            if (!r.Title || !String(r.Title).trim()) return null;
            var magnetUri = r.MagnetUri || '';
            var torrentUrl = r.Link || '';
            var link = magnetUri || torrentUrl;
            if (!link) return null;
            var hash = '', hm = link.match(/btih:([a-f0-9]{32,40})/i);
            if (hm) hash = hm[1].toLowerCase();
            var sb = parseInt(r.Size || 0);
            return normResult({ title: String(r.Title).trim(), hash: hash, seeds: parseInt(r.Seeders || 0), peers: parseInt(r.Leechers || 0), size: sb ? fmtBytes(sb) : '', sizeNum: sb, tracker: r.Tracker || 'Jackett', magnet: magnetUri || (hash ? makeMagnet(hash, r.Title) : '') });
        }).filter(Boolean).sort(function (a, b) { return b.sizeNum - a.sizeNum; });
        cb(results);
    }, function (e) { Lampa.Noty.show('Jackett lỗi: ' + e); cb([]); });
}

function searchJackett(card) {
    var title = card.title || card.name || '';
    var orig = card.original_title || card.original_name || '';
    var year = (card.release_date || card.first_air_date || '').slice(0, 4);
    var q = (orig || title) + (year ? ' ' + year : '');
    Lampa.Noty.show('Jackett: đang tìm...');
    fetchJackett(q, function (r) { showPackMenu(r, title, 'Jackett', card); });
}

// ==================== MAGNETZ (mới) ====================
function fetchMagnetz(query, maxResults, cb) {
    var url = 'https://magnetz.eu/search?query=' + encodeURIComponent(query) + '&sort=size';
    var allResults = [];
    var page = 1;
    function fetchPage() {
        request(url + '&page=' + page, function (html) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var articles = doc.querySelectorAll('article.result-card');
            if (!articles.length) { cb(allResults.slice(0, maxResults)); return; }
            for (var i = 0; i < articles.length; i++) {
                var a = articles[i];
                var title = a.querySelector('.result-card__name a')?.innerText.trim() || '';
                var magnet = a.querySelector('button[data-magnet]')?.getAttribute('data-magnet') || '';
                if (!title || !magnet) continue;
                var text = a.innerText;
                var sizeMatch = text.match(/([\d\.]+)\s*(GB|MB|TB)/i);
                var sizeGB = sizeMatch ? parseFloat(sizeMatch[1]) : 0;
                var seeds = parseInt(text.match(/(\d+)\s*seed/i)?.[1]) || 0;
                var hashMatch = magnet.match(/btih:([a-f0-9]{40})/i);
                var hash = hashMatch ? hashMatch[1].toLowerCase() : '';
                allResults.push(normResult({ title: title, hash: hash, seeds: seeds, peers: 0, size: sizeGB ? fmtBytes(sizeGB*1e9) : '', sizeNum: sizeGB*1e9, tracker: 'Magnetz', magnet: magnet }));
            }
            if (articles.length === 25 && allResults.length < maxResults) {
                page++;
                fetchPage();
            } else {
                cb(allResults.slice(0, maxResults));
            }
        }, function () { cb(allResults.slice(0, maxResults)); });
    }
    fetchPage();
}

function searchMagnetz(card) {
    var title = card.title || card.name || '';
    var orig = card.original_title || card.original_name || '';
    var year = (card.release_date || card.first_air_date || '').slice(0, 4);
    var q = (orig || title) + (year ? ' ' + year : '');
    Lampa.Noty.show('Magnetz: đang tìm...');
    fetchMagnetz(q, 30, function (r) {
        if (!r.length) Lampa.Noty.show('Magnetz: không tìm thấy');
        else showPackMenu(r, title, 'Magnetz', card);
    });
}

// ==================== JACRED (mới) ====================
function fetchJacred(imdbId, type, maxResults, cb) {
    var apiUrl = getJacredUrl();
    if (!apiUrl) { Lampa.Noty.show('Chưa cấu hình Jacred URL!'); cb([]); return; }
    var promises = [];
    var resultsMap = {};
    function addResults(arr, sourceName) {
        if (!arr || !arr.length) return;
        for (var i = 0; i < arr.length; i++) {
            var t = arr[i];
            if (!t.magnet) continue;
            var hashMatch = t.magnet.match(/btih:([a-f0-9]{40})/i);
            var key = hashMatch ? hashMatch[1].toLowerCase() : t.magnet;
            if (resultsMap[key]) continue;
            var quality = '';
            if (t.quality === 2160) quality = '4K';
            else if (t.quality === 1080) quality = '1080p';
            else if (t.quality === 720) quality = '720p';
            else if (t.quality === 480) quality = '480p';
            resultsMap[key] = normResult({
                title: decodeURIComponent(t.title || ''),
                hash: key,
                seeds: t.sid || t.seeds || 0,
                peers: 0,
                size: t.sizeName ? parseSize(t.sizeName) : 0,
                sizeNum: parseSize(t.sizeName),
                tracker: t.tracker || 'Jacred',
                magnet: t.magnet,
                quality: quality
            });
        }
    }
    // Tìm theo IMDb
    promises.push(new Promise(function(resolve) {
        request(apiUrl + '?search=' + encodeURIComponent(imdbId), function(data) {
            var d = typeof data === 'string' ? JSON.parse(data) : data;
            addResults(d, 'IMDb');
            resolve();
        }, function() { resolve(); });
    }));
    // Tìm theo tên tiếng Nga (nếu có) – tạm thời bỏ qua vì cần TMDb, có thể thêm sau
    Promise.all(promises).then(function() {
        var results = Object.values(resultsMap);
        results.sort(function(a,b) { return b.seeds - a.seeds; });
        cb(results.slice(0, maxResults));
    });
}

function searchJacred(card) {
    var imdb = getImdbId(card);
    if (!imdb) { Lampa.Noty.show('Jacred: không có IMDb ID'); return; }
    var title = card.title || card.name || '';
    Lampa.Noty.show('Jacred: đang tìm...');
    fetchJacred(imdb, getMediaType(card), 30, function(r) {
        if (!r.length) Lampa.Noty.show('Jacred: không tìm thấy');
        else showPackMenu(r, title, 'Jacred', card);
    });
}

// ==================== PACK MENU (chung) ====================
var QUALITY_ORDER = ['2160P','4K','UHD','REMUX','1080P','1080I','720P','480P'];
function showPackMenu(results, movieTitle, label, card) {
    if (!results || !results.length) { Lampa.Noty.show(label + ': Không tìm thấy'); return; }
    var tsUrl = getTsUrl();
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
        items.push({ title: '— ' + q + ' (' + group.length + ') —', separator: true });
        group.slice(0, 20).forEach(function (r) {
            var name = r.title.length > 60 ? r.title.slice(0,57)+'..' : r.title;
            var seedTxt = r.seeds > 0 ? '🌱 ' + r.seeds : '△ 0 seed';
            var sizeTxt = r.size ? '💾 ' + r.size : '';
            items.push({ title: '[' + r.tracker + '] ' + name, subtitle: seedTxt + '  ' + sizeTxt, r: r });
        });
    });
    Lampa.Select.show({
        title: '📦 ' + label + ' · ' + movieTitle + ' (' + results.length + ')',
        items: items,
        onSelect: function (item) {
            if (item.separator) return;
            var r = item.r;
            if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }
            if (!r.magnet && !r.hash) { Lampa.Noty.show('Không có magnet link'); return; }
            var magnet = r.magnet || makeMagnet(r.hash, r.title);
            tsAddAndPickFile(magnet, r.hash, r.title, movieTitle, card);
        },
        onBack: function () { Lampa.Controller.toggle('full'); }
    });
}

// ==================== TORRENTIO (giữ nguyên) ====================
function buildStreamUrl(type, imdbId, season, episode) {
    var engine = getTorrentEngine();
    var sType = type === 'series' ? 'series' : 'movie';
    var id = imdbId;
    if (type === 'series' && season && episode) id = imdbId + ':' + season + ':' + episode;
    if (engine === 'aio') {
        var base = getAioUrl();
        return base ? base + '/stream/' + sType + '/' + id + '.json' : null;
    }
    var cfg = getTioConfig();
    return TORRENTIO_BASE + (cfg ? '/' + cfg : '') + '/stream/' + sType + '/' + id + '.json';
}

function fetchStreams(url, cb) {
    request(url, function (data) { cb((data && data.streams) || []); }, function (e) { Lampa.Noty.show('Lỗi torrent: ' + e); cb([]); });
}

function parseStream(st) {
    var lines = (st.title || '').split('\n');
    var name = lines[0] || String(st.name || '').split('\n')[0] || '?';
    var info = lines[1] || '';
    var sizeM = info.match(/([\d\.]+)\s*(GB|MB)/i);
    var seedM = info.match(/🌱\s*(\d+)/);
    var sz = sizeM ? sizeM[1] + ' ' + sizeM[2] : '';
    return { title: name, hash: (st.infoHash || '').toLowerCase(), fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0, url: st.url || '', size: sz, sizeNum: parseSize(sz), seeds: seedM ? parseInt(seedM[1]) : 0, tracker: 'Torrentio', magnet: st.infoHash ? makeMagnet(st.infoHash, name) : '' };
}

function showStreamsMenu(streams, movieTitle, card, season, episode) {
    if (!streams || !streams.length) { Lampa.Noty.show('Không tìm thấy torrent'); return; }
    var tsUrl = getTsUrl();
    var label = getTorrentEngine() === 'aio' ? 'AIOSreams' : 'Torrentio';
    var parsed = streams.map(parseStream).filter(function(s) { return s.hash; }).sort(function(a,b) { return b.sizeNum - a.sizeNum; });
    Lampa.Select.show({
        title: '🌀 ' + label + ' · ' + movieTitle + ' (' + parsed.length + ')',
        items: parsed.map(function(s) {
            return { title: '[' + s.tracker + '] ' + s.title, subtitle: (s.seeds ? '🌱 ' + s.seeds : '') + '  ' + s.size, s: s };
        }),
        onSelect: function(item) {
            var s = item.s;
            if (tsUrl && s.hash) {
                var name = encodeURIComponent(movieTitle);
                tsAdd(s.magnet, movieTitle, function(hash) {
                    var h = hash || s.hash;
                    var url = tsUrl + '/stream/' + name + '?link=' + h + '&index=' + s.fileIdx + '&play';
                    doPlay({ url: url, title: movieTitle, card: card, episode: (season && episode) ? { season: season, episode: episode } : null });
                }, function() {
                    var url = tsUrl + '/stream/' + name + '?link=' + s.hash + '&index=' + s.fileIdx + '&play';
                    doPlay({ url: url, title: movieTitle, card: card });
                });
            } else if (s.url) {
                doPlay({ url: s.url, title: movieTitle, card: card, episode: (season && episode) ? { season: season, episode: episode } : null });
            } else {
                Lampa.Noty.show(s.hash ? 'Chưa cấu hình TorrServer!' : 'Không có link');
            }
        },
        onBack: function () { Lampa.Controller.toggle('full'); }
    });
}

function searchTorrent(card, season, episode) {
    var title = card.title || card.name || '';
    var type = getMediaType(card);
    var imdbId = getImdbId(card);
    Lampa.Noty.show('Đang tìm torrent...');
    function run(id) {
        var url = buildStreamUrl(type, id, season, episode);
        if (!url) { Lampa.Noty.show(getTorrentEngine() === 'aio' ? 'Chưa cấu hình AIO!' : 'Lỗi config'); return; }
        fetchStreams(url, function(streams) {
            var eLabel = (season && episode) ? ' S' + season.toString().padStart(2,'0') + 'E' + episode.toString().padStart(2,'0') : '';
            showStreamsMenu(streams, title + eLabel, card, season, episode);
        });
    }
    if (imdbId) { run(imdbId); return; }
    request('https://api.themoviedb.org/3/' + (type === 'series' ? 'tv' : 'movie') + '/' + card.id + '/external_ids?api_key=' + TMDB_API_KEY, function(d) {
        var id = d && d.imdb_id;
        if (id) { card.imdb_id = id; run(id); }
        else Lampa.Noty.show('Không tìm thấy IMDb ID');
    }, function() { Lampa.Noty.show('Lỗi lấy IMDb ID'); });
}

function getSeasonEpCount(card, season) {
    if (card.seasons) {
        var s = card.seasons.filter(function(x) { return x.season_number === season; })[0];
        if (s && s.episode_count) return s.episode_count;
    }
    return 50;
}

function askTorrentTV(card) {
    var total = card.number_of_seasons || 1;
    function pickEp(s) {
        var totalEps = getSeasonEpCount(card, s);
        var ee = [];
        for (var e=1; e<=totalEps; e++) ee.push({ title: 'S' + s.toString().padStart(2,'0') + 'E' + e.toString().padStart(2,'0'), s: s, e: e });
        Lampa.Select.show({ title: 'Season ' + s + ' - Chọn tập', items: ee, onSelect: function(item) { searchTorrent(card, item.s, item.e); }, onBack: function() { Lampa.Controller.toggle('full'); } });
    }
    if (total == 1) { pickEp(1); return; }
    var ss = [];
    for (var s=1; s<=total; s++) ss.push({ title: 'Season ' + s + ' (' + getSeasonEpCount(card,s) + ' tập)', s: s });
    Lampa.Select.show({ title: 'Chọn Season', items: ss, onSelect: function(item) { pickEp(item.s); }, onBack: function() { Lampa.Controller.toggle('full'); } });
}

// ==================== CÀI ĐẶT ====================
function initSettings() {
    if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;
    Lampa.SettingsApi.addComponent({
        component: 'kkparser',
        name: 'KKPhim Parser',
        icon: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>'
    });
    setTimeout(buildSettings, 100);
}

function addParam(cfg) {
    Lampa.SettingsApi.addParam({
        component: 'kkparser',
        param: { name: STG_PREFIX + cfg.key, type: cfg.type, values: cfg.values || '', default: cfg.def || '' },
        field: { name: cfg.name, description: cfg.desc || '' },
        onChange: cfg.onChange || function(v) { Lampa.Storage.set(STG_PREFIX + cfg.key, v); }
    });
}

function buildSettings() {
    if (!Lampa.SettingsApi) return;
    addParam({ key: 'torrserver_url', type: 'input', name: 'Địa chỉ TorrServer', desc: 'VD: http://192.168.1.100:8090' });
    addParam({ key: 'torrserver_pass', type: 'input', name: 'Mật khẩu TorrServer', desc: 'Để trống nếu không có' });
    addParam({ key: 'jacred_url', type: 'input', name: 'Jacred Server URL', desc: 'VD: https://jac.red/api/v1.0/torrents' });
    addParam({ key: 'torrent_engine', type: 'select', name: 'Engine Torrent', desc: 'Chọn nguồn torrent', values: { 'torrentio': 'Torrentio', 'aio': 'AI0Streams' }, def: 'torrentio' });
    addParam({ key: 'torrentio_config', type: 'input', name: 'Torrentio Config', desc: 'Link manifest hoặc để trống' });
    addParam({ key: 'aio_url', type: 'input', name: 'AI0Streams URL', desc: 'URL manifest AIO' });
    addParam({ key: 'jackett_url', type: 'input', name: 'Jackett Server', desc: 'VD: http://jac.red:9117' });
    addParam({ key: 'jackett_key', type: 'input', name: 'Jackett API Key', desc: 'API Key từ tài khoản' });
    addParam({ key: 'test_torrserver', type: 'button', name: 'Test TorrServer', desc: 'Kiểm tra kết nối', onChange: function() {
        var url = getTsUrl();
        if (!url) { Lampa.Noty.show('Chưa nhập địa chỉ!'); return; }
        Lampa.Noty.show('Đang test...');
        $.ajax({ url: url + '/echo', type: 'GET', timeout: 5000, success: function() { Lampa.Noty.show('TorrServer OK!'); }, error: function(xhr) { Lampa.Noty.show(xhr.status === 200 ? 'OK!' : 'Lỗi HTTP ' + (xhr.status || 'timeout')); } });
    }});
}

// ==================== UI BUTTONS ====================
Lampa.Listener.follow('full', function (e) {
    if (e.type !== 'complete') return;
    var card = (e.data && e.data.movie) ? e.data.movie : (e.object && e.object.card);
    if (!card) return;
    var $ctx;
    if (e.object && e.object.activity) $ctx = e.object.activity.render();
    else if (e.object && e.object.render) $ctx = e.object.render();
    else $ctx = $('body');
    if ($ctx.find('.view-kkphim').length) return;
    var isSeries = getMediaType(card) === 'series';

    function mkBtn(cls, inner, label, fn) {
        var $b = $('<div class="full-start button selector ' + cls + '">' +
            '<svg viewBox="0 0 24 24" fill="none" width="44" height="44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            inner + '</svg><span>' + label + '</span></div>');
        $b.on('hover:enter', fn);
        return $b;
    }

    var $kk = mkBtn('view-kkphim',
        '<rect x="2" y="2" width="20" height="20" rx="3"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
        'KKPhim', function() { searchAndPlay('kkphim', card); });

    var $op = mkBtn('view-ophim',
        '<circle cx="12" cy="12" r="10"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
        'OPhim', function() { searchAndPlay('ophim', card); });

    var $tr = mkBtn('view-kkparser-torrent',
        '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>',
        getTorrentEngine() === 'aio' ? 'AI0Streams' : 'Torrentio',
        function() { if (isSeries) askTorrentTV(card); else searchTorrent(card, null, null); });

    var $jk = mkBtn('view-kkparser-jackett',
        '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        'Jackett', function() { searchJackett(card); });

    var $mg = mkBtn('view-kkparser-magnetz',
        '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
        'Magnetz', function() { searchMagnetz(card); });

    var $jc = mkBtn('view-kkparser-jacred',
        '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>',
        'Jacred', function() { searchJacred(card); });

    var $panel = $('<div class="full-panel"></div>');
    $panel.append($kk, $op, $tr, $jk, $mg, $jc);
    $ctx.find('.full-panel').remove();
    $ctx.find('.full-start').after($panel);
});

// Khởi tạo cài đặt
initSettings();