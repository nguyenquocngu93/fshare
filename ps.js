(function () {
    'use strict';

    /* ============================================================
       Torrentio + Knaben Parser for Lampa  —  v3.0.0

       Sources:
         - Torrentio API  (by IMDB ID → TPB, 1337x, YTS, TGX, Rutor...)
         - Knaben API     (POST JSON → aggregator từ nhiều tracker)

       UI: Card style giống native Lampa torrent list (image 1)
         - Badges: resolution, audio, sub, codec
         - Seeds / Leechers / Size / Tracker / Date
         - Click → TorrServer → stream
    ============================================================ */

    if (window.plugin_torrentio_v3_ready) return;
    window.plugin_torrentio_v3_ready = true;

    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var KNABEN_API     = 'https://knaben.eu/api/v1';

    /* ============================================================
       HELPERS
    ============================================================ */
    function getTorrServerUrl() {
        var url = Lampa.Storage.field('torrserver_url')
               || Lampa.Storage.field('ts_url')
               || Lampa.Storage.field('tsurl')
               || '';
        if (!url) return null;
        url = url.replace(/\/$/, '');
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
        return url;
    }

    function fmtBytes(b) {
        b = parseInt(b) || 0;
        if (b > 1e12) return (b / 1e12).toFixed(2) + ' TB';
        if (b > 1e9)  return (b / 1e9).toFixed(2)  + ' GB';
        if (b > 1e6)  return (b / 1e6).toFixed(0)   + ' MB';
        return b + ' B';
    }

    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
               '&dn=' + encodeURIComponent(name || '') +
               '&tr=' + encodeURIComponent('udp://tracker.opentrackr.org:1337/announce') +
               '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce') +
               '&tr=' + encodeURIComponent('udp://tracker.torrent.eu.org:451/announce') +
               '&tr=' + encodeURIComponent('udp://exodus.desync.com:6969/announce');
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
       TITLE PARSER — trích metadata từ tên torrent
       Dùng để hiển thị badges như image 1
    ============================================================ */
    function parseTorrentTitle(title) {
        var t   = title || '';
        var res = [];

        // --- Resolution ---
        var resBadge = '';
        if      (/3840[x×]2160|2160p|4K UHD|UHD/i.test(t)) resBadge = '3840×2160';
        else if (/1920[x×]1080|1080p/i.test(t))             resBadge = '1920×1080';
        else if (/1280[x×]720|720p/i.test(t))               resBadge = '1280×720';
        else if (/480p/i.test(t))                            resBadge = '480p';
        if (resBadge) res.push({ text: resBadge, cls: 'torrent-badge--res' });

        // --- Audio channels ---
        var ch = [];
        if (/7\.1/i.test(t))  ch.push('7.1');
        if (/5\.1/i.test(t))  ch.push('5.1');
        if (/2\.0/i.test(t))  ch.push('2.0');
        ch.forEach(function (c) { res.push({ text: c, cls: 'torrent-badge--audio' }); });

        // --- Audio codec + language (voice) ---
        var voices = [];
        var vMatch = t.match(/(?:RUS|UKR|ENG|FRE|GER|SPA|ITA|JPN|CHI|HIN)(?:\s*[-–]\s*\w+)*/gi);
        if (vMatch) {
            vMatch.forEach(function (v) {
                voices.push({ text: v.trim(), cls: 'torrent-badge--voice' });
            });
        }

        // --- Audio codec ---
        var audioCodecs = [];
        if (/TrueHD/i.test(t))       audioCodecs.push('TrueHD');
        if (/Atmos/i.test(t))         audioCodecs.push('Atmos');
        if (/DTS-HD/i.test(t))        audioCodecs.push('DTS-HD');
        else if (/\bDTS\b/i.test(t))  audioCodecs.push('DTS');
        if (/EAC3|E-AC-3/i.test(t))   audioCodecs.push('EAC3');
        else if (/\bAC3\b/i.test(t))  audioCodecs.push('AC3');
        if (/\bAAC\b/i.test(t))       audioCodecs.push('AAC');
        audioCodecs.forEach(function (a) { res.push({ text: a, cls: 'torrent-badge--audio' }); });

        // --- Subtitles ---
        var subMatch = t.match(/(?:Sub(?:title)?s?|CC)[:\s]+([A-Z,\s/]+)/i);
        if (subMatch) {
            subMatch[1].split(/[,/]/).forEach(function (s) {
                var sub = s.trim();
                if (sub) res.push({ text: '📄 ' + sub, cls: 'torrent-badge--sub' });
            });
        }

        // --- Video codec ---
        var vcodec = '';
        if      (/[Xx]265|HEVC/i.test(t)) vcodec = 'HEVC';
        else if (/[Xx]264|AVC/i.test(t))  vcodec = 'AVC';
        else if (/AV1/i.test(t))           vcodec = 'AV1';
        if (vcodec) res.push({ text: vcodec, cls: 'torrent-badge--codec' });

        // --- Source ---
        var src = '';
        if      (/BDRemux|BD Remux/i.test(t))  src = 'BDRemux';
        else if (/BluRay|Blu-Ray/i.test(t))     src = 'BluRay';
        else if (/BDRip/i.test(t))              src = 'BDRip';
        else if (/WEB-DL/i.test(t))             src = 'WEB-DL';
        else if (/WEBRip/i.test(t))             src = 'WEBRip';
        else if (/HDTV/i.test(t))               src = 'HDTV';
        else if (/CAM/i.test(t))                src = 'CAM';
        if (src) res.push({ text: src, cls: 'torrent-badge--src' });

        return { badges: res, voices: voices };
    }


    /* ============================================================
       FETCH: TORRENTIO
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
                    var title = s.title || '';
                    var lines = title.split('\n');
                    var name  = lines[0] || '';
                    var info  = lines[1] || '';

                    var sizeM  = info.match(/💾\s*([\d.,]+\s*[GMKB]+)/i);
                    var seedM  = info.match(/👤\s*(\d+)/);
                    var srcM   = info.match(/⚙️\s*(\S+)/);

                    results.push({
                        title:   name,
                        tracker: srcM  ? srcM[1]          : 'Torrentio',
                        sizeStr: sizeM ? sizeM[1].trim()  : '',
                        seeds:   seedM ? parseInt(seedM[1]) : 0,
                        peers:   0,
                        hash:    s.infoHash,
                        fileIdx: typeof s.fileIdx === 'number' ? s.fileIdx : 0,
                        magnet:  makeMagnet(s.infoHash, name),
                        date:    '',
                        _from:   'torrentio'
                    });
                });

                results.sort(function (a, b) { return b.seeds - a.seeds; });
                onDone(results);
            },
            function () { onDone([]); }
        );
    }


    /* ============================================================
       FETCH: KNABEN (POST JSON API)
       Dùng Lampa.Reguest vì CORS-safe (JSON API)
    ============================================================ */
    function fetchKnaben(query, onDone) {
        // Knaben dùng POST với JSON body
        // Lampa.Reguest.silent chỉ GET → dùng $.ajax
        $.ajax({
            url:         KNABEN_API,
            method:      'POST',
            contentType: 'application/json',
            dataType:    'json',
            timeout:     15000,
            data: JSON.stringify({
                search_type:  '100%',
                search_field: 'title',
                query:        query,
                order_by:     'seeders',
                order_direction: 'desc',
                categories:   [2000000, 2010000, 2030000], // Video + Movies + TV
                from:         0,
                size:         50,
                hide_unsafe:  true,
                hide_xxx:     false,
                seconds_since_last_seen: 604800  // 7 days
            }),
            success: function (data) {
                var hits    = (data && data.hits) || [];
                var results = hits.map(function (h) {
                    return {
                        title:   h.title   || '',
                        tracker: h.cachedOrigin || 'Knaben',
                        sizeStr: h.bytes   ? fmtBytes(h.bytes)  : '',
                        seeds:   parseInt(h.seeders)  || 0,
                        peers:   parseInt(h.leechers) || 0,
                        hash:    h.hash    || '',
                        fileIdx: 0,
                        magnet:  h.magnetUrl || (h.hash ? makeMagnet(h.hash, h.title) : ''),
                        date:    (h.date   || '').slice(0, 10),
                        _from:   'knaben'
                    };
                }).filter(function (r) { return r.magnet || r.hash; });

                results.sort(function (a, b) { return b.seeds - a.seeds; });
                onDone(results);
            },
            error: function () { onDone([]); }
        });
    }


    /* ============================================================
       TORRSERVER: ADD + GET + STREAM
    ============================================================ */
    function tsAddGet(tsUrl, magnet, title, onDone, onFail) {
        $.ajax({
            url:         tsUrl + '/torrents',
            method:      'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'add', link: magnet, title: title || '', save_to_db: false }),
            timeout:     12000,
            complete:    function () {
                setTimeout(function () {
                    $.ajax({
                        url:         tsUrl + '/torrents',
                        method:      'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ action: 'get', link: magnet }),
                        timeout:     12000,
                        success:     function (d) { onDone(d && d.hash || extractHash(magnet), d && d.file_stats || []); },
                        error:       function ()  { onDone(extractHash(magnet), []); }
                    });
                }, 1500);
            }
        });
    }

    function extractHash(magnet) {
        var m = (magnet || '').match(/btih:([a-f0-9]+)/i);
        return m ? m[1].toLowerCase() : '';
    }

    function tsStreamUrl(tsUrl, hash, idx) {
        return tsUrl + '/stream?link=' + encodeURIComponent(hash) + '&index=' + (idx || 0) + '&play';
    }

    function playMagnet(tsUrl, magnet, hash, idx, title) {
        Lampa.Noty.show('Đang kết nối TorrServer...');
        tsAddGet(tsUrl, magnet, title,
            function (resolvedHash, files) {
                var useHash = resolvedHash || hash;
                if (!useHash) { Lampa.Noty.show('Không lấy được hash'); return; }

                var videoFiles = (files || []).filter(function (f) {
                    return /\.(mp4|mkv|avi|mov|wmv|m4v|ts|flv)$/i.test(f.path || '');
                });
                var list = videoFiles.length ? videoFiles : files;

                if (list.length > 1) {
                    Lampa.Select.show({
                        title: '📂 Chọn file',
                        items: list.map(function (f, i) {
                            return { title: (f.path || 'File ' + i).split('/').pop(), index: f.id !== undefined ? f.id : i };
                        }),
                        onSelect: function (item) {
                            Lampa.Player.play({ title: title, url: tsStreamUrl(tsUrl, useHash, item.index), poster: '' });
                        },
                        onBack: function () { Lampa.Controller.toggle('full'); }
                    });
                } else {
                    Lampa.Player.play({ title: title, url: tsStreamUrl(tsUrl, useHash, idx || 0), poster: '' });
                }
            },
            function (e) { Lampa.Noty.show('Lỗi TorrServer: ' + e); }
        );
    }


    /* ============================================================
       COMPONENT: HIỂN THỊ KẾT QUẢ — STYLE IMAGE 1
    ============================================================ */
    function ResultsComponent(object) {
        var scroll   = new Lampa.Scroll({ mask: true, over: true });
        var results  = object.results || [];
        var cardObj  = object.card    || {};
        var tsUrl    = getTorrServerUrl();

        this.render = function () { return scroll.render(); };

        this.create = function () {
            if (!results.length) {
                scroll.render().find('.scroll__content').html(
                    '<div style="padding:3em;text-align:center;color:#888">Không tìm thấy torrent 😔</div>'
                );
                return;
            }

            results.forEach(function (r) {
                scroll.append(makeResultCard(r));
            });
        };

        function makeResultCard(r) {
            var parsed = parseTorrentTitle(r.title);
            var wrap   = document.createElement('div');
            wrap.className = 'torr-card selector';

            // --- Title ---
            var titleEl = document.createElement('div');
            titleEl.className = 'torr-card__title';
            titleEl.textContent = r.title || '';
            wrap.appendChild(titleEl);

            // --- Badges row 1: resolution + audio + codec + source ---
            if (parsed.badges.length) {
                var row1 = document.createElement('div');
                row1.className = 'torr-card__badges';
                parsed.badges.forEach(function (b) {
                    var badge = document.createElement('span');
                    badge.className = 'torr-badge ' + (b.cls || '');
                    badge.textContent = b.text;
                    row1.appendChild(badge);
                });
                wrap.appendChild(row1);
            }

            // --- Badges row 2: voice/language ---
            if (parsed.voices.length) {
                var row2 = document.createElement('div');
                row2.className = 'torr-card__badges';
                parsed.voices.forEach(function (v) {
                    var badge = document.createElement('span');
                    badge.className = 'torr-badge torr-badge--voice';
                    badge.textContent = '🎙 ' + v.text;
                    row2.appendChild(badge);
                });
                wrap.appendChild(row2);
            }

            // --- Info row: date + trackers ---
            var infoRow = document.createElement('div');
            infoRow.className = 'torr-card__info';
            infoRow.textContent =
                (r.date    ? r.date + '  '      : '') +
                (r.tracker ? r.tracker          : '');
            wrap.appendChild(infoRow);

            // --- Stats row: seeds / peers / size ---
            var statsRow = document.createElement('div');
            statsRow.className = 'torr-card__stats';

            var seedsEl = document.createElement('span');
            seedsEl.innerHTML = 'Seeds: <b style="color:#27ae60">' + r.seeds + '</b>';

            var peersEl = document.createElement('span');
            peersEl.innerHTML = 'Leechers: <b style="color:#e74c3c">' + r.peers + '</b>';

            statsRow.appendChild(seedsEl);
            statsRow.appendChild(peersEl);

            // Size badge (right side)
            if (r.sizeStr) {
                var sizeBadge = document.createElement('span');
                sizeBadge.className = 'torr-card__size';
                sizeBadge.textContent = r.sizeStr;
                statsRow.appendChild(sizeBadge);
            }

            wrap.appendChild(statsRow);

            // --- Click: phát qua TorrServer ---
            $(wrap).on('hover:enter click', function () {
                if (!tsUrl) {
                    Lampa.Noty.show('⚠️ Chưa cài TorrServer URL trong Settings');
                    return;
                }
                playMagnet(tsUrl, r.magnet, r.hash, r.fileIdx, r.title);
            });

            return $(wrap);
        }

        this.start = function () {
            Lampa.Controller.add('torr_results', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up:    function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down:  function () { Navigator.move('down'); },
                left:  function () { Navigator.move('left'); },
                right: function () { Navigator.move('right'); },
                back:  function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('torr_results');
        };

        this.pause   = function () {};
        this.stop    = function () {};
        this.back    = function () { Lampa.Activity.backward(); };
        this.destroy = function () { scroll.destroy(); };
    }

    Lampa.Component.add('torr_results', ResultsComponent);


    /* ============================================================
       ĐIỀU PHỐI TÌM KIẾM
    ============================================================ */
    function doSearch(card, season, episode) {
        var title  = card.title || card.name || '';
        var type   = getMediaType(card);
        var imdbId = getImdbId(card);
        var year   = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query  = title + (year ? ' ' + year : '');

        Lampa.Noty.show('Đang tìm torrent...');

        var combined = [];
        var pending  = 2;

        function done(arr, from) {
            combined = combined.concat(arr);
            pending--;
            if (pending === 0) {
                // Dedup theo hash
                var seen = {};
                combined = combined.filter(function (r) {
                    var key = r.hash || r.title;
                    if (seen[key]) return false;
                    seen[key] = true;
                    return true;
                });
                combined.sort(function (a, b) { return b.seeds - a.seeds; });

                if (!combined.length) {
                    Lampa.Noty.show('Không tìm thấy torrent nào 😔');
                    return;
                }

                Lampa.Activity.push({
                    component: 'torr_results',
                    title:     '🧲 ' + title,
                    results:   combined,
                    card:      card,
                    source:    'torrentio'
                });
            }
        }

        // 1. Torrentio (by IMDB ID)
        if (imdbId) {
            fetchTorrentio(imdbId, type, season, episode, function (arr) { done(arr, 'torrentio'); });
        } else {
            // Không có IMDB ID → thử lấy từ TMDB
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
                        fetchTorrentio(id, type, season, episode, function (arr) { done(arr, 'torrentio'); });
                    } else {
                        done([], 'torrentio'); // skip
                    }
                },
                function () { done([], 'torrentio'); }
            );
        }

        // 2. Knaben (by title)
        fetchKnaben(query, function (arr) { done(arr, 'knaben'); });
    }

    function askSeasonAndSearch(card) {
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
                    onSelect: function (ei) { doSearch(card, si.s, ei.e); },
                    onBack:   function () { Lampa.Controller.toggle('full'); }
                });
            },
            onBack: function () { Lampa.Controller.toggle('full'); }
        });
    }


    /* ============================================================
       HOOK VÀO TRANG PHIM — nút "Torrentio"
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

        if ($ctx.find('.view--torrentio3').length) return;

        var $btn = $(
            '<div class="full-start__button selector view--torrentio3">' +
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
            if (type === 'series') askSeasonAndSearch(card);
            else doSearch(card, null, null);
        });

        var $tor = $ctx.find('.view--torrent');
        if ($tor.length) $tor.after($btn);
        else $ctx.find('.full-start__buttons').append($btn);
    });


    /* ============================================================
       CSS — Style giống image 1
    ============================================================ */
    $('<style>').text([
        '.torr-card {',
        '  display:block; padding:14px 16px; margin:4px 6px;',
        '  background:rgba(255,255,255,.04); border-radius:10px;',
        '  cursor:pointer; border-left:3px solid transparent;',
        '}',
        '.torr-card.focus {',
        '  background:rgba(255,255,255,.09);',
        '  border-left-color:#e74c3c;',
        '}',
        '.torr-card__title {',
        '  font-size:.88em; color:#fff; margin-bottom:8px; line-height:1.4;',
        '}',
        '.torr-card__badges {',
        '  display:flex; flex-wrap:wrap; gap:5px; margin-bottom:6px;',
        '}',
        '.torr-badge {',
        '  display:inline-flex; align-items:center;',
        '  padding:2px 8px; border-radius:4px; font-size:.72em;',
        '  background:rgba(255,255,255,.12); color:#ddd;',
        '}',
        '.torr-badge--res   { background:rgba(52,152,219,.35); color:#7ec8f5; }',
        '.torr-badge--audio { background:rgba(46,204,113,.25); color:#7df5a0; }',
        '.torr-badge--voice { background:rgba(155,89,182,.3);  color:#d7a6f5; }',
        '.torr-badge--sub   { background:rgba(230,126,34,.25); color:#f5c880; }',
        '.torr-badge--codec { background:rgba(231,76,60,.25);  color:#f58080; }',
        '.torr-badge--src   { background:rgba(52,73,94,.6);    color:#bdc3c7; }',
        '.torr-card__info {',
        '  font-size:.73em; color:#888; margin-bottom:6px;',
        '}',
        '.torr-card__stats {',
        '  display:flex; align-items:center; gap:14px; font-size:.77em; color:#aaa;',
        '}',
        '.torr-card__size {',
        '  margin-left:auto; background:rgba(255,255,255,.1);',
        '  padding:2px 10px; border-radius:4px; color:#fff; font-size:.9em;',
        '}'
    ].join('\n')).appendTo('head');

    console.log('[Torrentio+Knaben] v3.0.0 loaded');

})();
