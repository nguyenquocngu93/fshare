(function () {
    'use strict';

    var API_HOST = 'https://phimapi.com';

    function addCSS() {
        if ($('#kkphim-css').length) return;
        $('head').append($('<style id="kkphim-css"></style>').html(`
            .kkphim-card-wrap {
                width: 13em;
                flex-shrink: 0;
            }
            .kkphim-card-img-box {
                position: relative;
                padding-bottom: 150%;
                background: #272736;
                border-radius: 1em;
                overflow: hidden;
            }
            .kkphim-card-wrap.focus .kkphim-card-img-box::after {
                content: '';
                position: absolute;
                inset: 0;
                border: 0.3em solid #fff;
                border-radius: 1em;
                z-index: 5;
                pointer-events: none;
            }
            .kkphim-card-img-box img {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .kkphim-card-badge-left {
                position: absolute;
                bottom: 0.5em;
                left: 0.5em;
                background: #e50914;
                color: #fff;
                font-size: 0.75em;
                font-weight: 700;
                padding: 0.1em 0.4em;
                border-radius: 0.3em;
                z-index: 3;
            }
            .kkphim-card-badge-right {
                position: absolute;
                bottom: 0.5em;
                right: 0.5em;
                background: rgba(0,0,0,0.6);
                color: #fff;
                font-size: 0.8em;
                font-weight: 600;
                padding: 0.1em 0.45em;
                border-radius: 0.3em;
                z-index: 3;
            }
            .kkphim-card-name {
                font-size: 1.1em;
                color: #fff;
                margin-top: 0.5em;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                line-height: 1.3;
            }
            .kkphim-card-sub {
                font-size: 0.85em;
                color: rgba(255,255,255,0.3);
                margin-top: 0.1em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .kkphim-card-year {
                font-size: 0.85em;
                color: rgba(255,255,255,0.3);
            }

            /* === Section Head === */
            .kkphim-sect-head {
                display: flex;
                align-items: center;
                padding: 0 1.5em;
                margin-bottom: 0.7em;
            }
            .kkphim-sect-title {
                flex: 1;
                font-size: 1.4em;
                color: rgba(255,255,255,0.55);
                font-weight: 600;
            }
            .kkphim-sect-more {
                font-size: 1.05em;
                color: rgba(255,255,255,0.4);
                background: rgba(255,255,255,0.07);
                padding: 0.3em 1.1em;
                border-radius: 0.4em;
            }
            .kkphim-sect-more.focus {
                background: #fff;
                color: #000;
            }

            /* === Info page === */
            .kkfull {
                padding: 1.5em;
            }
            .kkfull-head {
                display: flex;
                gap: 2em;
            }
            .kkfull-poster {
                flex-shrink: 0;
                width: 14em;
            }
            .kkfull-poster img {
                width: 100%;
                border-radius: 1em;
                background: #272736;
            }
            .kkfull-detail {
                flex: 1;
                min-width: 0;
            }
            .kkfull-name {
                font-size: 2.3em;
                font-weight: 700;
                color: #fff;
                line-height: 1.15;
            }
            .kkfull-orig {
                font-size: 1.1em;
                color: rgba(255,255,255,0.35);
                margin-top: 0.1em;
                margin-bottom: 0.6em;
            }
            .kkfull-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
                margin-bottom: 0.7em;
            }
            .kkfull-tag {
                background: rgba(255,255,255,0.07);
                color: rgba(255,255,255,0.55);
                padding: 0.2em 0.65em;
                border-radius: 0.35em;
                font-size: 1em;
            }
            .kkfull-tag.hl {
                background: rgba(229,9,20,0.8);
                color: #fff;
                font-weight: 600;
            }
            .kkfull-genres {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
                margin-bottom: 0.7em;
            }
            .kkfull-genre {
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.5);
                padding: 0.2em 0.65em;
                border-radius: 1em;
                font-size: 0.95em;
            }
            .kkfull-genre.focus {
                background: #fff;
                color: #000;
                border-color: #fff;
            }
            .kkfull-desc {
                font-size: 1.05em;
                color: rgba(255,255,255,0.4);
                line-height: 1.5;
                margin-bottom: 0.8em;
                display: -webkit-box;
                -webkit-line-clamp: 4;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .kkfull-btns {
                display: flex;
                flex-wrap: wrap;
                gap: 0.6em;
                margin-bottom: 1em;
            }
            .kkfull-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.4em;
                padding: 0.6em 1.4em;
                border-radius: 0.5em;
                font-size: 1.1em;
                font-weight: 600;
                color: #fff;
                background: rgba(255,255,255,0.07);
            }
            .kkfull-btn svg {
                width: 1.2em;
                height: 1.2em;
                fill: currentColor;
            }
            .kkfull-btn--play {
                background: #e50914;
            }
            .kkfull-btn--play.focus {
                background: #ff1a2d;
                outline: 0.25em solid #fff;
                outline-offset: 0.08em;
            }
            .kkfull-btn.focus {
                background: #fff;
                color: #000;
            }
            .kkfull-btn--play.focus {
                background: #ff1a2d;
                color: #fff;
            }

            /* Episodes */
            .kkfull-eptitle {
                font-size: 1.35em;
                font-weight: 600;
                color: #fff;
                margin: 0.8em 0 0.5em;
            }
            .kkfull-servers {
                display: flex;
                flex-wrap: wrap;
                gap: 0.35em;
                margin-bottom: 0.5em;
            }
            .kkfull-srv {
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.4);
                padding: 0.25em 0.8em;
                border-radius: 0.4em;
                font-size: 0.95em;
            }
            .kkfull-srv.active {
                background: rgba(118,75,162,0.8);
                color: #fff;
                border-color: transparent;
            }
            .kkfull-srv.focus {
                background: #fff;
                color: #000;
                border-color: #fff;
            }
            .kkfull-eplist {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
            }
            .kkfull-ep {
                min-width: 3.2em;
                padding: 0.45em 0.6em;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.55);
                text-align: center;
                border-radius: 0.45em;
                font-size: 1em;
                font-weight: 600;
            }
            .kkfull-ep.focus {
                background: #e50914;
                color: #fff;
                border-color: transparent;
                outline: 0.15em solid #fff;
                outline-offset: 0.06em;
            }
            .kkfull-ep.watched { opacity: 0.3; }

            /* Category grid */
            .kkcat-title {
                font-size: 1.5em;
                font-weight: 600;
                color: #fff;
                padding: 0.5em 1.2em 0.4em;
            }
            .kkcat-grid {
                display: flex;
                flex-wrap: wrap;
                padding: 0 1.2em;
            }
            .kkcat-grid .kkphim-card-wrap {
                margin-bottom: 1em;
                margin-right: 1em;
            }
            .kkcat-loading {
                text-align: center;
                padding: 1em;
                color: rgba(255,255,255,0.2);
                font-size: 1.1em;
            }
        `));
    }

    // =============================================
    // IMG FIX
    // =============================================
    function imgSrc(url, cdn) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return (cdn || API_HOST) + '/' + url;
    }

    // =============================================
    // CARD BUILDER
    // =============================================
    function makeCard(item, cdn) {
        var img = imgSrc(item.poster_url || item.thumb_url, cdn);

        var card = $('<div class="kkphim-card-wrap selector"></div>');
        var box = $('<div class="kkphim-card-img-box"></div>');
        box.append('<img src="' + img + '" />');
        if (item.quality) box.append('<div class="kkphim-card-badge-left">' + item.quality + '</div>');
        if (item.year) box.append('<div class="kkphim-card-badge-right">' + item.year + '</div>');
        card.append(box);
        card.append('<div class="kkphim-card-name">' + (item.name || '') + '</div>');
        if (item.origin_name) card.append('<div class="kkphim-card-sub">' + item.origin_name + '</div>');
        if (item.year) card.append('<div class="kkphim-card-year">' + item.year + '</div>');

        card.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: item.name || '',
                component: 'kkphim_info',
                slug: item.slug
            });
        });

        return card;
    }

    // =============================================
    // HOME COMPONENT
    // =============================================
    Lampa.Component.add('kkphim_main', function (object) {
        var comp = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div></div>');

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

        var total = cats.length;
        var done = 0;

        this.create = function () {
            this.activity.loader(true);

            cats.forEach(function (cat) {
                // head
                var head = $('<div class="kkphim-sect-head"></div>');
                head.append('<div class="kkphim-sect-title">' + cat.title + '</div>');
                var more = $('<div class="kkphim-sect-more selector">More</div>');
                more.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '', title: cat.title,
                        component: 'kkphim_category',
                        page: 1, cat_path: cat.path, cat_v1: cat.v1
                    });
                });
                head.append(more);
                body.append(head);

                // line scroll (horizontal)
                var lineScroll = new Lampa.Scroll({ horizontal: true, step: 300 });
                var lineInner = $('<div style="display:flex"></div>');

                body.append(lineScroll.render().css({ 'margin-bottom': '1.5em', 'padding': '0 1.5em' }));

                // fetch
                var prm = cat.v1 ? { page: 1, limit: 12 } : { page: 1 };
                var url = API_HOST + cat.path;
                var q = [];
                for (var k in prm) q.push(k + '=' + prm[k]);
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
                        items.forEach(function (it) {
                            lineInner.append(makeCard(it, cdn).css('margin-right', '1em'));
                        });
                        lineScroll.append(lineInner);
                        checkDone();
                    },
                    error: function () { checkDone(); }
                });
            });

            scroll.append(body);
        };

        function checkDone() {
            done++;
            if (done >= total) {
                comp.activity.loader(false);
                comp.activity.toggle();
            }
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
    // INFO COMPONENT
    // =============================================
    Lampa.Component.add('kkphim_info', function (object) {
        var comp = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var html = $('<div class="kkfull"></div>');
        scroll.append(html);

        this.create = function () {
            comp.activity.loader(true);
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
                        comp.empty();
                    }
                },
                error: function () {
                    comp.activity.loader(false);
                    comp.empty();
                }
            });
        };

        this.empty = function () {
            html.append(new Lampa.Empty().render());
            comp.activity.toggle();
        };

        this.build = function (m, eps) {
            var poster = m.poster_url || m.thumb_url || '';
            var top = $('<div class="kkfull-head"></div>');
            var left = $('<div class="kkfull-poster"></div>');
            left.append('<img src="' + poster + '" onerror="this.style.display=\'none\'"/>');
            top.append(left);

            var right = $('<div class="kkfull-detail"></div>');
            right.append('<div class="kkfull-name">' + (m.name || '') + '</div>');
            if (m.origin_name) right.append('<div class="kkfull-orig">' + m.origin_name + '</div>');

            var tags = $('<div class="kkfull-tags"></div>');
            if (m.quality) tags.append('<span class="kkfull-tag hl">' + m.quality + '</span>');
            if (m.year) tags.append('<span class="kkfull-tag">' + m.year + '</span>');
            if (m.time) tags.append('<span class="kkfull-tag">' + m.time + '</span>');
            if (m.lang) tags.append('<span class="kkfull-tag">' + m.lang + '</span>');
            if (m.episode_current) tags.append('<span class="kkfull-tag">' + m.episode_current + '</span>');
            if (m.country && m.country.length) tags.append('<span class="kkfull-tag">' + m.country.map(function(c){return c.name}).join(', ') + '</span>');
            right.append(tags);

            if (m.category && m.category.length) {
                var gw = $('<div class="kkfull-genres"></div>');
                m.category.forEach(function(g) {
                    var ge = $('<div class="kkfull-genre selector">' + g.name + '</div>');
                    ge.on('hover:enter', function() {
                        Lampa.Activity.push({
                            url:'', title: g.name,
                            component:'kkphim_category', page:1,
                            cat_path:'/v1/api/the-loai/'+g.slug, cat_v1:true
                        });
                    });
                    gw.append(ge);
                });
                right.append(gw);
            }

            var desc = m.content ? $('<div>').html(m.content).text() : '';
            if (desc) right.append('<div class="kkfull-desc">' + desc + '</div>');

            var btns = $('<div class="kkfull-btns"></div>');
            var playBtn = $('<div class="kkfull-btn kkfull-btn--play selector"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Phát Phim</div>');
            playBtn.on('hover:enter', function() {
                if (eps.length && eps[0].server_data && eps[0].server_data.length) {
                    doPlay(m, eps[0].server_data[0]);
                } else Lampa.Noty.show('Chưa có tập phim');
            });
            btns.append(playBtn);

            if (m.trailer_url) {
                var tr = $('<div class="kkfull-btn selector"><svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.5 7.5v9l7-4.5z"/></svg> Trailer</div>');
                tr.on('hover:enter', function() {
                    Lampa.Player.play({title: m.name + ' - Trailer', url: m.trailer_url});
                });
                btns.append(tr);
            }

            var fav = $('<div class="kkfull-btn selector"><svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg> Yêu thích</div>');
            fav.on('hover:enter', function() { Lampa.Noty.show('Đã thêm yêu thích!'); });
            btns.append(fav);
            right.append(btns);

            top.append(right);
            html.append(top);

            // Episodes
            if (eps.length) {
                var total = 0;
                eps.forEach(function(s){total += (s.server_data||[]).length;});
                html.append('<div class="kkfull-eptitle">Danh sách tập (' + total + ')</div>');

                if (eps.length > 1) {
                    var sw = $('<div class="kkfull-servers"></div>');
                    eps.forEach(function(srv,si) {
                        var t = $('<div class="kkfull-srv selector'+(si===0?' active':'')+'">'+(srv.server_name||'Server '+(si+1))+'</div>');
                        t.on('hover:enter', function() {
                            sw.find('.kkfull-srv').removeClass('active');
                            $(this).addClass('active');
                            html.find('.kkfull-eplist').hide();
                            html.find('.kkfull-eplist[data-s="'+si+'"]').css('display','flex');
                        });
                        sw.append(t);
                    });
                    html.append(sw);
                }

                eps.forEach(function(srv,si) {
                    var list = $('<div class="kkfull-eplist" data-s="'+si+'"'+(si>0?' style="display:none"':'')+'></div>');
                    (srv.server_data||[]).forEach(function(ep) {
                        var b = $('<div class="kkfull-ep selector">'+(ep.name||'?')+'</div>');
                        b.on('hover:enter', function() {
                            $(this).addClass('watched');
                            doPlay(m, ep);
                        });
                        list.append(b);
                    });
                    html.append(list);
                });
            }
        };

        function doPlay(m, ep) {
            var link = ep.link_m3u8 || ep.link_embed || '';
            if (!link) { Lampa.Noty.show('Không tìm thấy link'); return; }
            var t = (m.name||'') + (ep.name?' - Tập '+ep.name:'');
            Lampa.Player.play({title:t, url:link});
            Lampa.Player.playlist([{title:t, url:link}]);
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
    // CATEGORY COMPONENT (INFINITE SCROLL)
    // =============================================
    Lampa.Component.add('kkphim_category', function (object) {
        var comp = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var body = $('<div></div>');
        var grid = $('<div class="kkcat-grid"></div>');
        var loadmore = $('<div class="kkcat-loading"></div>');
        var curPage = 1, loading = false, ended = false, timer = null;

        body.append('<div class="kkcat-title">' + (object.title||'') + '</div>');
        body.append(grid);
        body.append(loadmore);
        scroll.append(body);

        this.create = function () {
            comp.activity.loader(true);
            comp.load(1);
            comp.watch();
        };

        this.load = function (page) {
            if (loading || ended) return;
            loading = true;
            loadmore.text('Đang tải...');

            var prm = {page: page};
            if (object.cat_v1) prm.limit = 24;
            var url = API_HOST + object.cat_path;
            var q = [];
            for (var k in prm) q.push(k+'='+prm[k]);
            url += '?' + q.join('&');

            $.ajax({
                url: url, dataType: 'json', timeout: 15000,
                success: function (res) {
                    loading = false;
                    loadmore.text('');
                    comp.activity.loader(false);

                    var items=[], cdn='', tp=1;
                    if (object.cat_v1 && res && res.data) {
                        items = res.data.items||[];
                        cdn = res.data.APP_DOMAIN_CDN_IMAGE||'';
                        if (res.data.params && res.data.params.pagination) tp = res.data.params.pagination.totalPages||1;
                    } else if (res) {
                        items = res.items||[];
                        if (res.pagination) tp = res.pagination.totalPages||1;
                    }
                    if (!items.length) { ended = true; if (page<=1) comp.empty(); return; }

                    items.forEach(function(it) {
                        grid.append(makeCard(it, cdn).css({'margin-right':'1em','margin-bottom':'1em'}));
                    });
                    curPage = page;
                    if (curPage >= tp) ended = true;
                    comp.activity.toggle();
                },
                error: function () {
                    loading = false; loadmore.text('');
                    comp.activity.loader(false);
                    if (curPage<=1) comp.empty();
                }
            });
        };

        this.empty = function () {
            body.append(new Lampa.Empty().render());
            comp.activity.toggle();
        };

        this.watch = function () {
            timer = setInterval(function () {
                if (ended || loading) return;
                var sb = scroll.render().find('.scroll__body');
                if (!sb.length) return;
                var el = sb[0];
                var tr = el.style.transform||'';
                var m = tr.match(/translateY\(([^)]+)\)/);
                var y = m ? Math.abs(parseFloat(m[1])) : 0;
                var h = el.scrollHeight||el.offsetHeight;
                var vh = scroll.render()[0].clientHeight||scroll.render()[0].offsetHeight;
                if (h>100 && y+vh+600>=h) comp.load(curPage+1);
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
                down: function () { if (Navigator.canmove('down')) Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () { if (timer) clearInterval(timer); };
        this.render = function () { return scroll.render(); };
        this.destroy = function () { if (timer) clearInterval(timer); scroll.destroy(); };
    });

    // =============================================
    // MENU BUTTON
    // =============================================
    function addMenu() {
        var svg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 8H2v12c0 1.1.9 2 2 2h12v-2H4V8z"/><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 12.5v-9l6 4.5-6 4.5z"/></svg>';
        var li = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico">'+svg+'</div><div class="menu__text">KKPhim</div></li>');
        li.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '', title: 'KKPhim',
                component: 'kkphim_main', page: 1
            });
        });
        $('.menu .menu__list').eq(0).append(li);
    }

    // =============================================
    // INIT
    // =============================================
    function init() {
        addCSS();
        addMenu();
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });

})();