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
                (onFail || function () {})(code ? 'HTTP ' + code : (b || 'Error'));
            }
        );
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

        // 1 tập → phát luôn
        if (totalEps === 1) {
            for (var i = 0; i < episodes.length; i++) {
                if (episodes[i].server_data && episodes[i].server_data.length) {
                    var ep = episodes[i].server_data[0];
                    var link = ep.link_m3u8 || ep.link_embed || '';
                    if (link) Lampa.Player.play({ title: title, url: link });
                    else Lampa.Noty.show('Không có link phát');
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

        // Nhiều server → chọn
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
            return { title: title + ' - ' + (ep.name || ''), url: ep.link_m3u8 || ep.link_embed || '' };
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
                if (!link) { Lampa.Noty.show('Không có link phát'); return; }
                Lampa.Player.play({ title: title + ' - ' + (item.ep.name || ''), url: link });
                Lampa.Player.playlist(playlist, item.idx);
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
       TORRENTIO / AIO
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
            name:    name,
            hash:    (st.infoHash || '').toLowerCase(),
            fileIdx: typeof st.fileIdx === 'number' ? st.fileIdx : 0,
            url:     st.url || '',
            size:    sizeStr,
            sizeNum: parseSize(sizeStr),
            seeds:   seedM ? parseInt(seedM[1]) : 0,
            source:  srcM ? srcM[1] : '',
            magnet:  st.infoHash ? makeMagnet(st.infoHash, name) : ''
        };
    }

    function showStreamsMenu(streams, title) {
        if (!streams || !streams.length) { Lampa.Noty.show('Không tìm thấy torrent'); return; }

        var tsUrl = getTsUrl();
        var engineLabel = getTorrentEngine() === 'aio' ? 'AIO' : 'Torrentio';
        var parsed = streams.map(parseStream).filter(function(s){ return s.hash; })
            .sort(function (a, b) { return b.sizeNum - a.sizeNum; });

        Lampa.Select.show({
            title: '🧲 ' + engineLabel + ': ' + title + ' (' + parsed.length + ')' + (tsUrl ? ' → TS' : ''),
            items: parsed.map(function (s) {
                return {
                    title:    s.name,
                    subtitle: '👤 ' + s.seeds + '  💾 ' + s.size + (s.source ? '  ⚙️ ' + s.source : ''),
                    stream:   s
                };
            }),
            onSelect: function (item) {
                var s = item.stream;
                if (tsUrl && s.hash) {
                    tsPlay(s.magnet, s.hash, s.fileIdx, title);
                } else if (s.url) {
                    Lampa.Player.play({ title: title, url: s.url });
                } else {
                    Lampa.Noty.show(s.hash ? 'Chưa cấu hình TorrServer!' : 'Không có link');
                }
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ---- TORRSERVER PLAY ---- */
    function tsPlay(magnet, hash, fileIdx, title) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; }

        Lampa.Noty.show('Gửi TorrServer...');

        var name = encodeURIComponent(title || 'video');
        var playUrl = tsUrl + '/stream/' + name + '?link=' + hash + '&index=' + (fileIdx || 0) + '&play';

        // Thêm torrent trước
        var net = new Lampa.Reguest();
        net.timeout(10000);

        try {
            var headers = { 'Content-Type': 'application/json' };
            var pass = getTsPass();
            if (pass) headers['Authorization'] = 'Basic ' + btoa('admin:' + pass);

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
                timeout: 10000,
                success: function () {
                    Lampa.Player.play({ title: title, url: playUrl });
                },
                error: function () {
                    // Vẫn thử phát
                    Lampa.Player.play({ title: title, url: playUrl });
                }
            });
        } catch (e) {
            // Fallback phát trực tiếp
            Lampa.Player.play({ title: title, url: playUrl });
        }
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
                var epLabel = '';
                if (season && episode) epLabel = ' S' + padZero(season) + 'E' + padZero(episode);
                showStreamsMenu(streams, title + epLabel);
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
        var totalSeasons = card.number_of_seasons || card.seasons_count || 1;

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
            var ep = getSeasonEpCount(card, s);
            ss.push({ title: 'Season ' + s + ' (' + ep + ' tập)', s: s });
        }
        Lampa.Select.show({
            title: 'Chọn Season', items: ss,
            onSelect: function (item) { pickEpisode(item.s); },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ============================================================
       HOOK: 3 nút vào card info
       Copy đúng pattern từ plugin torrentio v7.2
    ============================================================ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        // Lấy card - đúng cách của torrentio v7.2
        var card = e.data && e.data.movie ? e.data.movie : (e.object && e.object.card);
        if (!card) return;

        // Lấy render context - đúng cách
        var $ctx = e.object && e.object.activity ? e.object.activity.render()
                 : (e.object && e.object.render ? e.object.render() : $('body'));

        // Tránh duplicate
        if ($ctx.find('.view--kkphim').length) return;

        var isSeries = getMediaType(card) === 'series';

        // Nút KKPhim
        var $btnKK = $(
            '<div class="full-start__button selector view--kkphim">' +
            '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="2" y="2" width="20" height="20" rx="3"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/></svg>' +
            '<span>KKPhim</span></div>'
        );
        $btnKK.on('hover:enter', function () { searchAndPlay('kkphim', card); });

        // Nút OPhim
        var $btnOP = $(
            '<div class="full-start__button selector view--ophim">' +
            '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor" stroke="none"/></svg>' +
            '<span>OPhim</span></div>'
        );
        $btnOP.on('hover:enter', function () { searchAndPlay('ophim', card); });

        // Nút Torrent
        var engineLabel = getTorrentEngine() === 'aio' ? 'AIO' : 'Torrentio';
        var $btnT = $(
            '<div class="full-start__button selector view--kkparser-torrent">' +
            '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/>' +
            '<line x1="12" y1="8" x2="12" y2="16"/></svg>' +
            '<span>' + engineLabel + '</span></div>'
        );
        $btnT.on('hover:enter', function () {
            if (isSeries) askTorrentTV(card);
            else searchTorrent(card, null, null);
        });

        // Insert - dùng đúng cách của torrentio v7.2
        var $anchor = $ctx.find('.view--torrent');
        if ($anchor.length) {
            $anchor.after($btnT);
            $anchor.after($btnOP);
            $anchor.after($btnKK);
        } else {
            $ctx.find('.full-start__buttons').append($btnKK).append($btnOP).append($btnT);
        }
    });

    /* ============================================================
       SETTINGS COMPONENT
    ============================================================ */
    Lampa.Component.add('kkparser_settings', function () {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html   = $('<div class="settings-list"></div>');
        var self   = this;

        this.create = function () {
            this.build();
            scroll.append(html);
        };

        this.build = function () {
            html.empty();

            html.append('<div class="settings-param-title"><span>⚙️ KKPhim Parser</span></div>');

            addInput('TorrServer URL', 'Ví dụ: 192.168.1.100:8090', 'torrserver_url');
            addInput('TorrServer Password', 'Để trống nếu không có', 'torrserver_pass');
            addInput('Torrentio Config', 'Dán link manifest hoặc config', 'torrentio_config');
            addInput('AIOStreams URL', 'Dán full URL manifest', 'aio_url');

            addSelect('Nguồn Torrent', 'torrent_engine', [
                { title: 'Torrentio', value: 'torrentio' },
                { title: 'AIOStreams', value: 'aio' }
            ]);

            // Test button
            var testBtn = $('<div class="settings-param selector"><div class="settings-param__name">🧪 Test TorrServer</div><div class="settings-param__value">▶</div></div>');
            testBtn.on('hover:enter', function () {
                var url = getTsUrl();
                if (!url) { Lampa.Noty.show('Chưa nhập TorrServer URL'); return; }
                Lampa.Noty.show('Đang kiểm tra...');

                $.ajax({
                    url: url + '/echo',
                    type: 'GET',
                    timeout: 5000,
                    success: function () { Lampa.Noty.show('✅ Kết nối OK!'); },
                    error: function (xhr) {
                        // TorrServer trả về 200 với text "Ok" nhưng jQuery có thể parse lỗi
                        if (xhr.status === 200) Lampa.Noty.show('✅ Kết nối OK!');
                        else Lampa.Noty.show('❌ Lỗi: HTTP ' + (xhr.status || 'timeout'));
                    }
                });
            });
            html.append(testBtn);

            html.append('<div class="settings-param-title" style="opacity:0.4"><span>v1.1</span></div>');
        };

        function addInput(label, placeholder, key) {
            var current = getSetting(key) || '';
            var show = current || placeholder;
            if (key.indexOf('pass') > -1 && current) show = '••••••';

            var item = $('<div class="settings-param selector">' +
                '<div class="settings-param__name">' + label + '</div>' +
                '<div class="settings-param__value">' + show + '</div></div>');

            item.on('hover:enter', function () {
                Lampa.Input.edit({
                    title: label,
                    value: current,
                    free: true,
                    nosave: true
                }, function (newVal) {
                    setSetting(key, newVal);
                    Lampa.Noty.show('Đã lưu');
                    self.build();
                });
            });
            html.append(item);
        }

        function addSelect(label, key, options) {
            var current = getSetting(key) || options[0].value;
            var currentLabel = current;
            options.forEach(function (o) { if (o.value === current) currentLabel = o.title; });

            var item = $('<div class="settings-param selector">' +
                '<div class="settings-param__name">' + label + '</div>' +
                '<div class="settings-param__value">' + currentLabel + '</div></div>');

            item.on('hover:enter', function () {
                Lampa.Select.show({
                    title: label,
                    items: options.map(function (o) {
                        return { title: (o.value === current ? '✅ ' : '') + o.title, value: o.value };
                    }),
                    onSelect: function (sel) {
                        setSetting(key, sel.value);
                        Lampa.Noty.show('Đã chọn: ' + sel.title.replace('✅ ', ''));
                        self.build();
                    },
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
            });
            html.append(item);
        }

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause   = function () {};
        this.stop    = function () {};
        this.render  = function () { return scroll.render(); };
        this.destroy = function () { scroll.destroy(); };
    });

    /* ============================================================
       MENU SIDEBAR
    ============================================================ */
    function addMenu() {
        if ($('.menu__item[data-action="kkparser"]').length) return;

        var icon = '<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="2"/><path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="currentColor"/></svg>';

        var menuItem = $('<li class="menu__item selector" data-action="kkparser">' +
            '<div class="menu__ico">' + icon + '</div>' +
            '<div class="menu__text">KKPhim Parser</div></li>');

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim Parser',
                component: 'kkparser_settings',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(menuItem);
    }

    /* ============================================================
       CSS
    ============================================================ */
    function injectCSS() {
        if (document.getElementById('kkparser-css')) return;
        var s = document.createElement('style');
        s.id = 'kkparser-css';
        s.textContent =
            '.selectbox .selectbox-item__title{white-space:pre-wrap!important;overflow:visible!important;text-overflow:unset!important;-webkit-line-clamp:unset!important;display:block!important}' +
            '.selectbox .selectbox-item{height:auto!important;max-height:none!important;padding:.8em 1.5em!important}';
        document.head.appendChild(s);
    }

    /* ============================================================
       START
    ============================================================ */
    function start() {
        injectCSS();
        addMenu();
        console.log('[KKPhim Parser] v1.1 loaded');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();