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

    /* ---- STORAGE ---- */
    function getSetting(key) {
        return Lampa.Storage.get(STG_PREFIX + key, '');
    }
    function setSetting(key, val) {
        Lampa.Storage.set(STG_PREFIX + key, val);
    }

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
    function getJackettKey()    { return getSetting('jackett_key') || ''; }
    function getBitSearchProxy(){ return (getSetting('bitsearch_proxy') || 'https://bitsearch.to').replace(/\/+$/, ''); }

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

    /* ---- HELPERS ---- */
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

    /* ============================================================
       TIMECODE — FIX: dùng đúng API của Lampa Player
    ============================================================ */

    function buildTimelineId(card, season, episode) {
        var base = 'kkparser_tc_' + (card.id || card.imdb_id || '');
        if (season && episode) {
            base += '_s' + padZero(season) + 'e' + padZero(episode);
        }
        return base;
    }

    function saveTimecode(card, season, episode, percent, time) {
        try {
            var key  = buildTimelineId(card, season, episode);
            var data = {
                percent: Math.round(percent || 0),
                time:    Math.round(time    || 0),
                season:  season  || 0,
                episode: episode || 0,
                updated: Date.now()
            };
            Lampa.Storage.set(key, data);
            console.log('[KKPhim] saveTimecode', key, data);
        } catch(e) {
            console.warn('[KKPhim] saveTimecode error:', e);
        }
    }

    function loadTimecode(card, season, episode) {
        try {
            var key  = buildTimelineId(card, season, episode);
            var data = Lampa.Storage.get(key, null);
            return data || { percent: 0, time: 0 };
        } catch(e) {
            return { percent: 0, time: 0 };
        }
    }

    function addToLampaHistory(card, season, episode, title) {
        try {
            var hCard = Object.assign({}, card);
            if (season)  hCard.season  = season;
            if (episode) hCard.episode = episode;
            if (title)   hCard.title   = title;
            if (Lampa.Favorite && Lampa.Favorite.add) {
                Lampa.Favorite.add('history', hCard);
            }
        } catch(e) {
            console.warn('[KKPhim] addToLampaHistory error:', e);
        }
    }

    function updateLampaTimeline(card, season, episode, percent) {
        try {
            if (Lampa.Timeline && Lampa.Timeline.update) {
                var tc = Object.assign({}, card);
                if (season)  tc.season  = season;
                if (episode) tc.episode = episode;
                Lampa.Timeline.update(tc, { percent: percent || 0 });
            }
        } catch(e) {
            console.warn('[KKPhim] updateLampaTimeline error:', e);
        }
    }

    /**
     * FIX: Hook đúng vào Lampa Player
     * Lampa dùng Lampa.Player.listener (không phải Lampa.Listener)
     * Và lấy video element qua Lampa.Player.video() (là function, không phải property)
     */
    function hookPlayerProgress(card, season, episode) {
        try {
            // Kiểm tra Player tồn tại
            if (!Lampa.Player || !Lampa.Player.listener) {
                console.warn('[KKPhim] Lampa.Player.listener không tồn tại');
                return;
            }

            var lastSavedPct = -1;
            var saveInterval = null;

            // Hàm lấy video element an toàn
            function getVideo() {
                try {
                    // Lampa.Player.video có thể là function hoặc property
                    if (typeof Lampa.Player.video === 'function') {
                        return Lampa.Player.video();
                    }
                    if (Lampa.Player.video && Lampa.Player.video.nodeName) {
                        return Lampa.Player.video;
                    }
                    // Fallback: tìm trong DOM
                    var v = document.querySelector('.player video, video.player__video, #player video');
                    return v || null;
                } catch(ex) {
                    return null;
                }
            }

            // Hàm đọc progress và lưu
            function doSave() {
                var vid = getVideo();
                if (!vid) return;
                var t   = vid.currentTime || 0;
                var dur = vid.duration    || 0;
                if (dur < 10) return; // tránh lưu khi chưa load xong
                var pct = Math.round((t / dur) * 100);
                if (pct === lastSavedPct) return; // không thay đổi thì bỏ qua
                lastSavedPct = pct;
                saveTimecode(card, season, episode, pct, t);
                updateLampaTimeline(card, season, episode, pct);
            }

            // Bắt đầu interval lưu mỗi 15 giây
            saveInterval = setInterval(doSave, 15000);

            // Lắng nghe sự kiện destroy/end của player
            function onPlayerEvent(e) {
                if (e.type === 'destroy' || e.type === 'stop' ||
                    e.type === 'end'     || e.type === 'close') {

                    // Dừng interval
                    if (saveInterval) { clearInterval(saveInterval); saveInterval = null; }

                    // Remove listener
                    try { Lampa.Player.listener.remove('*', onPlayerEvent); } catch(ex) {}

                    // Lưu lần cuối
                    doSave();
                    addToLampaHistory(card, season, episode);
                }
            }

            Lampa.Player.listener.follow('*', onPlayerEvent);

            // Cũng thử hook native video element sau 3 giây (khi video đã load)
            setTimeout(function () {
                var vid = getVideo();
                if (vid) {
                    vid.addEventListener('timeupdate', function onTU() {
                        // Lưu mỗi 30 giây thực tế
                        var t   = vid.currentTime || 0;
                        var dur = vid.duration    || 0;
                        if (dur < 10) return;
                        var pct = Math.round((t / dur) * 100);
                        // Chỉ lưu khi thay đổi 2% trở lên
                        if (Math.abs(pct - lastSavedPct) >= 2) {
                            lastSavedPct = pct;
                            saveTimecode(card, season, episode, pct, t);
                            updateLampaTimeline(card, season, episode, pct);
                        }
                    });
                    // Khi video kết thúc
                    vid.addEventListener('ended', function () {
                        saveTimecode(card, season, episode, 100, vid.duration || 0);
                        updateLampaTimeline(card, season, episode, 100);
                        if (saveInterval) { clearInterval(saveInterval); saveInterval = null; }
                    });
                }
            }, 3000);

        } catch(e) {
            console.warn('[KKPhim] hookPlayerProgress error:', e);
        }
    }

    /* ============================================================
       PLAY HELPER
    ============================================================ */
    function doPlay(params) {
        var card    = params.card    || {};
        var url     = params.url     || '';
        var title   = params.title   || card.title || card.name || '';
        var episode = params.episode || null;

        if (!url) { Lampa.Noty.show('Không có link phát'); return; }

        var season = episode ? (episode.season  || 0) : 0;
        var epNum  = episode ? (episode.episode || 0) : 0;

        // Lấy timecode đã lưu để resume
        var savedTc = loadTimecode(card, season, epNum);

        var obj = {
            title:  title,
            url:    url,
            poster: card.poster || card.img || '',
            movie:  card
        };

        if (episode) {
            obj.season  = season;
            obj.episode = epNum;
        }

        // Resume từ vị trí đã xem (nếu > 30 giây và < 95%)
        if (savedTc && savedTc.time > 30 && savedTc.percent < 95) {
            obj.time    = savedTc.time;
            obj.percent = savedTc.percent;
            Lampa.Noty.show(
                'Tiếp tục từ ' + padZero(Math.floor(savedTc.time / 60)) +
                ':' + padZero(Math.round(savedTc.time % 60)) +
                ' (' + savedTc.percent + '%)'
            );
        }

        Lampa.Player.play(obj);

        // Thêm vào history
        addToLampaHistory(card, season, epNum, title);

        // Cập nhật timeline ban đầu
        if (savedTc) updateLampaTimeline(card, season, epNum, savedTc.percent);

        // Hook theo dõi
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
        if (!tsUrl) {
            Lampa.Noty.show('Chưa cấu hình TorrServer!');
            return;
        }
        $.ajax({
            url:      tsUrl + '/torrents',
            type:     'POST',
            headers:  tsHeaders(),
            data:     JSON.stringify({
                action:     'add',
                link:       magnet,
                title:      title || '',
                save_to_db: false
            }),
            dataType: 'json',
            timeout:  15000,
            success:  function (data) { onDone((data && data.hash) || ''); },
            error:    function ()     { onFail && onFail(); }
        });
    }

    function tsGetFiles(hash, onDone) {
        var tsUrl = getTsUrl();
        $.ajax({
            url:      tsUrl + '/torrents',
            type:     'POST',
            headers:  tsHeaders(),
            data:     JSON.stringify({ action: 'get', hash: hash }),
            dataType: 'json',
            timeout:  15000,
            success:  function (data) {
                var files = ((data && data.file_stats) || [])
                    .filter(function (f) {
                        return (f.path || '').toLowerCase()
                            .match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/);
                    })
                    .sort(function (a, b) {
                        return (a.path || '').localeCompare(
                            b.path || '', undefined, { numeric: true }
                        );
                    });
                onDone(files, data);
            },
            error: function () { onDone([], null); }
        });
    }

    function tsPlayFile(hash, fileId, title, card, season, episode) {
        var tsUrl = getTsUrl();
        var name  = encodeURIComponent(title || 'video');
        var url   = tsUrl + '/stream/' + name +
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
        if (!tsUrl) {
            Lampa.Noty.show('Chưa cấu hình TorrServer!');
            return;
        }

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
                        tsPlayFile(h, 0, playTitle, card, season, episode);
                        return;
                    }
                    if (files.length === 1) {
                        tsPlayFile(h, files[0].id || 0, playTitle, card, season, episode);
                        return;
                    }
                    showFileList(files, h, playTitle, card, season, episode);
                });
            }
            setTimeout(tryGetFiles, 2000);

        }, function () {
            Lampa.Noty.show('TorrServer lỗi, thử phát trực tiếp...');
            if (hash) tsPlayFile(hash, 0, playTitle, card, season, episode);
        });
    }

    function showFileList(files, hash, playTitle, card, season, episode) {
        Lampa.Select.show({
            title: '📂 Chọn file — ' + playTitle,
            items: files.map(function (f) {
                var parts    = (f.path || '').split('/');
                var filename = parts[parts.length - 1] || f.path || 'File';
                var size     = f.length ? ' — ' + fmtBytes(f.length) : '';
                var epMatch  = filename.match(/[Ee](\d+)|[Сс](\d+)|\b(\d{2,3})\b/);
                var epLabel  = epMatch
                    ? ' [Ep ' + (epMatch[1]||epMatch[2]||epMatch[3]) + ']' : '';
                return {
                    title:    filename + epLabel,
                    subtitle: size.trim(),
                    file:     f
                };
            }),
            onSelect: function (item) {
                var f      = item.file;
                var fTitle = playTitle + ' — ' + (f.path || '').split('/').pop();
                tsPlayFile(hash, f.id || 0, fTitle, card, season, episode);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       KKPHIM / OPHIM
    ============================================================ */
    function extractSeasonNumber(name, slug) {
        var text = (name || '') + ' ' + (slug || '');
        var patterns = [
            /[Ss]eason[\s\-._]*(\d+)/i,
            /[Pp]h[aầ]n[\s\-._]*(\d+)/i,
            /[Mm][uù]a[\s\-._]*(\d+)/i,
            /\bS(\d+)\b/
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
            source.api + 'v1/api/tim-kiem?keyword=' +
            encodeURIComponent(keyword) + '&limit=30',
            function (data) {
                var items = [];
                if (data && data.data && data.data.items) items = data.data.items;
                else if (data && data.items) items = data.items;
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
                    var item     = data.data.item || data.data;
                    var episodes = data.data.episodes || item.episodes || [];
                    cb({ movie: item, episodes: episodes });
                } else {
                    reguest(
                        source.api + 'phim/' + slug,
                        function (d2) {
                            cb({
                                movie:    d2.movie || d2.item || d2 || {},
                                episodes: d2.episodes || []
                            });
                        },
                        function () { cb({ movie: {}, episodes: [] }); }
                    );
                }
            },
            function () {
                reguest(
                    source.api + 'phim/' + slug,
                    function (d2) {
                        cb({
                            movie:    d2.movie || d2.item || d2 || {},
                            episodes: d2.episodes || []
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
        var nT_b = normalizeStr(getBaseName(title));
        var nO_b = normalizeStr(getBaseName(orig));
        var n1_b = normalizeStr(getBaseName(item.name || ''));
        var n2_b = normalizeStr(getBaseName(item.origin_name || ''));

        if (nT && (n1 === nT || n2 === nT)) score += 100;
        else if (nO && (n1 === nO || n2 === nO)) score += 100;
        else if (nT_b && (n1_b === nT_b || n2_b === nT_b)) score += 90;
        else if (nO_b && (n1_b === nO_b || n2_b === nO_b)) score += 90;
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
        var terms = [];
        var bOrig  = getBaseName(orig);
        var bTitle = getBaseName(title);
        if (bOrig)  terms.push(bOrig);
        if (bTitle && terms.indexOf(bTitle) === -1) terms.push(bTitle);
        if (orig   && terms.indexOf(orig)   === -1) terms.push(orig);
        if (title  && terms.indexOf(title)  === -1) terms.push(title);
        if (!terms.length) terms.push(keyword);

        var allResults = [];
        var idx = 0;

        function doSearch() {
            if (idx >= terms.length) { processResults(allResults); return; }
            var term = terms[idx++];
            searchSource(source, term, function (items) {
                items.forEach(function (it) {
                    var exists = allResults.some(function (r) { return r.slug === it.slug; });
                    if (!exists) allResults.push(it);
                });
                doSearch();
            });
        }

        function processResults(results) {
            if (!results.length) { cb(null); return; }

            var groups = {};
            results.forEach(function (item) {
                var base      = getBaseSlug(item.slug || '');
                var seasonNum = extractSeasonNumber(item.name, item.slug);
                if (!groups[base]) groups[base] = [];
                var dup = groups[base].some(function (d) {
                    return d.season_num === seasonNum && d.slug === item.slug;
                });
                if (!dup) {
                    groups[base].push({
                        season_num:  seasonNum,
                        slug:        item.slug,
                        name:        item.name || '',
                        origin_name: item.origin_name || '',
                        year:        item.year || '',
                        type:        item.type || ''
                    });
                }
            });

            var bestGroup = null, bestScore = -1;
            var targetSlug = getBaseSlug(
                normalizeStr(orig || title || keyword)
                    .replace(/[^\w\s]/g, '').replace(/\s+/g, '-')
            );

            for (var base in groups) {
                if (!groups.hasOwnProperty(base)) continue;
                var score   = 0;
                var seasons = groups[base];

                if (base === targetSlug) score = 100;
                else if (base.indexOf(targetSlug) > -1 ||
                         targetSlug.indexOf(base) > -1) score = 70;
                else {
                    var bWords = base.split('-').filter(Boolean);
                    var tWords = targetSlug.split('-').filter(Boolean);
                    var common = tWords.filter(function (w) {
                        return bWords.indexOf(w) > -1;
                    }).length;
                    if (common > 0) {
                        score = (common / Math.max(bWords.length, tWords.length)) * 60;
                    }
                }

                seasons.forEach(function (s) {
                    var ms = matchScore(s, title, orig, year);
                    if (ms > 0) score = Math.max(score, ms);
                });
                if (seasons.length > 1) score += 5;
                if (score > bestScore) {
                    bestScore = score;
                    bestGroup = { base: base, seasons: seasons };
                }
            }

            if (!bestGroup || bestScore < 10) {
                var first = results[0];
                cb({
                    movie_name: getBaseName(first.origin_name || first.name || ''),
                    seasons: [{ season_num: 1, slug: first.slug,
                                name: first.name || '',
                                origin_name: first.origin_name || '',
                                year: first.year || '', type: first.type || '' }]
                });
                return;
            }

            bestGroup.seasons.sort(function (a, b) { return a.season_num - b.season_num; });
            var unique = [], seen = {};
            bestGroup.seasons.forEach(function (s) {
                if (!seen[s.season_num]) { seen[s.season_num] = true; unique.push(s); }
            });

            var movieName = unique.length
                ? getBaseName(unique[0].origin_name || unique[0].name || '')
                : (title || keyword);

            cb({ movie_name: movieName, seasons: unique });
        }

        doSearch();
    }

    function cleanName(name) {
        return (name || '').replace(/^#+\s*/, '').trim();
    }

    /* ============================================================
       KKPHIM/OPHIM FLOW
    ============================================================ */
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
        var seasons   = result.seasons;
        var movieName = result.movie_name;
        var title     = card.title || card.name || movieName;

        if (seasons.length === 1) {
            loadSeasonEpisodes(source, seasons[0], card, title);
            return;
        }

        Lampa.Select.show({
            title: '📺 ' + movieName + ' — ' + seasons.length + ' Season',
            items: seasons.map(function (s) {
                return {
                    title:    'Season ' + s.season_num + ': ' + s.name,
                    subtitle: s.year ? 'Năm: ' + s.year : '',
                    season:   s
                };
            }),
            onSelect: function (item) {
                loadSeasonEpisodes(source, item.season, card, title);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function loadSeasonEpisodes(source, season, card, movieTitle) {
        fetchDetail(source, season.slug, function (data) {
            var eps = data.episodes || [];
            if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }
            playEpisode(card, eps, season.season_num, movieTitle, season.name);
        });
    }

    function playEpisode(card, episodes, seasonNum, movieTitle, seasonName) {
        var displayTitle = seasonName || movieTitle || card.title || card.name || '';
        var servers = (episodes || []).filter(function (s) {
            return s.server_data && s.server_data.length > 0;
        });
        if (!servers.length) { Lampa.Noty.show('Không có tập phim'); return; }
        if (servers.length === 1) {
            showEpisodeMenu(displayTitle, servers[0], card, seasonNum);
            return;
        }
        Lampa.Select.show({
            title: displayTitle + ' — Chọn phiên bản',
            items: servers.map(function (s, idx) {
                return {
                    title:    cleanName(s.server_name) || ('Phiên bản ' + (idx + 1)),
                    subtitle: (s.server_data || []).length + ' tập',
                    srv:      s
                };
            }),
            onSelect: function (item) {
                showEpisodeMenu(displayTitle, item.srv, card, seasonNum);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function showEpisodeMenu(title, serverData, card, seasonNum) {
        var eps     = serverData.server_data || [];
        var srvName = cleanName(serverData.server_name);
        var menuT   = title + (srvName ? ' · ' + srvName : '');
        var sNum    = seasonNum || 1;
        if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }

        var playlist = eps.map(function (ep, idx) {
            return {
                title:   menuT + ' — ' + (ep.name || ('Tập ' + (idx + 1))),
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
                var badge = '';
                if (tc && tc.percent > 0 && tc.percent < 100) {
                    badge = ' ▶ ' + tc.percent + '%';
                } else if (tc && tc.percent >= 100) {
                    badge = ' ✅';
                }
                return {
                    title:    (ep.name || ('Tập ' + epNum)) + badge,
                    subtitle: !link
                        ? '⚠ Không có link'
                        : (link.indexOf('.m3u8') > -1 ? '🎬 M3U8' : '🌐 Embed'),
                    ep:  ep,
                    idx: idx
                };
            }),
            onSelect: function (item) {
                var link  = item.ep.link_m3u8 || item.ep.link_embed || '';
                var epNum = item.idx + 1;
                if (!link) { Lampa.Noty.show('Không có link phát'); return; }
                doPlay({
                    url:     link,
                    title:   menuT + ' — ' + (item.ep.name || ('Tập ' + epNum)),
                    card:    card,
                    episode: { season: sNum, episode: epNum }
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
                var sn    = extractSeasonNumber(it.name, it.slug);
                var sLabel = sn > 1 ? ' [S' + sn + ']' : '';
                return {
                    title:    (it.name || '') +
                              (it.origin_name ? ' (' + it.origin_name + ')' : '') +
                              sLabel +
                              (it.year ? ' [' + it.year + ']' : ''),
                    subtitle: it.slug,
                    slug:     it.slug,
                    item:     it
                };
            }),
            onSelect: function (sel) {
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

    /* ============================================================
       BITSEARCH — nguồn torrent mới
       API: GET https://bitsearch.to/search?q=...&p=1&fuv=1
       Trả về HTML, cần parse
       Dùng JSON API: https://bitsearch.to/api/v1/search?q=...&sort=seeders
    ============================================================ */
    function searchBitSearch(card) {
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query = (orig || title) + (year ? ' ' + year : '');

        Lampa.Noty.show('BitSearch: đang tìm...');

        fetchBitSearch(query, function (results) {
            if (!results.length && orig && orig !== title) {
                // Thử tìm bằng title tiếng Anh không có năm
                fetchBitSearch(orig, function (r2) {
                    if (!r2.length) {
                        fetchBitSearch(title + (year ? ' ' + year : ''), function (r3) {
                            showPackMenu(r3, title, 'BitSearch', card);
                        });
                    } else {
                        showPackMenu(r2, title, 'BitSearch', card);
                    }
                });
            } else {
                showPackMenu(results, title, 'BitSearch', card);
            }
        });
    }

    function fetchBitSearch(query, cb) {
        var proxy = getBitSearchProxy();

        // BitSearch có API JSON tại /api/v1/search
        var apiUrl = proxy + '/api/v1/search?q=' +
                     encodeURIComponent(query) +
                     '&sort=seeders&fuv=1';

        reguest(apiUrl, function (data) {
            var raw = typeof data === 'string' ? JSON.parse(data) : data;
            // Response: { data: [ { name, info_hash, stats: { seeders, leechers, size }, ... } ] }
            var list = (raw && raw.data) ? raw.data : [];

            if (!list.length) {
                // Fallback: parse HTML search page
                parseBitSearchHtml(proxy, query, cb);
                return;
            }

            var results = list.map(function (item) {
                var hash = (item.info_hash || '').toLowerCase();
                if (!hash) return null;

                var stats   = item.stats || {};
                var sizeRaw = stats.size || 0;
                var sizeNum = typeof sizeRaw === 'number'
                    ? sizeRaw
                    : parseSize(String(sizeRaw));

                // Phát hiện chất lượng từ tên
                var qm = (item.name || '').match(
                    /\b(2160p|4K|1080p|720p|480p|BluRay|WEB-?DL|HDRip|REMUX)\b/i
                );

                return {
                    title:   item.name || '',
                    seeds:   parseInt(stats.seeders)  || 0,
                    peers:   parseInt(stats.leechers) || 0,
                    size:    typeof sizeRaw === 'number' ? fmtBytes(sizeRaw) : String(sizeRaw),
                    sizeNum: sizeNum,
                    tracker: 'BitSearch',
                    quality: qm ? qm[1] : '',
                    hash:    hash,
                    magnet:  makeMagnet(hash, item.name)
                };
            })
            .filter(Boolean)
            .sort(function (a, b) { return b.sizeNum - a.sizeNum; });

            cb(results);

        }, function () {
            // API không trả được → parse HTML
            parseBitSearchHtml(proxy, query, cb);
        });
    }

    /**
     * Fallback: parse HTML nếu API không hoạt động
     * Dùng Lampa.Reguest để lấy HTML thô rồi dùng regex parse
     */
    function parseBitSearchHtml(proxy, query, cb) {
        var url = proxy + '/search?q=' + encodeURIComponent(query) + '&sort=seeders';

        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(url,
            function (html) {
                // Parse HTML string bằng regex
                var results = [];

                if (typeof html !== 'string') {
                    try { html = JSON.stringify(html); } catch(e) { html = ''; }
                }

                // Pattern tìm các torrent card trong HTML BitSearch
                // <li class="card search-result...">
                var cardPattern = /<li[^>]*class="[^"]*search-result[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
                var match;

                while ((match = cardPattern.exec(html)) !== null) {
                    var block = match[1];

                    // Lấy tên
                    var nameM = block.match(/<h5[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h5>/i);
                    var name  = nameM
                        ? nameM[1].replace(/<[^>]+>/g, '').trim()
                        : '';

                    // Lấy hash từ magnet link
                    var hashM = block.match(/magnet:\?xt=urn:btih:([a-fA-F0-9]{40})/i);
                    var hash  = hashM ? hashM[1].toLowerCase() : '';

                    if (!hash) {
                        // Thử link detail page /torrent/{hash}
                        var linkM = block.match(/\/torrent\/([a-fA-F0-9]{40})/i);
                        if (linkM) hash = linkM[1].toLowerCase();
                    }

                    if (!hash || !name) continue;

                    // Lấy seeders
                    var seedM = block.match(/seeders[^>]*>[\s]*(\d+)/i)
                             || block.match(/<span[^>]*>(\d+)<\/span>\s*seeders/i)
                             || block.match(/(\d+)\s*seeders/i);
                    var seeds = seedM ? parseInt(seedM[1]) : 0;

                    // Lấy size
                    var sizeM = block.match(/([\d.,]+\s*(?:TB|GB|MB|KB))/i);
                    var size  = sizeM ? sizeM[1].trim() : '';

                    var qm = name.match(
                        /\b(2160p|4K|1080p|720p|480p|BluRay|WEB-?DL|HDRip|REMUX)\b/i
                    );

                    results.push({
                        title:   name,
                        seeds:   seeds,
                        peers:   0,
                        size:    size,
                        sizeNum: parseSize(size),
                        tracker: 'BitSearch',
                        quality: qm ? qm[1] : '',
                        hash:    hash,
                        magnet:  makeMagnet(hash, name)
                    });
                }

                results.sort(function (a, b) {
                    return (b.seeds - a.seeds) || (b.sizeNum - a.sizeNum);
                });

                cb(results);
            },
            function () { cb([]); }
        );
    }

    /* ============================================================
       JACKETT
    ============================================================ */
    function fetchJackett(query, cb) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url) { Lampa.Noty.show('Chưa cấu hình Jackett!'); cb([]); return; }
        if (!key) { Lampa.Noty.show('Chưa nhập API Key!');      cb([]); return; }

        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' +
            encodeURIComponent(key) +
            '&Query=' + encodeURIComponent(query) +
            '&Category[]=2000&Category[]=5000',
            function (data) {
                var d = typeof data === 'string' ? JSON.parse(data) : data;
                var results = ((d && d.Results) || []).map(function (r) {
                    var link = r.MagnetUri || r.Link || '';
                    if (!link) return null;
                    var hm = link.match(/btih:([a-f0-9]+)/i);
                    var qm = (r.Title || '').match(
                        /\b(2160p|4K|1080p|720p|480p|BluRay|WEB-?DL|HDRip)\b/i
                    );
                    return {
                        title:   r.Title || '',
                        seeds:   parseInt(r.Seeders) || 0,
                        peers:   parseInt(r.Peers)   || 0,
                        size:    fmtBytes(parseInt(r.Size) || 0),
                        sizeNum: parseInt(r.Size) || 0,
                        tracker: r.Tracker || 'Jackett',
                        quality: qm ? qm[1] : '',
                        hash:    hm ? hm[1].toLowerCase() : '',
                        magnet:  link
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

    /* ============================================================
       PACK MENU (chung cho Jackett / Torrentio / BitSearch)
    ============================================================ */
    function showPackMenu(results, movieTitle, label, card) {
        if (!results || !results.length) {
            Lampa.Noty.show(label + ': Không tìm thấy');
            return;
        }
        var tsUrl = getTsUrl();

        Lampa.Select.show({
            title: '🧲 ' + label + ': ' + movieTitle + ' (' + results.length + ')',
            items: results.map(function (r) {
                var q    = r.quality ? '[' + r.quality + '] ' : '';
                var name = r.title.length > 50 ? r.title.slice(0, 47) + '...' : r.title;
                return {
                    title:    q + name,
                    subtitle: '[' + (r.tracker || label) + ']' +
                              '  👤 ' + r.seeds +
                              (r.peers ? '/' + r.peers : '') +
                              '  💾 ' + r.size,
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
                tsAddAndPickFile(magnet, r.hash, r.title, movieTitle, card, null, null);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       TORRENTIO / AIO
    ============================================================ */
    function buildStreamUrl(type, imdbId, season, episode) {
        var engine = getTorrentEngine();
        var sType  = type === 'series' ? 'series' : 'movie';
        var id     = imdbId;
        if (type === 'series' && season && episode)
            id = imdbId + ':' + season + ':' + episode;

        if (engine === 'aio') {
            var base = getAioUrl();
            return base ? base + '/stream/' + sType + '/' + id + '.json' : null;
        }
        var cfg  = getTioConfig();
        var base = TORRENTIO_BASE + (cfg ? '/' + cfg : '');
        return base + '/stream/' + sType + '/' + id + '.json';
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
        if (!streams || !streams.length) {
            Lampa.Noty.show('Không tìm thấy torrent');
            return;
        }
        var tsUrl  = getTsUrl();
        var label  = getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio';
        var parsed = streams.map(parseStream)
            .filter(function (s) { return s.hash; })
            .sort(function (a, b) { return b.sizeNum - a.sizeNum; });

        Lampa.Select.show({
            title: '🧲 ' + label + ': ' + movieTitle + ' (' + parsed.length + ')',
            items: parsed.map(function (s) {
                return {
                    title:    '[' + s.tracker + '] ' + s.title,
                    subtitle: (s.seeds ? '👤 ' + s.seeds + '  ' : '') +
                              (s.size  ? '💾 ' + s.size : ''),
                    s: s
                };
            }),
            onSelect: function (item) {
                var s = item.s;
                if (tsUrl && s.hash) {
                    var name = encodeURIComponent(movieTitle);
                    tsAdd(s.magnet, movieTitle, function (hash) {
                        var h   = hash || s.hash;
                        var url = tsUrl + '/stream/' + name +
                                  '?link=' + h + '&index=' + s.fileIdx + '&play';
                        doPlay({
                            url:     url,
                            title:   movieTitle,
                            card:    card,
                            episode: (season && episode)
                                ? { season: season, episode: episode }
                                : null
                        });
                    }, function () {
                        var url = tsUrl + '/stream/' + encodeURIComponent(movieTitle) +
                                  '?link=' + s.hash + '&index=' + s.fileIdx + '&play';
                        doPlay({ url: url, title: movieTitle, card: card });
                    });
                } else if (s.url) {
                    doPlay({
                        url:     s.url,
                        title:   movieTitle,
                        card:    card,
                        episode: (season && episode)
                            ? { season: season, episode: episode } : null
                    });
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
            if (!url) {
                Lampa.Noty.show(
                    getTorrentEngine() === 'aio' ? 'Chưa cấu hình AIO!' : 'Lỗi config'
                );
                return;
            }
            fetchStreams(url, function (streams) {
                var epLabel = (season && episode)
                    ? ' S' + padZero(season) + 'E' + padZero(episode) : '';
                showStreamsMenu(streams, title + epLabel, card, season, episode);
            });
        }

        if (imdbId) { run(imdbId); return; }

        reguest(
            'https://api.themoviedb.org/3/' +
            (type === 'series' ? 'tv' : 'movie') + '/' + card.id +
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
            var s = card.seasons.filter(function (x) {
                return x.season_number === season;
            })[0];
            if (s && s.episode_count) return s.episode_count;
        }
        return 50;
    }

    function askTorrentTV(card) {
        var total = card.number_of_seasons || 1;

        function pickEp(s) {
            var totalEps = getSeasonEpCount(card, s);
            var ee = [];
            for (var e = 1; e <= totalEps; e++) {
                var tc    = loadTimecode(card, s, e);
                var badge = '';
                if (tc && tc.percent > 0 && tc.percent < 100) {
                    badge = ' ▶ ' + tc.percent + '%';
                } else if (tc && tc.percent >= 100) {
                    badge = ' ✅';
                }
                ee.push({ title: 'S' + padZero(s) + 'E' + padZero(e) + badge, s: s, e: e });
            }
            Lampa.Select.show({
                title:    'Season ' + s + ' — Chọn tập',
                items:    ee,
                onSelect: function (item) { searchTorrent(card, item.s, item.e); },
                onBack:   function ()     { Lampa.Controller.toggle('full'); }
            });
        }

        if (total === 1) { pickEp(1); return; }

        var ss = [];
        for (var s = 1; s <= total; s++) {
            ss.push({
                title: 'Season ' + s + ' (' + getSeasonEpCount(card, s) + ' tập)',
                s: s
            });
        }
        Lampa.Select.show({
            title:    'Chọn Season',
            items:    ss,
            onSelect: function (item) { pickEp(item.s); },
            onBack:   function ()     { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       SETTINGS
    ============================================================ */
    function initSettings() {
        if (Lampa.SettingsApi && Lampa.SettingsApi.addComponent) {
            Lampa.SettingsApi.addComponent({
                component: 'kkparser',
                name:      'KKPhim Parser',
                icon: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24">' +
                      '<rect x="2" y="2" width="20" height="20" rx="3" ' +
                      'stroke="currentColor" stroke-width="1.5"/>' +
                      '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/>' +
                      '</svg>'
            });
            setTimeout(buildSettings, 200);
        }
    }

    function buildSettings() {
        if (!Lampa.SettingsApi) return;

        var params = [
            /* --- TorrServer --- */
            {
                name: STG_PREFIX + 'torrserver_url',
                type: 'input',
                field: { name: 'Địa chỉ TorrServer', description: 'VD: 192.168.1.100:8090' }
            },
            {
                name: STG_PREFIX + 'torrserver_pass',
                type: 'input',
                field: { name: 'Mật khẩu TorrServer', description: 'Để trống nếu không có' }
            },
            {
                name: STG_PREFIX + 'test_torrserver',
                type: 'button',
                field: { name: '🧪 Test TorrServer', description: 'Kiểm tra kết nối' },
                onChange: function () {
                    var url = getTsUrl();
                    if (!url) { Lampa.Noty.show('Chưa nhập địa chỉ!'); return; }
                    Lampa.Noty.show('Đang test...');
                    $.ajax({
                        url: url + '/echo', type: 'GET', timeout: 5000,
                        success: function ()    { Lampa.Noty.show('✅ TorrServer OK!'); },
                        error:   function (xhr) {
                            Lampa.Noty.show(
                                xhr.status === 200
                                    ? '✅ OK!'
                                    : '❌ HTTP ' + (xhr.status || 'timeout')
                            );
                        }
                    });
                }
            },
            /* --- Torrent engine --- */
            {
                name:    STG_PREFIX + 'torrent_engine',
                type:    'select',
                values:  { torrentio: 'Torrentio', aio: 'AIOStreams' },
                default: 'torrentio',
                field:   { name: 'Engine Torrent', description: 'Torrentio hoặc AIOStreams' }
            },
            {
                name: STG_PREFIX + 'torrentio_config',
                type: 'input',
                field: { name: 'Torrentio Config', description: 'Link manifest hoặc để trống' }
            },
            {
                name: STG_PREFIX + 'aio_url',
                type: 'input',
                field: { name: 'AIOStreams URL', description: 'URL manifest AIO' }
            },
            /* --- Jackett --- */
            {
                name: STG_PREFIX + 'jackett_url',
                type: 'input',
                field: { name: 'Jackett Server', description: 'VD: https://jac.red' }
            },
            {
                name: STG_PREFIX + 'jackett_key',
                type: 'input',
                field: { name: 'Jackett API Key', description: 'API Key từ tài khoản Jackett' }
            },
            {
                name: STG_PREFIX + 'test_jackett',
                type: 'button',
                field: { name: '🧪 Test Jackett', description: 'Kiểm tra kết nối' },
                onChange: function () {
                    var url = getJackettUrl(), key = getJackettKey();
                    if (!url) { Lampa.Noty.show('Chưa nhập URL!'); return; }
                    if (!key) { Lampa.Noty.show('Chưa nhập Key!'); return; }
                    Lampa.Noty.show('Đang test...');
                    reguest(
                        url + '/api/v2.0/indexers/all/results?apikey=' + key + '&Query=test',
                        function () { Lampa.Noty.show('✅ Jackett OK!'); },
                        function (e) { Lampa.Noty.show('❌ Lỗi: ' + e); }
                    );
                }
            },
            /* --- BitSearch --- */
            {
                name: STG_PREFIX + 'bitsearch_proxy',
                type: 'input',
                field: {
                    name:        'BitSearch Proxy URL',
                    description: 'Mặc định: https://bitsearch.to (để trống dùng mặc định)'
                }
            },
            {
                name: STG_PREFIX + 'test_bitsearch',
                type: 'button',
                field: { name: '🧪 Test BitSearch', description: 'Kiểm tra kết nối' },
                onChange: function () {
                    var proxy = getBitSearchProxy();
                    Lampa.Noty.show('Đang test ' + proxy + ' ...');
                    reguest(
                        proxy + '/api/v1/search?q=test&sort=seeders',
                        function (d) {
                            var raw  = typeof d === 'string' ? JSON.parse(d) : d;
                            var list = (raw && raw.data) ? raw.data : [];
                            Lampa.Noty.show('✅ BitSearch OK! (' + list.length + ' kết quả)');
                        },
                        function (e) { Lampa.Noty.show('❌ Lỗi: ' + e); }
                    );
                }
            }
        ];

        params.forEach(function (p) {
            Lampa.SettingsApi.addParam({
                component: 'kkparser',
                param: {
                    name:    p.name,
                    type:    p.type,
                    values:  p.values  || '',
                    default: p.default || ''
                },
                field:    p.field,
                onChange: p.onChange || function (value) {
                    Lampa.Storage.set(p.name, value);
                }
            });
        });
    }

    /* ============================================================
       HOOK + MENU BUTTONS
    ============================================================ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        var card = e.data && e.data.movie
                   ? e.data.movie
                   : (e.object && e.object.card);
        if (!card) return;

        var $ctx = e.object && e.object.activity
                   ? e.object.activity.render()
                   : (e.object && e.object.render
                      ? e.object.render()
                      : $('body'));

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

        // KKPhim button
        var $kk = mkBtn('view--kkphim',
            '<rect x="2" y="2" width="20" height="20" rx="3"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'KKPhim',
            function () { searchAndPlay('kkphim', card); }
        );

        // OPhim button
        var $op = mkBtn('view--ophim',
            '<circle cx="12" cy="12" r="10"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'OPhim',
            function () { searchAndPlay('ophim', card); }
        );

        // Torrentio/AIO button
        var $tr = mkBtn('view--kkparser-torrent',
            '<circle cx="12" cy="12" r="10"/>' +
            '<polyline points="8 12 12 16 16 12"/>' +
            '<line x1="12" y1="8" x2="12" y2="16"/>',
            getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio',
            function () {
                if (isSeries) askTorrentTV(card);
                else searchTorrent(card, null, null);
            }
        );

        // Jackett button
        var $jk = mkBtn('view--kkparser-jackett',
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>',
            'Jackett',
            function () { searchJackett(card); }
        );

        // BitSearch button — mới
        var $bs = mkBtn('view--kkparser-bitsearch',
            '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
            '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
            '<line x1="12" y1="22.08" x2="12" y2="12"/>',
            'BitSearch',
            function () { searchBitSearch(card); }
        );

        // Chèn buttons vào UI
        var $anchor = $ctx.find('.view--torrent');
        if ($anchor.length) {
            // Chèn sau button torrent có sẵn của Lampa
            $anchor.after($bs).after($jk).after($tr).after($op).after($kk);
        } else {
            $ctx.find('.full-start__buttons')
                .append($kk).append($op).append($tr).append($jk).append($bs);
        }
    });

    /* ============================================================
       START
    ============================================================ */
    function start() {
        initSettings();
        console.log('[KKPhim Parser] v2.0.0 — BitSearch + Timecode Fix ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });

})();