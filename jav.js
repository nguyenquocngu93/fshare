(function () {
    'use strict';

    var API_BASE = 'https://phimapi.com';

    var categories = [
        { title: 'Phim Mới Cập Nhật', url: 'phim-moi-cap-nhat' },
        { title: 'Phim Lẻ', url: 'phim-le' },
        { title: 'Phim Bộ', url: 'phim-bo' },
        { title: 'Hoạt Hình', url: 'hoat-hinh' },
        { title: 'TV Shows', url: 'tv-shows' }
    ];

    var Img = {
        fix: function (url) {
            if (!url) return '';
            if (url.indexOf('http') === 0) return url;
            return 'https://phimimg.com/' + url;
        }
    };

    function catUrl(type, page) {
        if (type === 'phim-moi-cap-nhat') return API_BASE + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        return API_BASE + '/v1/api/danh-sach/' + type + '?page=' + page + '&limit=24';
    }

    function detailUrl(slug) {
        return API_BASE + '/phim/' + slug;
    }

    function searchUrl(q) {
        return API_BASE + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(q) + '&limit=24';
    }

    function parseItems(data) {
        if (data && data.items) return data.items;
        if (data && data.data && data.data.items) return data.data.items;
        if (Array.isArray(data)) return data;
        return [];
    }

    // =================== CSS ===================
    function addCSS() {
        if (document.getElementById('kkk-css')) return;
        var s = document.createElement('style');
        s.id = 'kkk-css';
        s.textContent = '\
.kkk-row { margin-bottom: 1.5em; }\
.kkk-row__title { display:flex; align-items:center; justify-content:space-between; padding:0 1.5em 0.5em; }\
.kkk-row__name { font-size:1.3em; font-weight:bold; color:#fff; }\
.kkk-row__more { font-size:0.85em; color:#ffaa00; cursor:pointer; padding:0.3em 0.8em; border-radius:0.3em; }\
.kkk-row__more.focus { background:rgba(255,170,0,0.3); }\
.kkk-row__scroll { display:flex; overflow-x:auto; overflow-y:hidden; gap:0.8em; padding:0 1.5em; scrollbar-width:none; -ms-overflow-style:none; }\
.kkk-row__scroll::-webkit-scrollbar { display:none; }\
.kkk-poster { flex-shrink:0; width:130px; cursor:pointer; }\
.kkk-poster.focus .kkk-poster__img-wrap { border-color:#fff; transform:scale(1.05); }\
.kkk-poster__img-wrap { position:relative; border-radius:0.6em; overflow:hidden; border:2px solid transparent; transition:all 0.2s; aspect-ratio:2/3; }\
.kkk-poster__img { width:100%; height:100%; object-fit:cover; display:block; }\
.kkk-poster__quality { position:absolute; top:4px; left:4px; background:rgba(255,140,0,0.9); color:#fff; font-size:0.6em; padding:1px 5px; border-radius:3px; font-weight:bold; }\
.kkk-poster__ep { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, rgba(0,0,0,0.85)); color:#fff; font-size:0.6em; padding:8px 4px 3px; text-align:center; }\
.kkk-poster__title { color:#fff; font-size:0.78em; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\
.kkk-poster__year { color:#666; font-size:0.68em; }\
\
.kkk-detail { position:relative; }\
.kkk-backdrop { width:100%; height:300px; object-fit:cover; display:block; }\
.kkk-backdrop-gradient { position:absolute; top:0; left:0; right:0; height:300px; background:linear-gradient(to top, #1a1a1a 0%, rgba(26,26,26,0.7) 50%, rgba(26,26,26,0.3) 100%); }\
.kkk-detail__body { position:relative; margin-top:-100px; padding:0 1.5em; z-index:2; }\
.kkk-detail__top { display:flex; gap:1.2em; }\
.kkk-detail__poster { width:140px; flex-shrink:0; }\
.kkk-detail__poster img { width:100%; border-radius:0.5em; box-shadow:0 4px 20px rgba(0,0,0,0.5); }\
.kkk-detail__info { flex:1; padding-top:10px; }\
.kkk-detail__name { font-size:1.5em; font-weight:bold; color:#fff; line-height:1.2; }\
.kkk-detail__orig { font-size:0.9em; color:#888; margin:2px 0 8px; }\
.kkk-detail__tags { display:flex; gap:0.4em; flex-wrap:wrap; margin-bottom:8px; }\
.kkk-detail__tag { background:rgba(255,255,255,0.1); color:#ccc; font-size:0.7em; padding:2px 8px; border-radius:20px; }\
.kkk-detail__tag--accent { background:rgba(255,140,0,0.25); color:#ffaa00; }\
.kkk-detail__genres { color:#777; font-size:0.78em; margin-bottom:4px; }\
.kkk-detail__countries { color:#777; font-size:0.78em; }\
\
.kkk-detail__desc { color:#aaa; font-size:0.85em; line-height:1.5; padding:1em 1.5em 0; max-height:4.5em; overflow:hidden; position:relative; }\
.kkk-detail__desc--full { max-height:none; }\
.kkk-detail__desc-toggle { color:#ffaa00; font-size:0.8em; padding:0.3em 1.5em; cursor:pointer; display:inline-block; }\
.kkk-detail__desc-toggle.focus { text-decoration:underline; }\
\
.kkk-detail__play-section { padding:1em 1.5em 0; }\
.kkk-server-title { font-size:1.1em; font-weight:bold; color:#ffaa00; margin-bottom:0.5em; }\
.kkk-ep-grid { display:flex; flex-wrap:wrap; gap:0.4em; margin-bottom:1em; }\
.kkk-ep-btn { background:rgba(255,255,255,0.08); color:#fff; padding:0.5em 1em; border-radius:0.4em; font-size:0.85em; min-width:45px; text-align:center; cursor:pointer; transition:background 0.2s; }\
.kkk-ep-btn.focus { background:#ff8c00; color:#000; font-weight:bold; }\
\
.kkk-catalog-grid { display:flex; flex-wrap:wrap; gap:0.8em; padding:0 1.5em 1em; }\
.kkk-load-more { text-align:center; padding:1.5em; }\
.kkk-load-more__btn { display:inline-block; background:rgba(255,255,255,0.08); color:#ffaa00; padding:0.6em 2em; border-radius:2em; font-size:1em; cursor:pointer; }\
.kkk-load-more__btn.focus { background:rgba(255,140,0,0.3); }\
';
        document.head.appendChild(s);
    }

    // =================== MAIN COMPONENT (Home with rows) ===================
    function KKKMainComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var network = new Lampa.Reguest();
        var created = false;
        var loadedCount = 0;

        this.create = function () {
            var _this = this;

            this.activity.loader(true);

            categories.forEach(function (cat, index) {
                _this.loadRow(cat, index);
            });
        };

        this.loadRow = function (cat, index) {
            var _this = this;
            var url = catUrl(cat.url, 1);

            network.timeout(15000);
            network.silent(url, function (data) {
                var items = parseItems(data);
                if (items.length) {
                    _this.buildRow(cat, items);
                }
                loadedCount++;
                if (loadedCount >= categories.length) {
                    _this.activity.loader(false);
                    _this.activity.toggle();
                }
            }, function () {
                loadedCount++;
                if (loadedCount >= categories.length) {
                    _this.activity.loader(false);
                    _this.activity.toggle();
                }
            });
        };

        this.buildRow = function (cat, items) {
            var _this = this;

            var row = document.createElement('div');
            row.className = 'kkk-row';

            // Title bar
            var titleBar = document.createElement('div');
            titleBar.className = 'kkk-row__title';

            var name = document.createElement('div');
            name.className = 'kkk-row__name';
            name.textContent = cat.title;
            titleBar.appendChild(name);

            var more = document.createElement('div');
            more.className = 'selector kkk-row__more';
            more.textContent = 'Xem thêm ›';
            more.addEventListener('hover:enter', function () {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkkphim_catalog',
                    page: 1
                });
            });
            titleBar.appendChild(more);

            row.appendChild(titleBar);

            // Scroll row
            var rowScroll = document.createElement('div');
            rowScroll.className = 'kkk-row__scroll';

            items.slice(0, 15).forEach(function (item) {
                var card = _this.createPoster(item);
                rowScroll.appendChild(card);
            });

            row.appendChild(rowScroll);
            scroll.append($(row));
        };

        this.createPoster = function (item) {
            var card = document.createElement('div');
            card.className = 'selector kkk-poster';

            var imgUrl = Img.fix(item.poster_url || item.thumb_url || '');
            var quality = item.quality || '';
            var epCurrent = item.episode_current || '';

            card.innerHTML =
                '<div class="kkk-poster__img-wrap">' +
                    '<img class="kkk-poster__img" src="' + imgUrl + '" onerror="this.src=\'https://via.placeholder.com/130x195?text=No+Img\'" loading="lazy" />' +
                    (quality ? '<div class="kkk-poster__quality">' + quality + '</div>' : '') +
                    (epCurrent ? '<div class="kkk-poster__ep">' + epCurrent + '</div>' : '') +
                '</div>' +
                '<div class="kkk-poster__title">' + (item.name || item.origin_name || '') + '</div>' +
                '<div class="kkk-poster__year">' + (item.year || '') + '</div>';

            card.addEventListener('hover:enter', function () {
                Lampa.Activity.push({
                    url: item.slug,
                    title: item.name || item.origin_name || '',
                    component: 'kkkphim_detail',
                    page: 1
                });
            });

            return card;
        };

        this.start = function () {
            if (created) return;
            created = true;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // =================== CATALOG COMPONENT (Grid + Load More) ===================
    function KKKCatalogComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var network = new Lampa.Reguest();
        var created = false;
        var page = 0;
        var loading = false;
        var category_url = object.url || 'phim-moi-cap-nhat';
        var gridWrap;

        this.create = function () {
            gridWrap = document.createElement('div');
            gridWrap.className = 'kkk-catalog-grid';
            scroll.append($(gridWrap));

            this.loadMore();
        };

        this.loadMore = function () {
            if (loading) return;
            loading = true;
            page++;

            var _this = this;
            if (page === 1) this.activity.loader(true);

            var url = catUrl(category_url, page);

            network.clear();
            network.timeout(15000);
            network.silent(url, function (data) {
                _this.activity.loader(false);
                loading = false;

                var items = parseItems(data);
                if (items.length) {
                    _this.appendCards(items);
                    _this.addLoadMoreBtn();
                    _this.activity.toggle();
                } else if (page === 1) {
                    _this.showEmpty();
                    _this.activity.toggle();
                }
            }, function () {
                _this.activity.loader(false);
                loading = false;
                if (page === 1) {
                    _this.showEmpty();
                    _this.activity.toggle();
                }
            });
        };

        this.appendCards = function (items) {
            var _this = this;

            // Remove old load more button
            var oldBtn = scroll.render().find('.kkk-load-more');
            if (oldBtn.length) oldBtn.remove();

            items.forEach(function (item) {
                var card = document.createElement('div');
                card.className = 'selector kkk-poster';
                card.style.width = '130px';

                var imgUrl = Img.fix(item.poster_url || item.thumb_url || '');

                card.innerHTML =
                    '<div class="kkk-poster__img-wrap">' +
                        '<img class="kkk-poster__img" src="' + imgUrl + '" onerror="this.src=\'https://via.placeholder.com/130x195?text=No+Img\'" loading="lazy" />' +
                        (item.quality ? '<div class="kkk-poster__quality">' + item.quality + '</div>' : '') +
                        (item.episode_current ? '<div class="kkk-poster__ep">' + item.episode_current + '</div>' : '') +
                    '</div>' +
                    '<div class="kkk-poster__title">' + (item.name || item.origin_name || '') + '</div>' +
                    '<div class="kkk-poster__year">' + (item.year || '') + '</div>';

                card.addEventListener('hover:enter', function () {
                    Lampa.Activity.push({
                        url: item.slug,
                        title: item.name || item.origin_name || '',
                        component: 'kkkphim_detail',
                        page: 1
                    });
                });

                gridWrap.appendChild(card);
            });
        };

        this.addLoadMoreBtn = function () {
            var _this = this;

            var wrap = document.createElement('div');
            wrap.className = 'kkk-load-more';
            wrap.style.width = '100%';

            var btn = document.createElement('div');
            btn.className = 'selector kkk-load-more__btn';
            btn.textContent = '📄 Tải thêm - Trang ' + (page + 1);

            btn.addEventListener('hover:enter', function () {
                wrap.remove();
                _this.loadMore();
            });

            wrap.appendChild(btn);
            scroll.append($(wrap));
        };

        this.showEmpty = function () {
            var e = document.createElement('div');
            e.style.cssText = 'padding:3em;color:#fff;text-align:center;font-size:1.2em;';
            e.textContent = 'Không tìm thấy phim nào';
            scroll.append($(e));
        };

        this.start = function () {
            if (created) return;
            created = true;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // =================== DETAIL COMPONENT (Backdrop style) ===================
    function KKKDetailComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var network = new Lampa.Reguest();
        var created = false;
        var slug = object.url || '';
        var descExpanded = false;

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(detailUrl(slug), function (data) {
                _this.activity.loader(false);

                if (data && data.movie) {
                    _this.buildDetail(data.movie, data.episodes || []);
                } else {
                    _this.showEmpty();
                }
                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                _this.showEmpty();
                _this.activity.toggle();
            });
        };

        this.buildDetail = function (movie, episodes) {
            var _this = this;

            var wrap = document.createElement('div');
            wrap.className = 'kkk-detail';

            var backdropUrl = Img.fix(movie.thumb_url || movie.poster_url || '');
            var posterUrl = Img.fix(movie.poster_url || movie.thumb_url || '');

            // Backdrop
            wrap.innerHTML =
                '<img class="kkk-backdrop" src="' + backdropUrl + '" onerror="this.style.height=\'150px\';this.style.background=\'#333\';" />' +
                '<div class="kkk-backdrop-gradient"></div>';

            // Body
            var body = document.createElement('div');
            body.className = 'kkk-detail__body';

            // Top section: poster + info
            var top = document.createElement('div');
            top.className = 'kkk-detail__top';

            // Tags
            var tagsHtml = '';
            var tagItems = [];
            if (movie.quality) tagItems.push({ text: movie.quality, accent: true });
            if (movie.lang) tagItems.push({ text: movie.lang, accent: false });
            if (movie.year) tagItems.push({ text: movie.year, accent: false });
            if (movie.episode_current) tagItems.push({ text: movie.episode_current, accent: true });
            if (movie.time) tagItems.push({ text: movie.time, accent: false });

            tagItems.forEach(function (t) {
                tagsHtml += '<span class="kkk-detail__tag' + (t.accent ? ' kkk-detail__tag--accent' : '') + '">' + t.text + '</span>';
            });

            var genresText = (movie.category || []).map(function (c) { return c.name; }).join(', ');
            var countriesText = (movie.country || []).map(function (c) { return c.name; }).join(', ');

            top.innerHTML =
                '<div class="kkk-detail__poster">' +
                    '<img src="' + posterUrl + '" onerror="this.src=\'https://via.placeholder.com/140x210?text=No+Img\'" />' +
                '</div>' +
                '<div class="kkk-detail__info">' +
                    '<div class="kkk-detail__name">' + (movie.name || '') + '</div>' +
                    '<div class="kkk-detail__orig">' + (movie.origin_name || '') + '</div>' +
                    '<div class="kkk-detail__tags">' + tagsHtml + '</div>' +
                    (genresText ? '<div class="kkk-detail__genres">🎭 ' + genresText + '</div>' : '') +
                    (countriesText ? '<div class="kkk-detail__countries">🌍 ' + countriesText + '</div>' : '') +
                '</div>';

            body.appendChild(top);
            wrap.appendChild(body);

            scroll.append($(wrap));

            // Description (collapsible)
            var desc = (movie.content || '').replace(/<[^>]*>/g, '').trim();
            if (desc) {
                var descEl = document.createElement('div');
                descEl.className = 'kkk-detail__desc';
                descEl.textContent = desc;
                scroll.append($(descEl));

                if (desc.length > 150) {
                    var toggle = document.createElement('div');
                    toggle.className = 'selector kkk-detail__desc-toggle';
                    toggle.textContent = '▼ Xem thêm mô tả';

                    toggle.addEventListener('hover:enter', function () {
                        descExpanded = !descExpanded;
                        if (descExpanded) {
                            descEl.classList.add('kkk-detail__desc--full');
                            toggle.textContent = '▲ Thu gọn';
                        } else {
                            descEl.classList.remove('kkk-detail__desc--full');
                            toggle.textContent = '▼ Xem thêm mô tả';
                        }
                    });

                    scroll.append($(toggle));
                }
            }

            // Episodes section
            if (episodes && episodes.length) {
                var playSection = document.createElement('div');
                playSection.className = 'kkk-detail__play-section';

                var playTitle = document.createElement('div');
                playTitle.style.cssText = 'font-size:1.2em;font-weight:bold;color:#fff;margin-bottom:0.8em;';
                playTitle.textContent = '🎬 Danh sách phát';
                playSection.appendChild(playTitle);

                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;

                    var serverTitle = document.createElement('div');
                    serverTitle.className = 'kkk-server-title';
                    serverTitle.textContent = '▶ ' + (server.server_name || 'Server');
                    playSection.appendChild(serverTitle);

                    var epGrid = document.createElement('div');
                    epGrid.className = 'kkk-ep-grid';

                    server.server_data.forEach(function (ep, epIndex) {
                        var btn = document.createElement('div');
                        btn.className = 'selector kkk-ep-btn';
                        btn.textContent = ep.name || ep.slug || ('Tập ' + (epIndex + 1));

                        btn.addEventListener('hover:enter', function () {
                            _this.playEp(ep, movie, server.server_data, epIndex);
                        });

                        epGrid.appendChild(btn);
                    });

                    playSection.appendChild(epGrid);
                });

                scroll.append($(playSection));
            }
        };

        this.playEp = function (ep, movie, allEps, currentIndex) {
            var url = ep.link_m3u8 || ep.link_embed || '';

            if (!url) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            if (url.indexOf('.m3u8') !== -1) {
                // Build playlist
                var playlist = [];

                allEps.forEach(function (e, i) {
                    var epUrl = e.link_m3u8 || '';
                    if (epUrl) {
                        playlist.push({
                            title: (movie.name || 'KKKPhim') + ' - ' + (e.name || ('Tập ' + (i + 1))),
                            url: epUrl,
                            quality: { 'auto': epUrl },
                            timeline: Lampa.Timeline.view({})
                        });
                    }
                });

                // Find current index in playlist
                var playIndex = 0;
                for (var i = 0; i < playlist.length; i++) {
                    if (playlist[i].url === url) {
                        playIndex = i;
                        break;
                    }
                }

                if (playlist.length > 0) {
                    Lampa.Player.play(playlist[playIndex]);
                    Lampa.Player.playlist(playlist);
                } else {
                    // Fallback single play
                    var single = {
                        title: (movie.name || 'KKKPhim') + ' - ' + (ep.name || ''),
                        url: url,
                        quality: { 'auto': url },
                        timeline: Lampa.Timeline.view({})
                    };
                    Lampa.Player.play(single);
                    Lampa.Player.playlist([single]);
                }
            } else {
                Lampa.Noty.show('Link embed không hỗ trợ phát trực tiếp');
            }
        };

        this.showEmpty = function () {
            var e = document.createElement('div');
            e.style.cssText = 'padding:3em;color:#fff;text-align:center;font-size:1.2em;';
            e.textContent = 'Không tải được thông tin phim';
            scroll.append($(e));
        };

        this.start = function () {
            if (created) return;
            created = true;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // =================== INIT ===================
    function initPlugin() {
        addCSS();

        Lampa.Component.add('kkkphim_main', KKKMainComponent);
        Lampa.Component.add('kkkphim_catalog', KKKCatalogComponent);
        Lampa.Component.add('kkkphim_detail', KKKDetailComponent);

        // Menu icon
        var ico = [
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
            '<rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>',
            '<polygon points="10,8 16,12 10,16" fill="currentColor"/>',
            '</svg>'
        ].join('');

        var menuItem = $([
            '<li class="menu__item selector" data-action="kkkphim">',
                '<div class="menu__ico">' + ico + '</div>',
                '<div class="menu__text">KKKPhim</div>',
            '</li>'
        ].join(''));

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKKPhim',
                component: 'kkkphim_main',
                page: 1
            });
        });

        // Add to menu
        var $menu = $('.menu .menu__list');
        if ($menu.length) $menu.eq(0).append(menuItem);

        Lampa.Noty.show('✅ KKKPhim đã sẵn sàng!');
    }

    // =================== BOOT ===================
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initPlugin();
        });
    }

})();