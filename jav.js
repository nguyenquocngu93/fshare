// ============================================================
//  JavDB + Sukebei Nyaa Plugin for Lampa  v2.1.0
//  Info: JavDB  |  Torrent: Sukebei Nyaa RSS  |  Play: TorrServer
// ============================================================
(function () {
    'use strict';

    var VERSION      = '2.1.0';
    var PLUGIN_NAME  = 'javdb';
    var CAT_NAME     = 'JavDB';
    var JAVDB_BASE   = 'https://javdb.com';
    var SUKEBEI_BASE = 'https://sukebei.nyaa.si';

    var ICON = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
               '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
               '</svg>';

    // ── CORS Proxies (thử lần lượt) ──────────────────────────
    var PROXIES = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ];

    // ── Helpers ──────────────────────────────────────────────
    function getTorrserver() {
        return Lampa.Storage.get('torrserver_address', '') || '127.0.0.1:8090';
    }

    function fetchWithProxy(url, proxyIndex, callback, errback) {
        var idx = proxyIndex || 0;
        if (idx >= PROXIES.length) {
            if (errback) errback(new Error('All proxies failed'));
            return;
        }
        var proxyUrl = PROXIES[idx] + encodeURIComponent(url);
        fetch(proxyUrl)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(callback)
            .catch(function () {
                fetchWithProxy(url, idx + 1, callback, errback);
            });
    }

    // ── JavDB HTML Parsers ───────────────────────────────────
    function parseMovieList(html) {
        var doc    = new DOMParser().parseFromString(html, 'text/html');
        var movies = [];
        doc.querySelectorAll('.movie-list .item').forEach(function (item) {
            var linkEl  = item.querySelector('a.box');
            var imgEl   = item.querySelector('img');
            var codeEl  = item.querySelector('.uid');
            var titleEl = item.querySelector('.video-title strong');
            var dateEl  = item.querySelector('.meta');
            if (!linkEl) return;
            movies.push({
                id    : linkEl.getAttribute('href'),
                code  : codeEl  ? codeEl.textContent.trim()  : '',
                title : titleEl ? titleEl.textContent.trim() : '',
                poster: imgEl   ? (imgEl.getAttribute('data-src') || imgEl.src || '') : '',
                date  : dateEl  ? dateEl.textContent.trim()  : ''
            });
        });
        return movies;
    }

    function parseMovieDetail(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var d   = {};

        var h2 = doc.querySelector('h2.title .current-title');
        d.title = h2 ? h2.textContent.trim() : '';

        // Lấy code từ nhiều selector khác nhau
        var codeEl = doc.querySelector('strong.current-code');
        if (!codeEl) codeEl = doc.querySelector('h2.title strong');
        d.code = codeEl ? codeEl.textContent.trim() : '';
        if (!d.code) {
            var canon = doc.querySelector('link[rel=canonical]');
            if (canon) {
                var m = (canon.getAttribute('href') || '').match(/\/v\/([^/?]+)/i);
                if (m) d.code = m[1].toUpperCase();
            }
        }

        var coverEl = doc.querySelector('.column-video-cover img, .video-meta-panel .column img');
        d.cover = coverEl ? (coverEl.getAttribute('src') || coverEl.getAttribute('data-src') || '') : '';

        // Chi tiết (panel-block)
        d.meta = {};
        doc.querySelectorAll('.panel-block').forEach(function (block) {
            var label = block.querySelector('strong');
            if (!label) return;
            var key  = label.textContent.replace(':', '').trim();
            var vals = [];
            block.querySelectorAll('a, span.value').forEach(function (el) {
                var t = el.textContent.trim();
                if (t) vals.push(t);
            });
            if (!vals.length) {
                var allText = block.textContent.replace(label.textContent, '').trim();
                if (allText) vals.push(allText);
            }
            if (vals.length) d.meta[key] = Array.from(new Set(vals)).join(', ');
        });

        // Diễn viên
        var actors = [];
        doc.querySelectorAll('a[href*="/actors/"]').forEach(function (a) {
            actors.push(a.textContent.trim());
        });
        d.actors = Array.from(new Set(actors)).join(', ');

        // Điểm
        var scoreEl = doc.querySelector('.score .number');
        d.score = scoreEl ? scoreEl.textContent.trim() : '';

        return d;
    }

    // ── Sukebei Nyaa RSS ─────────────────────────────────────
    function searchNyaa(code, callback, errback) {
        var url = SUKEBEI_BASE + '/?page=rss&q=' + encodeURIComponent(code) + '&c=2_2&f=0';
        fetchWithProxy(url, 0, function (xml) {
            callback(parseNyaaRSS(xml, code));
        }, errback);
    }

    function parseNyaaRSS(xml, code) {
        var doc     = new DOMParser().parseFromString(xml, 'text/xml');
        var items   = doc.querySelectorAll('item');
        var results = [];

        items.forEach(function (item) {
            var title   = (item.querySelector('title') || {}).textContent || '';
            var magnet  = '';
            var size    = '';
            var seeds   = 0;
            var leeches = 0;

            // Duyệt tất cả tags namespace nyaa
            var allEls = item.getElementsByTagName('*');
            for (var i = 0; i < allEls.length; i++) {
                var el = allEls[i];
                switch (el.localName) {
                    case 'size':     size    = el.textContent; break;
                    case 'seeders':  seeds   = parseInt(el.textContent) || 0; break;
                    case 'leechers': leeches = parseInt(el.textContent) || 0; break;
                    case 'infoHash':
                        if (el.textContent.trim())
                            magnet = 'magnet:?xt=urn:btih:' + el.textContent.trim().toLowerCase();
                        break;
                }
            }

            // Fallback từ link/guid/enclosure
            if (!magnet) {
                var linkEl = item.querySelector('link');
                var guidEl = item.querySelector('guid');
                var enc    = item.querySelector('enclosure');
                var raw    = (linkEl && linkEl.textContent) || (guidEl && guidEl.textContent) || '';
                if (raw && raw.startsWith('magnet:')) magnet = raw;
                if (!magnet && enc) magnet = enc.getAttribute('url') || '';
            }

            if (!magnet) return;

            // Chỉ giữ kết quả có mã phim trong tên
            var codeClean  = code.replace(/[-\s]/g, '').toLowerCase();
            var titleClean = title.replace(/[-\s]/g, '').toLowerCase();
            if (!titleClean.includes(codeClean)) return;

            results.push({ title: title, magnet: magnet, size: size, seeds: seeds, leeches: leeches });
        });

        // Sort: nhiều seeds nhất lên đầu
        results.sort(function (a, b) { return b.seeds - a.seeds; });
        return results;
    }

    // ── TorrServer Play ──────────────────────────────────────
    function playMagnet(magnet, title, poster) {
        var ts = getTorrserver();
        Lampa.Noty.show('Đang thêm vào TorrServer…');

        fetch('http://' + ts + '/torrents', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({
                action    : 'add',
                link      : magnet,
                title     : title  || '',
                poster    : poster || '',
                save_to_db: true
            })
        })
        .then(function (r) { return r.json(); })
        .then(function () { launchStream(magnet, title, poster); })
        .catch(function ()  { launchStream(magnet, title, poster); });
    }

    function launchStream(magnet, title, poster) {
        var ts  = getTorrserver();
        var url = 'http://' + ts + '/stream?link=' + encodeURIComponent(magnet) + '&index=0&play';
        Lampa.Player.play({ title: title, url: url, poster: poster });
        Lampa.Player.playlist([{ title: title, url: url, poster: poster }]);
    }

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb_detail – Chi tiết phim + torrent
    // ══════════════════════════════════════════════════════════
    function JavdbDetail(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var self   = this;
        var movie  = object.movie;

        this.create = function () {
            scroll.minus();
            scroll.append(Lampa.Template.get('loading'));

            fetchWithProxy(JAVDB_BASE + movie.id, 0, function (html) {
                scroll.clear();
                var detail = parseMovieDetail(html);
                var code   = detail.code || movie.code || '';
                self.renderInfo(detail, code);
                self.loadTorrents(code, detail.title || movie.title, detail.cover || movie.poster);
                self.activity.toggle();
            }, function () {
                scroll.clear();
                self.showMsg('❌ Lỗi CORS proxy. Thử lại sau.', '#e74c3c');
                self.activity.toggle();
            });
            this.activity.toggle();
        };

        this.renderInfo = function (detail, code) {
            var title  = detail.title || movie.title || code;
            var poster = detail.cover  || movie.poster || '';

            var wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;gap:20px;padding:20px;flex-wrap:wrap;';

            var imgBox = document.createElement('div');
            imgBox.innerHTML = '<img src="' + poster + '" style="width:180px;border-radius:8px;display:block;" loading="lazy"/>';

            var infoBox = document.createElement('div');
            infoBox.style.cssText = 'flex:1;min-width:200px;';
            var html = '<div style="font-size:1.2em;font-weight:bold;color:#fff;margin-bottom:8px;">' + title + '</div>';
            if (code)          html += '<div style="color:#e74c3c;font-size:.95em;margin-bottom:6px;">🎬 ' + code + '</div>';
            if (detail.score)  html += '<div style="color:#f1c40f;margin-bottom:8px;">⭐ ' + detail.score + '</div>';
            if (detail.actors) html += '<div style="color:#aaa;font-size:.85em;margin-bottom:6px;"><b style="color:#ddd">Diễn viên:</b> ' + detail.actors + '</div>';
            if (detail.meta) {
                Object.keys(detail.meta).slice(0, 6).forEach(function (k) {
                    html += '<div style="color:#aaa;font-size:.82em;"><b style="color:#bbb">' + k + ':</b> ' + detail.meta[k] + '</div>';
                });
            }
            infoBox.innerHTML = html;

            wrap.appendChild(imgBox);
            wrap.appendChild(infoBox);
            scroll.append(wrap);

            // Tiêu đề section torrent
            var divider = document.createElement('div');
            divider.style.cssText = 'padding:10px 20px 4px;color:#f1c40f;font-size:.9em;border-top:1px solid #2a2a2a;margin:0 20px;';
            divider.textContent = '🧲 Danh sách Torrent';
            scroll.append(divider);

            // Placeholder chờ load torrent
            var ph = document.createElement('div');
            ph.id = 'jav_torrent_area';
            ph.style.cssText = 'padding:12px 20px;color:#888;font-size:.85em;';
            ph.textContent = 'Đang tìm torrent cho [' + (code || '?') + ']…';
            scroll.append(ph);
        };

        this.loadTorrents = function (code, title, poster) {
            if (!code) {
                self.replaceTorrentArea(self.msgEl('🚫 Không có mã phim để tìm torrent', '#888'));
                return;
            }
            searchNyaa(code, function (torrents) {
                if (!torrents.length) {
                    self.replaceTorrentArea(self.msgEl('🚫 Không tìm thấy torrent cho: ' + code, '#888'));
                    return;
                }
                var section = document.createElement('div');
                section.style.cssText = 'padding:6px 20px 20px;display:flex;flex-direction:column;gap:6px;';
                torrents.forEach(function (t) {
                    var btn = document.createElement('div');
                    btn.className = 'selector';
                    btn.style.cssText = 'padding:10px 14px;background:#1e1e1e;border-radius:6px;cursor:pointer;border:1px solid #2a2a2a;';
                    var sc = t.seeds >= 10 ? '#2ecc71' : t.seeds >= 1 ? '#f39c12' : '#e74c3c';
                    btn.innerHTML =
                        '<div style="font-size:.88em;color:#eee;margin-bottom:4px;">▶ ' + t.title + '</div>' +
                        '<div style="font-size:.78em;color:#888;">' +
                        (t.size ? '💾 ' + t.size + '&nbsp;&nbsp;' : '') +
                        '<span style="color:' + sc + '">▲ ' + t.seeds + ' seeds</span>' +
                        (t.leeches ? '&nbsp;&nbsp;▼ ' + t.leeches : '') +
                        '</div>';
                    var play = function () { playMagnet(t.magnet, title, poster); };
                    btn.addEventListener('hover:enter', play);
                    btn.addEventListener('click', play);
                    section.appendChild(btn);
                });
                self.replaceTorrentArea(section);
            }, function () {
                self.replaceTorrentArea(self.msgEl('❌ Lỗi tìm torrent (CORS proxy)', '#e74c3c'));
            });
        };

        this.replaceTorrentArea = function (newEl) {
            var old = scroll.render()[0].querySelector('#jav_torrent_area');
            if (old) old.replaceWith(newEl);
            else scroll.append(newEl);
        };

        this.msgEl = function (text, color) {
            var el = document.createElement('div');
            el.style.cssText = 'padding:12px 20px;font-size:.85em;color:' + (color || '#aaa') + ';';
            el.textContent = text;
            return el;
        };

        this.showMsg = function (text, color) {
            scroll.append(self.msgEl(text, color));
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up    : function () { Navigator.canmove('up')   ? Navigator.move('up')   : Lampa.Controller.toggle('head'); },
                down  : function () { Navigator.canmove('down') ? Navigator.move('down') : false; },
                left  : function () { Navigator.canmove('left') ? Navigator.move('left') : Lampa.Controller.toggle('menu'); },
                right : function () { Navigator.canmove('right')? Navigator.move('right'): false; },
                back  : function () { self.back(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render  = function () { return scroll.render(); };
        this.destroy = function () {};
    }

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb_list – Danh sách phim (grid + phân trang)
    // ══════════════════════════════════════════════════════════
    function JavdbList(object) {
        var scroll   = new Lampa.Scroll({ mask: true, over: true });
        var self     = this;
        var page     = (object && object.page)     || 1;
        var category = (object && object.category) || 'newest';
        var query    = (object && object.query)    || '';

        this.create = function () {
            scroll.minus();
            self.loadPage();
            this.activity.toggle();
        };

        this.loadPage = function () {
            scroll.clear();
            scroll.append(Lampa.Template.get('loading'));

            var path;
            if      (category === 'popular') path = '/popular?page=' + page;
            else if (category === 'search')  path = '/search?q=' + encodeURIComponent(query) + '&f=download&page=' + page;
            else                             path = '/?page=' + page;

            fetchWithProxy(JAVDB_BASE + path, 0, function (html) {
                scroll.clear();
                var movies = parseMovieList(html);
                if (!movies.length) {
                    scroll.append(self.msgEl('Không tìm thấy phim', '#888'));
                    self.activity.toggle();
                    return;
                }

                var grid = document.createElement('div');
                grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;padding:14px 16px;';
                movies.forEach(function (m) { grid.appendChild(self.createCard(m)); });
                scroll.append(grid);

                // Phân trang
                var bar = document.createElement('div');
                bar.style.cssText = 'display:flex;gap:10px;padding:10px 16px 20px;';
                if (page > 1) bar.appendChild(self.pageBtn('◀ Trước', page - 1));
                bar.appendChild(self.pageBtn('Tiếp ▶', page + 1));
                scroll.append(bar);

                self.activity.toggle();
            }, function () {
                scroll.clear();
                scroll.append(self.msgEl('❌ Lỗi CORS proxy', '#e74c3c'));
                self.activity.toggle();
            });
        };

        this.createCard = function (movie) {
            var card = document.createElement('div');
            card.className = 'selector';
            card.style.cssText = 'width:130px;cursor:pointer;';
            card.innerHTML =
                '<div style="width:130px;height:185px;background:#111;border-radius:6px;overflow:hidden;">' +
                '<img src="' + (movie.poster || '') + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>' +
                '</div>' +
                '<div style="font-size:11px;color:#e74c3c;padding:3px 2px 0;font-weight:bold;">' + (movie.code || '') + '</div>' +
                '<div style="font-size:11px;color:#ccc;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 2px;" title="' + (movie.title || '') + '">' + (movie.title || '') + '</div>' +
                '<div style="font-size:10px;color:#555;padding:0 2px 4px;">' + (movie.date || '') + '</div>';

            var open = function () {
                Lampa.Activity.push({
                    title    : movie.code || movie.title || CAT_NAME,
                    component: 'javdb_detail',
                    movie    : movie
                });
            };
            card.addEventListener('hover:enter', open);
            card.addEventListener('click', open);
            return card;
        };

        this.pageBtn = function (label, targetPage) {
            var btn = document.createElement('div');
            btn.className = 'selector';
            btn.style.cssText = 'padding:7px 18px;background:#222;border-radius:20px;font-size:13px;color:#ddd;cursor:pointer;';
            btn.textContent = label;
            var go = function () {
                Lampa.Activity.push({
                    title    : (object && object.title) || CAT_NAME,
                    component: 'javdb_list',
                    category : category,
                    query    : query,
                    page     : targetPage
                });
            };
            btn.addEventListener('hover:enter', go);
            btn.addEventListener('click', go);
            return btn;
        };

        this.msgEl = function (text, color) {
            var el = document.createElement('div');
            el.style.cssText = 'padding:20px;color:' + (color || '#aaa') + ';font-size:.9em;';
            el.textContent = text;
            return el;
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up    : function () { Navigator.canmove('up')   ? Navigator.move('up')   : Lampa.Controller.toggle('head'); },
                down  : function () { Navigator.canmove('down') ? Navigator.move('down') : false; },
                left  : function () { Navigator.canmove('left') ? Navigator.move('left') : Lampa.Controller.toggle('menu'); },
                right : function () { Navigator.canmove('right')? Navigator.move('right'): false; },
                back  : function () { self.back(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render  = function () { return scroll.render(); };
        this.destroy = function () {};
    }

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb_home – Trang chủ
    // ══════════════════════════════════════════════════════════
    function JavdbHome() {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var self   = this;

        this.create = function () {
            scroll.minus();

            var header = document.createElement('div');
            header.style.cssText = 'padding:18px 20px 10px;font-size:1.3em;color:#fff;font-weight:bold;';
            header.innerHTML = ICON.replace('viewBox', 'style="width:24px;height:24px;vertical-align:middle;margin-right:8px;" viewBox') + ' JavDB';
            scroll.append(header);

            var btnWrap = document.createElement('div');
            btnWrap.style.cssText = 'display:flex;gap:12px;padding:0 20px 16px;flex-wrap:wrap;';

            [
                { key: 'newest',  label: '🆕 Mới nhất'  },
                { key: 'popular', label: '🔥 Phổ biến'  },
                { key: 'search',  label: '🔍 Tìm kiếm'  }
            ].forEach(function (tab) {
                var btn = document.createElement('div');
                btn.className = 'selector';
                btn.style.cssText = 'padding:8px 22px;background:#222;border-radius:24px;font-size:14px;color:#ddd;cursor:pointer;';
                btn.textContent = tab.label;
                var go = function () {
                    if (tab.key === 'search') {
                        Lampa.Input.edit({ title: 'Tìm kiếm JavDB', value: '', nosave: true }, function (val) {
                            if (!val) return;
                            Lampa.Activity.push({ title: '🔍 ' + val, component: 'javdb_list', category: 'search', query: val, page: 1 });
                        });
                    } else {
                        Lampa.Activity.push({ title: tab.label, component: 'javdb_list', category: tab.key, page: 1 });
                    }
                };
                btn.addEventListener('hover:enter', go);
                btn.addEventListener('click', go);
                btnWrap.appendChild(btn);
            });
            scroll.append(btnWrap);

            var banner = document.createElement('div');
            banner.style.cssText = 'margin:0 20px;padding:12px 16px;background:#1a1a1a;border-radius:8px;font-size:12px;color:#888;line-height:1.9;';
            banner.innerHTML =
                '<b style="color:#e74c3c">ℹ️ Cách hoạt động:</b><br>' +
                '① Duyệt / tìm phim qua <b style="color:#fff">JavDB</b><br>' +
                '② Mở phim → torrent tự tìm trên <b style="color:#fff">Sukebei Nyaa</b> theo mã phim<br>' +
                '③ Chọn torrent → phát qua <b style="color:#4fc3f7">TorrServer</b><br>' +
                '<span style="color:#f39c12">⚙️ TorrServer: <b style="color:#fff">' + getTorrserver() + '</b></span>';
            scroll.append(banner);

            this.activity.toggle();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up    : function () { Navigator.canmove('up')   ? Navigator.move('up')   : Lampa.Controller.toggle('head'); },
                down  : function () { Navigator.canmove('down') ? Navigator.move('down') : false; },
                left  : function () { Navigator.canmove('left') ? Navigator.move('left') : Lampa.Controller.toggle('menu'); },
                right : function () { Navigator.canmove('right')? Navigator.move('right'): false; },
                back  : function () { self.back(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render  = function () { return scroll.render(); };
        this.destroy = function () {};
    }

    // ══════════════════════════════════════════════════════════
    //  START PLUGIN  (theo đúng pattern của kkphim.js)
    // ══════════════════════════════════════════════════════════
    function startPlugin() {
        if (window.javdb_started) return;
        window.javdb_started = true;

        // Đăng ký components
        Lampa.Component.add('javdb_home',   JavdbHome);
        Lampa.Component.add('javdb_list',   JavdbList);
        Lampa.Component.add('javdb_detail', JavdbDetail);

        // ── Inject menu item trực tiếp vào DOM (giống kkphim) ──
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

        console.log('[JavDB Plugin] v' + VERSION + ' started');
    }

    // ── Bootstrap (giống kkphim) ─────────────────────────────
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();
