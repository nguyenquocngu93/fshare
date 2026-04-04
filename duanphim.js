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
       ONLINE MOD - KKPhim/OPhim
    ════════════════════════════════════════════════════════════ */
    
    function createOnlinePlugin(sourceKey) {
        var source = SOURCES[sourceKey];
        
        return {
            component: 'online',
            name: source.name,
            
            search: function (object, data) {
                var _this = this;
                var card  = object.movie;
                var title = card.title || card.name || '';
                var orig  = card.original_title || card.original_name || '';
                
                this.search_stat = 0;
                
                searchSource(source, orig || title, function (items) {
                    if (!items.length && orig && orig !== title) {
                        searchSource(source, title, function (items2) {
                            _this.processResults(items2, card, object);
                        });
                    } else {
                        _this.processResults(items, card, object);
                    }
                });
                
                return this.render();
            },
            
            processResults: function (items, card, object) {
                var _this = this;
                
                if (!items.length) {
                    this.empty();
                    return;
                }

                var bestItem = items[0];
                
                fetchDetail(source, bestItem.slug, function (data) {
                    var episodes = data.episodes || [];
                    if (!episodes.length) {
                        _this.empty();
                        return;
                    }

                    var isTV = getMediaType(card) === 'series';
                    var results = [];

                    episodes.forEach(function (server) {
                        var serverName = (server.server_name || '').replace(/^#+\s*/, '').trim() || 'Server';
                        var serverData = server.server_data || [];
                        
                        if (!serverData.length) return;

                        if (isTV) {
                            var translation = {
                                title: source.name + ' · ' + serverName,
                                quality: serverData.length + ' tập',
                                seasons: []
                            };

                            var seasonNum = extractSeasonNumber(bestItem.name, bestItem.slug);
                            var season = {
                                title: 'Season ' + seasonNum,
                                episode: []
                            };

                            serverData.forEach(function (ep, idx) {
                                season.episode.push({
                                    title: ep.name || ('Tập ' + (idx + 1)),
                                    season: seasonNum,
                                    episode: idx + 1,
                                    link: ep.link_m3u8 || ep.link_embed || ''
                                });
                            });

                            translation.seasons = [season];
                            results.push(translation);
                        } else {
                            var firstEp = serverData[0];
                            results.push({
                                title: source.name + ' · ' + serverName,
                                quality: firstEp.link_m3u8 ? 'M3U8' : 'Embed',
                                link: firstEp.link_m3u8 || firstEp.link_embed || ''
                            });
                        }
                    });

                    _this.build(results);
                    _this.append(object);
                });
            },
            
            build: function (data) {
                var _this = this;
                this.search_stat++;
                
                data.forEach(function (element) {
                    var item = Lampa.Template.get('online_mod', {
                        title: element.title,
                        quality: element.quality || '',
                        info: element.info || ''
                    });
                    
                    item.on('hover:enter', function () {
                        if (element.link) {
                            _this.start(element);
                        } else if (element.seasons) {
                            _this.showSeasons(element);
                        }
                    });
                    
                    _this.append(item);
                });
            },
            
            showSeasons: function (translation) {
                var _this = this;
                var items = [];
                
                translation.seasons.forEach(function (season) {
                    season.episode.forEach(function (ep) {
                        items.push({
                            title: ep.title,
                            quality: 'S' + padZero(ep.season) + 'E' + padZero(ep.episode),
                            link: ep.link,
                            season: ep.season,
                            episode: ep.episode
                        });
                    });
                });
                
                Lampa.Select.show({
                    title: translation.title,
                    items: items,
                    onSelect: function (item) {
                        _this.start(item);
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('content');
                    }
                });
            },
            
            start: function (element) {
                if (!element.link) {
                    Lampa.Noty.show('Không có link phát');
                    return;
                }
                
                Lampa.Player.play({
                    title: element.title,
                    url: element.link,
                    season: element.season,
                    episode: element.episode
                });
                
                Lampa.Player.playlist([{
                    title: element.title,
                    url: element.link
                }]);
            },
            
            append: function (item) {
                item.on('hover:focus', function (e) {
                    last = e.target;
                    var scroll = $(e.target).closest('.online');
                    if (scroll.length && typeof scroll.scrollTo === 'function') {
                        scroll.scrollTo(e.target);
                    }
                });
                
                this.html.append(item);
            },
            
            empty: function () {
                var empty = Lampa.Template.get('online_mod_empty');
                this.html.append(empty);
            },
            
            render: function () {
                this.html = Lampa.Template.get('online_mod');
                return this.html;
            }
        };
    }

    /* ════════════════════════════════════════════════════════════
       TORRENT - Torrentio/AIO/Jackett
    ════════════════════════════════════════════════════════════ */
    
    function createTorrentPlugin(name, fetchFn) {
        return {
            component: 'torrents',
            name: name,
            
            search: function (object, kinopoisk_id) {
                var _this = this;
                var card = object.movie;
                
                this.search_stat = 0;
                
                fetchFn(card, function (results) {
                    _this.build(results);
                    _this.append(object);
                });
                
                return this.render();
            },
            
            build: function (data) {
                var _this = this;
                this.search_stat++;
                
                data.forEach(function (element) {
                    var quality = element.quality ? element.quality + ' ' : '';
                    var info = element.info ? element.info : '';
                    
                    var item = Lampa.Template.get('torrent', {
                        title: element.title,
                        tracker: element.tracker || name,
                        quality: quality,
                        info: info
                    });
                    
                    item.on('hover:enter', function () {
                        _this.start(element);
                    });
                    
                    _this.append(item);
                });
            },
            
            start: function (element) {
                var tsUrl = getTsUrl();
                if (!tsUrl) {
                    Lampa.Noty.show('❌ Chưa cấu hình TorrServer!');
                    return;
                }
                
                if (!element.hash) {
                    Lampa.Noty.show('❌ Không có hash');
                    return;
                }
                
                var url = tsPlay(element.hash, element.fileIdx || 0, element.title);
                
                Lampa.Player.play({
                    title: element.title,
                    url: url
                });
                
                Lampa.Player.playlist([{
                    title: element.title,
                    url: url
                }]);
            },
            
            append: function (item) {
                item.on('hover:focus', function (e) {
                    last = e.target;
                    var scroll = $(e.target).closest('.torrent');
                    if (scroll.length && typeof scroll.scrollTo === 'function') {
                        scroll.scrollTo(e.target);
                    }
                });
                
                this.html.append(item);
            },
            
            render: function () {
                this.html = Lampa.Template.get('torrent');
                return this.html;
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
                        info: (seeds ? '👤 ' + seeds + '  ' : '') + '💾 ' + fmtBytes(size),
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
       REGISTER TO LAMPA.MANIFEST
    ════════════════════════════════════════════════════════════ */
    
    function registerPlugins() {
        // Online plugins
        Lampa.Manifest.plugins.push(createOnlinePlugin('kkphim'));
        Lampa.Manifest.plugins.push(createOnlinePlugin('ophim'));
        
        // Torrent plugins
        var engine = getTorrentEngine();
        var torrentioName = engine === 'aio' ? 'AIOStreams' : 'Torrentio';
        
        Lampa.Manifest.plugins.push(
            createTorrentPlugin(torrentioName, fetchTorrentioResults)
        );
        
        Lampa.Manifest.plugins.push(
            createTorrentPlugin('Jackett', fetchJackettResults)
        );

        console.log('[KKPhim Parser] ✅ Registered: KKPhim, OPhim, ' + torrentioName + ', Jackett');
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
            field: { name: '📦 Version 3.2.0', description: 'Correct Manifest Integration' }
        });
    }

    /* ════════════════════════════════════════════════════════════
       START
    ════════════════════════════════════════════════════════════ */
    
    function start() {
        initSettings();
        registerPlugins();
        console.log('[KKPhim Parser] v3.2.0 — Manifest Integration ✅');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();