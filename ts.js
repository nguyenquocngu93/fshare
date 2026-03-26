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
        // Hardcode TorrServer URL, fallback sang Lampa Settings
        var hardcoded = 'http://gren439e.tsarea.tv:8880';
        var stored = Lampa.Storage.field('torrserver_url')
                  || Lampa.Storage.field('ts_url')
                  || Lampa.Storage.field('tsurl') || '';
        var url = hardcoded || stored;
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
                    // Ưu tiên MagnetUri, fallback dùng Link (.torrent URL)
                    // TorrServer nhận được cả 2 qua action:add
                    var link = r.MagnetUri || r.Link || '';
                    if (!link) return null;

                    // Lấy hash nếu có (từ magnet)
                    var hm   = link.match(/btih:([a-f0-9]+)/i);
                    var hash = hm ? hm[1].toLowerCase() : '';

                    return {
                        title:   r.Title   || '',
                        seeds:   parseInt(r.Seeders)  || 0,
                        size:    fmtBytes(r.Size),
                        sizeNum: parseInt(r.Size) || 0,
                        tracker: r.Tracker || 'maxvol',
                        hash:    hash,
                        fileIdx: null, // null = không biết file cụ thể → cho chọn
                        magnet:  link  // có thể là magnet: hoặc http:// .torrent
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
    function playUrl(url, title) {
        Lampa.Player.play({
            title:  title || '',
            url:    url,
            poster: ''
        });
    }

    
// ===== PLAY =====
function play(item) {
const name = encodeURIComponent(current?.title || current?.name || 'video');

const url = `${TORRSERVER}/stream/${name}?link=${item.infoHash}&index=${item.fileIdx}&play`;  

Lampa.Player.play({ url });

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

    /* ---- TORRENTIO: tìm bằng IMDB ID ---- */
    function searchTorrentio(card, season, episode) {
        var title    = card.title || card.name || '';
        var type     = getMediaType(card);
        var imdbId   = getImdbId(card);

        Lampa.Noty.show('Torrentio: đang tìm...');

        function run(id) {
            fetchTorrentio(id, type, season, episode, function (arr) {
                showResults(sortResults(arr), title);
            });
        }

        if (imdbId) {
            run(imdbId);
        } else {
            var tmdbType = type === 'series' ? 'tv' : 'movie';
            reguest(
                'https://api.themoviedb.org/3/' + tmdbType + '/' + card.id +
                '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96',
                function (d) {
                    var id = d && d.imdb_id;
                    if (id) { card.imdb_id = id; run(id); }
                    else Lampa.Noty.show('Không tìm thấy IMDB ID');
                },
                function () { Lampa.Noty.show('Lỗi lấy IMDB ID'); }
            );
        }
    }

    /* ---- JACKETT: tìm bằng tên+năm, chọn tập thủ công ---- */
    function searchJackett(card) {
        var title = card.title || card.name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query = title + (year ? ' ' + year : '');

        Lampa.Noty.show('Jackett: đang tìm...');
        fetchJacred(query, function (arr) {
            showResults(sortResults(arr), title);
        });
    }

    function getSeasonEpisodeCount(card, season) {
        if (card.seasons) {
            var s = card.seasons.filter(function(x){ return x.season_number === season; })[0];
            if (s && s.episode_count) return s.episode_count;
        }
        return 50;
    }

    // Torrentio: hỏi season+episode → tìm bằng IMDB ID
    function askTorrentio(card) {
        var totalSeasons = card.number_of_seasons || card.seasons_count || 1;

        function pickEpisode(s) {
            var totalEps = getSeasonEpisodeCount(card, s);
            var ee = [];
            for (var e = 1; e <= totalEps; e++) ee.push({ title: 'Tập ' + e, e: e });
            Lampa.Select.show({
                title: 'Season ' + s + ' — Chọn tập', items: ee,
                onSelect: function (ei) { searchTorrentio(card, s, ei.e); },
                onBack:   function () { Lampa.Controller.toggle('full'); }
            });
        }

        if (totalSeasons === 1) { pickEpisode(1); return; }

        var ss = [];
        for (var s = 1; s <= totalSeasons; s++) {
            var ep = getSeasonEpisodeCount(card, s);
            ss.push({ title: 'Season ' + s + ' (' + ep + ' tập)', s: s });
        }
        Lampa.Select.show({
            title: 'Torrentio — Chọn Season', items: ss,
            onSelect: function (si) { pickEpisode(si.s); },
            onBack:   function () { Lampa.Controller.toggle('full'); }
        });
    }

    /* ---- HOOK: 2 nút riêng ---- */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        var card = e.data && e.data.movie ? e.data.movie : (e.object && e.object.card);
        if (!card) return;
        var $ctx = e.object && e.object.activity ? e.object.activity.render()
                 : (e.object && e.object.render   ? e.object.render() : $('body'));
        if ($ctx.find('.view--torrentio7').length) return;

        var isSeries = getMediaType(card) === 'series';

        // Nút 1: Torrentio (tìm bằng IMDB ID)
        var $btn1 = $(
            '<div class="full-start__button selector view--torrentio7">' +
            '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/>' +
            '<line x1="12" y1="8" x2="12" y2="16"/></svg>' +
            '<span>Torrentio</span></div>'
        );
        $btn1.on('hover:enter', function () {
            if (isSeries) askTorrentio(card);
            else searchTorrentio(card, null, null);
        });

        // Nút 2: Jackett (tìm bằng tên, chọn tập thủ công)
        var $btn2 = $(
            '<div class="full-start__button selector view--jackett7">' +
            '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<span>Jackett</span></div>'
        );
        $btn2.on('hover:enter', function () {
            searchJackett(card);
        });

        var $anchor = $ctx.find('.view--torrent');
        if ($anchor.length) {
            $anchor.after($btn2);
            $anchor.after($btn1);
        } else {
            $ctx.find('.full-start__buttons').append($btn1).append($btn2);
        }
    });

    console.log('[Torrentio + Jackett] v8.0 loaded');
})();
