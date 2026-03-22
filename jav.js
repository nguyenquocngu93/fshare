(function () {
    'use strict';

    /* ============================================================
       OneJAV Plugin for Lampa  —  v1.0.0
       Source: https://onejav.com
       Phát torrent qua TorrServer đã cài trong Lampa Settings
    ============================================================ */

    var PLUGIN_ID = 'onejav';
    var BASE_URL  = 'https://onejav.com';


    /* ============================================================
       FETCH - XMLHttpRequest thuần
       onejav.com không có Cloudflare block như ijavtorrent
    ============================================================ */
    function fetchPage(url, ok, fail) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 20000;
        xhr.setRequestHeader('Accept', 'text/html,*/*');
        xhr.setRequestHeader('User-Agent', 'Mozilla/5.0');

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            if (xhr.status >= 200 && xhr.status < 400) {
                ok(xhr.responseText || '');
            } else if (xhr.responseText && xhr.responseText.length > 100) {
                ok(xhr.responseText);
            } else {
                if (fail) fail('HTTP ' + xhr.status);
            }
        };
        xhr.ontimeout = function () { if (fail) fail('Timeout'); };
        xhr.onerror   = function () {
            // Thử Lampa.Reguest làm fallback
            try {
                var req = new Lampa.Reguest();
                req.timeout(20000);
                req.native(url, function (resp) {
                    // native() trả về responseText trực tiếp
                    var text = typeof resp === 'string' ? resp : (resp && resp.responseText) || '';
                    if (text.length > 100) ok(text);
                    else if (fail) fail('Lampa.Reguest: response rỗng');
                }, function () {
                    if (fail) fail('XHR + Reguest đều lỗi');
                }, false);
            } catch (e) {
                if (fail) fail('XHR error: ' + e.message);
            }
        };

        try { xhr.send(); } catch (e) { if (fail) fail(e.message); }
    }


    /* ============================================================
       PARSER - DANH SÁCH
       Mỗi card trên onejav.com:
         <a href="/torrent/xxx"><img src="..."> CODE Actress (size)</a>
    ============================================================ */
    function parseList(html) {
        var movies = [], seen = {};
        var $doc = $('<div>').html(html);

        // Mỗi card là <a href="/torrent/xxx"> chứa <img> và text
        $doc.find('a[href^="/torrent/"]').each(function () {
            var $a   = $(this);
            var href = $a.attr('href') || '';
            if (!/^\/torrent\/.+/.test(href)) return;

            var full = BASE_URL + href;
            if (seen[full]) return;
            seen[full] = true;

            // Lấy ảnh
            var poster = $a.find('img').attr('src') || '';

            // Text: "CODE Actress (size)" hoặc "CODE (size)"
            var text = $a.text().trim().replace(/\s+/g, ' ');
            if (!text || text.length < 2) return;

            // Tách code từ slug
            var slug  = href.replace('/torrent/', '');
            var code  = slug.toUpperCase();

            movies.push({
                id:              slug,
                title:           text || code,
                original_title:  code,
                overview:        '',
                poster:          poster,
                poster_path:     poster,
                background_path: poster,
                url:             full,
                slug:            slug,
                type:            'movie',
                source:          PLUGIN_ID
            });
        });

        return movies;
    }


    /* ============================================================
       PARSER - TRANG DETAIL (lấy magnet + info)
    ============================================================ */
    function parseDetail(html) {
        var $doc = $('<div>').html(html);
        var info = { magnet: '', size: '', tags: [], actresses: [], desc: '' };

        // Magnet link
        $doc.find('a[href^="magnet:"]').each(function () {
            if (!info.magnet) info.magnet = $(this).attr('href');
        });

        // .torrent download link (fallback)
        if (!info.magnet) {
            $doc.find('a[href$=".torrent"], a[href*="download"]').each(function () {
                var h = $(this).attr('href') || '';
                if (h && !info.torrent) info.torrent = h.startsWith('http') ? h : BASE_URL + h;
            });
        }

        // Tags
        $doc.find('a[href^="/tag/"]').each(function () {
            var t = $(this).text().trim();
            if (t) info.tags.push(t);
        });

        // Actresses
        $doc.find('a[href^="/actress/"]').each(function () {
            var a = $(this).text().trim();
            if (a) info.actresses.push(a);
        });

        // Description
        var $desc = $doc.find('p').first();
        info.desc = $desc.text().trim();

        return info;
    }

    // Parse tổng số trang
    function parseMaxPage(html) {
        var max = 1;
        $('<div>').html(html).find('a[href*="page="]').each(function () {
            var m = (($(this).attr('href') || '').match(/page=(\d+)/) || [])[1];
            if (m && +m > max) max = +m;
        });
        // onejav dùng /popular/?page=2 style
        $('<div>').html(html).find('a').each(function () {
            var h = $(this).attr('href') || '';
            var m = h.match(/[?&]page=(\d+)/);
            if (m && +m[1] > max) max = +m[1];
        });
        return max;
    }

    function buildUrl(obj, page) {
        var url;
        switch (obj.section) {
            case 'new':      url = BASE_URL + '/new'; break;
            case 'popular':  url = BASE_URL + '/popular/'; break;
            case 'today':    url = BASE_URL + '/' + obj.date; break;
            case 'tag':      url = BASE_URL + '/tag/' + encodeURIComponent(obj.tag); break;
            case 'actress':  url = BASE_URL + '/actress/' + encodeURIComponent(obj.actress); break;
            case 'search':   url = BASE_URL + '/?search=' + encodeURIComponent(obj.query); break;
            default:         url = BASE_URL + '/';
        }
        if (page > 1) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page;
        return url;
    }


    /* ============================================================
       COMPONENT: CATALOG
    ============================================================ */
    function CatalogComponent(object) {
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var loading = false;

        this.render = function () { return scroll.render(); };
        this.create = function () { loadPage(1); };

        function setContent(html) {
            scroll.render().find('.scroll__content').html(html);
        }

        function makeCard(movie) {
            var $card = $(
                '<div class="onejav-card selector">' +
                '<div class="onejav-card__img">' +
                (movie.poster
                    ? '<img src="' + movie.poster + '" onerror="this.style.display=\'none\'" />'
                    : '<div class="onejav-card__noimg">' + Lampa.Utils.escapeHtml(movie.original_title) + '</div>') +
                '</div>' +
                '<div class="onejav-card__name">' + Lampa.Utils.escapeHtml(movie.title) + '</div>' +
                '</div>'
            );
            $card.on('hover:enter click', function () {
                Lampa.Activity.push({
                    component: PLUGIN_ID + '_detail',
                    title:     movie.title,
                    card:      movie,
                    source:    PLUGIN_ID
                });
            });
            return $card;
        }

        function loadPage(page) {
            if (loading) return;
            loading = true;

            if (page === 1) {
                setContent('<div style="padding:3em;text-align:center;color:#aaa">Đang tải...</div>');
            }

            fetchPage(buildUrl(object, page),
                function (html) {
                    loading = false;
                    var movies  = parseList(html);
                    var maxPage = parseMaxPage(html);

                    if (!movies.length && page === 1) {
                        setContent('<div style="padding:3em;text-align:center;color:#888">Không tìm thấy phim nào 😔</div>');
                        return;
                    }

                    if (page === 1) setContent('');
                    movies.forEach(function (m) { scroll.append(makeCard(m)); });

                    if (page < maxPage) {
                        scroll.loadmore(function () { loadPage(page + 1); });
                    }
                },
                function (err) {
                    loading = false;
                    setContent(
                        '<div style="padding:3em;text-align:center;color:#e74c3c;font-size:.85em;line-height:2">' +
                        '❌ ' + (err || 'Lỗi kết nối') + '</div>'
                    );
                }
            );
        }

        this.start = function () {
            Lampa.Controller.add(PLUGIN_ID, {
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
            Lampa.Controller.toggle(PLUGIN_ID);
        };

        this.pause   = function () {};
        this.stop    = function () {};
        this.back    = function () { Lampa.Activity.backward(); };
        this.destroy = function () { scroll.destroy(); };
    }


    /* ============================================================
       COMPONENT: DETAIL
       Load trang /torrent/xxx → lấy magnet → phát qua TorrServer
    ============================================================ */
    function DetailComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var card   = object.card;

        this.render = function () { return scroll.render(); };

        this.create = function () {
            scroll.render().find('.scroll__content').html(
                '<div style="padding:2em;color:#aaa;text-align:center">Đang lấy link torrent...</div>'
            );

            fetchPage(card.url,
                function (html) {
                    var info = parseDetail(html);

                    if (!info.magnet && !info.torrent) {
                        Lampa.Noty.show('Không tìm thấy link torrent');
                        setTimeout(function () { Lampa.Activity.backward(); }, 800);
                        return;
                    }

                    var playUrl = info.magnet || info.torrent;

                    // Hiện thông tin trước khi phát
                    var actressStr = info.actresses.length ? info.actresses.join(', ') : '';
                    var tagStr     = info.tags.slice(0, 6).join(' · ');

                    scroll.render().find('.scroll__content').html(
                        '<div style="padding:1.5em">' +
                        (card.poster ? '<img src="' + card.poster + '" style="max-width:200px;border-radius:8px;margin-bottom:1em">' : '') +
                        '<div style="font-size:1.1em;font-weight:bold;margin-bottom:.5em">' + Lampa.Utils.escapeHtml(card.title) + '</div>' +
                        (actressStr ? '<div style="color:#aaa;margin-bottom:.3em">👤 ' + Lampa.Utils.escapeHtml(actressStr) + '</div>' : '') +
                        (tagStr     ? '<div style="color:#888;font-size:.8em;margin-bottom:1em">' + Lampa.Utils.escapeHtml(tagStr) + '</div>' : '') +
                        '<button class="onejav-play-btn selector" style="' +
                        'display:block;width:100%;padding:14px;margin-top:1em;' +
                        'background:#e74c3c;color:#fff;border:none;border-radius:8px;' +
                        'font-size:1.1em;cursor:pointer;text-align:center">' +
                        '▶ Phát qua TorrServer</button>' +
                        '</div>'
                    );

                    scroll.render().find('.onejav-play-btn').on('hover:enter click', function () {
                        // Lampa.Player.play với magnet → Lampa tự dùng TorrServer trong Settings
                        Lampa.Player.play({
                            title:  card.title,
                            url:    playUrl,
                            poster: card.poster || ''
                        });
                    });

                    Lampa.Controller.toggle(PLUGIN_ID + '_detail_ctrl');
                },
                function (err) {
                    Lampa.Noty.show('Lỗi: ' + (err || 'unknown'));
                    setTimeout(function () { Lampa.Activity.backward(); }, 800);
                }
            );
        };

        this.start = function () {
            Lampa.Controller.add(PLUGIN_ID + '_detail_ctrl', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up:    function () { Navigator.move('up'); },
                down:  function () { Navigator.move('down'); },
                left:  function () { Navigator.move('left'); },
                right: function () { Navigator.move('right'); },
                back:  function () { Lampa.Activity.backward(); }
            });
        };

        this.pause   = function () {};
        this.stop    = function () {};
        this.back    = function () { Lampa.Activity.backward(); };
        this.destroy = function () { scroll.destroy(); };
    }


    /* ============================================================
       ĐĂNG KÝ + KHỞI ĐỘNG
    ============================================================ */
    Lampa.Component.add(PLUGIN_ID,             CatalogComponent);
    Lampa.Component.add(PLUGIN_ID + '_detail', DetailComponent);

    function startPlugin() {
        if (window.onejav_started) return;
        window.onejav_started = true;

        var $item = $(
            '<li data-action="' + PLUGIN_ID + '" class="menu__item selector">' +
            '<div class="menu__ico">' +
            '<svg viewBox="0 0 24 24" fill="none" width="22" height="22"' +
            ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
            '<polyline points="7 10 12 15 17 10"/>' +
            '<line x1="12" y1="15" x2="12" y2="3"/>' +
            '</svg></div>' +
            '<div class="menu__text">OneJAV</div>' +
            '</li>'
        );
        $item.on('hover:enter', showMainMenu);
        $('.menu .menu__list').eq(0).append($item);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
    });


    /* ============================================================
       MENUS
    ============================================================ */
    function showMainMenu() {
        // Tính ngày hôm nay và hôm qua
        var now  = new Date();
        var d1   = now.toISOString().slice(0, 10).replace(/-/g, '/');
        var yest = new Date(now - 86400000).toISOString().slice(0, 10).replace(/-/g, '/');

        Lampa.Select.show({
            title: 'OneJAV',
            items: [
                { title: '🏠 Trang chủ',   section: '' },
                { title: '🆕 Mới nhất',    section: 'new' },
                { title: '🔥 Phổ biến',    section: 'popular' },
                { title: '📅 Hôm nay',     section: 'today', date: d1 },
                { title: '📅 Hôm qua',     section: 'today', date: yest },
                { title: '🎭 FC2 Amateur', section: 'tag', tag: 'FC2' },
                { title: '🔍 Tìm kiếm',    action: 'search' }
            ],
            onSelect: function (item) {
                if (item.action === 'search') { showSearch(); return; }
                Lampa.Activity.push({
                    component: PLUGIN_ID,
                    title:     item.title,
                    source:    PLUGIN_ID,
                    section:   item.section || '',
                    tag:       item.tag     || '',
                    date:      item.date    || ''
                });
            },
            onBack: function () { Lampa.Controller.toggle('menu'); }
        });
    }

    function showSearch() {
        if (typeof Lampa.Keyboard !== 'undefined') {
            Lampa.Keyboard.show({
                title:   'Tìm phim JAV',
                value:   '',
                onEnter: function (q) {
                    if (!q) return;
                    Lampa.Activity.push({
                        component: PLUGIN_ID,
                        title:     '🔍 ' + q,
                        source:    PLUGIN_ID,
                        section:   'search',
                        query:     q
                    });
                },
                onBack: function () { Lampa.Controller.toggle('menu'); }
            });
        } else {
            // Fallback: chọn từ khoá phổ biến
            Lampa.Select.show({
                title: '🔍 Từ khoá phổ biến',
                items: [
                    'Big Tits', 'Creampie', 'Solowork', 'Married Woman',
                    'Uniform', 'Squirting', 'Lesbian', 'NTR', 'Uncensored'
                ].map(function (t) { return { title: t, q: t }; }),
                onSelect: function (item) {
                    Lampa.Activity.push({
                        component: PLUGIN_ID,
                        title:     '🔍 ' + item.title,
                        source:    PLUGIN_ID,
                        section:   'tag',
                        tag:       item.q
                    });
                },
                onBack: function () { showMainMenu(); }
            });
        }
    }


    /* ============================================================
       CSS
    ============================================================ */
    $('<style>').text(
        '.onejav-card{display:inline-block;vertical-align:top;width:160px;margin:6px;cursor:pointer}' +
        '.onejav-card__img{width:160px;height:220px;border-radius:8px;overflow:hidden;background:#111;position:relative}' +
        '.onejav-card__img img{width:100%;height:100%;object-fit:cover}' +
        '.onejav-card__noimg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;' +
        'color:#666;font-size:.9em;font-weight:bold;text-align:center;padding:10px;box-sizing:border-box}' +
        '.onejav-card__name{font-size:.72em;color:#bbb;margin-top:5px;max-width:160px;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.onejav-card.focus .onejav-card__img{outline:3px solid #e74c3c;border-radius:8px}' +
        '.onejav-play-btn.focus{outline:3px solid #fff}'
    ).appendTo('head');

    console.log('[OneJAV] v1.0.0 loaded');

})();
