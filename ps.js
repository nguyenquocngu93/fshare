(function () {
    'use strict';

    if (window.plugin_torrentio_v72_ready) return;
    window.plugin_torrentio_v72_ready = true;

    /* ============================================================
       Torrentio + jac.maxvol.pro for Lampa  v7.2
       Tất cả dùng Lampa.Reguest (bypass CORS trong APK)
    ============================================================ */

    // Config user: sort=size, bỏ 480p, timeout ngắn hơn
    var TORRENTIO_BASE = 'https://torrentio.strem.fun/sort=size|qualityfilter=480p/stream';

    var JACRED_URL = 'https://jac.maxvol.pro';
    var JACRED_KEY = '1';

    var SOLID_BASE = 'https://solidtorrents.to';

    var PRIORITY = ['rutor', 'rutracker'];

    /* ---- HELPERS ---- */
    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
               '&dn=' + encodeURIComponent(name || '') +
               '&tr=' + encodeURIComponent('udp://tracker.opentrackr.org:1337/announce') +
               '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce') +
               '&tr=' + encodeURIComponent('udp://tracker.torrent.eu.org:451/announce') +
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
        switch (m[2].toUpperCase()) {
            case 'TB': return n * 1e12;
            case 'GB': return n * 1e9;
            case 'MB': return n * 1e6;
            case 'KB': return n * 1e3;
        }
        return n;
    }

    function isPriority(tracker) {
        var t = (tracker || '').toLowerCase();
        return PRIORITY.some(function (p) { return t.indexOf(p) >= 0; });
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

    // Lampa.Reguest wrapper — luôn trả object/string, không bị CORS
    function reguest(url, onOk, onFail) {
        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(url,
            function (data) { onOk(data); },
            function (a, b) {
                var code = (a && a.status) ? a.status : 0;
                onFail('HTTP ' + code + (b ? ' ' + b : ''));
            }
        );
    }

    /* ---- TORRENTIO ---- */
    function fetchTorrentio(imdbId, type, season, episode, onDone) {
        var path = type === 'series'
            ? '/series/' + imdbId + ':' + season + ':' + (episode || 1) + '.json'
            : '/movie/'  + imdbId + '.json';

        reguest(TORRENTIO_BASE + path,
            function (data) {
                var results = ((data && data.streams) || []).map(function (s) {
                    if (!s.infoHash) return null;
                    var lines   = (s.title || '').split('\n');
                    var name    = lines[0] || '';
                    var info    = lines[1] || '';
                    var sizeM   = info.match(/💾\s*([\d.,]+\s*[GMKB]+)/i);
                    var seedM   = info.match(/👤\s*(\d+)/);
                    var srcM    = info.match(/⚙️\s*(\S+)/);
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
            function (e) {
                Lampa.Noty.show('Torrentio lỗi: ' + e);
                onDone([]);
            }
        );
    }

    /* ---- JAC.RED ---- */
    function fetchJacred(query, onDone) {
        var url = JACRED_URL +
            '/api/v2.0/indexers/all/results' +
            '?apikey=' + JACRED_KEY +
            '&Query='  + encodeURIComponent(query) +
            '&Category[]=2000' +
            '&Category[]=5000';

        reguest(url,
            function (data) {
                var d = (typeof data === 'string') ? JSON.parse(data) : data;
                var results = ((d && d.Results) || []).map(function (r) {
                    // Chỉ dùng MagnetUri, bỏ qua .torrent link (r.Link)
                    var magnet = r.MagnetUri || '';
                    // Nếu không có magnet → thử build từ Guid (một số Jackett instance để hash ở đây)
                    if (!magnet) {
                        var guidHash = (r.Guid || '').match(/btih:([a-f0-9]+)/i);
                        if (guidHash) magnet = makeMagnet(guidHash[1], r.Title);
                    }
                    if (!magnet) return null;

                    var hm   = magnet.match(/btih:([a-f0-9]+)/i);
                    var hash = hm ? hm[1].toLowerCase() : '';
                    if (!hash) return null; // không có hash → skip

                    return {
                        title:   r.Title   || '',
                        seeds:   parseInt(r.Seeders)  || 0,
                        size:    fmtBytes(r.Size),
                        sizeNum: parseInt(r.Size) || 0,
                        tracker: r.Tracker || 'maxvol',
                        hash:    hash,
                        fileIdx: 0,
                        magnet:  magnet
                    };
                }).filter(Boolean);
                onDone(results);
            },
            function (e) {
                Lampa.Noty.show('Jackett lỗi: ' + e);
                onDone([]);
            }
        );
    }


    /* ---- SORT ---- */
    function sortResults(arr) {
        return arr.slice().sort(function (a, b) {
            var pa = isPriority(a.tracker) ? 1 : 0;
            var pb = isPriority(b.tracker) ? 1 : 0;
            if (pa !== pb) return pb - pa;
            return b.sizeNum - a.sizeNum;
        });
    }

    /* ---- PLAY URL ---- */
    // Dùng đúng player đã cài trong Lampa Settings
    // Nếu user set MX Player → mở thẳng MX Player, không qua Lampa player
    function playUrl(url, title) {
        Lampa.Player.play({
            title:  title || '',
            url:    url,
            poster: ''
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
                                        var url = tsUrl + '/stream?link=' + encodeURIComponent(useHash) + '&index=' + item.index + '&play';
                                        playUrl(url, title);
                                    },
                                    onBack: function () { Lampa.Controller.toggle('full'); }
                                });
                            } else {
                                var url = tsUrl + '/stream?link=' + encodeURIComponent(useHash) + '&index=' + (fileIdx || 0) + '&play';
                                playUrl(url, title);
                            }
                        },
                        error: function () {
                            var url = tsUrl + '/stream?link=' + encodeURIComponent(hash) + '&index=' + (fileIdx || 0) + '&play';
                            playUrl(url, title);
                        }
                    });
                }, 1500);
            }
        });
    }

    /* ---- HIỂN THỊ ---- */
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

        // Torrentio: tìm bằng IMDB ID (chính xác nhất)
        // Jackett (jac.maxvol.pro): tìm bằng tên + năm
        var jacQuery = title + (year ? ' ' + year : '');

        Lampa.Noty.show('Đang tìm...');

        var combined = [];
        var pending  = 2;

        function onPart(arr) {
            combined = combined.concat(arr);
            if (--pending > 0) return;
            var seen = {};
            combined = combined.filter(function (r) {
                var key = r.hash || r.title;
                if (!key || seen[key]) return false;
                seen[key] = true;
                return true;
            });
            combined = sortResults(combined);
            showResults(combined, title);
        }

        // 1. Torrentio — bằng IMDB ID
        function runTorrentio(id) {
            fetchTorrentio(id, type, season, episode, onPart);
        }

        if (imdbId) {
            runTorrentio(imdbId);
        } else {
            // Fetch IMDB ID từ TMDB trước
            var tmdbType = type === 'series' ? 'tv' : 'movie';
            reguest(
                'https://api.themoviedb.org/3/' + tmdbType + '/' + card.id +
                '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96',
                function (d) {
                    var id = d && d.imdb_id;
                    if (id) { card.imdb_id = id; runTorrentio(id); }
                    else onPart([]); // Torrentio skip
                },
                function () { onPart([]); }
            );
        }

        // 2. Jackett — bằng tên + năm (độc lập với Torrentio)
        fetchJacred(jacQuery, onPart);
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
        if ($ctx.find('.view--torrentio7').length) return;

        var $btn = $(
            '<div class="full-start__button selector view--torrentio7">' +
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

    console.log('[Torrentio+jac.maxvol.pro] v7.2 loaded');
})();
