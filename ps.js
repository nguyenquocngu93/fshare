(function () {
    'use strict';

    /* ============================================================
       Public Torrent Parser for Lampa  —  v1.0.0

       Cách hoạt động (giống ConcertSearch):
       - Hook vào trang chi tiết phim → thêm nút "🔍 Torrent"
       - Tìm kiếm trên TPB / 1337x / TorrentGalaxy
       - Chọn kết quả → phát qua TorrServer đã cài trong Settings
       
       Sources:
         TPB      → apibay.org (JSON API, không cần proxy) ✅
         1337x    → Lampa.Reguest + allorigins (JSON wrapper)
         TGX      → Lampa.Reguest + allorigins (JSON wrapper)
    ============================================================ */

    if (window.plugin_pubtorr_en_ready) return;
    window.plugin_pubtorr_en_ready = true;

    /* ============================================================
       HELPERS
    ============================================================ */
    var TRACKERS = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.stealth.si:80/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://exodus.desync.com:6969/announce',
        'udp://tracker.leechers-paradise.org:6969/announce'
    ].map(function (t) { return '&tr=' + encodeURIComponent(t); }).join('');

    function makeMagnet(hash, name) {
        return 'magnet:?xt=urn:btih:' + hash.toLowerCase() +
            '&dn=' + encodeURIComponent(name) + TRACKERS;
    }

    function fmtSize(bytes) {
        bytes = parseInt(bytes) || 0;
        if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
        if (bytes > 1e6) return (bytes / 1e6).toFixed(0) + ' MB';
        return (bytes / 1e3).toFixed(0) + ' KB';
    }


    /* ============================================================
       SOURCE 1: THE PIRATE BAY
       apibay.org → JSON trực tiếp, Lampa.Reguest gọi được ngay
    ============================================================ */
    function searchTPB(query, onDone) {
        var net = new Lampa.Reguest();
        net.timeout(12000);
        net.silent(
            'https://apibay.org/q.php?q=' + encodeURIComponent(query) + '&cat=0',
            function (data) {
                if (!Array.isArray(data) || !data.length || data[0].id === '0') {
                    onDone([]); return;
                }
                var results = data.map(function (t) {
                    return {
                        title:  t.name,
                        size:   fmtSize(t.size),
                        seeds:  parseInt(t.seeders)  || 0,
                        leech:  parseInt(t.leechers) || 0,
                        magnet: makeMagnet(t.info_hash, t.name),
                        src:    'TPB'
                    };
                });
                results.sort(function (a, b) { return b.seeds - a.seeds; });
                onDone(results);
            },
            function () { onDone([]); }
        );
    }


    /* ============================================================
       SOURCE 2: 1337x
       allorigins → Lampa.Reguest nhận JSON → parse HTML từ contents
       Cần fetch detail page để lấy magnet
    ============================================================ */
    function search1337x(query, onDone) {
        var url = 'https://1337x.to/search/' + encodeURIComponent(query) + '/1/';
        var net = new Lampa.Reguest();
        net.timeout(20000);
        net.silent(
            'https://api.allorigins.win/get?url=' + encodeURIComponent(url),
            function (data) {
                var html = data && data.contents;
                if (!html) { onDone([]); return; }
                var results = [];
                var $doc = $('<div>').html(html);
                $doc.find('table.table-list tbody tr').each(function () {
                    var $tr   = $(this);
                    var name  = $tr.find('.name a').last().text().trim();
                    var href  = $tr.find('.name a').last().attr('href') || '';
                    var seeds = parseInt($tr.find('td.seeds').text())   || 0;
                    var leech = parseInt($tr.find('td.leeches').text()) || 0;
                    var size  = $tr.find('td.size').clone()
                                   .children().remove().end().text().trim();
                    if (!name || !href) return;
                    results.push({
                        title:      name,
                        size:       size || '?',
                        seeds:      seeds,
                        leech:      leech,
                        detailUrl:  href.startsWith('http') ? href : 'https://1337x.to' + href,
                        src:        '1337x',
                        _fetch:     true
                    });
                });
                results.sort(function (a, b) { return b.seeds - a.seeds; });
                onDone(results.slice(0, 20));
            },
            function () { onDone([]); }
        );
    }

    function getMagnet1337x(detailUrl, onDone) {
        var net = new Lampa.Reguest();
        net.timeout(12000);
        net.silent(
            'https://api.allorigins.win/get?url=' + encodeURIComponent(detailUrl),
            function (data) {
                var html   = data && data.contents;
                var magnet = html && $('<div>').html(html)
                                              .find('a[href^="magnet:"]')
                                              .first().attr('href');
                onDone(magnet || null);
            },
            function () { onDone(null); }
        );
    }


    /* ============================================================
       SOURCE 3: TORRENTGALAXY
       allorigins → Lampa.Reguest nhận JSON → parse HTML từ contents
       Magnet link có sẵn trên trang kết quả → không cần fetch thêm
    ============================================================ */
    function searchTGX(query, onDone) {
        var url = 'https://torrentgalaxy.to/torrents.php?search=' + encodeURIComponent(query);
        var net = new Lampa.Reguest();
        net.timeout(20000);
        net.silent(
            'https://api.allorigins.win/get?url=' + encodeURIComponent(url),
            function (data) {
                var html = data && data.contents;
                if (!html) { onDone([]); return; }
                var results = [];
                var $doc = $('<div>').html(html);
                $doc.find('.tgxtable .tgxtablerow:not(.hrow)').each(function () {
                    var $row   = $(this);
                    var name   = $row.find('.txlight').text().trim();
                    var magnet = $row.find('a[href^="magnet:"]').first().attr('href') || '';
                    var seeds  = parseInt($row.find('.tgxtablecell:nth-child(11)').text()) || 0;
                    var leech  = parseInt($row.find('.tgxtablecell:nth-child(12)').text()) || 0;
                    var size   = $row.find('.tgxtablecell:nth-child(8)').text().trim();
                    if (!name || !magnet) return;
                    results.push({
                        title:  name,
                        size:   size || '?',
                        seeds:  seeds,
                        leech:  leech,
                        magnet: magnet,
                        src:    'TGX'
                    });
                });
                results.sort(function (a, b) { return b.seeds - a.seeds; });
                onDone(results.slice(0, 20));
            },
            function () { onDone([]); }
        );
    }


    /* ============================================================
       HIỂN THỊ KẾT QUẢ TÌM KIẾM
    ============================================================ */
    function showResults(results, title) {
        if (!results.length) {
            Lampa.Noty.show('Không tìm thấy torrent cho: ' + title);
            return;
        }

        var items = results.map(function (r) {
            var seeds = r.seeds > 0
                ? '<span style="color:#27ae60">▲' + r.seeds + '</span>'
                : '<span style="color:#888">▲0</span>';
            return {
                title:    '[' + r.src + '] ' + r.title,
                subtitle: seeds + '  💾' + r.size,
                torrent:  r
            };
        });

        Lampa.Select.show({
            title: '🔍 ' + title,
            items: items,
            onSelect: function (item) {
                var t = item.torrent;
                if (t.magnet) {
                    playTorrent(t.magnet, t.title);
                } else if (t._fetch && t.detailUrl) {
                    Lampa.Noty.show('Đang lấy magnet link...');
                    getMagnet1337x(t.detailUrl, function (magnet) {
                        if (magnet) playTorrent(magnet, t.title);
                        else Lampa.Noty.show('Không lấy được magnet link');
                    });
                }
            },
            onBack: function () {
                Lampa.Controller.toggle('full');
            }
        });
    }

    function playTorrent(magnet, title) {
        Lampa.Player.play({
            title:  title || 'Torrent',
            url:    magnet,
            poster: ''
        });
    }


    /* ============================================================
       TÌM KIẾM THEO NGUỒN
    ============================================================ */
    function doSearch(query, srcKey, title) {
        Lampa.Noty.show('Đang tìm "' + query + '" trên ' + srcKey + '...');

        if (srcKey === 'TPB') {
            searchTPB(query, function (results) {
                showResults(results, title || query);
            });
        } else if (srcKey === '1337x') {
            search1337x(query, function (results) {
                showResults(results, title || query);
            });
        } else if (srcKey === 'TGX') {
            searchTGX(query, function (results) {
                showResults(results, title || query);
            });
        } else {
            // All: tìm đồng thời tất cả, gộp kết quả
            var all = [], pending = 3;
            function done(arr) {
                all = all.concat(arr);
                pending--;
                if (pending === 0) {
                    all.sort(function (a, b) { return b.seeds - a.seeds; });
                    showResults(all, title || query);
                }
            }
            searchTPB(query, done);
            search1337x(query, done);
            searchTGX(query, done);
        }
    }


    /* ============================================================
       MENU CHỌN NGUỒN
    ============================================================ */
    function showSourceMenu(card) {
        var title = card.title || card.original_title || card.name || '';
        var year  = (card.release_date || card.first_air_date || '').slice(0, 4);
        var query = title + (year ? ' ' + year : '');

        Lampa.Select.show({
            title: '🔍 Tìm Torrent',
            items: [
                { title: '🌐 Tất cả nguồn',      src: 'ALL' },
                { title: '🏴‍☠️ The Pirate Bay',  src: 'TPB' },
                { title: '🔱 1337x',              src: '1337x' },
                { title: '🌌 TorrentGalaxy',      src: 'TGX' },
                { title: '✏️ Tìm kiếm thủ công',  src: 'MANUAL' }
            ],
            onSelect: function (item) {
                if (item.src === 'MANUAL') {
                    showManualSearch(title);
                } else {
                    doSearch(query, item.src, title);
                }
            },
            onBack: function () {
                Lampa.Controller.toggle('full');
            }
        });
    }

    function showManualSearch(defaultQuery) {
        if (typeof Lampa.Keyboard !== 'undefined') {
            Lampa.Keyboard.show({
                title:   'Tìm kiếm torrent',
                value:   defaultQuery || '',
                onEnter: function (q) {
                    if (!q) return;
                    showSourceMenuForQuery(q);
                },
                onBack: function () {
                    Lampa.Controller.toggle('full');
                }
            });
        } else {
            // Fallback nếu không có Keyboard
            doSearch(defaultQuery, 'ALL', defaultQuery);
        }
    }

    function showSourceMenuForQuery(query) {
        Lampa.Select.show({
            title: '🔍 Chọn nguồn cho: ' + query,
            items: [
                { title: '🌐 Tất cả',             src: 'ALL' },
                { title: '🏴‍☠️ The Pirate Bay',  src: 'TPB' },
                { title: '🔱 1337x',              src: '1337x' },
                { title: '🌌 TorrentGalaxy',      src: 'TGX' }
            ],
            onSelect: function (item) {
                doSearch(query, item.src, query);
            },
            onBack: function () {
                Lampa.Controller.toggle('full');
            }
        });
    }


    /* ============================================================
       HOOK VÀO TRANG CHI TIẾT PHIM
       Thêm nút "🔍 Torrent" vào hàng buttons — giống KKPhim
    ============================================================ */
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;

        var card   = e.data && e.data.movie ? e.data.movie : (e.object && e.object.card);
        if (!card) return;

        var $ctx = e.object && e.object.activity
            ? e.object.activity.render()
            : (e.object && e.object.render ? e.object.render() : null);
        if (!$ctx) $ctx = $('body');

        // Tránh thêm 2 lần
        if ($ctx.find('.view--pubtorren').length) return;

        var $btn = $(
            '<div class="full-start__button selector view--pubtorren">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"' +
            ' fill="none" width="44" height="44"' +
            ' stroke="currentColor" stroke-width="1.5"' +
            ' stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
            '</svg>' +
            '<span>Torrent</span>' +
            '</div>'
        );

        $btn.on('hover:enter', function () {
            showSourceMenu(card);
        });

        // Chèn vào hàng buttons — sau nút TorrServer nếu có
        var $torBtn = $ctx.find('.view--torrent');
        if ($torBtn.length) {
            $torBtn.after($btn);
        } else {
            $ctx.find('.full-start__buttons').append($btn);
        }
    });


    /* ============================================================
       ĐĂNG KÝ PLUGIN
    ============================================================ */
    Lampa.Manifest && Lampa.Manifest.plugins && Lampa.Manifest.plugins.push({
        name:    'Public Torrent Parser',
        version: '1.0.0',
        type:    'other'
    });

    console.log('[PubTorr-EN] v1.0.0 loaded — TPB / 1337x / TorrentGalaxy');

})();
