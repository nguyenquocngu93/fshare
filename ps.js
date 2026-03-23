(function () {
    'use strict';

    if (window.plugin_torrentio_v5_ready) return;
    window.plugin_torrentio_v5_ready = true;

    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var KNABEN_API     = 'https://knaben.org/api/v1';

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

    /* ---- TORRENTIO ---- */
    function fetchTorrentio(imdbId, type, season, episode, onDone) {
        var path = type === 'series'
            ? '/stream/series/' + imdbId + ':' + season + ':' + (episode || 1) + '.json'
            : '/stream/movie/'  + imdbId + '.json';
        var net = new Lampa.Reguest();
        net.timeout(15000);
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
                    return {
                        title:   name,
                        seeds:   seedM ? parseInt(seedM[1]) : 0,
                        size:    sizeM ? sizeM[1].trim() : '',
                        tracker: srcM  ? srcM[1] : 'Torrentio',
                        hash:    s.infoHash.toLowerCase(),
                        fileIdx: typeof s.fileIdx === 'number' ? s.fileIdx : 0,
                        magnet:  makeMagnet(s.infoHash, name)
                    };
                }).filter(Boolean);
                results.sort(function (a, b) { return b.seeds - a.seeds; });
                onDone(results);
            },
            function () { onDone([]); }
        );
    }

    /* ---- KNABEN ---- */
    // Knaben yêu cầu POST JSON → dùng Lampa.Reguest.native() thay $.ajax
    // vì $.ajax POST có thể bị CORS block trong WebView
    function fetchKnaben(query, onDone) {
        var body = JSON.stringify({
            search_type:     'score',
            search_field:    'title',
            query:           query,
            order_by:        'seeders',
            order_direction: 'desc',
            from:            0,
            size:            50,
            hide_unsafe:     false,
            hide_xxx:        false
        });

        // Thử dùng XMLHttpRequest trực tiếp để có thể set method + body
        var xhr = new XMLHttpRequest();
        xhr.open('POST', KNABEN_API, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.timeout = 15000;

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;

            // DEBUG: hiện status
            if (xhr.status === 0) {
                Lampa.Noty.show('Knaben: bị block (status 0) — CORS');
                onDone([]);
                return;
            }

            if (xhr.status < 200 || xhr.status >= 300) {
                Lampa.Noty.show('Knaben HTTP ' + xhr.status);
                onDone([]);
                return;
            }

            var data;
            try { data = JSON.parse(xhr.responseText); }
            catch (e) {
                Lampa.Noty.show('Knaben: JSON parse lỗi');
                onDone([]);
                return;
            }

            var total = data.total && data.total.value;
            var hits  = data.hits || [];
            Lampa.Noty.show('Knaben: total=' + total + ' hits=' + hits.length);

            var results = hits.map(function (h) {
                var hash   = (h.hash || '').toLowerCase();
                var magnet = h.magnetUrl || (hash ? makeMagnet(hash, h.title) : '');
                if (!magnet) return null;
                return {
                    title:   h.title   || '',
                    seeds:   parseInt(h.seeders)  || 0,
                    size:    fmtBytes(h.bytes),
                    tracker: h.cachedOrigin || 'Knaben',
                    hash:    hash,
                    fileIdx: 0,
                    magnet:  magnet
                };
            }).filter(Boolean);
            results.sort(function (a, b) { return b.seeds - a.seeds; });
            onDone(results);
        };

        xhr.ontimeout = function () {
            Lampa.Noty.show('Knaben: timeout');
            onDone([]);
        };

        xhr.onerror = function () {
            Lampa.Noty.show('Knaben: XHR error (có thể CORS)');
            onDone([]);
        };

        try { xhr.send(body); }
        catch (e) {
            Lampa.Noty.show('Knaben send lỗi: ' + e.message);
            onDone([]);
        }
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
            title: '🧲 ' + title,
            items: results.map(function (r) {
                return {
                    title:   '[' + r.tracker + '] ' + r.title,
                    subtitle: '👤 ' + r.seeds + '  💾 ' + r.size,
                    result:  r
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
        var pending  = 2;

        function onPart(arr, src) {
            Lampa.Noty.show('✅ ' + src + ': ' + arr.length + ' kết quả');
            combined = combined.concat(arr);
            if (--pending > 0) return;
            var seen = {};
            combined = combined.filter(function (r) {
                var key = r.hash || r.title;
                if (!key || seen[key]) return false;
                seen[key] = true;
                return true;
            });
            combined.sort(function (a, b) { return b.seeds - a.seeds; });
            showResults(combined, title);
        }

        // Torrentio
        if (imdbId) {
            fetchTorrentio(imdbId, type, season, episode, function (arr) { onPart(arr, 'Torrentio'); });
        } else {
            var tmdbType = type === 'series' ? 'tv' : 'movie';
            var net = new Lampa.Reguest();
            net.timeout(8000);
            net.silent(
                'https://api.themoviedb.org/3/' + tmdbType + '/' + card.id +
                '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96',
                function (d) {
                    var id = d && d.imdb_id;
                    if (id) { card.imdb_id = id; fetchTorrentio(id, type, season, episode, function (arr) { onPart(arr, 'Torrentio'); }); }
                    else onPart([], 'Torrentio');
                },
                function () { onPart([], 'Torrentio'); }
            );
        }

        // Knaben
        fetchKnaben(query, function (arr) { onPart(arr, 'Knaben'); });
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
        if ($ctx.find('.view--torrentio5').length) return;

        var $btn = $(
            '<div class="full-start__button selector view--torrentio5">' +
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

    console.log('[Torrentio+Knaben] v5.1 loaded');
})();
