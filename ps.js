(function () {
    'use strict';

    /* ============================================================
       Torrentio → TorrServer Plugin for Lampa  —  v2.0.0

       Flow đúng:
         1. Gọi Torrentio API → lấy infoHash + fileIdx
         2. Gọi TorrServer API: POST /torrents (add)
         3. Gọi TorrServer API: POST /torrents (get) → lấy file list
         4. Chọn file video → tạo stream URL
         5. Lampa.Player.play() với HTTP URL trực tiếp ✅

       TorrServer REST API:
         POST /torrents { action:"add",  link:"magnet:...", title:"", save_to_db:false }
         POST /torrents { action:"get",  link:"magnet:..." }  → { hash, title, file_stats:[...] }
         GET  /stream?link={hash}&index={fileIdx}&play        → stream video
    ============================================================ */

    if (window.plugin_torrentio_v2_ready) return;
    window.plugin_torrentio_v2_ready = true;

    var TORRENTIO_BASE = 'https://torrentio.strem.fun';

    /* ============================================================
       LẤY TORRSERVER URL TỪ LAMPA SETTINGS
    ============================================================ */
    function getTorrServerUrl() {
        // Lampa lưu TorrServer URL trong storage
        var url = Lampa.Storage.field('torrserver_url')
               || Lampa.Storage.field('ts_url')
               || Lampa.Storage.field('tsurl')
               || '';

        if (!url) return null;

        // Đảm bảo không có trailing slash
        url = url.replace(/\/$/, '');

        // Đảm bảo có protocol
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;

        return url;
    }


    /* ============================================================
       TORRSERVER API CALLS (dùng $.ajax vì cùng local network)
    ============================================================ */

    // Thêm torrent vào TorrServer
    function tsAdd(tsUrl, magnet, title, onDone, onFail) {
        $.ajax({
            url:         tsUrl + '/torrents',
            method:      'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action:      'add',
                link:        magnet,
                title:       title || '',
                poster:      '',
                save_to_db:  false
            }),
            timeout:  15000,
            success:  function (data) { onDone(data); },
            error:    function (xhr, s, e) {
                // TorrServer đôi khi trả lỗi nhưng vẫn đã add → thử get
                if (onFail) onFail(s + ' ' + e);
            }
        });
    }

    // Lấy thông tin torrent (bao gồm file list)
    function tsGet(tsUrl, magnet, onDone, onFail) {
        $.ajax({
            url:         tsUrl + '/torrents',
            method:      'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'get',
                link:   magnet
            }),
            timeout:  15000,
            success:  function (data) { onDone(data); },
            error:    function (xhr, s, e) {
                if (onFail) onFail(s + ' ' + e);
            }
        });
    }

    // Tạo stream URL từ TorrServer
    function tsStreamUrl(tsUrl, hash, fileIndex) {
        return tsUrl + '/stream?link=' + encodeURIComponent(hash) +
               '&index=' + (fileIndex || 0) + '&play';
    }

    // Add rồi get → trả về { hash, files }
    function addAndGetFiles(tsUrl, magnet, title, onDone, onFail) {
        tsAdd(tsUrl, magnet, title,
            function () {
                // Sau khi add, đợi TorrServer xử lý metadata rồi get
                setTimeout(function () {
                    tsGet(tsUrl, magnet,
                        function (data) {
                            var hash  = data && data.hash;
                            var files = data && data.file_stats;
                            onDone(hash, files || []);
                        },
                        function (e) {
                            // Get thất bại → thử dùng hash từ magnet trực tiếp
                            var hashMatch = magnet.match(/btih:([a-f0-9]+)/i);
                            var hash = hashMatch ? hashMatch[1].toLowerCase() : '';
                            onDone(hash, []);
                        }
                    );
                }, 1500);
            },
            function () {
                // Add thất bại → thử get luôn (có thể đã tồn tại)
                tsGet(tsUrl, magnet,
                    function (data) {
                        var hash  = data && data.hash;
                        var files = data && data.file_stats;
                        onDone(hash, files || []);
                    },
                    function () {
                        // Cả hai đều fail → fallback dùng hash từ magnet
                        var hashMatch = magnet.match(/btih:([a-f0-9]+)/i);
                        var hash = hashMatch ? hashMatch[1].toLowerCase() : '';
                        if (hash) onDone(hash, []);
                        else onFail('Không kết nối được TorrServer');
                    }
                );
            }
        );
    }


    /* ============================================================
       TORRENTIO API
    ============================================================ */
    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
               '&dn=' + encodeURIComponent(name || '') +
               '&tr=' + encodeURIComponent('udp://tracker.opentrackr.org:1337/announce') +
               '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce') +
               '&tr=' + encodeURIComponent('udp://tracker.torrent.eu.org:451/announce');
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

    function fetchTorrentio(imdbId, type, season, episode, onDone) {
        var path = type === 'series'
            ? '/stream/series/' + imdbId + ':' + season + ':' + (episode || 1) + '.json'
            : '/stream/movie/' + imdbId + '.json';

        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(
            TORRENTIO_BASE + path,
            function (data) { onDone((data && data.streams) || []); },
            function ()     { onDone([]); }
        );
    }

    function parseStreamInfo(stream) {
        var title = stream.title || '';
        var lines = title.split('\n');
        var line0 = lines[0] || '';
        var line1 = lines[1] || '';

        var qMatch = line0.match(/\b(2160p|4K|1080p|720p|480p|BluRay|BDRip|WEB-DL|WEBRip|HDTV)\b/i);
        var sizeM  = line1.match(/💾\s*([\d.,]+\s*[GMKB]+)/i);
        var seedM  = line1.match(/👤\s*(\d+)/);
        var srcM   = line1.match(/⚙️\s*(\S+)/);

        return {
            quality: qMatch  ? qMatch[1]     : '',
            size:    sizeM   ? sizeM[1]      : '',
            seeds:   seedM   ? parseInt(seedM[1]) : 0,
            src:     srcM    ? srcM[1]       : '',
            name:    line0,
            hash:    stream.infoHash || '',
            fileIdx: typeof stream.fileIdx === 'number' ? stream.fileIdx : 0
        };
    }


    /* ============================================================
       PHÁT VIDEO
    ============================================================ */
    function playStream(tsUrl, magnet, hash, fileIndex, title) {
        Lampa.Noty.show('Đang kết nối TorrServer...');

        addAndGetFiles(tsUrl, magnet, title,
            function (resolvedHash, files) {
                var useHash  = resolvedHash || hash;
                var useIndex = fileIndex;

                if (files.length > 1) {
                    // Có nhiều file → cho chọn
                    var videoFiles = files.filter(function (f) {
                        return /\.(mp4|mkv|avi|mov|wmv|m4v|ts|flv)$/i.test(f.path || '');
                    });
                    var list = (videoFiles.length ? videoFiles : files).map(function (f, i) {
                        return {
                            title: f.path || ('File ' + i),
                            index: f.id !== undefined ? f.id : i
                        };
                    });

                    Lampa.Select.show({
                        title: '📂 Chọn file',
                        items: list,
                        onSelect: function (item) {
                            var streamUrl = tsStreamUrl(tsUrl, useHash, item.index);
                            Lampa.Player.play({ title: title, url: streamUrl, poster: '' });
                        },
                        onBack: function () { Lampa.Controller.toggle('full'); }
                    });
                } else {
                    // 1 file hoặc không có info → phát luôn
                    var streamUrl = tsStreamUrl(tsUrl, useHash, useIndex);
                    Lampa.Player.play({ title: title, url: streamUrl, poster: '' });
                }
            },
            function (err) {
                Lampa.Noty.show('Lỗi TorrServer: ' + err);
            }
        );
    }


    /* ============================================================
       HIỂN THỊ DANH SÁCH KẾT QUẢ TORRENTIO
    ============================================================ */
    function showTorrentioResults(streams, card) {
        var tsUrl = getTorrServerUrl();
        var title = card.title || card.name || '';

        if (!tsUrl) {
            Lampa.Noty.show('⚠️ Chưa cài TorrServer URL trong Settings → Parser → TorrServer');
            return;
        }

        if (!streams.length) {
            Lampa.Noty.show('Torrentio: Không tìm thấy torrent cho phim này 😔');
            return;
        }

        // Parse + sort theo seeds
        var parsed = streams.map(parseStreamInfo);
        parsed.sort(function (a, b) { return b.seeds - a.seeds; });

        var items = parsed.map(function (p) {
            var label = (p.quality || 'Unknown') +
                (p.size   ? '  💾 ' + p.size   : '') +
                (p.seeds  ? '  👤 ' + p.seeds  : '') +
                (p.src    ? '  [' + p.src + ']' : '');
            return { title: label, info: p };
        });

        Lampa.Select.show({
            title: '🧲 ' + title,
            items: items,
            onSelect: function (item) {
                var p      = item.info;
                var magnet = makeMagnet(p.hash, p.name);
                playStream(tsUrl, magnet, p.hash, p.fileIdx, title);
            },
            onBack: function () {
                Lampa.Controller.toggle('full');
            }
        });
    }


    /* ============================================================
       LẤY IMDB ID → GỌI TORRENTIO
    ============================================================ */
    function start(card) {
        var imdbId = getImdbId(card);
        var type   = getMediaType(card);
        var title  = card.title || card.name || '';

        if (imdbId) {
            fetchAndShow(imdbId, type, card);
        } else {
            // Fetch IMDB ID từ TMDB
            Lampa.Noty.show('Đang lấy IMDB ID...');
            var tmdbType = type === 'series' ? 'tv' : 'movie';
            var net = new Lampa.Reguest();
            net.timeout(10000);
            net.silent(
                'https://api.themoviedb.org/3/' + tmdbType + '/' + card.id +
                '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96',
                function (data) {
                    var id = data && data.imdb_id;
                    if (id) {
                        card.imdb_id = id;
                        fetchAndShow(id, type, card);
                    } else {
                        Lampa.Noty.show('Không tìm thấy IMDB ID 😔');
                    }
                },
                function () { Lampa.Noty.show('Lỗi khi lấy IMDB ID'); }
            );
        }
    }

    function fetchAndShow(imdbId, type, card) {
        if (type === 'series') {
            askSeasonEpisode(function (s, e) {
                Lampa.Noty.show('Đang tìm torrent...');
                fetchTorrentio(imdbId, 'series', s, e, function (streams) {
                    showTorrentioResults(streams, card);
                });
            });
        } else {
            Lampa.Noty.show('Đang tìm torrent...');
            fetchTorrentio(imdbId, 'movie', null, null, function (streams) {
                showTorrentioResults(streams, card);
            });
        }
    }

    function askSeasonEpisode(onDone) {
        var seasons = [];
        for (var s = 1; s <= 20; s++) seasons.push({ title: 'Season ' + s, s: s });

        Lampa.Select.show({
            title: 'Chọn Season',
            items: seasons,
            onSelect: function (si) {
                var eps = [];
                for (var e = 1; e <= 50; e++) eps.push({ title: 'Episode ' + e, e: e });
                Lampa.Select.show({
                    title: 'Season ' + si.s + ' — Chọn Episode',
                    items: eps,
                    onSelect: function (ei) { onDone(si.s, ei.e); },
                    onBack:   function () { Lampa.Controller.toggle('full'); }
                });
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }


    /* ============================================================
       HOOK VÀO TRANG CHI TIẾT PHIM
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

        if ($ctx.find('.view--torrentio2').length) return;

        var $btn = $(
            '<div class="full-start__button selector view--torrentio2">' +
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

        $btn.on('hover:enter', function () { start(card); });

        var $tor = $ctx.find('.view--torrent');
        if ($tor.length) $tor.after($btn);
        else $ctx.find('.full-start__buttons').append($btn);
    });


    console.log('[Torrentio v2] loaded — Torrentio → TorrServer API');

})();
