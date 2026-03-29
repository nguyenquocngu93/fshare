(function () {
    'use strict';

    if (window.__kkphim_plugin_started) return;
    window.__kkphim_plugin_started = true;

    var API = 'https://phimapi.com/';
    var IMG = 'https://phimimg.com/';
    var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_IMG = 'https://image.tmdb.org/t/p/original';
    var TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';

    function fullImg(url) {
        if (!url) return '';
        return url.indexOf('http') === 0 ? url : IMG + url;
    }

    async function tmdbFetch(path) {
        var r = await fetch('https://api.themoviedb.org/3' + path, {
            headers: {
                'Authorization': 'Bearer ' + TMDB_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        if (!r.ok) throw new Error('TMDB err');
        return await r.json();
    }

    function detectType(d) {
        if (d && d.tmdb && d.tmdb.type === 'tv') return 'tv';
        if (d && d.tmdb && d.tmdb.type === 'movie') return 'movie';
        if (d && (d.type === 'series' || d.type === 'tvshows' || d.type === 'hoathinh')) return 'tv';
        if (d && d.episode_total && d.episode_total !== '1') return 'tv';
        return 'movie';
    }

    function getTmdbId(d) {
        return (d && d.tmdb && d.tmdb.id) ? d.tmdb.id : null;
    }

    function pickLogo(imgs) {
        if (!imgs || !imgs.logos || !imgs.logos.length) return null;
        return imgs.logos.find(function (l) { return l.iso_639_1 === 'vi'; }) ||
            imgs.logos.find(function (l) { return l.iso_639_1 === 'en'; }) ||
            imgs.logos[0] || null;
    }

    function enableNativeScroll(scroll) {
        var el = scroll.render();

        el.css({
            'overflow': 'hidden',
            'position': 'relative',
            'height': '100%'
        });

        var body = el.find('.scroll__body');

        body.css({
            'transform': 'none',
            'position': 'relative',
            'overflow-y': 'auto',
            'overflow-x': 'hidden',
            '-webkit-overflow-scrolling': 'touch',
            'height': '100%',
            'padding-bottom': '8em'
        });

        if (body[0]) {
            body[0].style.setProperty('transform', 'none', 'important');
            body[0].style.setProperty('overflow-y', 'auto', 'important');
            body[0].style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
            body[0].style.setProperty('height', '100%', 'important');
            body[0].style.setProperty('padding-bottom', '8em', 'important');
        }
    }

    function clearScroll(scroll) {
        try {
            scroll.render().find('.scroll__body').empty();
        } catch (e) {}
    }

    function escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatText(s) {
        return escapeHtml(s || '').replace(/\n/g, '<br>');
    }

    function cleanDesc(s) {
        s = String(s || '').replace(/<[^>]+>/g, '').trim();
        return s || 'Không có mô tả';
    }

    function bindEnter(el, fn) {
        var touched = false;

        el.on('touchend', function (e) {
            touched = true;
            e.preventDefault();
            e.stopPropagation();
            fn.call(this, e);
            setTimeout(function () {
                touched = false;
            }, 300);
        });

        el.on('click', function (e) {
            if (touched) return;
            e.preventDefault();
            e.stopPropagation();
            fn.call(this, e);
        });

        el.on('hover:enter', function (e) {
            fn.call(this, e);
        });
    }

    function getFirstEpisode(episodes) {
        for (var i = 0; i < (episodes || []).length; i++) {
            var sv = episodes[i];
            if (sv && sv.server_data && sv.server_data.length) return sv.server_data[0];
        }
        return null;
    }

    function normalizeItem(item) {
        if (!item) return null;
        return {
            name: item.name || item.title || '',
            origin_name: item.origin_name || '',
            slug: item.slug || '',
            poster_url: item.poster_url || item.poster || '',
            thumb_url: item.thumb_url || item.thumb || '',
            year: item.year || '',
            quality: item.quality || '',
            episode_current: item.episode_current || '',
            tmdb: item.tmdb || {},
            category: item.category || [],
            director: item.director || '',
            content: item.content || '',
            time: item.time || '',
            episode_total: item.episode_total || '',
            type: item.type || ''
        };
    }

    function injectStyle() {
        if ($('#kk-css').length) return;

        $('head').append(`<style id="kk-css">
            .kk-row { margin-bottom:1.8em }
            .kk-row-head { display:flex; justify-content:space-between; align-items:center; padding:0 1.5em; margin-bottom:.8em }
            .kk-row-title { font-size:1.5em; font-weight:900; color:#fff }
            .kk-row-more { font-size:.95em; font-weight:800; padding:.5em .9em; border-radius:999px; background:rgba(255,255,255,.08); color:#fff; cursor:pointer }
            .kk-row-more.focus { background:#fff; color:#000 }
            .kk-row-list { display:flex; gap:.9em; overflow-x:auto; overflow-y:hidden; padding:0 1.5em .2em; -webkit-overflow-scrolling:touch }
            .kk-row-list::-webkit-scrollbar,.kk-cast-list::-webkit-scrollbar { display:none }

            .kk-card { flex:0 0 auto; width:9.5em; cursor:pointer }
            .kk-card--grid { width:100% }
            .kk-card-img { position:relative; width:100%; aspect-ratio:2/3; border-radius:.9em; overflow:hidden; background:#242424 }
            .kk-card-img img { width:100%; height:100%; object-fit:cover; display:block }
            .kk-card-q { position:absolute; top:.5em; left:.5em; padding:.2em .5em; border-radius:.4em; font-size:.7em; font-weight:800; background:#f6c344; color:#000 }
            .kk-card-ep { position:absolute; top:.5em; right:.5em; padding:.2em .5em; border-radius:.4em; font-size:.7em; font-weight:800; background:#e53935; color:#fff }
            .kk-card-name { margin-top:.6em; font-size:.98em; line-height:1.32; font-weight:700; color:#fff; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
            .kk-card-year { margin-top:.2em; font-size:.88em; color:rgba(255,255,255,.55) }

            .kk-grid-wrap { padding:0 1.5em }
            .kk-grid-title { font-size:1.8em; font-weight:900; color:#fff; margin-bottom:.7em }
            .kk-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.9em }
            .kk-loadmore { margin-top:1.1em; text-align:center; padding:.9em; border-radius:.9em; background:rgba(255,255,255,.08); color:#fff; font-size:1em; font-weight:800; cursor:pointer }
            .kk-loadmore.focus { background:#ff2332 }

            .kk-hero { position:relative; margin-bottom:1.2em; border-radius:0 0 1.2em 1.2em; overflow:hidden; background:#1c1c1c }
            .kk-hero-bg { position:relative; height:22em }
            .kk-hero-bg img { width:100%; height:100%; object-fit:cover; display:block; transform:scale(1.04); filter:blur(1px) }
            .kk-hero-mask { position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,.06) 0%,rgba(0,0,0,.14) 24%,rgba(0,0,0,.42) 58%,rgba(20,20,20,.92) 86%,rgba(20,20,20,1) 100%) }
            .kk-hero-bottom { position:absolute; left:0; right:0; bottom:0; z-index:2; padding:1.1em }
            .kk-hero-flex { display:flex; align-items:flex-end; gap:1.2em }
            .kk-hero-poster { width:10em; min-width:10em }
            .kk-hero-poster img { width:100%; aspect-ratio:2/3; object-fit:cover; border-radius:.9em; display:block; box-shadow:0 .8em 1.8em rgba(0,0,0,.35); background:#242424 }
            .kk-hero-info { flex:1; min-width:0 }

            .kk-logo { max-width:24em; margin-bottom:.75em }
            .kk-logo img { max-width:100%; max-height:9em; object-fit:contain; display:block; filter:drop-shadow(0 .3em 1em rgba(0,0,0,.35)) }

            .kk-title { font-size:2.1em; line-height:1.08; font-weight:900; color:#fff; margin-bottom:.12em }
            .kk-origin { font-size:1.05em; line-height:1.35; color:rgba(255,255,255,.7) }

            .kk-body { padding:0 1.2em }
            .kk-metas { display:flex; flex-wrap:wrap; gap:.5em; margin-bottom:.9em }
            .kk-meta { padding:.48em .8em; border-radius:999px; background:rgba(255,255,255,.1); color:#fff; font-size:.96em; font-weight:800 }
            .kk-genres { display:flex; flex-wrap:wrap; gap:.5em; margin-bottom:.9em }
            .kk-genre { padding:.4em .85em; border-radius:999px; background:rgba(56,142,60,.24); border:1px solid rgba(76,175,80,.45); color:#a5d6a7; font-size:.94em; font-weight:700; cursor:pointer }
            .kk-genre.focus { background:rgba(76,175,80,.45); color:#fff }

            .kk-crew { margin-bottom:1em; padding:.2em 0 .1em }
            .kk-crew b { display:block; font-size:1.08em; font-weight:900; color:#fff; margin-bottom:.22em }
            .kk-crew span { display:block; font-size:1.05em; line-height:1.55; color:rgba(255,255,255,.84) }

            .kk-desc { font-size:1.06em; line-height:1.68; color:rgba(255,255,255,.9); margin-bottom:1.1em }
            .kk-play { display:inline-flex; align-items:center; justify-content:center; min-width:10em; padding:.9em 1.5em; border-radius:.85em; background:#ff1424; color:#fff; font-size:1.1em; font-weight:900; cursor:pointer; box-shadow:0 .5em 1.4em rgba(255,20,36,.25) }
            .kk-play.focus { background:#ff3140 }

            .kk-block { padding:0 1.2em; margin-top:1.5em }
            .kk-block-title { font-size:1.5em; font-weight:900; color:#fff; margin-bottom:.7em }
            .kk-cast-list { display:flex; gap:.85em; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; touch-action:pan-x; padding-bottom:.2em }
            .kk-cast-card { flex:0 0 auto; width:8em }
            .kk-cast-img { width:100%; aspect-ratio:2/3; border-radius:.85em; overflow:hidden; background:#2b2b2b; margin-bottom:.5em }
            .kk-cast-img img { width:100%; height:100%; object-fit:cover; display:block }
            .kk-cast-empty { width:100%; height:100%; background:#333 }
            .kk-cast-name { font-size:.92em; line-height:1.32; font-weight:800; color:#fff }
            .kk-cast-role { font-size:.82em; line-height:1.32; color:rgba(255,255,255,.6); margin-top:.15em }

            .kk-server { font-size:1.02em; font-weight:800; color:#63d471; margin:1em 0 .65em }
            .kk-eps { display:flex; flex-wrap:wrap; gap:.7em }
            .kk-ep { min-width:4em; text-align:center; padding:.75em 1em; border-radius:.7em; background:rgba(255,255,255,.09); color:#fff; font-size:.96em; font-weight:800; cursor:pointer }
            .kk-ep.focus { background:#ff2233 }

            .selector,
            .kk-play,
            .kk-ep,
            .kk-row-more,
            .kk-loadmore,
            .kk-genre,
            .kk-card {
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
            }

            @media(orientation:portrait){
                .kk-hero-flex { display:block }
                .kk-hero-poster { display:none }
                .kk-logo { max-width:26em }
                .kk-logo img { max-height:10em }
                .kk-title { font-size:1.85em }
                .kk-origin { font-size:.96em }
                .kk-play { width:100% }
            }
            @media(orientation:landscape){
                .kk-hero-poster { display:block }
            }
            @media(max-width:768px){
                .kk-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:.8em }
            }
        </style>`);
    }

    function addMenu() {
        function ins() {
            if ($('.menu__item[data-action="kkphim"]').length) return;

            var m = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');

            bindEnter(m, function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_main',
                    page: 1
                });
            });

            $('.menu .menu__list').first().append(m);
        }

        setTimeout(ins, 500);
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') setTimeout(ins, 500);
        });
        Lampa.Listener.follow('full', function () {
            setTimeout(ins, 500);
        });
    }

    function mkCard(item) {
        item = normalizeItem(item);
        if (!item) return $('<div></div>');

        var p = fullImg(item.poster_url || item.thumb_url);
        var c = $('<div class="kk-card selector"><div class="kk-card-img"><img src="' + p + '">' + (item.quality ? '<div class="kk-card-q">' + escapeHtml(item.quality) + '</div>' : '') + (item.episode_current ? '<div class="kk-card-ep">' + escapeHtml(item.episode_current) + '</div>' : '') + '</div><div class="kk-card-name">' + escapeHtml(item.name || '') + '</div><div class="kk-card-year">' + escapeHtml(item.year || '') + '</div></div>');

        bindEnter(c, function () {
            if (!item || !item.slug) {
                Lampa.Noty.show('Phim không có slug');
                return;
            }

            Lampa.Activity.push({
                url: '',
                title: item.name || 'KKPhim',
                component: 'kkphim_detail',
                movie: item,
                page: 1
            });
        });

        return c;
    }

    function makePeopleCards(list, roleKey) {
        return (list || []).map(function (p) {
            var av = p.profile_path ? '<img src="' + TMDB_IMG_W500 + p.profile_path + '">' : '<div class="kk-cast-empty"></div>';
            return '<div class="kk-cast-card"><div class="kk-cast-img">' + av + '</div><div class="kk-cast-name">' + escapeHtml(p.name || '') + '</div><div class="kk-cast-role">' + escapeHtml(p[roleKey] || '') + '</div></div>';
        }).join('');
    }

    function applyController(scroll) {
        Lampa.Controller.remove('content');

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
                Navigator.move('down');
            },
            back: function () {
                Lampa.Activity.backward();
            }
        });

        Lampa.Controller.toggle('content');
    }

    function startPlugin() {
        injectStyle();
        addMenu();

        Lampa.Component.add('kkphim_main', function () {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var comp = this;

            var cats = [
                { name: 'Phim Mới Cập Nhật', api: 'danh-sach/phim-moi-cap-nhat', slug: 'phim-moi-cap-nhat' },
                { name: 'Phim Bộ', api: 'v1/api/danh-sach/phim-bo', slug: 'phim-bo' },
                { name: 'Phim Lẻ', api: 'v1/api/danh-sach/phim-le', slug: 'phim-le' },
                { name: 'Hoạt Hình', api: 'v1/api/danh-sach/hoat-hinh', slug: 'hoat-hinh' }
            ];

            this.create = function () {
                this.activity.loader(true);
                clearScroll(scroll);

                var loaded = 0;

                cats.forEach(function (cat) {
                    network.silent(API + cat.api + '?page=1', function (res) {
                        var list = (res && res.items) ? res.items : (res && res.data && res.data.items) ? res.data.items : [];

                        list = list.map(normalizeItem).filter(function (item) {
                            return item && item.slug;
                        });

                        if (list.length) {
                            var row = $('<div class="kk-row"></div>');
                            var head = $('<div class="kk-row-head"></div>');
                            var t = $('<div class="kk-row-title">' + escapeHtml(cat.name) + '</div>');
                            var more = $('<div class="kk-row-more selector">Xem thêm</div>');
                            var rl = $('<div class="kk-row-list"></div>');

                            bindEnter(more, function () {
                                Lampa.Activity.push({
                                    url: '',
                                    title: cat.name,
                                    component: 'kkphim_category',
                                    cat: cat,
                                    page_num: 1,
                                    mode: 'api'
                                });
                            });

                            list.slice(0, 12).forEach(function (item) {
                                rl.append(mkCard(item));
                            });

                            head.append(t).append(more);
                            row.append(head).append(rl);
                            scroll.append(row);
                        }

                        loaded++;
                        if (loaded >= cats.length) {
                            comp.activity.loader(false);
                            comp.start();
                        }
                    }, function () {
                        loaded++;
                        if (loaded >= cats.length) {
                            comp.activity.loader(false);
                            comp.start();
                        }
                    });
                });
            };

            this.start = function () {
                applyController(scroll);
                enableNativeScroll(scroll);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
            };
        });

        Lampa.Component.add('kkphim_category', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var comp = this;
            var page = object.page_num || 1;
            var title = object.title || (object.cat && object.cat.name) || 'Danh mục';
            var mode = object.mode || 'api';
            var apiPath = object.cat ? object.cat.api : null;
            var catSlug = object.category_slug || '';
            var wrap = $('<div class="kk-grid-wrap"></div>');
            var grid = $('<div class="kk-grid"></div>');
            var loadMore = $('<div class="kk-loadmore selector">Tải thêm</div>');
            var loading = false;
            var hasMore = true;

            this.create = function () {
                this.activity.loader(true);
                clearScroll(scroll);

                wrap.append($('<div class="kk-grid-title">' + escapeHtml(title) + '</div>'));
                wrap.append(grid);
                wrap.append(loadMore);
                scroll.append(wrap);

                bindEnter(loadMore, function () {
                    if (!loading && hasMore) doLoad();
                });

                doLoad();
            };

            function handleRes(res) {
                var list = (res && res.items) ? res.items : (res && res.data && res.data.items) ? res.data.items : [];
                list = list.map(normalizeItem).filter(function (item) {
                    return item && item.slug;
                });

                if (!list.length) {
                    hasMore = false;
                    loadMore.text('Hết dữ liệu');
                    comp.activity.loader(false);
                    loading = false;
                    comp.start();
                    return;
                }

                list.forEach(function (item) {
                    grid.append(mkCard(item).addClass('kk-card--grid'));
                });

                page++;
                loading = false;
                loadMore.text('Tải thêm');
                comp.activity.loader(false);
                comp.start();
            }

            function doLoad() {
                loading = true;
                loadMore.text('Đang tải...');

                var url = (mode === 'category' && catSlug)
                    ? API + 'v1/api/the-loai/' + catSlug + '?page=' + page
                    : API + apiPath + '?page=' + page;

                network.silent(url, function (res) {
                    handleRes(res);
                }, function () {
                    if (mode === 'category' && catSlug) {
                        network.silent(API + 'the-loai/' + catSlug + '?page=' + page, function (r2) {
                            handleRes(r2);
                        }, function () {
                            loading = false;
                            loadMore.text('Tải lại');
                            comp.activity.loader(false);
                            Lampa.Noty.show('Lỗi tải danh mục');
                        });
                    } else {
                        loading = false;
                        loadMore.text('Tải lại');
                        comp.activity.loader(false);
                        Lampa.Noty.show('Lỗi tải danh mục');
                    }
                });
            }

            this.start = function () {
                applyController(scroll);
                enableNativeScroll(scroll);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
            };
        });

        Lampa.Component.add('kkphim_detail', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var movie = normalizeItem(object.movie);
            var comp = this;
            var rendered = false;

            this.create = function () {
                this.activity.loader(true);
                clearScroll(scroll);
                rendered = false;

                if (!movie || !movie.slug) {
                    this.activity.loader(false);
                    scroll.append($('<div class="empty__body"><div class="empty__title">Không có dữ liệu phim</div><div class="empty__text">Thiếu slug để tải chi tiết</div></div>'));
                    comp.start();
                    return;
                }

                network.silent(API + 'phim/' + movie.slug, function (res) {
                    if (rendered) return;
                    var data = res.movie || res || {};
                    var episodes = res.episodes || [];
                    loadAll(data, episodes);
                }, function () {
                    comp.activity.loader(false);
                    Lampa.Noty.show('Lỗi tải thông tin phim');
                });
            };

            async function loadAll(data, episodes) {
                data = normalizeItem(data);

                try {
                    var tid = getTmdbId(data);
                    var ttype = detectType(data);
                    var tmdb = null, logos = null;

                    if (tid) {
                        try {
                            tmdb = await tmdbFetch('/' + ttype + '/' + tid + '?language=vi-VN&append_to_response=credits,images');
                        } catch (e) {
                            try {
                                tmdb = await tmdbFetch('/' + ttype + '/' + tid + '?language=en-US&append_to_response=credits,images');
                            } catch (e2) {}
                        }

                        try {
                            logos = await tmdbFetch('/' + ttype + '/' + tid + '/images');
                        } catch (e3) {}
                    }

                    if (!rendered) {
                        buildDetail(data, episodes, tmdb, logos, ttype);
                        rendered = true;
                    }
                } catch (e) {
                    if (!rendered) {
                        buildDetail(data, episodes, null, null, detectType(data));
                        rendered = true;
                    }
                }

                comp.activity.loader(false);
                comp.start();
            }

            function buildDetail(data, episodes, tmdb, logos, ttype) {
                clearScroll(scroll);

                var bk = fullImg(data.thumb_url || data.poster_url);
                var ps = fullImg(data.poster_url || data.thumb_url);
                var t = data.name || '';
                var o = data.origin_name || '';
                var d = cleanDesc(data.content);
                var v = (data.tmdb && data.tmdb.vote_average) ? data.tmdb.vote_average : 'N/A';
                var y = data.year || '';
                var rt = data.time || '';
                var epCur = data.episode_current || '';
                var ghtml = '';
                var castH = '';
                var directorH = '';
                var crewH = '';
                var logoH = '';
                var dir = '';
                var pCats = data.category || [];

                if (tmdb) {
                    if (tmdb.backdrop_path) bk = TMDB_IMG + tmdb.backdrop_path;
                    if (tmdb.poster_path) ps = TMDB_IMG + tmdb.poster_path;
                    if (tmdb.title || tmdb.name) t = tmdb.title || tmdb.name;
                    if (tmdb.original_title || tmdb.original_name) o = tmdb.original_title || tmdb.original_name;
                    if (tmdb.overview) d = tmdb.overview;
                    if (tmdb.vote_average) v = Number(tmdb.vote_average).toFixed(1);
                    if (tmdb.release_date) y = tmdb.release_date.slice(0, 4);
                    if (!y && tmdb.first_air_date) y = tmdb.first_air_date.slice(0, 4);
                    if (tmdb.runtime) rt = tmdb.runtime + ' phút';
                    if ((!rt || rt === '') && tmdb.episode_run_time && tmdb.episode_run_time.length) rt = tmdb.episode_run_time[0] + ' phút';

                    var logo = pickLogo(logos || tmdb.images);
                    if (logo && logo.file_path) {
                        logoH = '<div class="kk-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '"></div>';
                    }

                    if (tmdb.credits) {
                        var cast = (tmdb.credits.cast || []).slice(0, 12);
                        castH = makePeopleCards(cast, 'character');

                        var crew = tmdb.credits.crew || [];
                        var directors = [];

                        if (ttype === 'movie') {
                            directors = crew.filter(function (c) {
                                return c.job === 'Director';
                            });
                        } else {
                            directors = crew.filter(function (c) {
                                return c.job === 'Creator' || c.job === 'Director' || c.job === 'Series Director';
                            });
                        }

                        directors = directors.filter(function (p, i, arr) {
                            return arr.findIndex(function (x) {
                                return (x.id && x.id === p.id) || x.name === p.name;
                            }) === i;
                        }).slice(0, 10);

                        if (directors.length) {
                            dir = directors.map(function (c) { return c.name; }).join(', ');
                            directorH = makePeopleCards(directors.map(function (c) {
                                return {
                                    name: c.name,
                                    profile_path: c.profile_path,
                                    job: c.job || 'Đạo diễn'
                                };
                            }), 'job');
                        }
                    }
                }

                if (pCats.length) {
                    ghtml = pCats.map(function (g) {
                        return '<span class="kk-genre selector" data-slug="' + escapeHtml(g.slug || '') + '" data-title="' + escapeHtml(g.name || '') + '">' + escapeHtml(g.name || '') + '</span>';
                    }).join('');
                } else if (tmdb && tmdb.genres && tmdb.genres.length) {
                    ghtml = tmdb.genres.map(function (g) {
                        return '<span class="kk-genre">' + escapeHtml(g.name || '') + '</span>';
                    }).join('');
                }

                if (data.director && !dir) {
                    dir = Array.isArray(data.director) ? data.director.join(', ') : data.director;

                    var localDirectors = (Array.isArray(data.director) ? data.director : String(data.director).split(','))
                        .map(function (name) {
                            return {
                                name: String(name).trim(),
                                profile_path: '',
                                job: 'Đạo diễn'
                            };
                        })
                        .filter(function (x) { return x.name; });

                    if (localDirectors.length) {
                        directorH = makePeopleCards(localDirectors, 'job');
                    }
                }

                if (dir && !directorH) {
                    crewH = '<div class="kk-crew"><b>Đạo diễn</b><span>' + escapeHtml(dir) + '</span></div>';
                }

                var hero = $('<div class="kk-hero"><div class="kk-hero-bg"><img src="' + bk + '"><div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster"><img src="' + ps + '"></div><div class="kk-hero-info">' + logoH + '<div class="kk-title">' + escapeHtml(t) + '</div><div class="kk-origin">' + escapeHtml(o) + '</div></div></div></div></div>');

                var body = $('<div class="kk-body"><div class="kk-metas"><span class="kk-meta">⭐ ' + escapeHtml(v) + '</span>' + (y ? '<span class="kk-meta">📅 ' + escapeHtml(y) + '</span>' : '') + (rt ? '<span class="kk-meta">⏱ ' + escapeHtml(rt) + '</span>' : '') + (epCur ? '<span class="kk-meta">🎬 ' + escapeHtml(epCur) + '</span>' : '') + '</div><div class="kk-genres">' + ghtml + '</div>' + crewH + '<div class="kk-desc">' + formatText(d) + '</div><div><div class="kk-play selector">▶ Xem phim</div></div></div>');

                bindEnter(body.find('.kk-play'), function () {
                    var first = getFirstEpisode(episodes);
                    if (first) playEp(first);
                    else Lampa.Noty.show('Không tìm thấy tập phim');
                });

                body.find('.kk-genre[data-slug]').each(function () {
                    var g = $(this);

                    bindEnter(g, function () {
                        var slug = g.attr('data-slug');
                        var tg = g.attr('data-title') || 'Thể loại';
                        if (!slug) return;

                        Lampa.Activity.push({
                            url: '',
                            title: tg,
                            component: 'kkphim_category',
                            mode: 'category',
                            category_slug: slug,
                            page_num: 1
                        });
                    });
                });

                scroll.append(hero);
                scroll.append(body);

                if (directorH) {
                    scroll.append($('<div class="kk-block"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">' + directorH + '</div></div>'));
                }

                if (castH) {
                    scroll.append($('<div class="kk-block"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">' + castH + '</div></div>'));
                }

                if (episodes && episodes.length) {
                    var ew = $('<div class="kk-block"></div>');
                    ew.append($('<div class="kk-block-title">Danh sách tập</div>'));

                    episodes.forEach(function (sv) {
                        ew.append($('<div class="kk-server">' + escapeHtml(sv.server_name || '') + '</div>'));
                        var g = $('<div class="kk-eps"></div>');

                        (sv.server_data || []).forEach(function (ep) {
                            var b = $('<div class="kk-ep selector">' + escapeHtml(ep.name || '') + '</div>');
                            bindEnter(b, function () {
                                playEp(ep);
                            });
                            g.append(b);
                        });

                        ew.append(g);
                    });

                    scroll.append(ew);
                }
            }

            function playEp(ep) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                if (!link) {
                    Lampa.Noty.show('Không có link phát');
                    return;
                }

                Lampa.Player.play({
                    title: (movie.name || '') + ' - ' + (ep.name || ''),
                    url: link
                });
            }

            this.start = function () {
                applyController(scroll);
                enableNativeScroll(scroll);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () {
                network.clear();
                scroll.destroy();
            };
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
    });
})();