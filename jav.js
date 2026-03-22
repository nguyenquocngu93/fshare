(function () {
    'use strict';

    /* ============================================================
       iJavTorrent Plugin for Lampa  —  v3.1.0
       Dùng XMLHttpRequest trực tiếp để lấy HTML
       (Lampa.Reguest chỉ dùng cho JSON API, không dùng cho HTML)
    ============================================================ */

    var PLUGIN_ID = 'ijavtorrent';
    var BASE_URL  = 'https://ijavtorrent.com';


    /* ============================================================
       FETCH - XMLHttpRequest thuần, không qua jQuery hay Lampa
    ============================================================ */
    function fetchPage(url, ok, fail) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 20000;

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;

            if (xhr.status >= 200 && xhr.status < 400) {
                ok(xhr.responseText || '');
            } else if (xhr.status === 0) {
                // status 0 = bị block hoặc network error
                // Thử lấy responseText dù sao
                if (xhr.responseText && xhr.responseText.length > 50) {
                    ok(xhr.responseText);
                } else {
                    if (fail) fail('Blocked / No network (status 0)');
                }
            } else {
                if (fail) fail('HTTP ' + xhr.status);
            }
        };

        xhr.ontimeout = function () {
            if (fail) fail('Timeout sau 20s');
        };

        xhr.onerror = function () {
            // onerror: thử responseText trước
            if (xhr.responseText && xhr.responseText.length > 50) {
                ok(xhr.responseText);
            } else {
                if (fail) fail('XHR error');
            }
        };

        try {
            xhr.send();
        } catch (e) {
            if (fail) fail(e.message || 'send() exception');
        }
    }


    /* ============================================================
       PARSER
    ============================================================ */
    function parseList(html) {
        var movies = [], seen = {};
        var $doc = $('<div>').html(html);

        $doc.find('a[href*="/movie/"]').each(function () {
            var href = $(this).attr('href') || '';
            if (!/\/movie\/[a-z0-9-]+-\d+$/i.test(href)) return;
            var full = href.startsWith('http') ? href : BASE_URL + href;
            if (seen[full]) return;
            seen[full] = true;

            var title = $(this).text().trim().replace(/\s+/g, ' ');
            if (!title || title.length < 3) return;

            var id     = (href.match(/(\d+)$/) || [])[1] || '';
            var poster = 'https://images.ijavtorrent.com/data/screenshots/' + id + '.jpg';

            movies.push({
                id:              parseInt(id) || 0,
                title:           title,
                original_title:  title,
                overview:        '',
                poster:          poster,
                poster_path:     poster,
                background_path: poster,
                url:             full,
                type:            'movie',
                source:          PLUGIN_ID
            });
        });
        return movies;
    }

    function parseMagnets(html) {
        var list = [], seen = {};
        var $doc = $('<div>').html(html);

        $doc.find('a[href^="magnet:"]').each(function () {
            var magnet = $(this).attr('href') || '';
            if (!magnet || seen[magnet]) return;
            seen[magnet] = true;

            var dn = ((magnet.match(/[?&]dn=([^&]+)/) || [])[1] || '');
            dn = decodeURIComponent(dn.replace(/\+/g, ' '));

            var q = 'Unknown';
            if      (/FHD|\+\+\+/i.test(dn)) q = 'FHD';
            else if (/4K/i.test(dn))          q = '4K';
            else if (/1080p/i.test(dn))       q = '1080p';
            else if (/720p|HD/i.test(dn))     q = 'HD 720p';
            else if (/480p/i.test(dn))        q = '480p';

            var tag = '';
            if (/Reducing Mosaic|Decen/i.test(dn)) tag = ' [Decen]';
            else if (/uncensored/i.test(dn))        tag = ' [Uncen]';

            var size = '';
            $(this).closest('tr').find('td').each(function () {
                var t = $(this).text().trim();
                if (/^\d+(\.\d+)?\s*(gb|mb)/i.test(t)) size = ' (' + t + ')';
            });

            list.push({ label: q + tag + size, magnet: magnet });
        });
        return list;
    }

    function parseMaxPage(html) {
        var max = 1;
        $('<div>').html(html).find('a[href*="page="]').each(function () {
            var m = (($(this).attr('href') || '').match(/page=(\d+)/) || [])[1];
            if (m && +m > max) max = +m;
        });
        return max;
    }

    function buildUrl(obj, page) {
        if (obj.special === 'mostviewed') return BASE_URL + '/mostviewed';
        var url = BASE_URL + '/';
        if (obj.tag) url = BASE_URL + '/tag/' + obj.tag;
        var p = [];
        if (obj.query)  p.push('search=' + encodeURIComponent(obj.query));
        if (obj.sortby) p.push('sortby=' + obj.sortby);
        if (page > 1)   p.push('page=' + page);
        return url + (p.length ? (url.indexOf('?') >= 0 ? '&' : '?') + p.join('&') : '');
    }


    /* ============================================================
       COMPONENT: CATALOG
    ============================================================ */
    function CatalogComponent(object) {
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var loading = false;

        this.render = function () { return scroll.render(); };
        this.create = function () { loadPage(1); };

        function makeCard(movie) {
            var $card = $(
                '<div class="ijavt-card selector">' +
                '<div class="ijavt-card__img">' +
                '<img src="' + movie.poster + '" onerror="this.style.display=\'none\'" />' +
                '</div>' +
                '<div class="ijavt-card__name">' + Lampa.Utils.escapeHtml(movie.title) + '</div>' +
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
                scroll.render().find('.scroll__content').html(
                    '<div style="padding:3em;text-align:center;color:#aaa">Đang tải...</div>'
                );
            }

            fetchPage(buildUrl(object, page),
                function (html) {
                    loading = false;
                    var movies  = parseList(html);
                    var maxPage = parseMaxPage(html);

                    if (!movies.length && page === 1) {
                        // Debug: hiện 300 ký tự đầu để xem response
                        var preview = (html || '(trống)').slice(0, 300).replace(/[<>]/g, function(c){ return c === '<' ? '&lt;' : '&gt;'; });
                        scroll.render().find('.scroll__content').html(
                            '<div style="padding:2em;color:#aaa;font-size:.75em;word-break:break-all;line-height:1.6">' +
                            '<b style="color:#e74c3c">Không parse được - response:</b><br>' + preview + '</div>'
                        );
                        return;
                    }

                    if (page === 1) scroll.render().find('.scroll__content').html('');
                    movies.forEach(function (m) { scroll.append(makeCard(m)); });

                    if (page < maxPage) {
                        scroll.loadmore(function () { loadPage(page + 1); });
                    }
                },
                function (errMsg) {
                    loading = false;
                    scroll.render().find('.scroll__content').html(
                        '<div style="padding:3em;text-align:center;color:#e74c3c;font-size:.85em">' +
                        '❌ ' + (errMsg || 'Lỗi không xác định') + '</div>'
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
    ============================================================ */
    function DetailComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var card   = object.card;

        this.render = function () { return scroll.render(); };

        this.create = function () {
            scroll.render().find('.scroll__content').html(
                '<div style="padding:2em;color:#aaa;text-align:center">Đang tải torrent...</div>'
            );

            fetchPage(card.url,
                function (html) {
                    var magnets = parseMagnets(html);
                    if (!magnets.length) {
                        Lampa.Noty.show('Không tìm thấy torrent');
                        setTimeout(function () { Lampa.Activity.backward(); }, 800);
                        return;
                    }
                    Lampa.Select.show({
                        title: card.title,
                        items: magnets.map(function (t) {
                            return { title: t.label, magnet: t.magnet };
                        }),
                        onSelect: function (item) {
                            Lampa.Player.play({
                                title:  card.title,
                                url:    item.magnet,
                                poster: card.poster
                            });
                        },
                        onBack: function () { Lampa.Activity.backward(); }
                    });
                },
                function (e) {
                    Lampa.Noty.show('Lỗi: ' + (e || 'unknown'));
                    setTimeout(function () { Lampa.Activity.backward(); }, 800);
                }
            );
        };

        this.start   = function () {};
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
        if (window.ijavtorrent_started) return;
        window.ijavtorrent_started = true;

        var $item = $(
            '<li data-action="' + PLUGIN_ID + '" class="menu__item selector">' +
            '<div class="menu__ico">' +
            '<svg viewBox="0 0 24 24" fill="none" width="22" height="22"' +
            ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<line x1="2" y1="12" x2="22" y2="12"/>' +
            '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
            '</svg></div>' +
            '<div class="menu__text">iJavTorrent</div>' +
            '</li>'
        );
        $item.on('hover:enter', showMainMenu);
        $('.menu .menu__list').eq(0).append($item);
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }


    /* ============================================================
       MENUS
    ============================================================ */
    function showMainMenu() {
        Lampa.Select.show({
            title: 'iJavTorrent',
            items: [
                { title: '🆕 Mới nhất',  tag: '',                sortby: '' },
                { title: '📈 Trending',   special: 'mostviewed' },
                { title: '⭐ High Rated',  tag: '',                sortby: 'updatedlike' },
                { title: '🔞 Uncensored', tag: 'uncensored-75' },
                { title: '🥽 VR',         tag: 'vr-246' },
                { title: '🔓 Decensored', tag: 'decensored-1465' },
                { title: '🇨🇳 Chinese',   tag: 'chinese-1543' },
                { title: '💧 Leaked',     tag: 'leaked-1457' },
                { title: '🔍 Tìm kiếm',   action: 'search' }
            ],
            onSelect: function (item) {
                if (item.action === 'search') { showSearch(); return; }
                Lampa.Activity.push({
                    component: PLUGIN_ID,
                    title:     item.title,
                    source:    PLUGIN_ID,
                    tag:       item.tag     || '',
                    sortby:    item.sortby  || '',
                    special:   item.special || ''
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
                        query:     q
                    });
                },
                onBack: function () { Lampa.Controller.toggle('menu'); }
            });
        } else {
            Lampa.Select.show({
                title: '🔍 Từ khoá',
                items: [
                    { title: 'Big Tits',      q: 'big tits' },
                    { title: 'Creampie',      q: 'creampie' },
                    { title: 'Office Lady',   q: 'office lady' },
                    { title: 'Married Woman', q: 'married' },
                    { title: 'Squirting',     q: 'squirting' },
                    { title: 'Lesbian',       q: 'lesbian' },
                    { title: 'NTR / Cuckold', q: 'cuckold' }
                ],
                onSelect: function (item) {
                    Lampa.Activity.push({
                        component: PLUGIN_ID,
                        title:     '🔍 ' + item.title,
                        source:    PLUGIN_ID,
                        query:     item.q
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
        '.ijavt-card{display:inline-block;vertical-align:top;width:150px;margin:6px;cursor:pointer}' +
        '.ijavt-card__img{width:150px;height:220px;border-radius:6px;overflow:hidden;background:#111}' +
        '.ijavt-card__img img{width:100%;height:100%;object-fit:cover}' +
        '.ijavt-card__name{font-size:.72em;color:#bbb;margin-top:4px;max-width:150px;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.ijavt-card.focus .ijavt-card__img{outline:3px solid #e74c3c}'
    ).appendTo('head');

    console.log('[iJavTorrent] v3.1.0 loaded');

})();
