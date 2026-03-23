(function () {
    'use strict';

    /* ============================================================
       OneJAV Plugin for Lampa  —  v1.5.0
       Fix: không dùng onerror inline trong HTML string
            dùng element.onerror = function(){} như lnum.js
    ============================================================ */

    var PLUGIN_ID = 'onejav';
    var BASE_URL  = 'https://onejav.com';
    var PROXY     = 'https://api.allorigins.win/get?url=';

    function esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }


    /* ============================================================
       FETCH - allorigins trả về { contents: "<html>..." }
    ============================================================ */
    function fetchPage(url, ok, fail) {
        $.ajax({
            url:      PROXY + encodeURIComponent(url),
            method:   'GET',
            dataType: 'json',
            timeout:  25000,
            success: function (data) {
                var html = data && data.contents;
                if (html && html.length > 200) {
                    ok(html);
                } else {
                    // fallback: corsproxy.io
                    $.ajax({
                        url:      'https://corsproxy.io/?' + encodeURIComponent(url),
                        method:   'GET',
                        dataType: 'text',
                        timeout:  20000,
                        success: function (h) {
                            if (h && h.length > 200) ok(h);
                            else if (fail) fail('Response rỗng');
                        },
                        error: function (xhr) {
                            var t = xhr && xhr.responseText;
                            if (t && t.length > 200) ok(t);
                            else if (fail) fail('Cả 2 proxy lỗi');
                        }
                    });
                }
            },
            error: function (xhr) {
                var t = xhr && xhr.responseText;
                if (t && t.length > 200) ok(t);
                else {
                    $.ajax({
                        url:      'https://corsproxy.io/?' + encodeURIComponent(url),
                        method:   'GET',
                        dataType: 'text',
                        timeout:  20000,
                        success: function (h) {
                            if (h && h.length > 200) ok(h);
                            else if (fail) fail('Response rỗng');
                        },
                        error: function () { if (fail) fail('Cả 2 proxy lỗi'); }
                    });
                }
            }
        });
    }


    /* ============================================================
       PARSER
    ============================================================ */
    function parseList(html) {
        var movies = [], seen = {};
        $('<div>').html(html).find('a[href^="/torrent/"]').each(function () {
            var $a   = $(this);
            var href = $a.attr('href') || '';
            if (!/^\/torrent\/.+/.test(href)) return;
            var full = BASE_URL + href;
            if (seen[full]) return;
            seen[full] = true;

            var poster = $a.find('img').attr('src') || '';
            var text   = $a.text().trim().replace(/\s+/g, ' ');
            if (!text || text.length < 2) return;

            movies.push({
                id:    href.replace('/torrent/', ''),
                title: text,
                poster: poster,
                url:   full,
                source: PLUGIN_ID
            });
        });
        return movies;
    }

    function parseDetail(html) {
        var $doc = $('<div>').html(html);
        var info = { magnet: '', torrent: '', tags: [], actresses: [] };

        $doc.find('a[href^="magnet:"]').each(function () {
            if (!info.magnet) info.magnet = $(this).attr('href');
        });
        if (!info.magnet) {
            $doc.find('a[href$=".torrent"]').each(function () {
                var h = $(this).attr('href') || '';
                if (h && !info.torrent) info.torrent = h.startsWith('http') ? h : BASE_URL + h;
            });
        }
        $doc.find('a[href^="/tag/"]').each(function () {
            var t = $(this).text().trim();
            if (t) info.tags.push(t);
        });
        $doc.find('a[href^="/actress/"]').each(function () {
            var a = $(this).text().trim();
            if (a) info.actresses.push(a);
        });
        return info;
    }

    function parseNextPage(html, cur) {
        var next = 0;
        $('<div>').html(html).find('a').each(function () {
            var m = (($(this).attr('href') || '').match(/[?&]page=(\d+)/) || [])[1];
            if (m && +m > cur && +m > next) next = +m;
        });
        return next;
    }

    function buildUrl(obj, page) {
        var url;
        switch (obj.section) {
            case 'new':     url = BASE_URL + '/new'; break;
            case 'popular': url = BASE_URL + '/popular/'; break;
            case 'today':   url = BASE_URL + '/' + obj.date; break;
            case 'tag':     url = BASE_URL + '/tag/' + encodeURIComponent(obj.tag); break;
            case 'search':  url = BASE_URL + '/?search=' + encodeURIComponent(obj.query); break;
            default:        url = BASE_URL + '/';
        }
        if (page > 1) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page;
        return url;
    }


    /* ============================================================
       MAKE CARD - dùng DOM JS, không inline onerror
    ============================================================ */
    function makeCard(movie, onClick) {
        // Tạo element bằng JS thuần như lnum.js
        var wrap  = document.createElement('div');
        wrap.className = 'onejav-card selector';

        var imgWrap = document.createElement('div');
        imgWrap.className = 'onejav-card__img';

        var img = document.createElement('img');
        // Set src SAU khi gắn onerror - tránh race condition
        img.onerror = function () { img.style.display = 'none'; };
        img.onload  = function () { img.style.opacity = '1'; };
        img.style.opacity = '0';
        img.style.transition = 'opacity .3s';
        if (movie.poster) img.src = movie.poster;

        var title = document.createElement('div');
        title.className = 'onejav-card__name';
        title.textContent = movie.title || movie.id || '';

        imgWrap.appendChild(img);
        wrap.appendChild(imgWrap);
        wrap.appendChild(title);

        var $wrap = $(wrap);
        $wrap.on('hover:enter click', function () { onClick(movie); });
        return $wrap;
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

        function loadPage(page) {
            if (loading) return;
            loading = true;

            if (page === 1) {
                setContent('<div style="padding:3em;text-align:center;color:#aaa">Đang tải...</div>');
            }

            fetchPage(buildUrl(object, page),
                function (html) {
                    loading = false;
                    var movies = parseList(html);
                    var nextPg = parseNextPage(html, page);

                    if (!movies.length && page === 1) {
                        var preview = html.slice(0, 300)
                            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                        setContent(
                            '<div style="padding:2em;color:#aaa;font-size:.75em;word-break:break-all">' +
                            '<b style="color:#e74c3c">Kết nối OK, không parse được.<br>Preview:</b><br>' +
                            preview + '</div>'
                        );
                        return;
                    }

                    if (page === 1) scroll.render().find('.scroll__content').html('');

                    movies.forEach(function (m) {
                        scroll.append(makeCard(m, function (movie) {
                            Lampa.Activity.push({
                                component: PLUGIN_ID + '_detail',
                                title:     movie.title,
                                card:      movie,
                                source:    PLUGIN_ID
                            });
                        }));
                    });

                    if (nextPg > page) {
                        var btn = document.createElement('div');
                        btn.className = 'onejav-more selector';
                        btn.textContent = '⬇ Tải thêm';
                        btn.style.cssText = 'display:block;width:88%;margin:14px auto;padding:13px;' +
                            'background:rgba(255,255,255,.08);color:#fff;border-radius:8px;text-align:center;cursor:pointer';

                        var $btn = $(btn);
                        $btn.on('hover:enter click', function () {
                            $btn.remove();
                            loadPage(page + 1);
                        });
                        scroll.append($btn);
                    }
                },
                function (err) {
                    loading = false;
                    setContent(
                        '<div style="padding:3em;text-align:center;color:#e74c3c;font-size:.85em">' +
                        '❌ ' + esc(err || 'Lỗi kết nối') + '</div>'
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
            setContent('<div style="padding:2em;color:#aaa;text-align:center">Đang tải torrent...</div>');

            fetchPage(card.url,
                function (html) {
                    var info    = parseDetail(html);
                    var playUrl = info.magnet || info.torrent;

                    if (!playUrl) {
                        Lampa.Noty.show('Không tìm thấy link torrent');
                        setTimeout(function () { Lampa.Activity.backward(); }, 800);
                        return;
                    }

                    // Build detail UI bằng DOM JS
                    var wrap = document.createElement('div');
                    wrap.style.cssText = 'padding:1.5em';

                    if (card.poster) {
                        var img = document.createElement('img');
                        img.style.cssText = 'max-width:180px;border-radius:8px;margin-bottom:1em;display:block';
                        img.onerror = function () { img.style.display = 'none'; };
                        img.src = card.poster;
                        wrap.appendChild(img);
                    }

                    var titleEl = document.createElement('div');
                    titleEl.style.cssText = 'font-size:1.1em;font-weight:bold;margin-bottom:.5em';
                    titleEl.textContent = card.title || '';
                    wrap.appendChild(titleEl);

                    if (info.actresses.length) {
                        var actEl = document.createElement('div');
                        actEl.style.cssText = 'color:#aaa;margin-bottom:.4em';
                        actEl.textContent = '👤 ' + info.actresses.join(', ');
                        wrap.appendChild(actEl);
                    }

                    if (info.tags.length) {
                        var tagEl = document.createElement('div');
                        tagEl.style.cssText = 'color:#666;font-size:.8em;margin-bottom:1em';
                        tagEl.textContent = info.tags.slice(0, 8).join(' · ');
                        wrap.appendChild(tagEl);
                    }

                    var playBtn = document.createElement('div');
                    playBtn.className = 'onejav-play-btn selector';
                    playBtn.textContent = '▶ Phát qua TorrServer';
                    playBtn.style.cssText = 'padding:14px;margin-top:1em;background:#e74c3c;' +
                        'color:#fff;border-radius:8px;font-size:1em;cursor:pointer;text-align:center';
                    wrap.appendChild(playBtn);

                    scroll.render().find('.scroll__content').html('');
                    scroll.append($(wrap));

                    $(playBtn).on('hover:enter click', function () {
                        Lampa.Player.play({
                            title:  card.title,
                            url:    playUrl,
                            poster: card.poster || ''
                        });
                    });

                    Lampa.Controller.toggle(PLUGIN_ID + '_dc');
                },
                function (err) {
                    Lampa.Noty.show('Lỗi: ' + (err || 'unknown'));
                    setTimeout(function () { Lampa.Activity.backward(); }, 800);
                }
            );
        };

        function setContent(html) {
            scroll.render().find('.scroll__content').html(html);
        }

        this.start = function () {
            Lampa.Controller.add(PLUGIN_ID + '_dc', {
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
                { title: '🎭 FC2 Amateur', section: 'tag',   tag: 'FC2' },
                { title: '🔍 Tìm kiếm',    action:  'search' }
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
                title: 'Tìm phim JAV', value: '',
                onEnter: function (q) {
                    if (!q) return;
                    Lampa.Activity.push({
                        component: PLUGIN_ID, title: '🔍 ' + q,
                        source: PLUGIN_ID, section: 'search', query: q
                    });
                },
                onBack: function () { Lampa.Controller.toggle('menu'); }
            });
        } else {
            Lampa.Select.show({
                title: '🔍 Từ khoá',
                items: ['Big Tits','Creampie','Solowork','Married Woman',
                        'Uniform','Squirting','Lesbian','NTR','Uncensored'
                ].map(function (t) { return { title: t, q: t }; }),
                onSelect: function (item) {
                    Lampa.Activity.push({
                        component: PLUGIN_ID, title: '🔍 ' + item.title,
                        source: PLUGIN_ID, section: 'tag', tag: item.q
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
        '.onejav-card__img{width:160px;height:220px;border-radius:8px;overflow:hidden;background:#111}' +
        '.onejav-card__img img{width:100%;height:100%;object-fit:cover}' +
        '.onejav-card__name{font-size:.72em;color:#bbb;margin-top:5px;max-width:160px;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.onejav-card.focus .onejav-card__img{outline:3px solid #e74c3c}' +
        '.onejav-more.focus,.onejav-play-btn.focus{outline:3px solid #fff}'
    ).appendTo('head');

    console.log('[OneJAV] v1.5.0 loaded');

})();
