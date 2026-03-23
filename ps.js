(function () {
    'use strict';

    /* ============================================================
       Torrentio + Knaben Parser for Lampa  —  v4.0.0

       Cách đúng: Override Lampa.Api.sources.parser
       → Lampa native "torrents" component tự xử lý UI/scroll/filter

       Flow:
         nút "Torrentio" trên trang phim
           → Lampa.Activity.push({ component: 'torrents', movie: card })
           → Lampa gọi Lampa.Api.sources.parser.search(params, ok, fail)
           → plugin trả về { Results: [...] } đúng Jackett format
           → Lampa hiển thị với UI native (scroll, filter, sort đầy đủ) ✅
    ============================================================ */

    if (window.plugin_torrentio_v4_ready) return;
    window.plugin_torrentio_v4_ready = true;

    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var KNABEN_API     = 'https://knaben.eu/api/v1';

    /* ============================================================
       HELPERS
    ============================================================ */
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
        if (b > 1e12) return (b / 1e12).toFixed(2) + ' TB';
        if (b > 1e9)  return (b / 1e9).toFixed(2)  + ' GB';
        if (b > 1e6)  return (b / 1e6).toFixed(0)  + ' MB';
        return b + ' B';
    }

    // Chuyển size string "4.5 GB" → bytes
    function parseSize(str) {
        if (!str) return 0;
        str = String(str).trim();
        var m = str.match(/([\d.,]+)\s*(TB|GB|MB|KB|B)/i);
        if (!m) return 0;
        var n = parseFloat(m[1].replace(',', '.'));
        var u = m[2].toUpperCase();
        if (u === 'TB') return Math.round(n * 1e12);
        if (u === 'GB') return Math.round(n * 1e9);
        if (u === 'MB') return Math.round(n * 1e6);
        if (u === 'KB') return Math.round(n * 1e3);
        return Math.round(n);
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


    /* ============================================================
       FETCH: TORRENTIO → Jackett Results format
    ============================================================ */
    function fetchTorrentio(imdbId, type, season, episode, onDone) {
        var path = type === 'series'
            ? '/stream/series/' + imdbId + ':' + season + ':' + (episode || 1) + '.json'
            : '/stream/movie/'  + imdbId + '.json';

        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(TORRENTIO_BASE + path,
            function (data) {
                var streams = (data && data.streams) || [];
                var results = [];

                streams.forEach(function (s) {
                    if (!s.infoHash) return;
                    var lines  = (s.title || '').split('\n');
                    var name   = lines[0] || '';
                    var info   = lines[1] || '';
                    var sizeM  = info.match(/💾\s*([\d.,]+\s*[GMKB]+)/i);
                    var seedM  = info.match(/👤\s*(\d+)/);
                    var srcM   = info.match(/⚙️\s*(\S+)/);
                    var sizeStr = sizeM ? sizeM[1].trim() : '';

                    // Jackett format
                    results.push({
                        Title:       name,
                        Seeders:     seedM ? parseInt(seedM[1]) : 0,
                        Leechers:    0,
                        Size:        parseSize(sizeStr),
                        Tracker:     srcM ? srcM[1] : 'Torrentio',
                        MagnetUri:   makeMagnet(s.infoHash, name),
                        Link:        '',
                        PublishDate: ''
                    });
                });

                results.sort(function (a, b) { return b.Seeders - a.Seeders; });
                onDone(results);
            },
            function () { onDone([]); }
        );
    }


    /* ============================================================
       FETCH: KNABEN → Jackett Results format
    ============================================================ */
    function fetchKnaben(query, onDone) {
        $.ajax({
            url: KNABEN_API, method: 'POST',
            contentType: 'application/json', dataType: 'json', timeout: 15000,
            data: JSON.stringify({
                search_type: '100%', search_field: 'title',
                query: query, order_by: 'seeders', order_direction: 'desc',
                categories: [2000000, 2010000, 2030000],
                from: 0, size: 50, hide_unsafe: true,
                seconds_since_last_seen: 604800
            }),
            success: function (data) {
                var hits    = (data && data.hits) || [];
                var results = hits.map(function (h) {
                    var hash   = (h.hash || '').toLowerCase();
                    var magnet = h.magnetUrl || (hash ? makeMagnet(hash, h.title) : '');
                    if (!magnet) return null;
                    return {
                        Title:       h.title    || '',
                        Seeders:     parseInt(h.seeders)  || 0,
                        Leechers:    parseInt(h.leechers) || 0,
                        Size:        parseInt(h.bytes)    || 0,
                        Tracker:     h.cachedOrigin || 'Knaben',
                        MagnetUri:   magnet,
                        Link:        '',
                        PublishDate: (h.date || '').slice(0, 10)
                    };
                }).filter(Boolean);
                results.sort(function (a, b) { return b.Seeders - a.Seeders; });
                onDone(results);
            },
            error: function () { onDone([]); }
        });
    }


    /* ============================================================
       OVERRIDE Lampa.Api.sources.parser
       Lampa gọi parser.search(params, onSuccess, onError)
       params = { query, movie, ... }
       onSuccess({ Results: [...] })
    ============================================================ */
    var _originalParser = null;

    function installParser() {
        // Lưu parser gốc (Jackett/Prowlarr) nếu có
        if (Lampa.Api && Lampa.Api.sources) {
            _originalParser = Lampa.Api.sources.parser || null;

            Lampa.Api.sources.parser = {
                search: function (params, onSuccess, onError) {
                    var movie  = params.movie || params.card || {};
                    var query  = params.query
                              || movie.title
                              || movie.name
                              || movie.original_title
                              || '';
                    var year   = (movie.release_date || movie.first_air_date || '').slice(0, 4);
                    var type   = getMediaType(movie);
                    var imdbId = getImdbId(movie);
                    var season  = params.season  || null;
                    var episode = params.episode || null;

                    // Tìm đồng thời Torrentio + Knaben
                    var combined = [];
                    var pending  = 2;

                    function onPart(arr) {
                        combined = combined.concat(arr);
                        if (--pending > 0) return;

                        // Dedup theo MagnetUri hash
                        var seen = {};
                        combined = combined.filter(function (r) {
                            var key = (r.MagnetUri || '').match(/btih:([a-f0-9]+)/i);
                            key = key ? key[1] : r.Title;
                            if (!key || seen[key]) return false;
                            seen[key] = true;
                            return true;
                        });
                        combined.sort(function (a, b) { return b.Seeders - a.Seeders; });

                        onSuccess({ Results: combined });
                    }

                    // Torrentio — ưu tiên IMDB ID
                    if (imdbId) {
                        fetchTorrentio(imdbId, type, season, episode, onPart);
                    } else {
                        // Lấy IMDB ID từ TMDB rồi mới fetch
                        var tmdbType = type === 'series' ? 'tv' : 'movie';
                        var net = new Lampa.Reguest();
                        net.timeout(8000);
                        net.silent(
                            'https://api.themoviedb.org/3/' + tmdbType + '/' + movie.id +
                            '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96',
                            function (d) {
                                var id = d && d.imdb_id;
                                if (id) {
                                    movie.imdb_id = id;
                                    fetchTorrentio(id, type, season, episode, onPart);
                                } else {
                                    onPart([]);
                                }
                            },
                            function () { onPart([]); }
                        );
                    }

                    // Knaben — dùng title + year
                    var kQuery = query + (year ? ' ' + year : '');
                    fetchKnaben(kQuery, onPart);
                },

                // Lampa cũng gọi các method này — giữ lại nếu parser gốc có
                clear: function () {
                    if (_originalParser && _originalParser.clear) _originalParser.clear();
                }
            };
        }
    }


    /* ============================================================
       NÚT "TORRENTIO" TRÊN TRANG PHIM
       Click → mở native 'torrents' component của Lampa
       (scroll, filter, sort đều do Lampa xử lý)
    ============================================================ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        var card = e.data && e.data.movie
            ? e.data.movie
            : (e.object && e.object.card);
        if (!card) return;

        var $ctx = e.object && e.object.activity
            ? e.object.activity.render()
            : (e.object && e.object.render ? e.object.render() : null);
        if (!$ctx) $ctx = $('body');

        if ($ctx.find('.view--torrentio4').length) return;

        var $btn = $(
            '<div class="full-start__button selector view--torrentio4">' +
            '<svg viewBox="0 0 24 24" fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5"' +
            ' stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<polyline points="8 12 12 16 16 12"/>' +
            '<line x1="12" y1="8" x2="12" y2="16"/>' +
            '</svg>' +
            '<span>Torrentio</span>' +
            '</div>'
        );

        $btn.on('hover:enter', function () {
            var type = getMediaType(card);
            if (type === 'series') {
                askSeasonEpisode(card, function (s, ep) {
                    openTorrents(card, s, ep);
                });
            } else {
                openTorrents(card, null, null);
            }
        });

        var $tor = $ctx.find('.view--torrent');
        if ($tor.length) $tor.after($btn);
        else $ctx.find('.full-start__buttons').append($btn);
    });


    function openTorrents(card, season, episode) {
        // Lưu season/episode vào card để parser đọc được
        card._torrentio_season  = season;
        card._torrentio_episode = episode;

        // Dùng native torrents component → scroll/filter đầy đủ
        Lampa.Activity.push({
            component: 'torrents',
            title:     card.title || card.name || '',
            movie:     card,
            card:      card,
            source:    'tmdb'
        });
    }


    function askSeasonEpisode(card, onDone) {
        var seasons = [];
        for (var s = 1; s <= 20; s++) seasons.push({ title: 'Season ' + s, s: s });

        Lampa.Select.show({
            title: 'Chọn Season',
            items: seasons,
            onSelect: function (si) {
                var eps = [];
                for (var e = 1; e <= 50; e++) eps.push({ title: 'Episode ' + e, e: e });
                Lampa.Select.show({
                    title: 'Season ' + si.s,
                    items: eps,
                    onSelect: function (ei) { onDone(si.s, ei.e); },
                    onBack:   function () { Lampa.Controller.toggle('full'); }
                });
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }


    /* ============================================================
       KHỞI ĐỘNG
    ============================================================ */
    function start() {
        // Cài parser ngay khi app sẵn sàng
        installParser();
        console.log('[Torrentio+Knaben v4] Parser installed');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });

    // Patch thêm: khi parser.search được gọi, đọc season/episode từ card
    // (Lampa truyền params.movie nên ta lấy được _torrentio_season)
    var _origInstall = installParser;
    installParser = function () {
        _origInstall();
        var _search = Lampa.Api.sources.parser.search.bind(Lampa.Api.sources.parser);
        Lampa.Api.sources.parser.search = function (params, ok, fail) {
            var movie = params.movie || params.card || {};
            // Đọc season/episode đã lưu trước đó
            if (!params.season  && movie._torrentio_season)  params.season  = movie._torrentio_season;
            if (!params.episode && movie._torrentio_episode) params.episode = movie._torrentio_episode;
            _search(params, ok, fail);
        };
    };

})();
