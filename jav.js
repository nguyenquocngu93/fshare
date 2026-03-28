(function () {
    'use strict';

    var API_HOST = 'https://phimapi.com';

    // =============================================
    // CSS
    // =============================================
    function addCSS() {
        if (document.getElementById('kkphim-css')) return;
        var css = document.createElement('style');
        css.id = 'kkphim-css';
        css.textContent = `
            .kkphim-head {
                display: flex;
                align-items: center;
                padding: 0 1.5em;
                margin-bottom: 0.8em;
            }
            .kkphim-head__title {
                flex: 1;
                font-size: 1.5em;
                color: rgba(255,255,255,0.6);
                font-weight: 600;
            }
            .kkphim-head__more {
                font-size: 1.1em;
                color: rgba(255,255,255,0.4);
                background: rgba(255,255,255,0.08);
                padding: 0.3em 1.2em;
                border-radius: 0.5em;
            }
            .kkphim-head__more.focus {
                background: #fff;
                color: #000;
            }
            .kkphim-line {
                display: flex;
                padding: 0 1.5em;
                margin-bottom: 1.5em;
            }
            .kkphim-card {
                width: 13em;
                flex-shrink: 0;
                margin-right: 1em;
            }
            .kkphim-card__poster {
                position: relative;
                width: 100%;
                padding-bottom: 150%;
                border-radius: 1em;
                overflow: hidden;
                background: #1e1e30;
            }
            .kkphim-card.focus .kkphim-card__poster {
                outline: solid 0.25em #fff;
                outline-offset: -0.25em;
            }
            .kkphim-card__poster img {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                object-fit: cover;
            }
            .kkphim-card__quality {
                position: absolute;
                bottom: 0.5em; left: 0.5em;
                background: #e50914;
                color: #fff;
                font-size: 0.7em;
                font-weight: 700;
                padding: 0.15em 0.5em;
                border-radius: 0.25em;
                z-index: 2;
            }
            .kkphim-card__year-badge {
                position: absolute;
                bottom: 0.5em; right: 0.5em;
                background: rgba(0,0,0,0.65);
                color: #fff;
                font-size: 0.75em;
                font-weight: 600;
                padding: 0.15em 0.5em;
                border-radius: 0.25em;
                z-index: 2;
            }
            .kkphim-card__ep-badge {
                position: absolute;
                top: 0.5em; right: 0.5em;
                background: rgba(118,75,162,0.9);
                color: #fff;
                font-size: 0.65em;
                font-weight: 700;
                padding: 0.15em 0.5em;
                border-radius: 0.25em;
                z-index: 2;
            }
            .kkphim-card__title {
                font-size: 1.05em;
                color: #fff;
                margin-top: 0.5em;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            .kkphim-card__sub {
                font-size: 0.85em;
                color: rgba(255,255,255,0.3);
                margin-top: 0.15em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .kkphim-card__year {
                font-size: 0.85em;
                color: rgba(255,255,255,0.3);
            }

            /* ===== FULL INFO ===== */
            .kkfull-info {
                padding: 1.5em;
            }
            .kkfull-info__top {
                display: flex;
                gap: 2em;
            }
            .kkfull-info__left {
                flex-shrink: 0;
                width: 15em;
            }
            .kkfull-info__left img {
                width: 100%;
                border-radius: 1em;
                background: #1e1e30;
            }
            .kkfull-info__right {
                flex: 1;
                min-width: 0;
            }
            .kkfull-info__name {
                font-size: 2.4em;
                font-weight: 700;
                color: #fff;
                line-height: 1.15;
            }
            .kkfull-info__origname {
                font-size: 1.1em;
                color: rgba(255,255,255,0.35);
                margin-bottom: 0.8em;
            }
            .kkfull-info__tagline {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
                margin-bottom: 0.8em;
            }
            .kkfull-info__tagline span {
                background: rgba(255,255,255,0.07);
                color: rgba(255,255,255,0.6);
                padding: 0.2em 0.7em;
                border-radius: 0.4em;
                font-size: 1em;
            }
            .kkfull-info__tagline span.hl {
                background: rgba(229,9,20,0.8);
                color: #fff;
                font-weight: 600;
            }
            .kkfull-info__genres {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
                margin-bottom: 0.8em;
            }
            .kkfull-info__genre {
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.5);
                padding: 0.2em 0.7em;
                border-radius: 1em;
                font-size: 0.95em;
            }
            .kkfull-info__genre.focus {
                background: #fff;
                color: #000;
                border-color: #fff;
            }
            .kkfull-info__desc {
                font-size: 1.05em;
                color: rgba(255,255,255,0.45);
                line-height: 1.6;
                margin-bottom: 1em;
                display: -webkit-box;
                -webkit-line-clamp: 5;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .kkfull-info__btns {
                display: flex;
                flex-wrap: wrap;
                gap: 0.7em;
                margin-bottom: 1em;
            }
            .kkfull-info__btn {
                display: inline-flex;
                align-items: center;
                gap: 0.4em;
                padding: 0.65em 1.5em;
                border-radius: 0.5em;
                font-size: 1.1em;
                font-weight: 600;
                color: #fff;
                background: rgba(255,255,255,0.08);
            }
            .kkfull-info__btn svg {
                width: 1.2em;
                height: 1.2em;
                fill: currentColor;
            }
            .kkfull-info__btn--play {
                background: #e50914;
            }
            .kkfull-info__btn--play.focus {
                background: #ff1a2d;
                outline: solid 0.2em #fff;
                outline-offset: 0.1em;
                transform: scale(1.04);
            }
            .kkfull-info__btn.focus {
                background: #fff;
                color: #000;
            }
            .kkfull-info__btn--play.focus {
                background: #ff1a2d;
                color: #fff;
            }

            /* EPISODES */
            .kkfull-ep {
                margin-top: 1em;
            }
            .kkfull-ep__title {
                font-size: 1.4em;
                font-weight: 600;
                color: #fff;
                margin-bottom: 0.5em;
            }
            .kkfull-ep__servers {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
                margin-bottom: 0.6em;
            }
            .kkfull-ep__srv {
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.4);
                padding: 0.3em 0.9em;
                border-radius: 0.4em;
                font-size: 0.95em;
            }
            .kkfull-ep__srv.active {
                background: rgba(118,75,162,0.85);
                color: #fff;
                border-color: transparent;
            }
            .kkfull-ep__srv.focus {
                background: #fff;
                color: #000;
                border-color: #fff;
            }
            .kkfull-ep__list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
            }
            .kkfull-ep__item {
                min-width: 3.5em;
                padding: 0.5em 0.7em;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.6);
                text-align: center;
                border-radius: 0.5em;
                font-size: 1em;
                font-weight: 600;
            }
            .kkfull-ep__item.focus {
                background: #e50914;
                color: #fff;
                border-color: transparent;
                outline: solid 0.15em #fff;
                outline-offset: 0.08em;
            }
            .kkfull-ep__item.watched {
                opacity: 0.3;
            }

            /* ===== CATEGORY (GRID + INFINITE) ===== */
            .kkcat-head {
                font-size: 1.6em;
                font-weight: 600;
                color: #fff;
                padding: 0.6em 1.2em 0.4em;
            }
            .kkcat-wrap {
                display: flex;
                flex-wrap: wrap;
                padding: 0 1.2em;
            }
            .kkcat-wrap .kkphim-card {
                margin-bottom: 1em;
            }
            .kkcat-more {
                text-align: center;
                padding: 1em;
                color: rgba(255,255,255,0.25);
                font-size: 1.1em;
            }
        `;
        document.head.appendChild(css);
    }

    // =============================================
    // IMG FIX
    // =============================================
    function posterURL(url, cdn) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (cdn) return cdn + '/' + url;
        return API_HOST + '/' + url;
    }

    function htmlToText(h) {
        if (!h) return '';
        return $('<div>').html(h).text();
    }

    // =============================================
    // BUILD CARD ELEMENT
    // =============================================
    function makeCard(item, cdn) {
        var img = posterURL(item.poster_url || item.thumb_url, cdn);
        var el = $('<div class="kkphim-card selector"></div>');
        var poster = $('<div class="kkphim-card__poster"></div>');

        var imgEl = document.createElement('img');
        imgEl.loading = 'lazy';
        if (img) {
            imgEl.src = img;
            imgEl.onerror = function () {
                this.src = '';
                this.style.display = 'none';
            };
        }
        poster.append(imgEl);

        if (item.quality) poster.append('<div class="kkphim-card__quality">' + item.quality + '</div>');
        if (item.year) poster.append('<div class="kkphim-card__year-badge">' + item.year + '</div>');
        if (item.episode_current) poster.append('<div class="kkphim-card__ep-badge">' + item.episode_current + '</div>');

        el.append(poster);
        el.append('<div class="kkphim-card__title">' + (item.name || '') + '</div>');

        var subParts = [];
        if (item.origin_name) subParts.push(item.origin_name);
        el.append('<div class="kkphim-card__sub">' + subParts.join('') + '</div>');
        if (item.year) el.append('<div class="kkphim-card__year">' + item.year + '</div>');

        el.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: item.name || '',
                component: 'kkphim_info',
                slug: item.slug
            });
        });

        return el;
    }

    // =============================================
    // COMPONENT: HOME
    // =============================================
    Lampa.Component.add('kkphim_main', function (object) {
        var comp = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div></div>');
        var loaded = 0;

        var cats = [
            { title: 'Phim Mới Cập Nhật', path: '/danh-sach/phim-moi-cap-nhat', v1: false },
            { title: 'Phim Bộ', path: '/v1/api/danh-sach/phim-bo', v1: true },
            { title: 'Phim Lẻ', path: '/v1/api/danh-sach/phim-le', v1: true },
            { title: 'Hoạt Hình', path: '/v1/api/danh-sach/hoat-hinh', v1: true },
            { title: 'TV Shows', path: '/v1/api/danh-sach/tv-shows', v1: true },
            { title: 'Phim Vietsub', path: '/v1/api/danh-sach/phim-vietsub', v1: true },
            { title: 'Phim Thuyết Minh', path: '/v1/api/danh-sach/phim-thuyet-minh', v1: true },
            { title: 'Phim Lồng Tiếng', path: '/v1/api/danh-sach/phim-long-tieng', v1: true }
        ];

        this.create = function () {
            this.activity.loader(true);

            var total = cats.length;
            loaded = 0;

            cats.forEach(function (cat) {
                // Head
                var head = $('<div class="kkphim-head"></div>');
                head.append('<div class="kkphim-head__title">' + cat.title + '</div>');

                var more = $('<div class="kkphim-head__more selector">Xem thêm</div>');
                more.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: cat.title,
                        component: 'kkphim_category',
                        page: 1,
                        cat_path: cat.path,
                        cat_v1: cat.v1
                    });
                });
                head.append(more);
                body.append(head);

                // Line (row of cards)
                var line = $('<div class="kkphim-line"></div>');
                body.append(line);

                // Fetch
                var params = cat.v1 ? { page: 1, limit: 12 } : { page: 1 };
                var url = API_HOST + cat.path;
                var q = [];
                for (var k in params) q.push(k + '=' + params[k]);
                url += '?' + q.join('&');

                $.ajax({
                    url: url,
                    dataType: 'json',
                    timeout: 15000,
                    success: function (res) {
                        var items = [], cdn = '';

                        if (cat.v1 && res && res.data) {
                            items = res.data.items || [];
                            cdn = res.data.APP_DOMAIN_CDN_IMAGE || '';
                        } else if (res) {
                            items = res.items || [];
                        }

                        items.forEach(function (item) {
                            line.append(makeCard(item, cdn));
                        });

                        done();
                    },
                    error: function () { done(); }
                });
            });

            function done() {
                loaded++;
                if (loaded >= total) {
                    scroll.append(body);
                    comp.activity.loader(false);
                    comp.activity.toggle();
                }
            }
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () { scroll.destroy(); };
    });

    // =============================================
    // COMPONENT: INFO
    // =============================================
    Lampa.Component.add('kkphim_info', function (object) {
        var comp = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var html = $('<div class="kkfull-info"></div>');

        this.create = function () {
            comp.activity.loader(true);
            scroll.append(html);

            $.ajax({
                url: API_HOST + '/phim/' + object.slug,
                dataType: 'json',
                timeout: 15000,
                success: function (res) {
                    comp.activity.loader(false);
                    if (res && res.movie) {
                        comp.build(res.movie, res.episodes || []);
                        comp.activity.toggle();
                    } else {
                        comp.showEmpty();
                    }
                },
                error: function () {
                    comp.activity.loader(false);
                    comp.showEmpty();
                }
            });
        };

        this.showEmpty = function () {
            var e = new Lampa.Empty();
            html.append(e.render());
            comp.activity.toggle();
        };

        this.build = function (m, episodes) {
            var poster = m.poster_url || m.thumb_url || '';
            var thumb = m.thumb_url || m.poster_url || '';

            // === TOP: poster + details ===
            var top = $('<div class="kkfull-info__top"></div>');

            // Left - poster
            var left = $('<div class="kkfull-info__left"></div>');
            var pImg = $('<img/>').attr('src', poster).on('error', function () {
                $(this).attr('src', './img/img_broken.svg');
            });
            left.append(pImg);
            top.append(left);

            // Right - details
            var right = $('<div class="kkfull-info__right"></div>');

            right.append('<div class="kkfull-info__name">' + (m.name || '') + '</div>');
            if (m.origin_name) right.append('<div class="kkfull-info__origname">' + m.origin_name + '</div>');

            // Tags
            var tagline = $('<div class="kkfull-info__tagline"></div>');
            if (m.quality) tagline.append('<span class="hl">' + m.quality + '</span>');
            if (m.year) tagline.append('<span>' + m.year + '</span>');
            if (m.time) tagline.append('<span>' + m.time + '</span>');
            if (m.lang) tagline.append('<span>' + m.lang + '</span>');
            if (m.episode_current) tagline.append('<span>' + m.episode_current + '</span>');
            if (m.episode_total) tagline.append('<span>' + m.episode_total + ' tập</span>');
            if (m.view) tagline.append('<span>👁 ' + Number(m.view).toLocaleString() + '</span>');
            if (m.country && m.country.length) tagline.append('<span>' + m.country.map(function (c) { return c.name; }).join(', ') + '</span>');
            right.append(tagline);

            // Genres
            if (m.category && m.category.length) {
                var gw = $('<div class="kkfull-info__genres"></div>');
                m.category.forEach(function (g) {
                    var ge = $('<div class="kkfull-info__genre selector">' + g.name + '</div>');
                    ge.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: '', title: g.name,
                            component: 'kkphim_category', page: 1,
                            cat_path: '/v1/api/the-loai/' + g.slug, cat_v1: true
                        });
                    });
                    gw.append(ge);
                });
                right.append(gw);
            }

            // Director, actors
            if (m.director && m.director.length && m.director[0]) {
                right.append('<div class="kkfull-info__tagline"><span>🎬 ' + m.director.join(', ') + '</span></div>');
            }
            if (m.actor && m.actor.length && m.actor[0]) {
                right.append('<div class="kkfull-info__tagline"><span>🎭 ' + m.actor.slice(0, 8).join(', ') + (m.actor.length > 8 ? '...' : '') + '</span></div>');
            }

            // Description
            var desc = htmlToText(m.content || '');
            if (desc) right.append('<div class="kkfull-info__desc">' + desc + '</div>');

            // Buttons
            var btns = $('<div class="kkfull-info__btns"></div>');

            var playBtn = $('<div class="kkfull-info__btn kkfull-info__btn--play selector"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Phát Phim</div>');
            playBtn.on('hover:enter', function () {
                if (episodes.length && episodes[0].server_data && episodes[0].server_data.length) {
                    playEp(m, episodes[0].server_data[0]);
                } else {
                    Lampa.Noty.show('Chưa có tập phim');
                }
            });
            btns.append(playBtn);

            if (m.trailer_url) {
                var trBtn = $('<div class="kkfull-info__btn selector"><svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.5 7.5v9l7-4.5z"/></svg> Trailer</div>');
                trBtn.on('hover:enter', function () {
                    Lampa.Player.play({ title: m.name + ' - Trailer', url: m.trailer_url });
                });
                btns.append(trBtn);
            }

            var favBtn = $('<div class="kkfull-info__btn selector"><svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg> Yêu thích</div>');
            favBtn.on('hover:enter', function () {
                Lampa.Noty.show('Đã thêm yêu thích!');
            });
            btns.append(favBtn);

            right.append(btns);
            top.append(right);
            html.append(top);

            // === EPISODES ===
            if (episodes.length) {
                var epW = $('<div class="kkfull-ep"></div>');
                var totalEps = 0;
                episodes.forEach(function (s) { totalEps += (s.server_data || []).length; });
                epW.append('<div class="kkfull-ep__title">Danh sách tập phim (' + totalEps + ')</div>');

                // Server tabs
                if (episodes.length > 1) {
                    var srvs = $('<div class="kkfull-ep__servers"></div>');
                    episodes.forEach(function (srv, si) {
                        var tab = $('<div class="kkfull-ep__srv selector' + (si === 0 ? ' active' : '') + '">' + (srv.server_name || 'Server ' + (si + 1)) + '</div>');
                        tab.on('hover:enter', function () {
                            srvs.find('.kkfull-ep__srv').removeClass('active');
                            $(this).addClass('active');
                            epW.find('.kkfull-ep__list').hide();
                            epW.find('.kkfull-ep__list[data-s="' + si + '"]').css('display', 'flex');
                        });
                        srvs.append(tab);
                    });
                    epW.append(srvs);
                }

                // Ep lists
                episodes.forEach(function (srv, si) {
                    var list = $('<div class="kkfull-ep__list" data-s="' + si + '"' + (si > 0 ? ' style="display:none"' : '') + '></div>');
                    (srv.server_data || []).forEach(function (ep) {
                        var btn = $('<div class="kkfull-ep__item selector">' + (ep.name || '?') + '</div>');
                        btn.on('hover:enter', function () {
                            $(this).addClass('watched');
                            playEp(m, ep);
                        });
                        list.append(btn);
                    });
                    epW.append(list);
                });

                html.append(epW);
            }
        };

        function playEp(movie, ep) {
            var link = ep.link_m3u8 || ep.link_embed || '';
            if (!link) { Lampa.Noty.show('Không tìm thấy link'); return; }
            var t = (movie.name || '') + (ep.name ? ' - Tập ' + ep.name : '');
            Lampa.Player.play({ title: t, url: link });
            Lampa.Player.playlist([{ title: t, url: link }]);
        }

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () { scroll.destroy(); };
    });

    // =============================================
    // COMPONENT: CATEGORY + INFINITE SCROLL
    // =============================================
    Lampa.Component.add('kkphim_category', function (object) {
        var comp = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div></div>');
        var grid = $('<div class="kkcat-wrap"></div>');
        var moreEl = $('<div class="kkcat-more"></div>');

        var curPage = 1;
        var isLoading = false;
        var allDone = false;
        var timer = null;

        body.append('<div class="kkcat-head">' + (object.title || '') + '</div>');
        body.append(grid);
        body.append(moreEl);
        scroll.append(body);

        this.create = function () {
            comp.activity.loader(true);
            comp.loadPage(1);
            comp.watchScroll();
        };

        this.loadPage = function (page) {
            if (isLoading || allDone) return;
            isLoading = true;
            moreEl.text('Đang tải...');

            var params = { page: page };
            if (object.cat_v1) params.limit = 24;

            var url = API_HOST + object.cat_path;
            var q = [];
            for (var k in params) q.push(k + '=' + params[k]);
            url += '?' + q.join('&');

            $.ajax({
                url: url,
                dataType: 'json',
                timeout: 15000,
                success: function (res) {
                    isLoading = false;
                    moreEl.text('');
                    comp.activity.loader(false);

                    var items = [], cdn = '', totalPages = 1;

                    if (object.cat_v1 && res && res.data) {
                        items = res.data.items || [];
                        cdn = res.data.APP_DOMAIN_CDN_IMAGE || '';
                        var pp = res.data.params;
                        if (pp && pp.pagination) totalPages = pp.pagination.totalPages || 1;
                    } else if (res) {
                        items = res.items || [];
                        if (res.pagination) totalPages = res.pagination.totalPages || 1;
                    }

                    if (!items.length) {
                        allDone = true;
                        if (page <= 1) comp.showEmpty();
                        return;
                    }

                    items.forEach(function (item) {
                        grid.append(makeCard(item, cdn));
                    });

                    curPage = page;
                    if (curPage >= totalPages) allDone = true;
                    comp.activity.toggle();
                },
                error: function () {
                    isLoading = false;
                    moreEl.text('');
                    comp.activity.loader(false);
                    if (curPage <= 1) comp.showEmpty();
                }
            });
        };

        this.showEmpty = function () {
            var e = new Lampa.Empty();
            body.append(e.render());
            comp.activity.toggle();
        };

        this.watchScroll = function () {
            timer = setInterval(function () {
                if (allDone || isLoading) return;
                var sb = scroll.render().find('.scroll__body');
                if (!sb.length) return;
                var el = sb[0];
                var tr = el.style.transform || '';
                var mm = tr.match(/translateY\(([^)]+)\)/);
                var y = mm ? Math.abs(parseFloat(mm[1])) : 0;
                var h = el.scrollHeight || el.offsetHeight;
                var vh = scroll.render()[0].clientHeight || scroll.render()[0].offsetHeight;
                if (h > 100 && y + vh + 600 >= h) {
                    comp.loadPage(curPage + 1);
                }
            }, 350);
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () { if (timer) clearInterval(timer); };
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            if (timer) clearInterval(timer);
            scroll.destroy();
        };
    });

    // =============================================
    // MENU
    // =============================================
    function addMenu() {
        var svg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 8H2v12c0 1.1.9 2 2 2h12v-2H4V8z"/><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 12.5v-9l6 4.5-6 4.5z"/></svg>';
        var li = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico">' + svg + '</div><div class="menu__text">KKPhim</div></li>');

        li.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(li);
    }

    // =============================================
    // START
    // =============================================
    function start() {
        addCSS();
        addMenu();
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });

})();