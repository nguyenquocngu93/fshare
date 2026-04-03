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
        } catch (e) {
            fail(e.message || 'Reguest error');
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
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }

        $.ajax({
            url: tsUrl + '/torrents',
            type: 'POST',
            headers: tsHeaders(),
            data: JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
            dataType: 'json',
            timeout: 15000,
            success: function (data) { onDone((data && data.hash) || ''); },
            error:   function ()     { if (onFail) onFail(); }
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
        var name  = encodeURIComponent(title || 'video');
        var url   = tsUrl + '/stream/' + name + '?link=' + hash + '&index=' + fileId + '&play';
        doPlay({ url: url, title: title, card: card });
    }

    /* ============================================================
       SHOW FILE LIST - Dùng chung cho Jackett, Knaben, Torrentio
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
                // Loại bỏ năm và resolution
                if (num >= 480 && num <= 4320) continue;
                if (num >= 1900 && num <= 2100) continue;
                return num;
            }
        }
        return null;
    }

    function showFileList(files, hash, playTitle, card) {
        if (!files || !files.length) {
            Lampa.Noty.show('Không tìm thấy file video trong torrent');
            return;
        }

        Lampa.Select.show({
            title: '📂 Chọn file — ' + playTitle,
            items: files.map(function (f) {
                var parts    = (f.path || '').split('/');
                var filename = parts[parts.length - 1] || f.path || 'File';
                var size     = f.length ? fmtBytes(f.length) : '';
                var epNum    = detectEpisode(filename);
                var epLabel  = epNum !== null ? ' [Tập ' + epNum + ']' : '';

                return {
                    title:    filename + epLabel,
                    subtitle: size,
                    file:     f
                };
            }),
            onSelect: function (item) {
                var f      = item.file;
                var parts  = (f.path || '').split('/');
                var fname  = parts[parts.length - 1] || f.path || '';
                var fTitle = playTitle + (fname ? ' — ' + fname : '');
                tsPlayFile(hash, f.id !== undefined ? f.id : 0, fTitle, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       TSADDANDPICKFILE - Add torrent → chờ → LUÔN hiện file list
    ============================================================ */
    function tsAddAndPickFile(magnet, hash, torrentTitle, playTitle, card) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }

        // Extract hash từ magnet nếu hash rỗng
        if (!hash && magnet) {
            var hm = magnet.match(/btih:([a-f0-9]+)/i);
            if (hm) hash = hm[1].toLowerCase();
        }

        Lampa.Noty.show('Đang thêm vào TorrServer...');

        var cancelled  = false;
        var timerId    = null;
        var tries      = 0;
        var maxTries   = 8;   // thử tối đa 8 lần × 2s = 16s
        var finalHash  = hash;

        function tryGetFiles() {
            if (cancelled) return;
            tries++;

            tsGetFiles(finalHash, function (files) {
                if (cancelled) return;

                if (!files.length && tries < maxTries) {
                    // Chưa có file, thử lại sau 2s
                    timerId = setTimeout(tryGetFiles, 2000);
                    return;
                }

                // Có file hoặc hết lượt thử → LUÔN hiện file list
                // (không auto-play để user chọn đúng tập)
                if (!files.length) {
                    Lampa.Noty.show('Torrent chưa có file, thử lại sau vài giây');
                    return;
                }

                showFileList(files, finalHash, playTitle, card);
            });
        }

        tsAdd(magnet, torrentTitle, function (returnedHash) {
            if (cancelled) return;
            finalHash = returnedHash || hash;

            if (!finalHash) {
                Lampa.Noty.show('Không lấy được hash từ TorrServer');
                return;
            }

            // Đợi 2s để TorrServer parse xong rồi lấy file list
            timerId = setTimeout(tryGetFiles, 2000);

        }, function () {
            if (cancelled) return;
            // Add thất bại nhưng vẫn còn hash gốc
            if (finalHash) {
                Lampa.Noty.show('TorrServer lỗi khi add, thử lấy file...');
                timerId = setTimeout(tryGetFiles, 1000);
            } else {
                Lampa.Noty.show('TorrServer lỗi và không có hash');
            }
        });

        // Trả về hàm cancel (dùng khi user back)
        return function () {
            cancelled = true;
            if (timerId) clearTimeout(timerId);
        };
    }

    /* ============================================================
       KKPHIM / OPHIM
       Flow: Tìm phim → Chi tiết → Chọn Season → Chọn Server → Chọn Tập
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
                cb({ movie: data.movie || data || {}, episodes: data.episodes || [] });
            },
            function () { cb({ movie: {}, episodes: [] }); }
        );
    }

    function matchScore(item, nTitle, nOrig, year) {
        var score = 0;
        var n1 = normalizeStr(item.name || '');
        var n2 = normalizeStr(item.origin_name || '');

        if ((nTitle && (n1 === nTitle || n2 === nTitle)) ||
            (nOrig  && (n1 === nOrig  || n2 === nOrig))) {
            score += 100;
        } else if ((nTitle && (n1.indexOf(nTitle) > -1 || nTitle.indexOf(n1) > -1)) ||
                   (nOrig  && (n2.indexOf(nOrig)  > -1 || nOrig.indexOf(n2)  > -1))) {
            score += 50;
        }

        if (year && item.year) {
            var diff = Math.abs(parseInt(item.year) - parseInt(year));
            score += diff === 0 ? 30 : diff === 1 ? 15 : 0;
        }
        return score;
    }

    function findBestMatch(items, title, orig, year) {
        if (!items || !items.length) return null;
        var nT = normalizeStr(title);
        var nO = normalizeStr(orig);
        var best = null, bestScore = 0;
        for (var i = 0; i < items.length; i++) {
            var s = matchScore(items[i], nT, nO, year);
            if (s > bestScore) { bestScore = s; best = items[i]; }
        }
        return bestScore > 0 ? best : null;
    }

    function cleanName(name) {
        return (name || '').replace(/^#+\s*/, '').trim();
    }

    /* ----
       Phân tích episodes từ API để biết có bao nhiêu season
       KKPhim trả về episodes là array of server, mỗi server có server_data là array tập
       Các tập có thể tên là "1","2",... hoặc "S01E01","Tập 1",...
       Detect season từ tên tập
    ---- */
    function detectSeasonFromEp(epName) {
        var m = epName && epName.match(/[Ss](\d+)/);
        return m ? parseInt(m[1]) : null;
    }

    /*
       Tổ chức lại episodes theo season.
       Trả về object: { 1: [serverList], 2: [serverList], ... }
       Mỗi serverList: { server_name, server_data: [ep,...] }
    */
    function organizeBySeasons(episodes) {
        // episodes = array of { server_name, server_data: [{name, link_m3u8, ...}] }
        var seasons = {};  // seasonNum → { serverName: [eps] }

        episodes.forEach(function (srv) {
            var srvName = cleanName(srv.server_name) || 'Server';
            var srvData = srv.server_data || [];

            srvData.forEach(function (ep) {
                var epName = ep.name || '';
                var sn = detectSeasonFromEp(epName) || 1;

                if (!seasons[sn]) seasons[sn] = {};
                if (!seasons[sn][srvName]) seasons[sn][srvName] = [];
                seasons[sn][srvName].push(ep);
            });
        });

        return seasons;
    }

    /*
       Entry point sau khi có episodes
       Nếu chỉ 1 season → thẳng tới chọn server
       Nếu nhiều season → hiện menu season trước
    */
    function playEpisode(card, episodes) {
        var title = card.title || card.name || '';

        // Lọc server có tập
        var servers = (episodes || []).filter(function (srv) {
            return srv.server_data && srv.server_data.length > 0;
        });
        if (!servers.length) { Lampa.Noty.show('Không có tập phim'); return; }

        // Tổ chức theo season
        var seasons = organizeBySeasons(servers);
        var seasonNums = Object.keys(seasons).map(Number).sort(function (a, b) { return a - b; });

        if (seasonNums.length > 1) {
            // Nhiều season → hiện menu chọn season
            showSeasonMenu(title, seasons, seasonNums, servers, card);
        } else {
            // 1 season → thẳng tới chọn server/phiên bản
            showServerMenu(title, servers, card, null);
        }
    }

    /* Bước 1 (nếu nhiều season): Chọn Season */
    function showSeasonMenu(title, seasons, seasonNums, allServers, card) {
        Lampa.Select.show({
            title: title + ' — Chọn Season',
            items: seasonNums.map(function (sn) {
                var srvNames = Object.keys(seasons[sn]);
                var epCount  = 0;
                srvNames.forEach(function (name) { epCount = Math.max(epCount, seasons[sn][name].length); });
                return {
                    title:    'Season ' + sn,
                    subtitle: epCount + ' tập · ' + srvNames.length + ' phiên bản',
                    sn:       sn
                };
            }),
            onSelect: function (item) {
                // Lọc servers chỉ giữ tập của season này
                var filteredServers = buildServersForSeason(allServers, item.sn);
                showServerMenu(title + ' · Season ' + item.sn, filteredServers, card, item.sn);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* Tạo server list chỉ chứa tập của season sn */
    function buildServersForSeason(servers, sn) {
        var result = [];
        servers.forEach(function (srv) {
            var filtered = (srv.server_data || []).filter(function (ep) {
                var detected = detectSeasonFromEp(ep.name || '') || 1;
                return detected === sn;
            });
            if (filtered.length > 0) {
                result.push({
                    server_name: srv.server_name,
                    server_data: filtered
                });
            }
        });
        return result;
    }

    /* Bước 2: Chọn Server/Phiên bản */
    function showServerMenu(title, servers, card, season) {
        if (!servers || !servers.length) { Lampa.Noty.show('Không có phiên bản'); return; }

        // Nếu chỉ 1 server → thẳng tới chọn tập
        if (servers.length === 1) {
            showEpisodeMenu(title, servers[0], card, season);
            return;
        }

        Lampa.Select.show({
            title: title + ' — Chọn phiên bản',
            items: servers.map(function (srv, idx) {
                var name  = cleanName(srv.server_name) || ('Phiên bản ' + (idx + 1));
                var count = (srv.server_data || []).length;
                return {
                    title:    name,
                    subtitle: count + ' tập',
                    srv:      srv
                };
            }),
            onSelect: function (item) {
                showEpisodeMenu(title, item.srv, card, season);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* Bước 3: Chọn Tập */
    function showEpisodeMenu(title, serverData, card, season) {
        var eps     = serverData.server_data || [];
        var srvName = cleanName(serverData.server_name);
        var menuTitle = title + (srvName ? ' · ' + srvName : '');

        if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }

        var playlist = eps.map(function (ep, idx) {
            return {
                title:   menuTitle + ' — ' + (ep.name || ('Tập ' + (idx + 1))),
                url:     ep.link_m3u8 || ep.link_embed || '',
                movie:   card,
                season:  season || 1,
                episode: idx + 1
            };
        });

        Lampa.Select.show({
            title: menuTitle + ' (' + eps.length + ' tập)',
            items: eps.map(function (ep, idx) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                return {
                    title:    ep.name || ('Tập ' + (idx + 1)),
                    subtitle: link ? '' : '⚠ Không có link',
                    ep:       ep,
                    idx:      idx
                };
            }),
            onSelect: function (item) {
                var link = item.ep.link_m3u8 || item.ep.link_embed || '';
                if (!link) { Lampa.Noty.show('Không có link phát'); return; }
                doPlay({
                    url:     link,
                    title:   menuTitle + ' — ' + (item.ep.name || ('Tập ' + (item.idx + 1))),
                    card:    card,
                    episode: { season: season || 1, episode: item.idx + 1 }
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

        Lampa.Noty.show(source.name + ': đang tìm...');

        var terms = [];
        if (orig) terms.push(orig);
        if (title && title !== orig) terms.push(title);
        if (!terms.length) terms.push(title);

        var tried = 0;

        function tryNext() {
            if (tried >= terms.length) {
                // Tất cả đều không match tốt → cho user tự chọn với kết quả của term đầu
                searchSource(source, terms[0], function (all) {
                    showManualSelect(source, all, card);
                });
                return;
            }

            searchSource(source, terms[tried], function (items) {
                var best = findBestMatch(items, title, orig, year);
                if (best && best.slug) {
                    loadAndPlay(source, best.slug, card);
                } else {
                    tried++;
                    tryNext();
                }
            });
        }

        tryNext();
    }

    function showManualSelect(source, items, card) {
        if (!items || !items.length) {
            Lampa.Noty.show('Không tìm thấy trên ' + source.name);
            return;
        }
        Lampa.Select.show({
            title: source.name + ' — Chọn kết quả',
            items: items.map(function (it) {
                return {
                    title:    (it.name || '') + (it.origin_name ? ' (' + it.origin_name + ')' : ''),
                    subtitle: it.year ? 'Năm: ' + it.year : '',
                    slug:     it.slug
                };
            }),
            onSelect: function (item) {
                if (item.slug) loadAndPlay(source, item.slug, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function loadAndPlay(source, slug, card) {
        Lampa.Noty.show('Đang tải thông tin phim...');
        fetchDetail(source, slug, function (data) {
            var eps = data.episodes || [];
            if (!eps.length) { Lampa.Noty.show('Không có tập phim'); return; }
            playEpisode(card, eps);
        });
    }

    /* ============================================================
       JACKETT - Chọn torrent → TorrServer → LUÔN hiện file list
    ============================================================ */
    function fetchJackett(query, cb) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url) { Lampa.Noty.show('Chưa cấu hình Jackett!'); cb([]); return; }
        if (!key) { Lampa.Noty.show('Chưa nhập API Key!');     cb([]); return; }

        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(key) +
            '&Query=' + encodeURIComponent(query) + '&Category[]=2000&Category[]=5000',
            function (data) {
                var d = safeJSON(data);
                if (!d) { cb([]); return; }
                var results = ((d.Results) || []).map(function (r) {
                    var link = r.MagnetUri || r.Link || '';
                    if (!link) return null;
                    var hm  = link.match(/btih:([a-f0-9]+)/i);
                    var qm  = (r.Title || '').match(/\b(2160p|4K|UHD|1080p|720p|480p|BluRay|WEB-?DL|HDRip)\b/i);
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
                }).filter(Boolean).sort(function (a, b) {
                    // Sắp theo seeds trước, sau đó size
                    if (b.seeds !== a.seeds) return b.seeds - a.seeds;
                    return b.sizeNum - a.sizeNum;
                });
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
                    showTorrentMenu(r2, title, 'Jackett', card);
                });
            } else {
                showTorrentMenu(r, title, 'Jackett', card);
            }
        });
    }

    /* ============================================================
       KNABEN
    ============================================================ */
    function fetchKnaben(query, isTV, cb) {
        var cat = isTV ? '300000' : '200000';
        var url = 'https://knaben.eu/api/v1/' +
            '?search=' + encodeURIComponent(query) +
            '&categories[]=' + cat +
            '&orderBy=seeders&sort=desc&size=30';

        reguest(url,
            function (data) {
                var d = safeJSON(data);
                if (!d) { cb([]); return; }
                var raw = [];
                if (Array.isArray(d))                              raw = d;
                else if (d && Array.isArray(d.hits))               raw = d.hits;
                else if (d && d.hits && Array.isArray(d.hits.hits)) raw = d.hits.hits;
                else if (d && Array.isArray(d.data))               raw = d.data;
                else if (d && Array.isArray(d.results))            raw = d.results;

                var results = raw.map(function (r) {
                    var src    = r._source || r;
                    var hash   = (src.infoHash || src.info_hash || src.hash || '').toLowerCase();
                    var title2 = src.title || src.name || '';
                    var seeds  = parseInt(src.seeders || src.seeds || 0);
                    var peers  = parseInt(src.leechers || src.peers || 0);
                    var size   = parseInt(src.size || src.contentLength || src.bytes || 0);
                    var tracker= src.indexer || src.tracker || src.source || 'Knaben';
                    var magnet = src.magnetUrl || src.magnet || '';

                    if (!magnet && hash) magnet = makeMagnet(hash, title2);
                    if (!magnet) return null;
                    if (!hash && magnet) {
                        var hm2 = magnet.match(/btih:([a-f0-9]+)/i);
                        if (hm2) hash = hm2[1].toLowerCase();
                    }

                    var qm = title2.match(/\b(2160p|4K|UHD|1080p|720p|480p|BluRay|WEB-?DL|HDRip|HDTV)\b/i);
                    return {
                        title:   title2,
                        seeds:   seeds,
                        peers:   peers,
                        size:    fmtBytes(size),
                        sizeNum: size,
                        tracker: tracker,
                        quality: qm ? qm[1] : '',
                        hash:    hash,
                        magnet:  magnet
                    };
                }).filter(Boolean).sort(function (a, b) {
                    if (b.seeds !== a.seeds) return b.seeds - a.seeds;
                    return b.sizeNum - a.sizeNum;
                });

                cb(results);
            },
            function (e) { Lampa.Noty.show('Knaben lỗi: ' + e); cb([]); }
        );
    }

    function searchKnaben(card) {
        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var isTV  = getMediaType(card) === 'series';
        var q1    = (orig || title) + (year ? ' ' + year : '');
        var q2    = (orig && orig !== title) ? title + (year ? ' ' + year : '') : '';

        Lampa.Noty.show('Knaben: đang tìm...');
        fetchKnaben(q1, isTV, function (r) {
            if (!r.length && q2) {
                fetchKnaben(q2, isTV, function (r2) { showTorrentMenu(r2, title, 'Knaben', card); });
            } else {
                showTorrentMenu(r, title, 'Knaben', card);
            }
        });
    }

    /* ============================================================
       TORRENT MENU - Dùng chung Jackett + Knaben
       Chọn torrent → Add TorrServer → HIỆN FILE LIST → Chọn file → Phát
    ============================================================ */
    function showTorrentMenu(results, movieTitle, label, card) {
        if (!results || !results.length) {
            Lampa.Noty.show(label + ': Không tìm thấy kết quả');
            return;
        }

        var tsUrl = getTsUrl();

        Lampa.Select.show({
            title: '🧲 ' + label + ' — ' + movieTitle + ' (' + results.length + ' kết quả)',
            items: results.map(function (r) {
                var qual = r.quality ? '[' + r.quality + '] ' : '';
                var src  = '[' + (r.tracker || label) + '] ';
                var name = r.title.length > 50 ? r.title.slice(0, 47) + '...' : r.title;
                return {
                    title:    src + qual + name,
                    subtitle: '👤 ' + r.seeds + (r.peers ? '/' + r.peers : '') + '  💾 ' + r.size,
                    r:        r
                };
            }),
            onSelect: function (item) {
                var r = item.r;

                if (!tsUrl) {
                    Lampa.Noty.show('Chưa cấu hình TorrServer! Vào menu KKPhim Parser để cài đặt.');
                    return;
                }

                if (!r.magnet && !r.hash) {
                    Lampa.Noty.show('Không có magnet link');
                    return;
                }

                var magnet = r.magnet || makeMagnet(r.hash, r.title);

                // Add vào TorrServer → đợi → LUÔN hiện file list → user chọn file → phát
                tsAddAndPickFile(magnet, r.hash, r.title, movieTitle, card);
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
        if (type === 'series' && season && episode) id = imdbId + ':' + season + ':' + episode;

        if (engine === 'aio') {
            var base = getAioUrl();
            return base ? base + '/stream/' + sType + '/' + id + '.json' : null;
        }
        var cfg  = getTioConfig();
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
        return {
            title:   name,
            hash:    (st.infoHash || '').toLowerCase(),
            fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0,
            url:     st.url || '',
            size:    sz,
            sizeNum: parseSize(sz),
            seeds:   seedM ? parseInt(seedM[1]) : 0,
            tracker: srcM ? srcM[1] : 'Torrentio',
            magnet:  st.infoHash ? makeMagnet(st.infoHash, name) : ''
        };
    }

    function showStreamsMenu(streams, movieTitle, card, season, episode) {
        if (!streams || !streams.length) { Lampa.Noty.show('Không tìm thấy torrent'); return; }
        var tsUrl  = getTsUrl();
        var label  = getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio';
        var parsed = streams.map(parseStream)
            .filter(function (s) { return s.hash; })
            .sort(function (a, b) { return b.sizeNum - a.sizeNum; });

        if (!parsed.length) { Lampa.Noty.show('Không có torrent hợp lệ'); return; }

        Lampa.Select.show({
            title: '🧲 ' + label + ' — ' + movieTitle + ' (' + parsed.length + ')',
            items: parsed.map(function (s) {
                return {
                    title:    '[' + s.tracker + '] ' + s.title,
                    subtitle: (s.seeds ? '👤 ' + s.seeds + '  ' : '') + (s.size ? '💾 ' + s.size : ''),
                    s:        s
                };
            }),
            onSelect: function (item) {
                var s = item.s;
                if (tsUrl && s.hash) {
                    // Torrentio đã biết fileIdx cụ thể → phát trực tiếp không cần list file
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
                    Lampa.Noty.show(s.hash ? 'Chưa cấu hình TorrServer!' : 'Không có link phát');
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
                Lampa.Noty.show(getTorrentEngine() === 'aio' ? 'Chưa cấu hình AIO URL!' : 'Lỗi cấu hình');
                return;
            }
            fetchStreams(url, function (streams) {
                var epLabel = (season && episode) ? ' S' + padZero(season) + 'E' + padZero(episode) : '';
                showStreamsMenu(streams, title + epLabel, card, season, episode);
            });
        }

        if (imdbId) { run(imdbId); return; }

        // Lấy IMDB ID từ TMDB
        reguest(
            'https://api.themoviedb.org/3/' + (type === 'series' ? 'tv' : 'movie') + '/' +
            card.id + '/external_ids?api_key=' + TMDB_API_KEY,
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
            for (var e = 1; e <= totalEps; e++) {
                ee.push({ title: 'S' + padZero(s) + 'E' + padZero(e), s: s, e: e });
            }
            Lampa.Select.show({
                title: 'Season ' + s + ' — Chọn tập',
                items: ee,
                onSelect: function (item) { searchTorrent(card, item.s, item.e); },
                onBack:   function ()      { Lampa.Controller.toggle('full'); }
            });
        }

        if (total === 1) { pickEp(1); return; }

        var ss = [];
        for (var s = 1; s <= total; s++) {
            ss.push({ title: 'Season ' + s + ' (' + getSeasonEpCount(card, s) + ' tập)', s: s });
        }
        Lampa.Select.show({
            title: 'Chọn Season',
            items: ss,
            onSelect: function (item) { pickEp(item.s); },
            onBack:   function ()      { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       SETTINGS - Fix scrolling / navigation
    ============================================================ */
    Lampa.Component.add('kkparser_settings', function () {
        var comp = this;
        var $wrap = $('<div class="kkparser-settings"></div>');
        var $scroll = $('<div class="kkparser-settings__scroll"></div>');
        $wrap.append($scroll);

        /* ----- CSS ----- */
        if (!$('#kkparser-style').length) {
            $('head').append(
                '<style id="kkparser-style">' +
                '.kkparser-settings{width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column}' +
                '.kkparser-settings__scroll{flex:1;overflow-y:auto;padding:0 0 4em;scroll-behavior:smooth}' +
                '.kkparser-settings__scroll::-webkit-scrollbar{width:4px}' +
                '.kkparser-settings__scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:2px}' +
                '.kkparser-section{padding:.6em 1.8em .3em;font-size:.78em;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.35;margin-top:.8em}' +
                '.kkparser-sep{height:1px;background:rgba(255,255,255,.06);margin:.4em 1.5em}' +
                '.kkparser-header{padding:1.4em 1.8em 1em;display:flex;align-items:center;gap:1em;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:.4em}' +
                '.kkparser-item{display:flex;align-items:center;justify-content:space-between;padding:.75em 1.8em;cursor:pointer;transition:background .15s}' +
                '.kkparser-item.selector:focus,.kkparser-item.selector.focus,.kkparser-item.selector:hover{background:rgba(255,255,255,.08);outline:none}' +
                '.kkparser-item__left{display:flex;align-items:center;gap:.7em;flex:1;min-width:0}' +
                '.kkparser-item__icon{font-size:1.1em;flex-shrink:0;width:1.6em;text-align:center}' +
                '.kkparser-item__name{font-size:1.02em;font-weight:600}' +
                '.kkparser-item__desc{font-size:.82em;opacity:.45;margin-top:.15em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:32em}' +
                '.kkparser-item__value{font-size:.85em;opacity:.55;margin-left:1em;white-space:nowrap;flex-shrink:0}' +
                '.kkparser-version{text-align:center;padding:1.5em;font-size:.8em;opacity:.2}' +
                '</style>'
            );
        }

        comp.create = function () { comp.build(); };

        comp.build = function () {
            $scroll.empty();

            /* Header */
            $scroll.append(
                '<div class="kkparser-header">' +
                '<svg viewBox="0 0 24 24" fill="none" width="38" height="38"><rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>' +
                '<div><div style="font-size:1.25em;font-weight:700">KKPhim Parser</div>' +
                '<div style="font-size:.82em;opacity:.4;margin-top:.2em">Cài đặt nguồn phim &amp; torrent</div></div>' +
                '</div>'
            );

            /* TorrServer */
            sec('🖥️  TorrServer');
            var tsv = getSetting('torrserver_url');
            var tsp = getSetting('torrserver_pass');
            mkInp('torrserver_url',  '🌐', 'Địa chỉ TorrServer',  '192.168.1.100:8090',    tsv || 'Chưa cài');
            mkInp('torrserver_pass', '🔒', 'Mật khẩu TorrServer', 'Để trống nếu không có', tsp ? '••••••' : 'Không có');
            mkAct('▶', 'Test kết nối TorrServer', tsv || 'Chưa nhập địa chỉ', function () {
                var url = getTsUrl();
                if (!url) { Lampa.Noty.show('Chưa nhập địa chỉ!'); return; }
                Lampa.Noty.show('Đang test...');
                $.ajax({ url: url + '/echo', type: 'GET', timeout: 5000,
                    success: function ()    { Lampa.Noty.show('✅ TorrServer OK!'); },
                    error:   function (xhr) { Lampa.Noty.show(xhr.status ? '❌ HTTP ' + xhr.status : '❌ Không kết nối được'); }
                });
            });

            sep();
            sec('🧲  Nguồn Torrent');
            var eng = getTorrentEngine();
            mkAct('⚙', 'Engine hiện tại: ' + (eng === 'aio' ? 'AIOStreams' : 'Torrentio'), 'Nhấn để đổi engine', function () {
                Lampa.Select.show({
                    title: 'Chọn Torrent Engine',
                    items: [
                        { title: (eng === 'torrentio' ? '✅ ' : '　 ') + 'Torrentio (mặc định)', value: 'torrentio' },
                        { title: (eng === 'aio'       ? '✅ ' : '　 ') + 'AIOStreams',            value: 'aio' }
                    ],
                    onSelect: function (s) {
                        setSetting('torrent_engine', s.value);
                        Lampa.Noty.show('✅ Đã chọn ' + s.value);
                        comp.build();
                    },
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
            });
            var tc = getSetting('torrentio_config');
            mkInp('torrentio_config', '🔗', 'Torrentio Config', 'Dán link manifest (trống = mặc định)', tc || 'Mặc định');
            var au = getSetting('aio_url');
            mkInp('aio_url', '🔗', 'AIOStreams URL', 'Dán full URL manifest.json', au || 'Chưa cài');

            sep();
            sec('🔍  Jackett');
            var ju = getSetting('jackett_url');
            var jk = getSetting('jackett_key');
            mkInp('jackett_url', '🌐', 'Jackett Server', 'jac.red hoặc IP:port', ju || 'Chưa cài');
            mkInp('jackett_key', '🔑', 'Jackett API Key', 'Lấy trong Jackett Dashboard', jk || 'Chưa nhập');
            mkAct('▶', 'Test kết nối Jackett', ju || 'Chưa nhập server', function () {
                var url = getJackettUrl(), key = getJackettKey();
                if (!url) { Lampa.Noty.show('Chưa nhập URL!'); return; }
                if (!key) { Lampa.Noty.show('Chưa nhập Key!'); return; }
                Lampa.Noty.show('Đang test...');
                reguest(url + '/api/v2.0/indexers/all/results?apikey=' + key + '&Query=test&Category[]=2000',
                    function () { Lampa.Noty.show('✅ Jackett OK!'); },
                    function (e) { Lampa.Noty.show('❌ ' + e); }
                );
            });

            sep();
            sec('🌐  Knaben');
            mkLbl('🌍', 'knaben.eu', 'Không cần cài đặt — tìm kiếm tự động');
            mkLbl('📂', 'Chọn file', 'Sau khi chọn torrent → hiện danh sách file → chọn tập');

            sep();
            sec('🎬  Nguồn phim Việt');
            mkLbl('▶', 'KKPhim', 'phimapi.com — tự chọn Season › Server › Tập');
            mkLbl('▶', 'OPhim',  'ophim1.com — tự chọn Season › Server › Tập');

            $scroll.append('<div class="kkparser-version">KKPhim Parser v1.7</div>');

            /* Focus item đầu tiên sau khi build */
            setTimeout(function () {
                Lampa.Controller.toggle('content');
            }, 50);
        };

        /* ---- Widget helpers ---- */
        function sec(t) {
            $scroll.append('<div class="kkparser-section">' + escHtml(t) + '</div>');
        }
        function sep() {
            $scroll.append('<div class="kkparser-sep"></div>');
        }

        function mkInp(key, icon, name, placeholder, currentVal) {
            var $el = $(
                '<div class="kkparser-item selector" tabindex="0">' +
                '<div class="kkparser-item__left">' +
                '<span class="kkparser-item__icon">' + escHtml(icon) + '</span>' +
                '<div><div class="kkparser-item__name">' + escHtml(name) + '</div>' +
                '<div class="kkparser-item__desc">' + escHtml(placeholder) + '</div></div>' +
                '</div>' +
                '<div class="kkparser-item__value">' + escHtml(currentVal || '') + '</div>' +
                '</div>'
            );
            $el.on('hover:enter click', function () {
                Lampa.Input.edit(
                    { title: name, value: getSetting(key) || '', free: true, nosave: true },
                    function (v) {
                        setSetting(key, v.trim());
                        Lampa.Noty.show('✅ Đã lưu');
                        comp.build();
                    }
                );
            });
            $scroll.append($el);
        }

        function mkAct(icon, name, desc, fn) {
            var $el = $(
                '<div class="kkparser-item selector" tabindex="0">' +
                '<div class="kkparser-item__left">' +
                '<span class="kkparser-item__icon">' + escHtml(icon) + '</span>' +
                '<div><div class="kkparser-item__name">' + escHtml(name) + '</div>' +
                '<div class="kkparser-item__desc">' + escHtml(desc) + '</div></div>' +
                '</div>' +
                '<div class="kkparser-item__value">›</div>' +
                '</div>'
            );
            $el.on('hover:enter click', fn);
            $scroll.append($el);
        }

        function mkLbl(icon, name, desc) {
            $scroll.append(
                '<div class="kkparser-item">' +
                '<div class="kkparser-item__left">' +
                '<span class="kkparser-item__icon">' + escHtml(icon) + '</span>' +
                '<div><div class="kkparser-item__name">' + escHtml(name) + '</div>' +
                '<div class="kkparser-item__desc">' + escHtml(desc) + '</div></div>' +
                '</div></div>'
            );
        }

        /* ---- Controller - Fix scroll ---- */
        comp.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet($scroll);
                    Lampa.Controller.collectionFocus(false, $scroll);
                },
                up: function () {
                    if (Navigator.canmove('up')) {
                        Navigator.move('up');
                    } else {
                        Lampa.Controller.toggle('head');
                    }
                },
                down: function () {
                    if (Navigator.canmove('down')) {
                        Navigator.move('down');
                    }
                },
                left:  function () { if (Navigator.canmove('left'))  Navigator.move('left');  },
                right: function () { if (Navigator.canmove('right')) Navigator.move('right'); },
                back:  function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        comp.pause   = function () {};
        comp.stop    = function () {};
        comp.render  = function () { return $wrap; };
        comp.destroy = function () { $wrap.remove(); };
    });

    /* ============================================================
       HOOK full card - Thêm các nút nguồn phim
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

        function mkBtn(cls, svgInner, label, fn) {
            var $b = $(
                '<div class="full-start__button selector ' + escHtml(cls) + '">' +
                '<svg viewBox="0 0 24 24" fill="none" width="44" height="44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                svgInner + '</svg>' +
                '<span>' + escHtml(label) + '</span>' +
                '</div>'
            );
            $b.on('hover:enter', fn);
            return $b;
        }

        var $kk = mkBtn('view--kkphim',
            '<rect x="2" y="2" width="20" height="20" rx="3"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'KKPhim',
            function () { searchAndPlay('kkphim', card); }
        );

        var $op = mkBtn('view--ophim',
            '<circle cx="12" cy="12" r="10"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'OPhim',
            function () { searchAndPlay('ophim', card); }
        );

        var $tr = mkBtn('view--kkparser-torrent',
            '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>',
            getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio',
            function () {
                if (isSeries) askTorrentTV(card);
                else searchTorrent(card, null, null);
            }
        );

        var $jk = mkBtn('view--kkparser-jackett',
            '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
            'Jackett',
            function () { searchJackett(card); }
        );

        var $kn = mkBtn('view--kkparser-knaben',
            '<path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
            'Knaben',
            function () { searchKnaben(card); }
        );

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
            '<div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" width="24" height="24">' +
            '<rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg></div>' +
            '<div class="menu__text">KKPhim Parser</div>' +
            '</li>'
        );
        $item.on('hover:enter', function () {
            Lampa.Activity.push({
                url:       '',
                title:     'KKPhim Parser',
                component: 'kkparser_settings',
                page:      1
            });
        });
        $('.menu .menu__list').eq(0).append($item);
    }

    function start() {
        addMenu();
        console.log('[KKPhim Parser] v1.7 ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();