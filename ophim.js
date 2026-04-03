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
    function escHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

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

    function safeJSON(data) {
        if (typeof data !== 'string') return data;
        try { return JSON.parse(data); } catch (e) { return null; }
    }

    function reguest(url, onOk, onFail) {
        var fail = onFail || function () {};
        try {
            var net = new Lampa.Reguest();
            net.timeout(15000);
            net.silent(url,
                function (data) { onOk(data); },
                function (a, b) {
                    var code = (a && a.status) ? a.status : 0;
                    fail(code ? 'HTTP ' + code : (b || 'Error'));
                }
            );
        } catch (e) { fail(e.message || 'Error'); }
    }

    /* ============================================================
       PLAY
    ============================================================ */
    function doPlay(params) {
        var card    = params.card    || {};
        var url     = params.url     || '';
        var title   = params.title   || card.title || card.name || '';
        var episode = params.episode || null;
        if (!url) { Lampa.Noty.show('Khong co link phat'); return; }
        var obj = { title: title, url: url, poster: card.poster || card.img || '', movie: card };
        if (episode) { obj.season = episode.season; obj.episode = episode.episode; }
        Lampa.Player.play(obj);
        try { if (Lampa.Timeline && Lampa.Timeline.update) Lampa.Timeline.update(card, { percent: 0 }); } catch (e) {}
        try { if (Lampa.Favorite && Lampa.Favorite.add) Lampa.Favorite.add('history', Object.assign({}, card)); } catch (e) {}
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
        if (!tsUrl) { Lampa.Noty.show('Chua cau hinh TorrServer!'); return; }
        $.ajax({
            url: tsUrl + '/torrents', type: 'POST', headers: tsHeaders(),
            data: JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
            dataType: 'json', timeout: 15000,
            success: function (data) { onDone((data && data.hash) || ''); },
            error:   function ()     { if (onFail) onFail(); }
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
                    .filter(function (f) { return /\.(mp4|mkv|avi|mov|webm|ts|m2ts|wmv|flv)$/i.test(f.path || ''); })
                    .sort(function (a, b) { return (a.path || '').localeCompare(b.path || '', undefined, { numeric: true }); });
                onDone(files, data);
            },
            error: function () { onDone([], null); }
        });
    }

    function tsPlayFile(hash, fileId, title, card) {
        var tsUrl = getTsUrl();
        var url   = tsUrl + '/stream/' + encodeURIComponent(title || 'video') + '?link=' + hash + '&index=' + fileId + '&play';
        doPlay({ url: url, title: title, card: card });
    }

    /* ============================================================
       FILE LIST (dùng chung cho Jackett / Knaben)
    ============================================================ */
    function detectEpisode(filename) {
        var patterns = [
            /[Ss]\d+[Ee](\d+)/,
            /[Ee]pisode[\s._-]?(\d+)/i,
            /[Ee]p[\s._-]?(\d+)\b/i,
            /\b[Ee](\d{1,3})\b/,
            /[\s._-](\d{2,3})[\s._-]/
        ];
        for (var i = 0; i < patterns.length; i++) {
            var m = filename.match(patterns[i]);
            if (m) {
                var num = parseInt(m[1]);
                if (num >= 480 && num <= 4320) continue;
                if (num >= 1900 && num <= 2100) continue;
                return num;
            }
        }
        return null;
    }

    function showFileList(files, hash, playTitle, card) {
        if (!files || !files.length) {
            Lampa.Noty.show('Torrent chua co file, thu lai sau vai giay');
            return;
        }
        Lampa.Select.show({
            title: 'Chon file — ' + playTitle,
            items: files.map(function (f) {
                var parts    = (f.path || '').split('/');
                var filename = parts[parts.length - 1] || f.path || 'File';
                var size     = f.length ? fmtBytes(f.length) : '';
                var epNum    = detectEpisode(filename);
                var epLabel  = epNum !== null ? ' [Tap ' + epNum + ']' : '';
                return { title: filename + epLabel, subtitle: size, file: f };
            }),
            onSelect: function (item) {
                var f      = item.file;
                var parts  = (f.path || '').split('/');
                var fname  = parts[parts.length - 1] || '';
                tsPlayFile(hash, f.id !== undefined ? f.id : 0, playTitle + (fname ? ' — ' + fname : ''), card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function tsAddAndPickFile(magnet, hash, torrentTitle, playTitle, card) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chua cau hinh TorrServer!'); return; }
        if (!hash && magnet) {
            var hm = magnet.match(/btih:([a-f0-9]+)/i);
            if (hm) hash = hm[1].toLowerCase();
        }
        Lampa.Noty.show('Dang them vao TorrServer...');

        var cancelled = false, timerId = null, tries = 0, maxTries = 8, finalHash = hash;

        function tryGetFiles() {
            if (cancelled) return;
            tries++;
            tsGetFiles(finalHash, function (files) {
                if (cancelled) return;
                if (!files.length && tries < maxTries) {
                    timerId = setTimeout(tryGetFiles, 2000);
                    return;
                }
                if (!files.length) { Lampa.Noty.show('Khong lay duoc file tu torrent'); return; }
                showFileList(files, finalHash, playTitle, card);
            });
        }

        tsAdd(magnet, torrentTitle, function (returnedHash) {
            if (cancelled) return;
            finalHash = returnedHash || hash;
            if (!finalHash) { Lampa.Noty.show('Khong lay duoc hash'); return; }
            timerId = setTimeout(tryGetFiles, 2000);
        }, function () {
            if (cancelled) return;
            if (finalHash) { timerId = setTimeout(tryGetFiles, 1000); }
            else Lampa.Noty.show('TorrServer loi');
        });

        return function () { cancelled = true; if (timerId) clearTimeout(timerId); };
    }

    /* ============================================================
       KKPHIM / OPHIM
       API trả về:
         episodes = [
           { server_name: "Vietsub #1", server_data: [{name:"1", link_m3u8:...}, ...] },
           { server_name: "Thuyết minh", server_data: [...] }
         ]

       Flow đúng:
         1. Gọi API lấy movie info → có field "seasons" hoặc detect từ episodes
         2. Nếu nhiều season → Chọn Season
         3. Chọn Server (phiên bản)
         4. Chọn Tập
    ============================================================ */
    function searchSource(source, keyword, cb) {
        reguest(
            source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=1',
            function (data) {
                var items = (data && data.data && data.data.items) || (data && data.items) || [];
                cb(items);
            },
            function () { cb([]); }
        );
    }

    function fetchDetail(source, slug, cb) {
        reguest(
            source.api + 'phim/' + slug,
            function (data) {
                // API trả về { movie: {...}, episodes: [...] }
                var movie    = data.movie || data || {};
                var episodes = data.episodes || [];
                cb({ movie: movie, episodes: episodes });
            },
            function () { cb({ movie: {}, episodes: [] }); }
        );
    }

    function matchScore(item, nTitle, nOrig, year) {
        var score = 0;
        var n1 = normalizeStr(item.name || '');
        var n2 = normalizeStr(item.origin_name || '');
        if ((nTitle && (n1 === nTitle || n2 === nTitle)) ||
            (nOrig  && (n1 === nOrig  || n2 === nOrig)))  { score += 100; }
        else if ((nTitle && (n1.indexOf(nTitle) > -1 || nTitle.indexOf(n1) > -1)) ||
                 (nOrig  && (n2.indexOf(nOrig)  > -1 || nOrig.indexOf(n2)  > -1))) { score += 50; }
        if (year && item.year) {
            var diff = Math.abs(parseInt(item.year) - parseInt(year));
            score += diff === 0 ? 30 : diff === 1 ? 15 : 0;
        }
        return score;
    }

    function findBestMatch(items, title, orig, year) {
        if (!items || !items.length) return null;
        var nT = normalizeStr(title), nO = normalizeStr(orig);
        var best = null, bestScore = 0;
        for (var i = 0; i < items.length; i++) {
            var s = matchScore(items[i], nT, nO, year);
            if (s > bestScore) { bestScore = s; best = items[i]; }
        }
        return bestScore > 0 ? best : null;
    }

    function cleanName(name) { return (name || '').replace(/^#+\s*/, '').trim(); }

    /*
      Phân tích episodes để biết có bao nhiêu season.

      KKPhim / OPhim có 2 dạng dữ liệu:
      A) Phim bộ nhiều season: server_name thường là "Season 1","Season 2"
         hoặc tên tập có dạng "S01E01"
      B) Phim bộ 1 season hoặc movie: server_name là "Vietsub","Thuyết minh",...
         tên tập là "1","2","3",...

      Logic:
      - Nhìn vào movie.seasons (nếu API trả về) → số season từ TMDB
      - Nhìn vào server_name: nếu match "season \d" → dùng số đó
      - Nhìn vào tên tập: nếu match S\dE\d → lấy season number
      - Fallback: coi như 1 season
    */
    function detectSeasons(movieInfo, episodes) {
        // Từ movie info (field seasons từ TMDB nếu có)
        if (movieInfo && movieInfo.seasons && Array.isArray(movieInfo.seasons)) {
            var realSeasons = movieInfo.seasons.filter(function (s) { return s.season_number > 0; });
            if (realSeasons.length > 1) {
                return realSeasons.map(function (s) { return s.season_number; });
            }
        }

        // Từ server_name: "Season 1", "Phần 1", "Mùa 1"
        var seasonNums = {};
        episodes.forEach(function (srv) {
            var sname = cleanName(srv.server_name) || '';
            var m = sname.match(/(?:season|phan|mua|part)\s*(\d+)/i);
            if (m) seasonNums[parseInt(m[1])] = true;
        });
        var fromServer = Object.keys(seasonNums).map(Number).sort(function (a, b) { return a - b; });
        if (fromServer.length > 1) return fromServer;

        // Từ tên tập trong server_data: "S01E01", "S02E01"
        var epSeasons = {};
        episodes.forEach(function (srv) {
            (srv.server_data || []).forEach(function (ep) {
                var m2 = (ep.name || '').match(/[Ss](\d+)[Ee]\d+/);
                if (m2) epSeasons[parseInt(m2[1])] = true;
            });
        });
        var fromEp = Object.keys(epSeasons).map(Number).sort(function (a, b) { return a - b; });
        if (fromEp.length > 1) return fromEp;

        // Chỉ có 1 season
        return [1];
    }

    /*
      Lấy tập của một season cụ thể từ một server.
      sn = season number (integer)
      server = { server_name, server_data: [ep,...] }
    */
    function getEpsForSeason(server, sn, totalSeasons) {
        var data = server.server_data || [];
        if (totalSeasons === 1) return data; // 1 season = tất cả tập

        // Server name chứa season number
        var sname = cleanName(server.server_name) || '';
        var sm = sname.match(/(?:season|phan|mua|part)\s*(\d+)/i);
        if (sm) {
            return parseInt(sm[1]) === sn ? data : [];
        }

        // Tên tập chứa season number: S01E01
        var filtered = data.filter(function (ep) {
            var m = (ep.name || '').match(/[Ss](\d+)[Ee]\d+/);
            return m ? parseInt(m[1]) === sn : false;
        });
        if (filtered.length > 0) return filtered;

        // Không có pattern → nếu chỉ match season 1 thì trả về hết
        return sn === 1 ? data : [];
    }

    /*
      ENTRY POINT sau khi có episodes từ API.
      Thứ tự: Season → Server → Tập
    */
    function playEpisode(card, episodes, movieInfo) {
        var title = card.title || card.name || '';

        var servers = (episodes || []).filter(function (srv) {
            return srv.server_data && srv.server_data.length > 0;
        });
        if (!servers.length) { Lampa.Noty.show('Khong co tap phim'); return; }

        var seasonNums = detectSeasons(movieInfo || {}, servers);

        if (seasonNums.length > 1) {
            // BƯỚC 1: Chọn Season
            showSeasonMenu(title, seasonNums, servers, card);
        } else {
            // Chỉ 1 season → bỏ qua bước chọn season
            // BƯỚC 2: Chọn Server
            showServerMenu(title, servers, servers, 1, card);
        }
    }

    /* BƯỚC 1: Chọn Season */
    function showSeasonMenu(title, seasonNums, allServers, card) {
        Lampa.Select.show({
            title: title + ' — Chon Season',
            items: seasonNums.map(function (sn) {
                // Đếm số tập của season này từ server đầu tiên
                var firstServer = allServers[0];
                var eps = getEpsForSeason(firstServer, sn, seasonNums.length);
                return {
                    title:    'Season ' + sn,
                    subtitle: eps.length ? eps.length + ' tap' : '',
                    sn:       sn
                };
            }),
            onSelect: function (item) {
                // Sau khi chọn season → lọc server theo season → Chọn Server
                var serversForSeason = allServers.filter(function (srv) {
                    return getEpsForSeason(srv, item.sn, seasonNums.length).length > 0;
                });
                showServerMenu(title + ' · Season ' + item.sn, allServers, serversForSeason, item.sn, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* BƯỚC 2: Chọn Server/Phiên bản */
    function showServerMenu(title, allServers, serversForSeason, sn, card) {
        if (!serversForSeason || !serversForSeason.length) {
            Lampa.Noty.show('Khong co phien ban cho season nay');
            return;
        }
        // Nếu chỉ 1 server → skip, thẳng tới chọn tập
        if (serversForSeason.length === 1) {
            var eps = getEpsForSeason(serversForSeason[0], sn, allServers.length > 1 ? 2 : 1);
            showEpisodeMenu(title, serversForSeason[0], eps, sn, card);
            return;
        }

        Lampa.Select.show({
            title: title + ' — Chon phien ban',
            items: serversForSeason.map(function (srv, idx) {
                var name  = cleanName(srv.server_name) || ('Phien ban ' + (idx + 1));
                var eps   = getEpsForSeason(srv, sn, allServers.length > 1 ? 2 : 1);
                return { title: name, subtitle: eps.length + ' tap', srv: srv };
            }),
            onSelect: function (item) {
                var eps = getEpsForSeason(item.srv, sn, allServers.length > 1 ? 2 : 1);
                showEpisodeMenu(title, item.srv, eps, sn, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* BƯỚC 3: Chọn Tập */
    function showEpisodeMenu(title, serverData, eps, sn, card) {
        var srvName   = cleanName(serverData.server_name);
        var menuTitle = title + (srvName ? ' · ' + srvName : '');

        if (!eps || !eps.length) { Lampa.Noty.show('Khong co tap'); return; }

        var playlist = eps.map(function (ep, idx) {
            return {
                title:   menuTitle + ' — ' + (ep.name || ('Tap ' + (idx + 1))),
                url:     ep.link_m3u8 || ep.link_embed || '',
                movie:   card,
                season:  sn || 1,
                episode: idx + 1
            };
        });

        Lampa.Select.show({
            title: menuTitle + ' (' + eps.length + ' tap)',
            items: eps.map(function (ep, idx) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                return { title: ep.name || ('Tap ' + (idx + 1)), subtitle: link ? '' : 'Khong co link', ep: ep, idx: idx };
            }),
            onSelect: function (item) {
                var link = item.ep.link_m3u8 || item.ep.link_embed || '';
                if (!link) { Lampa.Noty.show('Khong co link phat'); return; }
                doPlay({
                    url: link, title: menuTitle + ' — ' + (item.ep.name || ('Tap ' + (item.idx + 1))),
                    card: card, episode: { season: sn || 1, episode: item.idx + 1 }
                });
                try { Lampa.Player.playlist(playlist, item.idx); } catch (e) {}
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function searchAndPlay(sourceKey, card) {
        var source = SOURCES[sourceKey];
        if (!source) return;
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        Lampa.Noty.show(source.name + ': dang tim...');

        var terms = [];
        if (orig) terms.push(orig);
        if (title && title !== orig) terms.push(title);
        if (!terms.length) terms.push(title);
        var tried = 0;

        function tryNext() {
            if (tried >= terms.length) {
                searchSource(source, terms[0], function (all) { showManualSelect(source, all, card); });
                return;
            }
            searchSource(source, terms[tried], function (items) {
                var best = findBestMatch(items, title, orig, year);
                if (best && best.slug) { loadAndPlay(source, best.slug, card); }
                else { tried++; tryNext(); }
            });
        }
        tryNext();
    }

    function showManualSelect(source, items, card) {
        if (!items || !items.length) { Lampa.Noty.show('Khong tim thay tren ' + source.name); return; }
        Lampa.Select.show({
            title: source.name + ' — Ket qua tim kiem',
            items: items.map(function (it) {
                return {
                    title:    (it.name || '') + (it.origin_name ? ' (' + it.origin_name + ')' : ''),
                    subtitle: it.year ? 'Nam: ' + it.year : '',
                    slug:     it.slug
                };
            }),
            onSelect: function (item) { if (item.slug) loadAndPlay(source, item.slug, card); },
            onBack:   function ()      { Lampa.Controller.toggle('full'); }
        });
    }

    function loadAndPlay(source, slug, card) {
        Lampa.Noty.show('Dang tai thong tin phim...');
        fetchDetail(source, slug, function (data) {
            var eps = data.episodes || [];
            if (!eps.length) { Lampa.Noty.show('Khong co tap phim'); return; }
            // Truyền movie info để detect season từ TMDB data
            playEpisode(card, eps, data.movie);
        });
    }

    /* ============================================================
       JACKETT
    ============================================================ */
    function fetchJackett(query, cb) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url) { Lampa.Noty.show('Chua cau hinh Jackett!'); cb([]); return; }
        if (!key) { Lampa.Noty.show('Chua nhap API Key!');     cb([]); return; }
        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(key) +
            '&Query=' + encodeURIComponent(query) + '&Category[]=2000&Category[]=5000',
            function (data) {
                var d = safeJSON(data);
                if (!d) { cb([]); return; }
                var results = ((d.Results) || []).map(function (r) {
                    var link = r.MagnetUri || r.Link || '';
                    if (!link) return null;
                    var hm = link.match(/btih:([a-f0-9]+)/i);
                    var qm = (r.Title || '').match(/\b(2160p|4K|UHD|1080p|720p|480p|BluRay|WEB-?DL|HDRip)\b/i);
                    return {
                        title: r.Title || '', seeds: parseInt(r.Seeders) || 0, peers: parseInt(r.Peers) || 0,
                        size: fmtBytes(parseInt(r.Size) || 0), sizeNum: parseInt(r.Size) || 0,
                        tracker: r.Tracker || 'Jackett', quality: qm ? qm[1] : '',
                        hash: hm ? hm[1].toLowerCase() : '', magnet: link
                    };
                }).filter(Boolean).sort(function (a, b) {
                    return b.seeds !== a.seeds ? b.seeds - a.seeds : b.sizeNum - a.sizeNum;
                });
                cb(results);
            },
            function (e) { Lampa.Noty.show('Jackett loi: ' + e); cb([]); }
        );
    }

    function searchJackett(card) {
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query = (orig || title) + (year ? ' ' + year : '');
        Lampa.Noty.show('Jackett: dang tim...');
        fetchJackett(query, function (r) {
            if (!r.length && orig && orig !== title) {
                fetchJackett(title + (year ? ' ' + year : ''), function (r2) { showTorrentMenu(r2, title, 'Jackett', card); });
            } else { showTorrentMenu(r, title, 'Jackett', card); }
        });
    }

    /* ============================================================
       KNABEN
    ============================================================ */
    function fetchKnaben(query, isTV, cb) {
        var cat = isTV ? '300000' : '200000';
        reguest(
            'https://knaben.eu/api/v1/?search=' + encodeURIComponent(query) +
            '&categories[]=' + cat + '&orderBy=seeders&sort=desc&size=30',
            function (data) {
                var d = safeJSON(data);
                if (!d) { cb([]); return; }
                var raw = [];
                if (Array.isArray(d)) raw = d;
                else if (d.hits && Array.isArray(d.hits.hits)) raw = d.hits.hits;
                else if (Array.isArray(d.hits))    raw = d.hits;
                else if (Array.isArray(d.data))    raw = d.data;
                else if (Array.isArray(d.results)) raw = d.results;

                var results = raw.map(function (r) {
                    var src    = r._source || r;
                    var hash   = (src.infoHash || src.info_hash || src.hash || '').toLowerCase();
                    var title2 = src.title || src.name || '';
                    var size   = parseInt(src.size || src.contentLength || src.bytes || 0);
                    var magnet = src.magnetUrl || src.magnet || '';
                    if (!magnet && hash) magnet = makeMagnet(hash, title2);
                    if (!magnet) return null;
                    if (!hash && magnet) { var hm2 = magnet.match(/btih:([a-f0-9]+)/i); if (hm2) hash = hm2[1].toLowerCase(); }
                    var qm = title2.match(/\b(2160p|4K|UHD|1080p|720p|480p|BluRay|WEB-?DL|HDRip|HDTV)\b/i);
                    return {
                        title: title2, seeds: parseInt(src.seeders || src.seeds || 0),
                        peers: parseInt(src.leechers || src.peers || 0),
                        size: fmtBytes(size), sizeNum: size,
                        tracker: src.indexer || src.tracker || src.source || 'Knaben',
                        quality: qm ? qm[1] : '', hash: hash, magnet: magnet
                    };
                }).filter(Boolean).sort(function (a, b) {
                    return b.seeds !== a.seeds ? b.seeds - a.seeds : b.sizeNum - a.sizeNum;
                });
                cb(results);
            },
            function (e) { Lampa.Noty.show('Knaben loi: ' + e); cb([]); }
        );
    }

    function searchKnaben(card) {
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var isTV  = getMediaType(card) === 'series';
        var q1    = (orig || title) + (year ? ' ' + year : '');
        var q2    = (orig && orig !== title) ? title + (year ? ' ' + year : '') : '';
        Lampa.Noty.show('Knaben: dang tim...');
        fetchKnaben(q1, isTV, function (r) {
            if (!r.length && q2) {
                fetchKnaben(q2, isTV, function (r2) { showTorrentMenu(r2, title, 'Knaben', card); });
            } else { showTorrentMenu(r, title, 'Knaben', card); }
        });
    }

    /* ============================================================
       TORRENT MENU — Chọn torrent → File list → Phát
    ============================================================ */
    function showTorrentMenu(results, movieTitle, label, card) {
        if (!results || !results.length) { Lampa.Noty.show(label + ': Khong tim thay'); return; }
        var tsUrl = getTsUrl();
        Lampa.Select.show({
            title: label + ' — ' + movieTitle + ' (' + results.length + ')',
            items: results.map(function (r) {
                var qual = r.quality ? '[' + r.quality + '] ' : '';
                var src  = '[' + (r.tracker || label) + '] ';
                var name = r.title.length > 48 ? r.title.slice(0, 45) + '...' : r.title;
                return { title: src + qual + name, subtitle: 'Seeds: ' + r.seeds + '  Size: ' + r.size, r: r };
            }),
            onSelect: function (item) {
                var r = item.r;
                if (!tsUrl) { Lampa.Noty.show('Chua cau hinh TorrServer!'); return; }
                if (!r.magnet && !r.hash) { Lampa.Noty.show('Khong co magnet'); return; }
                tsAddAndPickFile(r.magnet || makeMagnet(r.hash, r.title), r.hash, r.title, movieTitle, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       TORRENTIO / AIO
    ============================================================ */
    function buildStreamUrl(type, imdbId, season, episode) {
        var sType = type === 'series' ? 'series' : 'movie';
        var id    = (type === 'series' && season && episode) ? imdbId + ':' + season + ':' + episode : imdbId;
        if (getTorrentEngine() === 'aio') {
            var base = getAioUrl();
            return base ? base + '/stream/' + sType + '/' + id + '.json' : null;
        }
        var cfg = getTioConfig();
        return TORRENTIO_BASE + (cfg ? '/' + cfg : '') + '/stream/' + sType + '/' + id + '.json';
    }

    function fetchStreams(url, cb) {
        reguest(url,
            function (data) { cb((data && data.streams) || []); },
            function (e)    { Lampa.Noty.show('Loi torrent: ' + e); cb([]); }
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
            title: name, hash: (st.infoHash || '').toLowerCase(),
            fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0,
            url: st.url || '', size: sz, sizeNum: parseSize(sz),
            seeds: seedM ? parseInt(seedM[1]) : 0,
            tracker: srcM ? srcM[1] : 'Torrentio',
            magnet: st.infoHash ? makeMagnet(st.infoHash, name) : ''
        };
    }

    function showStreamsMenu(streams, movieTitle, card, season, episode) {
        if (!streams || !streams.length) { Lampa.Noty.show('Khong tim thay torrent'); return; }
        var tsUrl  = getTsUrl();
        var label  = getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio';
        var parsed = streams.map(parseStream)
            .filter(function (s) { return s.hash; })
            .sort(function (a, b) { return b.sizeNum - a.sizeNum; });
        if (!parsed.length) { Lampa.Noty.show('Khong co torrent hop le'); return; }

        Lampa.Select.show({
            title: label + ' — ' + movieTitle + ' (' + parsed.length + ')',
            items: parsed.map(function (s) {
                return {
                    title:    '[' + s.tracker + '] ' + s.title,
                    subtitle: (s.seeds ? 'Seeds: ' + s.seeds + '  ' : '') + (s.size ? 'Size: ' + s.size : ''),
                    s:        s
                };
            }),
            onSelect: function (item) {
                var s = item.s;
                if (tsUrl && s.hash) {
                    var name = encodeURIComponent(movieTitle);
                    tsAdd(s.magnet, movieTitle, function (hash) {
                        var h   = hash || s.hash;
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
                    Lampa.Noty.show(s.hash ? 'Chua cau hinh TorrServer!' : 'Khong co link');
                }
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function searchTorrent(card, season, episode) {
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);
        Lampa.Noty.show('Dang tim torrent...');

        function run(id) {
            var url = buildStreamUrl(type, id, season, episode);
            if (!url) { Lampa.Noty.show(getTorrentEngine() === 'aio' ? 'Chua cau hinh AIO!' : 'Loi config'); return; }
            fetchStreams(url, function (streams) {
                var epLabel = (season && episode) ? ' S' + padZero(season) + 'E' + padZero(episode) : '';
                showStreamsMenu(streams, title + epLabel, card, season, episode);
            });
        }

        if (imdbId) { run(imdbId); return; }
        reguest(
            'https://api.themoviedb.org/3/' + (type === 'series' ? 'tv' : 'movie') + '/' +
            card.id + '/external_ids?api_key=' + TMDB_API_KEY,
            function (d) { var id = d && d.imdb_id; if (id) { card.imdb_id = id; run(id); } else Lampa.Noty.show('Khong co IMDB ID'); },
            function ()  { Lampa.Noty.show('Loi lay IMDB ID'); }
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
                title: 'Season ' + s + ' — Chon tap', items: ee,
                onSelect: function (item) { searchTorrent(card, item.s, item.e); },
                onBack:   function ()      { Lampa.Controller.toggle('full'); }
            });
        }

        if (total === 1) { pickEp(1); return; }
        var ss = [];
        for (var s = 1; s <= total; s++) ss.push({ title: 'Season ' + s + ' (' + getSeasonEpCount(card, s) + ' tap)', s: s });
        Lampa.Select.show({
            title: 'Chon Season', items: ss,
            onSelect: function (item) { pickEp(item.s); },
            onBack:   function ()      { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       SETTINGS — dùng đúng class Lampa, không dùng emoji làm icon
    ============================================================ */
    Lampa.Component.add('kkparser_settings', function () {
        var comp = this;

        // Dùng đúng structure của Lampa settings
        var $wrap = $('<div class="settings-content"></div>');

        comp.create = function () { comp.build(); };

        comp.build = function () {
            $wrap.empty();

            // Header — dùng thẻ đơn giản, không dùng emoji làm icon lớn
            $wrap.append(
                '<div style="padding:1.2em 1.8em .8em;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:.5em">' +
                '<div style="font-size:1.4em;font-weight:700;margin-bottom:.2em">KKPhim Parser</div>' +
                '<div style="font-size:.85em;opacity:.45">v1.7 — Cai dat nguon phim va torrent</div>' +
                '</div>'
            );

            /* TorrServer */
            addSection('TORRSERVER');
            var tsv = getSetting('torrserver_url');
            var tsp = getSetting('torrserver_pass');
            addInput('torrserver_url',  'Dia chi TorrServer',  '192.168.1.100:8090',    tsv || 'Chua cai');
            addInput('torrserver_pass', 'Mat khau TorrServer', 'De trong neu khong co', tsp ? '••••••' : 'Khong co');
            addButton('Test ket noi TorrServer', tsv || 'Chua nhap dia chi', function () {
                var url = getTsUrl();
                if (!url) { Lampa.Noty.show('Chua nhap dia chi!'); return; }
                Lampa.Noty.show('Dang test...');
                $.ajax({ url: url + '/echo', type: 'GET', timeout: 5000,
                    success: function ()    { Lampa.Noty.show('TorrServer OK!'); },
                    error:   function (xhr) { Lampa.Noty.show(xhr.status ? 'HTTP ' + xhr.status : 'Khong ket noi duoc'); }
                });
            });

            addSection('NGUON TORRENT');
            var eng = getTorrentEngine();
            addButton('Engine: ' + (eng === 'aio' ? 'AIOStreams' : 'Torrentio'), 'Nhan de doi engine', function () {
                Lampa.Select.show({
                    title: 'Chon Torrent Engine',
                    items: [
                        { title: (eng === 'torrentio' ? '[x] ' : '[ ] ') + 'Torrentio', value: 'torrentio' },
                        { title: (eng === 'aio'       ? '[x] ' : '[ ] ') + 'AIOStreams', value: 'aio' }
                    ],
                    onSelect: function (s) { setSetting('torrent_engine', s.value); Lampa.Noty.show('Da chon ' + s.value); comp.build(); },
                    onBack:   function ()  { Lampa.Controller.toggle('content'); }
                });
            });
            var tc = getSetting('torrentio_config');
            addInput('torrentio_config', 'Torrentio Config', 'Dan link manifest (trong = mac dinh)', tc || 'Mac dinh');
            var au = getSetting('aio_url');
            addInput('aio_url', 'AIOStreams URL', 'Dan full URL manifest.json', au || 'Chua cai');

            addSection('JACKETT');
            var ju = getSetting('jackett_url');
            var jk = getSetting('jackett_key');
            addInput('jackett_url', 'Jackett Server', 'jac.red hoac IP:port', ju || 'Chua cai');
            addInput('jackett_key', 'Jackett API Key', 'Lay trong Jackett Dashboard', jk || 'Chua nhap');
            addButton('Test ket noi Jackett', ju || 'Chua nhap server', function () {
                var url = getJackettUrl(), key = getJackettKey();
                if (!url) { Lampa.Noty.show('Chua nhap URL!'); return; }
                if (!key) { Lampa.Noty.show('Chua nhap Key!'); return; }
                Lampa.Noty.show('Dang test...');
                reguest(url + '/api/v2.0/indexers/all/results?apikey=' + key + '&Query=test&Category[]=2000',
                    function () { Lampa.Noty.show('Jackett OK!'); },
                    function (e) { Lampa.Noty.show('Loi: ' + e); }
                );
            });

            addSection('KNABEN');
            addLabel('knaben.eu', 'Khong can cai dat — tim kiem tu dong theo ten + nam');
            addLabel('File list', 'Chon torrent → hien danh sach file → chon tap → phat');

            addSection('NGUON PHIM VIET');
            addLabel('KKPhim', 'phimapi.com — tu dong hien Season > Server > Tap');
            addLabel('OPhim',  'ophim1.com — tu dong hien Season > Server > Tap');

            // Padding cuối để không bị navigation bar che
            $wrap.append('<div style="height:5em"></div>');

            setTimeout(function () { Lampa.Controller.toggle('content'); }, 50);
        };

        /* ---- Helpers tạo row dùng đúng class Lampa ---- */
        function addSection(title) {
            $wrap.append('<div class="settings-param-title">' + escHtml(title) + '</div>');
        }

        function addInput(key, name, placeholder, currentVal) {
            var $row = $(
                '<div class="settings-param selector">' +
                '<div class="settings-param__left">' +
                '<div class="settings-param__name">' + escHtml(name) + '</div>' +
                '<div class="settings-param__descr">' + escHtml(placeholder) + '</div>' +
                '</div>' +
                '<div class="settings-param__value">' + escHtml(currentVal || '') + '</div>' +
                '</div>'
            );
            $row.on('hover:enter click', function () {
                Lampa.Input.edit(
                    { title: name, value: getSetting(key) || '', free: true, nosave: true },
                    function (v) { setSetting(key, v.trim()); Lampa.Noty.show('Da luu'); comp.build(); }
                );
            });
            $wrap.append($row);
        }

        function addButton(name, desc, fn) {
            var $row = $(
                '<div class="settings-param selector">' +
                '<div class="settings-param__left">' +
                '<div class="settings-param__name">' + escHtml(name) + '</div>' +
                '<div class="settings-param__descr">' + escHtml(desc) + '</div>' +
                '</div>' +
                '<div class="settings-param__value">›</div>' +
                '</div>'
            );
            $row.on('hover:enter click', fn);
            $wrap.append($row);
        }

        function addLabel(name, desc) {
            $wrap.append(
                '<div class="settings-param">' +
                '<div class="settings-param__left">' +
                '<div class="settings-param__name">' + escHtml(name) + '</div>' +
                '<div class="settings-param__descr">' + escHtml(desc) + '</div>' +
                '</div></div>'
            );
        }

        /* ---- Controller ---- */
        comp.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet($wrap);
                    Lampa.Controller.collectionFocus(false, $wrap);
                },
                up:   function () { Navigator.canmove('up') ? Navigator.move('up') : Lampa.Controller.toggle('head'); },
                down: function () { Navigator.canmove('down') ? Navigator.move('down') : false; },
                left: function () { Navigator.canmove('left')  ? Navigator.move('left')  : false; },
                right:function () { Navigator.canmove('right') ? Navigator.move('right') : false; },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        comp.pause   = function () {};
        comp.stop    = function () {};
        comp.render  = function () { return $wrap; };
        comp.destroy = function () { $wrap.remove(); };
    });

    /* ============================================================
       FULL CARD HOOK
    ============================================================ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        var card = e.data && e.data.movie ? e.data.movie
                 : (e.object && e.object.card ? e.object.card : null);
        if (!card) return;
        var $ctx = e.object && e.object.activity ? e.object.activity.render()
                 : (e.object && e.object.render  ? e.object.render() : $('body'));
        if ($ctx.find('.view--kkphim').length) return;

        var isSeries = getMediaType(card) === 'series';

        function mkBtn(cls, label, fn) {
            // Dùng đúng structure button của Lampa, KHÔNG dùng SVG inline lớn
            var $b = $(
                '<div class="full-start__button selector ' + escHtml(cls) + '">' +
                '<span class="full-start__button-icon">' +
                '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
                '</span>' +
                '<span class="full-start__button-name">' + escHtml(label) + '</span>' +
                '</div>'
            );
            $b.on('hover:enter', fn);
            return $b;
        }

        var $kk = mkBtn('view--kkphim',  'KKPhim', function () { searchAndPlay('kkphim', card); });
        var $op = mkBtn('view--ophim',   'OPhim',  function () { searchAndPlay('ophim',  card); });
        var $tr = mkBtn('view--kkparser-torrent',
            getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio',
            function () { isSeries ? askTorrentTV(card) : searchTorrent(card, null, null); }
        );
        var $jk = mkBtn('view--kkparser-jackett', 'Jackett', function () { searchJackett(card); });
        var $kn = mkBtn('view--kkparser-knaben',  'Knaben',  function () { searchKnaben(card);  });

        var $anchor = $ctx.find('.view--torrent');
        if ($anchor.length) {
            $anchor.after($kn).after($jk).after($tr).after($op).after($kk);
        } else {
            $ctx.find('.full-start__buttons').append($kk).append($op).append($tr).append($jk).append($kn);
        }
    });

    /* ============================================================
       MENU
    ============================================================ */
    function addMenu() {
        if ($('.menu__item[data-action="kkparser"]').length) return;
        var $item = $(
            '<li class="menu__item selector" data-action="kkparser">' +
            '<div class="menu__ico">' +
            '<svg viewBox="0 0 24 24" fill="none" width="24" height="24">' +
            '<rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/>' +
            '</svg></div>' +
            '<div class="menu__text">KKPhim Parser</div>' +
            '</li>'
        );
        $item.on('hover:enter', function () {
            Lampa.Activity.push({ url: '', title: 'KKPhim Parser', component: 'kkparser_settings', page: 1 });
        });
        $('.menu .menu__list').eq(0).append($item);
    }

    function start() { addMenu(); console.log('[KKPhim Parser] v1.7 OK'); }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();