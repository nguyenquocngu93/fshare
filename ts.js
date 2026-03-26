(function () {
    'use strict';

    if (window.plugin_torrentio_pro_ready) return;
    window.plugin_torrentio_pro_ready = true;

    /* ================= CONFIG ================= */

    var TORRENTIO_BASE = 'https://torrentio.strem.fun/sort=size|qualityfilter=480p/stream';
    var TS_URL = 'http://gren439e.tsarea.tv:8880';
    var PRIORITY = ['rutor', 'rutracker'];

    /* ================= HELPERS ================= */

    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash +
            '&dn=' + encodeURIComponent(name || '');
    }

    function parseSize(str) {
        if (!str) return 0;
        var m = String(str).match(/([\d.]+)\s*(GB|MB)/i);
        if (!m) return 0;
        var n = parseFloat(m[1]);
        return m[2].toUpperCase() === 'GB' ? n * 1e9 : n * 1e6;
    }

    function isPriority(tracker) {
        tracker = (tracker || '').toLowerCase();
        return PRIORITY.some(function (t) { return tracker.includes(t); });
    }

    function isBadQuality(name) {
        name = (name || '').toLowerCase();
        return ['cam','ts','hdcam','hdts'].some(function (k) {
            return name.includes(k);
        });
    }

    function getQualityScore(name) {
        name = (name || '').toLowerCase();
        if (name.includes('2160') || name.includes('4k')) return 3;
        if (name.includes('1080')) return 2;
        if (name.includes('720')) return 1;
        return 0;
    }

    function reguest(url, ok, fail) {
        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(url, ok, fail);
    }

    function getImdbId(card) {
        return card.imdb_id || (card.ids && card.ids.imdb);
    }

    function getMediaType(card) {
        return (card.number_of_seasons || card.first_air_date) ? 'series' : 'movie';
    }

    /* ================= TORRENTIO ================= */

    function fetchTorrentio(imdbId, type, season, episode, done) {
        var path = type === 'series'
            ? '/series/' + imdbId + ':' + season + ':' + (episode || 1) + '.json'
            : '/movie/' + imdbId + '.json';

        reguest(TORRENTIO_BASE + path, function (data) {
            var arr = ((data && data.streams) || []).map(function (s) {
                if (!s.infoHash) return null;

                return {
                    title: s.title || '',
                    seeds: 0,
                    sizeNum: parseSize(s.title),
                    tracker: 'torrentio',
                    hash: s.infoHash,
                    fileIdx: s.fileIdx || 0,
                    magnet: makeMagnet(s.infoHash, s.title)
                };
            }).filter(Boolean);

            done(arr);
        }, function () {
            done([]);
        });
    }

    /* ================= SORT ================= */

    function sortResults(arr) {
        return arr.slice().sort(function (a, b) {

            var pa = isPriority(a.tracker) ? 1 : 0;
            var pb = isPriority(b.tracker) ? 1 : 0;
            if (pa !== pb) return pb - pa;

            var qa = getQualityScore(a.title);
            var qb = getQualityScore(b.title);
            if (qa !== qb) return qb - qa;

            return (b.sizeNum || 0) - (a.sizeNum || 0);
        });
    }

    /* ================= TORRSERVER ================= */

    function tsPlay(magnet, hash, fileIdx, title) {

        $.ajax({
            url: TS_URL + '/torrent/add',
            method: 'POST',
            contentType: 'application/json',
            timeout: 15000,
            data: JSON.stringify({ "Link": magnet }),

            success: function (resp) {
                var data = (typeof resp === 'string') ? JSON.parse(resp) : resp;
                var h = data.hash || hash;

                if (!h) {
                    Lampa.Noty.show('Lỗi hash');
                    return;
                }

                var url = TS_URL +
                    '/stream?link=' + h +
                    '&index=' + (fileIdx || 0) +
                    '&play';

                Lampa.Player.play({
                    title: title,
                    url: url
                });
            },

            error: function () {
                Lampa.Noty.show('Không kết nối TorrServer');
            }
        });
    }

    /* ================= UI ================= */

    function showResults(results, title) {

        results = results.filter(function (r) {
            return !isBadQuality(r.title);
        });

        if (!results.length) {
            Lampa.Noty.show('Không có nguồn');
            return;
        }

        Lampa.Select.show({
            title: '🧲 ' + title,
            items: sortResults(results).map(function (r) {
                return {
                    title: '[' + r.tracker + '] ' + r.title,
                    result: r
                };
            }),
            onSelect: function (item) {
                var r = item.result;
                tsPlay(r.magnet, r.hash, r.fileIdx, r.title);
            }
        });
    }

    /* ================= MENU CHỌN TẬP ================= */

    function askEpisode(card) {
        var totalSeasons = card.number_of_seasons || 1;

        function pickEpisode(season) {
            var eps = [];
            for (var i = 1; i <= 50; i++) {
                eps.push({ title: 'Tập ' + i, e: i });
            }

            Lampa.Select.show({
                title: 'Season ' + season,
                items: eps,
                onSelect: function (e) {
                    run(season, e.e);
                }
            });
        }

        function run(season, episode) {
            var imdb = getImdbId(card);
            fetchTorrentio(imdb, 'series', season, episode, function (r) {
                showResults(r, card.title);
            });
        }

        if (totalSeasons === 1) {
            pickEpisode(1);
            return;
        }

        var seasons = [];
        for (var i = 1; i <= totalSeasons; i++) {
            seasons.push({ title: 'Season ' + i, s: i });
        }

        Lampa.Select.show({
            title: 'Chọn Season',
            items: seasons,
            onSelect: function (s) {
                pickEpisode(s.s);
            }
        });
    }

    /* ================= HOOK ================= */

    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        var card = e.data.movie;
        if (!card) return;

        var btn = $('<div class="full-start__button selector"><span>Torrent</span></div>');

        btn.on('hover:enter', function () {

            if (getMediaType(card) === 'series') {
                askEpisode(card);
            } else {
                var imdb = getImdbId(card);
                fetchTorrentio(imdb, 'movie', null, null, function (r) {
                    showResults(r, card.title);
                });
            }
        });

        $('.full-start__buttons').append(btn);
    });

    console.log('🔥 PRO Torrentio + TorrServer READY');

})();