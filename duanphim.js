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

    /* ════════════════════════════════════════════════════════════
       TORRSERVER
    ════════════════════════════════════════════════════════════ */
    function tsHeaders() {
        var h = { 'Content-Type': 'application/json' };
        var p = getTsPass();
        if (p) h['Authorization'] = 'Basic ' + btoa('admin:' + p);
        return h;
    }

    function tsPlay(hash, fileIdx, title) {
        var tsUrl = getTsUrl();
        if (!tsUrl) return '';
        var name = encodeURIComponent(title || 'video');
        return tsUrl + '/stream/' + name + '?link=' + hash + '&index=' + fileIdx + '&play';
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

    /* ════════════════════════════════════════════════════════════
       LAMPA ONLINE SOURCE - KKPhim/OPhim
    ════════════════════════════════════════════════════════════ */
    
    function createOnlineSource(sourceKey) {
        var source = SOURCES[sourceKey];
        
        var component = {
            name: source.name,
            component: 'kkparser_online_' + sourceKey,
            
            search: function (object, callback) {
                var card  = object.movie;
                var title = card.title || card.name || '';
                var orig  = card.original_title || card.original_name || '';
                
                searchSource(source, orig || title, function (items) {
                    if (!items.length && orig && orig !== title) {
                        searchSource(source, title, function (items2) {
                            processOnlineResults(source, items2, card, callback);
                        });
                    } else {
                        processOnlineResults(source, items, card, callback);
                    }
                });
            },
            
            extendChoice: function (saved) {
                Lampa.Arrays.extend(saved, {
                    quality: {},
                    info: ''
                });
            },
            
            reset: function () {},
            
            append: function (presence) {
                presence.append = true;
            }
        };
        
        return component;
    }

    function processOnlineResults(source, items, card, callback) {
        if (!items.length) {
            callback({ results: [] });
            return;
        }

        var bestItem = items[0];
        
        fetchDetail(source, bestItem.slug, function (data) {
            var episodes = data.episodes || [];
            if (!episodes.length) {
                callback({ results: [] });
                return;
            }

            var isTV = getMediaType(card) === 'series';
            var results = [];

            episodes.forEach(function (server) {
                var serverName = (server.server_name || '').replace(/^#+\s*/, '').trim() || 'Server';
                var serverData = server.server_data || [];
                
                if (!serverData.length) return;

                if (isTV) {
                    // TV: Tạo translation cho mỗi server
                    var translation = {
                        title: source.name + ' · ' + serverName,
                        quality: serverData.length + ' tập',
                        seasons: []
                    };

                    var seasonNum = extractSeasonNumber(bestItem.name, bestItem.slug);
                    var season = {
                        id: seasonNum,
                        title: 'Season ' + seasonNum,
                        episodes: []
                    };

                    serverData.forEach(function (ep, idx) {
                        season.episodes.push({
                            id: idx + 1,
                            title: ep.name || ('Tập ' + (idx + 1)),
                            media: {
                                url: ep.link_m3u8 || ep.link_embed || ''
                            }
                        });
                    });

                    translation.seasons.push(season);
                    results.push(translation);
                } else {
                    // Movie: Link trực tiếp
                    var firstEp = serverData[0];
                    results.push({
                        title: source.name + ' · ' + serverName,
                        quality: firstEp.link_m3u8 ? 'M3U8' : 'Embed',
                        url: firstEp.link_m3u8 || firstEp.link_embed || ''
                    });
                }
            });

            callback({ results: results });
        });
    }

    /* ════════════════════════════════════════════════════════════
       LAMPA TORRENT SOURCE - Torrentio/AIO/Jackett
    ════════════════════════════════════════════════════════════ */
    
    function createTorrentSource(name, fetchFn) {
        return {
            name: name,
            component: 'kkparser_torrent_' + name.toLowerCase().replace(/\s/g, ''),
            
            search: function (object, kinopoisk_id, data, callback) {
                var card = object.movie;
                
                fetchFn(card, function (results) {
                    var torrents = results.map(function (r) {
                        return {
                            title: r.title,
                            quality: r.quality || '',
                            info: r.info || '',
                            size: r.size || 0,
                            seeds: r.seeds || 0,
                            hash: r.hash,
                            magnet: r.magnet,
                            tracker: r.tracker || name,
                            fileIdx: r.fileIdx || 0
                        };
                    });
                    
                    callback({ results: torrents });
                });
            },
            
            extendChoice: function (saved) {
                Lampa.Arrays.extend(saved, {
                    quality: {},
                    info: ''
                });
            },
            
            reset: function () {},
            
            append: function (presence) {
                presence.append = true;
            }
        };
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
                            info: seeds ? seeds + ' seeds · ' + sz : sz,
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

    function fetchJackettResults(card, callback) {
        var url = getJackettUrl(), key = getJackettKey();
        if (!url || !key) {
            callback([]);
            return;
        }

        var title = card.title || card.name || '';
        var orig  = card.original_title || card.original_name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query = (orig || title) + (year ? ' ' + year : '');

        reguest(
            url + '/api/v2.0/indexers/all/results?apikey=' + 
            encodeURIComponent(key) +
            '&Query=' + encodeURIComponent(query) + 
            '&Category[]=2000&Category[]=5000',
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
                        info: seeds ? seeds + ' seeds · ' + fmtBytes(size) : fmtBytes(size),
                        size: size,
                        seeds: seeds,
                        hash: hash,
                        magnet: link,
                        tracker: r.Tracker || 'Jackett'
                    };
                }).filter(Boolean);

                results.sort(function (a, b) { return b.size - a.size; });
                callback(results);
            },
            function () { callback([]); }
        );
    }

    /* ════════════════════════════════════════════════════════════
       REGISTER TO LAMPA
    ════════════════════════════════════════════════════════════ */
    
    function registerSources() {
        // Register ONLINE sources (KKPhim, OPhim)
        Lampa.Component.add('kkparser_online_kkphim', createOnlineSource('kkphim'));
        Lampa.Component.add('kkparser_online_ophim', createOnlineSource('ophim'));
        
        // Register TORRENT sources
        var engine = getTorrentEngine();
        var torrentioName = engine === 'aio' ? 'AIOStreams' : 'Torrentio';
        
        Lampa.Component.add('kkparser_torrent_' + torrentioName.toLowerCase().replace(/\s/g, ''), 
            createTorrentSource(torrentioName, fetchTorrentioResults)
        );
        
        Lampa.Component.add('kkparser_torrent_jackett', 
            createTorrentSource('Jackett', fetchJackettResults)
        );

        console.log('[KKPhim Parser] Registered:', 'KKPhim, OPhim, ' + torrentioName + ', Jackett');
    }

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
            field: { name: '📦 Version 3.1.0', description: 'Component Integration' }
        });
    }

    /* ════════════════════════════════════════════════════════════
       START
    ════════════════════════════════════════════════════════════ */
    
    function start() {
        initSettings();
        registerSources();
        console.log('[KKPhim Parser] v3.1.0 — Component Integration ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();