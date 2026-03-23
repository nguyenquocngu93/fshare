(function () {
    'use strict';

    /* ============================================================
       Torrentio Parser for Lampa  —  v1.0.0

       Dùng Torrentio public API (giống Stremio addon):
         Movies:  GET torrentio.strem.fun/stream/movie/tt{imdb}.json
         Series:  GET torrentio.strem.fun/stream/series/tt{imdb}:{s}:{e}.json

       Trả về JSON { streams: [ { title, infoHash, ... } ] }
       → build magnet link → phát qua TorrServer trong Lampa

       Không cần proxy, không cần scrape HTML ✅
    ============================================================ */

    if (window.plugin_torrentio_lampa_ready) return;
    window.plugin_torrentio_lampa_ready = true;

    var BASE = 'https://torrentio.strem.fun';

    // Trackers thêm vào magnet để tăng tốc độ kết nối
    var TRACKERS = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.stealth.si:80/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://exodus.desync.com:6969/announce',
        'udp://tracker.leechers-paradise.org:6969/announce',
        'http://tracker.gbitt.info/announce',
        'https://tracker.fastdownload.xyz/announce'
    ].map(function (t) { return '&tr=' + encodeURIComponent(t); }).join('');

    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
               '&dn=' + encodeURIComponent(name || '') + TRACKERS;
    }


    /* ============================================================
       LẤY IMDB ID TỪ CARD
       Lampa card có thể có imdb_id trực tiếp hoặc trong ids object
    ============================================================ */
    function getImdbId(card) {
        // Thử các vị trí khác nhau
        var id = card.imdb_id
            || (card.ids && card.ids.imdb)
            || card.external_ids && card.external_ids.imdb_id
            || '';
        if (!id && card.id) {
            // Thử lấy từ TMDB nếu chưa có
            return null;
        }
        // Đảm bảo có prefix "tt"
        if (id && !/^tt/i.test(String(id))) id = 'tt' + id;
        return id || null;
    }

    function getMediaType(card) {
        var type = card.type || card.media_type || '';
        if (type === 'tv' || type === 'series' || card.number_of_seasons || card.first_air_date) {
            return 'series';
        }
        return 'movie';
    }


    /* ============================================================
       GỌI TORRENTIO API
    ============================================================ */
    function fetchTorrentio(imdbId, type, season, episode, onDone) {
        var path;
        if (type === 'series' && season) {
            path = '/stream/series/' + imdbId + ':' + season + ':' + (episode || 1) + '.json';
        } else {
            path = '/stream/movie/' + imdbId + '.json';
        }

        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(
            BASE + path,
            function (data) {
                var streams = (data && data.streams) || [];
                onDone(streams);
            },
            function () { onDone([]); }
        );
    }


    /* ============================================================
       PARSE STREAM TITLE
       Torrentio format: "Source\nQuality 💾 Size 👤 Seeds ⚙️ Tracker"
    ============================================================ */
    function parseStream(stream) {
        var title = stream.title || '';
        var lines = title.split('\n');

        // Dòng 1: tên file / chất lượng
        var nameLine = lines[0] || '';
        // Dòng 2: thông tin (size, seeds, source)
        var infoLine = lines[1] || lines[0] || '';

        // Extract quality từ tên
        var quality = '';
        var qMatch = nameLine.match(/\b(2160p|4K|1080p|720p|480p|BluRay|BDRip|WEB-DL|WEBRip|HDTV|CAM)\b/i);
        if (qMatch) quality = qMatch[1];

        // Extract size
        var sizeMatch = infoLine.match(/💾\s*([\d.,]+\s*[GMKB]+)/i);
        var size = sizeMatch ? sizeMatch[1].trim() : '';

        // Extract seeds
        var seedMatch = infoLine.match(/👤\s*(\d+)/);
        var seeds = seedMatch ? parseInt(seedMatch[1]) : 0;

        // Source/tracker
        var srcMatch = infoLine.match(/⚙️\s*(.+?)(\s|$)/);
        var src = srcMatch ? srcMatch[1].trim() : '';

        // Tên hiển thị gọn
        var displayName = (quality || 'Unknown') +
            (size  ? '  💾 ' + size  : '') +
            (seeds ? '  👤 ' + seeds : '') +
            (src   ? '  [' + src + ']' : '');

        return {
            display: displayName,
            quality: quality,
            size:    size,
            seeds:   seeds,
            src:     src,
            hash:    stream.infoHash || '',
            fileIdx: stream.fileIdx  || 0,
            rawName: nameLine
        };
    }


    /* ============================================================
       HIỂN THỊ KẾT QUẢ
    ============================================================ */
    function showStreams(streams, cardTitle) {
        if (!streams.length) {
            Lampa.Noty.show('Torrentio: Không tìm thấy torrent 😔');
            return;
        }

        // Parse + sort theo seeds
        var parsed = streams.map(function (s) {
            var p = parseStream(s);
            p._stream = s;
            return p;
        });
        parsed.sort(function (a, b) { return b.seeds - a.seeds; });

        var items = parsed.map(function (p) {
            return {
                title:  p.display || p.rawName || 'Unknown',
                parsed: p
            };
        });

        Lampa.Select.show({
            title: '🧲 ' + (cardTitle || 'Torrents'),
            items: items,
            onSelect: function (item) {
                var p = item.parsed;
                if (!p.hash) {
                    Lampa.Noty.show('Không có hash torrent');
                    return;
                }
                var magnet = makeMagnet(p.hash, p.rawName || cardTitle);
                Lampa.Player.play({
                    title:  cardTitle || p.rawName || 'Torrent',
                    url:    magnet,
                    poster: ''
                });
            },
            onBack: function () {
                Lampa.Controller.toggle('full');
            }
        });
    }


    /* ============================================================
       LẤY IMDB ID QUA TMDB NẾU CHƯA CÓ
    ============================================================ */
    function resolveImdbAndPlay(card) {
        var imdbId = getImdbId(card);
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);

        if (imdbId) {
            doFetch(imdbId, type, card, title);
            return;
        }

        // Chưa có IMDB ID → lấy từ TMDB external IDs
        Lampa.Noty.show('Đang lấy IMDB ID...');
        var tmdbId = card.id || '';
        var tmdbType = (type === 'series') ? 'tv' : 'movie';
        var net = new Lampa.Reguest();
        net.timeout(10000);
        net.silent(
            'https://api.themoviedb.org/3/' + tmdbType + '/' + tmdbId +
            '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96',
            function (data) {
                var id = data && data.imdb_id;
                if (id) {
                    doFetch(id, type, card, title);
                } else {
                    Lampa.Noty.show('Không tìm thấy IMDB ID cho phim này');
                }
            },
            function () {
                Lampa.Noty.show('Lỗi khi lấy IMDB ID');
            }
        );
    }

    function doFetch(imdbId, type, card, title) {
        var season  = card._season  || null;
        var episode = card._episode || null;

        if (type === 'series' && !season) {
            // Series: hỏi season/episode
            askSeasonEpisode(function (s, e) {
                Lampa.Noty.show('Đang tìm torrent...');
                fetchTorrentio(imdbId, 'series', s, e, function (streams) {
                    showStreams(streams, title + ' S' + s + 'E' + e);
                });
            });
        } else {
            Lampa.Noty.show('Đang tìm torrent...');
            fetchTorrentio(imdbId, type, season, episode, function (streams) {
                showStreams(streams, title);
            });
        }
    }


    /* ============================================================
       HỎI SEASON/EPISODE CHO SERIES
    ============================================================ */
    function askSeasonEpisode(onDone) {
        // Tạo list season 1-20
        var seasons = [];
        for (var s = 1; s <= 20; s++) {
            seasons.push({ title: 'Season ' + s, s: s });
        }

        Lampa.Select.show({
            title: 'Chọn Season',
            items: seasons,
            onSelect: function (sItem) {
                var eps = [];
                for (var e = 1; e <= 50; e++) {
                    eps.push({ title: 'Episode ' + e, e: e });
                }
                Lampa.Select.show({
                    title: 'Season ' + sItem.s + ' — Chọn Episode',
                    items: eps,
                    onSelect: function (eItem) {
                        onDone(sItem.s, eItem.e);
                    },
                    onBack: function () { Lampa.Controller.toggle('full'); }
                });
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }


    /* ============================================================
       HOOK VÀO TRANG CHI TIẾT PHIM
       Thêm nút "Torrentio" cạnh các nút khác
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

        if ($ctx.find('.view--torrentio').length) return;

        var $btn = $(
            '<div class="full-start__button selector view--torrentio">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"' +
            ' fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5"' +
            ' stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>' +
            '<path d="M8 12l4 4 4-4"/>' +
            '<path d="M12 8v8"/>' +
            '</svg>' +
            '<span>Torrentio</span>' +
            '</div>'
        );

        $btn.on('hover:enter', function () {
            resolveImdbAndPlay(card);
        });

        // Chèn vào hàng buttons
        var $torBtn = $ctx.find('.view--torrent');
        if ($torBtn.length) $torBtn.after($btn);
        else $ctx.find('.full-start__buttons').append($btn);
    });


    /* ============================================================
       SETTINGS — Cấu hình nguồn Torrentio
    ============================================================ */
    function addSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addParam({
            component: 'parser',
            param: {
                name:    'torrentio_providers',
                type:    'select',
                values: {
                    'all':         'Tất cả nguồn',
                    'yts':         'YTS (phim chất lượng cao)',
                    '1337x':       '1337x',
                    'thepiratebay':'The Pirate Bay',
                    'eztv':        'EZTV (TV Shows)',
                    'torrentgalaxy':'TorrentGalaxy',
                    'kickasstorrents':'KickassTorrents'
                },
                default: 'all'
            },
            field: {
                name:        '🧲 Torrentio — Nguồn',
                description: 'Chọn nguồn torrent ưu tiên'
            },
            onChange: function (val) {
                Lampa.Storage.set('torrentio_providers', val);
            }
        });
    }

    // Khởi động
    function start() {
        addSettings();
        console.log('[Torrentio] v1.0.0 loaded');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });

})();
