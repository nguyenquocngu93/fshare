(function () {
    'use strict';

    if (window.plugin_torrentio_v6_ready) return;
    window.plugin_torrentio_v6_ready = true;

    // Không filter providers → lấy TẤT CẢ nguồn Torrentio (TPB, YTS, 1337x, Rutor, Rutracker...)
    // sort=size → Torrentio sort theo size trước khi trả về
    // limitcount=100 → lấy tối đa 100 kết quả thay vì mặc định ~20
    var TORRENTIO_BASE = 'https://torrentio.strem.fun/sort=size|limitcount=100/stream';

    var JACRED_URL = 'jacred.xyz';
    var JACRED_KEY = '';

    // Các tracker được ưu tiên hiển thị đầu
    var PRIORITY_TRACKERS = ['rutor', 'rutracker'];

    /* ---- HELPERS ---- */
    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
               '&dn=' + encodeURIComponent(name || '') +
               '&tr=' + encodeURIComponent('udp://tracker.opentrackr.org:1337/announce') +
               '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce') +
               '&tr=' + encodeURIComponent('udp://exodus.desync.com:6969/announce');
    }

    function fmtBytes(b) {
        b = parseInt(b) || 0;
        if (b > 1e9) return (b / 1e9).toFixed(2) + ' GB';
        if (b > 1e6) return (b / 1e6).toFixed(0)  + ' MB';
        return b + ' B';
    }

    function parseSize(str) {
        if (!str) return 0;
        var m = String(str).match(/([\d.,]+)\s*(TB|GB|MB|KB)/i);
        if (!m) return 0;
        var n = parseFloat(m[1].replace(',', '.'));
        var u = m[2].toUpperCase();
        if (u === 'TB') return n * 1e12;
        if (u === 'GB') return n * 1e9;
        if (u === 'MB') return n * 1e6;
        if (u === 'KB') return n * 1e3;
        return n;
    }

    function isPriority(tracker) {
        var t = (tracker || '').toLowerCase();
        return PRIORITY_TRACKERS.some(function (p) { return t.indexOf(p) >= 0; });
    }

    function getImdbId(card) {
        var id = card.imdb_id
            || (card.ids && card.ids.imdb)
            || (card.external_ids && card.external_ids.imdb_id)
            || '';
        if (id && !/^tt/i.test(String(id))) id = 'tt' + id;
        return id || null;
    }

    function getMediaType(card) {
        if (card.type === 'tv' || card.type === 'series' ||
            card.number_of_seasons || card.first_air_date) return 'series';
        return 'movie';
    }

    function getTsUrl() {
        var url = Lampa.Storage.field('torrserver_url')
               || Lampa.Storage.field('ts_url')
               || Lampa.Storage.field('tsurl') || '';
        if (!url) return null;
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
        return url;
    }

    /* ---- SORT: rutor/rutracker trước, trong nhóm sort theo size lớn → nhỏ ---- */
    function sortResults(arr) {
        return arr.slice().sort(function (a, b) {
            var pa = isPriority(a.tracker) ? 1 : 0;
            var pb = isPriority(b.tracker) ? 1 : 0;
            if (pa !== pb) return pb - pa;       // priority group lên đầu
            return b.sizeNum - a.sizeNum;        // trong nhóm: size lớn → nhỏ
        });
    }

    /* ---- TORRENTIO ---- */
    function fetchTorrentio(imdbId, type, season, episode, onDone) {
        var path = type === 'series'
            ? '/series/' + imdbId + ':' + season + ':' + (episode || 1) + '.json'
            : '/movie/'  + imdbId + '.json';

        var net = new Lampa.Reguest();
        net.timeout(20000);
        net.silent(TORRENTIO_BASE + path,
            function (data) {
                var results = ((data && data.streams) || []).map(function (s) {
                    if (!s.infoHash) return null;
                    var lines = (s.title || '').split('\n');
                    var name  = lines[0] || '';
                    var info  = lines[1] || '';
                    var sizeM = info.match(/💾\s*([\d.,]+\s*[GMKB]+)/i);
                    var seedM = info.match(/👤\s*(\d+)/);
                    var srcM  = info.match(/⚙️\s*(\S+)/);
                    var sizeStr = sizeM ? sizeM[1].trim() : '';
                    return {
                        title:   name,
                        seeds:   seedM ? parseInt(seedM[1]) : 0,
                        size:    sizeStr,
                        sizeNum: parseSize(sizeStr),
                        tracker: srcM ? srcM[1] : 'Torrentio',
                        hash:    s.infoHash.toLowerCase(),
                        fileIdx: typeof s.fileIdx === 'number' ? s.fileIdx : 0,
                        magnet:  makeMagnet(s.infoHash, name)
                    };
                }).filter(Boolean);
                onDone(results);
            },
            function () { onDone([]); }
        );
    }

    /* ---- JAC.RED (dùng $.ajax dataType:json để tránh object parse issues) ---- */
    function fetchJacred(query, onDone) {
        var url = 'https://' + JACRED_URL +
            '/api/v2.0/indexers/all/results' +
            '?apikey=' + JACRED_KEY +
            '&Query=' + encodeURIComponent(query) +
            '&Category[]=2000' +
            '&Category[]=5000';

        $.ajax({
            url:      url,
            method:   'GET',
            dataType: 'json',
            timeout:  20000,
            success: function (data) {
                var results = ((data && data.Results) || []).map(function (r) {
                    var magnet = r.MagnetUri || r.Link || '';
                    if (!magnet) return null;
                    var hash = '';
                    var hm = magnet.match(/btih:([a-f0-9]+)/i);
                    if (hm) hash = hm[1].toLowerCase();
                    return {
                        title:   r.Title   || '',
                        seeds:   parseInt(r.Seeders)  || 0,
                        size:    fmtBytes(r.Size),
                        sizeNum: parseInt(r.Size) || 0,
                        tracker: r.Tracker || 'jac.red',
                        hash:    hash,
                        fileIdx: 0,
                        magnet:  magnet
                    };
                }).filter(Boolean);
                onDone(results);
            },
            error: function (xhr, status, err) {
                Lampa.Noty.show('jac.red lỗi: ' + status + ' ' + err);
                onDone([]);
            }
        });
    }

    /* ---- SOLIDTORRENTS ---- */
    function fetchSolid(query, onDone) {
        var url = 'https://solidtorrents.to/api/v1/search' +
            '?q=' + encodeURIComponent(query) +
            '&category=Video' +
            '&_=1';

        $.ajax({
            url:      url,
            method:   'GET',
            dataType: 'json',
            timeout:  20000,
            success: function (data) {
                var results = ((data && data.results) || []).map(function (r) {
                    var hash   = (r.infohash || '').toLowerCase();
                    var magnet = r.magnet || (hash ? makeMagnet(hash, r.title) : '');
                    if (!magnet) return null;
                    var swarm  = r.swarm || {};
                    return {
                        title:   r.title  || '',
                        seeds:   parseInt(swarm.seeders)  || 0,
                        size:    fmtBytes(r.size),
                        sizeNum: parseInt(r.size) || 0,
                        tracker: r.category || 'SolidTorrents',
                        hash:    hash,
                        fileIdx: 0,
                        magnet:  magnet
                    };
                }).filter(Boolean);
                results.sort(function (a, b) { return b.sizeNum - a.sizeNum; });
                onDone(results);
            },
            error: function (xhr, status, err) {
                Lampa.Noty.show('SolidTorrents lỗi: ' + status + ' ' + err);
                onDone([]);
            }
        });
    }

    /* ---- TORRSERVER PLAY ---- */
    function tsPlay(magnet, hash, fileIdx, title) {
        var tsUrl = getTsUrl();
        if (!tsUrl) { Lampa.Noty.show('⚠️ Chưa cài TorrServer URL'); return; }

        Lampa.Noty.show('Đang kết nối TorrServer...');
        $.ajax({
            url: tsUrl + '/torrents', method: 'POST',
            contentType: 'application/json', timeout: 12000,
            data: JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
            complete: function () {
                setTimeout(function () {
                    $.ajax({
                        url: tsUrl + '/torrents', method: 'POST',
                        contentType: 'application/json', timeout: 12000,
                        data: JSON.stringify({ action: 'get', link: magnet }),
                        success: function (d) {
                            var useHash = (d && d.hash) || hash;
                            var files   = (d && d.file_stats) || [];
                            var vids    = files.filter(function (f) {
                                return /\.(mp4|mkv|avi|mov|ts)$/i.test(f.path || '');
                            });
                            var list = vids.length ? vids : files;
                            if (list.length > 1) {
                                Lampa.Select.show({
                                    title: '📂 Chọn file',
                                    items: list.map(function (f, i) {
                                        return { title: (f.path || 'File').split('/').pop(),
                                                 index: f.id !== undefined ? f.id : i };
                                    }),
                                    onSelect: function (item) {
                                        Lampa.Player.play({ title: title,
                                            url: tsUrl + '/stream?link=' + encodeURIComponent(useHash) + '&index=' + item.index + '&play',
                                            poster: '' });
                                    },
                                    onBack: function () { Lampa.Controller.toggle('full'); }
                                });
                            } else {
                                Lampa.Player.play({ title: title,
                                    url: tsUrl + '/stream?link=' + encodeURIComponent(useHash) + '&index=' + (fileIdx || 0) + '&play',
                                    poster: '' });
                            }
                        },
                        error: function () {
                            Lampa.Player.play({ title: title,
                                url: tsUrl + '/stream?link=' + encodeURIComponent(hash) + '&index=' + (fileIdx || 0) + '&play',
                                poster: '' });
                        }
                    });
                }, 1500);
            }
        });
    }

    /* ---- HIỂN THỊ KẾT QUẢ ---- */
    function showResults(results, title) {
        if (!results.length) {
            Lampa.Noty.show('Không tìm thấy torrent nào 😔');
            return;
        }
        Lampa.Select.show({
            title: '🧲 ' + title + ' (' + results.length + ')',
            items: results.map(function (r) {
                var prefix = isPriority(r.tracker) ? '⭐ ' : '';
                return {
                    title:    prefix + '[' + r.tracker + '] ' + r.title,
                    subtitle: '👤 ' + r.seeds + '  💾 ' + r.size,
                    result:   r
                };
            }),
            onSelect: function (item) {
                var r = item.result;
                tsPlay(r.magnet, r.hash, r.fileIdx, r.title);
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ---- TÌM KIẾM GỘP ---- */
    function doSearch(card, season, episode) {
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);
        var year   = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query  = title + (year ? ' ' + year : '');

        Lampa.Noty.show('Đang tìm...');

        var combined = [];
        var pending  = 3;

        function onPart(arr) {
            combined = combined.concat(arr);
            if (--pending > 0) return;

            // Dedup theo hash
            var seen = {};
            combined = combined.filter(function (r) {
                var key = r.hash || r.title;
                if (!key || seen[key]) return false;
                seen[key] = true;
                return true;
            });

            // Sort: rutor/rutracker trước → rồi size lớn → nhỏ
            combined = sortResults(combined);

            showResults(combined, title);
        }

        // Torrentio
        if (imdbId) {
            fetchTorrentio(imdbId, type, season, episode, onPart);
        } else {
            var tmdbType = type === 'series' ? 'tv' : 'movie';
            var net = new Lampa.Reguest();
            net.timeout(8000);
            net.silent(
                'https://api.themoviedb.org/3/' + tmdbType + '/' + card.id +
                '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96',
                function (d) {
                    var id = d && d.imdb_id;
                    if (id) { card.imdb_id = id; fetchTorrentio(id, type, season, episode, onPart); }
                    else onPart([]);
                },
                function () { onPart([]); }
            );
        }

        // jac.red
        fetchJacred(query, onPart);

        // SolidTorrents
        fetchSolid(query, onPart);
    }

    function askSeasonAndSearch(card) {
        var ss = [];
        for (var s = 1; s <= 20; s++) ss.push({ title: 'Season ' + s, s: s });
        Lampa.Select.show({
            title: 'Chọn Season', items: ss,
            onSelect: function (si) {
                var ee = [];
                for (var e = 1; e <= 50; e++) ee.push({ title: 'Episode ' + e, e: e });
                Lampa.Select.show({
                    title: 'Season ' + si.s, items: ee,
                    onSelect: function (ei) { doSearch(card, si.s, ei.e); },
                    onBack:   function () { Lampa.Controller.toggle('full'); }
                });
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ---- HOOK ---- */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        var card = e.data && e.data.movie ? e.data.movie : (e.object && e.object.card);
        if (!card) return;
        var $ctx = e.object && e.object.activity ? e.object.activity.render()
                 : (e.object && e.object.render   ? e.object.render() : $('body'));
        if ($ctx.find('.view--torrentio6').length) return;

        var $btn = $(
            '<div class="full-start__button selector view--torrentio6">' +
            '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/>' +
            '<line x1="12" y1="8" x2="12" y2="16"/></svg>' +
            '<span>Torrentio</span></div>'
        );
        $btn.on('hover:enter', function () {
            if (getMediaType(card) === 'series') askSeasonAndSearch(card);
            else doSearch(card, null, null);
        });
        var $tor = $ctx.find('.view--torrent');
        if ($tor.length) $tor.after($btn);
        else $ctx.find('.full-start__buttons').append($btn);
    });

    console.log('[Torrentio+jac.red+SolidTorrents] v6.3 loaded');
})();
