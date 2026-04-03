(function () {
    'use strict';

    if (window.plugin_kkphim_parser_ready) return;
    window.plugin_kkphim_parser_ready = true;

    /* ============================================================
       KKPhim + OPhim + Torrentio Parser for Lampa v1.0
       Thêm 3 nút vào card info: KKPhim, OPhim, Torrentio
       Cài đặt TorrServer/Torrentio/AIO trong menu trái
    ============================================================ */

    var SOURCES = {
        kkphim: { name: 'KKPhim',  api: 'https://phimapi.com/' },
        ophim:  { name: 'OPhim',   api: 'https://ophim1.com/' }
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

    function getTsPass()       { return getSetting('torrserver_pass') || ''; }
    function getTioConfig()    { return parseTioConfig(getSetting('torrentio_config') || ''); }
    function getAioUrl()       { return (getSetting('aio_url') || '').replace(/\/manifest\.json\s*$/i, '').replace(/\/+$/, ''); }
    function getTorrentEngine(){ return getSetting('torrent_engine') || 'torrentio'; }

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

    function makeMagnet(hash) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
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

    // Lampa.Reguest wrapper
    function reguest(url, onOk, onFail) {
        var net = new Lampa.Reguest();
        net.timeout(12000);
        net.silent(url,
            function (data) { onOk(data); },
            function (a, b) {
                var code = (a && a.status) ? a.status : 0;
                (onFail || function(){})(code ? 'HTTP ' + code : (b || 'Error'));
            }
        );
    }

    /* ============================================================
       KKPHIM / OPHIM - Tìm và phát
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
                cb({
                    movie: data.movie || data || {},
                    episodes: data.episodes || []
                });
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

    // Phát episodes
    function playEpisode(card, episodes) {
        var title = card.title || card.name || '';

        if (!episodes || !episodes.length) {
            Lampa.Noty.show('Không có tập phim');
            return;
        }

        var totalEps = 0;
        episodes.forEach(function (srv) { totalEps += (srv.server_data || []).length; });

        if (totalEps === 0) {
            Lampa.Noty.show('Không có tập phim');
            return;
        }

        // 1 tập → phát luôn
        if (totalEps === 1) {
            for (var i = 0; i < episodes.length; i++) {
                if (episodes[i].server_data && episodes[i].server_data.length) {
                    var ep = episodes[i].server_data[0];
                    var link = ep.link_m3u8 || ep.link_embed || '';
                    if (link) {
                        Lampa.Player.play({ title: title, url: link });
                    } else {
                        Lampa.Noty.show('Không có link phát');
                    }
                    return;
                }
            }
            return;
        }

        // 1 server → list tập
        if (episodes.length === 1 && episodes[0].server_data) {
            showEpisodeList(title, episodes[0]);
            return;
        }

        // Nhiều server → chọn server
        Lampa.Select.show({
            title: 'Chọn Server - ' + title,
            items: episodes.map(function (srv, idx) {
                var count = (srv.server_data || []).length;
                return {
                    title: (srv.server_name || 'Server ' + (idx + 1)) + ' (' + count + ' tập)',
                    server: srv
                };
            }),
            onSelect: function (item) { showEpisodeList(title, item.server); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    function showEpisodeList(title, serverData) {
        var eps = serverData.server_data || [];
        if (!eps.length) { Lampa.Noty.show('Không có tập'); return; }

        var playlist = eps.map(function (ep) {
            return {
                title: title + ' - ' + (ep.name || ''),
                url: ep.link_m3u8 || ep.link_embed || ''
            };
        });

        Lampa.Select.show({
            title: (serverData.server_name || 'Server') + ' - ' + title,
            items: eps.map(function (ep, idx) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                return {
                    title: (ep.name || 'Tập ' + (idx + 1)) + (!link ? ' [N/A]' : ''),
                    ep: ep,
                    idx: idx
                };
            }),
            onSelect: function (item) {
                var link = item.ep.link_m3u8 || item.ep.link_embed || '';
                if (!link) { Lampa.Noty.show('Không có link phát'); return; }

                Lampa.Player.play({
                    title: title + ' - ' + (item.ep.name || ''),
                    url: link
                });
                Lampa.Player.playlist(playlist, item.idx);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    // Tìm phim trên source và phát
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
                // Không match tự động → hiện kết quả để user chọn
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
            title: source.name + ' - Kết quả tìm kiếm',
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
            if (!episodes.length) {
                Lampa.Noty.show('Không có tập phim');
                return;
            }
            playEpisode(card, episodes);
        });
    }

    /* ============================================================
       TORRENTIO / AIO - Tìm torrent bằng IMDB ID
    ============================================================ */
    function buildStreamUrl(type, imdbId, season, episode) {
        var engine = getTorrentEngine();
        var streamType = type === 'series' ? 'series' : 'movie';
        var id = imdbId;
        if (type === 'series' && season && episode) {
            id = imdbId + ':' + season + ':' + episode;
        }

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
            function (e) {
                Lampa.Noty.show('Lỗi tải torrent: ' + e);
                cb([]);
            }
        );
    }

    function parseStream(st) {
        var rawName  = String(st.name || '');
        var rawTitle = String(st.title || '');
        var rawAll   = rawName + '\n' + rawTitle;

        var name = rawName.split('\n')[0].trim() || rawTitle.split('\n')[0].trim() || '?';

        var qual = '';
        var qm = rawAll.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);
        if (qm) qual = qm[1].toUpperCase();

        var size = '';
        var sm = rawAll.match(/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i)
              || rawAll.match(/\b([\d.,]+)\s*(GB|GiB|MB|MiB|TB)\b/i);
        if (sm) size = sm[1] ? (sm[1] + (sm[2] ? ' ' + sm[2] : '')).trim() : sm[0].trim();

        var seeds = '';
        var se = rawAll.match(/👤\s*(\d+)/i) || rawAll.match(/Seeders?:?\s*(\d+)/i);
        if (se) seeds = se[1];

        var src = '';
        var sr = rawAll.match(/⚙️\s*(\S+)/i) || rawAll.match(/🔗\s*([\w.\-]+)/i);
        if (sr) src = sr[1];

        return {
            name: name,
            hash: (st.infoHash || '').toLowerCase(),
            fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : null,
            url: st.url || '',
            size: size,
            sizeNum: parseSize(size),
            seeds: seeds ? parseInt(seeds) : 0,
            quality: qual,
            source: src,
            magnet: st.infoHash ? makeMagnet(st.infoHash) : ''
        };
    }

    function showStreamsMenu(streams, title) {
        if (!streams || !streams.length) {
            Lampa.Noty.show('Không tìm thấy torrent');
            return;
        }

        var tsUrl = getTsUrl();
        var engineLabel = getTorrentEngine() === 'aio' ? 'AIO' : 'Torrentio';
        var parsed = streams.slice(0, 50).map(parseStream)
            .sort(function (a, b) { return b.sizeNum - a.sizeNum; });

        Lampa.Select.show({
            title: '🧲 ' + engineLabel + ': ' + title + ' (' + parsed.length + ')' +
                   (tsUrl ? ' → TS' : ''),
            items: parsed.map(function (s) {
                var line = s.name;
                if (s.quality && line.toUpperCase().indexOf(s.quality) === -1) line += ' [' + s.quality + ']';
                var meta = [];
                if (s.size) meta.push('💾 ' + s.size);
                if (s.seeds) meta.push('👤 ' + s.seeds);
                if (s.source) meta.push('⚙️ ' + s.source);
                return {
                    title: line + (meta.length ? '\n' + meta.join('  ') : ''),
                    stream: s
                };
            }),
            onSelect: function (item) {
                var s = item.stream;

                if (tsUrl && s.hash) {
                    tsPlay(s.magnet || makeMagnet(s.hash), s.hash, s.fileIdx, title);
                } else if (s.url) {
                    Lampa.Player.play({ title: title, url: s.url });
                } else {
                    Lampa.Noty.show(s.hash ? 'Chưa cấu hình TorrServer!' : 'Không có link phát');
                }
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ---- TORRSERVER PLAY ---- */
    function tsPlay(magnet, hash, fileIdx, title) {
        var tsUrl = getTsUrl();
        if (!tsUrl) {
            Lampa.Noty.show('Chưa cấu hình TorrServer!');
            return;
        }

        Lampa.Noty.show('Gửi lên TorrServer...');

        var headers = { 'Content-Type': 'application/json' };
        var pass = getTsPass();
        if (pass) headers['Authorization'] = 'Basic ' + btoa('admin:' + pass);

        // Add torrent
        var net = new Lampa.Reguest();
        net.timeout(15000);

        try {
            $.ajax({
                url: tsUrl + '/torrents',
                type: 'POST',
                headers: headers,
                data: JSON.stringify({
                    action: 'add',
                    link: magnet,
                    title: title || '',
                    save_to_db: false
                }),
                dataType: 'json',
                success: function (data) {
                    var h = (data && data.hash) || hash;
                    // Đợi parse
                    setTimeout(function () {
                        // Get info
                        $.ajax({
                            url: tsUrl + '/torrents',
                            type: 'POST',
                            headers: headers,
                            data: JSON.stringify({ action: 'get', hash: h }),
                            dataType: 'json',
                            success: function (info) {
                                tsPickFile(tsUrl, h, info, fileIdx, title);
                            },
                            error: function () {
                                // Fallback: phát file đầu tiên
                                var idx = (fileIdx !== null && fileIdx >= 0) ? fileIdx : 0;
                                Lampa.Player.play({
                                    title: title,
                                    url: tsUrl + '/stream/fname?link=' + h + '&index=' + idx + '&play'
                                });
                            }
                        });
                    }, 2000);
                },
                error: function (xhr) {
                    Lampa.Noty.show('TorrServer lỗi: ' + (xhr.status || 'N/A'));
                }
            });
        } catch (e) {
            Lampa.Noty.show('TorrServer lỗi: ' + e.message);
        }
    }

    function tsPickFile(tsUrl, hash, info, fileIdx, title) {
        var files = [];
        if (info && info.file_stats) {
            files = info.file_stats.filter(function (f) {
                return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts)$/);
            }).sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
        }

        var playFile = function (idx) {
            Lampa.Player.play({
                title: title,
                url: tsUrl + '/stream/fname?link=' + hash + '&index=' + idx + '&play'
            });
        };

        if (!files.length) { playFile(0); return; }
        if (files.length === 1) { playFile(files[0].id || 0); return; }
        if (fileIdx !== null && fileIdx >= 0) {
            playFile(files[fileIdx] ? files[fileIdx].id : fileIdx);
            return;
        }

        // Nhiều file → chọn
        Lampa.Select.show({
            title: 'Chọn file',
            items: files.map(function (f) {
                var name = (f.path || '').split('/').pop();
                var sz = f.length ? ' (' + (f.length / 1048576).toFixed(0) + ' MB)' : '';
                return { title: name + sz, fid: f.id || 0 };
            }),
            onSelect: function (item) { playFile(item.fid); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ---- TORRENT: Movie ---- */
    function searchTorrent(card, season, episode) {
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);

        Lampa.Noty.show('Đang tìm torrent...');

        function run(id) {
            var url = buildStreamUrl(type, id, season, episode);
            if (!url) {
                Lampa.Noty.show(getTorrentEngine() === 'aio' ? 'Chưa cấu hình AIOStreams!' : 'Lỗi cấu hình');
                return;
            }
            fetchStreams(url, function (streams) {
                var epLabel = '';
                if (season && episode) epLabel = ' S' + padZero(season) + 'E' + padZero(episode);
                showStreamsMenu(streams, title + epLabel);
            });
        }

        if (imdbId) { run(imdbId); return; }

        // Lấy IMDB ID từ TMDB
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

    /* ---- TORRENT: TV - chọn season/episode ---- */
    function getSeasonEpCount(card, season) {
        if (card.seasons) {
            var s = card.seasons.filter(function (x) { return x.season_number === season; })[0];
            if (s && s.episode_count) return s.episode_count;
        }
        return 50;
    }

    function askTorrentTV(card) {
        var totalSeasons = card.number_of_seasons || card.seasons_count || 1;

        function pickEpisode(s) {
            var totalEps = getSeasonEpCount(card, s);
            var ee = [];
            for (var e = 1; e <= totalEps; e++) {
                ee.push({ title: 'S' + padZero(s) + 'E' + padZero(e), s: s, e: e });
            }
            Lampa.Select.show({
                title: 'Season ' + s + ' — Chọn tập',
                items: ee,
                onSelect: function (item) { searchTorrent(card, item.s, item.e); },
                onBack: function () { Lampa.Controller.toggle('full'); }
            });
        }

        if (totalSeasons === 1) { pickEpisode(1); return; }

        var ss = [];
        for (var s = 1; s <= totalSeasons; s++) {
            var ep = getSeasonEpCount(card, s);
            ss.push({ title: 'Season ' + s + ' (' + ep + ' tập)', s: s });
        }
        Lampa.Select.show({
            title: 'Chọn Season',
            items: ss,
            onSelect: function (item) { pickEpisode(item.s); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       SETTINGS - Menu cài đặt trong sidebar trái
    ============================================================ */
    function createSettings() {
        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: {
                name: STG_PREFIX + 'torrserver_url',
                type: 'input',
                default: ''
            },
            field: {
                title: 'TorrServer URL',
                description: 'Ví dụ: 192.168.1.100:8090'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: {
                name: STG_PREFIX + 'torrserver_pass',
                type: 'input',
                default: ''
            },
            field: {
                title: 'TorrServer Password',
                description: 'Để trống nếu không có'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: {
                name: STG_PREFIX + 'torrentio_config',
                type: 'input',
                default: ''
            },
            field: {
                title: 'Torrentio Config',
                description: 'Dán link manifest hoặc config string từ torrentio.strem.fun'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: {
                name: STG_PREFIX + 'aio_url',
                type: 'input',
                default: ''
            },
            field: {
                title: 'AIOStreams URL',
                description: 'Dán full URL manifest của AIOStreams'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'kkparser',
            param: {
                name: STG_PREFIX + 'torrent_engine',
                type: 'select',
                values: {
                    torrentio: 'Torrentio',
                    aio: 'AIOStreams'
                },
                default: 'torrentio'
            },
            field: {
                title: 'Nguồn Torrent',
                description: 'Chọn nguồn torrent mặc định'
            }
        });
    }

    function addSettingsMenu() {
        if (Lampa.SettingsApi && Lampa.SettingsApi.addComponent) {
            Lampa.SettingsApi.addComponent({
                component: 'kkparser',
                name: 'KKPhim Parser',
                icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="2"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>'
            });

            createSettings();
        }
    }

    /* ============================================================
       INJECT CSS
    ============================================================ */
    function injectCSS() {
        if (document.getElementById('kkparser-css')) return;
        var style = document.createElement('style');
        style.id = 'kkparser-css';
        style.textContent = [
            '.selectbox .selectbox-item__title {',
            '  white-space: pre-wrap !important;',
            '  overflow: visible !important;',
            '  text-overflow: unset !important;',
            '  -webkit-line-clamp: unset !important;',
            '  display: block !important;',
            '}',
            '.selectbox .selectbox-item {',
            '  height: auto !important;',
            '  max-height: none !important;',
            '  padding: 0.8em 1.5em !important;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    /* ============================================================
       HOOK: Đăng ký 3 nút vào card info
    ============================================================ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        var card = e.data && e.data.movie
            ? e.data.movie
            : (e.object && e.object.card);
        if (!card) return;

        var $ctx = e.object && e.object.activity
            ? e.object.activity.render()
            : (e.object && e.object.render ? e.object.render() : $('body'));

        // Tránh duplicate
        if ($ctx.find('.view--kkphim-parser').length) return;

        var isSeries = getMediaType(card) === 'series';

        // ===== Nút 1: KKPhim =====
        var $btnKK = $(
            '<div class="full-start__button selector view--kkphim-parser">' +
            '<svg viewBox="0 0 24 24" fill="none" width="22" height="22"' +
            ' xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/>' +
            '</svg>' +
            '<span>KKPhim</span></div>'
        );
        $btnKK.on('hover:enter', function () {
            searchAndPlay('kkphim', card);
        });

        // ===== Nút 2: OPhim =====
        var $btnOP = $(
            '<div class="full-start__button selector view--ophim-parser">' +
            '<svg viewBox="0 0 24 24" fill="none" width="22" height="22"' +
            ' xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/>' +
            '</svg>' +
            '<span>OPhim</span></div>'
        );
        $btnOP.on('hover:enter', function () {
            searchAndPlay('ophim', card);
        });

        // ===== Nút 3: Torrent =====
        var engineLabel = getTorrentEngine() === 'aio' ? 'AIO' : 'Torrentio';
        var $btnTorrent = $(
            '<div class="full-start__button selector view--torrent-parser">' +
            '<svg viewBox="0 0 24 24" fill="none" width="22" height="22"' +
            ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<polyline points="8 12 12 16 16 12"/>' +
            '<line x1="12" y1="8" x2="12" y2="16"/>' +
            '</svg>' +
            '<span>' + engineLabel + '</span></div>'
        );
        $btnTorrent.on('hover:enter', function () {
            if (isSeries) askTorrentTV(card);
            else searchTorrent(card, null, null);
        });

        // Insert vào buttons container
        var $buttons = $ctx.find('.full-start__buttons');
        if ($buttons.length) {
            $buttons.append($btnKK);
            $buttons.append($btnOP);
            $buttons.append($btnTorrent);
        }
    });

    /* ============================================================
       KHỞI ĐỘNG
    ============================================================ */
    function start() {
        injectCSS();
        addSettingsMenu();
        console.log('[KKPhim Parser] v1.0 loaded ✅');
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }

})();