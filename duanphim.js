(function () {
    'use strict';

    if (window.plugin_kkphim_parser_ready) return;
    window.plugin_kkphim_parser_ready = true;

    var PLUGIN_NAME = 'KKPhim Parser';
    var STG_PREFIX  = 'kkparser_';
    var TMDB_API_KEY = '4ef0d7355d9ffb5151e987764708ce96';
    var TORRENTIO_BASE = 'https://torrentio.strem.fun';

    var SOURCES = {
        kkphim: { name: 'KKPhim', api: 'https://phimapi.com/' },
        ophim:  { name: 'OPhim',  api: 'https://ophim1.com/' }
    };

    var romajiCache = {};

    /* ════════════════════════════════════════════════════════════
       STORAGE
    ════════════════════════════════════════════════════════════ */
    function getSetting(key)      { return Lampa.Storage.get(STG_PREFIX + key, ''); }
    function setSetting(key, val) { Lampa.Storage.set(STG_PREFIX + key, val); }

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
    function getTioConfigUrl()  { return getSetting('torrentio_config') || ''; }
    function getJackettUrl() {
        var url = getSetting('jackett_url') || '';
        if (!url) return '';
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        return url;
    }
    function getJackettKey() { return getSetting('jackett_key') || ''; }

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
            return raw;
        }
        return raw.replace(/^\/+|\/+$/g, '');
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
            '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce');
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

    /* ════════════════════════════════════════════════════════════
       KKPHIM/OPHIM HELPERS
    ════════════════════════════════════════════════════════════ */
    
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
                        season_num: seasonNum, slug: item.slug, name: item.name || '',
                        origin_name: item.origin_name || '', year: item.year || '', type: item.type || ''
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

                for (var s = 0; s < seasons.length; s++) {
                    var ms = matchScore(seasons[s], title, orig, year);
                    if (ms > 0) score = Math.max(score, ms);
                }

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
       ANIME ROMAJI SUPPORT + TRIM LAST 2 CHARS
    ════════════════════════════════════════════════════════════ */
    
    function getAnimeRomaji(card, callback) {
        var cacheKey = 'romaji_' + card.id;
        if (romajiCache[cacheKey]) {
            callback(romajiCache[cacheKey]);
            return;
        }

        var type = getMediaType(card);
        var endpoint = type === 'series' ? 'tv' : 'movie';

        reguest(
            'https://api.themoviedb.org/3/' + endpoint + '/' + card.id +
            '?api_key=' + TMDB_API_KEY + '&append_to_response=alternative_titles,translations',
            function (data) {
                var romaji = extractRomaji(data);
                romajiCache[cacheKey] = romaji;
                callback(romaji);
            },
            function () { callback(null); }
        );
    }

    function extractRomaji(tmdbData) {
        // 1. Alternative titles (JP Latin)
        if (tmdbData.alternative_titles) {
            var titles = tmdbData.alternative_titles.titles || tmdbData.alternative_titles.results || [];
            for (var i = 0; i < titles.length; i++) {
                var t = titles[i];
                if (t.iso_3166_1 === 'JP' && t.title && isLatin(t.title)) {
                    return t.title;
                }
            }
        }

        // 2. Translations (ja)
        if (tmdbData.translations && tmdbData.translations.translations) {
            var trans = tmdbData.translations.translations;
            for (var i = 0; i < trans.length; i++) {
                if (trans[i].iso_639_1 === 'ja' && trans[i].data) {
                    var jaTitle = trans[i].data.title || trans[i].data.name;
                    if (jaTitle && isLatin(jaTitle)) {
                        return jaTitle;
                    }
                }
            }
        }

        // 3. Original title if Latin + Animation
        var orig = tmdbData.original_title || tmdbData.original_name || '';
        if (orig && isLatin(orig) && isAnime(tmdbData)) {
            return orig;
        }

        return null;
    }

    function isLatin(str) {
        if (!str) return false;
        var hasLatin = /[a-zA-Z]/.test(str);
        var hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);
        return hasLatin && !hasJapanese;
    }

    function isAnime(tmdbData) {
        var genres = tmdbData.genres || [];
        for (var i = 0; i < genres.length; i++) {
            if (genres[i].name === 'Animation' || genres[i].id === 16) {
                return true;
            }
        }
        var countries = tmdbData.origin_country || tmdbData.production_countries || [];
        if (typeof countries === 'string') countries = [countries];
        for (var i = 0; i < countries.length; i++) {
            var c = countries[i];
            if (c === 'JP' || (c.iso_3166_1 && c.iso_3166_1 === 'JP')) {
                return true;
            }
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════
    // 🎯 CÔNG THỨC KỲ DỊ: BỎ 2 KÝ TỰ CUỐI
    // ═══════════════════════════════════════════════════════════
    function trimLast2Chars(str) {
        if (!str || str.length <= 2) return str;
        return str.slice(0, -2);
    }

    /* ════════════════════════════════════════════════════════════
       BUTTON ACTIONS - KKPhim/OPhim
    ════════════════════════════════════════════════════════════ */
    
    function searchAndPlay(sourceKey, card) {
        var source = SOURCES[sourceKey];
        if (!source) return;

        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);

        Lampa.Noty.show(source.name + ': đang tìm...');

        findAllSeasons(source, title, title, orig, year, function (result) {
            if (!result || !result.seasons || !result.seasons.length) {
                Lampa.Noty.show(source.name + ': không tìm thấy');
                return;
            }
            showSeasonMenu(source, result, card);
        });
    }

    function showSeasonMenu(source, result, card) {
        var seasons = result.seasons;
        var movieName = result.movie_name;

        if (seasons.length === 1) {
            Lampa.Noty.show('Đang tải ' + seasons[0].name + '...');
            loadSeasonEpisodes(source, seasons[0], card, movieName);
            return;
        }

        Lampa.Select.show({
            title: '📺 ' + movieName + ' — ' + seasons.length + ' Season',
            items: seasons.map(function (s) {
                return {
                    title: 'Season ' + s.season_num + ': ' + s.name,
                    subtitle: s.year ? 'Năm: ' + s.year : '',
                    season: s
                };
            }),
            onSelect: function (item) {
                Lampa.Noty.show('Đang tải ' + item.season.name + '...');
                loadSeasonEpisodes(source, item.season, card, movieName);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function loadSeasonEpisodes(source, season, card, movieTitle) {
        fetchDetail(source, season.slug, function (data) {
            var eps = data.episodes || [];
            if (!eps.length) {
                Lampa.Noty.show('Không có tập phim');
                return;
            }
            playEpisode(card, eps, season.season_num, movieTitle, season.name);
        });
    }

    function playEpisode(card, episodes, seasonNum, movieTitle, seasonName) {
        var displayTitle = seasonName || movieTitle;

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

    /* ════════════════════════════════════════════════════════════
       BUTTON ACTIONS - Jackett (WITH TRIM LAST 2 CHARS)
    ════════════════════════════════════════════════════════════ */
    
    function searchJackett(card) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url || !key) {
            Lampa.Noty.show('❌ Chưa cấu hình Jackett!');
            return;
        }

        Lampa.Noty.show('🔍 Jackett: đang tìm...');

        getAnimeRomaji(card, function (romaji) {
            var title = card.title || card.name || '';
            var orig  = card.original_title || card.original_name || '';
            var year  = (card.release_date || card.first_air_date || '').slice(0, 4);

            var searchTerms = [];
            
            // 🎯 Ưu tiên #1: Romaji bỏ 2 ký tự cuối
            if (romaji) {
                var trimmedRomaji = trimLast2Chars(romaji);
                searchTerms.push(trimmedRomaji + (year ? ' ' + year : ''));
                console.log('[Jackett] 🎌 Tìm bằng romaji trimmed: "' + trimmedRomaji + '"');
            }
            
            // 🎯 Ưu tiên #2: Tiếng Anh bỏ 2 ký tự cuối
            if (title) {
                var trimmedTitle = trimLast2Chars(title);
                if (trimmedTitle !== (romaji ? trimLast2Chars(romaji) : '')) {
                    searchTerms.push(trimmedTitle + (year ? ' ' + year : ''));
                    console.log('[Jackett] 📝 Tìm bằng title trimmed: "' + trimmedTitle + '"');
                }
            }
            
            // Backup: Original title bỏ 2 ký tự cuối
            if (orig && orig !== title && orig !== romaji) {
                var trimmedOrig = trimLast2Chars(orig);
                searchTerms.push(trimmedOrig + (year ? ' ' + year : ''));
            }

            if (!searchTerms.length) {
                searchTerms.push(trimLast2Chars(title || orig) + (year ? ' ' + year : ''));
            }

            searchJackettMultipleTerms(searchTerms, 0, [], card, function (allResults) {
                if (!allResults || !allResults.length) {
                    Lampa.Noty.show('❌ Không tìm thấy');
                    return;
                }
                var displayTitle = romaji ? title + ' (' + romaji + ')' : title;
                showPackMenu(allResults, displayTitle, 'Jackett', card);
            });
        });
    }

    function searchJackettMultipleTerms(terms, index, accumulated, card, callback) {
        if (index >= terms.length) {
            callback(accumulated);
            return;
        }

        var term = terms[index];
        
        fetchJackettResultsByQuery(term, function (results) {
            results.forEach(function (r) {
                var exists = accumulated.some(function (a) {
                    return a.hash === r.hash || a.title === r.title;
                });
                if (!exists) {
                    accumulated.push(r);
                }
            });

            if (accumulated.length >= 15) {
                callback(accumulated);
            } else {
                searchJackettMultipleTerms(terms, index + 1, accumulated, card, callback);
            }
        });
    }

    function fetchJackettResultsByQuery(query, callback) {
        var url = getJackettUrl(), key = getJackettKey();
        
        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' + 
            encodeURIComponent(key) +
            '&Query=' + encodeURIComponent(query) + 
            '&Category[]=2000&Category[]=5000&Category[]=5070',
            function (data) {
                var d = typeof data === 'string' ? JSON.parse(data) : data;
                if (!d || !d.Results || !Array.isArray(d.Results)) {
                    callback([]);
                    return;
                }

                var results = d.Results.map(function (r) {
                    var link = r.MagnetUri || r.Link || '';
                    if (!link) return null;
                    
                    var hm = link.match(/btih:([a-f0-9]+)/i);
                    var hash = hm ? hm[1].toLowerCase() : '';
                    if (!hash && !link.startsWith('http')) return null;
                    
                    var qm = (r.Title || '').match(/\b(2160p|4K|1080p|720p|480p)\b/i);
                    var quality = qm ? qm[1] : '';
                    
                    var size = parseInt(r.Size) || 0;
                    var seeds = parseInt(r.Seeders) || 0;
                    
                    return {
                        title: r.Title || 'Unknown',
                        quality: quality,
                        info: (seeds ? '👤 ' + seeds + '  ' : '') + '💾 ' + fmtBytes(size),
                        size: size,
                        seeds: seeds,
                        hash: hash,
                        magnet: link,
                        tracker: r.Tracker || 'Jackett'
                    };
                }).filter(Boolean);

                results.sort(function (a, b) { 
                    if (b.seeds !== a.seeds) return b.seeds - a.seeds;
                    return b.size - a.size; 
                });
                
                callback(results);
            },
            function () { callback([]); }
        );
    }

    function showPackMenu(results, movieTitle, label, card) {
        if (!results || !results.length) {
            Lampa.Noty.show(label + ': Không tìm thấy');
            return;
        }

        var tsUrl = getTsUrl();
        if (!tsUrl) {
            Lampa.Noty.show('❌ Chưa cấu hình TorrServer!');
            return;
        }

        Lampa.Select.show({
            title: '🧲 ' + label + ': ' + movieTitle + ' (' + results.length + ')',
            items: results.map(function (r) {
                return {
                    title: '[' + (r.tracker || label) + ']' + (r.quality ? ' ' + r.quality : '') + ' — ' + r.title,
                    subtitle: r.info || '',
                    r: r
                };
            }),
            onSelect: function (item) {
                var r = item.r;
                if (!r.magnet && !r.hash) {
                    Lampa.Noty.show('❌ Không có magnet link');
                    return;
                }
                var magnet = r.magnet || makeMagnet(r.hash, r.title);
                tsAddAndPickFile(magnet, r.hash, r.title, movieTitle, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ════════════════════════════════════════════════════════════
       BUTTON ACTIONS - Torrentio/AIO
    ════════════════════════════════════════════════════════════ */
    
    function searchTorrent(card, season, episode) {
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);

        Lampa.Noty.show('🔍 Đang tìm torrent...');

        function run(id) {
            fetchTorrentioResults(card, function (results) {
                var epLabel = (season && episode) ? ' S' + padZero(season) + 'E' + padZero(episode) : '';
                showStreamsMenu(results, title + epLabel, card);
            });
        }

        if (imdbId) {
            run(imdbId);
        } else {
            reguest(
                'https://api.themoviedb.org/3/' + (type === 'series' ? 'tv' : 'movie') + '/' + card.id +
                '/external_ids?api_key=' + TMDB_API_KEY,
                function (d) {
                    var id = d && d.imdb_id;
                    if (id) {
                        card.imdb_id = id;
                        run(id);
                    } else {
                        Lampa.Noty.show('❌ Không tìm thấy IMDB ID');
                    }
                },
                function () { Lampa.Noty.show('❌ Lỗi lấy IMDB ID'); }
            );
        }
    }

    function showStreamsMenu(results, movieTitle, card) {
        if (!results || !results.length) {
            Lampa.Noty.show('❌ Không tìm thấy torrent');
            return;
        }

        var tsUrl = getTsUrl();
        if (!tsUrl) {
            Lampa.Noty.show('❌ Chưa cấu hình TorrServer!');
            return;
        }

        var engine = getTorrentEngine();
        var label = engine === 'aio' ? 'AIOStreams' : 'Torrentio';

        Lampa.Select.show({
            title: '🧲 ' + label + ': ' + movieTitle + ' (' + results.length + ')',
            items: results.map(function (r) {
                var qualityBadge = r.quality ? '[' + r.quality + '] ' : '';
                return {
                    title: qualityBadge + r.title,
                    subtitle: r.info || '',
                    r: r
                };
            }),
            onSelect: function (item) {
                var r = item.r;
                if (!r.hash) {
                    Lampa.Noty.show('❌ Không có hash');
                    return;
                }
                var magnet = makeMagnet(r.hash, r.title);
                tsAddAndPickFile(magnet, r.hash, r.title, movieTitle, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
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
        for (var s = 1; s <= total; s++) ss.push({ title: 'Season ' + s, s: s });
        Lampa.Select.show({
            title: 'Chọn Season', items: ss,
            onSelect: function (item) { pickEp(item.s); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function fetchTorrentioResults(card, callback) {
        var engine = getTorrentEngine();
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);

        function run(id) {
            var sType = type === 'series' ? 'series' : 'movie';
            var url;
            
            if (engine === 'aio') {
                var base = getAioUrl();
                if (!base) {
                    callback([]);
                    return;
                }
                url = base + '/stream/' + sType + '/' + id + '.json';
            } else {
                var cfg = parseTioConfig(getTioConfigUrl());
                var base2 = TORRENTIO_BASE + (cfg ? '/' + cfg : '');
                url = base2 + '/stream/' + sType + '/' + id + '.json';
            }

            reguest(url,
                function (data) {
                    var streams = (data && data.streams) || [];
                    var results = streams.map(function (st) {
                        var rawTitle = st.title || st.name || '';
                        var lines = rawTitle.split('\n');
                        var name  = lines[0] || '?';
                        var info  = lines[1] || '';
                        
                        var seedM = info.match(/👤\s*(\d+)/);
                        var seeds = seedM ? parseInt(seedM[1]) : 0;
                        
                        var sizeM = info.match(/💾\s*([\d.,]+\s*[TGMK]?B)/i);
                        var sz = sizeM ? sizeM[1].trim() : '';
                        
                        var srcM = info.match(/⚙️\s*([^\s]+)/);
                        var tracker = srcM ? srcM[1] : (engine === 'aio' ? 'AIO' : 'Torrentio');
                        
                        var qualityM = name.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);
                        var quality = qualityM ? qualityM[1] : '';
                        
                        var hash = (st.infoHash || '').toLowerCase();
                        if (!hash) return null;
                        
                        return {
                            title: name,
                            quality: quality,
                            info: (seeds ? '👤 ' + seeds + '  ' : '') + (sz ? '💾 ' + sz : ''),
                            size: parseSize(sz),
                            seeds: seeds,
                            hash: hash,
                            fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0,
                            tracker: tracker
                        };
                    }).filter(Boolean);

                    results.sort(function (a, b) {
                        if (b.seeds !== a.seeds) return b.seeds - a.seeds;
                        return b.size - a.size;
                    });

                    callback(results);
                },
                function () { callback([]); }
            );
        }

        if (imdbId) {
            run(imdbId);
        } else {
            reguest(
                'https://api.themoviedb.org/3/' + (type === 'series' ? 'tv' : 'movie') + '/' + card.id +
                '/external_ids?api_key=' + TMDB_API_KEY,
                function (d) {
                    var id = d && d.imdb_id;
                    if (id) {
                        card.imdb_id = id;
                        run(id);
                    } else {
                        callback([]);
                    }
                },
                function () { callback([]); }
            );
        }
    }

    /* ════════════════════════════════════════════════════════════
       BUTTON INJECTION
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

    /* ════════════════════════════════════════════════════════════
       SETTINGS
    ════════════════════════════════════════════════════════════ */
    
    function testTorrServerSpeed() {
        var tsUrl = getTsUrl();
        if (!tsUrl) {
            Lampa.Noty.show('❌ Chưa cấu hình TorrServer!');
            return;
        }

        Lampa.Noty.show('🔄 Đang test...');
        var startTime = Date.now();
        
        $.ajax({
            url: tsUrl + '/echo',
            type: 'GET',
            timeout: 5000,
            success: function () {
                var ping = Date.now() - startTime;
                var status = ping < 100 ? '🟢' : ping < 300 ? '🟡' : ping < 500 ? '🟠' : '🔴';
                Lampa.Noty.show('✅ Ping: ' + ping + 'ms ' + status);
            },
            error: function () {
                Lampa.Noty.show('❌ Offline');
            }
        });
    }

    function initSettings() {
        if (Lampa.SettingsApi && Lampa.SettingsApi.addComponent) {
            Lampa.SettingsApi.addComponent({
                component: 'kkparser',
                name: '🎬 ' + PLUGIN_NAME,
                icon: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>'
            });

            setTimeout(function () { buildSettings(); }, 100);
        }
    }

    function buildSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'h1', type: 'title', default: '' },
            field: { name: '════ TORRSERVER ════' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'torrserver_url', type: 'input', values: '', default: '' },
            field: { name: '📡 TorrServer URL', description: 'VD: 192.168.1.100:8090' },
            onChange: function (v) { setSetting('torrserver_url', v); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'torrserver_pass', type: 'input', values: '', default: '' },
            field: { name: '🔑 Password', description: 'Để trống nếu không có' },
            onChange: function (v) { setSetting('torrserver_pass', v); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'test_ts', type: 'button', default: '' },
            field: { name: '⚡ Test Speed' },
            onChange: testTorrServerSpeed
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'h2', type: 'title', default: '' },
            field: { name: '════ TORRENT ENGINE ════' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: {
                name: STG_PREFIX + 'torrent_engine',
                type: 'select',
                values: { 'torrentio': 'Torrentio', 'aio': 'AIOStreams' },
                default: 'torrentio'
            },
            field: { name: '🔧 Engine' },
            onChange: function (v) { setSetting('torrent_engine', v); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'torrentio_config', type: 'input', values: '', default: '' },
            field: { name: '⚙️ Torrentio Config', description: 'Link manifest hoặc config string' },
            onChange: function (v) { setSetting('torrentio_config', v); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'aio_url', type: 'input', values: '', default: '' },
            field: { name: '🔗 AIOStreams URL' },
            onChange: function (v) { setSetting('aio_url', v); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'h3', type: 'title', default: '' },
            field: { name: '════ JACKETT ════' }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'jackett_url', type: 'input', values: '', default: '' },
            field: { name: '🔍 Jackett URL', description: 'VD: https://jac.red' },
            onChange: function (v) { setSetting('jackett_url', v); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'jackett_key', type: 'input', values: '', default: '' },
            field: { name: '🔑 API Key' },
            onChange: function (v) { setSetting('jackett_key', v); }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: { name: STG_PREFIX + 'ver', type: 'static', default: '' },
            field: { name: '📦 Version 3.4.1', description: '🎯 Trim Last 2 Chars Mode' }
        });
    }

    /* ════════════════════════════════════════════════════════════
       START
    ════════════════════════════════════════════════════════════ */
    
    function start() {
        initSettings();
        console.log('[KKPhim Parser] v3.4.1 — 🎯 Trim Last 2 Chars Mode ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();