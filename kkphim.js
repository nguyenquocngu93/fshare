(function () {
    'use strict';

    var SOURCE_NAME = 'kkphim';
    var CAT_NAME    = 'KKPhim';
    var BASE_URL    = 'https://phimapi.com';
    var IMG_URL     = 'https://phimimg.com/';

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
             + '<path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
             + '</svg>';

    // =====================================================================
    // INJECT CSS - An badge TV cua Lampa
    // =====================================================================
    function injectCSS() {
        var style = document.getElementById('kkp-style');
        if (style) return;
        style = document.createElement('style');
        style.id = 'kkp-style';
        // An tat ca badge/label type tren card cua Lampa
        style.textContent = [
            '.card__type { display: none !important; }',
            '.card-label--type { display: none !important; }',
            '.card__label--tv { display: none !important; }',
            '.item__type { display: none !important; }',
            // An scrollbar ngang cho similar row
            '.kkp-similar-row::-webkit-scrollbar { display: none; }',
        ].join('\n');
        document.head.appendChild(style);
    }

    // =====================================================================
    // HELPERS
    // =====================================================================

    function getPoster(url) {
        if (!url) return '';
        return (url.indexOf('http') === 0) ? url : IMG_URL + url;
    }

    // Chuyen mang category/country thanh [{id, name, slug}]
    // KKPhim co 2 format:
    //   list API: [{id: 15, name: "Kinh Di", slug: "kinh-di"}]
    //   full API: [{id: "kinh-di", name: "Kinh Di"}]  <- id la slug luon
    function toNameArray(arr) {
        if (!arr || !arr.length) return [];
        return arr.map(function (item) {
            if (typeof item === 'string') {
                return { id: item, slug: item, name: item };
            }
            // Neu id la string -> chinh la slug
            // Neu id la so -> dung truong slug
            var slug = (typeof item.id === 'string' && isNaN(item.id))
                       ? item.id
                       : (item.slug || '');
            return {
                id:   slug || String(item.id || ''),
                slug: slug,
                name: item.name || '',
            };
        });
    }

    function normalizeItem(item) {
        if (!item) return {};
        var poster = getPoster(item.poster_url);
        var thumb  = getPoster(item.thumb_url || item.poster_url);
        var genres = toNameArray(item.category || []);

        return {
            id:                   item.slug || '',
            title:                item.name || '',
            name:                 item.name || '',
            original_title:       item.origin_name || item.name || '',
            original_name:        item.origin_name || item.name || '',
            img:                  poster,
            poster:               poster,
            poster_path:          '',
            backdrop_path:        '',
            background_image:     thumb,
            release_date:         item.year ? (item.year + '-01-01') : '',
            first_air_date:       item.year ? (item.year + '-01-01') : '',
            vote_average:         0,
            overview:             item.content || '',
            genres:               genres,
            countries:            toNameArray(item.country || []),
            production_companies: [],
            production_countries: [],
            spoken_languages:     [],
            // Set ca 2 de Lampa khong hien badge TV o bat ky cho nao
            type:                 'movie',
            media_type:           'movie',
            source:               SOURCE_NAME,
            kkphim_slug:          item.slug || '',
            kkphim_type:          item.type || '',
            // Luu raw categories de dung cho similar
            kkphim_cats:          item.category || [],
        };
    }

    // =====================================================================
    // DANH MUC
    // =====================================================================

    var CATEGORIES = [
        { url: '/danh-sach/phim-moi-cap-nhat', title: 'Phim m\u1EDBi c\u1EADp nh\u1EADt' },
        { url: '/v1/api/danh-sach/phim-le',    title: 'Phim l\u1EBB'                      },
        { url: '/v1/api/danh-sach/phim-bo',    title: 'Phim b\u1ED9'                      },
        { url: '/v1/api/danh-sach/hoat-hinh',  title: 'Ho\u1EA1t h\u00ECnh'               },
        { url: '/v1/api/danh-sach/tv-shows',   title: 'TV Shows'                          },
    ];

    function fetchPage(catUrl, page, onOk, onFail) {
        var net = new Lampa.Reguest();
        var sep = (catUrl.indexOf('?') >= 0) ? '&' : '?';
        net.silent(BASE_URL + catUrl + sep + 'page=' + page, function (data) {
            var items = [], totalPages = 1, totalItems = 0;
            try {
                if (data.items) {
                    items      = data.items.map(normalizeItem);
                    totalPages = (data.pagination && data.pagination.totalPages) || 1;
                    totalItems = (data.pagination && data.pagination.totalItems) || items.length;
                } else if (data.data && data.data.items) {
                    items      = data.data.items.map(normalizeItem);
                    var pag    = data.data.params && data.data.params.pagination;
                    totalPages = (pag && pag.totalPages) || 1;
                    totalItems = (pag && pag.totalItems) || items.length;
                }
            } catch (e) { console.warn('[KKPhim] fetchPage error:', e); }
            onOk({ items: items, page: page, totalPages: totalPages, totalItems: totalItems });
        }, onFail || function () {});
    }

    // =====================================================================
    // API SOURCE
    // =====================================================================

    function KKPhimApi() {
        var self     = this;
        self.network = new Lampa.Reguest();

        self.list = function (params, onComplete, onError) {
            var page   = params.page   || 1;
            // Lampa co the truyen cat_url (custom) hoac url (native more button)
            var catUrl = params.cat_url || params.url || '/danh-sach/phim-moi-cap-nhat';
            fetchPage(catUrl, page, function (res) {
                onComplete({ results: res.items, page: res.page, total_pages: res.totalPages, total_results: res.totalItems });
            }, onError);
        };

        self.category = function (params, onComplete, onError) {
            var parts = CATEGORIES.map(function (cat) {
                return function (cb) {
                    fetchPage(cat.url, 1, function (res) {
                        cb({ title: cat.title, results: res.items, url: cat.url, cat_url: cat.url, source: SOURCE_NAME,
                             page: 1, total_pages: res.totalPages, total_results: res.totalItems, source: SOURCE_NAME });
                    }, function () {
                        cb({ title: cat.title, results: [], url: cat.url, cat_url: cat.url });
                    });
                };
            });
            Lampa.Api.partNext(parts, 2, onComplete, onError);
        };

        self.full = function (params, onComplete, onError) {
            var card = params.card || {};
            var slug = card.kkphim_slug || card.id;
            if (!slug) { if (onError) onError('no slug'); return; }

            self.network.silent(BASE_URL + '/phim/' + slug, function (data) {
                var movie    = data.movie    || {};
                var episodes = data.episodes || [];
                var seasons  = [];

                episodes.forEach(function (server, si) {
                    var eps = (server.server_data || []).map(function (ep, ei) {
                        return {
                            episode_number: ei + 1,
                            season_number:  si + 1,
                            name:           ep.name || ('T\u1EADp ' + (ei + 1)),
                            air_date:       '',
                            link_m3u8:      ep.link_m3u8  || '',
                            link_embed:     ep.link_embed || '',
                        };
                    });
                    seasons.push({ season_number: si + 1, name: server.server_name || ('Server ' + (si + 1)), episodes: eps });
                });

                var result               = normalizeItem(movie);
                result.overview          = movie.content || '';
                result.number_of_seasons = seasons.length || 1;
                result.seasons           = seasons;
                result.kkphim_episodes   = episodes;

                onComplete({ movie: result });
            }, onError);
        };

        self.search = function (params, onComplete, onError) {
            var q = encodeURIComponent(params.query || '');
            self.network.silent(BASE_URL + '/v1/api/tim-kiem?keyword=' + q, function (data) {
                var items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : [];
                onComplete({ results: items, page: 1, total_pages: 1, total_results: items.length });
            }, onError);
        };

        self.seasons = function (params, onComplete, onError) {
            var card = params.card || {};
            if (card.seasons && card.seasons.length) {
                onComplete({ seasons: card.seasons });
            } else {
                self.full({ card: card }, function (res) {
                    onComplete({ seasons: (res.movie && res.movie.seasons) || [] });
                }, onError);
            }
        };

        self.person = function (p, ok, err) { err('not supported'); };
        self.clear  = function () { self.network.clear(); };
    }

    // =====================================================================
    // COMPONENT: DANH SACH INFINITE SCROLL
    // =====================================================================

    function KKPhimListComponent(object) {
        var catUrl     = object.cat_url || '/danh-sach/phim-moi-cap-nhat';
        var catTitle   = object.title   || 'KKPhim';
        var curPage    = 1;
        var totalPages = 1;
        var loading    = false;

        var $html = $(
            '<div class="kkp-list-wrap" style="min-height:100vh;">' +
            '<div class="kkp-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;padding:1em 1.5em;"></div>' +
            '<div class="kkp-loader" style="text-align:center;padding:1.5em;display:none;"><span style="opacity:.5;font-size:.9em;">\u0110ang t\u1EA3i...</span></div>' +
            '<div class="kkp-end" style="text-align:center;padding:1em;display:none;"><span style="opacity:.4;font-size:.85em;">\u2014 \u0110\u00E3 t\u1EA3i h\u1EBFt phim \u2014</span></div>' +
            '</div>'
        );

        var $grid   = $html.find('.kkp-grid');
        var $loader = $html.find('.kkp-loader');
        var $end    = $html.find('.kkp-end');

        function renderCard(item) {
            var poster = item.img || item.poster || '';
            var year   = item.release_date ? item.release_date.slice(0, 4) : '';
            var $card  = $(
                '<div class="kkp-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                '<div style="position:relative;padding-top:150%;background:#111;">' +
                '<img src="' + poster + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' +
                '</div>' +
                '<div style="padding:6px 8px;">' +
                '<div style="font-size:13px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (item.title || '') + '</div>' +
                '<div style="font-size:11px;opacity:.5;margin-top:2px;">' + year + '</div>' +
                '</div></div>'
            );
            $card.on('hover:enter click', function () {
                Lampa.Activity.push({ component: 'full', id: item.id, source: SOURCE_NAME, card: item });
            });
            $grid.append($card);
        }

        function loadPage(page) {
            if (loading) return;
            loading = true;
            $loader.show();
            fetchPage(catUrl, page, function (res) {
                totalPages = res.totalPages || 1;
                res.items.forEach(renderCard);
                loading = false;
                $loader.hide();
                if (curPage >= totalPages) $end.show();
            }, function () {
                loading = false;
                $loader.hide();
            });
        }

        function onScroll() {
            var el = $html.parent()[0];
            if (!el) return;
            if ((el.scrollTop + el.clientHeight) >= (el.scrollHeight - 500)) {
                if (!loading && curPage < totalPages) {
                    curPage++;
                    loadPage(curPage);
                }
            }
        }

        // Lampa goi 'start', khong phai 'create'
        this.start = function () {
            loadPage(1);
            setTimeout(function () {
                var $s = $html.closest('.activity__body, .layer__scroll, .app__content');
                if ($s.length) $s.on('scroll.kkplist', onScroll);
                else $(window).on('scroll.kkplist', onScroll);
            }, 400);
            return $html;
        };

        this.render  = function () { return $html; };
        this.header  = function () { return catTitle; };
        this.pause   = function () {};
        this.resume  = function () {};
        this.stop    = function () {};
        this.destroy = function () {
            $(window).off('scroll.kkplist');
            $('.activity__body, .layer__scroll, .app__content').off('scroll.kkplist');
            $html.remove();
        };
    }

    // =====================================================================
    // INJECT: NUT XEM THEM
    // =====================================================================

    function injectViewMore() {
        Lampa.Listener.follow('activity', function (e) {
            if (e.type !== 'start') return;
            var obj = e.object || {};
            if (obj.source !== SOURCE_NAME || obj.component !== 'category') return;

            setTimeout(function () {
                $('.items__head, .category__title').each(function () {
                    var $head = $(this);
                    if ($head.find('.kkp-more-btn').length) return;

                    var headText = $head.text().replace(/\s*[›>].*/g, '').trim();
                    var cfg = null;
                    CATEGORIES.forEach(function (c) { if (c.title === headText) cfg = c; });
                    if (!cfg) return;

                    var $btn = $('<span class="kkp-more-btn selector" style="font-size:12px;opacity:.65;cursor:pointer;margin-left:10px;padding:2px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;vertical-align:middle;">Xem th\u00EAm \u203A</span>');
                    $btn.on('hover:enter click', function () {
                        Lampa.Activity.push({ title: cfg.title, component: 'kkphim_list', cat_url: cfg.url, source: SOURCE_NAME, page: 1 });
                    });
                    $head.append($btn);
                });
            }, 900);
        });
    }

    // =====================================================================
    // INJECT: NUT TAP PHIM
    // =====================================================================

    function injectPlayButtons(card) {
        if (!card || card.source !== SOURCE_NAME) return;
        var slug = card.kkphim_slug || card.id;
        if (!slug) return;

        setTimeout(function () {
            // Tranh inject 2 lan
            if ($('.kkp-play-wrap[data-slug="' + slug + '"]').length) return;

            var net = new Lampa.Reguest();
            net.silent(BASE_URL + '/phim/' + slug, function (res) {
                var eps = res.episodes || [];
                if (!eps.length) return;

                // Xoa wrap cu neu co (truong hop navigate)
                $('.kkp-play-wrap').remove();

                var $wrap = $('<div class="kkp-play-wrap" data-slug="' + slug + '" style="padding:.5em 1.5em 1em;"></div>');

                eps.forEach(function (server) {
                    $wrap.append('<div style="font-size:.8em;opacity:.5;margin:.6em 0 .3em;">' + (server.server_name || 'Server') + '</div>');
                    var playlist = (server.server_data || []).map(function (ep) {
                        return { url: ep.link_m3u8 || ep.link_embed || '', title: (card.title || '') + ' - ' + (ep.name || '') };
                    });
                    var $row = $('<div style="display:flex;flex-wrap:wrap;gap:6px;"></div>');
                    (server.server_data || []).forEach(function (ep, idx) {
                        var link = ep.link_m3u8 || ep.link_embed || '';
                        if (!link) return;
                        var label = ep.name || ('T\u1EADp ' + (idx + 1));
                        var $btn = $('<div class="selector" style="padding:5px 14px;background:rgba(255,255,255,.12);border-radius:4px;font-size:13px;cursor:pointer;">' + label + '</div>');
                        $btn.on('hover:enter click', (function (l, t, pl, i) {
                            return function () {
                                Lampa.Player.play({ url: l, title: t, poster: card.img || card.poster || '' });
                                Lampa.Player.playlist(pl, i);
                            };
                        })(link, (card.title || '') + ' - ' + (ep.name || ''), playlist, idx));
                        $row.append($btn);
                    });
                    $wrap.append($row);
                });

                var $t = $('.full-descr').first();
                if ($t.length) $t.after($wrap);
                else $('.full-start').first().append($wrap);
            });
        }, 500);
    }

    // =====================================================================
    // INJECT: PHIM LIEN QUAN
    // =====================================================================

    function getGenreSlug(card) {
        // Thu tu uu tien: kkphim_cats raw -> genres da normalize
        var cats = card.kkphim_cats || [];
        if (cats.length) {
            var cat = cats[0];
            if (typeof cat === 'object') {
                // id co the la slug string hoac so
                if (cat.slug) return { slug: cat.slug, name: cat.name || cat.slug };
                if (typeof cat.id === 'string' && isNaN(cat.id) && cat.id) {
                    return { slug: cat.id, name: cat.name || cat.id };
                }
            }
        }
        // Fallback tu genres da normalize
        var genres = card.genres || [];
        if (genres.length) {
            var g = genres[0];
            var s = g.slug || g.id || '';
            if (s && isNaN(s)) return { slug: s, name: g.name || s };
        }
        return null;
    }

    function injectSimilarMovies(card) {
        if (!card || card.source !== SOURCE_NAME) return;

        var genreInfo = getGenreSlug(card);
        if (!genreInfo) return;

        var genreSlug = genreInfo.slug;
        var genreName = genreInfo.name;
        var cardSlug  = card.kkphim_slug || card.id;

        setTimeout(function () {
            // Tranh inject 2 lan cho cung 1 phim
            if ($('.kkp-similar-wrap[data-slug="' + cardSlug + '"]').length) return;
            // Xoa wrap cu neu chuyen phim
            $('.kkp-similar-wrap').remove();

            var net = new Lampa.Reguest();
            net.silent(BASE_URL + '/v1/api/the-loai/' + genreSlug + '?page=1', function (data) {
                var items = [];
                try {
                    items = (data.data && data.data.items) ? data.data.items.map(normalizeItem) : [];
                } catch (e) { return; }

                items = items.filter(function (i) { return i.id !== cardSlug; }).slice(0, 20);
                if (!items.length) return;

                var $wrap = $(
                    '<div class="kkp-similar-wrap" data-slug="' + cardSlug + '" style="padding:.5em 0 1.4em;">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;padding:0 1.5em .7em;">' +
                    '<span style="font-size:1em;font-weight:700;">Phim li\u00EAn quan</span>' +
                    '<span class="kkp-sim-more selector" style="font-size:11px;opacity:.55;cursor:pointer;padding:2px 10px;border:1px solid rgba(255,255,255,.25);border-radius:20px;">Xem th\u00EAm \u203A</span>' +
                    '</div>' +
                    '<div class="kkp-similar-row" style="display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;"></div>' +
                    '</div>'
                );

                $wrap.find('.kkp-sim-more').on('hover:enter click', function () {
                    Lampa.Activity.push({ title: 'Th\u1EC3 lo\u1EA1i: ' + genreName, component: 'kkphim_list', cat_url: '/v1/api/the-loai/' + genreSlug, source: SOURCE_NAME, page: 1 });
                });

                var $row = $wrap.find('.kkp-similar-row');
                items.forEach(function (item) {
                    var poster = item.img || item.poster || '';
                    var year   = item.release_date ? item.release_date.slice(0, 4) : '';
                    var $c = $(
                        '<div class="kkp-sim-card selector" style="flex:0 0 110px;width:110px;flex-shrink:0;cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;">' +
                        '<div style="position:relative;padding-top:150%;background:#111;">' +
                        '<img src="' + poster + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/>' +
                        '</div>' +
                        '<div style="padding:5px 6px;">' +
                        '<div style="font-size:11px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (item.title || '') + '</div>' +
                        '<div style="font-size:10px;opacity:.45;margin-top:2px;">' + year + '</div>' +
                        '</div></div>'
                    );
                    // Closure an toan
                    $c.on('hover:enter click', (function (it) {
                        return function () {
                            Lampa.Activity.push({ component: 'full', id: it.id, source: SOURCE_NAME, card: it });
                        };
                    })(item));
                    $row.append($c);
                });

                // Inject sau play buttons hoac sau full-descr
                // Doi 200ms de play buttons kip inject truoc
                setTimeout(function () {
                    var $after = $('.kkp-play-wrap[data-slug="' + cardSlug + '"]');
                    if (!$after.length) $after = $('.full-descr').first();
                    if ($after.length) {
                        $after.after($wrap);
                    } else {
                        $('.full-start').first().append($wrap);
                    }
                }, 200);
            });
        }, 700);
    }

    // =====================================================================
    // KHOI DONG
    // =====================================================================

    function startPlugin() {
        if (window.kkphim_started) return;
        window.kkphim_started = true;

        // Inject CSS an badge TV
        injectCSS();

        Lampa.Api.sources[SOURCE_NAME] = new KKPhimApi();
        Lampa.Component.add('kkphim_list', KKPhimListComponent);

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var card = (e.data && e.data.movie) ? e.data.movie : (e.object && e.object.card);
            injectPlayButtons(card);
            injectSimilarMovies(card);
        });

        injectViewMore();

        var $item = $(
            '<li data-action="' + SOURCE_NAME + '" class="menu__item selector">' +
            '<div class="menu__ico">' + ICON + '</div>' +
            '<div class="menu__text">' + CAT_NAME + '</div></li>'
        );
        $item.on('hover:enter', function () {
            Lampa.Activity.push({ title: CAT_NAME, component: 'category', source: SOURCE_NAME, page: 1 });
        });
        $('.menu .menu__list').eq(0).append($item);
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();
