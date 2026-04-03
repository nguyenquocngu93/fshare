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
        net.timeout(12000);
        net.silent(url,
            function (data) { onOk(data); },
            function (a, b) {
                var code = (a && a.status) ? a.status : 0;
                (onFail || function () {})(code ? 'HTTP ' + code : (b || 'Error'));
            }
        );
    }

    /* ============================================================
       PLAY HELPER - Trung tâm gọi player, luôn truyền movie card
       để Lampa ghi history và đánh dấu đã xem
    ============================================================ */
    function doPlay(params) {
        // params = { url, title, card, episode }
        var card    = params.card || {};
        var url     = params.url  || '';
        var title   = params.title || card.title || card.name || '';
        var episode = params.episode || null; // { season, episode, name }

        if (!url) { Lampa.Noty.show('Không có link phát'); return; }

        // Build player object đầy đủ để Lampa ghi history
        var playerObj = {
            title:  title,
            url:    url,
            poster: card.poster || card.img || '',
            movie:  card   // ← Lampa dùng cái này để ghi timeline/history
        };

        // Nếu là episode của series → thêm thông tin tập
        if (episode) {
            playerObj.season  = episode.season;
            playerObj.episode = episode.episode;
            playerObj.title   = title;
        }

        Lampa.Player.play(playerObj);

        // Đánh dấu đã xem thủ công (backup)
        try {
            if (Lampa.Timeline && Lampa.Timeline.update) {
                Lampa.Timeline.update(card, { percent: 0 });
            }
        } catch(e) {}

        // Ghi vào history
        try {
            if (Lampa.Favorite && Lampa.Favorite.add) {
                var historyCard = Object.assign({}, card, { viewed: true });
                Lampa.Favorite.add('history', historyCard);
            }
        } catch(e) {}
    }

    /* ============================================================
       KKPHIM / OPHIM
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

    function matchScore(item, title, orig, year) {
        var score = 0;
        var nT = normalizeStr(title), nO = normalizeStr(orig);
        var n1 = normalizeStr(item.name || '');
        var n2 = normalizeStr(item.origin_name || '');
        if (nT && (n1 === nT || n2 === nT)) score += 100;
        else if (nO && (n1 === nO || n2 === nO)) score += 100;
        else if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1)) score += 50;
        else if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1)) score += 50;
        if (year && item.year) {
            var iy = parseInt(item.year), ty = parseInt(year);
            if (iy === ty) score += 30;
            else if (Math.abs(iy - ty) <= 1) score += 15;
        }
        return score;
    }

    function findBestMatch(items, title, orig, year) {
        if (!items || !items.length) return null;
        var scored = items.map(function (it) {
            return { item: it, score: matchScore(it, title, orig, year) };
        }).filter(function (x) { return x.score > 0; })
          .sort(function (a, b) { return b.score - a.score; });
        return scored.length ? scored[0].item : null;
    }

    function playEpisode(card, episodes) {
        var title = card.title || card.name || '';
        if (!episodes || !episodes.length) { Lampa.Noty.show('Không có tập phim'); return; }

        var totalEps = 0;
        episodes.forEach(function (srv) { totalEps += (srv.server_data || []).length; });
        if (totalEps === 0) { Lampa.Noty.show('Không có tập phim'); return; }

        if (totalEps === 1) {
            for (var i = 0; i < episodes.length; i++) {
                if (episodes[i].server_data && episodes[i].server_data.length) {
                    var ep = episodes[i].server_data[0];
                    var link = ep.link_m3u8 || ep.link_embed || '';
                    doPlay({ url: link, title: title, card: card });
                    return;
                }
            }
            return;
        }

        if (episodes.length === 1 && episodes[0].server_data) {
            showEpisodeList(title, episodes[0], card);
            return;
        }

        Lampa.Select.show({
            title: 'Chọn Server - ' + title,
            items: episodes.map(function (srv, idx) {
                var count = (srv.server_data || []).length;
                return {
                    title: (srv.server_name || 'Server ' + (idx + 1)) + ' (' + count + ' tập)',
                    server: srv
                };
            }),
            onSelect: function (item) { showEpisodeList(title, item.server, card); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function showEpisodeList(title, serverData, card) {
        var eps = serverData.server_data || [];
        if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }

        var playlist = eps.map(function (ep, idx) {
            return {
                title:   title + ' - ' + (ep.name || ('Tập ' + (idx + 1))),
                url:     ep.link_m3u8 || ep.link_embed || '',
                movie:   card,   // ← truyền card vào playlist item
                season:  1,
                episode: idx + 1
            };
        });

        Lampa.Select.show({
            title: (serverData.server_name || 'Server') + ' - ' + title,
            items: eps.map(function (ep, idx) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                return {
                    title: (ep.name || 'Tập ' + (idx + 1)) + (!link ? ' [N/A]' : ''),
                    ep: ep, idx: idx
                };
            }),
            onSelect: function (item) {
                var link = item.ep.link_m3u8 || item.ep.link_embed || '';
                doPlay({
                    url:     link,
                    title:   title + ' - ' + (item.ep.name || ('Tập ' + (item.idx + 1))),
                    card:    card,
                    episode: { season: 1, episode: item.idx + 1 }
                });
                // Set playlist sau khi play
                try { Lampa.Player.playlist(playlist, item.idx); } catch(e) {}
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

        var terms = [orig || title];
        if (orig && title !== orig) terms.push(title);
        var tried = 0;

        function tryNext() {
            if (tried >= terms.length) {
                searchSource(source, title, function (allItems) {
                    if (!allItems.length && orig) {
                        searchSource(source, orig, function (items2) {
                            showManualSelect(source, items2, card);
                        });
                    } else {
                        showManualSelect(source, allItems, card);
                    }
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
            title: source.name + ' - Kết quả',
            items: items.map(function (it) {
                return {
                    title: (it.name || '') +
                        (it.origin_name ? ' (' + it.origin_name + ')' : '') +
                        (it.year ? ' [' + it.year + ']' : ''),
                    slug: it.slug
                };
            }),
            onSelect: function (item) {
                if (item.slug) loadAndPlay(source, item.slug, card);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function loadAndPlay(source, slug, card) {
        Lampa.Noty.show('Đang tải phim...');
        fetchDetail(source, slug, function (data) {
            var episodes = data.episodes || [];
            if (!episodes.length) { Lampa.Noty.show('Không có tập phim'); return; }
            playEpisode(card, episodes);
        });
    }

    /* ============================================================
       JACKETT
    ============================================================ */
    function parseJackettResult(r) {
        var link = r.MagnetUri || r.Link || '';
        if (!link) return null;
        var hm   = link.match(/btih:([a-f0-9]+)/i);
        var hash = hm ? hm[1].toLowerCase() : '';
        var info = r.info || {};
        var quality = '';
        if (info.quality) quality = String(info.quality) + 'p';
        else {
            var qm = (r.Title || '').match(/\b(2160p|4K|1080p|720p|480p|BluRay|WEB-?DL|HDRip)\b/i);
            if (qm) quality = qm[1];
        }
        var codec = info.codec_name ? info.codec_name.toUpperCase() : '';
        return {
            title:   r.Title || '',
            seeds:   parseInt(r.Seeders)  || 0,
            peers:   parseInt(r.Peers)    || 0,
            size:    fmtBytes(parseInt(r.Size) || 0),
            sizeNum: parseInt(r.Size) || 0,
            tracker: r.Tracker || '',
            quality: quality,
            codec:   codec,
            hash:    hash,
            fileIdx: 0,
            magnet:  link
        };
    }

    function fetchJackett(query, cb) {
        var url = getJackettUrl();
        var key = getJackettKey();
        if (!url) { Lampa.Noty.show('Chưa cấu hình Jackett!'); cb([]); return; }
        if (!key) { Lampa.Noty.show('Chưa nhập Jackett API Key!'); cb([]); return; }
        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(key) +
            '&Query=' + encodeURIComponent(query) + '&Category[]=2000&Category[]=5000',
            function (data) {
                var d = (typeof data === 'string') ? JSON.parse(data) : data;
                var results = ((d && d.Results) || [])
                    .map(parseJackettResult).filter(Boolean)
                    .sort(function (a, b) { return b.sizeNum - a.sizeNum; });
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
        fetchJackett(query, function (results) {
            if (!results.length && orig && orig !== title) {
                fetchJackett(title + (year ? ' ' + year : ''), function (r2) {
                    showJackettMenu(r2, title, card);
                });
            } else {
                showJackettMenu(results, title, card);
            }
        });
    }

    function showJackettMenu(results, movieTitle, card) {
        if (!results || !results.length) { Lampa.Noty.show('Jackett: Không tìm thấy'); return; }
        var tsUrl = getTsUrl();
        Lampa.Select.show({
            title: '🔍 Jackett: ' + movieTitle + ' (' + results.length + ')' + (tsUrl ? ' → TS' : ''),
            items: results.map(function (r) {
                var line1 = '[' + r.tracker + ']';
                if (r.quality) line1 += ' ' + r.quality;
                if (r.codec)   line1 += ' ' + r.codec;
                var line2 = r.title.length > 60 ? r.title.slice(0, 57) + '...' : r.title;
                return {
                    title:    line1 + '\n' + line2,
                    subtitle: '👤 ' + r.seeds + '/' + r.peers + '  💾 ' + r.size,
                    result:   r
                };
            }),
            onSelect: function (item) {
                var r = item.result;
                if (tsUrl) tsPlay(r.magnet, r.hash, r.fileIdx, movieTitle, card);
                else Lampa.Noty.show('Chưa cấu hình TorrServer!');
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       TORRENTIO / AIO
    ============================================================ */
    function buildStreamUrl(type, imdbId, season, episode) {
        var engine = getTorrentEngine();
        var streamType = type === 'series' ? 'series' : 'movie';
        var id = imdbId;
        if (type === 'series' && season && episode) id = imdbId + ':' + season + ':' + episode;
        if (engine === 'aio') {
            var base = getAioUrl();
            if (!base) return null;
            return base + '/stream/' + streamType + '/' + id + '.json';
        }
        var config = getTioConfig();
        var base2 = TORRENTIO_BASE + (config ? '/' + config : '');
        return base2 + '/stream/' + streamType + '/' + id + '.json';
    }

    function fetchStreams(url, cb) {
        reguest(url,
            function (data) { cb((data && data.streams) || []); },
            function (e) { Lampa.Noty.show('Lỗi torrent: ' + e); cb([]); }
        );
    }

    function parseStream(st) {
        var lines   = (st.title || '').split('\n');
        var name    = lines[0] || String(st.name || '').split('\n')[0] || '?';
        var info    = lines[1] || '';
        var sizeM   = info.match(/💾\s*([\d.,]+\s*[GMKBT]+)/i);
        var seedM   = info.match(/👤\s*(\d+)/);
        var srcM    = info.match(/⚙️\s*(\S+)/);
        var sizeStr = sizeM ? sizeM[1].trim() : '';
        return {
            title:   name,
            hash:    (st.infoHash || '').toLowerCase(),
            fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0,
            url:     st.url || '',
            size:    sizeStr,
            sizeNum: parseSize(sizeStr),
            seeds:   seedM ? parseInt(seedM[1]) : 0,
            tracker: srcM ? srcM[1] : 'Torrentio',
            magnet:  st.infoHash ? makeMagnet(st.infoHash, name) : ''
        };
    }

    function showStreamsMenu(streams, movieTitle, card, season, episode) {
        if (!streams || !streams.length) { Lampa.Noty.show('Không tìm thấy torrent'); return; }
        var tsUrl = getTsUrl();
        var label = getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio';
        var parsed = streams.map(parseStream)
            .filter(function (s) { return s.hash; })
            .sort(function (a, b) { return b.sizeNum - a.sizeNum; });

        Lampa.Select.show({
            title: '🧲 ' + label + ': ' + movieTitle + ' (' + parsed.length + ')' + (tsUrl ? ' → TS' : ''),
            items: parsed.map(function (s) {
                return {
                    title:    '[' + s.tracker + '] ' + s.title,
                    subtitle: (s.seeds ? '👤 ' + s.seeds + '  ' : '') + (s.size ? '💾 ' + s.size : ''),
                    stream:   s
                };
            }),
            onSelect: function (item) {
                var s = item.stream;
                if (tsUrl && s.hash) {
                    tsPlay(s.magnet, s.hash, s.fileIdx, movieTitle, card, season, episode);
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

    /* ---- TORRSERVER PLAY ---- */
    function tsPlay(magnet, hash, fileIdx, title, card, season, episode) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }

        Lampa.Noty.show('Gửi TorrServer...');

        var headers = { 'Content-Type': 'application/json' };
        var pass = getTsPass();
        if (pass) headers['Authorization'] = 'Basic ' + btoa('admin:' + pass);

        var name = encodeURIComponent(title || 'video');
        var idx  = (fileIdx !== null && fileIdx !== undefined) ? fileIdx : 0;

        $.ajax({
            url: tsUrl + '/torrents', type: 'POST', headers: headers,
            data: JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
            dataType: 'json', timeout: 10000,
            success: function (data) {
                var h = (data && data.hash) || hash;
                var playUrl = tsUrl + '/stream/' + name + '?link=' + h + '&index=' + idx + '&play';
                doPlay({
                    url:     playUrl,
                    title:   title,
                    card:    card || {},
                    episode: (season && episode) ? { season: season, episode: episode } : null
                });
            },
            error: function () {
                var playUrl = tsUrl + '/stream/' + name + '?link=' + (hash || encodeURIComponent(magnet)) + '&index=' + idx + '&play';
                doPlay({
                    url:     playUrl,
                    title:   title,
                    card:    card || {},
                    episode: (season && episode) ? { season: season, episode: episode } : null
                });
            }
        });
    }

    /* ---- TORRENT SEARCH ---- */
    function searchTorrent(card, season, episode) {
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);

        Lampa.Noty.show('Đang tìm torrent...');

        function run(id) {
            var url = buildStreamUrl(type, id, season, episode);
            if (!url) {
                Lampa.Noty.show(getTorrentEngine() === 'aio' ? 'Chưa cấu hình AIO!' : 'Lỗi config');
                return;
            }
            fetchStreams(url, function (streams) {
                var epLabel = (season && episode) ? ' S' + padZero(season) + 'E' + padZero(episode) : '';
                showStreamsMenu(streams, title + epLabel, card, season, episode);
            });
        }

        if (imdbId) { run(imdbId); return; }

        var tmdbType = type === 'series' ? 'tv' : 'movie';
        reguest(
            'https://api.themoviedb.org/3/' + tmdbType + '/' + card.id +
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
        var totalSeasons = card.number_of_seasons || 1;

        function pickEpisode(s) {
            var totalEps = getSeasonEpCount(card, s);
            var ee = [];
            for (var e = 1; e <= totalEps; e++) {
                ee.push({ title: 'S' + padZero(s) + 'E' + padZero(e), s: s, e: e });
            }
            Lampa.Select.show({
                title: 'Season ' + s + ' — Chọn tập', items: ee,
                onSelect: function (item) { searchTorrent(card, item.s, item.e); },
                onBack: function () { Lampa.Controller.toggle('full'); }
            });
        }

        if (totalSeasons === 1) { pickEpisode(1); return; }

        var ss = [];
        for (var s = 1; s <= totalSeasons; s++) {
            ss.push({ title: 'Season ' + s + ' (' + getSeasonEpCount(card, s) + ' tập)', s: s });
        }
        Lampa.Select.show({
            title: 'Chọn Season', items: ss,
            onSelect: function (item) { pickEpisode(item.s); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       SETTINGS COMPONENT
    ============================================================ */
    Lampa.Component.add('kkparser_settings', function () {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html   = $('<div></div>');
        var self   = this;

        this.create = function () { self.build(); scroll.append(html); };

        this.build = function () {
            html.empty();

            var css = '<style id="kkp-css">' + [
                '.kkp-section{margin:.8em 1.8em .3em;color:rgba(255,255,255,.38);font-size:.78em;letter-spacing:.12em;text-transform:uppercase;font-weight:600}',
                '.kkp-item{display:flex;align-items:center;padding:.85em 1.8em;transition:background .12s;border-radius:.5em;margin:0 .4em}',
                '.kkp-item.selector:focus,.kkp-item.selector.focus{background:rgba(255,255,255,.09)}',
                '.kkp-ico{width:2em;height:2em;margin-right:1em;opacity:.65;flex-shrink:0}',
                '.kkp-ico svg{width:100%;height:100%}',
                '.kkp-body{flex:1;min-width:0}',
                '.kkp-name{font-size:.97em;font-weight:500;display:flex;align-items:center;gap:.5em}',
                '.kkp-desc{font-size:.78em;opacity:.38;margin-top:.12em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
                '.kkp-val{font-size:.82em;opacity:.55;margin-left:1em;flex-shrink:0;max-width:11em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}',
                '.kkp-tag{font-size:.72em;padding:.1em .45em;border-radius:.25em;font-weight:600;letter-spacing:.03em}',
                '.kkp-tag-g{background:rgba(72,199,142,.2);color:#48c78e}',
                '.kkp-tag-b{background:rgba(100,160,255,.2);color:#64a0ff}',
                '.kkp-tag-o{background:rgba(255,171,64,.2);color:#ffab40}',
                '.kkp-tag-r{background:rgba(255,100,100,.2);color:#ff6464}',
                '.kkp-head{padding:1.6em 1.8em 1.2em;display:flex;align-items:center;gap:1.1em;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:.5em}',
                '.kkp-head-ico{width:3.2em;height:3.2em;background:rgba(255,255,255,.07);border-radius:.7em;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
                '.kkp-head-ico svg{width:1.9em;height:1.9em}',
                '.kkp-head-t{font-size:1.25em;font-weight:700;margin-bottom:.18em}',
                '.kkp-head-s{font-size:.78em;opacity:.35}',
                '.kkp-sep{height:1px;background:rgba(255,255,255,.055);margin:.4em 1.8em}',
                '.kkp-foot{padding:1.2em;text-align:center;opacity:.22;font-size:.75em}'
            ].join('') + '</style>';
            html.append(css);

            html.append(
                '<div class="kkp-head">' +
                '<div class="kkp-head-ico"><svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg></div>' +
                '<div><div class="kkp-head-t">KKPhim Parser</div><div class="kkp-head-s">Cài đặt nguồn phim &amp; torrent</div></div>' +
                '</div>'
            );

            sec('🖥️  TorrServer');
            var tsv = getSetting('torrserver_url');
            inp('torrserver_url', icoServer(), 'Địa chỉ', '192.168.1.100:8090', tsv || 'Chưa cài', tsv ? 'g' : 'r', tsv ? 'Đã cài' : 'Chưa');
            var tsp = getSetting('torrserver_pass');
            inp('torrserver_pass', icoLock(), 'Mật khẩu', 'Để trống nếu không có', tsp ? '••••••' : 'Không có', null, null);
            btn(icoTest(), 'Test TorrServer', tsv || 'Chưa nhập địa chỉ', null, function () {
                var url = getTsUrl();
                if (!url) { Lampa.Noty.show('Chưa nhập địa chỉ!'); return; }
                Lampa.Noty.show('Đang test...');
                $.ajax({
                    url: url + '/echo', type: 'GET', timeout: 5000,
                    success: function ()    { Lampa.Noty.show('✅ TorrServer OK!'); },
                    error:   function (xhr) {
                        if (xhr.status === 200) Lampa.Noty.show('✅ TorrServer OK!');
                        else Lampa.Noty.show('❌ HTTP ' + (xhr.status || 'timeout'));
                    }
                });
            });
            sep();

            sec('🧲  Nguồn Torrent');
            var eng = getTorrentEngine();
            sel('torrent_engine', icoEngine(), 'Engine',
                eng === 'aio' ? 'AIOStreams' : 'Torrentio', 'b',
                eng === 'aio' ? 'AIOStreams' : 'Torrentio',
                [{ title: 'Torrentio (mặc định)', value: 'torrentio' },
                 { title: 'AIOStreams',            value: 'aio' }]);
            var tc = getSetting('torrentio_config');
            inp('torrentio_config', icoLink(), 'Torrentio Config', 'Dán link manifest', tc ? 'Đã cài' : 'Mặc định', tc ? 'o' : null, tc ? 'Custom' : null);
            var au = getSetting('aio_url');
            inp('aio_url', icoLink(), 'AIOStreams URL', 'Dán full URL manifest', au ? 'Đã cài' : 'Chưa cài', au ? 'g' : null, au ? 'Đã cài' : null);
            sep();

            sec('🔍  Jackett');
            var ju = getSetting('jackett_url');
            var jk = getSetting('jackett_key');
            inp('jackett_url', icoServer(), 'Server URL', 'jac.red hoặc jac.maxvol.pro', ju || 'Chưa cài', ju ? 'g' : 'r', ju ? 'Đã cài' : 'Chưa');
            inp('jackett_key', icoLock(), 'API Key', 'Key từ tài khoản Jackett', jk || 'Chưa nhập', jk ? 'g' : 'r', jk ? 'Đã nhập' : 'Chưa');
            btn(icoTest(), 'Test Jackett', ju || 'Chưa nhập server', null, function () {
                var url = getJackettUrl();
                var key = getJackettKey();
                if (!url) { Lampa.Noty.show('Chưa nhập URL!'); return; }
                if (!key) { Lampa.Noty.show('Chưa nhập API Key!'); return; }
                Lampa.Noty.show('Đang test...');
                reguest(
                    url + '/api/v2.0/indexers/all/results?apikey=' + key + '&Query=test&Category[]=2000',
                    function () { Lampa.Noty.show('✅ Jackett OK!'); },
                    function (e) { Lampa.Noty.show('❌ Jackett: ' + e); }
                );
            });
            sep();

            sec('🎬  Nguồn phim Việt');
            info(icoPlay(), 'KKPhim', 'phimapi.com — tự động tìm theo tên', 'g', 'Bật');
            info(icoPlay(), 'OPhim',  'ophim1.com — tự động tìm theo tên',  'g', 'Bật');

            html.append('<div class="kkp-foot">KKPhim Parser v1.3</div>');
        };

        function sec(t) { html.append('<div class="kkp-section">' + t + '</div>'); }
        function sep()  { html.append('<div class="kkp-sep"></div>'); }

        function tag(color, label) {
            return color ? '<span class="kkp-tag kkp-tag-' + color + '">' + label + '</span>' : '';
        }

        function row(ico, name, desc, tagColor, tagLabel, value, onClick) {
            var $el = $('<div class="kkp-item' + (onClick ? ' selector' : '') + '">' +
                '<div class="kkp-ico">' + ico + '</div>' +
                '<div class="kkp-body">' +
                '<div class="kkp-name">' + name + tag(tagColor, tagLabel) + '</div>' +
                '<div class="kkp-desc">' + desc + '</div>' +
                '</div>' +
                (value !== null ? '<div class="kkp-val">' + (value || '') + '</div>' : '') +
                '</div>');
            if (onClick) $el.on('hover:enter', onClick);
            html.append($el);
        }

        function inp(key, ico, name, placeholder, displayVal, tagColor, tagLabel) {
            row(ico, name, placeholder, tagColor, tagLabel, displayVal, function () {
                var cur = getSetting(key) || '';
                Lampa.Input.edit({ title: name, value: cur, free: true, nosave: true }, function (v) {
                    setSetting(key, v.trim());
                    Lampa.Noty.show('✅ Đã lưu');
                    self.build();
                });
            });
        }

        function sel(key, ico, name, displayVal, tagColor, tagLabel, options) {
            row(ico, name, options.map(function(o){ return o.title; }).join(' / '), tagColor, tagLabel, displayVal, function () {
                var cur = getSetting(key) || options[0].value;
                Lampa.Select.show({
                    title: name,
                    items: options.map(function (o) {
                        return { title: (o.value === cur ? '✅  ' : '　　') + o.title, value: o.value };
                    }),
                    onSelect: function (s) { setSetting(key, s.value); Lampa.Noty.show('✅ Đã chọn'); self.build(); },
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
            });
        }

        function btn(ico, name, desc, tagColor, action) { row(ico, name, desc, tagColor, null, '▶', action); }
        function info(ico, name, desc, tagColor, tagLabel) { row(ico, name, desc, tagColor, tagLabel, null, null); }

        function icoServer() { return svg('<rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1"/><rect x="2" y="17" width="20" height="5" rx="1"/><circle cx="18" cy="5.5" r=".9" fill="currentColor"/><circle cx="18" cy="12.5" r=".9" fill="currentColor"/><circle cx="18" cy="19.5" r=".9" fill="currentColor"/>'); }
        function icoLock()   { return svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'); }
        function icoLink()   { return svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'); }
        function icoTest()   { return svg('<polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>'); }
        function icoEngine() { return svg('<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>'); }
        function icoPlay()   { return svg('<circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/>'); }
        function svg(inner)  { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; }

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up:   function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause   = function () {};
        this.stop    = function () {};
        this.render  = function () { return scroll.render(); };
        this.destroy = function () { $('#kkp-css').remove(); scroll.destroy(); };
    });

    /* ============================================================
       HOOK: 4 nút vào card info
    ============================================================ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        var card = e.data && e.data.movie ? e.data.movie : (e.object && e.object.card);
        if (!card) return;

        var $ctx = e.object && e.object.activity ? e.object.activity.render()
                 : (e.object && e.object.render ? e.object.render() : $('body'));

        if ($ctx.find('.view--kkphim').length) return;

        var isSeries = getMediaType(card) === 'series';

        function mkBtn(cls, svgInner, label, fn) {
            var $b = $(
                '<div class="full-start__button selector ' + cls + '">' +
                '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
                ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                svgInner + '</svg><span>' + label + '</span></div>'
            );
            $b.on('hover:enter', fn);
            return $b;
        }

        var $kk = mkBtn('view--kkphim',
            '<rect x="2" y="2" width="20" height="20" rx="3"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'KKPhim', function () { searchAndPlay('kkphim', card); });

        var $op = mkBtn('view--ophim',
            '<circle cx="12" cy="12" r="10"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/>',
            'OPhim', function () { searchAndPlay('ophim', card); });

        var $tr = mkBtn('view--kkparser-torrent',
            '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>',
            getTorrentEngine() === 'aio' ? 'AIOStreams' : 'Torrentio',
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

    /* ============================================================
       MENU + CSS + START
    ============================================================ */
    function addMenu() {
        if ($('.menu__item[data-action="kkparser"]').length) return;
        var $item = $(
            '<li class="menu__item selector" data-action="kkparser">' +
            '<div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" width="24" height="24"><rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg></div>' +
            '<div class="menu__text">KKPhim Parser</div></li>'
        );
        $item.on('hover:enter', function () {
            Lampa.Activity.push({ url: '', title: 'KKPhim Parser', component: 'kkparser_settings', page: 1 });
        });
        $('.menu .menu__list').eq(0).append($item);
    }

    function injectCSS() {
        if (document.getElementById('kkparser-css')) return;
        var s = document.createElement('style');
        s.id = 'kkparser-css';
        s.textContent =
            '.selectbox .selectbox-item__title{white-space:pre-wrap!important;overflow:visible!important;text-overflow:unset!important;-webkit-line-clamp:unset!important;display:block!important}' +
            '.selectbox .selectbox-item{height:auto!important;max-height:none!important;padding:.8em 1.5em!important}';
        document.head.appendChild(s);
    }

    function start() {
        injectCSS();
        addMenu();
        console.log('[KKPhim Parser] v1.3 ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();