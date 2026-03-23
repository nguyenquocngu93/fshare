(function () {
    'use strict';

    /* ============================================================
       Torrentio + Knaben Parser for Lampa  —  v3.2.0
       Fix scroll: controller toggle sau khi items đã vào DOM
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
        if (b > 1e6)  return (b / 1e6).toFixed(0)  + ' MB';
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
       BADGE PARSER
    ============================================================ */
    function parseBadges(title) {
        var t = title || '';
        var badges = [];

        // Resolution
        var res = '';
        if      (/3840.?2160|2160p|4K/i.test(t))  res = '3840×2160';
        else if (/1920.?1080|1080p/i.test(t))      res = '1920×1080';
        else if (/1280.?720|720p/i.test(t))         res = '1280×720';
        else if (/480p/i.test(t))                   res = '480p';
        if (res) badges.push({ text: res, cls: 'torr-badge--res' });

        // Audio channels
        if (/7\.1/.test(t)) badges.push({ text: '7.1', cls: 'torr-badge--audio' });
        if (/5\.1/.test(t)) badges.push({ text: '5.1', cls: 'torr-badge--audio' });
        if (/2\.0/.test(t)) badges.push({ text: '2.0', cls: 'torr-badge--audio' });

        // Audio codec
        if (/TrueHD/i.test(t))      badges.push({ text: 'TrueHD', cls: 'torr-badge--audio' });
        if (/Atmos/i.test(t))        badges.push({ text: 'Atmos',  cls: 'torr-badge--audio' });
        if (/DTS-HD/i.test(t))       badges.push({ text: 'DTS-HD', cls: 'torr-badge--audio' });
        else if (/\bDTS\b/i.test(t)) badges.push({ text: 'DTS',    cls: 'torr-badge--audio' });
        if (/EAC3|E-AC-3/i.test(t))  badges.push({ text: 'EAC3',   cls: 'torr-badge--audio' });
        else if (/\bAC3\b/i.test(t)) badges.push({ text: 'AC3',    cls: 'torr-badge--audio' });

        // Video codec
        if      (/[Xx]265|HEVC/i.test(t)) badges.push({ text: 'HEVC', cls: 'torr-badge--codec' });
        else if (/[Xx]264|AVC/i.test(t))  badges.push({ text: 'AVC',  cls: 'torr-badge--codec' });
        else if (/AV1/i.test(t))           badges.push({ text: 'AV1',  cls: 'torr-badge--codec' });

        // Source
        var src = '';
        if      (/BDRemux|BD.Remux/i.test(t)) src = 'BDRemux';
        else if (/BluRay|Blu-Ray/i.test(t))    src = 'BluRay';
        else if (/BDRip/i.test(t))             src = 'BDRip';
        else if (/WEB-DL/i.test(t))            src = 'WEB-DL';
        else if (/WEBRip/i.test(t))            src = 'WEBRip';
        else if (/HDTV/i.test(t))              src = 'HDTV';
        else if (/\bCAM\b/i.test(t))           src = 'CAM';
        else if (/BrRip|BRRip/i.test(t))       src = 'BRRip';
        else if (/DVDRip/i.test(t))            src = 'DVDRip';
        if (src) badges.push({ text: src, cls: 'torr-badge--src' });

        // HDR
        if (/Dolby.?Vision|\bDV\b/i.test(t)) badges.push({ text: 'Dolby Vision', cls: 'torr-badge--hdr' });
        else if (/HDR10\+/i.test(t))          badges.push({ text: 'HDR10+',       cls: 'torr-badge--hdr' });
        else if (/\bHDR\b/i.test(t))          badges.push({ text: 'HDR',          cls: 'torr-badge--hdr' });

        // Voice badges từ Torrentio title (dạng "🎙 RUS - HDRezka")
        var voices = t.match(/\b(RUS|UKR|ENG|FRE|GER|SPA|ITA|JPN|CHI)(?:\s*[-–]\s*[^\s|,\n\[]+)?/gi) || [];
        voices.forEach(function (v) {
            badges.push({ text: '🎙 ' + v.trim(), cls: 'torr-badge--voice' });
        });

        return badges;
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
                var results = streams.map(function (s) {
                    if (!s.infoHash) return null;
                    var lines  = (s.title || '').split('\n');
                    var name   = lines[0] || '';
                    var info   = lines[1] || '';
                    var sizeM  = info.match(/💾\s*([\d.,]+\s*[GMKB]+)/i);
                    var seedM  = info.match(/👤\s*(\d+)/);
                    var srcM   = info.match(/⚙️\s*(\S+)/);
                    return {
                        title:   name,
                        tracker: srcM  ? srcM[1]         : 'Torrentio',
                        sizeStr: sizeM ? sizeM[1].trim() : '',
                        seeds:   seedM ? parseInt(seedM[1]) : 0,
                        peers:   0,
                        hash:    s.infoHash.toLowerCase(),
                        fileIdx: typeof s.fileIdx === 'number' ? s.fileIdx : 0,
                        magnet:  makeMagnet(s.infoHash, name),
                        date:    ''
                    };
                }).filter(Boolean);
                results.sort(function (a, b) { return b.seeds - a.seeds; });
                onDone(results);
            },
            function () { onDone([]); }
        );
    }

    /* ============================================================
       FETCH: KNABEN
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
                var hits = (data && data.hits) || [];
                var results = hits.map(function (h) {
                    var hash = (h.hash || '').toLowerCase();
                    return {
                        title:   h.title   || '',
                        tracker: h.cachedOrigin || 'Knaben',
                        sizeStr: h.bytes   ? fmtBytes(h.bytes) : '',
                        seeds:   parseInt(h.seeders)  || 0,
                        peers:   parseInt(h.leechers) || 0,
                        hash:    hash,
                        fileIdx: 0,
                        magnet:  h.magnetUrl || (hash ? makeMagnet(hash, h.title) : ''),
                        date:    (h.date || '').slice(0, 10)
                    };
                }).filter(function (r) { return r.magnet; });
                results.sort(function (a, b) { return b.seeds - a.seeds; });
                onDone(results);
            },
            error: function () { onDone([]); }
        });
    }

    /* ============================================================
       TORRSERVER: ADD → GET → PLAY
    ============================================================ */
    function tsPlay(tsUrl, magnet, hash, fileIdx, title) {
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
                                return /\.(mp4|mkv|avi|mov|wmv|m4v|ts)$/i.test(f.path || '');
                            });
                            var list = vids.length ? vids : files;
                            if (list.length > 1) {
                                Lampa.Select.show({
                                    title: '📂 Chọn file',
                                    items: list.map(function (f, i) {
                                        return { title: (f.path || 'File ' + i).split('/').pop(),
                                                 index: f.id !== undefined ? f.id : i };
                                    }),
                                    onSelect: function (item) {
                                        Lampa.Player.play({ title: title,
                                            url: tsUrl + '/stream?link=' + encodeURIComponent(useHash) + '&index=' + item.index + '&play',
                                            poster: '' });
                                    },
                                    onBack: function () { Lampa.Activity.backward(); }
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

    /* ============================================================
       COMPONENT: KẾT QUẢ
       FIX: Lampa.Controller.toggle() gọi ở cuối create() sau khi
            tất cả items đã được append vào scroll
    ============================================================ */
    function ResultsComponent(object) {
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var results = object.results || [];
        var tsUrl   = getTorrServerUrl();

        this.render = function () {
            return scroll.render();
        };

        this.create = function () {
            var self = this;

            if (!results.length) {
                scroll.render().find('.scroll__content').html(
                    '<div style="padding:3em;text-align:center;color:#888">' +
                    'Không tìm thấy torrent 😔</div>'
                );
            } else {
                results.forEach(function (r) {
                    scroll.append(makeCard(r));
                });
            }

            // ✅ KEY FIX: đăng ký controller SAU khi items đã append
            // rồi mới toggle để Navigator nhận diện được các selector
            Lampa.Controller.add('torr_results', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                back: function () {
                    Lampa.Activity.backward();
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                },
                right: function () {
                    if (Navigator.canmove('right')) Navigator.move('right');
                }
            });

            Lampa.Controller.toggle('torr_results');
        };

        function makeCard(r) {
            var badges = parseBadges(r.title);

            var wrap = document.createElement('div');
            wrap.className = 'torr-card selector';

            // Title
            var titleEl = document.createElement('div');
            titleEl.className = 'torr-card__title';
            titleEl.textContent = r.title;
            wrap.appendChild(titleEl);

            // Badges
            if (badges.length) {
                var badgeRow = document.createElement('div');
                badgeRow.className = 'torr-card__badges';
                badges.forEach(function (b) {
                    var el = document.createElement('span');
                    el.className = 'torr-badge ' + (b.cls || '');
                    el.textContent = b.text;
                    badgeRow.appendChild(el);
                });
                wrap.appendChild(badgeRow);
            }

            // Tracker + date
            var infoEl = document.createElement('div');
            infoEl.className = 'torr-card__info';
            infoEl.textContent = [r.date, r.tracker].filter(Boolean).join('  ');
            wrap.appendChild(infoEl);

            // Stats row
            var statsEl = document.createElement('div');
            statsEl.className = 'torr-card__stats';
            statsEl.innerHTML =
                'Bitrate: <b>–</b>  ' +
                'Seeds: <b class="torr-seeds">' + r.seeds + '</b>  ' +
                'Leechers: <b class="torr-leech">' + r.peers + '</b>';
            if (r.sizeStr) {
                var sizeEl = document.createElement('span');
                sizeEl.className = 'torr-card__size';
                sizeEl.textContent = r.sizeStr;
                statsEl.appendChild(sizeEl);
            }
            wrap.appendChild(statsEl);

            // Click
            $(wrap).on('hover:enter click', function () {
                if (!tsUrl) {
                    Lampa.Noty.show('⚠️ Chưa cài TorrServer URL trong Settings');
                    return;
                }
                tsPlay(tsUrl, r.magnet, r.hash, r.fileIdx, r.title);
            });

            return $(wrap);
        }

        // start() không cần làm gì vì controller đã đăng ký trong create()
        this.start   = function () {};
        this.pause   = function () {};
        this.stop    = function () {};
        this.back    = function () { Lampa.Activity.backward(); };
        this.destroy = function () { scroll.destroy(); };
    }

    Lampa.Component.add('torr_results', ResultsComponent);

    /* ============================================================
       TÌM KIẾM: GỘP TORRENTIO + KNABEN
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
            combined.sort(function (a, b) { return b.seeds - a.seeds; });

            if (!combined.length) {
                Lampa.Noty.show('Không tìm thấy torrent nào 😔');
                return;
            }

            Lampa.Activity.push({
                component: 'torr_results',
                title:     '🧲 ' + title,
                results:   combined,
                card:      card
            });
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
                function (data) {
                    var id = data && data.imdb_id;
                    if (id) { card.imdb_id = id; fetchTorrentio(id, type, season, episode, onPart); }
                    else onPart([]);
                },
                function () { onPart([]); }
            );
        }

        // Knaben
        fetchKnaben(query, onPart);
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
       HOOK VÀO TRANG PHIM
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
       CSS
    ============================================================ */
    $('<style>').text([
        '.torr-card{display:block;padding:14px 16px;margin:3px 0;',
        '  background:rgba(255,255,255,.04);border-radius:8px;cursor:pointer}',
        '.torr-card.focus{background:rgba(255,255,255,.1);',
        '  outline:2px solid rgba(255,255,255,.2)}',
        '.torr-card__title{font-size:.86em;color:#eee;margin-bottom:7px;line-height:1.4}',
        '.torr-card__badges{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px}',
        '.torr-badge{padding:2px 7px;border-radius:3px;font-size:.7em;',
        '  background:rgba(255,255,255,.12);color:#ccc}',
        '.torr-badge--res  {background:rgba(41,182,246,.25);color:#81d4fa}',
        '.torr-badge--audio{background:rgba(102,187,106,.25);color:#a5d6a7}',
        '.torr-badge--voice{background:rgba(186,104,200,.3);color:#ce93d8}',
        '.torr-badge--codec{background:rgba(239,83,80,.2);color:#ef9a9a}',
        '.torr-badge--src  {background:rgba(120,144,156,.25);color:#cfd8dc}',
        '.torr-badge--hdr  {background:rgba(255,213,79,.2);color:#fff176}',
        '.torr-card__info{font-size:.72em;color:#777;margin-bottom:4px}',
        '.torr-card__stats{display:flex;align-items:center;gap:12px;',
        '  font-size:.75em;color:#999}',
        '.torr-seeds{color:#27ae60!important}',
        '.torr-leech{color:#e74c3c!important}',
        '.torr-card__size{margin-left:auto;background:rgba(255,255,255,.08);',
        '  padding:2px 10px;border-radius:4px;color:#eee;font-size:.95em;white-space:nowrap}'
    ].join('\n')).appendTo('head');

    console.log('[Torrentio+Knaben] v3.2.0 loaded');

})();
