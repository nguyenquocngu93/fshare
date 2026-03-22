(function () {
    'use strict';

    /* ============================================================
       LAMPA PLUGIN - iJavTorrent Source
       Website : https://ijavtorrent.com
       Version : 1.0.0
       Mô tả   : Xem danh sách & stream phim JAV torrent qua TorrServer
    ============================================================ */

    var PLUGIN_ID      = 'ijavtorrent';
    var PLUGIN_VERSION = '1.0.0';
    var BASE_URL       = 'https://ijavtorrent.com';

    // --- CORS Proxy (dùng khi chạy trên trình duyệt, bỏ trống nếu dùng trên Android TV) ---
    // Ví dụ: 'https://corsproxy.io/?' hoặc ''
    var CORS_PROXY = '';

    // --- Địa chỉ TorrServer của bạn ---
    // Ví dụ: 'http://gren439e.tsarea.tv:8880'
    var TORRSERVER_URL = 'http://gren439e.tsarea.tv:8880';


    /* ============================================================
       TIỆN ÍCH
    ============================================================ */

    function proxyUrl(url) {
        return CORS_PROXY ? CORS_PROXY + encodeURIComponent(url) : url;
    }

    // Lấy HTML từ URL
    function fetchHtml(url, callback, errback) {
        $.ajax({
            url: proxyUrl(url),
            method: 'GET',
            success: function (html) { callback(html); },
            error: function (e) { if (errback) errback(e); }
        });
    }

    // Gửi magnet link đến TorrServer
    function addToTorrServer(magnet, title, onSuccess, onError) {
        $.ajax({
            url: TORRSERVER_URL + '/torrents',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'add',
                link: magnet,
                title: title || '',
                poster: '',
                save_to_db: false
            }),
            success: function (res) {
                if (onSuccess) onSuccess(res);
            },
            error: function (e) {
                if (onError) onError(e);
            }
        });
    }

    // Lấy stream URL từ TorrServer (sau khi đã add torrent)
    function getTorrServerStreamUrl(hash, fileIndex) {
        fileIndex = fileIndex || 0;
        return TORRSERVER_URL + '/stream?link=' + hash + '&index=' + fileIndex + '&play';
    }


    /* ============================================================
       PARSER HTML
    ============================================================ */

    // Parse danh sách phim từ trang HTML
    function parseMovieList(html) {
        var movies = [];
        var $html = $($.parseHTML('<div>' + html + '</div>'));

        // Mỗi phim nằm trong một block chứa link /movie/...
        $html.find('a[href*="/movie/"]').each(function () {
            var $a = $(this);
            var href = $a.attr('href') || '';
            if (!href.match(/\/movie\/[a-z0-9-]+-\d+$/i)) return;

            var title = $a.text().trim();
            if (!title || title.length < 3) return;

            // Tránh trùng lặp theo href
            var found = false;
            for (var i = 0; i < movies.length; i++) {
                if (movies[i].url === href) { found = true; break; }
            }
            if (found) return;

            // Lấy ID phim từ URL
            var idMatch = href.match(/(\d+)$/);
            var movieId = idMatch ? idMatch[1] : '';

            // Screenshot thumbnail
            var poster = movieId
                ? 'https://images.ijavtorrent.com/data/screenshots/' + movieId + '.jpg'
                : '';

            movies.push({
                id: movieId,
                title: title.replace(/\s+/g, ' ').trim(),
                url: href.startsWith('http') ? href : BASE_URL + href,
                poster: poster
            });
        });

        return movies;
    }

    // Parse chi tiết phim (danh sách torrent) từ trang phim
    function parseMovieDetail(html) {
        var torrents = [];
        var $html = $($.parseHTML('<div>' + html + '</div>'));

        // Tìm tất cả magnet link trên trang
        $html.find('a[href^="magnet:"]').each(function () {
            var magnet = $(this).attr('href');
            if (!magnet) return;

            // Lấy tên từ dn= trong magnet
            var dnMatch = magnet.match(/[?&]dn=([^&]+)/);
            var dn = dnMatch ? decodeURIComponent(dnMatch[1].replace(/\+/g, ' ')) : '';

            // Xác định chất lượng
            var quality = 'Unknown';
            if (dn.match(/FHD|\+\+\+/i))      quality = 'FHD';
            else if (dn.match(/720p|HD/i))      quality = 'HD 720p';
            else if (dn.match(/1080p/i))        quality = '1080p';
            else if (dn.match(/4K/i))           quality = '4K';

            // Nhãn đặc biệt
            var label = '';
            if (dn.match(/Reducing Mosaic|Decen/i)) label = ' [Decen]';
            else if (dn.match(/uncensored/i))       label = ' [Uncen]';

            // Tìm dung lượng (trong cùng hàng)
            var $row = $(this).closest('td').parent('tr');
            var size = '';
            $row.find('td').each(function () {
                var txt = $(this).text().trim();
                if (txt.match(/^\d+(\.\d+)?\s*(gb|mb)/i)) size = txt;
            });

            // Lấy hash từ btih:
            var hashMatch = magnet.match(/btih:([a-f0-9]+)/i);
            var hash = hashMatch ? hashMatch[1].toLowerCase() : '';

            torrents.push({
                label: quality + label + (size ? '  (' + size + ')' : ''),
                magnet: magnet,
                hash: hash,
                dn: dn
            });
        });

        return torrents;
    }

    // Lấy số trang tổng cộng
    function parseTotalPages(html) {
        var max = 1;
        var $html = $($.parseHTML('<div>' + html + '</div>'));
        $html.find('a[href*="page="]').each(function () {
            var m = $(this).attr('href').match(/page=(\d+)/);
            if (m) {
                var p = parseInt(m[1]);
                if (p > max) max = p;
            }
        });
        return max;
    }


    /* ============================================================
       HIỂN THỊ DANH SÁCH PHIM TRONG LAMPA
    ============================================================ */

    function buildCardObject(movie) {
        return {
            id:             parseInt(movie.id) || 0,
            title:          movie.title,
            original_title: movie.title,
            overview:       '',
            poster:         movie.poster,
            poster_path:    movie.poster,
            background:     movie.poster,
            url:            movie.url,
            type:           'movie',
            source:         PLUGIN_ID
        };
    }

    // Gọi khi người dùng chọn phim → mở trang chi tiết
    function openMovieDetail(card) {
        Lampa.Activity.push({
            component: PLUGIN_ID + '_detail',
            card: card,
            source: PLUGIN_ID
        });
    }

    // Hiển thị menu chọn torrent → phát qua TorrServer
    function showTorrentMenu(card, torrents) {
        if (!torrents.length) {
            Lampa.Noty.show('Không tìm thấy torrent cho phim này');
            return;
        }

        var items = torrents.map(function (t) {
            return { title: t.label, torrent: t };
        });

        Lampa.Select.show({
            title: '🧲 Chọn chất lượng',
            items: items,
            onSelect: function (item) {
                var t = item.torrent;
                Lampa.Noty.show('Đang gửi đến TorrServer...');

                addToTorrServer(t.magnet, card.title, function () {
                    // Sau khi thêm thành công, lấy stream URL và phát
                    setTimeout(function () {
                        var streamUrl = getTorrServerStreamUrl(t.hash, 0);
                        Lampa.Player.play({
                            title:  card.title,
                            url:    streamUrl,
                            poster: card.poster
                        });
                    }, 1200);
                }, function () {
                    // Nếu TorrServer lỗi → thử dùng magnet trực tiếp
                    Lampa.Noty.show('TorrServer lỗi, thử magnet trực tiếp...');
                    Lampa.Player.play({
                        title:  card.title,
                        url:    t.magnet,
                        poster: card.poster
                    });
                });
            },
            onBack: function () {
                Lampa.Controller.toggle('full');
            }
        });
    }


    /* ============================================================
       COMPONENT: TRANG CHỦ / DANH SÁCH
    ============================================================ */

    function CatalogComponent(object) {
        var comp      = this;
        var $html     = $('<div class="ijavt-catalog"></div>');
        var page      = object.page || 1;
        var tag       = object.tag  || '';
        var query     = object.query || '';
        var sortby    = object.sortby || '';

        this.create = function () {
            comp.activity.loader(true);
            comp.load();
            return $html;
        };

        this.load = function () {
            var url = buildListUrl(page, tag, query, sortby);

            fetchHtml(url, function (html) {
                var movies = parseMovieList(html);
                comp.activity.loader(false);

                if (!movies.length) {
                    comp.activity.empty();
                    return;
                }

                var cards = movies.map(buildCardObject);
                comp.activity.append(cards);

                // Phân trang
                var totalPages = parseTotalPages(html);
                if (page < totalPages) {
                    comp.activity.more({
                        next: function () {
                            comp.loadMore(page + 1, url);
                        }
                    });
                }
            }, function () {
                comp.activity.loader(false);
                Lampa.Noty.show('Không thể kết nối ijavtorrent.com');
            });
        };

        this.loadMore = function (nextPage) {
            page = nextPage;
            var url = buildListUrl(page, tag, query, sortby);

            fetchHtml(url, function (html) {
                var movies  = parseMovieList(html);
                var cards   = movies.map(buildCardObject);
                var totalPages = parseTotalPages(html);

                comp.activity.append(cards);

                if (nextPage < totalPages) {
                    comp.activity.more({
                        next: function () { comp.loadMore(nextPage + 1); }
                    });
                }
            });
        };

        this.empty   = function () {};
        this.back    = function () { Lampa.Activity.backward(); };
        this.destroy = function () { $html.remove(); };
    }

    function buildListUrl(page, tag, query, sortby) {
        var url = BASE_URL + '/';
        var params = [];
        if (query)  params.push('search=' + encodeURIComponent(query));
        if (tag)    url = BASE_URL + '/tag/' + tag;
        if (sortby) params.push('sortby=' + sortby);
        if (page > 1) params.push('page=' + page);
        if (params.length) url += '?' + params.join('&');
        return url;
    }


    /* ============================================================
       COMPONENT: TRANG CHI TIẾT PHIM
    ============================================================ */

    function DetailComponent(object) {
        var comp  = this;
        var card  = object.card;
        var $html = $('<div class="ijavt-detail"></div>');

        this.create = function () {
            comp.activity.loader(true);

            fetchHtml(card.url, function (html) {
                var torrents = parseMovieDetail(html);
                comp.activity.loader(false);

                // Lấy thêm thông tin diễn viên/tags nếu có
                var $doc = $($.parseHTML('<div>' + html + '</div>'));
                var actresses = [];
                $doc.find('a[href*="/actress/"]').each(function () {
                    var name = $(this).text().trim();
                    if (name) actresses.push(name);
                });

                // Hiển thị dưới dạng card full
                var fullCard = $.extend({}, card, {
                    overview: actresses.length
                        ? 'Diễn viên: ' + actresses.slice(0, 5).join(', ')
                        : '',
                    _torrents: torrents
                });

                comp.activity.append([fullCard]);

                // Tự mở menu chọn torrent
                if (torrents.length) {
                    showTorrentMenu(card, torrents);
                } else {
                    Lampa.Noty.show('Không tìm thấy torrent');
                }

            }, function () {
                comp.activity.loader(false);
                Lampa.Noty.show('Lỗi khi tải trang phim');
            });

            return $html;
        };

        this.empty   = function () {};
        this.back    = function () { Lampa.Activity.backward(); };
        this.destroy = function () { $html.remove(); };
    }


    /* ============================================================
       ĐĂNG KÝ SOURCE VỚI LAMPA
    ============================================================ */

    Lampa.Component.add(PLUGIN_ID, CatalogComponent);
    Lampa.Component.add(PLUGIN_ID + '_detail', DetailComponent);

    // Thêm vào menu nguồn (Home Categories)
    Lampa.Listener.follow('app', function (e) {
        if (e.type !== 'ready') return;

        // Thêm danh mục vào trang chủ
        Lampa.Template.add('ijavt_menu', '<li class="menu__item selector" data-action="ijavt_home">\
            <div class="menu__ico">\
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">\
                    <rect x="2" y="2" width="20" height="20" rx="2"/>\
                    <line x1="7" y1="12" x2="17" y2="12"/>\
                    <line x1="7" y1="8" x2="13" y2="8"/>\
                    <line x1="7" y1="16" x2="11" y2="16"/>\
                </svg>\
            </div>\
            <div class="menu__text">iJavTorrent</div>\
        </li>');
    });

    // Hook vào menu click
    Lampa.Listener.follow('menu', function (e) {
        if (e.type === 'click' && e.item && e.item.action === 'ijavt_home') {
            showMainMenu();
        }
    });

    // Thêm nút vào sidebar menu
    function addMenuItem() {
        var $menu = $('.menu__list');
        if (!$menu.length || $menu.find('[data-action="ijavt_home"]').length) return;

        var $item = $([
            '<li class="menu__item selector" data-action="ijavt_home">',
            '  <div class="menu__ico">',
            '    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"',
            '         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
            '      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
            '      <polyline points="9 22 9 12 15 12 15 22"/>',
            '    </svg>',
            '  </div>',
            '  <div class="menu__text">iJavTorrent</div>',
            '</li>'
        ].join(''));

        $item.on('hover:enter click', function () {
            showMainMenu();
        });

        $menu.append($item);
        Lampa.Controller.enable('menu');
    }

    setTimeout(addMenuItem, 2000);


    /* ============================================================
       MENU CHÍNH
    ============================================================ */

    function showMainMenu() {
        Lampa.Select.show({
            title: '🎬 iJavTorrent',
            items: [
                { title: '🔥 Mới nhất',         action: 'list',   params: {} },
                { title: '📈 Trending',          action: 'list',   params: { url: BASE_URL + '/mostviewed' } },
                { title: '⭐ High Rated',         action: 'list',   params: { sortby: 'updatedlike' } },
                { title: '🔞 Uncensored',         action: 'tag',    params: { tag: 'uncensored-75' } },
                { title: '🥽 VR',                 action: 'tag',    params: { tag: 'vr-246' } },
                { title: '🔓 Decensored',         action: 'tag',    params: { tag: 'decensored-1465' } },
                { title: '🇨🇳 Chinese',           action: 'tag',    params: { tag: 'chinese-1543' } },
                { title: '💏 Leaked',             action: 'tag',    params: { tag: 'leaked-1457' } },
                { title: '🔍 Tìm kiếm...',        action: 'search', params: {} },
                { title: '⚙️ Cài đặt TorrServer', action: 'settings', params: {} }
            ],
            onSelect: function (item) {
                if (item.action === 'list') {
                    Lampa.Activity.push({
                        component: PLUGIN_ID,
                        title:     item.title,
                        source:    PLUGIN_ID,
                        page:      1,
                        sortby:    item.params.sortby || ''
                    });
                } else if (item.action === 'tag') {
                    Lampa.Activity.push({
                        component: PLUGIN_ID,
                        title:     item.title,
                        source:    PLUGIN_ID,
                        page:      1,
                        tag:       item.params.tag
                    });
                } else if (item.action === 'search') {
                    showSearchInput();
                } else if (item.action === 'settings') {
                    showSettings();
                }
            },
            onBack: function () {
                Lampa.Controller.toggle('menu');
            }
        });
    }


    /* ============================================================
       TÌM KIẾM
    ============================================================ */

    function showSearchInput() {
        Lampa.Modal.open({
            title: '🔍 Tìm kiếm phim',
            html: $('<div class="ijavt-search">\
                <input class="ijavt-search__input" type="text" placeholder="Nhập mã phim hoặc tên diễn viên..." />\
                <button class="ijavt-search__btn selector">Tìm</button>\
            </div>'),
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });

        // Focus vào input
        setTimeout(function () {
            var $input = $('.ijavt-search__input');
            $input.focus();

            $('.ijavt-search__btn').on('hover:enter click', function () {
                var q = $input.val().trim();
                if (!q) return;
                Lampa.Modal.close();
                Lampa.Activity.push({
                    component: PLUGIN_ID,
                    title:     'Tìm: ' + q,
                    source:    PLUGIN_ID,
                    page:      1,
                    query:     q
                });
            });
        }, 300);
    }


    /* ============================================================
       CÀI ĐẶT TORRSERVER
    ============================================================ */

    function showSettings() {
        var current = Lampa.Storage.get('ijavt_torrserver', TORRSERVER_URL);

        Lampa.Modal.open({
            title: '⚙️ Cài đặt TorrServer',
            html: $('<div class="ijavt-settings">\
                <p style="margin-bottom:10px; color:#aaa">Địa chỉ TorrServer của bạn:</p>\
                <input class="ijavt-settings__input" type="text" value="' + current + '" />\
                <button class="ijavt-settings__btn selector" style="margin-top:12px">Lưu</button>\
            </div>'),
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });

        setTimeout(function () {
            var $input = $('.ijavt-settings__input');
            $input.focus();

            $('.ijavt-settings__btn').on('hover:enter click', function () {
                var val = $input.val().trim().replace(/\/$/, '');
                if (!val) return;
                Lampa.Storage.set('ijavt_torrserver', val);
                TORRSERVER_URL = val;
                Lampa.Modal.close();
                Lampa.Noty.show('✅ Đã lưu: ' + val);
            });
        }, 300);
    }


    /* ============================================================
       HOOK VÀO TRANG CARD (nút phát nhanh)
    ============================================================ */

    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        if (!e.card || e.card.source !== PLUGIN_ID) return;

        var card = e.card;

        // Thêm nút "Xem Torrent"
        var $btn = $([
            '<div class="full-start__button selector" data-ijavt-play="1">',
            '  <svg height="26" viewBox="0 0 24 24" width="26" fill="none"',
            '       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
            '    <polygon points="5 3 19 12 5 21 5 3"/>',
            '  </svg>',
            '  <span>Phát Torrent</span>',
            '</div>'
        ].join(''));

        $btn.on('hover:enter', function () {
            if (card._torrents && card._torrents.length) {
                showTorrentMenu(card, card._torrents);
            } else {
                Lampa.Noty.show('Đang tải danh sách torrent...');
                fetchHtml(card.url, function (html) {
                    card._torrents = parseMovieDetail(html);
                    showTorrentMenu(card, card._torrents);
                }, function () {
                    Lampa.Noty.show('Lỗi khi tải trang phim');
                });
            }
        });

        var $buttons = e.object.find('.full-start__buttons');
        if ($buttons.length && !$buttons.find('[data-ijavt-play]').length) {
            $buttons.prepend($btn);
        }
    });


    /* ============================================================
       STYLE
    ============================================================ */

    $('<style>')
        .text([
            '.ijavt-search, .ijavt-settings { padding: 10px; }',
            '.ijavt-search__input, .ijavt-settings__input {',
            '  width: 100%; padding: 8px 12px; font-size: 1em;',
            '  background: rgba(255,255,255,.1); color: #fff;',
            '  border: 1px solid rgba(255,255,255,.3); border-radius: 6px;',
            '  outline: none; box-sizing: border-box;',
            '}',
            '.ijavt-search__btn, .ijavt-settings__btn {',
            '  padding: 8px 20px; background: #e74c3c; color: #fff;',
            '  border: none; border-radius: 6px; cursor: pointer; font-size: 1em;',
            '  margin-top: 10px;',
            '}',
            '.ijavt-search__btn:focus, .ijavt-settings__btn:focus,',
            '.ijavt-search__btn.focus, .ijavt-settings__btn.focus {',
            '  outline: 3px solid #fff;',
            '}'
        ].join('\n'))
        .appendTo('head');


    /* ============================================================
       ĐĂNG KÝ PLUGIN
    ============================================================ */

    if (window.Lampa && Lampa.Plugin) {
        Lampa.Plugin.add(PLUGIN_ID, {
            name:        'iJavTorrent',
            version:     PLUGIN_VERSION,
            description: 'Xem phim JAV torrent từ ijavtorrent.com qua TorrServer'
        });
    }

    console.log('[iJavTorrent] Plugin loaded v' + PLUGIN_VERSION);

})();
