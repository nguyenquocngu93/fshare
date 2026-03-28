(function () {
    'use strict';

    var API_HOST = 'https://phimapi.com';
    var IMG_CDN = '';

    // =============================================
    // STYLES
    // =============================================
    Lampa.Template.add('kkphim_styles', `
        <style>
        /* ===== HOME ===== */
        .kkphim-home {
            padding-top: 0.5em;
        }
        .kkphim-home__section {
            margin-bottom: 1.5em;
        }
        .kkphim-home__head {
            display: flex;
            align-items: center;
            padding: 0 1.5em;
            margin-bottom: 0.8em;
        }
        .kkphim-home__head-title {
            flex-grow: 1;
            font-size: 1.5em;
            color: #fff;
            font-weight: 600;
        }
        .kkphim-home__head-more {
            flex-shrink: 0;
            font-size: 1.1em;
            color: rgba(255,255,255,0.4);
            padding: 0.3em 1em;
            border-radius: 0.5em;
            background: transparent;
        }
        .kkphim-home__head-more.focus {
            background: #fff;
            color: #000;
        }
        .kkphim-home__line {
            padding: 0 1.5em;
            display: flex;
            flex-wrap: nowrap;
        }

        /* ===== CARD ===== */
        .kkphim-card {
            width: 13em;
            flex-shrink: 0;
            margin-right: 1em;
            cursor: pointer;
        }
        .kkphim-card__img {
            position: relative;
            padding-bottom: 150%;
            background: #2A2A3B;
            border-radius: 1em;
            overflow: hidden;
        }
        .kkphim-card.focus .kkphim-card__img {
            border: solid 0.3em #fff;
            border-radius: 1.1em;
        }
        .kkphim-card__img > img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 1em;
        }
        .kkphim-card.focus .kkphim-card__img > img {
            border-radius: 0.8em;
        }
        .kkphim-card__badge {
            position: absolute;
            top: 0.5em;
            left: 0.5em;
            background: rgba(118,75,162,0.9);
            color: #fff;
            font-size: 0.75em;
            font-weight: 700;
            padding: 0.15em 0.5em;
            border-radius: 0.3em;
            z-index: 2;
        }
        .kkphim-card__badge-right {
            position: absolute;
            top: 0.5em;
            right: 0.5em;
            background: rgba(0,0,0,0.7);
            color: #fff;
            font-size: 0.75em;
            padding: 0.15em 0.5em;
            border-radius: 0.3em;
            z-index: 2;
        }
        .kkphim-card__ep-tag {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.85));
            color: #fff;
            font-size: 0.75em;
            font-weight: 600;
            text-align: center;
            padding: 1.5em 0.5em 0.35em;
            z-index: 2;
        }
        .kkphim-card__name {
            margin-top: 0.5em;
            font-size: 1.05em;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
            padding: 0 0.2em;
        }
        .kkphim-card.focus .kkphim-card__name {
            color: #fff;
        }
        .kkphim-card__orig {
            font-size: 0.85em;
            color: rgba(255,255,255,0.35);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
            padding: 0 0.2em 0.3em;
        }

        /* ===== FULL (INFO PAGE - LAMPA STYLE) ===== */
        .kkfull {
            position: relative;
            padding: 1.5em;
            display: flex;
            flex-direction: column;
        }
        .kkfull__top {
            display: flex;
            gap: 2em;
        }
        .kkfull__poster {
            flex-shrink: 0;
            width: 14em;
        }
        .kkfull__poster-img {
            width: 100%;
            border-radius: 1em;
            aspect-ratio: 2/3;
            object-fit: cover;
            background: #2A2A3B;
        }
        .kkfull__right {
            flex: 1;
            min-width: 0;
        }
        .kkfull__title {
            font-size: 2.4em;
            font-weight: 700;
            color: #fff;
            line-height: 1.15;
            margin-bottom: 0.1em;
        }
        .kkfull__orig {
            font-size: 1.15em;
            color: rgba(255,255,255,0.4);
            margin-bottom: 0.7em;
        }
        .kkfull__tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5em;
            margin-bottom: 0.8em;
        }
        .kkfull__tag {
            background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.7);
            padding: 0.25em 0.7em;
            border-radius: 0.4em;
            font-size: 1em;
        }
        .kkfull__tag--hl {
            background: rgba(118,75,162,0.85);
            color: #fff;
            font-weight: 600;
        }
        .kkfull__genres {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4em;
            margin-bottom: 1em;
        }
        .kkfull__genre {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 0.2em 0.7em;
            border-radius: 1em;
            font-size: 0.95em;
            color: rgba(255,255,255,0.6);
        }
        .kkfull__genre.focus {
            background: #fff;
            color: #000;
            border-color: #fff;
        }
        .kkfull__descr {
            font-size: 1.05em;
            color: rgba(255,255,255,0.55);
            line-height: 1.6;
            margin-bottom: 1em;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .kkfull__btns {
            display: flex;
            flex-wrap: wrap;
            gap: 0.7em;
            margin-bottom: 1.5em;
        }
        .kkfull__btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4em;
            padding: 0.7em 1.6em;
            border-radius: 0.6em;
            font-size: 1.1em;
            font-weight: 600;
            color: #fff;
        }
        .kkfull__btn svg {
            width: 1.3em;
            height: 1.3em;
            fill: currentColor;
        }
        .kkfull__btn--play {
            background: #e50914;
        }
        .kkfull__btn--play.focus {
            background: #ff2030;
            box-shadow: 0 0 0 0.2em #fff;
            transform: scale(1.05);
        }
        .kkfull__btn--sub {
            background: rgba(255,255,255,0.08);
        }
        .kkfull__btn--sub.focus {
            background: #fff;
            color: #000;
        }

        /* ===== EPISODES ===== */
        .kkfull__eptitle {
            font-size: 1.4em;
            font-weight: 600;
            color: #fff;
            margin: 0.8em 0 0.5em;
        }
        .kkfull__servers {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4em;
            margin-bottom: 0.7em;
        }
        .kkfull__srv {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            padding: 0.3em 0.9em;
            border-radius: 0.5em;
            font-size: 0.95em;
            color: rgba(255,255,255,0.5);
        }
        .kkfull__srv.active {
            background: rgba(118,75,162,0.85);
            color: #fff;
            border-color: transparent;
        }
        .kkfull__srv.focus {
            background: #fff;
            color: #000;
            border-color: #fff;
        }
        .kkfull__epgrid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5em;
        }
        .kkfull__ep {
            min-width: 3.5em;
            padding: 0.55em 0.7em;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.7);
            text-align: center;
            border-radius: 0.5em;
            font-size: 1em;
            font-weight: 600;
        }
        .kkfull__ep.focus {
            background: #e50914;
            color: #fff;
            border-color: transparent;
            box-shadow: 0 0 0 0.15em #fff;
            transform: scale(1.08);
        }
        .kkfull__ep.watched {
            opacity: 0.35;
        }

        /* ===== CATEGORY ===== */
        .kkcat-title {
            font-size: 1.6em;
            font-weight: 600;
            color: #fff;
            padding: 0.7em 1.2em 0.5em;
        }
        .kkcat-grid {
            display: flex;
            flex-wrap: wrap;
            padding: 0 1.2em;
        }
        .kkcat-grid .kkphim-card {
            margin-bottom: 1em;
        }
        .kkcat-loading {
            text-align: center;
            padding: 1.5em;
            color: rgba(255,255,255,0.3);
            font-size: 1.1em;
        }
        </style>
    `);

    // =============================================
    // CARD HTML
    // =============================================
    function buildCard(item, cdn) {
        var poster = item.poster_url || item.thumb_url || '';
        if (poster && !poster.startsWith('http')) {
            poster = (cdn || API_HOST) + '/' + poster;
        }
        var el = $('<div class="kkphim-card selector"></div>');
        var imgBox = $('<div class="kkphim-card__img"></div>');
        imgBox.append($('<img />').attr('src', poster).on('error', function () {
            $(this).attr('src', './img/img_broken.svg');
        }));

        if (item.quality) imgBox.append('<div class="kkphim-card__badge">' + item.quality + '</div>');
        if (item.year) imgBox.append('<div class="kkphim-card__badge-right">' + item.year + '</div>');
        if (item.episode_current) imgBox.append('<div class="kkphim-card__ep-tag">' + item.episode_current + '</div>');

        el.append(imgBox);
        el.append('<div class="kkphim-card__name">' + (item.name || '') + '</div>');
        el.append('<div class="kkphim-card__orig">' + (item.origin_name || '') + '</div>');

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
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div class="kkphim-home"></div>');

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

        var loaded = 0;

        function loadCat(cat) {
            var section = $('<div class="kkphim-home__section"></div>');
            var head = $('<div class="kkphim-home__head"></div>');
            head.append('<div class="kkphim-home__head-title">' + cat.title + '</div>');

            var more = $('<div class="kkphim-home__head-more selector">Xem thêm ›</div>');
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
            section.append(head);

            var line = $('<div class="kkphim-home__line"></div>');
            section.append(line);
            body.append(section);

            var params = cat.v1 ? { page: 1, limit: 12 } : { page: 1 };
            var url = API_HOST + cat.path;
            var q = [];
            for (var k in params) q.push(k + '=' + params[k]);
            url += '?' + q.join('&');

            $.ajax({
                url: url,
                dataType: 'json',
                timeout: 12000,
                success: function (res) {
                    var items = [];
                    var cdn = '';
                    if (cat.v1 && res && res.data) {
                        items = res.data.items || [];
                        cdn = res.data.APP_DOMAIN_CDN_IMAGE || '';
                    } else if (res) {
                        items = res.items || [];
                    }

                    items.forEach(function (item) {
                        line.append(buildCard(item, cdn));
                    });

                    checkDone();
                },
                error: function () {
                    checkDone();
                }
            });
        }

        function checkDone() {
            loaded++;
            if (loaded >= cats.length) {
                object.activity.loader(false);
                object.activity.toggle();
            }
        }

        this.create = function () {
            object.activity.loader(true);
            cats.forEach(loadCat);
            scroll.append(body);
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
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
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
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var html = $('<div class="kkfull"></div>');
        var activeServerIdx = 0;

        function stripHTML(s) {
            if (!s) return '';
            return $('<div>').html(s).text();
        }

        this.create = function () {
            var _this = this;
            object.activity.loader(true);

            $.ajax({
                url: API_HOST + '/phim/' + object.slug,
                dataType: 'json',
                timeout: 12000,
                success: function (res) {
                    object.activity.loader(false);
                    if (res && res.movie) {
                        _this.draw(res.movie, res.episodes || []);
                        object.activity.toggle();
                    } else {
                        _this.drawEmpty();
                    }
                },
                error: function () {
                    object.activity.loader(false);
                    _this.drawEmpty();
                }
            });

            scroll.append(html);
        };

        this.drawEmpty = function () {
            var empty = new Lampa.Empty();
            html.append(empty.render());
            object.activity.toggle();
        };

        this.draw = function (m, episodes) {
            var poster = m.poster_url || m.thumb_url || '';

            // === TOP ===
            var top = $('<div class="kkfull__top"></div>');

            // Poster
            var posterEl = $('<div class="kkfull__poster"></div>');
            posterEl.append($('<img class="kkfull__poster-img"/>').attr('src', poster).on('error', function () {
                $(this).attr('src', './img/img_broken.svg');
            }));
            top.append(posterEl);

            // Right side
            var right = $('<div class="kkfull__right"></div>');
            right.append('<div class="kkfull__title">' + (m.name || '') + '</div>');
            if (m.origin_name) right.append('<div class="kkfull__orig">' + m.origin_name + '</div>');

            // Tags
            var tags = $('<div class="kkfull__tags"></div>');
            if (m.quality) tags.append('<span class="kkfull__tag kkfull__tag--hl">' + m.quality + '</span>');
            if (m.year) tags.append('<span class="kkfull__tag">📅 ' + m.year + '</span>');
            if (m.time) tags.append('<span class="kkfull__tag">⏱ ' + m.time + '</span>');
            if (m.lang) tags.append('<span class="kkfull__tag">🗣 ' + m.lang + '</span>');
            if (m.episode_current) tags.append('<span class="kkfull__tag">📺 ' + m.episode_current + '</span>');
            if (m.view) tags.append('<span class="kkfull__tag">👁 ' + Number(m.view).toLocaleString() + '</span>');
            if (m.country && m.country.length) {
                tags.append('<span class="kkfull__tag">🌍 ' + m.country.map(function (c) { return c.name; }).join(', ') + '</span>');
            }
            right.append(tags);

            // Genres
            if (m.category && m.category.length) {
                var genres = $('<div class="kkfull__genres"></div>');
                m.category.forEach(function (g) {
                    var ge = $('<div class="kkfull__genre selector">' + g.name + '</div>');
                    ge.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: '',
                            title: g.name,
                            component: 'kkphim_category',
                            page: 1,
                            cat_path: '/v1/api/the-loai/' + g.slug,
                            cat_v1: true
                        });
                    });
                    genres.append(ge);
                });
                right.append(genres);
            }

            // Actors / Directors
            if (m.director && m.director.length && m.director[0]) {
                right.append('<div class="kkfull__tags"><span class="kkfull__tag">🎬 Đạo diễn: ' + m.director.join(', ') + '</span></div>');
            }
            if (m.actor && m.actor.length && m.actor[0]) {
                right.append('<div class="kkfull__tags"><span class="kkfull__tag">🎭 Diễn viên: ' + m.actor.slice(0, 6).join(', ') + (m.actor.length > 6 ? '...' : '') + '</span></div>');
            }

            // Description
            var desc = stripHTML(m.content || '');
            if (desc) {
                right.append('<div class="kkfull__descr">' + desc + '</div>');
            }

            // Buttons
            var btns = $('<div class="kkfull__btns"></div>');

            var playBtn = $('<div class="kkfull__btn kkfull__btn--play selector"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Phát Phim</div>');
            playBtn.on('hover:enter', function () {
                if (episodes.length && episodes[0].server_data && episodes[0].server_data.length) {
                    doPlay(m, episodes[0].server_data[0]);
                } else {
                    Lampa.Noty.show('Chưa có tập phim');
                }
            });
            btns.append(playBtn);

            if (m.trailer_url) {
                var trailerBtn = $('<div class="kkfull__btn kkfull__btn--sub selector"><svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.5 7.5v9l7-4.5z"/></svg> Trailer</div>');
                trailerBtn.on('hover:enter', function () {
                    var u = m.trailer_url;
                    if (u.indexOf('youtube.com/watch') > -1) {
                        var v = u.split('v=')[1];
                        if (v) u = 'https://www.youtube.com/embed/' + v.split('&')[0];
                    }
                    Lampa.Player.play({ title: m.name + ' - Trailer', url: u });
                });
                btns.append(trailerBtn);
            }

            var favBtn = $('<div class="kkfull__btn kkfull__btn--sub selector"><svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg> Yêu thích</div>');
            favBtn.on('hover:enter', function () {
                Lampa.Noty.show('Đã thêm vào yêu thích');
            });
            btns.append(favBtn);

            right.append(btns);
            top.append(right);
            html.append(top);

            // === EPISODES ===
            if (episodes.length) {
                var totalEps = 0;
                episodes.forEach(function (s) { totalEps += (s.server_data || []).length; });

                html.append('<div class="kkfull__eptitle">Danh sách tập <span style="font-size:0.6em;color:rgba(255,255,255,0.35);margin-left:0.5em;">' + totalEps + ' tập</span></div>');

                // Server tabs
                if (episodes.length > 1) {
                    var srvWrap = $('<div class="kkfull__servers"></div>');
                    episodes.forEach(function (srv, si) {
                        var tab = $('<div class="kkfull__srv selector' + (si === 0 ? ' active' : '') + '">' + (srv.server_name || 'Server ' + (si + 1)) + '</div>');
                        tab.on('hover:enter', function () {
                            activeServerIdx = si;
                            srvWrap.find('.kkfull__srv').removeClass('active');
                            $(this).addClass('active');
                            html.find('.kkfull__epgrid').hide();
                            html.find('.kkfull__epgrid[data-srv="' + si + '"]').css('display', 'flex');
                        });
                        srvWrap.append(tab);
                    });
                    html.append(srvWrap);
                }

                // Episode grids
                episodes.forEach(function (srv, si) {
                    var grid = $('<div class="kkfull__epgrid" data-srv="' + si + '"' + (si > 0 ? ' style="display:none"' : '') + '></div>');
                    (srv.server_data || []).forEach(function (ep) {
                        var btn = $('<div class="kkfull__ep selector">' + (ep.name || '?') + '</div>');
                        btn.on('hover:enter', function () {
                            $(this).addClass('watched');
                            doPlay(m, ep);
                        });
                        grid.append(btn);
                    });
                    html.append(grid);
                });
            }
        };

        function doPlay(movie, ep) {
            var link = ep.link_m3u8 || ep.link_embed || '';
            if (!link) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }
            var t = (movie.name || '') + (ep.name ? ' - ' + ep.name : '');
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
                down: function () { if (Navigator.canmove('down')) Navigator.move('down'); },
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
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div></div>');
        var grid = $('<div class="kkcat-grid"></div>');
        var loading = $('<div class="kkcat-loading" style="display:none">Đang tải thêm...</div>');

        var curPage = 1;
        var isLoading = false;
        var allDone = false;
        var timer = null;

        body.append('<div class="kkcat-title">' + (object.title || 'Danh mục') + '</div>');
        body.append(grid);
        body.append(loading);
        scroll.append(body);

        this.create = function () {
            object.activity.loader(true);
            this.load(1);
            this.monitor();
        };

        this.load = function (page) {
            var _this = this;
            if (isLoading || allDone) return;
            isLoading = true;
            loading.show();

            var params = { page: page };
            if (object.cat_v1) params.limit = 24;

            var url = API_HOST + object.cat_path;
            var q = [];
            for (var k in params) q.push(k + '=' + params[k]);
            url += '?' + q.join('&');

            $.ajax({
                url: url,
                dataType: 'json',
                timeout: 12000,
                success: function (res) {
                    isLoading = false;
                    loading.hide();
                    object.activity.loader(false);

                    var items = [], cdn = '', totalPages = 1;

                    if (object.cat_v1 && res && res.data) {
                        items = res.data.items || [];
                        cdn = res.data.APP_DOMAIN_CDN_IMAGE || '';
                        if (res.data.params && res.data.params.pagination) totalPages = res.data.params.pagination.totalPages || 1;
                    } else if (res) {
                        items = res.items || [];
                        if (res.pagination) totalPages = res.pagination.totalPages || 1;
                    }

                    if (!items.length) {
                        allDone = true;
                        if (curPage <= 1) _this.drawEmpty();
                        return;
                    }

                    items.forEach(function (item) {
                        grid.append(buildCard(item, cdn));
                    });

                    curPage = page;
                    if (curPage >= totalPages) allDone = true;

                    object.activity.toggle();
                },
                error: function () {
                    isLoading = false;
                    loading.hide();
                    object.activity.loader(false);
                    if (curPage <= 1) _this.drawEmpty();
                }
            });
        };

        this.drawEmpty = function () {
            var empty = new Lampa.Empty();
            body.append(empty.render());
            object.activity.toggle();
        };

        this.monitor = function () {
            var _this = this;
            timer = setInterval(function () {
                if (allDone || isLoading) return;
                var sBody = scroll.render().find('.scroll__body');
                if (!sBody.length) return;
                var el = sBody[0];
                var t = el.style.transform || '';
                var m = t.match(/translateY\(([^)]+)\)/);
                var y = m ? Math.abs(parseFloat(m[1])) : 0;
                var h = el.scrollHeight || el.offsetHeight;
                var vh = scroll.render()[0].clientHeight || scroll.render()[0].offsetHeight;
                if (h > 0 && y + vh + 600 >= h) {
                    _this.load(curPage + 1);
                }
            }, 300);
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
                down: function () { if (Navigator.canmove('down')) Navigator.move('down'); },
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
        var ico = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 8H2v12c0 1.1.9 2 2 2h12v-2H4V8z"/><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 12.5v-9l6 4.5-6 4.5z"/></svg>';

        var item = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico">' + ico + '</div><div class="menu__text">KKPhim</div></li>');

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(item);
    }

    // =============================================
    // INJECT STYLES
    // =============================================
    function injectStyles() {
        if (!$('#kkphim-css').length) {
            $('body').append(Lampa.Template.get('kkphim_styles', {}, true));
            $('body style:last').attr('id', 'kkphim-css');
        }
    }

    // =============================================
    // INIT
    // =============================================
    function init() {
        injectStyles();
        addMenu();
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();