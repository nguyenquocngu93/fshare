(function () {
    'use strict';

    /* ============================================================
       iJavTorrent Plugin for Lampa  —  v2.0.0
    ============================================================ */

    var PLUGIN_ID  = 'ijavtorrent';
    var BASE_URL   = 'https://ijavtorrent.com';
    var PROXY      = '';        // load từ Storage bên dưới
    var _menuAdded = false;     // chống duplicate menu


    /* ============================================================
       FETCH (dùng Lampa.Reguest để tránh CORS issue)
    ============================================================ */
    function fetchPage(url, ok, fail) {
        var req = new Lampa.Reguest();
        req.timeout(15000);
        req.silent(
            PROXY ? (PROXY + encodeURIComponent(url)) : url,
            function (data) { ok(typeof data === 'string' ? data : JSON.stringify(data)); },
            function (e)    { if (fail) fail(e); }
        );
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
                id: parseInt(id) || 0,
                title: title,
                original_title: title,
                overview: '',
                poster: poster,
                poster_path: poster,
                background_path: poster,
                url: full,
                type: 'movie',
                source: PLUGIN_ID
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

            // Dung lượng từ cột bên cạnh
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
        var url = BASE_URL + '/';
        if (obj.special === 'mostviewed') return BASE_URL + '/mostviewed';
        if (obj.tag)   url = BASE_URL + '/tag/' + obj.tag;
        if (obj.query) { url = BASE_URL + '/'; }

        var p = [];
        if (obj.query)  p.push('search=' + encodeURIComponent(obj.query));
        if (obj.sortby) p.push('sortby=' + obj.sortby);
        if (page > 1)   p.push('page=' + page);
        return url + (p.length ? '?' + p.join('&') : '');
    }


    /* ============================================================
       COMPONENT: CATALOG
    ============================================================ */
    function CatalogComponent(object) {
        var network  = new Lampa.Reguest();
        var scroll   = new Lampa.Scroll({ mask: true, over: true });
        var loading  = false;
        var curPage  = 1;

        function makeCard(movie) {
            var $card = $('<div class="ijavt-card selector">' +
                '<div class="ijavt-card__img-wrap">' +
                '  <img src="' + movie.poster + '" ' +
                '       onerror="this.style.display=\'none\'" />' +
                '</div>' +
                '<div class="ijavt-card__title">' + Lampa.Utils.escapeHtml(movie.title) + '</div>' +
                '</div>');

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

        function load(page) {
            if (loading) return;
            loading = true;

            var url = buildUrl(object, page);

            network.clear();
            network.timeout(15000);
            network.silent(
                PROXY ? (PROXY + encodeURIComponent(url)) : url,
                function (data) {
                    loading = false;
                    var html    = typeof data === 'string' ? data : '';
                    var movies  = parseList(html);
                    var maxPage = parseMaxPage(html);

                    if (!movies.length && page === 1) {
                        scroll.render().find('.scroll__content').html(
                            '<div style="padding:3em;text-align:center;color:#888">' +
                            'Không tìm thấy phim nào.<br>Thử bật CORS Proxy nếu dùng trên web.</div>'
                        );
                        return;
                    }

                    movies.forEach(function (m) { scroll.append(makeCard(m)); });

                    if (page < maxPage) {
                        scroll.loadmore(function () { load(page + 1); });
                    }

                    if (page === 1) Lampa.Controller.toggle(PLUGIN_ID);
                },
                function () {
                    loading = false;
                    scroll.render().find('.scroll__content').html(
                        '<div style="padding:3em;text-align:center;color:#e74c3c">' +
                        '❌ Lỗi kết nối ijavtorrent.com<br>' +
                        '<small>Nếu dùng trên web, hãy vào ⚙️ CORS Proxy để cài đặt.</small></div>'
                    );
                }
            );
        }

        this.create = function () {
            load(1);
            return scroll.render();
        };

        this.start = function () {
            Lampa.Controller.add(PLUGIN_ID, {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up:    function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
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
        this.destroy = function () { network.clear(); scroll.destroy(); };
    }


    /* ============================================================
       COMPONENT: DETAIL + CHỌN TORRENT
    ============================================================ */
    function DetailComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true });
        var card    = object.card;

        this.create = function () {
            scroll.render().html('<div style="padding:2em;color:#aaa">Đang tải torrent...</div>');

            network.timeout(15000);
            network.silent(
                PROXY ? (PROXY + encodeURIComponent(card.url)) : card.url,
                function (data) {
                    var html    = typeof data === 'string' ? data : '';
                    var magnets = parseMagnets(html);

                    if (!magnets.length) {
                        Lampa.Noty.show('Không tìm thấy torrent');
                        Lampa.Activity.backward();
                        return;
                    }

                    Lampa.Select.show({
                        title: card.title,
                        items: magnets.map(function (t) {
                            return { title: t.label, magnet: t.magnet };
                        }),
                        onSelect: function (item) {
                            // Đẩy magnet thẳng vào Lampa Player
                            // Lampa sẽ tự dùng TorrServer đã cài trong Settings
                            Lampa.Player.play({
                                title:  card.title,
                                url:    item.magnet,
                                poster: card.poster
                            });
                        },
                        onBack: function () {
                            Lampa.Activity.backward();
                        }
                    });
                },
                function () {
                    Lampa.Noty.show('Lỗi tải trang phim');
                    Lampa.Activity.backward();
                }
            );

            return scroll.render();
        };

        this.start   = function () {};
        this.pause   = function () {};
        this.stop    = function () {};
        this.back    = function () { Lampa.Activity.backward(); };
        this.destroy = function () { network.clear(); scroll.destroy(); };
    }


    /* ============================================================
       ĐĂNG KÝ COMPONENT
    ============================================================ */
    Lampa.Component.add(PLUGIN_ID,             CatalogComponent);
    Lampa.Component.add(PLUGIN_ID + '_detail', DetailComponent);


    /* ============================================================
       THÊM MENU (CHỈ 1 LẦN)
    ============================================================ */
    function addMenu() {
        if (_menuAdded) return;
        // Kiểm tra phần tử đã tồn tại chưa
        if ($('[data-id="ijavt-menu"]').length) { _menuAdded = true; return; }

        var $nav = $('nav.menu .menu__list, .menu .menu__list').first();
        if (!$nav.length) return;

        _menuAdded = true;

        var $item = $('<li class="menu__item selector" data-id="ijavt-menu">' +
            '<div class="menu__ico">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none"' +
            ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<line x1="2" y1="12" x2="22" y2="12"/>' +
            '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
            '</svg></div>' +
            '<div class="menu__text">iJavTorrent</div>' +
            '</li>');

        $item.on('hover:enter click', showMainMenu);

        // Chèn trước Settings
        var $before = $nav.find('[data-action="settings"]').closest('li');
        if ($before.length) $before.before($item); else $nav.append($item);
    }

    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') setTimeout(addMenu, 400);
    });
    setTimeout(addMenu, 1200); // fallback


    /* ============================================================
       MAIN MENU
    ============================================================ */
    function showMainMenu() {
        Lampa.Select.show({
            title: 'iJavTorrent',
            items: [
                { title: '🆕 Mới nhất',    data: { tag: '',               sortby: '' } },
                { title: '📈 Trending',     data: { special: 'mostviewed', sortby: '' } },
                { title: '⭐ High Rated',    data: { tag: '',               sortby: 'updatedlike' } },
                { title: '🔞 Uncensored',   data: { tag: 'uncensored-75',  sortby: '' } },
                { title: '🥽 VR',           data: { tag: 'vr-246',         sortby: '' } },
                { title: '🔓 Decensored',   data: { tag: 'decensored-1465',sortby: '' } },
                { title: '🇨🇳 Chinese',     data: { tag: 'chinese-1543',   sortby: '' } },
                { title: '💧 Leaked',       data: { tag: 'leaked-1457',    sortby: '' } },
                { title: '🔍 Tìm kiếm',     data: null, type: 'search' },
                { title: '⚙️  CORS Proxy',  data: null, type: 'proxy' }
            ],
            onSelect: function (item) {
                if (item.type === 'search') { showSearch(); return; }
                if (item.type === 'proxy')  { showProxy();  return; }
                Lampa.Activity.push({
                    component: PLUGIN_ID,
                    title:     item.title,
                    source:    PLUGIN_ID,
                    tag:       item.data.tag     || '',
                    sortby:    item.data.sortby  || '',
                    special:   item.data.special || ''
                });
            },
            onBack: function () { Lampa.Controller.toggle('menu'); }
        });
    }

    function showSearch() {
        Lampa.Input.show({
            title:       'Tìm phim JAV',
            placeholder: 'Mã phim hoặc tên diễn viên...',
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
    }

    function showProxy() {
        Lampa.Input.show({
            title:       'CORS Proxy',
            placeholder: 'https://corsproxy.io/?  (để trống nếu dùng APK)',
            value:       Lampa.Storage.get('ijavt_proxy', ''),
            onEnter: function (val) {
                PROXY = val.trim();
                Lampa.Storage.set('ijavt_proxy', PROXY);
                Lampa.Noty.show('✅ Proxy: ' + (PROXY || 'tắt'));
            },
            onBack: function () { Lampa.Controller.toggle('menu'); }
        });
    }

    // Khởi tạo proxy từ storage
    PROXY = Lampa.Storage.get('ijavt_proxy', '');


    /* ============================================================
       CSS
    ============================================================ */
    $('<style>').text([
        '.ijavt-card { display:inline-block; vertical-align:top;',
        '  width:150px; margin:6px; cursor:pointer; }',
        '.ijavt-card__img-wrap { width:150px; height:220px; border-radius:6px;',
        '  overflow:hidden; background:#111; }',
        '.ijavt-card__img-wrap img { width:100%; height:100%; object-fit:cover; }',
        '.ijavt-card__title { font-size:.72em; color:#bbb; margin-top:4px;',
        '  max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
        '.ijavt-card.focus .ijavt-card__img-wrap { outline:3px solid #e74c3c; }'
    ].join('')).appendTo('head');

    console.log('[iJavTorrent] v2.0.0 loaded');

})();
