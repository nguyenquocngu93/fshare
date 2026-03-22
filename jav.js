(function () {
    'use strict';

    /* ============================================================
       iJavTorrent Plugin for Lampa  —  v2.2.0
       Fix: dùng $.ajax thay Lampa.Reguest, bỏ Lampa.Input
    ============================================================ */

    var PLUGIN_ID  = 'ijavtorrent';
    var BASE_URL   = 'https://ijavtorrent.com';
    var _menuAdded = false;


    /* ============================================================
       FETCH bằng $.ajax thuần
    ============================================================ */
    function fetchPage(url, ok, fail) {
        $.ajax({
            url:     url,
            method:  'GET',
            timeout: 15000,
            success: function (data) {
                ok(typeof data === 'string' ? data : $(data).prop('outerHTML') || '');
            },
            error: function (xhr, status, err) {
                if (fail) fail(status + ' ' + err);
            }
        });
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
        var xhr     = null;

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

        function showError(msg) {
            scroll.render().find('.scroll__content').html(
                '<div style="padding:2em;text-align:center;color:#e74c3c;font-size:.9em">' +
                msg + '</div>'
            );
        }

        function loadPage(page) {
            if (loading) return;
            loading = true;

            var url = buildUrl(object, page);

            if (xhr) xhr.abort();
            xhr = $.ajax({
                url:     url,
                method:  'GET',
                timeout: 15000,
                success: function (data) {
                    loading = false;
                    var html    = typeof data === 'string' ? data : '';
                    var movies  = parseList(html);
                    var maxPage = parseMaxPage(html);

                    if (!movies.length && page === 1) {
                        showError('Không tìm thấy phim nào 😔');
                        return;
                    }

                    movies.forEach(function (m) { scroll.append(makeCard(m)); });

                    if (page < maxPage) {
                        scroll.loadmore(function () { loadPage(page + 1); });
                    }
                },
                error: function (x, status) {
                    loading = false;
                    if (status === 'abort') return;
                    showError('❌ Không kết nối được ijavtorrent.com<br><small>(lỗi: ' + status + ')</small>');
                }
            });
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
        this.destroy = function () { if (xhr) xhr.abort(); scroll.destroy(); };
    }


    /* ============================================================
       COMPONENT: DETAIL
    ============================================================ */
    function DetailComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var card   = object.card;
        var xhr    = null;

        this.render = function () { return scroll.render(); };

        this.create = function () {
            scroll.render().find('.scroll__content').html(
                '<div style="padding:2em;color:#aaa;text-align:center">Đang tải torrent...</div>'
            );

            xhr = $.ajax({
                url:     card.url,
                method:  'GET',
                timeout: 15000,
                success: function (data) {
                    var html    = typeof data === 'string' ? data : '';
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
                            // Lampa tự dùng TorrServer đã cài trong Settings
                            Lampa.Player.play({
                                title:  card.title,
                                url:    item.magnet,
                                poster: card.poster
                            });
                        },
                        onBack: function () { Lampa.Activity.backward(); }
                    });
                },
                error: function () {
                    Lampa.Noty.show('Lỗi tải trang phim');
                    setTimeout(function () { Lampa.Activity.backward(); }, 800);
                }
            });
        };

        this.start   = function () {};
        this.pause   = function () {};
        this.stop    = function () {};
        this.back    = function () { Lampa.Activity.backward(); };
        this.destroy = function () { if (xhr) xhr.abort(); scroll.destroy(); };
    }


    /* ============================================================
       ĐĂNG KÝ
    ============================================================ */
    Lampa.Component.add(PLUGIN_ID,             CatalogComponent);
    Lampa.Component.add(PLUGIN_ID + '_detail', DetailComponent);


    /* ============================================================
       MENU (chỉ thêm 1 lần)
    ============================================================ */
    function addMenu() {
        if (_menuAdded) return;
        if ($('[data-id="ijavt-menu"]').length) { _menuAdded = true; return; }
        var $nav = $('nav.menu .menu__list, .menu .menu__list').first();
        if (!$nav.length) return;
        _menuAdded = true;

        var $item = $(
            '<li class="menu__item selector" data-id="ijavt-menu">' +
            '<div class="menu__ico">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none"' +
            ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>' +
            '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
            '</svg></div>' +
            '<div class="menu__text">iJavTorrent</div></li>'
        );
        $item.on('hover:enter click', showMainMenu);

        var $before = $nav.find('[data-action="settings"]').closest('li');
        if ($before.length) $before.before($item); else $nav.append($item);
    }

    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') setTimeout(addMenu, 400);
    });
    setTimeout(addMenu, 1200);


    /* ============================================================
       MAIN MENU + TÌM KIẾM (dùng Lampa.Select, không dùng Lampa.Input)
    ============================================================ */
    function showMainMenu() {
        Lampa.Select.show({
            title: 'iJavTorrent',
            items: [
                { title: '🆕 Mới nhất',   tag: '',                sortby: '' },
                { title: '📈 Trending',    special: 'mostviewed' },
                { title: '⭐ High Rated',   tag: '',                sortby: 'updatedlike' },
                { title: '🔞 Uncensored',  tag: 'uncensored-75' },
                { title: '🥽 VR',          tag: 'vr-246' },
                { title: '🔓 Decensored',  tag: 'decensored-1465' },
                { title: '🇨🇳 Chinese',    tag: 'chinese-1543' },
                { title: '💧 Leaked',      tag: 'leaked-1457' },
                { title: '🔍 Tìm kiếm',    action: 'search' }
            ],
            onSelect: function (item) {
                if (item.action === 'search') {
                    showSearch();
                    return;
                }
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

    // Tìm kiếm bằng bàn phím ảo có sẵn của Lampa
    function showSearch() {
        // Thử Lampa.Keyboard trước, nếu không có thì dùng Select với gợi ý
        if (Lampa.Keyboard) {
            Lampa.Keyboard.show({
                title: 'Tìm phim JAV',
                value: '',
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
            // Fallback: chọn các từ khóa phổ biến
            Lampa.Select.show({
                title: '🔍 Tìm theo thể loại',
                items: [
                    { title: 'Big Tits',    q: 'big+tits' },
                    { title: 'Creampie',    q: 'creampie' },
                    { title: 'Married',     q: 'married' },
                    { title: 'Office Lady', q: 'office+lady' },
                    { title: 'Uniform',     q: 'uniform' },
                    { title: 'NTR',         q: 'ntr' },
                    { title: 'Squirting',   q: 'squirting' },
                    { title: 'Lesbian',     q: 'lesbian' }
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
        '.ijavt-card__name{font-size:.72em;color:#bbb;margin-top:4px;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.ijavt-card.focus .ijavt-card__img{outline:3px solid #e74c3c}'
    ).appendTo('head');

    console.log('[iJavTorrent] v2.2.0 loaded');

})();
