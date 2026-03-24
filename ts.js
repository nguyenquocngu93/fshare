(function () {
    'use strict';

    if (window.plugin_torrentio_v72_ready) return;
    window.plugin_torrentio_v72_ready = true;

    var TORRENTIO_BASE = 'https://torrentio.strem.fun/sort=size|qualityfilter=480p/stream';

    var JACRED_URL = 'https://jac.maxvol.pro';
    var JACRED_KEY = '1';

    var PRIORITY = ['rutor', 'rutracker'];

    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
            '&dn=' + encodeURIComponent(name || '');
    }

    function fmtBytes(b) {
        b = parseInt(b) || 0;
        if (b > 1e9) return (b / 1e9).toFixed(2) + ' GB';
        if (b > 1e6) return (b / 1e6).toFixed(0) + ' MB';
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
        var id = card.imdb_id || (card.ids && card.ids.imdb) || '';
        if (id && !/^tt/i.test(String(id))) id = 'tt' + id;
        return id || null;
    }

    function getMediaType(card) {
        if (card.type === 'tv' || card.number_of_seasons) return 'series';
        return 'movie';
    }

    function getTsUrl() {
        var url = 'http://gren439e.tsarea.tv:8880';
        return url.replace(/\/$/, '');
    }

    function reguest(url, onOk, onFail) {
        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(url,
            function (data) { onOk(data); },
            function (a, b) {
                var code = (a && a.status) ? a.status : 0;
                onFail('HTTP ' + code);
            }
        );
    }

    /* ---------------- TORRENTIO ---------------- */

    function fetchTorrentio(imdbId, type, season, episode, onDone) {
        var path = type === 'series'
            ? '/series/' + imdbId + ':' + season + ':' + (episode || 1) + '.json'
            : '/movie/' + imdbId + '.json';

        reguest(TORRENTIO_BASE + path, function (data) {
            var results = ((data && data.streams) || []).map(function (s) {
                if (!s.infoHash) return null;

                var name = (s.title || '').split('\n')[0];

                return {
                    title: name,
                    seeds: 0,
                    size: '',
                    sizeNum: 0,
                    tracker: 'torrentio',
                    hash: s.infoHash.toLowerCase(),
                    fileIdx: s.fileIdx || 0,
                    magnet: makeMagnet(s.infoHash, name)
                };
            }).filter(Boolean);

            onDone(results);
        }, function () {
            onDone([]);
        });
    }

    /* ---------------- JACKETT ---------------- */

    function fetchJacred(query, onDone) {
        var url = JACRED_URL +
            '/api/v2.0/indexers/all/results?apikey=' + JACRED_KEY +
            '&Query=' + encodeURIComponent(query);

        reguest(url, function (data) {
            var d = (typeof data === 'string') ? JSON.parse(data) : data;

            var results = ((d && d.Results) || []).map(function (r) {

                var link = r.MagnetUri || r.Link || '';
                if (!link) return null;

                var hm = link.match(/btih:([a-f0-9]+)/i);
                var hash = hm ? hm[1].toLowerCase() : '';

                return {
                    title: r.Title || '',
                    seeds: parseInt(r.Seeders) || 0,
                    size: fmtBytes(r.Size),
                    sizeNum: parseInt(r.Size) || 0,
                    tracker: r.Tracker || 'jackett',
                    hash: hash,
                    fileIdx: 0,
                    magnet: link
                };
            }).filter(Boolean);

            onDone(results);
        }, function () {
            onDone([]);
        });
    }

    /* ---------------- SORT ---------------- */

    function sortResults(arr) {
        return arr.slice().sort(function (a, b) {
            var pa = isPriority(a.tracker) ? 1 : 0;
            var pb = isPriority(b.tracker) ? 1 : 0;
            if (pa !== pb) return pb - pa;
            return b.sizeNum - a.sizeNum;
        });
    }

    /* ---------------- TORRSERVER FIX ---------------- */

    function tsPlay(magnet, hash, fileIdx, title) {
        var tsUrl = getTsUrl();
        if (!tsUrl) {
            Lampa.Noty.show('Chưa có TorrServer');
            return;
        }

        $.ajax({
            url: tsUrl + '/torrent/add', // ✅ FIX API
            method: 'POST',
            contentType: 'application/json',
            timeout: 12000,
            data: JSON.stringify({
                link: magnet
            }),
            success: function (res) {

                var addedHash = res && res.hash;

                // ✅ FIX lỗi hash null
                if (!addedHash && !hash) {
                    Lampa.Noty.show('Không lấy được hash');
                    return;
                }

                var useHash = addedHash || hash;

                var fname = encodeURIComponent((title || 'video') + '.mkv');

                var url = tsUrl + '/stream/' + fname +
                    '?link=' + useHash +
                    '&index=' + (fileIdx || 0) +
                    '&play';

                Lampa.Player.play({
                    title: title,
                    url: url
                });
            }
        });
    }

    /* ---------------- UI ---------------- */

    function showResults(results, title) {
        if (!results.length) {
            Lampa.Noty.show('Không có link');
            return;
        }

        Lampa.Select.show({
            title: title,
            items: results.map(function (r) {
                return {
                    title: '[' + r.tracker + '] ' + r.title,
                    subtitle: '👤 ' + r.seeds + ' 💾 ' + r.size,
                    result: r
                };
            }),
            onSelect: function (item) {
                var r = item.result;
                tsPlay(r.magnet, r.hash, r.fileIdx, r.title);
            }
        });
    }

    /* ---------------- SEARCH ---------------- */

    function search(card) {
        var title = card.title || card.name || '';
        var imdb = getImdbId(card);
        var type = getMediaType(card);

        fetchTorrentio(imdb, type, 1, 1, function (t1) {
            fetchJacred(title, function (t2) {
                showResults(sortResults(t1.concat(t2)), title);
            });
        });
    }

    /* ---------------- HOOK ---------------- */

    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        var card = e.data.movie;
        if (!card) return;

        var btn = $('<div class="full-start__button selector">🧲 Torrent</div>');

        btn.on('hover:enter', function () {
            search(card);
        });

        $('.full-start__buttons').append(btn);
    });

    console.log('Plugin FIXED loaded');

})();