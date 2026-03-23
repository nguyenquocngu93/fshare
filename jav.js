// ============================================================
//  JavDB + Sukebei Nyaa Plugin for Lampa  v2.0.0
//  Info: JavDB  |  Torrent: Sukebei Nyaa RSS  |  Play: TorrServer
// ============================================================
(function () {
    'use strict';

    var VERSION = '2.0.0';

    // ── CORS Proxies (fallback lần lượt nếu cái trước lỗi) ──
    var PROXIES = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ];

    var JAVDB_BASE   = 'https://javdb.com';
    var SUKEBEI_BASE = 'https://sukebei.nyaa.si';

    // ── Utility ──────────────────────────────────────────────
    function getTorrserver() {
        return Lampa.Storage.get('torrserver_address', '') || '127.0.0.1:8090';
    }

    // Thử proxy lần lượt
    function fetchWithProxy(url, proxyIndex, callback, errback) {
        var idx = proxyIndex || 0;
        if (idx >= PROXIES.length) { if (errback) errback(new Error('All proxies failed')); return; }
        var proxy = PROXIES[idx] + encodeURIComponent(url);
        fetch(proxy)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function (text) { callback(text); })
            .catch(function () {
                fetchWithProxy(url, idx + 1, callback, errback);
            });
    }

    // ── JavDB Parsers ────────────────────────────────────────
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

        var codeEl = doc.querySelector('h2.title strong.current-code, .title strong');
        d.code = codeEl ? codeEl.textContent.trim() : '';
        if (!d.code) {
            var canon = doc.querySelector('link[rel=canonical]');
            if (canon) {
                var m = canon.getAttribute('href').match(/\/v\/([^/?]+)/i);
                if (m) d.code = m[1].toUpperCase();
            }
        }

        var coverEl = doc.querySelector('.column-video-cover img, .video-meta-panel .column img');
        d.cover = coverEl ? (coverEl.getAttribute('src') || coverEl.getAttribute('data-src') || '') : '';

        d.meta = {};
        doc.querySelectorAll('.panel-block').forEach(function (block) {
            var label = block.querySelector('strong');
            if (!label) return;
            var key = label.textContent.replace(':', '').trim();
            var vals = [];
            block.querySelectorAll('a, span.value, span').forEach(function (el) {
                var t = el.textContent.trim();
                if (t && t !== key) vals.push(t);
            });
            if (vals.length) d.meta[key] = Array.from(new Set(vals)).join(', ');
        });

        var actorEls = doc.querySelectorAll('a[href*="/actors/"]');
        var actors = [];
        actorEls.forEach(function (a) { actors.push(a.textContent.trim()); });
        d.actors = Array.from(new Set(actors)).join(', ');

        var scoreEl = doc.querySelector('.score .number');
        d.score = scoreEl ? scoreEl.textContent.trim() : '';

        return d;
    }

    // ── Sukebei Nyaa RSS ─────────────────────────────────────
    // Category 2_2 = Real Life – Videos (JAV)
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
            var title   = (item.querySelector('title')   || {}).textContent || '';
            var magnet  = '';
            var size    = '';
            var seeds   = 0;
            var leeches = 0;

            // Nyaa namespace tags
            var allEls = item.getElementsByTagName('*');
            for (var i = 0; i < allEls.length; i++) {
                var el = allEls[i];
                var ln = el.localName;
                if (ln === 'size')     size    = el.textContent;
                if (ln === 'seeders')  seeds   = parseInt(el.textContent) || 0;
                if (ln === 'leechers') leeches = parseInt(el.textContent) || 0;
                if (ln === 'infoHash' && el.textContent) {
                    magnet = 'magnet:?xt=urn:btih:' + el.textContent.trim().toLowerCase();
                }
            }

            // fallback: link hoặc guid chứa magnet
            if (!magnet) {
                var linkEl = item.querySelector('link');
                var guidEl = item.querySelector('guid');
                var enc    = item.querySelector('enclosure');
                var raw    = (linkEl && linkEl.textContent) || (guidEl && guidEl.textContent) || '';
                if (raw && raw.startsWith('magnet:')) magnet = raw;
                if (!magnet && enc) magnet = enc.getAttribute('url') || '';
            }

            if (!magnet) return;

            // Lọc chỉ lấy kết quả có mã phim trong tên
            var codeClean  = code.replace(/[-\s]/g, '').toLowerCase();
            var titleClean = title.replace(/[-\s]/g, '').toLowerCase();
            if (!titleClean.includes(codeClean)) return;

            results.push({ title: title, magnet: magnet, size: size, seeds: seeds, leeches: leeches });
        });

        // Ưu tiên nhiều seeds nhất
        results.sort(function (a, b) { return b.seeds - a.seeds; });
        return results;
    }

    // ── TorrServer ───────────────────────────────────────────
    function playMagnet(magnet, title, poster) {
        var ts = getTorrserver();
        Lampa.Noty.show(Lampa.Lang.translate('javdb_adding_torrent'));

        fetch('http://' + ts + '/torrents', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({
                action    : 'add',
                link      : magnet,
                title     : title || '',
                poster    : poster || '',
                save_to_db: true
            })
        })
        .then(function (r) { return r.json(); })
        .then(function () { launchStream(magnet, title, poster); })
        .catch(function () { launchStream(magnet, title, poster); });
    }

    function launchStream(magnet, title, poster) {
        var ts  = getTorrserver();
        var url = 'http://' + ts + '/stream?link=' + encodeURIComponent(magnet) + '&index=0&play';
        Lampa.Player.play({ title: title, url: url, poster: poster });
        Lampa.Player.playlist([{ title: title, url: url, poster: poster }]);
    }

    // ── Lang ─────────────────────────────────────────────────
    Lampa.Lang.add({
        javdb_newest        : { vi: 'Mới nhất',               en: 'Newest',              ru: 'Новинки'       },
        javdb_popular       : { vi: 'Phổ biến',               en: 'Popular',             ru: 'Популярное'    },
        javdb_search        : { vi: 'Tìm kiếm',               en: 'Search',              ru: 'Поиск'         },
        javdb_actors        : { vi: 'Diễn viên',              en: 'Actresses',           ru: 'Актрисы'       },
        javdb_score         : { vi: 'Điểm',                   en: 'Score',               ru: 'Оценка'        },
        javdb_torrents      : { vi: 'Danh sách Torrent',      en: 'Torrents',            ru: 'Торренты'      },
        javdb_no_torrents   : { vi: 'Không tìm thấy torrent', en: 'No torrents found',   ru: 'Нет торрентов' },
        javdb_searching     : { vi: 'Đang tìm torrent…',      en: 'Searching torrents…', ru: 'Поиск…'        },
        javdb_adding_torrent: { vi: 'Đang thêm vào TorrServer…', en: 'Adding to TorrServer…', ru: 'Добавляем…' },
        javdb_error_proxy   : { vi: 'Lỗi CORS proxy.',        en: 'CORS proxy error.',   ru: 'Ошибка прокси.'},
        javdb_no_result     : { vi: 'Không tìm thấy phim',    en: 'No result',           ru: 'Нет результатов'},
        javdb_seeds         : { vi: 'Seeds',                  en: 'Seeds',               ru: 'Сиды'          }
    });

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb_detail
    // ══════════════════════════════════════════════════════════
    Lampa.Component.add('javdb_detail', function (object) {
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
                self.showMsg(Lampa.Lang.translate('javdb_error_proxy'), '#e74c3c');
                self.activity.toggle();
            });

            this.activity.toggle();
        };

        this.renderInfo = function (detail, code) {
            var title  = detail.title || movie.title || code;
            var poster = detail.cover  || movie.poster || '';

            var wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;gap:20px;padding:20px;flex-wrap:wrap;';

            var imgWrap = document.createElement('div');
            imgWrap.innerHTML = '<img src="' + poster + '" style="width:180px;border-radius:8px;display:block;" loading="lazy"/>';

            var infoWrap = document.createElement('div');
            infoWrap.style.cssText = 'flex:1;min-width:200px;';
            var html = '<div style="font-size:1.2em;font-weight:bold;color:#fff;margin-bottom:8px;">' + title + '</div>';
            if (code)         html += '<div style="color:#e74c3c;font-size:.95em;margin-bottom:6px;">🎬 ' + code + '</div>';
            if (detail.score) html += '<div style="color:#f1c40f;margin-bottom:8px;">⭐ ' + detail.score + '</div>';
            if (detail.actors)html += '<div style="color:#aaa;font-size:.85em;margin-bottom:6px;"><b style="color:#ddd">' + Lampa.Lang.translate('javdb_actors') + ':</b> ' + detail.actors + '</div>';
            if (detail.meta) {
                Object.keys(detail.meta).slice(0, 6).forEach(function (k) {
                    html += '<div style="color:#aaa;font-size:.82em;"><b style="color:#bbb">' + k + ':</b> ' + detail.meta[k] + '</div>';
                });
            }
            infoWrap.innerHTML = html;

            wrap.appendChild(imgWrap);
            wrap.appendChild(infoWrap);
            scroll.append(wrap);

            var divider = document.createElement('div');
            divider.style.cssText = 'padding:8px 20px 4px;color:#f1c40f;font-size:.9em;margin:0 20px;border-top:1px solid #333;';
            divider.textContent = '🧲 ' + Lampa.Lang.translate('javdb_torrents');
            scroll.append(divider);

            var placeholder = document.createElement('div');
            placeholder.id = 'jav_torrent_area';
            placeholder.style.cssText = 'padding:12px 20px;color:#aaa;font-size:.85em;';
            placeholder.textContent = Lampa.Lang.translate('javdb_searching') + ' [' + (code || '?') + ']';
            scroll.append(placeholder);
        };

        this.loadTorrents = function (code, title, poster) {
            if (!code) {
                self.replaceTorrentArea(self.noTorrentEl());
                return;
            }
            searchNyaa(code, function (torrents) {
                if (!torrents.length) {
                    self.replaceTorrentArea(self.noTorrentEl());
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
                        (t.leeches ? '&nbsp; ▼ ' + t.leeches : '') +
                        '</div>';
                    var play = function () { playMagnet(t.magnet, title, poster); };
                    btn.addEventListener('hover:enter', play);
                    btn.addEventListener('click', play);
                    section.appendChild(btn);
                });
                self.replaceTorrentArea(section);
            }, function () {
                self.replaceTorrentArea(self.msgEl(Lampa.Lang.translate('javdb_error_proxy'), '#e74c3c'));
            });
        };

        this.noTorrentEl = function () {
            return self.msgEl('🚫 ' + Lampa.Lang.translate('javdb_no_torrents'), '#888');
        };

        this.msgEl = function (text, color) {
            var el = document.createElement('div');
            el.style.cssText = 'padding:12px 20px;font-size:.85em;color:' + (color || '#aaa') + ';';
            el.textContent = text;
            return el;
        };

        this.showMsg = function (text, color) {
            var el = self.msgEl(text, color);
            scroll.append(el);
        };

        this.replaceTorrentArea = function (newEl) {
            var old = scroll.render()[0].querySelector('#jav_torrent_area');
            if (old) old.replaceWith(newEl);
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up   : function () { Navigator.canmove('up') ? Navigator.move('up') : Lampa.Controller.toggle('head'); },
                down : function () { Navigator.move('down'); },
                left : function () { Navigator.canmove('left') ? Navigator.move('left') : Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                back : function () { self.back(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render  = function () { return scroll.render(); };
        this.destroy = function () {};
    });

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb  (danh sách phim)
    // ══════════════════════════════════════════════════════════
    Lampa.Component.add('javdb', function (object) {
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
            if (category === 'popular')     path = '/popular?page=' + page;
            else if (category === 'search') path = '/search?q=' + encodeURIComponent(query) + '&f=download&page=' + page;
            else                            path = '/?page=' + page;

            fetchWithProxy(JAVDB_BASE + path, 0, function (html) {
                scroll.clear();
                var movies = parseMovieList(html);

                if (!movies.length) {
                    var msg = document.createElement('div');
                    msg.className = 'message';
                    msg.innerHTML = '<div class="message__title">' + Lampa.Lang.translate('javdb_no_result') + '</div>';
                    scroll.append(msg);
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
                var msg = document.createElement('div');
                msg.className = 'message';
                msg.innerHTML = '<div class="message__title">' + Lampa.Lang.translate('javdb_error_proxy') + '</div>';
                scroll.append(msg);
                self.activity.toggle();
            });
        };

        this.createCard = function (movie) {
            var card = document.createElement('div');
            card.className = 'selector';
            card.style.cssText = 'width:130px;cursor:pointer;';
            card.innerHTML =
                '<div style="width:130px;height:185px;background:#111;border-radius:6px;overflow:hidden;">' +
                '<img src="' + movie.poster + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>' +
                '</div>' +
                '<div style="font-size:11px;color:#e74c3c;padding:3px 2px 0;font-weight:bold;">' + (movie.code || '') + '</div>' +
                '<div style="font-size:11px;color:#ccc;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 2px;" title="' + (movie.title || '') + '">' + (movie.title || '') + '</div>' +
                '<div style="font-size:10px;color:#555;padding:0 2px 4px;">' + (movie.date || '') + '</div>';

            var open = function () {
                Lampa.Activity.push({
                    title    : movie.code || movie.title || 'JavDB',
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
            btn.addEventListener('hover:enter', function () {
                Lampa.Activity.push({
                    title    : object.title || 'JavDB',
                    component: 'javdb',
                    category : category,
                    query    : query,
                    page     : targetPage
                });
            });
            btn.addEventListener('click', function () { btn.dispatchEvent(new Event('hover:enter')); });
            return btn;
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up   : function () { Navigator.canmove('up') ? Navigator.move('up') : Lampa.Controller.toggle('head'); },
                down : function () { Navigator.move('down'); },
                left : function () { Navigator.canmove('left') ? Navigator.move('left') : Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                back : function () { self.back(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render  = function () { return scroll.render(); };
        this.destroy = function () {};
    });

    // ══════════════════════════════════════════════════════════
    //  COMPONENT: javdb_home
    // ══════════════════════════════════════════════════════════
    Lampa.Component.add('javdb_home', function () {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var self   = this;

        this.create = function () {
            scroll.minus();

            var header = document.createElement('div');
            header.style.cssText = 'padding:18px 20px 10px;font-size:1.3em;color:#fff;font-weight:bold;';
            header.textContent = '🎬 JavDB';
            scroll.append(header);

            var btnWrap = document.createElement('div');
            btnWrap.style.cssText = 'display:flex;gap:12px;padding:0 20px 16px;flex-wrap:wrap;';

            [
                { key: 'newest',  label: '🆕 ' + Lampa.Lang.translate('javdb_newest')  },
                { key: 'popular', label: '🔥 ' + Lampa.Lang.translate('javdb_popular') },
                { key: 'search',  label: '🔍 ' + Lampa.Lang.translate('javdb_search')  }
            ].forEach(function (tab) {
                var btn = document.createElement('div');
                btn.className = 'selector';
                btn.style.cssText = 'padding:8px 22px;background:#222;border-radius:24px;font-size:14px;color:#ddd;cursor:pointer;';
                btn.textContent = tab.label;
                btn.addEventListener('hover:enter', function () {
                    if (tab.key === 'search') {
                        Lampa.Input.edit({ title: Lampa.Lang.translate('javdb_search'), value: '', nosave: true }, function (val) {
                            if (!val) return;
                            Lampa.Activity.push({ title: '🔍 ' + val, component: 'javdb', category: 'search', query: val, page: 1 });
                        });
                    } else {
                        Lampa.Activity.push({ title: tab.label, component: 'javdb', category: tab.key, page: 1 });
                    }
                });
                btn.addEventListener('click', function () { btn.dispatchEvent(new Event('hover:enter')); });
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
                '<span style="color:#f39c12">⚙️ TorrServer hiện tại: <b style="color:#fff">' + getTorrserver() + '</b></span>';
            scroll.append(banner);

            this.activity.toggle();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up   : function () { Navigator.canmove('up') ? Navigator.move('up') : Lampa.Controller.toggle('head'); },
                down : function () { Navigator.move('down'); },
                left : function () { Navigator.canmove('left') ? Navigator.move('left') : Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                back : function () { self.back(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render  = function () { return scroll.render(); };
        this.destroy = function () {};
    });

    // ══════════════════════════════════════════════════════════
    //  MENU
    // ══════════════════════════════════════════════════════════
    function injectMenu() {
        Lampa.Listener.follow('menu', function (e) {
            if (e.type !== 'start') return;
            var ul = e.object.render().find('.menu__list');
            if (!ul.length) return;
            var li = $('<li class="menu__item selector"></li>');
            li.html(
                '<div class="menu__ico">' +
                '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">' +
                '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                '</svg></div><div class="menu__text">JavDB</div>'
            );
            li.on('hover:enter click', function () {
                Lampa.Activity.push({ title: 'JavDB', component: 'javdb_home' });
            });
            ul.append(li);
        });
    }

    // ══════════════════════════════════════════════════════════
    //  INIT
    // ══════════════════════════════════════════════════════════
    function init() {
        console.log('[JavDB Plugin] v' + VERSION + ' ready');
        injectMenu();
    }

    if (window.Lampa) {
        Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') init(); });
    } else {
        var t = setInterval(function () { if (window.Lampa) { clearInterval(t); init(); } }, 500);
    }

})();
