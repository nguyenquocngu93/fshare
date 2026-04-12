(function () {
    'use strict';

    if (window.plugin_kkphim_ready) return;
    window.plugin_kkphim_ready = true;

    var SOURCES = {
        kkphim: { name: 'KKPhim', api: 'https://phimapi.com/' },
        ophim:  { name: 'OPhim',  api: 'https://ophim1.com/' }
    };

    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var TMDB_API_KEY   = '4ef0d7355d9ffb5151e987764708ce96';
    var STG_PREFIX     = 'kkphim_';

    /* ============================================================
       STORAGE
    ============================================================ */
    function getSetting(key) { return Lampa.Storage.get(STG_PREFIX + key, ''); }

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

    function getImdbId(card) {
        var id = card.imdb_id
            || (card.ids && card.ids.imdb)
            || (card.external_ids && card.external_ids.imdb_id) || '';
        if (id && !/^tt/i.test(String(id))) id = 'tt' + id;
        return id || null;
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
       TIMECODE / HISTORY
    ============================================================ */
    function buildTcKey(card, season, episode) {
        var base = 'kkphim_tc_' + (card.id || card.imdb_id || '');
        if (season && episode) base += '_s' + padZero(season) + 'e' + padZero(episode);
        return base;
    }

    function saveTimecode(card, season, episode, percent, time) {
        try {
            Lampa.Storage.set(buildTcKey(card, season, episode), {
                percent: Math.round(percent || 0),
                time:    Math.round(time    || 0),
                updated: Date.now()
            });
        } catch(e) {}
    }

    function loadTimecode(card, season, episode) {
        try {
            return Lampa.Storage.get(buildTcKey(card, season, episode), null)
                || { percent: 0, time: 0 };
        } catch(e) { return { percent: 0, time: 0 }; }
    }

    function addToHistory(card, season, episode, title) {
        try {
            var h = Object.assign({}, card);
            if (season)  h.season  = season;
            if (episode) h.episode = episode;
            if (title)   h.title   = title;
            if (Lampa.Favorite && Lampa.Favorite.add) Lampa.Favorite.add('history', h);
        } catch(e) {}
    }

    function updateTimeline(card, season, episode, percent) {
        try {
            if (Lampa.Timeline && Lampa.Timeline.update) {
                var t = Object.assign({}, card);
                if (season)  t.season  = season;
                if (episode) t.episode = episode;
                Lampa.Timeline.update(t, { percent: percent || 0 });
            }
        } catch(e) {}
    }

    function hookPlayer(card, season, episode) {
        try {
            var lastPct      = -1;
            var saveInterval = null;

            function getVideo() {
                try {
                    if (typeof Lampa.Player.video === 'function') return Lampa.Player.video();
                    if (Lampa.Player.video && Lampa.Player.video.nodeName) return Lampa.Player.video;
                    return document.querySelector('.player video, video') || null;
                } catch(e) { return null; }
            }

            function doSave() {
                var vid = getVideo();
                if (!vid || !vid.duration || vid.duration < 10) return;
                var pct = Math.round((vid.currentTime / vid.duration) * 100);
                if (pct === lastPct) return;
                lastPct = pct;
                saveTimecode(card, season, episode, pct, vid.currentTime);
                updateTimeline(card, season, episode, pct);
            }

            saveInterval = setInterval(doSave, 15000);

            function onEvent(e) {
                if (['destroy', 'stop', 'end', 'close'].indexOf(e.type) > -1) {
                    clearInterval(saveInterval);
                    try { Lampa.Player.listener.remove('*', onEvent); } catch(ex) {}
                    doSave();
                    addToHistory(card, season, episode);
                }
            }
            if (Lampa.Player && Lampa.Player.listener)
                Lampa.Player.listener.follow('*', onEvent);

            setTimeout(function () {
                var vid = getVideo();
                if (!vid) return;
                vid.addEventListener('timeupdate', function () {
                    if (!vid.duration || vid.duration < 10) return;
                    var pct = Math.round((vid.currentTime / vid.duration) * 100);
                    if (Math.abs(pct - lastPct) >= 2) {
                        lastPct = pct;
                        saveTimecode(card, season, episode, pct, vid.currentTime);
                        updateTimeline(card, season, episode, pct);
                    }
                });
                vid.addEventListener('ended', function () {
                    clearInterval(saveInterval);
                    saveTimecode(card, season, episode, 100, vid.duration || 0);
                    updateTimeline(card, season, episode, 100);
                });
            }, 3000);
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

        var obj = {
            title:  title,
            url:    url,
            poster: card.poster || card.img || '',
            movie:  card
        };
        if (episode) { obj.season = season; obj.episode = epNum; }
        if (tc && tc.time > 30 && tc.percent < 95) {
            obj.time    = tc.time;
            obj.percent = tc.percent;
            Lampa.Noty.show('Tiếp tục ' + padZero(Math.floor(tc.time / 60)) +
                ':' + padZero(Math.round(tc.time % 60)) + ' (' + tc.percent + '%)');
        }

        Lampa.Player.play(obj);
        addToHistory(card, season, epNum, title);
        hookPlayer(card, season, epNum);
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

    function tsPlayFile(hash, fileId, title, card, season, episode) {
        var tsUrl = getTsUrl();
        var url   = tsUrl + '/stream/' + encodeURIComponent(title || 'video') +
                    '?link=' + hash + '&index=' + fileId + '&play';
        doPlay({
            url:     url,
            title:   title,
            card:    card,
            episode: (season && episode) ? { season: season, episode: episode } : null
        });
    }

    function tsAddAndPickFile(magnet, hash, torrentTitle, playTitle, card, season, episode) {
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
                    if (!files.length) { tsPlayFile(h, 0, playTitle, card, season, episode); return; }
                    if (files.length === 1) { tsPlayFile(h, files[0].id || 0, playTitle, card, season, episode); return; }
                    showFileList(files, h, playTitle, card, season, episode);
                });
            }
            setTimeout(tryGet, 2000);
        }, function () {
            Lampa.Noty.show('TorrServer lỗi...');
            if (hash) tsPlayFile(hash, 0, playTitle, card, season, episode);
        });
    }

    function showFileList(files, hash, playTitle, card, season, episode) {
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
                    card, season, episode);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       TORRENTIO / AIO
    ============================================================ */
    function buildStreamUrl(type, imdbId, season, episode) {
        var sType = type === 'series' ? 'series' : 'movie';
        var id    = imdbId;
        if (type === 'series' && season && episode)
            id = imdbId + ':' + season + ':' + episode;

        var engine = getTorrentEngine();
        if (engine === 'aio') {
            var base = getAioUrl();
            return base ? base + '/stream/' + sType + '/' + id + '.json' : null;
        }
        var cfg = getTioConfig();
        var b   = TORRENTIO_BASE + (cfg ? '/' + cfg : '');
        return b + '/stream/' + sType + '/' + id + '.json';
    }

    function fetchStreams(url, cb) {
        reguest(url,
            function (data) { cb((data && data.streams) || []); },
            function (e)    { Lampa.Noty.show('Lỗi: ' + e); cb([]); }
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
        return {
            title:   name,
            hash:    (st.infoHash || '').toLowerCase(),
            fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0,
            url:     st.url || '',
            size:    sz,
            sizeNum: parseSize(sz),
            seeds:   seedM ? parseInt(seedM[1]) : 0,
            tracker: srcM  ? srcM[1] : 'Torrentio',
            magnet:  st.infoHash ? makeMagnet(st.infoHash, name) : ''
        };
    }

    function showStreamsMenu(streams, movieTitle, card, season, episode) {
        if (!streams || !streams.length) { Lampa.Noty.show('Không tìm thấy'); return; }
        var tsUrl  = getTsUrl();
        var label  = getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio';
        var parsed = streams.map(parseStream).sort(function (a, b) { return b.sizeNum - a.sizeNum; });

        Lampa.Select.show({
            title: '🧲 ' + label + ': ' + movieTitle,
            items: parsed.map(function (s) {
                return {
                    title:    '[' + s.tracker + '] ' + s.title,
                    subtitle: (s.seeds ? '👤 ' + s.seeds + '  ' : '') + (s.size ? '💾 ' + s.size : ''),
                    s: s
                };
            }),
            onSelect: function (item) {
                var s = item.s;
                if (tsUrl && s.hash) {
                    tsAdd(s.magnet, movieTitle, function (hash) {
                        var h   = hash || s.hash;
                        var url = tsUrl + '/stream/' + encodeURIComponent(movieTitle) +
                                  '?link=' + h + '&index=' + s.fileIdx + '&play';
                        doPlay({
                            url: url, title: movieTitle, card: card,
                            episode: (season && episode) ? { season: season, episode: episode } : null
                        });
                    }, function () {
                        var url = tsUrl + '/stream/' + encodeURIComponent(movieTitle) +
                                  '?link=' + s.hash + '&index=' + s.fileIdx + '&play';
                        doPlay({ url: url, title: movieTitle, card: card });
                    });
                } else if (s.url) {
                    doPlay({
                        url: s.url, title: movieTitle, card: card,
                        episode: (season && episode) ? { season: season, episode: episode } : null
                    });
                } else {
                    Lampa.Noty.show(s.hash ? 'Chưa cấu hình TorrServer!' : 'Không có link');
                }
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function searchTorrentio(card, season, episode) {
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);

        Lampa.Noty.show('Đang tìm torrent...');

        function run(id) {
            var url = buildStreamUrl(type, id, season, episode);
            if (!url) { Lampa.Noty.show('Lỗi config'); return; }
            fetchStreams(url, function (streams) {
                var ep = (season && episode) ? ' S' + padZero(season) + 'E' + padZero(episode) : '';
                showStreamsMenu(streams, title + ep, card, season, episode);
            });
        }

        if (imdbId) { run(imdbId); return; }
        reguest(
            'https://api.themoviedb.org/3/' + (type === 'series' ? 'tv' : 'movie') +
            '/' + card.id + '/external_ids?api_key=' + TMDB_API_KEY,
            function (d) {
                if (d && d.imdb_id) { card.imdb_id = d.imdb_id; run(d.imdb_id); }
                else Lampa.Noty.show('Không tìm thấy IMDB ID');
            },
            function () { Lampa.Noty.show('Lỗi lấy IMDB ID'); }
        );
    }

    function getSeasonEpCount(card, s) {
        if (card.seasons) {
            var f = card.seasons.filter(function (x) { return x.season_number === s; })[0];
            if (f && f.episode_count) return f.episode_count;
        }
        return 50;
    }

    function askEpisode(card, onPick) {
        var total = card.number_of_seasons || 1;

        function pickEp(s) {
            var totalEps = getSeasonEpCount(card, s);
            var ee = [];
            for (var e = 1; e <= totalEps; e++) {
                var tc    = loadTimecode(card, s, e);
                var badge = tc && tc.percent >= 100 ? ' ✅'
                          : tc && tc.percent > 0    ? ' ▶ ' + tc.percent + '%'
                          : '';
                ee.push({ title: 'S' + padZero(s) + 'E' + padZero(e) + badge, s: s, e: e });
            }
            Lampa.Select.show({
                title:    'Season ' + s,
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

    /* ============================================================
       KKPHIM / OPHIM
    ============================================================ */
    function extractSeasonNumber(name, slug) {
        var text = (name || '') + ' ' + (slug || '');
        var pats = [
            /[Ss]eason[\s\-._]*(\d+)/i, /[Pp]h[aầ]n[\s\-._]*(\d+)/i,
            /[Mm][uù]a[\s\-._]*(\d+)/i, /\bS(\d+)\b/
        ];
        for (var i = 0; i < pats.length; i++) {
            var m = text.match(pats[i]);
            if (m) return parseInt(m[1]);
        }
        return 1;
    }

    function getBaseSlug(slug) {
        if (!slug) return '';
        return slug
            .replace(/-?season-?\d+/gi, '').replace(/-?phan-?\d+/gi, '')
            .replace(/-?mua-?\d+/gi,    '').replace(/-?s\d+$/gi,     '')
            .replace(/^-+|-+$/g, '').replace(/-+/g, '-');
    }

    function getBaseName(name) {
        if (!name) return '';
        return name
            .replace(/[\s\-]*[\(\[]?\s*[Ss]eason\s*\d+\s*[\)\]]?/gi, '')
            .replace(/[\s\-]*[\(\[]?\s*[Pp]h[aầ]n\s*\d+\s*[\)\]]?/gi, '')
            .replace(/[\s\-]*[\(\[]?\s*[Mm][uù]a\s*\d+\s*[\)\]]?/gi, '')
            .replace(/[\s\-]*\bS\d+\b/g, '').trim();
    }

    function searchSource(source, keyword, cb) {
        reguest(
            source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&limit=30',
            function (data) {
                cb((data && data.data && data.data.items) || (data && data.items) || []);
            },
            function () { cb([]); }
        );
    }

    function fetchDetail(source, slug, cb) {
        reguest(source.api + 'v1/api/phim/' + slug,
            function (data) {
                if (data && data.data) {
                    var item = data.data.item || data.data;
                    cb({ movie: item, episodes: data.data.episodes || item.episodes || [] });
                } else {
                    reguest(source.api + 'phim/' + slug,
                        function (d2) { cb({ movie: d2.movie || d2 || {}, episodes: d2.episodes || [] }); },
                        function ()   { cb({ movie: {}, episodes: [] }); }
                    );
                }
            },
            function () {
                reguest(source.api + 'phim/' + slug,
                    function (d2) { cb({ movie: d2.movie || d2 || {}, episodes: d2.episodes || [] }); },
                    function ()   { cb({ movie: {}, episodes: [] }); }
                );
            }
        );
    }

    function matchScore(item, title, orig, year) {
        var score = 0;
        var nT = normalizeStr(title), nO = normalizeStr(orig);
        var n1 = normalizeStr(item.name || ''), n2 = normalizeStr(item.origin_name || '');
        if (nT && (n1 === nT || n2 === nT)) score += 100;
        else if (nO && (n1 === nO || n2 === nO)) score += 100;
        else if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 50;
        else if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1)) score += 50;
        if (year && item.year) {
            var d = Math.abs(parseInt(item.year) - parseInt(year));
            if (d === 0) score += 30; else if (d <= 1) score += 15;
        }
        return score;
    }

    function findAllSeasons(source, keyword, title, orig, year, cb) {
        var terms = [];
        var bOrig = getBaseName(orig), bTitle = getBaseName(title);
        if (bOrig)  terms.push(bOrig);
        if (bTitle && terms.indexOf(bTitle) === -1) terms.push(bTitle);
        if (orig   && terms.indexOf(orig)   === -1) terms.push(orig);
        if (title  && terms.indexOf(title)  === -1) terms.push(title);
        if (!terms.length) terms.push(keyword);

        var all = [], idx = 0;

        function next() {
            if (idx >= terms.length) { process(all); return; }
            searchSource(source, terms[idx++], function (items) {
                items.forEach(function (it) {
                    if (!all.some(function (r) { return r.slug === it.slug; })) all.push(it);
                });
                next();
            });
        }

        function process(results) {
            if (!results.length) { cb(null); return; }
            var groups = {};
            results.forEach(function (it) {
                var base = getBaseSlug(it.slug || '');
                var sn   = extractSeasonNumber(it.name, it.slug);
                if (!groups[base]) groups[base] = [];
                if (!groups[base].some(function (d) { return d.season_num === sn && d.slug === it.slug; })) {
                    groups[base].push({
                        season_num: sn, slug: it.slug,
                        name: it.name || '', origin_name: it.origin_name || '',
                        year: it.year || '', type: it.type || ''
                    });
                }
            });

            var tSlug = getBaseSlug(
                normalizeStr(orig || title || keyword).replace(/[^\w\s]/g, '').replace(/\s+/g, '-')
            );
            var best = null, bestS = -1;

            for (var base in groups) {
                if (!groups.hasOwnProperty(base)) continue;
                var sc = 0, seasons = groups[base];
                if (base === tSlug) sc = 100;
                else if (base.indexOf(tSlug) > -1 || tSlug.indexOf(base) > -1) sc = 70;
                else {
                    var bw = base.split('-').filter(Boolean);
                    var tw = tSlug.split('-').filter(Boolean);
                    var cm = tw.filter(function (w) { return bw.indexOf(w) > -1; }).length;
                    if (cm > 0) sc = (cm / Math.max(bw.length, tw.length)) * 60;
                }
                seasons.forEach(function (s) {
                    var ms = matchScore(s, title, orig, year);
                    if (ms > sc) sc = ms;
                });
                if (seasons.length > 1) sc += 5;
                if (sc > bestS) { bestS = sc; best = { base: base, seasons: seasons }; }
            }

            if (!best || bestS < 10) {
                var f = results[0];
                cb({
                    movie_name: getBaseName(f.origin_name || f.name || ''),
                    seasons: [{
                        season_num: 1, slug: f.slug,
                        name: f.name || '', origin_name: f.origin_name || '',
                        year: f.year || '', type: f.type || ''
                    }]
                });
                return;
            }

            best.seasons.sort(function (a, b) { return a.season_num - b.season_num; });
            var unique = [], seen = {};
            best.seasons.forEach(function (s) {
                if (!seen[s.season_num]) { seen[s.season_num] = true; unique.push(s); }
            });
            cb({
                movie_name: getBaseName(unique[0].origin_name || unique[0].name || '') || title || keyword,
                seasons:    unique
            });
        }

        next();
    }

    function cleanName(n) { return (n || '').replace(/^#+\s*/, '').trim(); }

    function searchAndPlay(sourceKey, card) {
        var source = SOURCES[sourceKey];
        if (!source) return;
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);

        Lampa.Noty.show(source.name + ': đang tìm...');
        findAllSeasons(source, title, title, orig, year, function (result) {
            if (!result || !result.seasons || !result.seasons.length) {
                searchSource(source, orig || title, function (items) {
                    if (!items.length && orig !== title) {
                        searchSource(source, title, function (i2) { showManualSelect(source, i2, card); });
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
        var title   = card.title || card.name || result.movie_name;
        if (seasons.length === 1) { loadSeasonEps(source, seasons[0], card, title); return; }
        Lampa.Select.show({
            title: '📺 ' + result.movie_name,
            items: seasons.map(function (s) {
                return {
                    title:    'Season ' + s.season_num + ': ' + s.name,
                    subtitle: s.year ? 'Năm: ' + s.year : '',
                    season:   s
                };
            }),
            onSelect: function (item) { loadSeasonEps(source, item.season, card, title); },
            onBack:   function ()     { Lampa.Controller.toggle('full'); }
        });
    }

    function loadSeasonEps(source, season, card, movieTitle) {
        Lampa.Noty.show('Đang tải ' + season.name + '...');
        fetchDetail(source, season.slug, function (data) {
            var eps = data.episodes || [];
            if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }
            playEpisode(card, eps, season.season_num, movieTitle, season.name);
        });
    }

    function playEpisode(card, episodes, seasonNum, movieTitle, seasonName) {
        var displayTitle = seasonName || movieTitle || card.title || card.name || '';
        var servers = episodes.filter(function (s) {
            return s.server_data && s.server_data.length > 0;
        });
        if (!servers.length) { Lampa.Noty.show('Không có tập'); return; }
        if (servers.length === 1) { showEpisodeMenu(displayTitle, servers[0], card, seasonNum); return; }
        Lampa.Select.show({
            title: displayTitle + ' — Chọn phiên bản',
            items: servers.map(function (s, idx) {
                return {
                    title:    cleanName(s.server_name) || ('Phiên bản ' + (idx + 1)),
                    subtitle: (s.server_data || []).length + ' tập',
                    srv:      s
                };
            }),
            onSelect: function (item) { showEpisodeMenu(displayTitle, item.srv, card, seasonNum); },
            onBack:   function ()     { Lampa.Controller.toggle('full'); }
        });
    }

    function showEpisodeMenu(title, serverData, card, seasonNum) {
        var eps   = serverData.server_data || [];
        var sNum  = seasonNum || 1;
        var sName = cleanName(serverData.server_name);
        var menuT = title + (sName ? ' · ' + sName : '');
        if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }

        var playlist = eps.map(function (ep, idx) {
            return {
                title:   menuT + ' — ' + (ep.name || 'Tập ' + (idx + 1)),
                url:     ep.link_m3u8 || ep.link_embed || '',
                movie:   card,
                season:  sNum,
                episode: idx + 1
            };
        });

        Lampa.Select.show({
            title: '🎬 ' + menuT + ' (' + eps.length + ' tập)',
            items: eps.map(function (ep, idx) {
                var link  = ep.link_m3u8 || ep.link_embed || '';
                var epNum = idx + 1;
                var tc    = loadTimecode(card, sNum, epNum);
                var badge = tc && tc.percent >= 100 ? ' ✅'
                          : tc && tc.percent > 0    ? ' ▶ ' + tc.percent + '%'
                          : '';
                return {
                    title:    (ep.name || 'Tập ' + epNum) + badge,
                    subtitle: !link ? '⚠ Không có link'
                            : (link.indexOf('.m3u8') > -1 ? '🎬 M3U8' : '🌐 Embed'),
                    ep: ep, idx: idx
                };
            }),
            onSelect: function (item) {
                var link  = item.ep.link_m3u8 || item.ep.link_embed || '';
                var epNum = item.idx + 1;
                if (!link) { Lampa.Noty.show('Không có link'); return; }
                doPlay({
                    url:     link,
                    title:   menuT + ' — ' + (item.ep.name || 'Tập ' + epNum),
                    card:    card,
                    episode: { season: sNum, episode: epNum }
                });
                try { Lampa.Player.playlist(playlist, item.idx); } catch(e) {}
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function showManualSelect(source, items, card) {
        if (!items || !items.length) { Lampa.Noty.show('Không tìm thấy trên ' + source.name); return; }
        Lampa.Select.show({
            title: source.name + ' — Kết quả',
            items: items.map(function (it) {
                var sn = extractSeasonNumber(it.name, it.slug);
                return {
                    title:    (it.name || '') +
                              (it.origin_name ? ' (' + it.origin_name + ')' : '') +
                              (sn > 1 ? ' [S' + sn + ']' : '') +
                              (it.year ? ' [' + it.year + ']' : ''),
                    subtitle: it.slug,
                    slug:     it.slug,
                    item:     it
                };
            }),
            onSelect: function (sel) {
                var sNum = extractSeasonNumber(sel.item.name, sel.item.slug);
                Lampa.Noty.show('Đang tải...');
                fetchDetail(source, sel.slug, function (data) {
                    var eps = data.episodes || [];
                    if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }
                    playEpisode(card, eps, sNum, card.title || card.name, sel.item.name);
                });
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       SETTINGS
    ============================================================ */
    function initSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;
        Lampa.SettingsApi.addComponent({
            component: 'kkphim',
            name:      'KKPhim + Torrentio',
            icon: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24">' +
                  '<rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/>' +
                  '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>'
        });
        setTimeout(buildSettings, 200);
    }

    function buildSettings() {
        if (!Lampa.SettingsApi) return;
        var params = [
            {
                name: 'torrserver_url', type: 'input',
                field: { name: 'TorrServer URL', description: 'VD: 192.168.1.100:8090' }
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
                    if (!u) { Lampa.Noty.show('Chưa nhập URL!'); return; }
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
                name: 'torrent_engine', type: 'select',
                values: { torrentio: 'Torrentio', aio: 'AIOStreams' }, default: 'torrentio',
                field: { name: 'Engine Torrent', description: 'Torrentio hoặc AIOStreams' }
            },
            {
                name: 'torrentio_config', type: 'input',
                field: { name: 'Torrentio Config', description: 'Link manifest hoặc để trống' }
            },
            {
                name: 'aio_url', type: 'input',
                field: { name: 'AIOStreams URL', description: 'URL manifest AIO' }
            }
        ];

        params.forEach(function (p) {
            Lampa.SettingsApi.addParam({
                component: 'kkphim',
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

        if ($ctx.find('.view--kkphim').length) return;

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

        var $kk = mkBtn('view--kkphim',
            '<rect x="2" y="2" width="20" height="20" rx="3"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'KKPhim',
            function () { searchAndPlay('kkphim', card); }
        );

        var $op = mkBtn('view--ophim',
            '<circle cx="12" cy="12" r="10"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'OPhim',
            function () { searchAndPlay('ophim', card); }
        );

        var $tio = mkBtn('view--kkphim-tio',
            '<circle cx="12" cy="12" r="10"/>' +
            '<polyline points="8 12 12 16 16 12"/>' +
            '<line x1="12" y1="8" x2="12" y2="16"/>',
            getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio',
            function () {
                if (isSeries) askEpisode(card, function (s, ep) { searchTorrentio(card, s, ep); });
                else searchTorrentio(card, null, null);
            }
        );

        var $anchor = $ctx.find('.view--torrent');
        if ($anchor.length) {
            $anchor.after($tio).after($op).after($kk);
        } else {
            $ctx.find('.full-start__buttons').append($kk).append($op).append($tio);
        }
    });

    /* ============================================================
       START
    ============================================================ */
    function start() {
        initSettings();
        console.log('[KKPhim Plugin] v3.0 — KKPhim | OPhim | Torrentio/AIO ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();