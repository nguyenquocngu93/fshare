// ============================================================
//  JavDB + Sukebei Nyaa Plugin for Lampa  v3.0.0
//  Info: JavDB  |  Torrent: Sukebei Nyaa RSS  |  Play: TorrServer
// ============================================================
(function () {
    'use strict';

    var VERSION     = '3.0.0';
    var PLUGIN_NAME = 'javdb';
    var CAT_NAME    = 'JavDB';
    var JAVDB_BASE  = 'https://javdb.com';
    var NYAA_BASE   = 'https://sukebei.nyaa.si';

    var ICON = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
               '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99' +
               ' 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>';

    // ── CORS Proxies ─────────────────────────────────────────
    var PROXIES = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ];

    // ── Helpers ──────────────────────────────────────────────
    function getTorrserver() {
        return Lampa.Storage.get('torrserver_address', '') || '127.0.0.1:8090';
    }

    function fetchWithProxy(url, idx, onOk, onFail) {
        idx = idx || 0;
        if (idx >= PROXIES.length) { if (onFail) onFail(); return; }
        fetch(PROXIES[idx] + encodeURIComponent(url))
            .then(function (r) { if (!r.ok) throw 0; return r.text(); })
            .then(onOk)
            .catch(function () { fetchWithProxy(url, idx + 1, onOk, onFail); });
    }

    // ── JavDB Parsers ────────────────────────────────────────
    function parseList(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var out = [];
        doc.querySelectorAll('.movie-list .item').forEach(function (el) {
            var a     = el.querySelector('a.box');
            var img   = el.querySelector('img');
            var code  = el.querySelector('.uid');
            var title = el.querySelector('.video-title strong');
            var date  = el.querySelector('.meta');
            if (!a) return;
            out.push({
                id    : a.getAttribute('href') || '',
                code  : code  ? code.textContent.trim()  : '',
                title : title ? title.textContent.trim() : '',
                poster: img   ? (img.getAttribute('data-src') || img.src || '') : '',
                date  : date  ? date.textContent.trim()  : ''
            });
        });
        return out;
    }

    function parseDetail(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var d   = { meta: {} };

        var h2 = doc.querySelector('h2.title .current-title');
        d.title = h2 ? h2.textContent.trim() : '';

        var codeEl = doc.querySelector('strong.current-code') || doc.querySelector('h2.title strong');
        d.code = codeEl ? codeEl.textContent.trim() : '';
        if (!d.code) {
            var canon = doc.querySelector('link[rel=canonical]');
            if (canon) { var m = (canon.getAttribute('href') || '').match(/\/v\/([^/?]+)/i); if (m) d.code = m[1].toUpperCase(); }
        }

        var cover = doc.querySelector('.column-video-cover img, .video-meta-panel .column img');
        d.cover = cover ? (cover.getAttribute('src') || cover.getAttribute('data-src') || '') : '';

        doc.querySelectorAll('.panel-block').forEach(function (b) {
            var lbl = b.querySelector('strong'); if (!lbl) return;
            var key = lbl.textContent.replace(':', '').trim();
            var vals = [];
            b.querySelectorAll('a, span.value').forEach(function (s) { if (s.textContent.trim()) vals.push(s.textContent.trim()); });
            if (!vals.length) { var t = b.textContent.replace(lbl.textContent, '').trim(); if (t) vals.push(t); }
            if (vals.length) d.meta[key] = Array.from(new Set(vals)).join(', ');
        });

        var actors = [];
        doc.querySelectorAll('a[href*="/actors/"]').forEach(function (a) { actors.push(a.textContent.trim()); });
        d.actors = Array.from(new Set(actors)).join(', ');

        var score = doc.querySelector('.score .number');
        d.score = score ? score.textContent.trim() : '';

        return d;
    }

    // ── Sukebei Nyaa RSS ─────────────────────────────────────
    function searchNyaa(code, onOk, onFail) {
        var url = NYAA_BASE + '/?page=rss&q=' + encodeURIComponent(code) + '&c=2_2&f=0';
        fetchWithProxy(url, 0, function (xml) {
            var doc   = new DOMParser().parseFromString(xml, 'text/xml');
            var items = doc.querySelectorAll('item');
            var res   = [];
            var codeC = code.replace(/[-\s]/g, '').toLowerCase();

            items.forEach(function (item) {
                var title = (item.querySelector('title') || {}).textContent || '';
                if (!title.replace(/[-\s]/g, '').toLowerCase().includes(codeC)) return;

                var magnet = '', size = '', seeds = 0, leeches = 0;
                var els = item.getElementsByTagName('*');
                for (var i = 0; i < els.length; i++) {
                    switch (els[i].localName) {
                        case 'size':     size    = els[i].textContent; break;
                        case 'seeders':  seeds   = parseInt(els[i].textContent) || 0; break;
                        case 'leechers': leeches = parseInt(els[i].textContent) || 0; break;
                        case 'infoHash': if (els[i].textContent.trim()) magnet = 'magnet:?xt=urn:btih:' + els[i].textContent.trim(); break;
                    }
                }
                if (!magnet) {
                    var enc = item.querySelector('enclosure');
                    if (enc) magnet = enc.getAttribute('url') || '';
                    if (!magnet) {
                        var guid = (item.querySelector('guid') || {}).textContent || '';
                        if (guid.startsWith('magnet:')) magnet = guid;
                    }
                }
                if (!magnet) return;
                res.push({ title: title, magnet: magnet, size: size, seeds: seeds, leeches: leeches });
            });

            res.sort(function (a, b) { return b.seeds - a.seeds; });
            onOk(res);
        }, onFail);
    }

    // ── TorrServer ───────────────────────────────────────────
    function playMagnet(magnet, title, poster) {
        var ts = getTorrserver();
        Lampa.Noty.show('Đang thêm vào TorrServer…');
        fetch('http://' + ts + '/torrents', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', link: magnet, title: title || '', poster: poster || '', save_to_db: true })
        }).catch(function () {}).finally(function () { launchStream(magnet, title, poster); });
    }

    function launchStream(magnet, title, poster) {
        var ts  = getTorrserver();
        var url = 'http://' + ts + '/stream?link=' + encodeURIComponent(magnet) + '&index=0&play';
        Lampa.Player.play({ title: title, url: url, poster: poster });
        Lampa.Player.playlist([{ title: title, url: url, poster: poster }]);
    }

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb_detail
    // ══════════════════════════════════════════════════════════
    function JavdbDetail(object) {
        var movie = object.movie || {};
        var self  = this;

        var $html = $(
            '<div class="jav-detail" style="padding:16px;min-height:100vh;">' +
            '<div class="jav-detail__top" style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;"></div>' +
            '<div class="jav-detail__torrent-title" style="padding:8px 0 6px;color:#f1c40f;font-size:.9em;border-top:1px solid #2a2a2a;margin-bottom:8px;">🧲 Đang tìm torrent…</div>' +
            '<div class="jav-detail__torrents"></div>' +
            '</div>'
        );

        this.create = function () {
            // Hiển thị info từ dữ liệu đã có (poster, code, title)
            self.renderBasic();

            // Load chi tiết từ JavDB
            fetchWithProxy(JAVDB_BASE + movie.id, 0, function (html) {
                var detail = parseDetail(html);
                var code   = detail.code || movie.code || '';
                self.renderFull(detail, code);
                self.findTorrents(code, detail.title || movie.title, detail.cover || movie.poster);
            }, function () {
                // Nếu lỗi proxy, vẫn dùng code từ list
                self.findTorrents(movie.code, movie.title, movie.poster);
            });

            return $html;
        };

        this.renderBasic = function () {
            var $top = $html.find('.jav-detail__top');
            $top.html(
                '<img src="' + (movie.poster || '') + '" style="width:150px;border-radius:6px;flex-shrink:0;" loading="lazy"/>' +
                '<div style="flex:1;min-width:160px;">' +
                '<div style="font-size:1.1em;font-weight:bold;color:#fff;margin-bottom:6px;">' + (movie.title || '') + '</div>' +
                '<div style="color:#e74c3c;font-size:.95em;">🎬 ' + (movie.code || '') + '</div>' +
                '<div style="color:#555;font-size:.8em;margin-top:4px;">' + (movie.date || '') + '</div>' +
                '</div>'
            );
        };

        this.renderFull = function (detail, code) {
            var poster = detail.cover || movie.poster || '';
            var title  = detail.title || movie.title  || '';
            var $top   = $html.find('.jav-detail__top');

            var infoHtml =
                '<div style="font-size:1.1em;font-weight:bold;color:#fff;margin-bottom:6px;">' + title + '</div>' +
                (code        ? '<div style="color:#e74c3c;font-size:.95em;margin-bottom:4px;">🎬 ' + code + '</div>' : '') +
                (detail.score? '<div style="color:#f1c40f;margin-bottom:6px;">⭐ ' + detail.score + '</div>' : '') +
                (detail.actors? '<div style="color:#aaa;font-size:.82em;margin-bottom:4px;"><b style="color:#ccc">Diễn viên:</b> ' + detail.actors + '</div>' : '');

            Object.keys(detail.meta || {}).slice(0, 5).forEach(function (k) {
                infoHtml += '<div style="color:#888;font-size:.8em;"><b style="color:#aaa">' + k + ':</b> ' + detail.meta[k] + '</div>';
            });

            $top.html(
                '<img src="' + poster + '" style="width:150px;border-radius:6px;flex-shrink:0;" loading="lazy"/>' +
                '<div style="flex:1;min-width:160px;">' + infoHtml + '</div>'
            );
        };

        this.findTorrents = function (code, title, poster) {
            var $title    = $html.find('.jav-detail__torrent-title');
            var $torrents = $html.find('.jav-detail__torrents');

            if (!code) {
                $title.text('🧲 Torrent');
                $torrents.html('<div style="color:#888;padding:8px 0;">Không có mã phim để tìm torrent.</div>');
                return;
            }

            $title.text('🧲 Đang tìm torrent cho: ' + code);

            searchNyaa(code, function (list) {
                $title.text('🧲 Torrent (' + list.length + ' kết quả)');
                if (!list.length) {
                    $torrents.html('<div style="color:#888;padding:8px 0;">🚫 Không tìm thấy torrent cho: ' + code + '</div>');
                    return;
                }
                $torrents.empty();
                list.forEach(function (t) {
                    var sc  = t.seeds >= 10 ? '#2ecc71' : t.seeds >= 1 ? '#f39c12' : '#e74c3c';
                    var $bt = $(
                        '<div class="selector" style="padding:10px 12px;background:#1e1e1e;border-radius:6px;margin-bottom:6px;cursor:pointer;border:1px solid #2a2a2a;">' +
                        '<div style="font-size:.85em;color:#eee;margin-bottom:4px;">▶ ' + t.title + '</div>' +
                        '<div style="font-size:.75em;color:#888;">' +
                        (t.size ? '💾 ' + t.size + '&nbsp;&nbsp;' : '') +
                        '<span style="color:' + sc + '">▲ ' + t.seeds + ' seeds</span>' +
                        (t.leeches ? '&nbsp;&nbsp;▼ ' + t.leeches : '') +
                        '</div></div>'
                    );
                    $bt.on('hover:enter click', function () { playMagnet(t.magnet, title || code, poster || ''); });
                    $torrents.append($bt);
                });
            }, function () {
                $title.text('🧲 Torrent');
                $torrents.html('<div style="color:#e74c3c;padding:8px 0;">❌ Lỗi CORS proxy khi tìm torrent.</div>');
            });
        };

        this.start   = function () { return self.create(); };
        this.render  = function () { return $html; };
        this.header  = function () { return movie.code || movie.title || CAT_NAME; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () {};
        this.destroy = function () {};
    }

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb_list – Danh sách phim
    // ══════════════════════════════════════════════════════════
    function JavdbList(object) {
        var category = (object && object.category) || 'newest';
        var query    = (object && object.query)    || '';
        var page     = (object && object.page)     || 1;
        var self     = this;

        var $html = $(
            '<div class="jav-list" style="padding:8px;min-height:100vh;">' +
            '<div class="jav-list__grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;"></div>' +
            '<div class="jav-list__pages" style="display:flex;gap:8px;padding:12px 4px;"></div>' +
            '<div class="jav-list__msg" style="padding:20px;color:#888;display:none;"></div>' +
            '</div>'
        );
        var $grid  = $html.find('.jav-list__grid');
        var $pages = $html.find('.jav-list__pages');
        var $msg   = $html.find('.jav-list__msg');

        this.create = function () {
            $grid.html('<div style="grid-column:1/-1;padding:20px;color:#888;">Đang tải…</div>');

            var path;
            if      (category === 'popular') path = '/popular?page=' + page;
            else if (category === 'search')  path = '/search?q=' + encodeURIComponent(query) + '&f=download&page=' + page;
            else                             path = '/?page=' + page;

            fetchWithProxy(JAVDB_BASE + path, 0, function (html) {
                $grid.empty();
                var movies = parseList(html);
                if (!movies.length) {
                    $grid.html('<div style="grid-column:1/-1;padding:20px;color:#888;">Không tìm thấy phim.</div>');
                    return;
                }
                movies.forEach(function (m) {
                    var $card = $(
                        '<div class="selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                        '<div style="position:relative;padding-top:145%;background:#111;">' +
                        '<img src="' + (m.poster || '') + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=.2"/>' +
                        '</div>' +
                        '<div style="padding:5px 6px;">' +
                        '<div style="font-size:11px;color:#e74c3c;font-weight:bold;">' + (m.code || '') + '</div>' +
                        '<div style="font-size:11px;color:#ccc;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">' + (m.title || '') + '</div>' +
                        '<div style="font-size:10px;color:#555;">' + (m.date || '') + '</div>' +
                        '</div></div>'
                    );
                    $card.on('hover:enter click', (function (mv) {
                        return function () {
                            Lampa.Activity.push({ title: mv.code || mv.title || CAT_NAME, component: 'javdb_detail', movie: mv });
                        };
                    })(m));
                    $grid.append($card);
                });

                // Phân trang
                $pages.empty();
                if (page > 1) {
                    var $prev = $('<div class="selector" style="padding:7px 16px;background:#222;border-radius:20px;font-size:13px;color:#ddd;cursor:pointer;">◀ Trước</div>');
                    $prev.on('hover:enter click', function () {
                        Lampa.Activity.push({ title: object.title || CAT_NAME, component: 'javdb_list', category: category, query: query, page: page - 1 });
                    });
                    $pages.append($prev);
                }
                var $next = $('<div class="selector" style="padding:7px 16px;background:#222;border-radius:20px;font-size:13px;color:#ddd;cursor:pointer;">Tiếp ▶</div>');
                $next.on('hover:enter click', function () {
                    Lampa.Activity.push({ title: object.title || CAT_NAME, component: 'javdb_list', category: category, query: query, page: page + 1 });
                });
                $pages.append($next);

            }, function () {
                $grid.html('<div style="grid-column:1/-1;padding:20px;color:#e74c3c;">❌ Lỗi CORS proxy. Thử lại sau.</div>');
            });

            return $html;
        };

        this.start   = function () { return self.create(); };
        this.render  = function () { return $html; };
        this.header  = function () { return object.title || CAT_NAME; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () {};
        this.destroy = function () {};
    }

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb_home – Trang chủ
    // ══════════════════════════════════════════════════════════
    function JavdbHome() {
        var self = this;

        var $html = $(
            '<div class="jav-home" style="padding:20px;min-height:100vh;">' +
            '<div style="font-size:1.4em;font-weight:bold;color:#fff;margin-bottom:16px;">🎬 JavDB</div>' +
            '<div class="jav-home__btns" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;"></div>' +
            '<div style="padding:12px 16px;background:#1a1a1a;border-radius:8px;font-size:12px;color:#888;line-height:1.9;">' +
            '<b style="color:#e74c3c">ℹ️ Cách hoạt động:</b><br>' +
            '① Duyệt / tìm phim qua <b style="color:#fff">JavDB</b><br>' +
            '② Mở phim → torrent tự tìm trên <b style="color:#fff">Sukebei Nyaa</b> theo mã phim<br>' +
            '③ Chọn torrent → phát qua <b style="color:#4fc3f7">TorrServer</b><br>' +
            '<span style="color:#f39c12">⚙️ TorrServer: <b style="color:#fff" class="jav-ts-addr"></b></span>' +
            '</div></div>'
        );

        var tabs = [
            { key: 'newest',  label: '🆕 Mới nhất'  },
            { key: 'popular', label: '🔥 Phổ biến'  },
            { key: 'search',  label: '🔍 Tìm kiếm'  }
        ];

        this.create = function () {
            $html.find('.jav-ts-addr').text(getTorrserver());
            var $btns = $html.find('.jav-home__btns');
            tabs.forEach(function (tab) {
                var $btn = $('<div class="selector" style="padding:8px 22px;background:#222;border-radius:24px;font-size:14px;color:#ddd;cursor:pointer;">' + tab.label + '</div>');
                $btn.on('hover:enter click', function () {
                    if (tab.key === 'search') {
                        Lampa.Input.edit({ title: 'Tìm kiếm JavDB', value: '', nosave: true }, function (val) {
                            if (!val) return;
                            Lampa.Activity.push({ title: '🔍 ' + val, component: 'javdb_list', category: 'search', query: val, page: 1 });
                        });
                    } else {
                        Lampa.Activity.push({ title: tab.label, component: 'javdb_list', category: tab.key, page: 1 });
                    }
                });
                $btns.append($btn);
            });
            return $html;
        };

        this.start   = function () { return self.create(); };
        this.render  = function () { return $html; };
        this.header  = function () { return CAT_NAME; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () {};
        this.destroy = function () {};
    }

    // ══════════════════════════════════════════════════════════
    //  START  (theo đúng pattern kkphim)
    // ══════════════════════════════════════════════════════════
    function startPlugin() {
        if (window.javdb_started) return;
        window.javdb_started = true;

        Lampa.Component.add('javdb_home',   JavdbHome);
        Lampa.Component.add('javdb_list',   JavdbList);
        Lampa.Component.add('javdb_detail', JavdbDetail);

        // Inject menu vào DOM trực tiếp — giống hệt kkphim
        var $item = $(
            '<li data-action="' + PLUGIN_NAME + '" class="menu__item selector">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">' + CAT_NAME + '</div>' +
            '</li>'
        );
        $item.on('hover:enter', function () {
            Lampa.Activity.push({ title: CAT_NAME, component: 'javdb_home' });
        });
        $('.menu .menu__list').eq(0).append($item);

        console.log('[JavDB] v' + VERSION + ' ready');
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();
